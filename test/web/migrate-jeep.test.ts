/**
 * The one-time import of jeep-sqlite's IndexedDB store.
 *
 * The fixtures are shaped like the real thing rather than like the plan's description of it: the
 * legacy database is at version 2 with localforage's own `local-forage-detect-blob-support` store
 * beside `databases`, a never-saved database is a key with an undefined value, and an interrupted
 * upgrade leaves a `backup-<name>SQLite.db` copy behind. All three were observed by driving
 * jeep-sqlite 2.8.0 in this same browser; the database image in `fixtures/jeep-image.ts` is its
 * actual output.
 *
 * Everything runs in one file because the legacy store is origin-wide and vitest browser mode
 * gives each test FILE its own storage partition.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import type { Tier } from '../../src/web/protocol';
import { JEEP_DB_NAME, JEEP_STORE_NAME, databaseNameFromKey } from '../../src/web/worker/migrate-jeep';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

import { corruptedJeepImage, jeepImage, truncatedJeepImage } from './fixtures/jeep-image';
import { TIERS, stopHarness, tierLabel } from './harness';

setSqliteWorkerFactory(
  () => new Worker(new URL('../../src/web/worker/worker.ts', import.meta.url), { type: 'module' }),
);

const BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';

function idb<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

/** Recreate what localforage leaves behind: version 2, two object stores. */
function openLegacy(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(JEEP_DB_NAME, 2);
    req.onupgradeneeded = () => {
      for (const store of [JEEP_STORE_NAME, BLOB_SUPPORT_STORE]) {
        if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('could not seed the legacy store'));
  });
}

async function seedLegacy(entries: Record<string, unknown>): Promise<void> {
  const db = await openLegacy();
  const store = db.transaction(JEEP_STORE_NAME, 'readwrite').objectStore(JEEP_STORE_NAME);
  // Every put is issued before the first await: a transaction goes inactive as soon as control
  // returns to the event loop with nothing pending.
  await Promise.all(Object.entries(entries).map(([key, value]) => idb(store.put(value, key))));
  db.close();
}

/** Null when the legacy database no longer exists at all. */
async function legacyKeys(): Promise<string[] | null> {
  const present = (await (indexedDB as any).databases()).some((entry: any) => entry?.name === JEEP_DB_NAME);
  if (!present) return null;
  const db = await openLegacy();
  const store = db.transaction(JEEP_STORE_NAME, 'readonly').objectStore(JEEP_STORE_NAME);
  const keys = await idb<IDBValidKey[]>(store.getAllKeys());
  db.close();
  return keys.map(String);
}

