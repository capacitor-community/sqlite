/**
 * Sync-table support, ported from `electron/src/electron-utils/Database.ts` and
 * `ImportExportJson/exportToJson.ts` (MIT, this repo), cross-checked against jeep-sqlite (MIT),
 * whose implementation is the same logic under the same names.
 *
 * The convention (documented in `docs/info_releases.md:36-56`): a database opts into sync by
 * giving its tables both a `last_modified` and a `sql_deleted` column. Once `sync_table` exists,
 * a DELETE becomes a soft delete (`statements.ts`), and `deleteExportedRows` is what finally
 * removes rows that a completed export has already carried away.
 *
 * Two rows in `sync_table` matter: id 1 is the synchronisation date set by `setSyncDate`, id 2
 * is the last export date written by `exportToJson`.
 */
import type { Connection } from './engine';
import { quoteIdent } from './statements';

export const SYNC_TABLE = 'sync_table';

/** Does any user table carry the named column? That is what marks sync participation. */
function anyTableHasColumn(conn: Connection, column: string): boolean {
  for (const table of conn.tableList()) {
    if (table === SYNC_TABLE) continue;
    const rows = conn.query(`PRAGMA table_info(${quoteIdent(table)})`);
    if (rows.some((row: any) => row.name === column)) return true;
  }
  return false;
}

export function hasLastModified(conn: Connection): boolean {
  return anyTableHasColumn(conn, 'last_modified');
}

export function hasSqlDeleted(conn: Connection): boolean {
  return anyTableHasColumn(conn, 'sql_deleted');
}

/** True when this database participates in the soft-delete protocol. */
export function isSyncEnabled(conn: Connection): boolean {
  return hasLastModified(conn) && hasSqlDeleted(conn);
}

export function createSyncTable(conn: Connection): number {
  if (conn.tableExists(SYNC_TABLE)) return 0;
  if (!isSyncEnabled(conn)) {
    throw new Error('CreateSyncTable: No last_modified/sql_deleted columns in tables');
  }
  const seconds = Math.round(new Date().getTime() / 1000);
  const statements =
    `CREATE TABLE IF NOT EXISTS ${SYNC_TABLE} (id INTEGER PRIMARY KEY NOT NULL, sync_date INTEGER);` +
    `INSERT INTO ${SYNC_TABLE} (sync_date) VALUES (${seconds});`;
  return conn.executeBatch(statements).changes;
}

export function setSyncDate(conn: Connection, syncDate: string): void {
  if (!conn.tableExists(SYNC_TABLE)) throw new Error('SetSyncDate: No sync_table available');
  const seconds = Math.round(new Date(syncDate).getTime() / 1000);
  if (Number.isNaN(seconds)) throw new Error(`SetSyncDate: ${syncDate} is not a valid date`);
  conn.executeBatch(`UPDATE ${SYNC_TABLE} SET sync_date = ${seconds} WHERE id = 1;`);
}

export function getSyncDate(conn: Connection): number {
  if (!conn.tableExists(SYNC_TABLE)) throw new Error('GetSyncDate: No sync_table available');
  const rows = conn.query(`SELECT sync_date FROM ${SYNC_TABLE} WHERE id = ?`, [1]);
  if (rows.length === 0) throw new Error('GetSyncDate: no syncDate available');
  const value = Number(rows[0][Object.keys(rows[0])[0]]);
  if (!(value > 0)) throw new Error('GetSyncDate: no syncDate available');
  return value;
}

/**
 * Physically remove the rows a previous export already carried away: soft-deleted, and older
 * than the last export date written to `sync_table` id 2 by `exportToJson`.
 */
export function deleteExportedRows(conn: Connection): void {
  if (!conn.tableExists(SYNC_TABLE)) throw new Error('DeleteExportedRows: No sync_table available');
  const rows = conn.query(`SELECT sync_date FROM ${SYNC_TABLE} WHERE id = ?`, [2]);
  const lastExportDate = rows.length > 0 ? Number(rows[0][Object.keys(rows[0])[0]]) : -1;
  if (!(lastExportDate > 0)) {
    throw new Error('DeleteExportedRows: no last exported date available');
  }
  const tables = conn.tableList().filter((name: string) => name !== SYNC_TABLE);
  if (tables.length === 0) throw new Error("DeleteExportedRows: No table's names returned");

  conn.withOptionalTransaction(true, () => {
    for (const table of tables) {
      const columns = conn.query(`PRAGMA table_info(${quoteIdent(table)})`).map((row: any) => row.name);
      if (!columns.includes('sql_deleted') || !columns.includes('last_modified')) continue;
      // Bypass the rewrite: reclaiming soft-deleted rows is the one place a real DELETE is meant.
      conn.run(
        `DELETE FROM ${quoteIdent(table)} WHERE sql_deleted = 1 AND last_modified < ?`,
        [lastExportDate],
        false,
        false,
      );
    }
    return 0;
  });
}
