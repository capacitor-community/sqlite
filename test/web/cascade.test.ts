/**
 * Foreign-key propagation for the soft delete (PLAN 13.4).
 *
 * The gap this closes is silent: without propagation a deleted parent is marked and its children
 * are not, so the next export tells the server the parent is gone while still reporting the
 * children live. The last test in the CASCADE block is the one that proves that divergence dead;
 * the rest establish that each `ON DELETE` action means what the schema says it means.
 */
import { describe, expect, test } from 'vitest';

import { resolveTableName } from '../../src/web/worker/cascade';

import { TIERS, startHarness, tierLabel } from './harness';

describe('table names as the caller wrote them', () => {
  test.each([
    ['items', 'items'],
    ['main.items', 'items'],
    ['"my table"', 'my table'],
    ['[items]', 'items'],
    ['`items`', 'items'],
  ])('%s resolves to %s', (raw, expected) => {
    expect(resolveTableName(raw)).toBe(expected);
  });

  test('an attached database is refused rather than silently skipped', () => {
    expect(() => resolveTableName('other.items')).toThrow(/attached database/i);
  });
});

/** Columns every sync-tracked table needs, plus the trigger convention the docs describe. */
const SYNC_COLUMNS = `last_modified INTEGER DEFAULT (strftime('%s','now')), sql_deleted BOOLEAN DEFAULT 0`;

const TREE_SCHEMA = `
  CREATE TABLE parents (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    ${SYNC_COLUMNS}
  );
  CREATE TABLE children (
    id INTEGER PRIMARY KEY NOT NULL,
    parent_id INTEGER,
    name TEXT NOT NULL,
    ${SYNC_COLUMNS},
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
  );
  CREATE TABLE grandchildren (
    id INTEGER PRIMARY KEY NOT NULL,
    child_id INTEGER,
    name TEXT NOT NULL,
    ${SYNC_COLUMNS},
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
  );`;

const TREE_ROWS = `
  INSERT INTO parents (id, name) VALUES (1, 'keep'), (2, 'drop');
  INSERT INTO children (id, parent_id, name) VALUES (10, 1, 'keep-a'), (20, 2, 'drop-a'), (21, 2, 'drop-b');
  INSERT INTO grandchildren (id, child_id, name) VALUES (100, 10, 'keep-x'), (200, 20, 'drop-x'), (210, 21, 'drop-y');`;

async function open(sqlite: any, name: string, schema: string, rows?: string) {
  const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  await db.execute(schema);
  if (rows) await db.execute(rows);
  return db;
}

