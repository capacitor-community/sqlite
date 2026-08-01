/**
 * Foreign-key propagation for the soft delete.
 *
 * A DELETE against a sync-enabled database is rewritten into `UPDATE ... SET sql_deleted = 1`
 * (`statements.ts`), which means sqlite never sees a delete and never fires the `ON DELETE`
 * actions the schema declares. Without this module the parent row is marked and its children are
 * not, so the next export tells the server the parent is gone while still reporting the children
 * live, and the two ends diverge with no error on either side.
 *
 * Ported in behaviour from `electron/src/electron-utils/utilsDelete.ts` and the
 * `findReferencesAndUpdate` / `getReferences` / `searchForRelatedItems` group in
 * `utilsSQLite.ts` (MIT, this repo), with three deliberate differences:
 *
 * 1. The relationships come from `PRAGMA foreign_key_list`, not from regex-matching
 *    `sqlite_master`. The port source's pattern only recognises table-level `FOREIGN KEY (...)
 *    REFERENCES` clauses, misses column-level `REFERENCES`, and reads only the first matching
 *    table, so a parent with two referencing tables cascades into one of them. The pragma is
 *    sqlite's own answer to the same question and has none of those limits.
 * 2. It recurses. The port source propagates one level, so grandchildren are left live under a
 *    deleted grandparent, which is the same divergence one level down.
 * 3. Affected rows are identified by `rowid` and marked before the recursion descends, which is
 *    what makes a cyclic or self-referencing schema terminate: a marked row no longer satisfies
 *    `sql_deleted = 0` and cannot be reached twice.
 */
import { messageOf } from '../errors';

import type { Connection } from './engine';
import { quoteIdent } from './statements';

/** sqlite's own spelling of the actions, as `PRAGMA foreign_key_list` reports them. */
export type DeleteAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export interface ForeignKey {
  /** The table holding the reference. */
  child: string;
  /** The parent it points at. */
  parent: string;
  /** Referencing columns, in constraint order. */
  from: string[];
  /** Referenced columns, resolved to the parent's primary key when the schema left them implicit. */
  to: string[];
  onDelete: DeleteAction;
}

/** How many rowids go into one `IN (...)` list. SQLITE_MAX_VARIABLE_NUMBER is far higher. */
const CHUNK = 500;

/**
 * Depth guard. Marking before descending already terminates cycles, so this is a backstop against
 * a case nobody foresaw rather than the mechanism that stops them. Set well above any tree an app
 * would build so a legitimate deep hierarchy is never refused.
 */
const MAX_DEPTH = 256;

function normalizeAction(value: unknown): DeleteAction {
  const action = String(value ?? 'NO ACTION')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  switch (action) {
    case 'CASCADE':
    case 'SET NULL':
    case 'SET DEFAULT':
    case 'RESTRICT':
      return action;
    default:
      return 'NO ACTION';
  }
}

/** Quoted identifier, so a table or column called `order` or `group` still works. */
const ident = quoteIdent;

/**
 * The bare table name behind whatever the caller wrote. `extractTableName` hands back the token
 * as it appeared in the statement, which may be quoted (`"my table"`, `[items]`) or qualified
 * (`main.items`), and neither form can be quoted again or compared against
 * `PRAGMA foreign_key_list` output.
 *
 * A qualifier other than `main` would mean an attached database, which this plugin never creates.
 * It is refused rather than silently skipped, because a cascade that quietly does nothing is the
 * failure this module exists to remove.
 */
export function resolveTableName(raw: string): string {
  let name = raw.trim();
  const qualified = name.match(/^([A-Za-z_][A-Za-z0-9_$]*)\.(.+)$/);
  if (qualified) {
    if (qualified[1].toLowerCase() !== 'main') {
      throw new Error(
        `Cascade: cannot follow foreign keys for ${raw}, which names an attached database. ` +
          'Reference the table without the schema qualifier.',
      );
    }
    name = qualified[2].trim();
  }
  if (name.startsWith('"') && name.endsWith('"')) return name.slice(1, -1).replace(/""/g, '"');
  if (name.startsWith('[') && name.endsWith(']')) return name.slice(1, -1);
  if (name.startsWith('`') && name.endsWith('`')) return name.slice(1, -1).replace(/``/g, '`');
  return name;
}

function primaryKeyColumns(conn: Connection, table: string): string[] {
  return conn
    .query(`PRAGMA table_info(${ident(table)})`)
    .filter((row: any) => Number(row.pk) > 0)
    .sort((a: any, b: any) => Number(a.pk) - Number(b.pk))
    .map((row: any) => String(row.name));
}

/**
 * Every foreign key in the database, grouped by constraint. `PRAGMA foreign_key_list` returns one
 * row per column of a composite key, sharing an `id`.
 */
export function foreignKeys(conn: Connection): ForeignKey[] {
  const out: ForeignKey[] = [];
  for (const child of conn.tableList()) {
    const rows = conn.query(`PRAGMA foreign_key_list(${ident(child)})`);
    const byConstraint = new Map<number, any[]>();
    for (const row of rows) {
      const id = Number((row as any).id);
      const list = byConstraint.get(id);
      if (list) list.push(row);
      else byConstraint.set(id, [row]);
    }
    for (const list of byConstraint.values()) {
      list.sort((a: any, b: any) => Number(a.seq) - Number(b.seq));
      const parent = String(list[0].table);
      const from = list.map((row: any) => String(row.from));
      // `to` is null when the constraint referenced the parent's primary key implicitly.
      const to = list.every((row: any) => row.to != null)
        ? list.map((row: any) => String(row.to))
        : primaryKeyColumns(conn, parent);
      if (to.length !== from.length) continue; // malformed or unresolvable, leave it to sqlite
      out.push({ child, parent, from, to, onDelete: normalizeAction(list[0].on_delete) });
    }
  }
  return out;
}

