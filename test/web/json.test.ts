/**
 * The JSON pipeline: isJsonValid, importFromJson, exportToJson, and the two progress events.
 *
 * The int64 round trip is the one that matters most for web specifically. sqlite-wasm returns
 * values above 2^53 as BigInt and `JSON.stringify` throws on those, so an export that did not
 * handle it would produce an object the caller cannot serialise, and a naive Number() cast would
 * silently corrupt exactly the values BigInt exists to protect.
 */
import { describe, expect, test } from 'vitest';

import { TIERS, startHarness, tierLabel } from './harness';

const SCHEMA = [
  { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
  { column: 'name', value: 'TEXT NOT NULL' },
  { column: 'size', value: 'INTEGER' },
];

function payload(overrides: any = {}) {
  return {
    database: 'jsondb',
    version: 1,
    encrypted: false,
    mode: 'full',
    tables: [
      {
        name: 'items',
        schema: SCHEMA,
        indexes: [{ name: 'items_name', value: 'name' }],
        values: [
          [1, 'alpha', 10],
          [2, 'beta', 20],
        ],
      },
    ],
    ...overrides,
  };
}

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: isJsonValid accepts a good object and rejects bad ones`, async () => {
    const { sqlite } = await startHarness(tier);
    expect((await sqlite.isJsonValid(JSON.stringify(payload()))).result).toBe(true);
    // An unknown key anywhere invalidates the whole object; that is the documented contract.
    expect((await sqlite.isJsonValid(JSON.stringify(payload({ nonsense: 1 })))).result).toBe(false);
    expect((await sqlite.isJsonValid(JSON.stringify({ database: 'x' }))).result).toBe(true);
    expect((await sqlite.isJsonValid(JSON.stringify({ database: 42 }))).result).toBe(false);
    expect((await sqlite.isJsonValid('not json at all')).result).toBe(false);
    // A value row narrower than the schema is rejected.
    const short = payload();
    short.tables[0].values = [[1, 'alpha']] as any;
    expect((await sqlite.isJsonValid(JSON.stringify(short))).result).toBe(false);
  });

  test(`${label}: importFromJson creates schema, indexes and data`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const progress: string[] = [];
    await plugin.addListener('sqliteImportProgressEvent', (e: any) => progress.push(e.progress));

    const result = await sqlite.importFromJson(JSON.stringify(payload()));
    expect(result.changes?.changes).toBeGreaterThan(0);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.some((p) => /Import completed/i.test(p))).toBe(true);

    const db = await sqlite.createConnection('jsondb', false, 'no-encryption', 1, false);
    await db.open();
    const rows = await db.query('SELECT id, name, size FROM items ORDER BY id');
    expect(rows.values).toEqual([
      { id: 1, name: 'alpha', size: 10 },
      { id: 2, name: 'beta', size: 20 },
    ]);
    expect((await db.getVersion()).version).toBe(1);
    const indexes = await db.query("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'items_name'");
    expect(indexes.values?.length).toBe(1);
    await sqlite.closeConnection('jsondb', false);
  });

  test(`${label}: partial mode inserts new rows and updates existing ones`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.importFromJson(JSON.stringify(payload()));

    const partial = payload({
      mode: 'partial',
      tables: [
        {
          name: 'items',
          schema: SCHEMA,
          values: [
            [2, 'beta renamed', 22],
            [3, 'gamma', 30],
          ],
        },
      ],
    });
    await sqlite.importFromJson(JSON.stringify(partial));

    const db = await sqlite.createConnection('jsondb', false, 'no-encryption', 1, false);
    await db.open();
    const rows = await db.query('SELECT id, name, size FROM items ORDER BY id');
    expect(rows.values).toEqual([
      { id: 1, name: 'alpha', size: 10 },
      { id: 2, name: 'beta renamed', size: 22 },
      { id: 3, name: 'gamma', size: 30 },
    ]);
    await sqlite.closeConnection('jsondb', false);
  });

  test(`${label}: re-importing an unchanged partial payload reports no changes`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.importFromJson(JSON.stringify(payload()));
    const same = payload({ mode: 'partial' });
    const result = await sqlite.importFromJson(JSON.stringify(same));
    expect(result.changes?.changes).toBe(0);
  });

  test(`${label}: exportToJson full round trip through a fresh database`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const progress: string[] = [];
    await plugin.addListener('sqliteExportProgressEvent', (e: any) => progress.push(e.progress));

    await sqlite.importFromJson(JSON.stringify(payload()));
    const db = await sqlite.createConnection('jsondb', false, 'no-encryption', 1, false);
    await db.open();
    const exported = await db.exportToJson('full');
    expect(progress.length).toBeGreaterThan(0);

    const json = exported.export as any;
    expect(json.database).toBe('jsondb');
    expect(json.mode).toBe('full');
    expect(json.version).toBe(1);
    const table = json.tables.find((t: any) => t.name === 'items');
    expect(table.values).toEqual([
      [1, 'alpha', 10],
      [2, 'beta', 20],
    ]);
    expect(table.schema.map((c: any) => c.column)).toEqual(['id', 'name', 'size']);
    expect(table.indexes.map((i: any) => i.name)).toEqual(['items_name']);
    // The whole point of the exercise: the caller can serialise what they were handed.
    expect(() => JSON.stringify(exported.export)).not.toThrow();
    await sqlite.closeConnection('jsondb', false);

    // And it re-imports into an empty database as the same data.
    const reimport = { ...json, database: 'jsonrt', overwrite: true };
    await sqlite.importFromJson(JSON.stringify(reimport));
    const copy = await sqlite.createConnection('jsonrt', false, 'no-encryption', 1, false);
    await copy.open();
    const rows = await copy.query('SELECT id, name, size FROM items ORDER BY id');
    expect(rows.values).toEqual([
      { id: 1, name: 'alpha', size: 10 },
      { id: 2, name: 'beta', size: 20 },
    ]);
    await sqlite.closeConnection('jsonrt', false);
  });

  test(`${label}: int64 above 2^53 survives export and re-import without precision loss`, async () => {
    const { sqlite } = await startHarness(tier);
    const big = 9007199254740993n; // 2^53 + 1
    const db = await sqlite.createConnection('bigjson', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE nums (id INTEGER PRIMARY KEY NOT NULL, v INTEGER);');
    await db.run('INSERT INTO nums (id, v) VALUES (?, ?)', [1, big]);
    await db.run('INSERT INTO nums (id, v) VALUES (?, ?)', [2, 42]);
    expect((await db.query('SELECT v FROM nums WHERE id = 1')).values?.[0].v).toBe(big);

    const exported = await db.exportToJson('full');
    const json = exported.export as any;
    // BigInt cannot be serialised, so the exporter hands back the decimal string. A Number cast
    // would have produced 9007199254740992 and lost the value silently.
    const table = json.tables.find((t: any) => t.name === 'nums');
    expect(table.values).toEqual([
      [1, '9007199254740993'],
      [2, 42],
    ]);
    const serialised = JSON.stringify(exported.export);
    expect(serialised).toContain('9007199254740993');
    await sqlite.closeConnection('bigjson', false);

    // SQLite's INTEGER affinity turns that string back into the identical int64.
    await sqlite.importFromJson(JSON.stringify({ ...json, database: 'bigjson2', overwrite: true }));
    const copy = await sqlite.createConnection('bigjson2', false, 'no-encryption', 1, false);
    await copy.open();
    const back = await copy.query('SELECT v, typeof(v) AS t FROM nums ORDER BY id');
    expect(back.values?.[0].t).toBe('integer');
    expect(back.values?.[0].v).toBe(big);
    expect(back.values?.[1].v).toBe(42);
    await sqlite.closeConnection('bigjson2', false);
  });

  test(`${label}: BLOBs round trip through JSON as number arrays`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('blobjson', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE b (id INTEGER PRIMARY KEY NOT NULL, payload BLOB);');
    await db.run('INSERT INTO b (id, payload) VALUES (?, ?)', [1, new Uint8Array([1, 2, 250])]);
    const exported = await db.exportToJson('full');
    await sqlite.closeConnection('blobjson', false);

    const json = exported.export as any;
    const table = json.tables.find((t: any) => t.name === 'b');
    // Uint8Array serialises to an object with numeric keys, which is what the importer revives.
    const asArray = Array.from(Object.values(table.values[0][1] as any));
    expect(asArray).toEqual([1, 2, 250]);

    table.values[0][1] = asArray;
    await sqlite.importFromJson(JSON.stringify({ ...json, database: 'blobjson2', overwrite: true }));
    const copy = await sqlite.createConnection('blobjson2', false, 'no-encryption', 1, false);
    await copy.open();
    const back = await copy.query('SELECT payload FROM b');
    expect(back.values?.[0].payload).toBeInstanceOf(Uint8Array);
    expect(Array.from(back.values?.[0].payload as Uint8Array)).toEqual([1, 2, 250]);
    await sqlite.closeConnection('blobjson2', false);
  });

  test(`${label}: views survive the round trip`, async () => {
    const { sqlite } = await startHarness(tier);
    const withView = payload({ views: [{ name: 'big_items', value: 'SELECT * FROM items WHERE size > 15' }] });
    await sqlite.importFromJson(JSON.stringify(withView));
    const db = await sqlite.createConnection('jsondb', false, 'no-encryption', 1, false);
    await db.open();
    const rows = await db.query('SELECT name FROM big_items');
    expect(rows.values).toEqual([{ name: 'beta' }]);
    const exported = (await db.exportToJson('full')).export as any;
    expect(exported.views.map((v: any) => v.name)).toEqual(['big_items']);
    await sqlite.closeConnection('jsondb', false);
  });

  test(`${label}: an encrypted payload is refused rather than half-imported`, async () => {
    const { sqlite } = await startHarness(tier);
    await expect(sqlite.importFromJson(JSON.stringify(payload({ encrypted: true })))).rejects.toThrow(
      /not supported on the web platform/i,
    );
  });

  test(`${label}: importing a lower version than the database holds is refused`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.importFromJson(JSON.stringify(payload({ version: 3 })));
    await expect(sqlite.importFromJson(JSON.stringify(payload({ version: 2 })))).rejects.toThrow(
      /Cannot import a version lower than 3/i,
    );
  });

  test(`${label}: exportToJson refuses partial mode without a sync table`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.importFromJson(JSON.stringify(payload()));
    const db = await sqlite.createConnection('jsondb', false, 'no-encryption', 1, false);
    await db.open();
    await expect(db.exportToJson('partial')).rejects.toThrow(/No sync_table available/i);
    await sqlite.closeConnection('jsondb', false);
  });
});
