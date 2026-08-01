/**
 * The M1 exit criteria, run against both tiers through the public wrappers:
 * open / query / run / executeSet / transactions / upgrade statements / deleteDatabase /
 * getDatabaseList, with rows as plain objects and BLOBs as Uint8Array.
 */
import { describe, expect, test } from 'vitest';

import { TIERS, startHarness, tierLabel } from './harness';

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: create, open, execute, query`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('core', false, 'no-encryption', 1, false);
    await db.open();

    const created = await db.execute(`
      CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, age INTEGER);
      CREATE INDEX IF NOT EXISTS people_name ON people (name);
    `);
    expect(created.changes?.changes).toBeGreaterThanOrEqual(0);

    const inserted = await db.execute(
      `INSERT INTO people (name, age) VALUES ('Alice', 41), ('Bob', 29), ('Carol', 35);`,
    );
    expect(inserted.changes?.changes).toBe(3);

    const rows = await db.query('SELECT id, name, age FROM people ORDER BY id');
    expect(rows.values).toEqual([
      { id: 1, name: 'Alice', age: 41 },
      { id: 2, name: 'Bob', age: 29 },
      { id: 3, name: 'Carol', age: 35 },
    ]);

    const filtered = await db.query('SELECT name FROM people WHERE age > ?', [30]);
    expect(filtered.values?.map((r: any) => r.name)).toEqual(['Alice', 'Carol']);

    await sqlite.closeConnection('core', false);
  });

  test(`${label}: run reports changes and lastId together`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('runs', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');

    const first = await db.run('INSERT INTO t (v) VALUES (?)', ['one']);
    expect(first.changes?.changes).toBe(1);
    expect(first.changes?.lastId).toBe(1);

    const second = await db.run('INSERT INTO t (v) VALUES (?)', ['two']);
    expect(second.changes?.lastId).toBe(2);

    const updated = await db.run("UPDATE t SET v = 'x' WHERE id <= ?", [2]);
    expect(updated.changes?.changes).toBe(2);

    const deleted = await db.run('DELETE FROM t WHERE id = ?', [1]);
    expect(deleted.changes?.changes).toBe(1);

    await sqlite.closeConnection('runs', false);
  });

  test(`${label}: run with returnMode all returns the RETURNING rows`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('returning', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');

    const res = await db.run('INSERT INTO t (v) VALUES (?) RETURNING id, v', ['hello'], true, 'all');
    expect(res.changes?.changes).toBe(1);
    expect(res.changes?.values).toEqual([{ id: 1, v: 'hello' }]);

    const none = await db.run('INSERT INTO t (v) VALUES (?)', ['quiet']);
    expect(none.changes?.values).toBeUndefined();

    await sqlite.closeConnection('returning', false);
  });

  test(`${label}: executeSet, including one statement per row`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('sets', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, a TEXT, b INTEGER);');

    const res = await db.executeSet([
      { statement: 'INSERT INTO t (a, b) VALUES (?, ?)', values: ['first', 1] },
      {
        statement: 'INSERT INTO t (a, b) VALUES (?, ?)',
        values: [
          ['second', 2],
          ['third', 3],
        ],
      },
    ]);
    expect(res.changes?.changes).toBe(3);
    expect(res.changes?.lastId).toBe(3);

    const rows = await db.query('SELECT a, b FROM t ORDER BY id');
    expect(rows.values).toEqual([
      { a: 'first', b: 1 },
      { a: 'second', b: 2 },
      { a: 'third', b: 3 },
    ]);

    await sqlite.closeConnection('sets', false);
  });

  test(`${label}: transactions commit and roll back`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('tx', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');

    expect((await db.isTransactionActive()).result).toBe(false);
    await db.beginTransaction();
    expect((await db.isTransactionActive()).result).toBe(true);
    await db.run("INSERT INTO t (v) VALUES ('kept')", [], false);
    await db.commitTransaction();
    expect((await db.isTransactionActive()).result).toBe(false);

    await db.beginTransaction();
    await db.run("INSERT INTO t (v) VALUES ('dropped')", [], false);
    await db.rollbackTransaction();

    const rows = await db.query('SELECT v FROM t');
    expect(rows.values?.map((r: any) => r.v)).toEqual(['kept']);

    await sqlite.closeConnection('tx', false);
  });

  test(`${label}: a failing statement inside execute rolls the whole batch back`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('atomic', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT UNIQUE);');

    await expect(db.execute(`INSERT INTO t (v) VALUES ('a'); INSERT INTO t (v) VALUES ('a');`)).rejects.toBeTruthy();

    const rows = await db.query('SELECT count(*) AS n FROM t');
    expect(rows.values?.[0].n).toBe(0);

    await sqlite.closeConnection('atomic', false);
  });

  test(`${label}: executeTransaction from the wrapper`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('wrappertx', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');

    await db.executeTransaction([
      { statement: "INSERT INTO t (v) VALUES ('a')" },
      { statement: 'INSERT INTO t (v) VALUES (?)', values: ['b'] },
    ]);

    const rows = await db.query('SELECT v FROM t ORDER BY id');
    expect(rows.values?.map((r: any) => r.v)).toEqual(['a', 'b']);

    await sqlite.closeConnection('wrappertx', false);
  });

  test(`${label}: existence, table list and delete`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('存在', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE alpha (id INTEGER PRIMARY KEY NOT NULL); CREATE TABLE beta (id INTEGER);');

    expect((await db.isExists()).result).toBe(true);
    expect((await db.isDBOpen()).result).toBe(true);
    expect((await db.isTable('alpha')).result).toBe(true);
    expect((await db.isTable('missing')).result).toBe(false);
    expect((await db.getTableList()).values).toEqual(['alpha', 'beta']);

    const list = await sqlite.getDatabaseList();
    expect(list.values).toContain('存在SQLite.db');

    await db.delete();
    const after = await sqlite.getDatabaseList();
    expect(after.values).not.toContain('存在SQLite.db');

    await sqlite.closeConnection('存在', false);
  });

  test(`${label}: data survives close and reopen`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('persist', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute("CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('durable');");
    await sqlite.closeConnection('persist', false);

    const again = await sqlite.createConnection('persist', false, 'no-encryption', 1, false);
    await again.open();
    const rows = await again.query('SELECT v FROM t');
    expect(rows.values?.[0].v).toBe('durable');
    await sqlite.closeConnection('persist', false);
  });

  test(`${label}: getVersion reports user_version`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('versioned', false, 'no-encryption', 3, false);
    await db.open();
    expect((await db.getVersion()).version).toBe(3);
    await sqlite.closeConnection('versioned', false);
  });

  test(`${label}: echo`, async () => {
    const { sqlite } = await startHarness(tier);
    expect((await sqlite.echo('hi')).value).toBe('hi');
  });
});
