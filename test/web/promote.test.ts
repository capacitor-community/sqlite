/**
 * Tier promotion (PLAN 14.8): databases stored as IndexedDB images while the browser lacked OPFS
 * move into the pool once it gains it.
 *
 * Without this, the normal upgrade path for a tier 2 user (Android WebView reaching M132, iOS 16.3
 * to 16.4) ends with an empty store and their data stranded in IndexedDB. Every test here boots
 * the same pool name twice, once forced onto tier 2 and once not, which is exactly what that
 * upgrade looks like from the plugin's side.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import type { Tier } from '../../src/web/protocol';
import { IMAGE_STORE_NAME, IMAGE_STORE_VERSION, META_STORE_NAME, imageStoreDbName } from '../../src/web/protocol';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

import { jeepImage } from './fixtures/jeep-image';
import { stopHarness } from './harness';

setSqliteWorkerFactory(
  () => new Worker(new URL('../../src/web/worker/worker.ts', import.meta.url), { type: 'module' }),
);

const open: CapacitorSQLiteWeb[] = [];
let poolCounter = 0;

async function boot(tier: Tier, poolName: string): Promise<CapacitorSQLiteWeb> {
  setSqliteWebOptions({
    forceTier2: tier === 2,
    simulateInstallError: undefined,
    skipJeepMigration: true,
    poolName,
    directory: `.${poolName}`,
  });
  const plugin = new CapacitorSQLiteWeb();
  open.push(plugin);
  await new SQLiteConnection(plugin).initWebStore();
  expect(plugin.getWebStoreTier()).toBe(tier);
  return plugin;
}

/** Create a database with one row, on whichever tier the plugin is currently on. */
async function seedDatabase(plugin: CapacitorSQLiteWeb, name: string, note: string): Promise<void> {
  const sqlite = new SQLiteConnection(plugin);
  const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  await db.execute('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, note TEXT);');
  await db.run('INSERT INTO notes (note) VALUES (?)', [note]);
  await sqlite.closeConnection(name, false);
  // Tier 2 only writes the image at a flush point, and closeConnection is one.
}

async function noteIn(plugin: CapacitorSQLiteWeb, name: string): Promise<string[]> {
  const sqlite = new SQLiteConnection(plugin);
  const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  const rows = await db.query('SELECT note FROM notes ORDER BY id');
  await sqlite.closeConnection(name, false);
  return (rows.values ?? []).map((row: any) => row.note);
}

function idb<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function openImageStore(poolName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(imageStoreDbName(poolName), IMAGE_STORE_VERSION);
    req.onupgradeneeded = () => {
      for (const store of [IMAGE_STORE_NAME, META_STORE_NAME]) {
        if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('could not open the image store'));
  });
}

/** Put bytes straight into the fallback store, for images the plugin would never write itself. */
async function putImage(poolName: string, storage: string, bytes: Uint8Array): Promise<void> {
  const db = await openImageStore(poolName);
  const store = db.transaction(IMAGE_STORE_NAME, 'readwrite').objectStore(IMAGE_STORE_NAME);
  await idb(store.put(bytes, storage));
  db.close();
}

async function imageKeys(poolName: string): Promise<string[]> {
  const db = await openImageStore(poolName);
  const store = db.transaction(IMAGE_STORE_NAME, 'readonly').objectStore(IMAGE_STORE_NAME);
  const keys = await idb<IDBValidKey[]>(store.getAllKeys());
  db.close();
  return keys.map(String).sort();
}

beforeEach(() => {
  poolCounter += 1;
});

afterEach(async () => {
  await Promise.all(open.splice(0).map((plugin) => plugin.closeWebStore()));
  await stopHarness();
});