function columnDefault(conn: Connection, table: string, column: string): string {
  const row = conn.query(`PRAGMA table_info(${ident(table)})`).find((entry: any) => entry.name === column);
  const value = row ? (row as any).dflt_value : null;
  return value === null || value === undefined ? 'NULL' : String(value);
}

/**
 * `rowid` is how an affected row is carried between steps. A WITHOUT ROWID table has none, and
 * silently skipping it would be exactly the divergence this module exists to prevent, so it is
 * reported instead.
 */
function rowidsOf(conn: Connection, table: string, where: string, values: any[]): number[] {
  try {
    return conn
      .query(`SELECT rowid AS rid FROM ${ident(table)} WHERE ${where}`, values)
      .map((row: any) => Number(row.rid));
  } catch (err) {
    if (/no such column: rowid/i.test(messageOf(err))) {
      throw new Error(
        `Cascade: ${table} is a WITHOUT ROWID table, which the soft-delete cascade cannot follow. ` +
          'Give it a rowid or drop the ON DELETE action from the constraint that points at it.',
      );
    }
    throw err;
  }
}

function chunked(rowids: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < rowids.length; i += CHUNK) out.push(rowids.slice(i, i + CHUNK));
  return out;
}

function inRowids(rowids: number[]): string {
  return `rowid IN (${rowids.map(() => '?').join(', ')})`;
}

/**
 * Rows of `fk.child` that reference any of `parentRowids` and are still live.
 * The join is on the constraint's own column pairs, so composite keys work unchanged, and a NULL
 * referencing column never matches, which is what `ON DELETE` does too.
 */
function childRowids(conn: Connection, fk: ForeignKey, parentRowids: number[]): number[] {
  const on = fk.from.map((from, index) => `c.${ident(from)} = p.${ident(fk.to[index])}`).join(' AND ');
  const found: number[] = [];
  for (const chunk of chunked(parentRowids)) {
    const rows = conn.query(
      `SELECT DISTINCT c.rowid AS rid FROM ${ident(fk.child)} c JOIN ${ident(fk.parent)} p ON ${on} ` +
        `WHERE p.${inRowids(chunk)} AND c.sql_deleted = 0`,
      chunk,
    );
    for (const row of rows) found.push(Number((row as any).rid));
  }
  return found;
}

function updateRows(conn: Connection, table: string, setClause: string, rowids: number[]): void {
  for (const chunk of chunked(rowids)) {
    // rewriteDeletes stays off: this IS the rewrite's own work, and it is an UPDATE regardless.
    conn.run(`UPDATE ${ident(table)} SET ${setClause} WHERE ${inRowids(chunk)}`, chunk, false, false);
  }
}

/**
 * Apply every `ON DELETE` action that points at `table`, for the rows identified by `rowids`,
 * then descend into whatever those actions marked.
 *
 * A constraint is followed only when the child table carries `sql_deleted`. A child without it is
 * not part of the sync protocol and there is nothing to mark; its integrity is not at risk either,
 * because the parent row physically remains until `deleteExportedRows` removes it, and that is a
 * real DELETE which fires sqlite's own `ON DELETE` handling.
 */
function propagate(conn: Connection, table: string, rowids: number[], depth: number): void {
  if (rowids.length === 0) return;
  if (depth > MAX_DEPTH) {
    throw new Error(`Cascade: foreign key propagation from ${table} exceeded ${MAX_DEPTH} levels`);
  }

  for (const fk of conn.foreignKeyGraph.filter((entry) => equalNames(entry.parent, table))) {
    if (fk.onDelete === 'NO ACTION') continue;
    // Reuses the connection's own per-table cache rather than a PRAGMA per constraint per delete.
    if (!conn.softDeletes(fk.child)) continue;

    const affected = childRowids(conn, fk, rowids);
    if (affected.length === 0) continue;

    if (fk.onDelete === 'RESTRICT') {
      throw new Error('Restrict mode related items exist, please delete them first');
    }
    if (fk.onDelete === 'CASCADE') {
      // Marked before descending: a row that is already marked cannot be selected again, which is
      // what stops a cyclic or self-referencing schema from recursing forever.
      updateRows(conn, fk.child, 'sql_deleted = 1', affected);
      propagate(conn, fk.child, affected, depth + 1);
      continue;
    }
    // SET NULL / SET DEFAULT: the child survives, so there is nothing to descend into.
    const setClause = fk.from
      .map((column) => {
        const value = fk.onDelete === 'SET NULL' ? 'NULL' : columnDefault(conn, fk.child, column);
        return `${ident(column)} = ${value}`;
      })
      .join(', ');
    updateRows(conn, fk.child, setClause, affected);
  }
}

function equalNames(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Run the propagation for a DELETE that is about to be rewritten. Called with the statement's own
 * WHERE clause and bind values, before the parent is marked, so the rows it selects are the ones
 * the rewritten UPDATE will mark.
 */
export function cascadeSoftDelete(conn: Connection, table: string, whereClause: string, values: any[]): void {
  if (conn.foreignKeyGraph.length === 0) return;
  const name = resolveTableName(table);
  const roots = rowidsOf(conn, name, `(${whereClause}) AND sql_deleted = 0`, values);
  propagate(conn, name, roots, 0);
}
