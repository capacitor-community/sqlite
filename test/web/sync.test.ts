/**
 * Sync tables and the soft-delete convention (PLAN 2.4).
 *
 * A database opts in by giving its tables both `last_modified` and `sql_deleted`. From then on
 * a DELETE marks the row instead of removing it, so the next export can tell the server about
 * it, and `deleteExportedRows` is what finally removes rows a completed export already carried.
 */
import { describe, expect, test } from 'vitest';

import { extractTableName, extractWhereClause, softDeleteRewrite } from '../../src/web/worker/statements';

import { TIERS, startHarness, tierLabel } from './harness';

const SYNC_SCHEMA = `
  CREATE TABLE items (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    last_modified INTEGER DEFAULT (strftime('%s','now')),
    sql_deleted BOOLEAN DEFAULT 0
  );`;

describe('soft-delete rewrite (unit)', () => {
  test('leaves statements alone when the database does not participate', () => {
    expect(softDeleteRewrite('DELETE FROM t WHERE id = 1', false)).toBe('DELETE FROM t WHERE id = 1');
  });

  test('rewrites a DELETE into a guarded UPDATE', () => {
    expect(softDeleteRewrite('DELETE FROM items WHERE id = 3;', true)).toBe(
      'UPDATE items SET sql_deleted = 1 WHERE (id = 3) AND sql_deleted = 0;',
    );
  });

  test('only touches DELETE', () => {
    for (const sql of ['SELECT * FROM items', 'UPDATE items SET name = ?', 'INSERT INTO items VALUES (1)']) {
      expect(softDeleteRewrite(sql, true)).toBe(sql);
    }
  });

  test('a DELETE with no WHERE clause is an error rather than a silent full-table update', () => {
    expect(() => softDeleteRewrite('DELETE FROM items', true)).toThrow(/WHERE/i);
  });

  test('table and where extraction ignore string literals', () => {
    expect(extractTableName("DELETE FROM items WHERE name = 'DELETE FROM other'")).toBe('items');
    // The literal is blanked before matching, so ORDER BY still terminates the clause.
    expect(extractWhereClause('DELETE FROM items WHERE id = 4 ORDER BY id')).toBe('id = 4');
  });

  test('the clause keeps its literals, and a WHERE inside one is not mistaken for the real one', () => {
    // Blanking the literal to find the keyword is right; returning the blanked text is not. This
    // used to yield "name =", which rewrites to SQL that does not parse.
    expect(extractWhereClause("DELETE FROM items WHERE name = 'bob'")).toBe("name = 'bob'");
    expect(softDeleteRewrite("DELETE FROM items WHERE name = 'bob';", true)).toBe(
      "UPDATE items SET sql_deleted = 1 WHERE (name = 'bob') AND sql_deleted = 0;",
    );
    // A literal containing the keyword must not become the clause.
    expect(extractWhereClause("DELETE FROM items WHERE note = 'WHERE id = 1' AND id = 2")).toBe(
      "note = 'WHERE id = 1' AND id = 2",
    );
    // Comments are blanked in place, so what follows them is still found at the right offset.
    expect(extractWhereClause('DELETE FROM items /* drop it */ WHERE id = 7')).toBe('id = 7');
  });

  test('a quoted table name is the table, not the next keyword', () => {
    // stripNoise blanks double-quoted identifiers along with string literals, so a greedy match
    // over the blanked copy read straight past the name: this returned "WHERE", the rewrite
    // targeted a table of that name, and the soft delete silently became a real one.
    expect(extractTableName('DELETE FROM "order" WHERE id = ?')).toBe('"order"');
    expect(extractTableName('DELETE FROM [order] WHERE id = ?')).toBe('[order]');
    expect(extractTableName('DELETE  FROM   items   WHERE id = ?')).toBe('items');
    expect(softDeleteRewrite('DELETE FROM "order" WHERE id = ?', true)).toBe(
      'UPDATE "order" SET sql_deleted = 1 WHERE (id = ?) AND sql_deleted = 0;',
    );
  });

  test('the clause is bracketed, because AND binds tighter than OR', () => {
    // Unbracketed, this reads as `id = 1 OR (id = 2 AND sql_deleted = 0)`: the guard covers only
    // the last disjunct, so a repeated delete marks row 1 again and bumps its last_modified.
    expect(softDeleteRewrite('DELETE FROM items WHERE id = 1 OR id = 2', true)).toBe(
      'UPDATE items SET sql_deleted = 1 WHERE (id = 1 OR id = 2) AND sql_deleted = 0;',
    );
  });

  test('RETURNING survives the rewrite instead of ending up inside the WHERE clause', () => {
    expect(extractWhereClause('DELETE FROM items WHERE id = 1 RETURNING *')).toBe('id = 1');
    expect(softDeleteRewrite('DELETE FROM items WHERE id = 1 RETURNING *', true)).toBe(
      'UPDATE items SET sql_deleted = 1 WHERE (id = 1) AND sql_deleted = 0 RETURNING *;',
    );
  });
});

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  async function seeded(sqlite: any, name: string) {
    const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
    await db.open();
    await db.execute(SYNC_SCHEMA);
    await db.execute("INSERT INTO items (id, name) VALUES (1, 'one'), (2, 'two'), (3, 'three');");
    return db;
  }

  test(`${label}: createSyncTable requires the sync columns`, async () => {
    const { sqlite } = await startHarness(tier);
    const plain = await sqlite.createConnection('plain', false, 'no-encryption', 1, false);
    await plain.open();
    await plain.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');
    await expect(plain.createSyncTable()).rejects.toThrow(/last_modified\/sql_deleted/i);
    await sqlite.closeConnection('plain', false);
  });

  test(`${label}: createSyncTable is idempotent and sets a sync date`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'syncdb');
    const first = await db.createSyncTable();
    expect(first.changes?.changes).toBeGreaterThan(0);
    const second = await db.createSyncTable();
    expect(second.changes?.changes).toBe(0);

    // The wrapper hands back an ISO string, not the raw seconds the plugin returns.
    const date = await db.getSyncDate();
    expect(typeof date).toBe('string');
    expect(Date.parse(date)).toBeGreaterThan(0);
    await sqlite.closeConnection('syncdb', false);
  });

  test(`${label}: setSyncDate and getSyncDate round trip`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'syncdate');
    await db.createSyncTable();
    await db.setSyncDate('2026-01-02T03:04:05.000Z');
    const date = await db.getSyncDate();
    expect(date).toBe('2026-01-02T03:04:05.000Z');
    await sqlite.closeConnection('syncdate', false);
  });

  test(`${label}: DELETE soft-deletes once the sync columns exist`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'softdel');
    await db.createSyncTable();

    const deleted = await db.run('DELETE FROM items WHERE id = ?', [2]);
    expect(deleted.changes?.changes).toBe(1);

    // The row is still there, marked.
    const all = await db.query('SELECT id, sql_deleted FROM items ORDER BY id');
    expect(all.values).toEqual([
      { id: 1, sql_deleted: 0 },
      { id: 2, sql_deleted: 1 },
      { id: 3, sql_deleted: 0 },
    ]);

    // And deleting it again is a no-op rather than churning last_modified.
    const again = await db.run('DELETE FROM items WHERE id = ?', [2]);
    expect(again.changes?.changes).toBe(0);
    await sqlite.closeConnection('softdel', false);
  });

  test(`${label}: a database without the sync columns still hard-deletes`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('harddel', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');
    await db.execute("INSERT INTO t (id, v) VALUES (1, 'a'), (2, 'b');");
    await db.run('DELETE FROM t WHERE id = ?', [1]);
    const rows = await db.query('SELECT id FROM t');
    expect(rows.values).toEqual([{ id: 2 }]);
    await sqlite.closeConnection('harddel', false);
  });

  test(`${label}: deleteExportedRows physically removes what an export carried away`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'exported');
    await db.createSyncTable();
    await db.run('DELETE FROM items WHERE id = ?', [2]);
    expect((await db.query('SELECT count(*) AS n FROM items')).values?.[0].n).toBe(3);

    // Without an export there is no last-export date, so there is nothing to reclaim.
    await expect(db.deleteExportedRows()).rejects.toThrow(/no last exported date/i);

    // Exporting stamps sync_table id 2, which is what makes the rows reclaimable. The stamp has
    // to be strictly newer than the rows' last_modified, hence the explicit backdate.
    await db.execute('UPDATE items SET last_modified = 1 WHERE id = 2;');
    await db.exportToJson('full');

    await db.deleteExportedRows();
    const rows = await db.query('SELECT id FROM items ORDER BY id');
    expect(rows.values).toEqual([{ id: 1 }, { id: 3 }]);
    await sqlite.closeConnection('exported', false);
  });

  test(`${label}: partial export carries only rows modified since the sync date`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'partialexp');
    await db.createSyncTable();
    // Backdate everything, then move the sync date between the old rows and a new one.
    await db.execute('UPDATE items SET last_modified = 1000;');
    await db.setSyncDate(new Date(2000 * 1000).toISOString());
    await db.run('INSERT INTO items (id, name, last_modified) VALUES (?, ?, ?)', [4, 'four', 3000]);

    const exported = (await db.exportToJson('partial')).export as any;
    expect(exported.mode).toBe('partial');
    const table = exported.tables.find((t: any) => t.name === 'items');
    expect(table.values.map((row: any[]) => row[0])).toEqual([4]);
    await sqlite.closeConnection('partialexp', false);
  });

  test(`${label}: sync_table is not itself exported`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await seeded(sqlite, 'nosynctable');
    await db.createSyncTable();
    const exported = (await db.exportToJson('full')).export as any;
    expect(exported.tables.map((t: any) => t.name)).not.toContain('sync_table');
    await sqlite.closeConnection('nosynctable', false);
  });

  test(`${label}: an importFromJson row marked sql_deleted deletes the local row`, async () => {
    const { sqlite } = await startHarness(tier);
    await seeded(sqlite, 'importdel');
    await sqlite.closeConnection('importdel', false);

    const payload = {
      database: 'importdel',
      version: 1,
      encrypted: false,
      mode: 'partial',
      tables: [
        {
          name: 'items',
          schema: [
            { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
            { column: 'name', value: 'TEXT NOT NULL' },
            { column: 'last_modified', value: "INTEGER DEFAULT (strftime('%s','now'))" },
            { column: 'sql_deleted', value: 'BOOLEAN DEFAULT 0' },
          ],
          values: [[3, 'three', 1234, 1]],
        },
      ],
    };
    await sqlite.importFromJson(JSON.stringify(payload));

    const again = await sqlite.createConnection('importdel', false, 'no-encryption', 1, false);
    await again.open();
    const rows = await again.query('SELECT id FROM items ORDER BY id');
    expect(rows.values).toEqual([{ id: 1 }, { id: 2 }]);
    await sqlite.closeConnection('importdel', false);
  });
});
