/**
 * One-time migration out of jeep-sqlite's storage.
 *
 * jeep-sqlite kept every database as a whole-file image in a localforage store: IndexedDB
 * database `jeepSqliteStore`, object store `databases`, out-of-line string keys of the form
 * `<name>SQLite.db`, values produced by sql.js's `export()`. This module reads that store with
 * raw IndexedDB (localforage is not a dependency and will not become one), hands every image to
 * the active tier through the same import path a downloaded `.sqlite` file takes, verifies each
 * one with `PRAGMA integrity_check`, and only then retires the legacy store.
 *
 * The rules below were verified against jeep-sqlite 2.8.0 driven in a real browser rather than
 * read off its source, because three of them are invisible in the source:
 *
 * - The legacy IndexedDB database is at **version 2 with two object stores**, `databases` and
 *   `local-forage-detect-blob-support`; localforage adds the second one itself. Opening with an
 *   explicit version 1, which is what jeep's own localforage config asks for, would fail with a
 *   VersionError, so the open here passes no version at all.
 * - A database jeep opened but never saved leaves its key present with an **undefined value**
 *   (`UtilsStore.setInitialDBToStore` stores `null`, which reads back as `undefined`). Those
 *   keys are placeholders for a database that never had any content, not data.
 * - `backup-<name>SQLite.db` keys are written before a version upgrade and removed after it
 *   (jeep `utils/database.js`), so an interrupted upgrade leaves one behind. Importing one would
 *   conjure a phantom database called `backup-<name>`, so it is skipped and a leftover backup
 *   never blocks retiring the legacy store. Only while `<name>SQLite.db` is also present, though:
 *   on its own the key is the sole copy of something, quite possibly a database the app really
 *   did name `backup-...`, and it is then migrated like any other.
 *
 * Failure policy: anything that goes wrong leaves the legacy store exactly as it was and reports
 * a warning. Boot is never blocked, and no legacy byte is deleted until every real database has
 * been imported and has passed its integrity check. The run happens at most once either way: a
 * second attempt would re-import legacy images over databases the app has been writing to since
 * the first, which loses more than it recovers.
 */
import { messageOf } from '../errors';
import type { JeepMigrationResult } from '../protocol';

import type { AdoptionTarget } from './adoption';
import { looksLikeSQLite } from './adoption';

/** localforage `name` and `storeName` from jeep's `setConfig` (jeep-sqlite.js `setConfig`). */
export const JEEP_DB_NAME = 'jeepSqliteStore';
export const JEEP_STORE_NAME = 'databases';

/** Marker key in the image store's meta store. Its value is the ISO date the migration ran. */
export const JEEP_MIGRATION_MARKER = 'jeep-migration';

const BACKUP_PREFIX = 'backup-';
const SUFFIX = 'SQLite.db';
/** How long to wait for a delete that another context is blocking before giving up on it. */
const DELETE_TIMEOUT_MS = 5000;

/** Where the marker lives. Implemented by ImageStore on both tiers. */
export interface MarkerStore {
  getMeta<T>(key: string): Promise<T | null>;
  setMeta(key: string, value: unknown): Promise<void>;
}

/**
 * The tier-specific half, shared with the tier-promotion pass. Nothing here ever writes over a
 * database that is already in the store: `exists` is consulted first, and a taken name fails that
 * database instead. The migration cannot know whether such a database is a leftover of its own or
 * one the app has been using, and only one of those two is safe to overwrite.
 */
export type JeepMigrationTarget = AdoptionTarget;

interface LegacyEntry {
  key: string;
  value: unknown;
}

/**
 * jeep's own `removePathSuffix`: `fooSQLite.db` -> `foo`, with a secondary plain-`.db` case for
 * keys that predate the suffix convention. Kept here rather than in paths.ts because it is
 * jeep's rule for jeep's keys, not this plugin's naming.
 */
export function databaseNameFromKey(key: string): string {
  if (key.includes(SUFFIX)) return key.split(SUFFIX)[0];
  if (key.endsWith('.db')) return key.slice(0, -3);
  return key;
}

/**
 * Values arrive as Uint8Array in practice; the other shapes are localforage driver defence.
 * `undefined` means the value could not be decoded at all, which is NOT the same as an empty
 * placeholder and must never be mistaken for one: skipping an undecodable value would delete the
 * only copy of whatever it was.
 */
