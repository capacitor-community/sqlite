/**
 * Unit tests for the statement scanner. Semicolons inside string literals, comments and trigger
 * bodies must not split a statement, which is exactly what the string-replace approach in
 * electron-utils could not guarantee.
 */
import { describe, expect, test } from 'vitest';

import {
  hasReturningClause,
  producesRows,
  replaceUndefinedByNull,
  splitStatements,
  statementKind,
  stripNoise,
} from '../../src/web/worker/statements';

describe('splitStatements', () => {
  test('splits a plain batch and drops empty fragments', () => {
    expect(splitStatements('CREATE TABLE t (a);  INSERT INTO t VALUES (1); ;')).toEqual([
      'CREATE TABLE t (a)',
      'INSERT INTO t VALUES (1)',
    ]);
  });

  test('a semicolon inside a string literal is data, not a separator', () => {
    expect(splitStatements("INSERT INTO t VALUES ('a;b'); SELECT 1")).toEqual([
      "INSERT INTO t VALUES ('a;b')",
      'SELECT 1',
    ]);
  });

  test('doubled quotes inside a literal are escapes', () => {
    expect(splitStatements("INSERT INTO t VALUES ('it''s; fine'); SELECT 2")).toEqual([
      "INSERT INTO t VALUES ('it''s; fine')",
      'SELECT 2',
    ]);
  });

  test('quoted identifiers and bracket identifiers are opaque', () => {
    expect(splitStatements('SELECT "a;b" FROM [c;d]; SELECT 3')).toEqual(['SELECT "a;b" FROM [c;d]', 'SELECT 3']);
  });

  test('comments cannot end a statement', () => {
    expect(splitStatements('SELECT 1 -- trailing; comment\n; SELECT 2')).toEqual([
      'SELECT 1 -- trailing; comment',
      'SELECT 2',
    ]);
    expect(splitStatements('SELECT 1 /* block ; comment */; SELECT 2')).toEqual([
      'SELECT 1 /* block ; comment */',
      'SELECT 2',
    ]);
  });

  test('a trigger body stays in one piece', () => {
    const sql = `CREATE TRIGGER t_ins AFTER INSERT ON t BEGIN UPDATE t SET seen = 1; DELETE FROM u; END; SELECT 1;`;
    const parts = splitStatements(sql);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain('DELETE FROM u');
    expect(parts[0].endsWith('END')).toBe(true);
    expect(parts[1]).toBe('SELECT 1');
  });

  test('a comment-only batch produces nothing', () => {
    expect(splitStatements('-- nothing here\n/* nor here */')).toEqual([]);
  });
});

describe('inspection helpers', () => {
  test('statementKind reads the leading keyword', () => {
    expect(statementKind('  insert into t values (1)')).toBe('INSERT');
    expect(statementKind('/* lead */ SELECT 1')).toBe('SELECT');
    expect(statementKind('')).toBe('');
  });

  test('hasReturningClause ignores the word inside a literal', () => {
    expect(hasReturningClause('INSERT INTO t VALUES (1) RETURNING id')).toBe(true);
    expect(hasReturningClause("INSERT INTO t VALUES ('returning')")).toBe(false);
  });

  test('producesRows covers reads and RETURNING writes', () => {
    expect(producesRows('SELECT 1')).toBe(true);
    expect(producesRows('WITH c AS (SELECT 1) SELECT * FROM c')).toBe(true);
    expect(producesRows('PRAGMA user_version')).toBe(true);
    expect(producesRows('INSERT INTO t VALUES (1)')).toBe(false);
    expect(producesRows('DELETE FROM t RETURNING id')).toBe(true);
  });

  test('stripNoise blanks literals and comments', () => {
    expect(stripNoise("SELECT 'x' -- y\n, 1").includes('x')).toBe(false);
  });

  test('replaceUndefinedByNull only touches undefined', () => {
    expect(replaceUndefinedByNull([1, undefined, null, 'a'])).toEqual([1, null, null, 'a']);
    expect(replaceUndefinedByNull(undefined)).toEqual([]);
  });
});
