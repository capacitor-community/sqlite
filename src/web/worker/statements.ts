/**
 * Statement splitting and inspection.
 *
 * Behaviour is the one `electron/src/electron-utils/utilsSQLite.ts` (MIT, this repo) established
 * for the batch `execute` path, but the splitting is done with a character scanner rather than
 * the string-replace-and-split-on-semicolon approach used there: a semicolon inside a string
 * literal, a comment, or a trigger body must not end a statement, and trigger bodies are common
 * in this plugin's upgrade statements.
 *
 * The `sql_deleted` DELETE rewrite that also lives in this layer arrives in M2.
 */

/** Split a batch into individual statements, ignoring semicolons that are not separators. */
export function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = '';
  let depth = 0; // nesting of BEGIN ... END inside CREATE TRIGGER bodies

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    // string literal
    if (ch === "'") {
      const end = scanQuoted(sql, i, "'");
      current += sql.slice(i, end);
      i = end - 1;
      continue;
    }
    // quoted identifiers
    if (ch === '"' || ch === '`') {
      const end = scanQuoted(sql, i, ch);
      current += sql.slice(i, end);
      i = end - 1;
      continue;
    }
    if (ch === '[') {
      const end = sql.indexOf(']', i + 1);
      const stop = end === -1 ? sql.length : end + 1;
      current += sql.slice(i, stop);
      i = stop - 1;
      continue;
    }
    // comments
    if (ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      const stop = nl === -1 ? sql.length : nl;
      current += sql.slice(i, stop);
      i = stop - 1;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      current += sql.slice(i, stop);
      i = stop - 1;
      continue;
    }

    if (isWordBoundary(sql, i)) {
      if (matchesKeyword(sql, i, 'BEGIN')) depth++;
      else if (matchesKeyword(sql, i, 'END')) depth = Math.max(0, depth - 1);
    }

    if (ch === ';' && depth === 0) {
      push(out, current);
      current = '';
      continue;
    }
    current += ch;
  }
  push(out, current);
  return out;
}

function push(out: string[], candidate: string): void {
  const trimmed = candidate.trim();
  if (trimmed.length > 0 && stripNoise(trimmed).trim().length > 0) out.push(trimmed);
}

function scanQuoted(sql: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) {
        i += 2; // doubled quote is an escaped quote
        continue;
      }
      return i + 1;
    }
    i++;
  }
  return sql.length;
}

function isWordBoundary(sql: string, i: number): boolean {
  return i === 0 || !/[A-Za-z0-9_]/.test(sql[i - 1]);
}

function matchesKeyword(sql: string, i: number, keyword: string): boolean {
  if (sql.substr(i, keyword.length).toUpperCase() !== keyword) return false;
  const after = sql[i + keyword.length];
  return after === undefined || !/[A-Za-z0-9_]/.test(after);
}

/**
 * Blank out string literals and comments so keyword matching cannot be fooled by data.
 *
 * Length preserving, deliberately: every blanked run becomes the same number of spaces, so an
 * offset into the result is an offset into the original. `extractWhereClause` depends on that to
 * hand back a clause with its literals intact. Collapsing each run to one space instead, which is
 * what this did originally, silently deleted them.
 */
