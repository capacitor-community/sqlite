import { Capacitor, WebPlugin } from '@capacitor/core';

import type {
  CapacitorSQLitePlugin,
  capConnectionOptions,
  capAllConnectionsOptions,
  capChangeSecretOptions,
  capEchoOptions,
  capEchoResult,
  capNCConnectionOptions,
  capNCDatabasePathOptions,
  capNCDatabasePathResult,
  capNCOptions,
  capSetSecretOptions,
  capSQLiteChanges,
  capSQLiteExecuteOptions,
  capSQLiteExportOptions,
  capSQLiteFromAssetsOptions,
  capSQLiteHTTPOptions,
  capSQLiteLocalDiskOptions,
  capSQLiteImportOptions,
  capSQLiteJson,
  capSQLiteOptions,
  capSQLitePathOptions,
  capSQLiteQueryOptions,
  capSQLiteResult,
  capSQLiteRunOptions,
  capSQLiteSetOptions,
  capSQLiteSyncDate,
  capSQLiteSyncDateOptions,
  capSQLiteTableOptions,
  capSQLiteUpgradeOptions,
  capSQLiteUrl,
  capSQLiteValues,
  capVersionResult,
  capSQLiteExtensionPath,
  capSQLiteExtensionEnable,
} from './definitions';
import { WorkerClient } from './web/client';
import { WEBSTORE_NOT_OPEN, messageOf, prefixed } from './web/errors';
import { connectionNameFromFile, getLocalDiskAdapter } from './web/localdisk';
import type {
  JeepMigrationResult,
  SerializedUpgrade,
  Tier,
  TierPromotionResult,
  WorkerInitResult,
} from './web/protocol';
import { EV_PICK_DATABASE_ENDED, EV_SAVE_TO_DISK, EV_HTTP_REQUEST_ENDED } from './web/protocol';
import { ConnectionRegistry, parseKey, reconcile } from './web/registry';
import { connKey, storageName } from './web/worker/paths';
import { getSqliteWebOptions } from './web/worker-factory';

/**
 * The one-time jeep-sqlite import is loud when it does something and louder when it cannot.
 * A store this plugin fails to migrate leaves the legacy data exactly where it was, so the app
 * still boots; the warning is what tells the developer their users' data is still in the old
 * place. Silence means there was nothing to migrate.
 */
function reportMigration(migration: WorkerInitResult['migration']): void {
  if (!migration) return;
  if (migration.migrated.length > 0) {
    console.info(
      `[capacitor-sqlite] migrated ${migration.migrated.length} database(s) out of jeep-sqlite: ` +
        `${migration.migrated.join(', ')}.`,
    );
  }
  if (migration.warning) console.warn(`[capacitor-sqlite] ${migration.warning}`);
}

/**
 * The tier-2 to tier-1 promotion. Silence means the fallback store was empty, which is the case
 * for every installation that has only ever run on OPFS.
 */
function reportPromotion(promotion: WorkerInitResult['promotion']): void {
  if (!promotion) return;
  if (promotion.promoted.length > 0) {
    console.info(
      `[capacitor-sqlite] moved ${promotion.promoted.length} database(s) out of the IndexedDB ` +
        `fallback store into OPFS: ${promotion.promoted.join(', ')}.`,
    );
  }
  if (promotion.warning) console.warn(`[capacitor-sqlite] ${promotion.warning}`);
}

/**
 * Web implementation backed by `@sqlite.org/sqlite-wasm` in a dedicated worker.
 *
 * Tier 1 stores databases in OPFS through the `opfs-sahpool` VFS, which needs neither COOP/COEP
 * headers nor SharedArrayBuffer and therefore works inside Capacitor WebViews. Tier 2 is the
 * automatic fallback for platforms without OPFS sync access handles: the same engine, with
 * databases in `:memory:` and whole-file images in IndexedDB.
 */
export class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {
  private client = new WorkerClient();
  private registry = new ConnectionRegistry();
  private upgrades = new Map<string, SerializedUpgrade[]>();
  private store: WorkerInitResult | null = null;