async function toBytes(value: unknown): Promise<Uint8Array | null | undefined> {
  if (value === null || value === undefined) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  return undefined;
}

/**
 * True/false when the browser can answer cheaply, null when it cannot. `indexedDB.databases()`
 * is absent on Firefox before 126, which is why the caller also has the open-and-detect path.
 */
async function legacyStoreListed(): Promise<boolean | null> {
  const idb = indexedDB as any;
  if (typeof idb.databases !== 'function') return null;
  try {
    const list: { name?: string }[] = await idb.databases();
    return list.some((entry) => entry?.name === JEEP_DB_NAME);
  } catch {
    return null;
  }
}

/**
 * Open the legacy store without creating one. `indexedDB.open` with no version creates the
 * database when it is absent, which would leave a phantom `jeepSqliteStore` behind on every
 * fresh install, so a create is detected through `onupgradeneeded` and undone immediately.
 */
function openLegacyStore(): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(JEEP_DB_NAME);
    let created = false;
    req.onupgradeneeded = () => {
      created = true;
    };
    req.onsuccess = () => {
      const db = req.result;
      if (created) {
        db.close();
        indexedDB.deleteDatabase(JEEP_DB_NAME);
        resolve(null);
        return;
      }
      if (!db.objectStoreNames.contains(JEEP_STORE_NAME)) {
        db.close();
        resolve(null);
        return;
      }
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error(`Could not open ${JEEP_DB_NAME}`));
  });
}

function readAll(db: IDBDatabase): Promise<LegacyEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: LegacyEntry[] = [];
    const cursor = db.transaction(JEEP_STORE_NAME, 'readonly').objectStore(JEEP_STORE_NAME).openCursor();
    cursor.onsuccess = () => {
      const at = cursor.result;
      if (!at) {
        resolve(entries);
        return;
      }
      entries.push({ key: String(at.key), value: at.value });
      at.continue();
    };
    cursor.onerror = () => reject(cursor.error ?? new Error(`Could not read ${JEEP_STORE_NAME}`));
  });
}

/**
 * Best effort. A delete that another browsing context blocks stays pending indefinitely, so it
 * is raced against a timeout: the databases have already been imported and verified by this
 * point, and the marker stops the migration running again, so a legacy store left on disk costs
 * quota rather than correctness.
 */
function deleteLegacyStore(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: boolean) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const req = indexedDB.deleteDatabase(JEEP_DB_NAME);
    req.onsuccess = () => done(true);
    req.onerror = () => done(false);
    setTimeout(() => done(false), DELETE_TIMEOUT_MS);
  });
}

function nothingToDo(): JeepMigrationResult {
  return { ran: false, migrated: [], skipped: [], failed: [], legacyStoreDeleted: false };
}

/**
 * Run the migration if it has not run before. Never throws: every failure path returns a result
 * carrying a warning, because a store this plugin cannot read is not a reason to refuse to boot.
 */
export async function migrateFromJeep(marker: MarkerStore, target: JeepMigrationTarget): Promise<JeepMigrationResult> {
  try {
    if (await marker.getMeta(JEEP_MIGRATION_MARKER)) return nothingToDo();
  } catch {
    // An unreadable marker store means the migration cannot be made one-shot, and re-importing
    // legacy images over live data on every boot would be worse than not migrating at all.
    return {
      ...nothingToDo(),
      warning: 'Could not read the migration marker, so the jeep-sqlite migration was skipped.',
    };
  }

  if ((await legacyStoreListed()) === false) {
    await markDone(marker);
    return nothingToDo();
  }

  let legacy: IDBDatabase | null = null;
  try {
    legacy = await openLegacyStore();
    if (!legacy) {
      await markDone(marker);
      return nothingToDo();
    }
    const entries = await readAll(legacy);
    legacy.close();
    legacy = null;
    return await importEntries(marker, target, entries);
  } catch (err) {
    legacy?.close();
    return {
      ...nothingToDo(),
      ran: true,
      warning: `The jeep-sqlite store could not be migrated and was left untouched: ${messageOf(err)}`,
    };
  }
}

