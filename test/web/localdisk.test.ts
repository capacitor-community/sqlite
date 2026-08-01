/**
 * getFromLocalDiskToStore and saveToLocalDisk.
 *
 * Both are DOM flows: one opens a file picker, the other triggers a download. Neither can be
 * driven from an automated browser, because a picker needs a real user gesture and a download
 * lands outside the page. The picker/download boundary is therefore injectable, and these tests
 * replace it so that everything on either side of it, including the events, runs for real. What
 * stays manual-only is the picker chrome itself; recorded in PLAN section 13.
 */
import { afterEach, describe, expect, test } from 'vitest';

import { connectionNameFromFile, setSqliteLocalDiskAdapter } from '../../src/web/localdisk';

import { TIERS, startHarness, tierLabel } from './harness';

afterEach(() => setSqliteLocalDiskAdapter(null));

describe('file name mapping (unit)', () => {
  test('strips the plugin suffix and the extension', () => {
    expect(connectionNameFromFile('mydbSQLite.db')).toBe('mydb');
    expect(connectionNameFromFile('mydb.db')).toBe('mydb');
    expect(connectionNameFromFile('mydb.sqlite')).toBe('mydb');
    expect(connectionNameFromFile('/downloads/mydb.sqlite3')).toBe('mydb');
    expect(connectionNameFromFile('plain')).toBe('plain');
  });
});

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  async function exportBytes(sqlite: any, plugin: any, name: string, value: string): Promise<Uint8Array> {
    const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');
    await db.run('INSERT INTO t (v) VALUES (?)', [value]);
    await sqlite.closeConnection(name, false);
    const { bytes } = await (plugin as any).client.call('exportDb', { database: name });
    return bytes;
  }

  test(`${label}: getFromLocalDiskToStore adopts the picked file and raises its event`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const bytes = await exportBytes(sqlite, plugin, 'pickSource', 'from disk');
    const events: any[] = [];
    await plugin.addListener('sqlitePickDatabaseEndedEvent', (e: any) => events.push(e));

    setSqliteLocalDiskAdapter({
      pickDatabase: async () => ({ name: 'restored.db', bytes }),
      saveDatabase: async () => undefined,
    });

    await sqlite.getFromLocalDiskToStore(true);
    expect(events.length).toBe(1);
    expect(events[0].db_name).toBe('restoredSQLite.db');
    expect(events[0].message).toBe('ended');

    const db = await sqlite.createConnection('restored', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('from disk');
    await sqlite.closeConnection('restored', false);
  });

  test(`${label}: a cancelled picker reports it and changes nothing`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const events: any[] = [];
    await plugin.addListener('sqlitePickDatabaseEndedEvent', (e: any) => events.push(e));
    setSqliteLocalDiskAdapter({
      pickDatabase: async () => null,
      saveDatabase: async () => undefined,
    });

    await sqlite.getFromLocalDiskToStore(true);
    expect(events.length).toBe(1);
    expect(events[0].message).toMatch(/cancel/i);
    expect(events[0].db_name).toBeUndefined();
  });

  test(`${label}: overwrite = false leaves an existing database alone`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const original = await exportBytes(sqlite, plugin, 'keepMine', 'mine');
    const incoming = await exportBytes(sqlite, plugin, 'theirs', 'theirs');

    setSqliteLocalDiskAdapter({
      pickDatabase: async () => ({ name: 'keepMine.db', bytes: incoming }),
      saveDatabase: async () => undefined,
    });
    expect(original.byteLength).toBeGreaterThan(0);

    await sqlite.getFromLocalDiskToStore(false);
    const db = await sqlite.createConnection('keepMine', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('mine');
    await sqlite.closeConnection('keepMine', false);
  });

  test(`${label}: saveToLocalDisk hands over a valid database file and raises its event`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const db = await sqlite.createConnection('saveme', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute("CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('saved');");

    const saved: { name: string; bytes: Uint8Array }[] = [];
    const events: any[] = [];
    await plugin.addListener('sqliteSaveDatabaseToDiskEvent', (e: any) => events.push(e));
    setSqliteLocalDiskAdapter({
      pickDatabase: async () => null,
      saveDatabase: async (name, bytes) => {
        saved.push({ name, bytes });
      },
    });

    await sqlite.saveToLocalDisk('saveme');

    expect(saved.length).toBe(1);
    expect(saved[0].name).toBe('savemeSQLite.db');
    expect(new TextDecoder().decode(saved[0].bytes.subarray(0, 15))).toBe('SQLite format 3');
    expect(events.length).toBe(1);
    expect(events[0].message).toBe('ended');
    await sqlite.closeConnection('saveme', false);
  });

  test(`${label}: a failing save reports the error on the event and rejects`, async () => {
    const { sqlite, plugin } = await startHarness(tier);
    const db = await sqlite.createConnection('savefail', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE t (v TEXT);');

    const events: any[] = [];
    await plugin.addListener('sqliteSaveDatabaseToDiskEvent', (e: any) => events.push(e));
    setSqliteLocalDiskAdapter({
      pickDatabase: async () => null,
      saveDatabase: async () => {
        throw new Error('disk full');
      },
    });

    await expect(sqlite.saveToLocalDisk('savefail')).rejects.toThrow(/SaveToLocalDisk: disk full/);
    expect(events[0].message).toMatch(/^Error:.*disk full/);
    await sqlite.closeConnection('savefail', false);
  });

  test(`${label}: a saved database can be picked straight back in`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('roundtrip', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute("CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('there and back');");

    let captured: Uint8Array | null = null;
    setSqliteLocalDiskAdapter({
      pickDatabase: async () => (captured ? { name: 'copy.db', bytes: captured } : null),
      saveDatabase: async (_name, bytes) => {
        captured = bytes;
      },
    });

    await sqlite.saveToLocalDisk('roundtrip');
    await sqlite.closeConnection('roundtrip', false);
    expect(captured).not.toBeNull();

    await sqlite.getFromLocalDiskToStore(true);
    const copy = await sqlite.createConnection('copy', false, 'no-encryption', 1, false);
    await copy.open();
    expect((await copy.query('SELECT v FROM t')).values?.[0].v).toBe('there and back');
    await sqlite.closeConnection('copy', false);
  });
});