  /** Connections closed by pauseWebStore, waiting to be reopened. Null when not paused. */
  private paused: { database: string; readonly: boolean }[] | null = null;
  /**
   * The pause currently in flight. `paused` above cannot be published until the worker answers,
   * and on a real device the OS can freeze the page inside exactly that round trip, so a resume
   * needs something to wait for that exists from the moment the pause starts.
   */
  private pausing: Promise<void> | null = null;
  private visibilityListener: (() => void) | null = null;

  async initWebStore(): Promise<void> {
    if (this.store) return;
    try {
      this.client.onEvent = (event, data) => this.notifyListeners(event, data);
      await this.client.start();
      this.store = await this.client.call('init', getSqliteWebOptions());
      reportPromotion(this.store?.promotion);
      reportMigration(this.store?.migration);
      this.watchAppState();
    } catch (err) {
      this.store = null;
      throw prefixed('initWebStore', err);
    }
  }

  /**
   * Follow the app in and out of the background, but only under Capacitor native.
   *
   * WKWebView invalidates OPFS access handles when the app is suspended, which is why the store
   * has to be closed and the VFS paused before that happens (PLAN 6.7). `visibilitychange` is the
   * signal available without taking a dependency on `@capacitor/app`; an app that wants the
   * precision of `App.appStateChange` can call `pauseWebStore` / `resumeWebStore` itself, and
   * calling them while this listener is also active is harmless because both are idempotent.
   *
   * Deliberately not wired on the plain web: a browser tab going hidden is not a suspension, and
   * closing every connection on a tab switch would be a bug rather than a protection.
   */
  private watchAppState(): void {
    if (this.visibilityListener) return;
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    if (!Capacitor.isNativePlatform?.()) return;
    this.visibilityListener = () => {
      const going = document.visibilityState === 'hidden';
      void (going ? this.pauseWebStore() : this.resumeWebStore()).catch((err) => {
        console.warn(`[capacitor-sqlite] ${going ? 'pausing' : 'resuming'} the store failed: ${messageOf(err)}`);
      });
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private unwatchAppState(): void {
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    this.visibilityListener = null;
  }

  /**
   * Close every connection and pause the VFS, so the OS can suspend the app without leaving the
   * pool's access handles half-alive. Idempotent, and a no-op on tier 2, which has no handles.
   *
   * `pauseVfs()` throws SQLITE_MISUSE while any database is open, so closing first is part of the
   * operation rather than something the caller has to remember (M0 finding S4).
   */
  async pauseWebStore(): Promise<void> {
    // A second caller joins the first rather than starting a competing pause, which is what keeps
    // this idempotent alongside the automatic listener.
    if (this.pausing) return this.pausing;
    if (!this.store || this.paused) return;
    const pausing = (async () => {
      const result = await this.client.call('pause', {});
      this.paused = result.reopen ?? [];
      if (result.interrupted?.length > 0) {
        // In-flight transactions cannot survive the close. Rolled back, and said out loud.
        console.warn(
          `[capacitor-sqlite] rolled back an open transaction on ${result.interrupted.join(', ')} ` +
            'while pausing the store for the background.',
        );
      }
    })();
    this.pausing = pausing;
    try {
      await pausing;
    } finally {
      if (this.pausing === pausing) this.pausing = null;
    }
  }

  /**
   * Unpause and reopen what pauseWebStore closed. When that fails, which is what a real device
   * suspension can do to a pool behind our back, fall back to the heavy path: tear the worker
   * down, start a new one, re-run init, and reopen from the same record (PLAN 6.7).
   */
  async resumeWebStore(): Promise<void> {
    // Wait for a pause that has not finished publishing its state. Measured on an iPhone: iOS
    // suspends the page inside the pause's worker round trip and then delivers the foreground
    // signal first, so a resume that reads `paused` straight away sees null, returns a no-op, and
    // the pause completes afterwards and closes every connection. The store would be left shut
    // with nothing to reopen it until the app went round the cycle again (PLAN 18.4).
    if (this.pausing) {
      try {
        await this.pausing;
      } catch {
        // A pause that failed published no state to restore; fall through to what it did set.
      }
    }
    if (!this.store || !this.paused) return;
    const reopen = this.paused;
    this.paused = null;
    try {
      await this.client.call('unpause', {});
      await this.reopenAll(reopen);
    } catch (err) {
      console.warn(`[capacitor-sqlite] unpause failed (${messageOf(err)}), restarting the worker.`);
      await this.restartWebStore(reopen);
    }
  }

  /**
   * The heavy recovery path, also usable on its own: a fresh worker, a fresh VFS install, and the
   * given connections reopened. A second worker can take over a paused pool, which is what makes
   * this work at the engine level (M0 spike item 6).
   */
  async restartWebStore(reopen?: { database: string; readonly: boolean }[]): Promise<void> {
    const wanted = reopen ?? this.registry.keys().map((key) => parseKey(key));
    this.paused = null;
    this.client.terminate();
    this.client.onEvent = (event, data) => this.notifyListeners(event, data);
    await this.client.start();
    this.store = await this.client.call('init', getSqliteWebOptions());
    await this.reopenAll(wanted);
  }

  private async reopenAll(entries: { database: string; readonly: boolean }[]): Promise<void> {
    for (const { database, readonly } of entries) {
      const version = this.registry.get(database, readonly)?.version ?? 1;
      await this.client.call(
        'open',
        { database, readonly, version, upgrades: this.upgrades.get(database) ?? [] },
        connKey(database, readonly),
      );
    }
  }

  /** Which durability tier the store selected. Additive; not part of CapacitorSQLitePlugin. */
  getWebStoreTier(): Tier | null {
    return this.store?.tier ?? null;
  }

  /**
   * What the one-time jeep-sqlite import did on this boot, or null when it had nothing to do.
   * Additive; not part of CapacitorSQLitePlugin. Useful for telling a user their data moved, and
   * for noticing the warning path in an app that suppresses console output.
   */
  getJeepMigration(): JeepMigrationResult | null {
    return this.store?.migration ?? null;
  }

  /**
   * What the tier-2 to tier-1 promotion did on this boot, or null when there was nothing in the
   * fallback store to move. Additive; not part of CapacitorSQLitePlugin.
   */
  getTierPromotion(): TierPromotionResult | null {
    return this.store?.promotion ?? null;
  }

  /**
   * Shut the worker down and release the single-owner lock, so another tab can take over.
   * Additive; not part of CapacitorSQLitePlugin. Any open connection is dropped without a
   * flush, so call `saveToStore` first if you are on tier 2 and care about unsaved changes.
   */
  async closeWebStore(): Promise<void> {
    this.unwatchAppState();
    this.client.terminate();
    this.registry.clear();
    this.paused = null;
    this.store = null;
  }

  private ensureStore(): WorkerInitResult {
    if (!this.store) throw new Error(WEBSTORE_NOT_OPEN);
    return this.store;
  }

  private static optionValue<T>(options: any, key: string, fallback?: T): T {
    const value = options?.[key];
    if (value === undefined || value === null) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Must provide a ${key}`);
    }
    return value as T;
  }

  private call(op: string, args: Record<string, any>, database?: string, readonly?: boolean): Promise<any> {
    this.ensureStore();
    const key = database !== undefined ? connKey(database, !!readonly) : undefined;
    return this.client.call(op, args, key);
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    return { value: options?.value };
  }

  async saveToStore(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    await this.call('saveToStore', { database }, database, false);
  }

  async createConnection(options: capConnectionOptions): Promise<void> {
    this.ensureStore();
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const version = options.version ?? 1;
    const readonly = options.readonly ?? false;
    if (options.encrypted) {
      throw new Error('CreateConnection: encryption is not supported on the web platform');
    }
    this.registry.add(database, readonly, version);
  }

  async closeConnection(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.registry.require(database, readonly);
    try {
      await this.call('close', { database, readonly }, database, readonly);
    } finally {
      this.registry.delete(database, readonly);
      this.client.releaseQueue(connKey(database, readonly));
    }
  }

  async open(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    const entry = this.registry.require(database, readonly);
    try {
      await this.call(
        'open',
        { database, readonly, version: entry.version, upgrades: this.upgrades.get(database) ?? [] },
        database,
        readonly,
      );
      entry.isOpen = true;
    } catch (err) {
      throw prefixed('Open', err);
    }
  }

  async close(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    const entry = this.registry.require(database, readonly);
    await this.call('close', { database, readonly }, database, readonly);
    entry.isOpen = false;
  }

  async getVersion(options: capSQLiteOptions): Promise<capVersionResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'GetVersion');
    return this.call('getVersion', { database, readonly }, database, readonly);
  }

  async checkConnectionsConsistency(options: capAllConnectionsOptions): Promise<capSQLiteResult> {
    const dbNames = options?.dbNames ?? [];
    const openModes = options?.openModes ?? [];
    const claimed = dbNames.map((name, index) => `${openModes[index] ?? 'RW'}_${name}`);
    const { toClose, consistent } = reconcile(this.registry.keys(), claimed);

    for (const key of toClose) {
      const { database, readonly } = parseKey(key);
      try {
        await this.call('close', { database, readonly }, database, readonly);
      } catch {
        // A connection that cannot be closed is still one we must forget about.
      }
      this.registry.delete(database, readonly);
      this.client.releaseQueue(key);
    }
    if (!consistent) this.registry.clear();
    return { result: consistent };
  }

  async beginTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    return this.transactionOp('beginTransaction', options);
  }
  async commitTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    return this.transactionOp('commitTransaction', options);
  }
  async rollbackTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    return this.transactionOp('rollbackTransaction', options);
  }

  private async transactionOp(op: string, options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, op);
    const result = await this.call(op, { database, readonly }, database, readonly);
    return { changes: { changes: result.changes, lastId: result.lastId } };
  }

  async isTransactionActive(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'IsTransactionActive');
    return this.call('isTransactionActive', { database, readonly }, database, readonly);
  }

  async getTableList(options: capSQLiteOptions): Promise<capSQLiteValues> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'GetTableList');
    return this.call('getTableList', { database, readonly }, database, readonly);
  }

  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const statements = CapacitorSQLiteWeb.optionValue<string>(options, 'statements');
    const transaction = options.transaction ?? true;
    this.rejectReadonly(options.readonly, 'Execute');
    this.requireOpen(database, false, 'Execute');
    const result = await this.call('execute', { database, readonly: false, statements, transaction }, database, false);
    return { changes: { changes: result.changes, lastId: result.lastId } };
  }

  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const set = CapacitorSQLiteWeb.optionValue<any[]>(options, 'set');
    const transaction = options.transaction ?? true;
    const returnMode = options.returnMode ?? 'no';
    this.rejectReadonly(options.readonly, 'ExecuteSet');
    this.requireOpen(database, false, 'ExecuteSet');
    const result = await this.call(
      'executeSet',
      { database, readonly: false, set, transaction, returnMode },
      database,
      false,
    );
    return { changes: CapacitorSQLiteWeb.changesOf(result) };
  }

  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const statement = CapacitorSQLiteWeb.optionValue<string>(options, 'statement');
    const transaction = options.transaction ?? true;
    const returnMode = options.returnMode ?? 'no';
    this.rejectReadonly(options.readonly, 'Run');
    this.requireOpen(database, false, 'Run');
    const result = await this.call(
      'run',
      { database, readonly: false, statement, values: options.values ?? [], transaction, returnMode },
      database,
      false,
    );
    return { changes: CapacitorSQLiteWeb.changesOf(result) };
  }

  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const statement = CapacitorSQLiteWeb.optionValue<string>(options, 'statement');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'Query');
    return this.call('query', { database, readonly, statement, values: options.values ?? [] }, database, readonly);
  }

  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.registry.require(database, readonly);
    return this.call('isDatabase', { database });
  }

  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.registry.require(database, readonly);
    return this.call('isDBOpen', { database, readonly });
  }

  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    return this.call('isDatabase', { database });
  }

  async isTableExists(options: capSQLiteTableOptions): Promise<capSQLiteResult> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const table = CapacitorSQLiteWeb.optionValue<string>(options, 'table');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'IsTableExists');
    return this.call('isTableExists', { database, readonly, table }, database, readonly);
  }

  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    this.rejectReadonly(options.readonly, 'DeleteDatabase');
    this.registry.require(database, false);
    await this.call('deleteDatabase', { database }, database, false);
    const entry = this.registry.get(database, false);
    if (entry) entry.isOpen = false;
  }

  async getDatabaseList(): Promise<capSQLiteValues> {
    return this.call('getDatabaseList', {});
  }

  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const upgrade = CapacitorSQLiteWeb.optionValue<any[]>(options, 'upgrade');
    const serialized: SerializedUpgrade[] = upgrade.map((entry, index) => {
      if (entry?.toVersion === undefined || !Array.isArray(entry?.statements)) {
        throw new Error(`AddUpgradeStatement: upgrade[${index}] needs toVersion and statements`);
      }
      return { toVersion: entry.toVersion, statements: entry.statements };
    });
    const existing = this.upgrades.get(database) ?? [];
    const merged = new Map<number, SerializedUpgrade>();
    for (const item of [...existing, ...serialized]) merged.set(item.toVersion, item);
    this.upgrades.set(
      database,
      [...merged.values()].sort((a, b) => a.toVersion - b.toVersion),
    );
  }

  private requireOpen(database: string, readonly: boolean, context: string): void {
    const entry = this.registry.require(database, readonly);
    if (!entry.isOpen) throw new Error(`${context}: Database ${database} not opened`);
  }

  private rejectReadonly(readonly: boolean | undefined, context: string): void {
    if (readonly) throw new Error(`${context}: not allowed in read-only mode`);
  }

  private static changesOf(result: any): { changes: number; lastId: number; values?: any[] } {
    const changes: { changes: number; lastId: number; values?: any[] } = {
      changes: result.changes,
      lastId: result.lastId,
    };
    if (result.values !== undefined) changes.values = result.values;
    return changes;
  }

  ////////////////////////////////////
  ////// JSON, SYNC, ASSETS AND LOCAL DISK
  ////////////////////////////////////

  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    const jsonstring = CapacitorSQLiteWeb.optionValue<string>(options, 'jsonstring');
    return this.call('isJsonValid', { jsonstring });
  }

  async importFromJson(options: capSQLiteImportOptions): Promise<capSQLiteChanges> {
    const jsonstring = CapacitorSQLiteWeb.optionValue<string>(options, 'jsonstring');
    const result = await this.call('importFromJson', { jsonstring });
    return { changes: { changes: result.changes, lastId: result.lastId } };
  }

  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const jsonexportmode = CapacitorSQLiteWeb.optionValue<string>(options, 'jsonexportmode');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'ExportToJson');
    return this.call(
      'exportToJson',
      { database, readonly, jsonexportmode, encrypted: options.encrypted ?? false },
      database,
      readonly,
    );
  }

  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    this.rejectReadonly(options.readonly, 'CreateSyncTable');
    this.requireOpen(database, false, 'CreateSyncTable');
    const result = await this.call('createSyncTable', { database }, database, false);
    return { changes: { changes: result.changes, lastId: result.lastId } };
  }

  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const syncdate = CapacitorSQLiteWeb.optionValue<string>(options, 'syncdate');
    this.rejectReadonly(options.readonly, 'SetSyncDate');
    this.requireOpen(database, false, 'SetSyncDate');
    await this.call('setSyncDate', { database, syncdate }, database, false);
  }

  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    const readonly = options.readonly ?? false;
    this.requireOpen(database, readonly, 'GetSyncDate');
    return this.call('getSyncDate', { database, readonly }, database, readonly);
  }

  async deleteExportedRows(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    this.rejectReadonly(options.readonly, 'DeleteExportedRows');
    this.requireOpen(database, false, 'DeleteExportedRows');
    await this.call('deleteExportedRows', { database }, database, false);
  }

  async copyFromAssets(options: capSQLiteFromAssetsOptions): Promise<void> {
    const overwrite = options?.overwrite ?? true;
    await this.call('copyFromAssets', { base: this.assetsBase(), overwrite });
  }

  async getFromHTTPRequest(options: capSQLiteHTTPOptions): Promise<void> {
    const url = CapacitorSQLiteWeb.optionValue<string>(options, 'url');
    const overwrite = options.overwrite ?? true;
    try {
      await this.call('getFromHTTPRequest', { url, overwrite });
      this.notifyListeners(EV_HTTP_REQUEST_ENDED, { message: 'ended' });
    } catch (err) {
      this.notifyListeners(EV_HTTP_REQUEST_ENDED, { message: `Error: ${messageOf(err)}` });
      throw prefixed('GetFromHTTPRequest', err);
    }
  }

  async getFromLocalDiskToStore(options: capSQLiteLocalDiskOptions): Promise<void> {
    this.ensureStore();
    const overwrite = options?.overwrite ?? true;
    try {
      const picked = await getLocalDiskAdapter().pickDatabase();
      if (!picked) {
        this.notifyListeners(EV_PICK_DATABASE_ENDED, { message: 'User cancelled' });
        return;
      }
      const database = connectionNameFromFile(picked.name);
      const result = await this.call('adoptImage', { database, bytes: picked.bytes, overwrite });
      this.notifyListeners(EV_PICK_DATABASE_ENDED, { db_name: result.storage, message: 'ended' });
    } catch (err) {
      this.notifyListeners(EV_PICK_DATABASE_ENDED, { message: `Error: ${messageOf(err)}` });
      throw prefixed('GetFromLocalDiskToStore', err);
    }
  }

  async saveToLocalDisk(options: capSQLiteOptions): Promise<void> {
    const database = CapacitorSQLiteWeb.optionValue<string>(options, 'database');
    try {
      const { bytes } = await this.call('exportDb', { database }, database, false);
      const fileName = storageName(database);
      await getLocalDiskAdapter().saveDatabase(fileName, bytes);
      this.notifyListeners(EV_SAVE_TO_DISK, { db_name: fileName, message: 'ended' });
    } catch (err) {
      this.notifyListeners(EV_SAVE_TO_DISK, { message: `Error: ${messageOf(err)}` });
      throw prefixed('SaveToLocalDisk', err);
    }
  }

  /** Where copyFromAssets looks for `databases.json`, overridable through setSqliteWebOptions. */
  private assetsBase(): string {
    const configured = getSqliteWebOptions().assetsPath;
    const base = typeof document !== 'undefined' ? document.baseURI : self.location.href;
    return new URL(configured ?? 'assets/databases/', base).href;
  }

  ////////////////////////////////////
  ////// UNIMPLEMENTED METHODS
  ////////////////////////////////////

  async getUrl(): Promise<capSQLiteUrl> {
    throw this.unimplemented('Not implemented on web.');
  }

  async getMigratableDbList(options: capSQLitePathOptions): Promise<capSQLiteValues> {
    console.log('getMigratableDbList', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log('addSQLiteSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log('deleteOldDatabases', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async moveDatabasesAndAddSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log('moveDatabasesAndAddSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isSecretStored(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log('setEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log('changeEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async clearEncryptionSecret(): Promise<void> {
    console.log('clearEncryptionSecret');
    throw this.unimplemented('Not implemented on web.');
  }

  async checkEncryptionSecret(options: capSetSecretOptions): Promise<capSQLiteResult> {
    console.log('checkEncryptionPassPhrase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async getNCDatabasePath(options: capNCDatabasePathOptions): Promise<capNCDatabasePathResult> {
    console.log('getNCDatabasePath', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async createNCConnection(options: capNCConnectionOptions): Promise<void> {
    console.log('createNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async closeNCConnection(options: capNCOptions): Promise<void> {
    console.log('closeNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isNCDatabase(options: capNCOptions): Promise<capSQLiteResult> {
    console.log('isNCDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isDatabaseEncrypted(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('isDatabaseEncrypted', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigEncryption(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigBiometricAuth(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async loadExtension(options: capSQLiteExtensionPath): Promise<void> {
    console.log('loadExtension', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async enableLoadExtension(options: capSQLiteExtensionEnable): Promise<void> {
    console.log('enableLoadExtension', options);
    throw this.unimplemented('Not implemented on web.');
  }
}
