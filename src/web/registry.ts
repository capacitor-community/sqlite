/**
 * Connection registry, keyed the same way `SQLiteConnection._connectionDict` in
 * `src/definitions.ts` keys its own map: `RW_<database>` / `RO_<database>`. Keeping the two in
 * the same shape is what makes `checkConnectionsConsistency` able to compare them.
 *
 * Registration and opening are separate steps, exactly as on native: `createConnection` records
 * the intent (name, version, mode) and `open` does the work.
 */
import { connKey } from './worker/paths';

export interface RegisteredConnection {
  database: string;
  readonly: boolean;
  version: number;
  isOpen: boolean;
}

export class ConnectionRegistry {
  private entries = new Map<string, RegisteredConnection>();

  key(database: string, readonly: boolean): string {
    return connKey(database, readonly);
  }

  add(database: string, readonly: boolean, version: number): RegisteredConnection {
    const entry: RegisteredConnection = { database, readonly, version, isOpen: false };
    this.entries.set(this.key(database, readonly), entry);
    return entry;
  }

  get(database: string, readonly: boolean): RegisteredConnection | undefined {
    return this.entries.get(this.key(database, readonly));
  }

  require(database: string, readonly: boolean): RegisteredConnection {
    const entry = this.get(database, readonly);
    if (!entry) {
      throw new Error(`No available connection for database ${database}. Call createConnection() first.`);
    }
    return entry;
  }

  delete(database: string, readonly: boolean): void {
    this.entries.delete(this.key(database, readonly));
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  all(): RegisteredConnection[] {
    return [...this.entries.values()];
  }

  clear(): void {
    this.entries.clear();
  }
}

/** Decompose a registry key back into its parts. `RO_foo` -> `{ database: 'foo', readonly: true }`. */
export function parseKey(key: string): { database: string; readonly: boolean } {
  return { database: key.substring(3), readonly: key.substring(0, 3) === 'RO_' };
}

/**
 * The comparison `checkConnectionsConsistency` performs, ported from
 * `electron/src/index.ts` (MIT, this repo): the caller passes the connections it believes exist,
 * and anything the plugin holds beyond that set is closed. A mismatch in the other direction
 * (the caller knows about more than the plugin does) resets everything and reports false.
 *
 * @returns the keys to close, and whether the two sides agree afterwards.
 */
export function reconcile(held: string[], claimed: string[]): { toClose: string[]; consistent: boolean } {
  const claimedSet = new Set(claimed);
  if (claimedSet.size === 0) return { toClose: held, consistent: false };
  if (held.length < claimedSet.size) return { toClose: held, consistent: false };

  const toClose = held.filter((key) => !claimedSet.has(key));
  const remaining = held.filter((key) => claimedSet.has(key));
  const consistent = remaining.length === claimedSet.size;
  return { toClose: consistent ? toClose : held, consistent };
}
