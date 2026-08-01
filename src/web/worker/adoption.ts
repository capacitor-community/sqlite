/**
 * What it means to take a whole database image and make it one of this store's databases.
 *
 * Two callers share it: the one-time import from jeep-sqlite (`migrate-jeep.ts`) and the
 * tier-2 to tier-1 promotion (`promote.ts`). Both hand over bytes from somewhere else, both must
 * prove the result is a readable database before they let go of the original, and neither may
 * ever write over a database that is already in the store.
 */

/** The first 16 bytes of every SQLite file are these 15 characters followed by a NUL. */
const SQLITE_HEADER = 'SQLite format 3';

export interface AdoptionTarget {
  /** True when the store already holds a database of that name. Checked before every adopt. */
  exists(storage: string): Promise<boolean>;
  adopt(storage: string, bytes: Uint8Array): Promise<void>;
  /** Open what was adopted and run `PRAGMA integrity_check`. Throws when it is not a database. */
  verify(storage: string): Promise<void>;
  /** Undo an adopt whose verification failed, so no unreadable file is left behind. */
  discard(storage: string): Promise<void>;
}

/**
 * A cheap gate before handing bytes to the engine. On tier 2 `sqlite3_deserialize` accepts almost
 * anything and only fails later, so without this a stray value would become a database.
 */
export function looksLikeSQLite(bytes: Uint8Array): boolean {
  if (bytes.byteLength < SQLITE_HEADER.length) return false;
  for (let i = 0; i < SQLITE_HEADER.length; i++) {
    if (bytes[i] !== SQLITE_HEADER.charCodeAt(i)) return false;
  }
  return true;
}
