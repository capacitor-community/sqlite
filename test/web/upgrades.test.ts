/**
 * addUpgradeStatement plus the version ladder that runs on open, ported from
 * electron-utils/utilsUpgrade.ts. The interesting cases are the ones the electron port had to
 * take a file backup for: a partially applied ladder must leave the database exactly as it was.
 */
import { describe, expect, test } from 'vitest';

import { TIERS, startHarness, tierLabel } from './harness';

const V1 = ['CREATE TABLE notes (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);'];
const V2 = ['ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0;'];
const V3 = [
  'CREATE TABLE tags (id INTEGER PRIMARY KEY NOT NULL, label TEXT);',
  'CREATE INDEX tags_label ON tags(label);',
];

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: the ladder runs in order and lands on the requested version`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('ladder', [
      { toVersion: 3, statements: V3 },
      { toVersion: 1, statements: V1 },
      { toVersion: 2, statements: V2 },
    ]);
    const db = await sqlite.createConnection('ladder', false, 'no-encryption', 3, false);
    await db.open();

    expect((await db.getVersion()).version).toBe(3);
    expect((await db.getTableList()).values).toEqual(['notes', 'tags']);
    await db.run('INSERT INTO notes (body, pinned) VALUES (?, ?)', ['hello', 1]);
    expect((await db.query('SELECT pinned FROM notes')).values?.[0].pinned).toBe(1);

    await sqlite.closeConnection('ladder', false);
  });

  test(`${label}: reopening at a higher version applies only the new steps`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('stepwise', [{ toVersion: 1, statements: V1 }]);
    const first = await sqlite.createConnection('stepwise', false, 'no-encryption', 1, false);
    await first.open();
    await first.run('INSERT INTO notes (body) VALUES (?)', ['survivor']);
    expect((await first.getVersion()).version).toBe(1);
    await sqlite.closeConnection('stepwise', false);

    await sqlite.addUpgradeStatement('stepwise', [
      { toVersion: 1, statements: V1 },
      { toVersion: 2, statements: V2 },
    ]);
    const second = await sqlite.createConnection('stepwise', false, 'no-encryption', 2, false);
    await second.open();
    expect((await second.getVersion()).version).toBe(2);
    // The v1 statements must not have run again, and the existing row must still be there.
    const rows = await second.query('SELECT body, pinned FROM notes');
    expect(rows.values).toEqual([{ body: 'survivor', pinned: 0 }]);

    await sqlite.closeConnection('stepwise', false);
  });

  test(`${label}: opening below the stored version applies nothing`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('nodowngrade', [
      { toVersion: 1, statements: V1 },
      { toVersion: 2, statements: V2 },
    ]);
    const first = await sqlite.createConnection('nodowngrade', false, 'no-encryption', 2, false);
    await first.open();
    await sqlite.closeConnection('nodowngrade', false);

    const second = await sqlite.createConnection('nodowngrade', false, 'no-encryption', 1, false);
    await second.open();
    expect((await second.getVersion()).version).toBe(2);
    await sqlite.closeConnection('nodowngrade', false);
  });

  test(`${label}: a failing upgrade restores the database and reports the failure`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('broken', [{ toVersion: 1, statements: V1 }]);
    const first = await sqlite.createConnection('broken', false, 'no-encryption', 1, false);
    await first.open();
    await first.run('INSERT INTO notes (body) VALUES (?)', ['precious']);
    await sqlite.closeConnection('broken', false);

    await sqlite.addUpgradeStatement('broken', [
      { toVersion: 1, statements: V1 },
      { toVersion: 2, statements: ['ALTER TABLE notes ADD COLUMN pinned INTEGER;', 'THIS IS NOT SQL;'] },
    ]);
    const second = await sqlite.createConnection('broken', false, 'no-encryption', 2, false);
    await expect(second.open()).rejects.toThrow(/onUpgrade/i);

    // Reopen at the old version: the schema and the data must be exactly as they were.
    await sqlite.closeConnection('broken', false);
    await sqlite.addUpgradeStatement('broken', [{ toVersion: 1, statements: V1 }]);
    const third = await sqlite.createConnection('broken', false, 'no-encryption', 1, false);
    await third.open();
    expect((await third.getVersion()).version).toBe(1);
    const rows = await third.query('SELECT * FROM notes');
    expect(rows.values).toEqual([{ id: 1, body: 'precious' }]);
    await sqlite.closeConnection('broken', false);
  });

  test(`${label}: an upgrade entry with no statements is rejected`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('empty', [{ toVersion: 1, statements: [] }]);
    const db = await sqlite.createConnection('empty', false, 'no-encryption', 1, false);
    await expect(db.open()).rejects.toThrow(/statements not given/i);
    await sqlite.closeConnection('empty', false);
  });

  test(`${label}: upgrade statements containing trigger bodies survive splitting`, async () => {
    const { sqlite } = await startHarness(tier);
    await sqlite.addUpgradeStatement('triggers', [
      {
        toVersion: 1,
        statements: [
          'CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT, seen INTEGER DEFAULT 0);',
          `CREATE TRIGGER t_ins AFTER INSERT ON t
           BEGIN
             UPDATE t SET seen = 1 WHERE id = new.id;
           END;`,
        ],
      },
    ]);
    const db = await sqlite.createConnection('triggers', false, 'no-encryption', 1, false);
    await db.open();
    await db.run('INSERT INTO t (v) VALUES (?)', ['fires']);
    expect((await db.query('SELECT seen FROM t')).values?.[0].seen).toBe(1);
    await sqlite.closeConnection('triggers', false);
  });
});
