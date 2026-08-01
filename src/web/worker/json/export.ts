/**
 * exportToJson, ported from `electron/src/electron-utils/ImportExportJson/exportToJson.ts`
 * (MIT, this repo), cross-checked against jeep-sqlite (MIT).
 *
 * One behaviour is web-specific and deliberate (PLAN 6.3 / M0 finding S3): sqlite-wasm returns
 * int64 values above 2^53 as `BigInt`, and `JSON.stringify` throws `TypeError` on those. Since
 * the whole point of this method is to hand the caller something they will stringify, every
 * value is passed through `jsonSafeValue` on the way out. Safe integers stay numbers; anything
 * that a double cannot hold exactly becomes its decimal string, which SQLite's INTEGER affinity
 * converts back to the identical int64 on import. Converting to Number instead would silently
 * corrupt exactly the values BigInt exists to protect.
 */
import type { JsonColumn, JsonIndex, JsonSQLite, JsonTable, JsonTrigger, JsonView } from '../../../definitions';
import type { Connection } from '../engine';

import { exportableTables, tableColumnNamesTypes } from './schema';
import { checkIndexesValidity, checkSchemaValidity, checkTriggersValidity } from './validate';

export type ProgressFn = (message: string) => void;

/** JSON cannot carry BigInt. Keep the value, change the carrier. */
export function jsonSafeValue(value: any): any {
  if (typeof value !== 'bigint') return value;
  return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(value)
    : value.toString();
}

/**
 * Commas inside nested parentheses are not column separators. Replacing them with a sentinel
 * before splitting, then restoring them, is the port source's approach and it is kept because
 * the resulting schema strings have to match what the format already documents.
 */
function maskNestedCommas(input: string): string {
  let depth = 0;
  let out = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    out += ch === ',' && depth > 0 ? '§' : ch;
  }
  return out;
}

export function parseSchema(createSql: string): JsonColumn[] {
  const open = createSql.indexOf('(');
  const close = createSql.lastIndexOf(')');
  const body = maskNestedCommas(createSql.substring(open + 1, close));
  const schema: JsonColumn[] = [];

  for (const part of body.split(',')) {
    const text = part.replace(/\n/g, ' ').trim();
    if (text.length === 0) continue;
    const firstWord = text.substring(0, text.indexOf(' ') === -1 ? text.length : text.indexOf(' '));
    const rest = text.indexOf(' ') === -1 ? '' : text.substring(text.indexOf(' ') + 1);
    const entry: JsonColumn = {} as JsonColumn;
    let value = rest;

    switch (firstWord.toUpperCase()) {
      case 'FOREIGN': {
        const oPar = text.indexOf('(');
        const cPar = text.indexOf(')');
        entry.foreignkey = text
          .substring(oPar + 1, cPar)
          .split('§')
          .map((s) => s.trim())
          .join(',');
        value = text.substring(cPar + 2);
        break;
      }
      case 'PRIMARY':
      case 'UNIQUE': {
        const prefix = firstWord.toUpperCase() === 'PRIMARY' ? 'CPK_' : 'CUN_';
        const oPar = text.indexOf('(');
        const cPar = text.indexOf(')');
        entry.constraint =
          prefix +
          text
            .substring(oPar + 1, cPar)
            .split('§')
            .map((s) => s.trim())
            .join('_');
        value = text;
        break;
      }
      case 'CONSTRAINT': {
        const trimmed = rest.trim();
        entry.constraint = trimmed.substring(0, trimmed.indexOf(' '));
        value = trimmed.substring(trimmed.indexOf(' ') + 1);
        break;
      }
      default: {
        entry.column = firstWord;
        break;
      }
    }
    entry.value = value.replace(/§/g, ',');
    schema.push(entry);
  }
  return schema;
}

export function getIndexes(conn: Connection, table: string): JsonIndex[] {
  const rows = conn.query(
    "SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql NOTNULL",
    [table],
  );
  return rows.map((row: any) => {
    const sql: string = row.sql;
    const index: JsonIndex = {} as JsonIndex;
    index.name = row.name;
    index.value = sql.slice(sql.lastIndexOf('(') + 1, sql.lastIndexOf(')'));
    if (sql.includes('UNIQUE')) index.mode = 'UNIQUE';
    return index;
  });
}

export function getTriggers(conn: Connection, table: string): JsonTrigger[] {
  const rows = conn.query(
    "SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ? AND sql NOT NULL",
    [table],
  );
  return rows.map((row: any) => {
    const sql: string = row.sql;
    const name: string = row.name;
    const afterName = sql.split(name);
    if (afterName.length < 2) throw new Error(`GetTriggers: sql split name does not return 2 values`);
    if (!afterName[1].includes(table)) throw new Error(`GetTriggers: sql split does not contain ${table}`);
    const timeevent = afterName[1].split(table, 1)[0].trim();
    const afterTable = afterName[1].split(`${timeevent} ${table}`);
    if (afterTable.length < 2) throw new Error(`GetTriggers: sql split tableName does not return 2 values`);

    const trigger: JsonTrigger = {} as JsonTrigger;
    trigger.name = name;
    trigger.timeevent = timeevent;
    const tail = afterTable[1].trim();
    if (tail.substring(0, 5).toUpperCase() !== 'BEGIN') {
      const parts = tail.split('BEGIN');
      if (parts.length < 2) throw new Error(`GetTriggers: sql split BEGIN does not return 2 values`);
      trigger.condition = parts[0].trim();
      trigger.logic = 'BEGIN' + parts.slice(1).join('BEGIN');
    } else {
      trigger.logic = tail;
    }
    return trigger;
  });
}

