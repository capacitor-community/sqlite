/**
 * The result-shape contract from PLAN 6.3, which the rest of the plugin depends on:
 * plain row objects, `Uint8Array` for BLOBs, and int64 as BigInt.
 */
import { describe, expect, test } from 'vitest';

import { CapacitorSQLiteWeb } from '../../src/web';

import { TIERS, startHarness, tierLabel } from './harness';

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: BLOBs stay Uint8Array in and out, byte for byte`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('blobs', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE b (id INTEGER PRIMARY KEY NOT NULL, name TEXT, payload BLOB);');

    for (const size of [0, 1, 15, 512, 65536]) {
      const source = new Uint8Array(size);
      crypto.getRandomValues(source);
      await db.run('INSERT INTO b (name, payload) VALUES (?, ?)', [`s${size}`, source]);

      const rows = await db.query(
        'SELECT payload, length(payload) AS len, typeof(payload) AS t FROM b WHERE name = ?',
        [`s${size}`],
      );
      const row = rows.values?.[0];
      expect(row.t).toBe('blob');
      expect(row.len).toBe(size);
      expect(row.payload).toBeInstanceOf(Uint8Array);
      expect(Array.from(row.payload as Uint8Array)).toEqual(Array.from(source));
    }

    await sqlite.closeConnection('blobs', false);
  });

  test(`${label}: rows are plain objects and reorderRows leaves them alone`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('shapes', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute("CREATE TABLE t (a INTEGER, b TEXT, c REAL, d BLOB); INSERT INTO t VALUES (1, 'x', 2.5, NULL);");

    const rows = await db.query('SELECT a, b, c, d FROM t');
    const row = rows.values?.[0];
    // reorderRows only rewrites a result whose first row carries the iOS `ios_columns` key.
    // Web must never produce that, so the helper has to be a no-op here.
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    expect(Object.keys(row)).toEqual(['a', 'b', 'c', 'd']);
    expect(row).toEqual({ a: 1, b: 'x', c: 2.5, d: null });
    expect(rows.values?.some((r: any) => 'ios_columns' in r)).toBe(false);

    // And directly against the helper the wrapper runs every query through: given web results
    // it has to hand back the identical object, not a rebuilt one.
    const reorderRows = (db as any).reorderRows.bind(db);
    const before = { values: [{ a: 1, b: 'x' }] };
    const after = await reorderRows(before);
    expect(after).toBe(before);
    expect(after.values).toEqual([{ a: 1, b: 'x' }]);

    // Contrast: an iOS-shaped result is the only thing it rewrites.
    const iosShaped = { values: [{ ios_columns: ['b', 'a'] }, { a: 1, b: 'x' }] };
    const iosResult = await reorderRows(iosShaped);
    expect(iosResult.values).toEqual([{ b: 'x', a: 1 }]);

    await sqlite.closeConnection('shapes', false);
  });

  test(`${label}: int64 above 2^53 round-trips as BigInt without losing precision`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('bigints', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v INTEGER);');

    const big = 9007199254740993n; // 2^53 + 1, not representable as a JS number
    await db.run('INSERT INTO t (v) VALUES (?)', [big]);
    await db.run('INSERT INTO t (v) VALUES (?)', [42]);

    const rows = await db.query('SELECT v, typeof(v) AS t FROM t ORDER BY id');
    expect(rows.values?.[0].t).toBe('integer');
    expect(typeof rows.values?.[0].v).toBe('bigint');
    expect(rows.values?.[0].v).toBe(big);
    // Small integers still come back as plain numbers, so ordinary code is unaffected.
    expect(typeof rows.values?.[1].v).toBe('number');
    expect(rows.values?.[1].v).toBe(42);

    // Documented consequence: JSON.stringify cannot serialise this, which is why the M2
    // exportToJson port has to be BigInt-aware.
    expect(() => JSON.stringify(rows.values)).toThrow(TypeError);

    await sqlite.closeConnection('bigints', false);
  });

  test(`${label}: undefined bind values become NULL rather than throwing`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('undef', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (a TEXT, b TEXT);');
    await db.run('INSERT INTO t (a, b) VALUES (?, ?)', ['set', undefined]);
    const rows = await db.query('SELECT a, b FROM t');
    expect(rows.values?.[0]).toEqual({ a: 'set', b: null });
    await sqlite.closeConnection('undef', false);
  });

  test(`${label}: errors keep their message instead of being stringified`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('errors', false, 'no-encryption', 1, false);
    await db.open();
    await expect(db.query('SELECT * FROM nope')).rejects.toThrow(/no such table: nope/);
    // The jeep facade produced "Error: Error: ..." here by interpolating the Error itself.
    await db.query('SELECT 1 AS ok').catch(() => undefined);
    try {
      await db.query('SELECT * FROM nope');
      throw new Error('expected a rejection');
    } catch (err) {
      expect((err as Error).message.startsWith('Error:')).toBe(false);
    }
    await sqlite.closeConnection('errors', false);
  });
});

test('the facade is a WebPlugin and implements the plugin surface', async () => {
  const plugin = new CapacitorSQLiteWeb();
  for (const method of ['initWebStore', 'createConnection', 'open', 'query', 'run', 'execute', 'executeSet']) {
    expect(typeof (plugin as any)[method]).toBe('function');
  }
});