export function stripNoise(sql: string): string {
  let out = '';
  const blank = (from: number, to: number) => ' '.repeat(to - from);
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const end = scanQuoted(sql, i, ch);
      out += blank(i, end);
      i = end - 1;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      const end = nl === -1 ? sql.length : nl;
      out += blank(i, end);
      i = end - 1;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const found = sql.indexOf('*/', i + 2);
      const end = found === -1 ? sql.length : found + 2;
      out += blank(i, end);
      i = end - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * A table or column name, quoted for interpolation into SQL.
 *
 * `tableList()` and `PRAGMA foreign_key_list` return bare names, and a schema is free to contain
 * a table called `order` or `group`. Interpolating one of those unquoted turns an internal PRAGMA
 * into a syntax error, which is how a reserved-word table used to switch the whole soft-delete
 * protocol off for a database.
 */
export function quoteIdent(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/** The leading keyword, upper-cased: SELECT, INSERT, UPDATE, DELETE, CREATE, PRAGMA, ... */
export function statementKind(sql: string): string {
  const match = stripNoise(sql)
    .trim()
    .match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : '';
}

/**
 * True when the statement carries a RETURNING clause. Unlike better-sqlite3, sqlite-wasm can
 * step a RETURNING statement and hand back its rows directly, so the electron workaround of
 * stripping the clause and re-selecting by rowid range is not needed here.
 */
export function hasReturningClause(sql: string): boolean {
  return /\bRETURNING\b/i.test(stripNoise(sql));
}

/** Statements that produce rows, so `exec` knows whether to collect any. */
export function producesRows(sql: string): boolean {
  const kind = statementKind(sql);
  if (kind === 'SELECT' || kind === 'WITH' || kind === 'PRAGMA' || kind === 'EXPLAIN') return true;
  return hasReturningClause(sql);
}

/** Ported from electron-utils: bound `undefined` must reach sqlite as NULL, not throw. */
export function replaceUndefinedByNull(values: any[] | undefined): any[] {
  if (!values || values.length === 0) return [];
  return values.map((value) => (value === undefined ? null : value));
}

/**
 * The soft-delete rewrite (PLAN 2.4), ported from `utilsSQLite.deleteSQL` in
 * `electron/src/electron-utils/` (MIT, this repo) and cross-checked against jeep-sqlite (MIT),
 * which carries the identical logic.
 *
 * When a database participates in sync (its tables carry both `last_modified` and
 * `sql_deleted`), a DELETE is not a delete: the row is marked instead, so the next export can
 * tell the server about it. `deleteExportedRows` is what eventually removes it for real.
 *
 * `AND sql_deleted = 0` on the rewritten statement keeps the operation idempotent: deleting an
 * already-soft-deleted row reports zero changes rather than touching `last_modified` again.
 */
export function extractTableName(statement: string): string | null {
  const stripped = stripNoise(statement);
  // The keyword is located in the blanked copy so a table name inside a literal cannot be picked
  // up, but the name itself is read from the original. `stripNoise` blanks double-quoted
  // identifiers along with strings, and a greedy `\s+` after the keyword would swallow the blanks
  // where the name used to be: that is how `DELETE FROM "order" WHERE id = ?` yielded the table
  // name `WHERE`, and a soft delete against a quoted table silently became a real one.
  const match = stripped.match(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i);
  if (!match || match.index === undefined) return null;
  const after = statement.slice(match.index + match[0].length);
  const lead = after.match(/^\s*/)?.[0].length ?? 0;
  const token = after.slice(lead).match(/^(?:"(?:[^"]|"")*"|`(?:[^`]|``)*`|\[[^\]]*\]|[^\s;(]+)/);
  return token ? token[0] : null;
}

/**
 * The WHERE clause as the caller wrote it, literals and all.
 *
 * The keyword hunt runs over the blanked copy so a `WHERE` inside a string cannot be mistaken for
 * the real one, but the clause itself is sliced out of the original: returning the blanked text
 * would drop every literal, and `DELETE FROM t WHERE name = 'bob'` would rewrite to
 * `... WHERE name = AND sql_deleted = 0`, which is not valid SQL.
 */
export function extractWhereClause(statement: string): string | null {
  const stripped = stripNoise(statement);
  const match = stripped.match(/WHERE\s(.+?)(?:ORDER\s+BY|LIMIT|RETURNING|$)/is);
  if (!match || match.index === undefined || !match[1]) return null;
  const start = match.index + 'WHERE'.length + 1;
  return statement.slice(start, start + match[1].length).trim();
}

/**
 * The trailing `RETURNING ...`, if any. sqlite-wasm can step a RETURNING statement directly, so
 * the clause is carried across the rewrite rather than dropped: a soft delete that was asked for
 * its rows should still hand them back, and appending the guard after it would not even parse.
 */
export function extractReturningClause(statement: string): string | null {
  const stripped = stripNoise(statement);
  const match = stripped.match(/\bRETURNING\b/i);
  if (!match || match.index === undefined) return null;
  const clause = statement.slice(match.index).trim();
  return clause.endsWith(';') ? clause.slice(0, -1).trim() : clause;
}

/**
 * Rewrite a DELETE into a soft delete. Returns the statement unchanged when the database does
 * not participate in sync, so this is safe to run over every DELETE.
 */
export function softDeleteRewrite(statement: string, syncEnabled: boolean): string {
  if (!syncEnabled) return statement;
  if (statementKind(statement) !== 'DELETE') return statement;

  const tableName = extractTableName(statement);
  if (!tableName) throw new Error('deleteSQL: cannot find a table name');
  const whereClause = extractWhereClause(statement);
  if (!whereClause) throw new Error('deleteSQL: cannot find a WHERE clause');

  const where = whereClause.endsWith(';') ? whereClause.slice(0, -1) : whereClause;
  const returning = extractReturningClause(statement);
  const suffix = returning ? ` ${returning}` : '';
  // The caller's clause is parenthesised because AND binds tighter than OR: without the brackets,
  // `WHERE a = 1 OR b = 2` becomes `a = 1 OR (b = 2 AND sql_deleted = 0)`, so the guard covers
  // only the last disjunct and an already-deleted row is marked again on every repeat.
  return `UPDATE ${tableName} SET sql_deleted = 1 WHERE (${where}) AND sql_deleted = 0${suffix};`;
}
