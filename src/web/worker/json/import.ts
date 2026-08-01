/**
 * importFromJson, ported from `electron/src/electron-utils/ImportExportJson/importFromJson.ts`
 * and `utilsJson.ts` (MIT, this repo), cross-checked against jeep-sqlite (MIT).
 *
 * Row semantics carried over verbatim, because they are the format's contract:
 *
 * - `mode: 'full'` drops every table first and inserts; `mode: 'partial'` inserts rows whose
 *   first-column key is absent and updates the rest.
 * - In partial mode a row whose `sql_deleted` column is 1 becomes a real DELETE, which is how a
 *   soft delete replicates from the server into a client database.
 * - An UPDATE is skipped entirely when the stored row already matches, so importing the same
 *   payload twice reports no changes rather than churning `last_modified`.
 * - A value that arrives as an array of numbers is a BLOB and is converted back to Uint8Array.
 */
import type { JsonSQLite, JsonTable } from '../../../definitions';
import { EV_IMPORT_PROGRESS } from '../../protocol';
import type { Connection } from '../engine';

import { createSchema, createViews, tableColumnNamesTypes } from './schema';

export type ProgressFn = (message: string) => void;

/** Drop everything a `mode: 'full'` import is about to recreate. */
function dropAll(conn: Connection): void {
  const drops: string[] = [];
  for (const type of ['table', 'index', 'trigger', 'view']) {
    const extra = type === 'table' ? " AND name NOT IN ('sync_table')" : '';
    const rows = conn.query(
      `SELECT name FROM sqlite_master WHERE type = '${type}' AND name NOT LIKE 'sqlite_%'${extra}`,
    );
    for (const row of rows) drops.push(`DROP ${type.toUpperCase()} IF EXISTS ${row.name};`);
  }
  if (drops.length > 0) conn.executeBatch(drops.join('\n'));
  conn.executeBatch('VACUUM;');
}

/** An array of plain numbers in a value row is a BLOB in transit. */
export function reviveRowBlobs(row: any[]): any[] {
  return row.map((value) =>
    Array.isArray(value) && value.every((item: any) => typeof item === 'number') ? Uint8Array.from(value) : value,
  );
}

function quoteKey(value: any): string {
  return typeof value === 'string' ? `'${String(value).replace(/'/g, "''")}'` : `${value}`;
}

function keyExists(conn: Connection, table: string, keyColumn: string, key: any): boolean {
  const rows = conn.query(`SELECT ${keyColumn} FROM ${table} WHERE ${keyColumn} = ?`, [key]);
  return rows.length === 1;
}

/** INSERT, UPDATE or DELETE for one value row, decided the way the port source decides it. */
export function rowStatement(
  conn: Connection,
  columnNames: string[],
  row: any[],
  rowIndex: number,
  table: string,
  mode: string,
): string {
  if (row.length !== columnNames.length || row.length === 0) {
    throw new Error(`CreateRowStatement: Table ${table} values row ${rowIndex} not correct length`);
  }
  const exists = keyExists(conn, table, columnNames[0], row[0]);

  if (mode === 'full' || (mode === 'partial' && !exists)) {
    const marks = columnNames.map(() => '?').join(',');
    return `INSERT INTO ${table} (${columnNames.join(',')}) VALUES (${marks});`;
  }

  const deletedIndex = columnNames.indexOf('sql_deleted');
  if (deletedIndex >= 0 && row[deletedIndex] === 1) {
    return `DELETE FROM ${table} WHERE ${columnNames[0]} = ${quoteKey(row[0])};`;
  }
  const setClause = columnNames.map((name) => `${name} = ?`).join(' ,');
  return `UPDATE ${table} SET ${setClause} WHERE ${columnNames[0]} = ${quoteKey(row[0])};`;
}

/** Read the stored row back in column order, so an UPDATE can be skipped when nothing changed. */
function storedRow(conn: Connection, table: string, columnNames: string[], key: any): any[] {
  const rows = conn.query(`SELECT * FROM ${table} WHERE ${columnNames[0]} = ?`, [key]);
  if (rows.length === 0) return [];
  return columnNames.map((name) => (Object.keys(rows[0]).includes(name) ? rows[0][name] : 'NULL'));
}

function sameValues(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (left instanceof Uint8Array && right instanceof Uint8Array) {
      if (left.length !== right.length) return false;
      for (let j = 0; j < left.length; j++) if (left[j] !== right[j]) return false;
      continue;
    }
    // Loose on purpose: an int64 read back as BigInt must compare equal to the number that
    // produced it, which is exactly the case `==` handles and `===` does not.
    // eslint-disable-next-line eqeqeq
    if (left != right) return false;
  }
  return true;
}

function createTableData(conn: Connection, table: JsonTable, mode: string, progress: ProgressFn): number {
  if (!table.values || table.values.length === 0) return 0;
  if (!conn.tableExists(table.name)) {
    throw new Error(`CreateDataTable: ${table.name} does not exist`);
  }
  const { names } = tableColumnNamesTypes(conn, table.name);
  if (names.length === 0) throw new Error(`CreateDataTable: ${table.name} info does not exist`);

  let changes = 0;
  for (let i = 0; i < table.values.length; i++) {
    const row = reviveRowBlobs(table.values[i]);
    const statement = rowStatement(conn, names, row, i, table.name, mode);

    if (statement.startsWith('UPDATE')) {
      const stored = storedRow(conn, table.name, names, row[0]);
      if (stored.length > 0 && sameValues(row, stored)) continue;
    }
    const bind = statement.startsWith('DELETE') ? [] : row;
    // rewriteDeletes = false: a row arriving with sql_deleted = 1 is replicating a deletion that
    // already happened upstream, so it must remove the local row rather than re-mark it.
    changes += conn.run(statement, bind, false, false).changes;
  }
  progress.call(null, `Table ${table.name} data imported`);
  return changes;
}

export function importJson(conn: Connection, jsonData: JsonSQLite, progress: ProgressFn): number {
  let changes = 0;
  conn.setForeignKeyConstraintsEnabled(false);
  try {
    if (jsonData.tables && jsonData.tables.length > 0) {
      conn.setUserVersion(jsonData.version);
      if (jsonData.mode === 'full') dropAll(conn);

      progress('Start creating the database schema');
      changes = createSchema(conn, jsonData);
      progress(`Schema creation completed changes: ${changes}`);

      progress('Start importing the tables data');
      changes += conn.withOptionalTransaction(true, () => {
        let dataChanges = 0;
        for (const table of jsonData.tables) {
          dataChanges += createTableData(conn, table, jsonData.mode, progress);
        }
        return dataChanges;
      });
      progress(`Tables data import completed changes: ${changes}`);
    }
    if (jsonData.views && jsonData.views.length > 0) {
      progress('Start creating the views');
      changes += createViews(conn, jsonData.views);
      progress(`Views creation completed changes: ${changes}`);
    }
  } finally {
    conn.setForeignKeyConstraintsEnabled(true);
  }
  return changes;
}

export { EV_IMPORT_PROGRESS };
