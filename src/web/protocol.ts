/**
 * Wire types shared by the facade and the worker.
 *
 * Envelope: `{ id, op, args }` request, `{ id, ok: true, result }` or
 * `{ id, ok: false, error }` response. Values cross the boundary by structured clone, so
 * `Uint8Array` BLOBs and `BigInt` int64s survive without any JSON step.
 */

/** 1 = opfs-sahpool (durable files), 2 = :memory: plus whole-image persistence in IndexedDB. */
export type Tier = 1 | 2;

export interface WorkerInitArgs {
  poolName: string;
  directory: string;
  /** Test hook: skip the VFS install entirely and run on tier 2. */
  forceTier2?: boolean;
  /** Test hook: pretend the install rejected with this DOMException name. */
  simulateInstallError?: string;
  /** Override where sqlite3.wasm is fetched from. Defaults to a sibling of the worker file. */
  wasmUrl?: string;
  /** Where copyFromAssets looks for databases.json. Defaults to `assets/databases/`. */
  assetsPath?: string;
  /**
   * Skip the one-time import of jeep-sqlite's IndexedDB store. Only for an app that wants to
   * keep the legacy store for its own reasons; the migration is otherwise safe to leave on,
   * since it is a no-op once it has run and on any installation that never used jeep-sqlite.
   */
  skipJeepMigration?: boolean;
}

export interface WorkerInitResult {
  tier: Tier;
  sqliteVersion: string;
  /** Reason the probe fell back, for logging. Absent on tier 1. */
  fallbackReason?: string;
  /** Outcome of the one-time jeep-sqlite migration. Absent when it had already run. */
  migration?: JeepMigrationResult;
  /** Outcome of the tier-2 to tier-1 promotion. Absent on tier 2 and when there was nothing to move. */
  promotion?: TierPromotionResult;
}

/**
 * What the tier-promotion pass did. Reported rather than thrown: an image that cannot be moved
 * into the pool is still readable by a tier 2 context, so it is a warning, not a boot failure.
 */
export interface TierPromotionResult {
  /** Storage names moved from the IndexedDB image store into the OPFS pool. */
  promoted: string[];
  /** Images whose name is already in the pool. The pool copy wins; the image is kept, not deleted. */
  conflicts: string[];
  /** Images that could not be moved. Still in the image store, retried on the next start. */
  failed: string[];
  warning?: string;
}

/**
 * What the one-time jeep-sqlite migration did. Reported rather than thrown: a store that cannot
 * be migrated must leave the legacy data untouched and warn, not stop the app from booting.
 */
export interface JeepMigrationResult {
  /** False when there was no legacy store to read. */
  ran: boolean;
  /** Connection names imported into the active tier. */
  migrated: string[];
  /** Legacy keys deliberately passed over: `backup-*` copies and never-saved placeholders. */
  skipped: string[];
  /** Connection names whose import or verification failed. Empty on success. */
  failed: string[];
  legacyStoreDeleted: boolean;
  warning?: string;
}

export interface OpenArgs {
  database: string;
  readonly: boolean;
  version: number;
  upgrades: SerializedUpgrade[];
}

export interface SerializedUpgrade {
  toVersion: number;
  statements: string[];
}

export interface ExecResult {
  changes: number;
  lastId: number;
  values?: any[];
}

export interface QueryResult {
  values: any[];
}

export interface WorkerRequest {
  id: number;
  op: string;
  args: Record<string, any>;
}

export interface WorkerErrorPayload {
  message: string;
  name?: string;
  code?: string;
}

export type WorkerResponse =
  | { id: number; ok: true; result: any }
  | { id: number; ok: false; error: WorkerErrorPayload };

/** Sent unsolicited by the worker as soon as its module body has run. */
export const BOOT_ID = -1;

/**
 * Sent unsolicited by the worker to raise a plugin event. The facade forwards these to
 * `notifyListeners`, which is how the five documented web events reach the app.
 */
export const EVENT_ID = -2;

export interface WorkerEvent {
  id: typeof EVENT_ID;
  event: string;
  data: any;
}

/** The five events the web implementation has always emitted (PLAN 2.4). */
export const EV_IMPORT_PROGRESS = 'sqliteImportProgressEvent';
export const EV_EXPORT_PROGRESS = 'sqliteExportProgressEvent';
export const EV_HTTP_REQUEST_ENDED = 'sqliteHTTPRequestEndedEvent';
export const EV_PICK_DATABASE_ENDED = 'sqlitePickDatabaseEndedEvent';
export const EV_SAVE_TO_DISK = 'sqliteSaveDatabaseToDiskEvent';

/**
 * The IndexedDB database and object store backing tier 2 images.
 *
 * The database name is derived from the pool name so that the two tiers namespace identically.
 * On tier 1 the pool name already isolates one store from another (M0 finding S11); without the
 * same treatment here, two stores configured with different pool names would share their tier 2
 * databases while keeping their tier 1 ones separate, which is a difference nobody would expect
 * to depend on which tier the browser happened to select.
 */
export const IMAGE_STORE_NAME = 'databases';

/**
 * Companion store for bookkeeping that is not a database image, currently only the marker that
 * says the one-time jeep-sqlite migration has already run. It is a second object store rather
 * than a reserved key in `databases` so that `getDatabaseList()` on tier 2, which enumerates that
 * store, cannot ever see it.
 */
export const META_STORE_NAME = 'meta';

/** Bumped from 1 to 2 when META_STORE_NAME was added. */
export const IMAGE_STORE_VERSION = 2;

export function imageStoreDbName(poolName: string): string {
  return `${poolName}-store`;
}

/**
 * Web Locks name held for the lifetime of the worker so only one context owns the pool.
 * Scoped by pool name: two stores configured with different pool names are genuinely
 * independent on disk, so they must not gate each other.
 */
export function ownerLockName(poolName: string): string {
  return `capacitor-sqlite-owner:${poolName}`;
}

/** Defaults for the sahpool. The pool name is part of the on-disk contract: changing it orphans data. */
export const DEFAULT_POOL_NAME = 'capacitor-sqlite';
export const DEFAULT_POOL_DIRECTORY = '.capacitor-sqlite';
