/**
 * FTS5 on both tiers. Dropping sql.js is only defensible because sqlite-wasm's canonical build
 * has FTS5 and sql.js does not, so this is a load-bearing assertion rather than a nicety.
 */
import { describe, expect, test } from 'vitest';

import { TIERS, startHarness, tierLabel } from './harness';

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: create virtual table, MATCH, snippet, bm25, prefix`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('search', false, 'no-encryption', 1, false);
    await db.open();

    await db.execute("CREATE VIRTUAL TABLE docs USING fts5(title, body, tokenize='unicode61');");
    await db.executeSet([
      {
        statement: 'INSERT INTO docs (title, body) VALUES (?, ?)',
        values: [
          ['Genesis', 'In the beginning God created the heaven and the earth'],
          ['Exodus', 'And the LORD said unto Moses, Go unto the people'],
          ['Psalms', 'The LORD is my shepherd; I shall not want'],
        ],
      },
    ]);

    const hits = await db.query(
      "SELECT title, snippet(docs, 1, '[', ']', '...', 8) AS snip, rank FROM docs WHERE docs MATCH ? ORDER BY rank",
      ['lord'],
    );
    expect(hits.values?.map((r: any) => r.title).sort()).toEqual(['Exodus', 'Psalms']);
    expect(hits.values?.[0].snip).toContain('[');
    expect(typeof hits.values?.[0].rank).toBe('number');

    const scored = await db.query('SELECT title, bm25(docs) AS score FROM docs WHERE docs MATCH ? ORDER BY score', [
      'created OR shepherd',
    ]);
    expect(scored.values?.map((r: any) => r.title).sort()).toEqual(['Genesis', 'Psalms']);

    const prefix = await db.query('SELECT count(*) AS n FROM docs WHERE docs MATCH ?', ['shep*']);
    expect(prefix.values?.[0].n).toBe(1);

    await sqlite.closeConnection('search', false);
  });

  test(`${label}: an FTS5 index survives close and reopen`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('searchpersist', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute("CREATE VIRTUAL TABLE d USING fts5(body); INSERT INTO d (body) VALUES ('persisted text');");
    await sqlite.closeConnection('searchpersist', false);

    const again = await sqlite.createConnection('searchpersist', false, 'no-encryption', 1, false);
    await again.open();
    const hits = await again.query('SELECT body FROM d WHERE d MATCH ?', ['persisted']);
    expect(hits.values).toEqual([{ body: 'persisted text' }]);
    await sqlite.closeConnection('searchpersist', false);
  });

  test(`${label}: JSON1 is available, which the M2 import/export port relies on`, async () => {
    const { sqlite } = await startHarness(tier);
    const db = await sqlite.createConnection('jsonfns', false, 'no-encryption', 1, false);
    await db.open();
    const res = await db.query(
      `SELECT json_extract('{"a":{"b":42}}', '$.a.b') AS v, json_array_length('[1,2,3]') AS n`,
    );
    expect(res.values?.[0]).toEqual({ v: 42, n: 3 });
    await sqlite.closeConnection('jsonfns', false);
  });
});
