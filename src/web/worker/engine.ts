/**
 * Thin wrapper over sqlite-wasm's oo1 API.
 *
 * The semantics are the ones `electron/src/electron-utils/utilsSQLite.ts` (MIT, this repo)
 * defines over better-sqlite3: `changes` is a `total_changes()` delta, `lastId` comes from
 * `last_insert_rowid()`, and `execute` runs a whole batch. Two deliberate differences:
 *
 * - changes and lastId are read inside the same worker op as the statement, so nothing can
 *   interleave between the write and the read.
 * - RETURNING is executed directly. better-sqlite3 cannot step a RETURNING statement with
 *   `.run()`, which is why the electron port strips the clause and re-selects by rowid range;
 *   sqlite-wasm has no such limit, so the rows come straight from the statement that produced
 *   them and the rowid-range race disappears.
 */
import { prefixed } from '../errors';
import type { ExecResult } from '../protocol';

import type { ForeignKey } from './cascade';
import { cascadeSoftDelete, foreignKeys, resolveTableName } from './cascade';
import {
  extractTableName,
  extractWhereClause,
  producesRows,
  replaceUndefinedByNull,
  quoteIdent,
  softDeleteRewrite,
  splitStatements,
  statementKind,
  stripNoise,
} from './statements';

/** Statement kinds that can change the schema, and therefore every cached answer about it. */
const DDL = new Set(['CREATE', 'DROP', 'ALTER']);

export class Connection {
  private transactionActive = false;
  /**
   * Whether this database participates in the soft-delete protocol, cached because answering it
   * means a PRAGMA per table. Invalidated whenever DDL runs, since that is the only thing that
   * can add or remove the `last_modified` / `sql_deleted` pair.
   */
  private syncEnabledCache: boolean | null = null;
  /** The foreign-key graph, cached for the same reason and invalidated at the same points. */
  private foreignKeyCache: ForeignKey[] | null = null;
  /** Per-table answer to "does a DELETE here get recorded", same invalidation again. */
  private softDeleteCache = new Map<string, boolean>();

  constructor(
    readonly storage: string,
    readonly isReadonly: boolean,
    private readonly db: any,
    private readonly sqlite3: any,
  ) {}

  get pointer(): number {
    return this.db.pointer;
  }

  /** The oo1 handle. Needed by the tier 2 deserialize path; nothing else should reach for it. */
  get raw(): any {
    return this.db;
  }

  get isOpen(): boolean {
    return !!this.db.pointer;
  }

  close(): void {
    this.db.close();
  }

  private totalChanges(): number {
    return this.db.changes(true, false);
  }

  private lastInsertRowid(): number {
    return Number(this.sqlite3.capi.sqlite3_last_insert_rowid(this.db.pointer));
  }

  userVersion(): number {
    return Number(this.db.selectValue('PRAGMA user_version') ?? 0);
  }

  setUserVersion(version: number): void {
    this.db.exec(`PRAGMA user_version = ${Math.trunc(version)}`);
  }

  /**
   * Tier 2 opens `:memory:` with create flags because a deserialize needs a writable handle, so
   * a read-only connection is enforced here instead of by the open flags. Tier 1 gets the real
   * thing from the 'r' flag and does not need this.
   */
  setQueryOnly(on: boolean): void {
    this.db.exec(`PRAGMA query_only = ${on ? 'ON' : 'OFF'}`);
  }