async function importEntries(
  marker: MarkerStore,
  target: JeepMigrationTarget,
  entries: LegacyEntry[],
): Promise<JeepMigrationResult> {
  const migrated: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const problems: string[] = [];

  // Classify everything before importing anything, so a collision is caught while the target is
  // still untouched.
  const candidates: { database: string; storage: string; bytes: Uint8Array }[] = [];
  const claimed = new Map<string, string>();
  const keys = new Set(entries.map((entry) => entry.key));

  for (const entry of entries) {
    // A `backup-x` key is jeep's pre-upgrade copy of `x`, so it is only redundant while `x` is
    // actually there. On its own it is the sole copy of something, quite possibly a database the
    // app really did call `backup-...`, and skipping it would delete it along with the store.
    if (entry.key.startsWith(BACKUP_PREFIX) && keys.has(entry.key.slice(BACKUP_PREFIX.length))) {
      skipped.push(entry.key);
      continue;
    }
    const bytes = await toBytes(entry.value);
    const database = databaseNameFromKey(entry.key);
    const storage = `${database}${SUFFIX}`;
    if (bytes === undefined) {
      failed.push(database);
      problems.push(`${database}: the stored value is not readable as bytes`);
      continue;
    }
    if (bytes === null || bytes.byteLength === 0) {
      // jeep's placeholder for a database it created but never saved. There is nothing to import
      // and nothing to lose, so it must not stand in the way of retiring the store.
      skipped.push(entry.key);
      continue;
    }
    if (!looksLikeSQLite(bytes)) {
      failed.push(database);
      problems.push(`${database}: the stored value is not a SQLite database image`);
      continue;
    }
    // Two legacy keys can resolve to one database: jeep's own key format is `<name>SQLite.db`,
    // but `setPathSuffix` leaves a picked file called `foo` under the bare key `foo`, which names
    // the same target as `fooSQLite.db`. Importing both would mean one silently overwriting the
    // other and the loser then being deleted along with the legacy store. The second claim fails
    // instead, which is enough to keep the store and everything in it.
    const other = claimed.get(storage);
    if (other !== undefined) {
      failed.push(database);
      problems.push(`${database}: the keys ${other} and ${entry.key} both claim it`);
      continue;
    }
    claimed.set(storage, entry.key);
    candidates.push({ database, storage, bytes });
  }

  for (const { database, storage, bytes } of candidates) {
    // Never write over something already in the store. On a normal first boot nothing is there,
    // but an app that ran with the migration disabled, or one that crashed mid-migration, can
    // leave a database under this name, and importing over it would destroy live data. This is
    // checked outside the try on purpose: the recovery below discards the target, which must
    // never happen to a database this migration did not create.
    let taken: boolean;
    try {
      taken = await target.exists(storage);
    } catch (err) {
      failed.push(database);
      problems.push(`${database}: ${messageOf(err)}`);
      continue;
    }
    if (taken) {
      failed.push(database);
      problems.push(`${database}: a database of that name is already in the store`);
      continue;
    }

    try {
      await target.adopt(storage, bytes);
      await target.verify(storage);
      migrated.push(database);
    } catch (err) {
      failed.push(database);
      problems.push(`${database}: ${messageOf(err)}`);
      try {
        await target.discard(storage);
      } catch {
        // Nothing further to do: the legacy image is still there and the store is kept.
      }
    }
  }

  // The marker is set whatever happened, because this ran to completion. Retrying on the next
  // boot would mean re-importing legacy images over databases the app has been writing to since,
  // which costs more data than the one it would recover. A failure keeps the legacy store, so
  // nothing is lost and an app that wants a retry can clear the marker itself.
  await markDone(marker);

  if (failed.length > 0) {
    return {
      ran: true,
      migrated,
      skipped,
      failed,
      legacyStoreDeleted: false,
      warning:
        `The jeep-sqlite store was left in place because ${failed.length} of its databases ` +
        `could not be migrated (${problems.join('; ')}). It will not be retried automatically.` +
        (migrated.length > 0 ? ` Migrated: ${migrated.join(', ')}.` : ''),
    };
  }

  const legacyStoreDeleted = await deleteLegacyStore();
  return {
    ran: true,
    migrated,
    skipped,
    failed,
    legacyStoreDeleted,
    ...(legacyStoreDeleted
      ? {}
      : {
          warning:
            'Every jeep-sqlite database was migrated, but the legacy IndexedDB store could not be ' +
            'deleted (another tab may still hold it open). It is safe to remove by hand.',
        }),
  };
}

async function markDone(marker: MarkerStore): Promise<void> {
  try {
    await marker.setMeta(JEEP_MIGRATION_MARKER, new Date().toISOString());
  } catch {
    // Worst case the probe runs again on the next boot and finds nothing to do.
  }
}