/** id -> sql_deleted, so an assertion can talk about the whole table at once. */
async function marks(db: any, table: string): Promise<Record<number, number>> {
  const rows = await db.query(`SELECT id, sql_deleted FROM ${table} ORDER BY id`);
  const out: Record<number, number> = {};
  for (const row of rows.values ?? []) out[Number(row.id)] = Number(row.sql_deleted);
  return out;
}

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: CASCADE marks children and grandchildren, and spares the other branch`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'casc', TREE_SCHEMA, TREE_ROWS);

    await db.run('DELETE FROM parents WHERE id = ?', [2]);

    expect(await marks(db, 'parents')).toEqual({ 1: 0, 2: 1 });
    expect(await marks(db, 'children')).toEqual({ 10: 0, 20: 1, 21: 1 });
    expect(await marks(db, 'grandchildren')).toEqual({ 100: 0, 200: 1, 210: 1 });

    // Nothing was physically removed: a soft delete is a marking, at every level.
    const counts = await db.query(
      'SELECT (SELECT count(*) FROM parents) AS p, (SELECT count(*) FROM children) AS c,' +
        ' (SELECT count(*) FROM grandchildren) AS g',
    );
    expect(counts.values?.[0]).toEqual({ p: 2, c: 3, g: 3 });
    await sqlite.closeConnection('casc', false);
  });

  test(`${label}: exportToJson reports a cascaded delete consistently at every level`, async () => {
    // PLAN 13.4's scenario. Before the cascade existed, this export said the parent was deleted
    // and its children were live, and the server had no way to notice.
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'cascexp', TREE_SCHEMA, TREE_ROWS);
    await db.createSyncTable();
    await db.run('DELETE FROM parents WHERE id = ?', [2]);

    const exported = await db.exportToJson('full');
    const tables = Object.fromEntries((exported.export?.tables ?? []).map((t: any) => [t.name, t.values ?? []]));

    const deletedOf = (table: string, id: number) => {
      const row = tables[table].find((values: any[]) => Number(values[0]) === id);
      const schema: any[] = (exported.export?.tables ?? []).find((t: any) => t.name === table).schema ?? [];
      const index = schema.findIndex((column: any) => column.column === 'sql_deleted');
      return Number(row[index]);
    };

    // The parent and its whole subtree agree: all gone.
    expect(deletedOf('parents', 2)).toBe(1);
    expect(deletedOf('children', 20)).toBe(1);
    expect(deletedOf('children', 21)).toBe(1);
    expect(deletedOf('grandchildren', 200)).toBe(1);
    expect(deletedOf('grandchildren', 210)).toBe(1);
    // The untouched branch is still live, so the cascade did not over-reach either.
    expect(deletedOf('parents', 1)).toBe(0);
    expect(deletedOf('children', 10)).toBe(0);
    expect(deletedOf('grandchildren', 100)).toBe(0);
    await sqlite.closeConnection('cascexp', false);
  });

  test(`${label}: SET NULL clears the reference and leaves the child live`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'setnull',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL,
         parent_id INTEGER,
         ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
       );`,
      `INSERT INTO parents (id) VALUES (1), (2);
       INSERT INTO children (id, parent_id) VALUES (10, 1), (20, 2);`,
    );

    await db.run('DELETE FROM parents WHERE id = ?', [2]);

    expect(await marks(db, 'children')).toEqual({ 10: 0, 20: 0 });
    const rows = await db.query('SELECT id, parent_id FROM children ORDER BY id');
    expect(rows.values).toEqual([
      { id: 10, parent_id: 1 },
      { id: 20, parent_id: null },
    ]);
    await sqlite.closeConnection('setnull', false);
  });

  test(`${label}: SET DEFAULT restores the column's declared default`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'setdef',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL,
         parent_id INTEGER DEFAULT 1,
         ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET DEFAULT
       );`,
      `INSERT INTO parents (id) VALUES (1), (2);
       INSERT INTO children (id, parent_id) VALUES (20, 2);`,
    );

    await db.run('DELETE FROM parents WHERE id = ?', [2]);

    const rows = await db.query('SELECT id, parent_id, sql_deleted FROM children');
    expect(rows.values).toEqual([{ id: 20, parent_id: 1, sql_deleted: 0 }]);
    await sqlite.closeConnection('setdef', false);
  });

  test(`${label}: RESTRICT refuses the delete while live children exist`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'restrict',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL,
         parent_id INTEGER,
         ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE RESTRICT
       );`,
      `INSERT INTO parents (id) VALUES (1), (2);
       INSERT INTO children (id, parent_id) VALUES (20, 2);`,
    );

    await expect(db.run('DELETE FROM parents WHERE id = ?', [2])).rejects.toThrow(/related items exist/i);
    // Refused means refused: the parent is untouched, not half-deleted.
    expect(await marks(db, 'parents')).toEqual({ 1: 0, 2: 0 });
    expect(await marks(db, 'children')).toEqual({ 20: 0 });

    // A parent with no children is unaffected by the constraint.
    await db.run('DELETE FROM parents WHERE id = ?', [1]);
    expect(await marks(db, 'parents')).toEqual({ 1: 1, 2: 0 });

    // And once the child is gone, the parent can go too.
    await db.run('DELETE FROM children WHERE id = ?', [20]);
    await db.run('DELETE FROM parents WHERE id = ?', [2]);
    expect(await marks(db, 'parents')).toEqual({ 1: 1, 2: 1 });
    await sqlite.closeConnection('restrict', false);
  });

  test(`${label}: NO ACTION leaves the child alone, which is what it asks for`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'noaction',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL,
         parent_id INTEGER,
         ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE NO ACTION
       );`,
      `INSERT INTO parents (id) VALUES (2);
       INSERT INTO children (id, parent_id) VALUES (20, 2);`,
    );

    await db.run('DELETE FROM parents WHERE id = ?', [2]);
    expect(await marks(db, 'parents')).toEqual({ 2: 1 });
    expect(await marks(db, 'children')).toEqual({ 20: 0 });
    await sqlite.closeConnection('noaction', false);
  });

  test(`${label}: a self-referencing tree cascades to every descendant and terminates`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'selfref',
      `CREATE TABLE nodes (
         id INTEGER PRIMARY KEY NOT NULL,
         parent_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
         ${SYNC_COLUMNS}
       );`,
      `INSERT INTO nodes (id, parent_id) VALUES (1, NULL), (2, 1), (3, 2), (4, 3), (5, NULL), (6, 5);`,
    );

    await db.run('DELETE FROM nodes WHERE id = ?', [1]);

    // 1 -> 2 -> 3 -> 4 all go; the 5 -> 6 branch is untouched. This also exercises a column-level
    // REFERENCES clause, which the port source's regex never matched.
    expect(await marks(db, 'nodes')).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0 });
    await sqlite.closeConnection('selfref', false);
  });

  test(`${label}: every table referencing the parent is followed, not just the first`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'multiref',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE alpha (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );
       CREATE TABLE beta (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (id) VALUES (2);
       INSERT INTO alpha (id, parent_id) VALUES (10, 2);
       INSERT INTO beta (id, parent_id) VALUES (20, 2);`,
    );

    await db.run('DELETE FROM parents WHERE id = ?', [2]);
    expect(await marks(db, 'alpha')).toEqual({ 10: 1 });
    expect(await marks(db, 'beta')).toEqual({ 20: 1 });
    await sqlite.closeConnection('multiref', false);
  });

  test(`${label}: a composite foreign key cascades on the whole key`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'composite',
      `CREATE TABLE parents (
         org TEXT NOT NULL, code TEXT NOT NULL, ${SYNC_COLUMNS},
         PRIMARY KEY (org, code)
       );
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL, org TEXT, code TEXT, ${SYNC_COLUMNS},
         FOREIGN KEY (org, code) REFERENCES parents(org, code) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (org, code) VALUES ('a', 'x'), ('a', 'y');
       INSERT INTO children (id, org, code) VALUES (1, 'a', 'x'), (2, 'a', 'y');`,
    );

    await db.run('DELETE FROM parents WHERE org = ? AND code = ?', ['a', 'x']);
    // Only the row matching BOTH key columns goes.
    expect(await marks(db, 'children')).toEqual({ 1: 1, 2: 0 });
    await sqlite.closeConnection('composite', false);
  });

  test(`${label}: a child without sql_deleted is left to sqlite's own enforcement`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'mixed',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE notes (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER,
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (id) VALUES (2);
       INSERT INTO notes (id, parent_id) VALUES (20, 2);`,
    );

    // There is no column to mark, and nothing is orphaned: the parent row physically remains.
    await db.run('DELETE FROM parents WHERE id = ?', [2]);
    expect((await db.query('SELECT count(*) AS n FROM notes')).values?.[0].n).toBe(1);

    // The constraint is still real. deleteExportedRows performs an actual DELETE, and that is
    // where sqlite runs the cascade itself. The backdate is what makes the row reclaimable: the
    // export stamp has to be strictly newer than the row's last_modified.
    await db.createSyncTable();
    await db.execute('UPDATE parents SET last_modified = 1 WHERE id = 2;');
    await db.exportToJson('full');
    await db.deleteExportedRows();
    expect((await db.query('SELECT count(*) AS n FROM parents')).values?.[0].n).toBe(0);
    expect((await db.query('SELECT count(*) AS n FROM notes')).values?.[0].n).toBe(0);
    await sqlite.closeConnection('mixed', false);
  });

  test(`${label}: a cascaded soft delete reports the same changes as the equivalent hard delete`, async () => {
    const { sqlite } = await startHarness(tier);

    // Same shape, no sync columns: sqlite performs the real cascade.
    const hard = await open(
      sqlite,
      'hardc',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL);
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER,
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (id) VALUES (2);
       INSERT INTO children (id, parent_id) VALUES (20, 2), (21, 2);`,
    );
    const hardChanges = (await hard.run('DELETE FROM parents WHERE id = ?', [2])).changes?.changes;
    await sqlite.closeConnection('hardc', false);

    const soft = await open(
      sqlite,
      'softc',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (id) VALUES (2);
       INSERT INTO children (id, parent_id) VALUES (20, 2), (21, 2);`,
    );
    const softChanges = (await soft.run('DELETE FROM parents WHERE id = ?', [2])).changes?.changes;
    await sqlite.closeConnection('softc', false);

    // 1 parent + 2 children either way. Recording a deletion must not count differently from
    // performing one.
    expect(hardChanges).toBe(3);
    expect(softChanges).toBe(3);
  });

  test(`${label}: deleting an already-deleted parent is a no-op, not a second cascade`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'idem', TREE_SCHEMA, TREE_ROWS);

    await db.run('DELETE FROM parents WHERE id = ?', [2]);
    const before = await db.query('SELECT last_modified FROM children WHERE id = 20');
    const second = await db.run('DELETE FROM parents WHERE id = ?', [2]);

    expect(second.changes?.changes).toBe(0);
    const after = await db.query('SELECT last_modified FROM children WHERE id = 20');
    expect(after.values?.[0].last_modified).toBe(before.values?.[0].last_modified);
    await sqlite.closeConnection('idem', false);
  });

  test(`${label}: a delete written with literals rather than binds still cascades`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'literals',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, name TEXT, ${SYNC_COLUMNS});
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
      `INSERT INTO parents (id, name) VALUES (1, 'keep'), (2, 'drop');
       INSERT INTO children (id, parent_id) VALUES (10, 1), (20, 2);`,
    );

    // The WHERE clause carries a string literal instead of a bind, which is ordinary SQL and used
    // to produce a rewritten statement that did not parse.
    await db.run("DELETE FROM parents WHERE name = 'drop'");

    expect(await marks(db, 'parents')).toEqual({ 1: 0, 2: 1 });
    expect(await marks(db, 'children')).toEqual({ 10: 0, 20: 1 });
    await sqlite.closeConnection('literals', false);
  });

  test(`${label}: a DELETE inside an execute batch is recorded, not performed`, async () => {
    // Which entry point the app happened to use must not decide whether the server hears about
    // the deletion. execute() used to hand the batch straight to sqlite, so a batched DELETE
    // physically removed rows from a sync-tracked database while run() of the same statement
    // marked them.
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'batch', TREE_SCHEMA, TREE_ROWS);

    await db.execute("DELETE FROM parents WHERE name = 'drop';");

    expect(await marks(db, 'parents')).toEqual({ 1: 0, 2: 1 });
    expect(await marks(db, 'children')).toEqual({ 10: 0, 20: 1, 21: 1 });
    expect(await marks(db, 'grandchildren')).toEqual({ 100: 0, 200: 1, 210: 1 });
    expect((await db.query('SELECT count(*) AS n FROM parents')).values?.[0].n).toBe(2);

    // The rest of a mixed batch still runs normally.
    await db.execute("INSERT INTO parents (id, name) VALUES (3, 'later'); DELETE FROM parents WHERE id = 3;");
    expect(await marks(db, 'parents')).toEqual({ 1: 0, 2: 1, 3: 1 });
    await sqlite.closeConnection('batch', false);
  });

  test(`${label}: a table without sql_deleted is deleted from for real, even in a sync database`, async () => {
    // syncEnabled is a property of the database, but the rewrite has to be a property of the
    // table: rewriting here would produce SET sql_deleted = 1 on a table with no such column.
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'pertable',
      `CREATE TABLE tracked (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE plain (id INTEGER PRIMARY KEY NOT NULL, v TEXT);`,
      `INSERT INTO tracked (id) VALUES (1);
       INSERT INTO plain (id, v) VALUES (1, 'a'), (2, 'b');`,
    );

    const result = await db.run('DELETE FROM plain WHERE id = ?', [1]);
    expect(result.changes?.changes).toBe(1);
    expect((await db.query('SELECT id FROM plain ORDER BY id')).values).toEqual([{ id: 2 }]);

    // And the tracked table still behaves as a sync table.
    await db.run('DELETE FROM tracked WHERE id = ?', [1]);
    expect(await marks(db, 'tracked')).toEqual({ 1: 1 });
    await sqlite.closeConnection('pertable', false);
  });

  test(`${label}: a RESTRICT found mid-walk leaves nothing half-marked`, async () => {
    // The cascade is a tree of UPDATEs, so it has to be all or nothing even when the caller opted
    // out of the implicit transaction.
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'atomic',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE middle (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );
       CREATE TABLE guarded (
         id INTEGER PRIMARY KEY NOT NULL, middle_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (middle_id) REFERENCES middle(id) ON DELETE RESTRICT
       );`,
      `INSERT INTO parents (id) VALUES (1);
       INSERT INTO middle (id, parent_id) VALUES (10, 1);
       INSERT INTO guarded (id, middle_id) VALUES (100, 10);`,
    );

    await expect(db.run('DELETE FROM parents WHERE id = ?', [1], false)).rejects.toThrow(/related items exist/i);

    // `middle` was marked before the walk reached the RESTRICT two levels down. All of it is back.
    expect(await marks(db, 'parents')).toEqual({ 1: 0 });
    expect(await marks(db, 'middle')).toEqual({ 10: 0 });
    expect(await marks(db, 'guarded')).toEqual({ 100: 0 });
    await sqlite.closeConnection('atomic', false);
  });

  test(`${label}: a soft delete asked for its rows still hands them back`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'returning', TREE_SCHEMA, TREE_ROWS);

    // The RETURNING clause used to land inside the generated WHERE, producing SQL that did not
    // parse, so this whole shape was unusable on a sync-tracked database.
    const result = await db.run('DELETE FROM parents WHERE id = ? RETURNING id, name', [2], true, 'all');
    expect(result.changes?.values).toEqual([{ id: 2, name: 'drop' }]);
    expect(await marks(db, 'children')).toEqual({ 10: 0, 20: 1, 21: 1 });
    await sqlite.closeConnection('returning', false);
  });

  test(`${label}: a quoted table name cascades like any other`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'quoted',
      `CREATE TABLE "order" (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});
       CREATE TABLE "order line" (
         id INTEGER PRIMARY KEY NOT NULL, order_id INTEGER, ${SYNC_COLUMNS},
         FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE
       );`,
      `INSERT INTO "order" (id) VALUES (1);
       INSERT INTO "order line" (id, order_id) VALUES (10, 1);`,
    );

    await db.run('DELETE FROM "order" WHERE id = ?', [1]);
    expect(await marks(db, '"order"')).toEqual({ 1: 1 });
    expect(await marks(db, '"order line"')).toEqual({ 10: 1 });
    await sqlite.closeConnection('quoted', false);
  });

  test(`${label}: a delete with an OR stays idempotent, and the cascade agrees with it`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(sqlite, 'ors', TREE_SCHEMA, TREE_ROWS);

    const first = await db.run('DELETE FROM parents WHERE id = ? OR name = ?', [2, 'nobody']);
    expect(first.changes?.changes).toBe(5); // the parent, two children, two grandchildren
    const stamp = (await db.query('SELECT last_modified FROM parents WHERE id = 2')).values?.[0].last_modified;

    // Repeating it must be a no-op. Without brackets round the caller's clause the guard applied
    // to the last disjunct only, so this re-marked the row and moved its last_modified.
    const second = await db.run('DELETE FROM parents WHERE id = ? OR name = ?', [2, 'nobody']);
    expect(second.changes?.changes).toBe(0);
    expect((await db.query('SELECT last_modified FROM parents WHERE id = 2')).values?.[0].last_modified).toBe(stamp);
    await sqlite.closeConnection('ors', false);
  });

  test(`${label}: a foreign key added later is seen by the next delete`, async () => {
    // DDL does not only arrive through execute(). A CREATE TABLE issued with run() used to leave
    // the cached foreign-key graph in place, so the new constraint was invisible and its children
    // were never marked.
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'latefk',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL, ${SYNC_COLUMNS});`,
      'INSERT INTO parents (id) VALUES (1), (2);',
    );
    // Populates the caches: syncEnabled true, foreign-key graph empty.
    await db.run('DELETE FROM parents WHERE id = ?', [1]);

    await db.run(
      `CREATE TABLE children (id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER, ${SYNC_COLUMNS},
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE)`,
    );
    await db.run('INSERT INTO children (id, parent_id) VALUES (?, ?)', [20, 2]);
    await db.run('DELETE FROM parents WHERE id = ?', [2]);

    expect(await marks(db, 'children')).toEqual({ 20: 1 });
    await sqlite.closeConnection('latefk', false);
  });

  test(`${label}: foreign keys are enforced, which they were not before`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await open(
      sqlite,
      'fkon',
      `CREATE TABLE parents (id INTEGER PRIMARY KEY NOT NULL);
       CREATE TABLE children (
         id INTEGER PRIMARY KEY NOT NULL, parent_id INTEGER,
         FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
       );`,
    );
    expect((await db.query('PRAGMA foreign_keys')).values?.[0].foreign_keys).toBe(1);
    await expect(db.run('INSERT INTO children (id, parent_id) VALUES (?, ?)', [1, 999])).rejects.toThrow(
      /FOREIGN KEY constraint failed/i,
    );
    await sqlite.closeConnection('fkon', false);
  });
});
