/**
 * Turning a JsonSQLite object back into DDL, ported from
 * `electron/src/electron-utils/ImportExportJson/utilsJson.ts` (MIT, this repo) and
 * cross-checked against jeep-sqlite (MIT).
 *
 * The one piece of behaviour worth knowing about: a table that declares BOTH `last_modified`
 * and `sql_deleted` columns gets an automatic `<table>_trigger_last_modified` trigger. That
 * pair is what marks a table as participating in the sync protocol, and the same pair is what
 * `statements.ts` looks for when deciding to rewrite a DELETE into a soft delete.
 */
import type { JsonSQLite, JsonTable, JsonView } from '../../../definitions';
import type { Connection } from '../engine';
import { quoteIdent } from '../statements';

export function createSchemaStatements(jsonData: JsonSQLite): string[] {
  const statements: string[] = [];

  for (const jTable of jsonData.tables ?? []) {
    if (jTable.schema != null && jTable.schema.length >= 1) {
      let hasLastModified = false;
      let hasSqlDeleted = false;
      const columns: string[] = [];

      for (const entry of jTable.schema) {
        if (entry.column) {
          columns.push(`${entry.column} ${entry.value}`);
          if (entry.column === 'last_modified') hasLastModified = true;
          if (entry.column === 'sql_deleted') hasSqlDeleted = true;
        } else if (entry.foreignkey) {
          columns.push(`FOREIGN KEY (${entry.foreignkey}) ${entry.value}`);
        } else if (entry.constraint) {
          columns.push(`CONSTRAINT ${entry.constraint} ${entry.value}`);
        }
      }
      statements.push(`CREATE TABLE IF NOT EXISTS ${jTable.name} (${columns.join(',')});`);

      if (hasLastModified && hasSqlDeleted) {
        statements.push(
          `CREATE TRIGGER IF NOT EXISTS ${jTable.name}_trigger_last_modified ` +
            `AFTER UPDATE ON ${jTable.name} ` +
            `FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified BEGIN ` +
            `UPDATE ${jTable.name} SET last_modified = (strftime('%s','now')) WHERE id=OLD.id; END;`,
        );
      }
    }

    for (const jIndex of jTable.indexes ?? []) {
      const mode = jIndex.mode ? `${jIndex.mode} ` : '';
      statements.push(`CREATE ${mode}INDEX IF NOT EXISTS ${jIndex.name} ON ${jTable.name} (${jIndex.value});`);
    }

    for (const jTrigger of jTable.triggers ?? []) {
      let timeevent = jTrigger.timeevent;
      if (timeevent.toUpperCase().endsWith(' ON')) timeevent = timeevent.substring(0, timeevent.length - 3);
      const condition = jTrigger.condition ? `${jTrigger.condition} ` : '';
      statements.push(
        `CREATE TRIGGER IF NOT EXISTS ${jTrigger.name} ${timeevent} ON ${jTable.name} ${condition}${jTrigger.logic};`,
      );
    }
  }

  return statements;
}

export function createSchema(conn: Connection, jsonData: JsonSQLite): number {
  const statements = createSchemaStatements(jsonData);
  if (statements.length === 0) return 0;
  return conn.withOptionalTransaction(true, () => conn.executeBatch(statements.join('\n')).changes);
}

export function createViews(conn: Connection, views: JsonView[]): number {
  if (!views || views.length === 0) return 0;
  return conn.withOptionalTransaction(true, () => {
    let changes = 0;
    for (const view of views) {
      if (view.value == null) continue;
      changes += conn.executeBatch(`CREATE VIEW IF NOT EXISTS ${view.name} AS ${view.value};`).changes;
    }
    return changes;
  });
}

/** Column names and declared types for a table, as PRAGMA table_info reports them. */
export function tableColumnNamesTypes(conn: Connection, table: string): { names: string[]; types: string[] } {
  const rows = conn.query(`PRAGMA table_info(${quoteIdent(table)})`);
  return {
    names: rows.map((row: any) => row.name),
    types: rows.map((row: any) => row.type),
  };
}

export function tableExists(conn: Connection, table: string): boolean {
  return conn.tableExists(table);
}

export function tableNames(conn: Connection): string[] {
  return conn
    .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map((row: any) => row.name);
}

/** Tables eligible for export: user tables, excluding sync bookkeeping and temporaries. */
export function exportableTables(conn: Connection): { name: string; sql: string }[] {
  return conn.query(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' " +
      "AND name NOT LIKE 'sync_table' AND name NOT LIKE '_temp_%' AND name NOT LIKE 'sqlite_%'",
  ) as { name: string; sql: string }[];
}

export function tableFromName(jsonData: JsonSQLite, name: string): JsonTable | undefined {
  return (jsonData.tables ?? []).find((t) => t.name === name);
}