  setForeignKeyConstraintsEnabled(enabled: boolean): void {
    this.db.exec(`PRAGMA foreign_keys = ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Gate for the DELETE rewrite. The port source keys off the columns rather than the presence
   * of `sync_table`, so a database gains soft-delete behaviour as soon as its schema declares
   * the pair, which is also when `createSyncTable` will accept it.
   */
  get syncEnabled(): boolean {
    if (this.syncEnabledCache === null) {
      this.syncEnabledCache = hasSyncColumns(this);
    }
    return this.syncEnabledCache;
  }

  /** Every foreign key in the database, for the soft-delete cascade. Same caching as syncEnabled. */
  get foreignKeyGraph(): ForeignKey[] {
    if (this.foreignKeyCache === null) this.foreignKeyCache = foreignKeys(this);
    return this.foreignKeyCache;
  }

  /**
   * Whether a DELETE against this particular table should be recorded rather than performed.
   *
   * `syncEnabled` is a property of the database, because that is what the port source checks, but
   * it cannot be the whole answer: a schema where one table is sync-tracked and another is not is
   * legal, and rewriting a DELETE against the second produces `SET sql_deleted = 1` on a table
   * with no such column. The port source has the same hole; here the target table has to carry
   * the column too.
   */
  softDeletes(table: string | null): boolean {
    if (!table || !this.syncEnabled) return false;
    const key = table.toLowerCase();
    let known = this.softDeleteCache.get(key);
    if (known === undefined) {
      try {
        // The name arrives as the caller wrote it, which may already be quoted or qualified.
        const bare = resolveTableName(table);
        known = this.query(`PRAGMA table_info(${quoteIdent(bare)})`).some((row: any) => row.name === 'sql_deleted');
      } catch {
        // A name this cannot resolve. Fall back to the database-wide answer, which is what this
        // did before the gate existed, rather than failing a delete that used to work.
        known = true;
      }
      this.softDeleteCache.set(key, known);
    }
    return known;
  }

  invalidateSyncCache(): void {
    this.syncEnabledCache = null;
    this.foreignKeyCache = null;
    this.softDeleteCache.clear();
  }

  /**
   * A batch of raw statements, as `execute()` receives it.
   *
   * A DELETE in a batch is soft-deleted exactly as one passed to `run` would be. The port source
   * does this too (`utilsSQLite.statementsToSQL92` routes every DELETE through `deleteSQL`), and
   * without it `execute('DELETE FROM t WHERE ...')` physically removes rows from a sync-tracked
   * database while `run` of the same statement records them, so which entry point the app happened
   * to use decides whether the server ever hears about the deletion.
   *
   * The batch is only split when it needs to be. Handing the whole string to sqlite in one call is
   * both faster and less exposed to the splitter, so that stays the path for everything else.
   */
  executeBatch(statements: string): ExecResult {
    this.invalidateSyncCache();
    const before = this.totalChanges();
    try {
      // Cheap test first: `syncEnabled` costs a PRAGMA per table, and the overwhelming majority
      // of batches are schema and inserts with no DELETE in them at all.
      if (/\bDELETE\b/i.test(stripNoise(statements)) && this.syncEnabled) {
        for (const statement of splitStatements(statements)) {
          if (statementKind(statement) === 'DELETE') this.run(statement, [], false);
          else this.db.exec(statement);
        }
      } else {
        this.db.exec(statements);
      }
    } catch (err) {
      throw prefixed('Execute', err);
    }
    return { changes: this.totalChanges() - before, lastId: this.lastInsertRowid() };
  }

  /**
   * One statement with its bind values. `wantRows` collects RETURNING / SELECT output.
   *
   * `rewriteDeletes` is the equivalent of the port source's `fromJson` flag. A DELETE the
   * plugin generates itself must run as a real delete: `deleteExportedRows` exists precisely to
   * reclaim soft-deleted rows, and a JSON import replicating a server-side deletion has already
   * been told the row is gone. Rewriting those would make both operations no-ops.
   */
  run(rawStatement: string, values: any[] | undefined, wantRows: boolean, rewriteDeletes = true): ExecResult {
    const bind = replaceUndefinedByNull(values);
    const isDelete = rewriteDeletes && statementKind(rawStatement) === 'DELETE';
    const table = isDelete ? extractTableName(rawStatement) : null;
    const soft = isDelete && this.softDeletes(table);
    const statement = soft ? softDeleteRewrite(rawStatement, true) : rawStatement;

    const before = this.totalChanges();
    const exec = () => {
      // The cascade runs inside the changes window on purpose: a real DELETE with ON DELETE
      // CASCADE counts the rows its actions touched in total_changes, and a soft delete of the
      // same rows should not report a different number just because the deletion is being
      // recorded rather than performed.
      if (soft && table) {
        const where = extractWhereClause(rawStatement);
        if (where) cascadeSoftDelete(this, table, where.endsWith(';') ? where.slice(0, -1) : where, bind);
      }
      let rows: any[] | undefined;
      try {
        if (wantRows) {
          rows = this.db.exec({
            sql: statement,
            bind: bind.length > 0 ? bind : undefined,
            rowMode: 'object',
            returnValue: 'resultRows',
          });
        } else {
          this.db.exec({ sql: statement, bind: bind.length > 0 ? bind : undefined });
        }
      } catch (err) {
        throw prefixed('Run', err);
      }
      return rows;
    };

    // A soft delete is a tree of UPDATEs, so it has to be all or nothing: a RESTRICT discovered
    // three levels down, or any other failure mid-walk, must not leave half the subtree marked.
    // withOptionalTransaction is a no-op when the caller already opened one.
    const rows = soft ? this.withOptionalTransaction(true, exec) : exec();

    // DDL does not only arrive through execute(). A CREATE TABLE issued with run() used to leave
    // the cached schema answers in place, so a foreign key added that way was invisible to the
    // next cascade and its children were never marked: exactly the silent divergence the cascade
    // exists to prevent.
    if (DDL.has(statementKind(rawStatement))) this.invalidateSyncCache();

    const result: ExecResult = { changes: this.totalChanges() - before, lastId: this.lastInsertRowid() };
    if (rows !== undefined) result.values = rows;
    return result;
  }

  query(statement: string, values?: any[]): any[] {
    const bind = replaceUndefinedByNull(values);
    try {
      return this.db.exec({
        sql: statement,
        bind: bind.length > 0 ? bind : undefined,
        rowMode: 'object',
        returnValue: 'resultRows',
      });
    } catch (err) {
      throw prefixed('Query', err);
    }
  }

  beginTransaction(): void {
    if (this.transactionActive) throw new Error('a transaction is already active');
    this.db.exec('BEGIN TRANSACTION;');
    this.transactionActive = true;
  }

  commitTransaction(): void {
    if (!this.transactionActive) throw new Error('no transaction is active');
    this.db.exec('COMMIT TRANSACTION;');
    this.transactionActive = false;
  }

  rollbackTransaction(): void {
    if (!this.transactionActive) throw new Error('no transaction is active');
    this.db.exec('ROLLBACK TRANSACTION;');
    this.transactionActive = false;
  }

  get isTransactionActive(): boolean {
    return this.transactionActive;
  }

  /**
   * Run `body` inside a transaction the caller asked for, but never nest: `execute`/`run` default
   * to transaction=true and are routinely called from inside an explicit beginTransaction().
   */
  withOptionalTransaction<T>(wanted: boolean, body: () => T): T {
    const own = wanted && !this.transactionActive;
    if (!own) return body();
    this.beginTransaction();
    try {
      const out = body();
      this.commitTransaction();
      return out;
    } catch (err) {
      try {
        this.rollbackTransaction();
      } catch {
        this.transactionActive = false;
      }
      throw err;
    }
  }

  tableList(): any[] {
    return this.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    ).map((row: any) => row.name);
  }

  tableExists(table: string): boolean {
    const found = this.db.selectValue("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
    return Number(found ?? 0) > 0;
  }

  /** Whole-file image, used by tier 2 flushes and by exportDb. */
  serialize(): Uint8Array {
    return this.sqlite3.capi.sqlite3_js_db_export(this.db.pointer);
  }
}

/** Statement-level helper shared by run/executeSet so both decide row collection identically. */
export function wantsRows(statement: string, returnMode: string | undefined): boolean {
  if (returnMode === 'all' || returnMode === 'one') return producesRows(statement);
  return false;
}

/**
 * Local copy of the sync-column probe. It lives here rather than in `sync.ts` to avoid a
 * circular import: `sync.ts` needs Connection, and Connection needs this answer.
 */
function hasSyncColumns(conn: Connection): boolean {
  let lastModified = false;
  let sqlDeleted = false;
  for (const table of conn.tableList()) {
    if (table === 'sync_table') continue;
    for (const row of conn.query(`PRAGMA table_info(${quoteIdent(table)})`)) {
      if (row.name === 'last_modified') lastModified = true;
      if (row.name === 'sql_deleted') sqlDeleted = true;
    }
    if (lastModified && sqlDeleted) return true;
  }
  return false;
}
