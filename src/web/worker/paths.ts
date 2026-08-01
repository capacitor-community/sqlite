/**
 * Naming rules for stored databases, in one place because both of them bite silently.
 *
 * 1. The plugin's storage name is the connection name plus the `SQLite.db` suffix, matching
 *    every native implementation (`electron/src/index.ts:94`, `ios/Plugin/CapacitorSQLite.swift:1157`)
 *    and what `getDatabaseList()` is documented to return.
 * 2. opfs-sahpool registers files under the path its VFS computes
 *    (`new URL(name, 'file://localhost/').pathname`), so `new OpfsSAHPoolDb('a.db')` maps to
 *    `/a.db`, but `exportFile` / `importDb` / `unlink` look their argument up RAW. Feeding them
 *    the unnormalized name throws "File not found" on a database that plainly exists. Note that
 *    the normalization is a URL pathname, so it also percent-encodes: a database called `存在`
 *    is registered as `/%E5%AD%98%E5%9C%A8SQLite.db`. Reusing the same URL computation here is
 *    the only way to stay in step with it.
 */

const SUFFIX = 'SQLite.db';

/** `foo` or `foo.db` or `fooSQLite.db` -> `fooSQLite.db`. */
export function storageName(database: string): string {
  let name = database;
  if (name.endsWith(SUFFIX)) return name;
  if (name.endsWith('.db')) name = name.slice(0, -3);
  return `${name}${SUFFIX}`;
}

/** `fooSQLite.db` -> `foo`. Inverse of storageName for registry keys and error messages. */
export function connectionName(storage: string): string {
  return storage.endsWith(SUFFIX) ? storage.slice(0, -SUFFIX.length) : storage;
}

/** The key opfs-sahpool's exportFile / importDb / unlink actually look up. */
export function poolPath(storage: string): string {
  return new URL(storage.replace(/^\/+/, ''), 'file://localhost/').pathname;
}

/** Inverse of poolPath, for turning `getFileNames()` output back into database names. */
export function fromPoolPath(path: string): string {
  const stripped = path.replace(/^\/+/, '');
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
}

/** Registry key shared with SQLiteConnection._connectionDict in definitions.ts. */
export function connKey(database: string, readonly: boolean): string {
  return `${readonly ? 'RO' : 'RW'}_${database}`;
}

/**
 * importDb picks a free handle out of the pool and throws "No available handles to import to."
 * when there is none. Default initialCapacity is 6, so growing before an import is mandatory.
 */
export async function reserveCapacity(poolUtil: any, extra = 2): Promise<void> {
  const needed = poolUtil.getFileCount() + extra;
  if (poolUtil.getCapacity() < needed) {
    await poolUtil.reserveMinimumCapacity(needed);
  }
}