/** Rows as arrays in declared column order, which is the shape the JSON format uses. */
export function getValues(conn: Connection, query: string, table: string, bind: any[] = []): any[][] {
  const { names } = tableColumnNamesTypes(conn, table);
  if (names.length === 0) throw new Error(`GetValues: Table ${table} no names`);
  return conn
    .query(query, bind)
    .map((row: any) => names.map((name) => (Object.keys(row).includes(name) ? jsonSafeValue(row[name]) : 'NULL')));
}

export function getViews(conn: Connection): JsonView[] {
  return conn
    .query("SELECT name, sql FROM sqlite_master WHERE type = 'view' AND name NOT LIKE 'sqlite_%'")
    .map((row: any) => ({ name: row.name, value: row.sql.substring(row.sql.indexOf('AS ') + 3) }));
}

export function getSyncDate(conn: Connection): number {
  const rows = conn.query('SELECT sync_date FROM sync_table WHERE id = ?', [1]);
  if (rows.length === 0) throw new Error('GetSyncDate: no syncDate');
  return Number(rows[0][Object.keys(rows[0])[0]]);
}

export function getLastExportDate(conn: Connection): number {
  const rows = conn.query('SELECT sync_date FROM sync_table WHERE id = ?', [2]);
  if (rows.length === 0) return -1;
  return Number(rows[0][Object.keys(rows[0])[0]]);
}

export function setLastExportDate(conn: Connection, isoDate: string): void {
  if (!conn.tableExists('sync_table')) throw new Error('SetLastExportDate: No sync_table available');
  const seconds = Math.round(new Date(isoDate).getTime() / 1000);
  const statement =
    getLastExportDate(conn) > 0
      ? `UPDATE sync_table SET sync_date = ${seconds} WHERE id = 2;`
      : `INSERT INTO sync_table (sync_date) VALUES (${seconds});`;
  conn.executeBatch(statement);
}

function buildTable(
  conn: Connection,
  name: string,
  createSql: string,
  withSchema: boolean,
  query: string,
  bind: any[],
): JsonTable {
  const table: JsonTable = {} as JsonTable;
  table.name = name;

  if (withSchema) {
    const schema = parseSchema(createSql);
    if (schema.length === 0) throw new Error(`GetTables: no Schema returned for ${name}`);
    checkSchemaValidity(schema);
    table.schema = schema;

    const indexes = getIndexes(conn, name);
    if (indexes.length > 0) {
      checkIndexesValidity(indexes);
      table.indexes = indexes;
    }
    const triggers = getTriggers(conn, name);
    if (triggers.length > 0) {
      checkTriggersValidity(triggers);
      table.triggers = triggers;
    }
  }

  const values = getValues(conn, query, name, bind);
  if (values.length > 0) table.values = values;
  return table;
}

function getTablesFull(conn: Connection, tables: { name: string; sql: string }[], progress: ProgressFn): JsonTable[] {
  const out: JsonTable[] = [];
  for (const rTable of tables) {
    if (!rTable.name) throw new Error('GetTablesFull: no name');
    if (!rTable.sql) throw new Error('GetTablesFull: no sql');
    out.push(buildTable(conn, rTable.name, rTable.sql, true, `SELECT * FROM ${rTable.name};`, []));
    progress(`Table ${rTable.name} exported`);
  }
  return out;
}

/**
 * Partial mode exports only what changed since the stored sync date. A table whose rows have
 * ALL changed is treated as new and exported with its schema; a partially changed table ships
 * rows only; an unchanged table is skipped.
 */
function getTablesPartial(
  conn: Connection,
  tables: { name: string; sql: string }[],
  progress: ProgressFn,
): JsonTable[] {
  const syncDate = getSyncDate(conn);
  if (syncDate <= 0) throw new Error('GetPartialModeData: no syncDate');

  const out: JsonTable[] = [];
  for (const rTable of tables) {
    const total = Number(conn.query(`SELECT count(*) AS n FROM ${rTable.name}`)[0].n);
    const modified = Number(
      conn.query(`SELECT count(*) AS n FROM ${rTable.name} WHERE last_modified > ?`, [syncDate])[0].n,
    );
    if (modified === 0) continue;
    const isCreate = total === modified;
    const query = isCreate
      ? `SELECT * FROM ${rTable.name};`
      : `SELECT * FROM ${rTable.name} WHERE last_modified > ${syncDate};`;
    out.push(buildTable(conn, rTable.name, rTable.sql, isCreate, query, []));
    progress(`Table ${rTable.name} exported`);
  }
  return out;
}

export function exportJson(conn: Connection, database: string, mode: string, progress: ProgressFn): JsonSQLite {
  const hasSyncTable = conn.tableExists('sync_table');
  if (hasSyncTable) {
    setLastExportDate(conn, new Date().toISOString());
  } else if (mode === 'partial') {
    throw new Error('ExportToJson: No sync_table available');
  }

  progress('Start creating the export object');
  const views = getViews(conn);
  const resTables = exportableTables(conn);
  if (resTables.length === 0) throw new Error("ExportToJson: table's names failed");

  let tables: JsonTable[];
  if (mode === 'partial') tables = getTablesPartial(conn, resTables, progress);
  else if (mode === 'full') tables = getTablesFull(conn, resTables, progress);
  else throw new Error(`ExportToJson: expMode ${mode} not defined`);

  const out: JsonSQLite = {} as JsonSQLite;
  if (tables.length > 0) {
    out.database = database;
    out.version = conn.userVersion();
    out.encrypted = false;
    out.mode = mode;
    out.tables = tables;
    if (views.length > 0) out.views = views;
  }
  progress(`Export object created, ${tables.length} table(s)`);
  return out;
}
