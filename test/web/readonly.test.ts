/**
 * Read-only connections are real on web now. README.md documented them as unsupported under
 * jeep-sqlite; tier 1 opens the file with sqlite's read-only flag and tier 2, which must open
 * `:memory:` writable so it can deserialize, enforces it with PRAGMA query_only.
 *
 * The RO_/RW_ registry split has to keep working either way, because
 * SQLiteConnection._connectionDict keys on exactly that.
 */
import { describe, expect, test } from 'vitest';

import { TIERS, startHarness, tierLabel } from './harness';

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  async function seed(sqlite: any, name: string) {
    const rw = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
    await rw.open();
    await rw.execute("CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT); INSERT INTO t (v) VALUES ('seeded');");
    await sqlite.closeConnection(name, false);
  }

  test(`${label}: a read-only connection can read`, async () => {
    const { sqlite } = await startHarness(tier);
    await seed(sqlite, 'ro');
    const ro = await sqlite.createConnection('ro', false, 'no-encryption', 1, true);
    await ro.open();
    const rows = await ro.query('SELECT v FROM t');
    expect(rows.values?.[0].v).toBe('seeded');
    expect((await ro.isDBOpen()).result).toBe(true);
    await sqlite.closeConnection('ro', true);
  });

  test(`${label}: the engine refuses a write on a read-only connection`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    await seed(sqlite, 'roguard');
    const ro = await sqlite.createConnection('roguard', false, 'no-encryption', 1, true);
    await ro.open();

    // Going through the wrapper is refused before it reaches the plugin.
    await expect(ro.execute("INSERT INTO t (v) VALUES ('nope')")).rejects.toMatch(/read-only/i);

    // Going straight at the plugin has to be refused by sqlite itself.
    await expect(
      plugin.query({ database: 'roguard', statement: "INSERT INTO t (v) VALUES ('nope')", values: [], readonly: true }),
    ).rejects.toThrow(/readonly|read-only|read only/i);

    const rows = await ro.query('SELECT count(*) AS n FROM t');
    expect(rows.values?.[0].n).toBe(1);
    await sqlite.closeConnection('roguard', true);
  });

  test(`${label}: RO and RW connections to one database coexist in the registry`, async () => {
    const { sqlite } = await startHarness(tier);
    await seed(sqlite, 'both');

    const rw = await sqlite.createConnection('both', false, 'no-encryption', 1, false);
    await rw.open();
    const ro = await sqlite.createConnection('both', false, 'no-encryption', 1, true);
    await ro.open();

    expect((await sqlite.isConnection('both', false)).result).toBe(true);
    expect((await sqlite.isConnection('both', true)).result).toBe(true);
    expect((await sqlite.checkConnectionsConsistency()).result).toBe(true);

    await rw.run('INSERT INTO t (v) VALUES (?)', ['from rw']);
    expect((await rw.query('SELECT count(*) AS n FROM t')).values?.[0].n).toBe(2);

    await sqlite.closeConnection('both', true);
    await sqlite.closeConnection('both', false);
  });

  test(`${label}: opening a database that does not exist read-only fails`, async () => {
    const { sqlite } = await startHarness(tier);
    const ro = await sqlite.createConnection('ghost', false, 'no-encryption', 1, true);
    await expect(ro.open()).rejects.toBeTruthy();
    await sqlite.closeConnection('ghost', true).catch(() => undefined);
  });

  test(`${label}: checkConnectionsConsistency closes what the caller no longer knows about`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const a = await sqlite.createConnection('cc-a', false, 'no-encryption', 1, false);
    await a.open();
    const b = await sqlite.createConnection('cc-b', false, 'no-encryption', 1, false);
    await b.open();

    // The plugin holds two; the caller claims only one.
    const res = await plugin.checkConnectionsConsistency({ dbNames: ['cc-a'], openModes: ['RW'] });
    expect(res.result).toBe(true);
    expect((await plugin.isDBOpen({ database: 'cc-a', readonly: false })).result).toBe(true);
    await expect(plugin.isDBOpen({ database: 'cc-b', readonly: false })).rejects.toThrow(/No available connection/);

    await sqlite.closeConnection('cc-a', false).catch(() => undefined);
  });

  test(`${label}: an empty claim set resets everything and reports false`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const a = await sqlite.createConnection('cc-reset', false, 'no-encryption', 1, false);
    await a.open();
    const res = await plugin.checkConnectionsConsistency({ dbNames: [], openModes: [] });
    expect(res.result).toBe(false);
    await expect(plugin.isDBOpen({ database: 'cc-reset', readonly: false })).rejects.toThrow(/No available connection/);
  });
});