describe('tier promotion', () => {
  const pool = (suffix: string) => `promote-${poolCounter}-${suffix}`;

  test('databases written on tier 2 are in the pool after the browser gains OPFS', async () => {
    const name = pool('clean');
    const fallback = await boot(2, name);
    await seedDatabase(fallback, 'alpha', 'written on tier 2');
    await seedDatabase(fallback, 'beta', 'also tier 2');
    expect(await imageKeys(name)).toEqual(['alphaSQLite.db', 'betaSQLite.db']);
    await fallback.closeWebStore();

    const upgraded = await boot(1, name);
    const promotion = upgraded.getTierPromotion();
    expect(promotion?.promoted.sort()).toEqual(['alphaSQLite.db', 'betaSQLite.db']);
    expect(promotion?.failed).toEqual([]);
    expect(promotion?.conflicts).toEqual([]);
    expect(promotion?.warning).toBeUndefined();

    // Visible, readable, and with their rows intact.
    expect((await upgraded.getDatabaseList()).values.sort()).toEqual(['alphaSQLite.db', 'betaSQLite.db']);
    expect(await noteIn(upgraded, 'alpha')).toEqual(['written on tier 2']);
    expect(await noteIn(upgraded, 'beta')).toEqual(['also tier 2']);

    // The image store is empty now, so the next boot has nothing to do.
    expect(await imageKeys(name)).toEqual([]);
  });

  test('an unreadable image fails alone and the rest still move', async () => {
    const name = pool('partial');
    const fallback = await boot(2, name);
    await seedDatabase(fallback, 'good', 'survives');
    await fallback.closeWebStore();
    await putImage(name, 'badSQLite.db', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));

    const upgraded = await boot(1, name);
    const promotion = upgraded.getTierPromotion();
    expect(promotion?.promoted).toEqual(['goodSQLite.db']);
    expect(promotion?.failed).toEqual(['badSQLite.db']);
    expect(promotion?.warning).toMatch(/retried on the next start/i);

    // The good one moved and the bad one is still where it was: nothing is thrown away.
    expect((await upgraded.getDatabaseList()).values).toEqual(['goodSQLite.db']);
    expect(await imageKeys(name)).toEqual(['badSQLite.db']);
    expect(await noteIn(upgraded, 'good')).toEqual(['survives']);
  });

  test('a partial failure resumes safely on the next boot', async () => {
    const name = pool('resume');
    const fallback = await boot(2, name);
    await seedDatabase(fallback, 'good', 'from tier 2');
    await fallback.closeWebStore();
    await putImage(name, 'badSQLite.db', new Uint8Array([9, 9, 9, 9]));

    const first = await boot(1, name);
    expect(first.getTierPromotion()?.promoted).toEqual(['goodSQLite.db']);
    // The app then writes to the database it just got back.
    const sqlite = new SQLiteConnection(first);
    const db = await sqlite.createConnection('good', false, 'no-encryption', 1, false);
    await db.open();
    await db.run('INSERT INTO notes (note) VALUES (?)', ['written after promoting']);
    await sqlite.closeConnection('good', false);
    await first.closeWebStore();

    const second = await boot(1, name);
    // The bad image is retried, the good one is not touched again, and the post-promotion write
    // is still there. Re-adopting it would have silently undone that row.
    expect(second.getTierPromotion()?.promoted).toEqual([]);
    expect(second.getTierPromotion()?.failed).toEqual(['badSQLite.db']);
    expect(await noteIn(second, 'good')).toEqual(['from tier 2', 'written after promoting']);
  });

  test('the pool wins a name conflict and the losing image is kept, not deleted', async () => {
    const name = pool('conflict');
    // A pool database exists first, then an image of the same name appears in the fallback store.
    // Only an interrupted promotion can produce this, which is why the image is not assumed stale
    // enough to throw away.
    const store = await boot(1, name);
    await seedDatabase(store, 'notes', 'the pool copy');
    await store.closeWebStore();
    await putImage(name, 'notesSQLite.db', jeepImage());

    const again = await boot(1, name);
    const promotion = again.getTierPromotion();
    expect(promotion?.conflicts).toEqual(['notesSQLite.db']);
    expect(promotion?.promoted).toEqual([]);
    expect(promotion?.warning).toMatch(/share a name/i);

    // The pool copy is the one in use, unchanged, and the image is still in IndexedDB.
    expect(await noteIn(again, 'notes')).toEqual(['the pool copy']);
    expect(await imageKeys(name)).toEqual(['notesSQLite.db']);
  });

  test('a tier 2 boot after a failed promotion still sees what was not moved', async () => {
    const name = pool('backdown');
    const fallback = await boot(2, name);
    await seedDatabase(fallback, 'moved', 'promotable');
    await seedDatabase(fallback, 'stuck', 'also promotable');
    await fallback.closeWebStore();

    // Make one of them unreadable so its promotion fails.
    await putImage(name, 'stuckSQLite.db', new Uint8Array([1, 2, 3, 4]));

    const upgraded = await boot(1, name);
    expect(upgraded.getTierPromotion()?.promoted).toEqual(['movedSQLite.db']);
    expect(upgraded.getTierPromotion()?.failed).toEqual(['stuckSQLite.db']);
    await upgraded.closeWebStore();

    // Back on tier 2, whatever did not move is exactly where it was.
    const back = await boot(2, name);
    expect(back.getTierPromotion()).toBeNull();
    expect((await back.getDatabaseList()).values).toEqual(['stuckSQLite.db']);
  });

  test('tier 2 never promotes, and an empty fallback store reports nothing', async () => {
    const name = pool('quiet');
    const onTier2 = await boot(2, name);
    await seedDatabase(onTier2, 'alpha', 'stays put');
    // Promotion is a tier 1 pass by definition: on tier 2 the images ARE the databases.
    expect(onTier2.getTierPromotion()).toBeNull();
    await onTier2.closeWebStore();

    const clean = await boot(1, pool('empty'));
    expect(clean.getTierPromotion()).toBeNull();
  });
});