function dropLegacy(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(JEEP_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

const open: CapacitorSQLiteWeb[] = [];

/** A store of its own, so the migration marker starts unset for every test. */
async function boot(tier: Tier, poolName: string, skipJeepMigration = false): Promise<CapacitorSQLiteWeb> {
  setSqliteWebOptions({
    forceTier2: tier === 2,
    simulateInstallError: undefined,
    poolName,
    directory: `.${poolName}`,
    skipJeepMigration,
  });
  const plugin = new CapacitorSQLiteWeb();
  open.push(plugin);
  await new SQLiteConnection(plugin).initWebStore();
  expect(plugin.getWebStoreTier()).toBe(tier);
  return plugin;
}

beforeEach(async () => {
  await dropLegacy();
});

afterEach(async () => {
  await Promise.all(open.splice(0).map((plugin) => plugin.closeWebStore()));
  await stopHarness();
  await dropLegacy();
});

describe('jeep key naming', () => {
  test.each([
    ['jeepdemoSQLite.db', 'jeepdemo'],
    ['legacy.db', 'legacy'],
    ['plain', 'plain'],
  ])('%s belongs to the database %s', (key, database) => {
    expect(databaseNameFromKey(key)).toBe(database);
  });
});

describe.each(TIERS)('jeep-sqlite migration on %s', (tier) => {
  const label = tierLabel(tier);
  const pool = (suffix: string) => `jeep-${tier}-${suffix}`;

  test(`imports every real database and retires the legacy store (${label})`, async () => {
    await seedLegacy({
      'jeepdemoSQLite.db': jeepImage(),
      // An interrupted version upgrade leaves this behind. It is a copy of a database that is
      // already present under its own key, so importing it would conjure a phantom `backup-jeepdemo`.
      'backup-jeepdemoSQLite.db': jeepImage(),
      // Opened by jeep but never saved: the key exists, the value does not.
      'neversavedSQLite.db': undefined,
    });

    const plugin = await boot(tier, pool('happy'));
    const migration = plugin.getJeepMigration();
    expect(migration?.migrated).toEqual(['jeepdemo']);
    expect(migration?.failed).toEqual([]);
    expect(migration?.skipped.sort()).toEqual(['backup-jeepdemoSQLite.db', 'neversavedSQLite.db']);
    expect(migration?.warning).toBeUndefined();

    // An orphan backup key must not stand in the way of retiring the store.
    expect(migration?.legacyStoreDeleted).toBe(true);
    expect(await legacyKeys()).toBeNull();

    const list = await plugin.getDatabaseList();
    expect(list.values).toEqual(['jeepdemoSQLite.db']);

    const sqlite = new SQLiteConnection(plugin);
    const db = await sqlite.createConnection('jeepdemo', false, 'no-encryption', 3, false);
    await db.open();
    // The data, the schema version and the BLOB all survive the move.
    expect((await db.query('SELECT id, name, payload FROM legacy')).values).toEqual([
      { id: 1, name: 'from jeep', payload: new Uint8Array([1, 2, 255]) },
    ]);
    expect((await db.getVersion()).version).toBe(3);
    // And it is a live database, not a read-only snapshot.
    await db.run('INSERT INTO legacy (name) VALUES (?)', ['written after migrating']);
    expect((await db.query('SELECT count(*) AS n FROM legacy')).values?.[0].n).toBe(2);
    await sqlite.closeConnection('jeepdemo', false);
  });

  test(`a store holding nothing but placeholders is still retired (${label})`, async () => {
    await seedLegacy({ 'neversavedSQLite.db': undefined, 'emptySQLite.db': new Uint8Array(0) });
    const plugin = await boot(tier, pool('placeholders'));
    expect(plugin.getJeepMigration()?.migrated).toEqual([]);
    expect(plugin.getJeepMigration()?.legacyStoreDeleted).toBe(true);
    expect(await legacyKeys()).toBeNull();
  });

  test(`nothing happens when there is no legacy store (${label})`, async () => {
    const plugin = await boot(tier, pool('absent'));
    expect(plugin.getJeepMigration()).toBeNull();
    // The probe must not create the database it went looking for.
    expect(await legacyKeys()).toBeNull();
  });

  test(`it never runs a second time (${label})`, async () => {
    await seedLegacy({ 'firstSQLite.db': jeepImage() });
    const first = await boot(tier, pool('once'));
    expect(first.getJeepMigration()?.migrated).toEqual(['first']);
    await first.closeWebStore();

    // A legacy store that reappears after the marker is set is left alone: on a real installation
    // it can only be data the app has already moved past, and re-importing it would overwrite
    // whatever the app has written since.
    await seedLegacy({ 'secondSQLite.db': jeepImage() });
    const second = await boot(tier, pool('once'));
    expect(second.getJeepMigration()).toBeNull();
    expect(await legacyKeys()).toEqual(['secondSQLite.db']);
    expect((await second.getDatabaseList()).values).toEqual(['firstSQLite.db']);
  });

  test(`a database that will not verify leaves the whole legacy store in place (${label})`, async () => {
    await seedLegacy({
      'goodSQLite.db': jeepImage(),
      'corruptSQLite.db': corruptedJeepImage(),
      'garbageSQLite.db': new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    });

    const plugin = await boot(tier, pool('broken'));
    const migration = plugin.getJeepMigration();
    expect(migration?.failed.sort()).toEqual(['corrupt', 'garbage']);
    expect(migration?.warning).toMatch(/left in place/i);
    expect(migration?.legacyStoreDeleted).toBe(false);
    // Not one legacy byte is thrown away while anything remains unmigrated.
    expect((await legacyKeys())?.sort()).toEqual(['corruptSQLite.db', 'garbageSQLite.db', 'goodSQLite.db']);

    // The database that did import is usable, and the ones that did not were rolled back rather
    // than left in the store as unreadable files.
    expect(migration?.migrated).toEqual(['good']);
    expect((await plugin.getDatabaseList()).values).toEqual(['goodSQLite.db']);
  });

  test(`a half-written image is refused on both tiers (${label})`, async () => {
    await seedLegacy({ 'cutSQLite.db': truncatedJeepImage() });
    const plugin = await boot(tier, pool('truncated'));
    const migration = plugin.getJeepMigration();
    expect(migration?.migrated).toEqual([]);
    expect(migration?.failed).toEqual(['cut']);
    expect(migration?.legacyStoreDeleted).toBe(false);
    expect(await legacyKeys()).toEqual(['cutSQLite.db']);
    // Whatever the tier did with it, nothing readable is left behind under that name.
    expect((await plugin.getDatabaseList()).values).toEqual([]);
  });

  test(`a partial failure is not retried on the next boot (${label})`, async () => {
    await seedLegacy({ 'goodSQLite.db': jeepImage(), 'garbageSQLite.db': new Uint8Array([1, 2, 3, 4]) });
    const first = await boot(tier, pool('noretry'));
    expect(first.getJeepMigration()?.migrated).toEqual(['good']);
    expect(first.getJeepMigration()?.warning).toMatch(/not be retried/i);

    // The app now writes to the database it just got back.
    const sqlite = new SQLiteConnection(first);
    const db = await sqlite.createConnection('good', false, 'no-encryption', 3, false);
    await db.open();
    await db.run("INSERT INTO legacy (name) VALUES ('written after migrating')");
    await sqlite.closeConnection('good', false);
    await first.closeWebStore();

    // Re-importing the legacy image here would silently undo that write, which costs more than
    // the one database it would recover.
    const second = await boot(tier, pool('noretry'));
    expect(second.getJeepMigration()).toBeNull();
    const sqlite2 = new SQLiteConnection(second);
    const db2 = await sqlite2.createConnection('good', false, 'no-encryption', 3, false);
    await db2.open();
    expect((await db2.query('SELECT count(*) AS n FROM legacy')).values?.[0].n).toBe(2);
    await sqlite2.closeConnection('good', false);
  });

  test(`two keys claiming one database do not overwrite each other (${label})`, async () => {
    // `fooSQLite.db` is jeep's own key format; a bare `foo` is what jeep's setPathSuffix leaves
    // behind for a picked file with no extension. Both resolve to the same target here, so the
    // second one must be refused rather than silently written over the first.
    await seedLegacy({ 'fooSQLite.db': jeepImage(), foo: jeepImage() });

    const plugin = await boot(tier, pool('collision'));
    const migration = plugin.getJeepMigration();
    expect(migration?.failed).toEqual(['foo']);
    expect(migration?.warning).toMatch(/both claim it/i);
    expect(migration?.legacyStoreDeleted).toBe(false);
    expect((await legacyKeys())?.sort()).toEqual(['foo', 'fooSQLite.db']);
  });

  test(`a value that cannot be decoded fails rather than being taken for a placeholder (${label})`, async () => {
    // Not one of the shapes the migration knows how to read. Treating it as jeep's never-saved
    // placeholder would drop it and then delete the store holding the only copy.
    await seedLegacy({ 'oddSQLite.db': { looksLike: 'nothing we can read' } });
    const plugin = await boot(tier, pool('undecodable'));
    const migration = plugin.getJeepMigration();
    expect(migration?.skipped).toEqual([]);
    expect(migration?.failed).toEqual(['odd']);
    expect(migration?.warning).toMatch(/not readable as bytes/i);
    expect(await legacyKeys()).toEqual(['oddSQLite.db']);
  });

  test(`a backup key without its primary is a database in its own right (${label})`, async () => {
    // jeep only writes backup-x while x exists. On its own the key is somebody's database, quite
    // possibly one they really did call backup-2024.
    await seedLegacy({ 'backup-2024SQLite.db': jeepImage() });
    const plugin = await boot(tier, pool('lonebackup'));
    expect(plugin.getJeepMigration()?.migrated).toEqual(['backup-2024']);
    expect(plugin.getJeepMigration()?.skipped).toEqual([]);
    expect((await plugin.getDatabaseList()).values).toEqual(['backup-2024SQLite.db']);
  });

  test(`a live database of the same name is never written over (${label})`, async () => {
    // What an app that ran with skipJeepMigration on, and then turned it off, looks like.
    await seedLegacy({ 'notesSQLite.db': jeepImage() });
    const skipped = await boot(tier, pool('liveclash'), true);
    const sqlite = new SQLiteConnection(skipped);
    const db = await sqlite.createConnection('notes', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE current (id INTEGER PRIMARY KEY, note TEXT);');
    await db.run('INSERT INTO current (note) VALUES (?)', ['written on the new engine']);
    await sqlite.closeConnection('notes', false);
    await skipped.closeWebStore();

    const migrating = await boot(tier, pool('liveclash'));
    const migration = migrating.getJeepMigration();
    expect(migration?.migrated).toEqual([]);
    expect(migration?.failed).toEqual(['notes']);
    expect(migration?.warning).toMatch(/already in the store/i);
    expect(await legacyKeys()).toEqual(['notesSQLite.db']);

    // The live database is intact: not overwritten by the legacy image, and not discarded either.
    const sqlite2 = new SQLiteConnection(migrating);
    const db2 = await sqlite2.createConnection('notes', false, 'no-encryption', 1, false);
    await db2.open();
    expect((await db2.query('SELECT note FROM current')).values).toEqual([{ note: 'written on the new engine' }]);
    await sqlite2.closeConnection('notes', false);
  });

  test(`skipJeepMigration leaves the legacy store untouched (${label})`, async () => {
    await seedLegacy({ 'jeepdemoSQLite.db': jeepImage() });
    const plugin = await boot(tier, pool('skip'), true);
    expect(plugin.getJeepMigration()).toBeNull();
    expect(await legacyKeys()).toEqual(['jeepdemoSQLite.db']);
    expect((await plugin.getDatabaseList()).values).toEqual([]);
  });
});
