/**
 * copyFromAssets and getFromHTTPRequest.
 *
 * Fixtures are real SQLite files, built in the browser through the plugin itself, uploaded to
 * the dev server's `/__fixture/` endpoint (see vitest.config.mts), and then fetched back by the
 * worker over real HTTP. Nothing leaves localhost, and the streaming path is exercised for real
 * rather than through a stubbed fetch, which could not reach the worker's scope anyway.
 */
import { beforeEach, describe, expect, test } from 'vitest';

import { setSqliteWebOptions } from '../../src/web/worker-factory';

import { TIERS, startHarness, tierLabel } from './harness';

const BASE = '/__fixture/dbs/';

async function putFixture(path: string, body: Uint8Array | string): Promise<void> {
  const res = await fetch(path, { method: 'PUT', body: typeof body === 'string' ? body : (body.slice() as any) });
  if (!res.ok) throw new Error(`fixture upload failed for ${path}: ${res.status}`);
}

beforeEach(async () => {
  await fetch('/__fixture/reset', { method: 'DELETE' });
});

/** Build a real SQLite file through the plugin and return its bytes. */
async function makeDatabaseBytes(sqlite: any, plugin: any, name: string, rows: string[]): Promise<Uint8Array> {
  const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT);');
  for (const row of rows) await db.run('INSERT INTO t (v) VALUES (?)', [row]);
  await sqlite.closeConnection(name, false);
  const { bytes } = await (plugin as any).client.call('exportDb', { database: name });
  return bytes;
}

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  async function harness() {
    const h = await startHarness(tier);
    // Point copyFromAssets at the fixture directory instead of assets/databases/.
    setSqliteWebOptions({ assetsPath: BASE });
    return h;
  }

  test(`${label}: copyFromAssets pulls every database in databases.json`, async () => {
    const { sqlite, plugin } = await harness();
    await putFixture(`${BASE}alpha.db`, await makeDatabaseBytes(sqlite, plugin, 'srcAlpha', ['a1', 'a2']));
    await putFixture(`${BASE}beta.db`, await makeDatabaseBytes(sqlite, plugin, 'srcBeta', ['b1']));
    await putFixture(`${BASE}databases.json`, JSON.stringify(['alpha.db', 'beta.db']));

    await sqlite.copyFromAssets(true);

    const list = await sqlite.getDatabaseList();
    expect(list.values).toContain('alphaSQLite.db');
    expect(list.values).toContain('betaSQLite.db');

    const db = await sqlite.createConnection('alpha', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t ORDER BY id')).values?.map((r: any) => r.v)).toEqual(['a1', 'a2']);
    await sqlite.closeConnection('alpha', false);
  });

  test(`${label}: copyFromAssets honours overwrite = false`, async () => {
    const { sqlite, plugin } = await harness();
    await putFixture(`${BASE}keep.db`, await makeDatabaseBytes(sqlite, plugin, 'srcOne', ['original']));
    await putFixture(`${BASE}databases.json`, JSON.stringify(['keep.db']));
    await sqlite.copyFromAssets(true);

    await putFixture(`${BASE}keep.db`, await makeDatabaseBytes(sqlite, plugin, 'srcTwo', ['replacement']));
    await sqlite.copyFromAssets(false);

    const db = await sqlite.createConnection('keep', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('original');
    await sqlite.closeConnection('keep', false);
  });

  test(`${label}: overwrite = true really replaces the stored database`, async () => {
    const { sqlite, plugin } = await harness();
    await putFixture(`${BASE}swap.db`, await makeDatabaseBytes(sqlite, plugin, 'srcA', ['first']));
    await putFixture(`${BASE}databases.json`, JSON.stringify(['swap.db']));
    await sqlite.copyFromAssets(true);

    await putFixture(`${BASE}swap.db`, await makeDatabaseBytes(sqlite, plugin, 'srcB', ['second']));
    await sqlite.copyFromAssets(true);

    const db = await sqlite.createConnection('swap', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('second');
    await sqlite.closeConnection('swap', false);
  });

  test(`${label}: copyFromAssets accepts the object form of the manifest`, async () => {
    const { sqlite, plugin } = await harness();
    await putFixture(`${BASE}obj.db`, await makeDatabaseBytes(sqlite, plugin, 'srcObj', ['objform']));
    await putFixture(`${BASE}databases.json`, JSON.stringify({ databaseList: ['obj.db'] }));
    await sqlite.copyFromAssets(true);

    const db = await sqlite.createConnection('obj', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('objform');
    await sqlite.closeConnection('obj', false);
  });

  test(`${label}: a missing manifest fails loudly`, async () => {
    const { sqlite } = await harness();
    await expect(sqlite.copyFromAssets(true)).rejects.toThrow(/CopyFromAssets/i);
  });

  test(`${label}: getFromHTTPRequest streams a database in and raises its ended event`, async () => {
    const { sqlite, plugin } = await harness();
    await putFixture('/__fixture/remote.db', await makeDatabaseBytes(sqlite, plugin, 'srcHttp', ['downloaded']));
    const events: any[] = [];
    await plugin.addListener('sqliteHTTPRequestEndedEvent', (e: any) => events.push(e));

    await sqlite.getFromHTTPRequest(new URL('/__fixture/remote.db', location.href).href, true);

    expect(events.length).toBe(1);
    expect(events[0].message).toBe('ended');

    const db = await sqlite.createConnection('remote', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('downloaded');
    await sqlite.closeConnection('remote', false);
  });

  test(`${label}: a failed download raises the ended event with the error and rejects`, async () => {
    const { sqlite, plugin } = await harness();
    const events: any[] = [];
    await plugin.addListener('sqliteHTTPRequestEndedEvent', (e: any) => events.push(e));
    await expect(
      sqlite.getFromHTTPRequest(new URL('/__fixture/never-uploaded.db', location.href).href, true),
    ).rejects.toThrow(/GetFromHTTPRequest/i);
    expect(events.length).toBe(1);
    expect(events[0].message).toMatch(/^Error:/);
  });

  test(`${label}: a zip asset is unpacked into its databases`, async () => {
    const { sqlite, plugin } = await harness();
    const bytes = await makeDatabaseBytes(sqlite, plugin, 'srcZip', ['zipped']);
    const { zipSync } = await import('fflate');
    await putFixture(`${BASE}bundle.zip`, zipSync({ 'inner.db': bytes }, { level: 0 }));
    await putFixture(`${BASE}databases.json`, JSON.stringify(['bundle.zip']));

    await sqlite.copyFromAssets(true);

    const db = await sqlite.createConnection('inner', false, 'no-encryption', 1, false);
    await db.open();
    expect((await db.query('SELECT v FROM t')).values?.[0].v).toBe('zipped');
    await sqlite.closeConnection('inner', false);
  });

  test(`${label}: a large download costs a chunk, not the file`, async () => {
    const { sqlite, plugin } = await harness();
    // Big enough that a whole-buffer implementation would be obvious in the wasm heap.
    const db = await sqlite.createConnection('srcBig', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute('CREATE TABLE big (id INTEGER PRIMARY KEY NOT NULL, blob BLOB);');
    await db.execute(
      `WITH RECURSIVE c(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM c WHERE n < 128)
       INSERT INTO big (blob) SELECT randomblob(65536) FROM c;`,
    );
    await sqlite.closeConnection('srcBig', false);
    const { bytes } = await (plugin as any).client.call('exportDb', { database: 'srcBig' });
    expect(bytes.byteLength).toBeGreaterThan(8 * 1024 * 1024);
    await putFixture('/__fixture/big.db', bytes);

    await sqlite.getFromHTTPRequest(new URL('/__fixture/big.db', location.href).href, true);

    const copy = await sqlite.createConnection('big', false, 'no-encryption', 1, false);
    await copy.open();
    const count = await copy.query('SELECT count(*) AS n, sum(length(blob)) AS total FROM big');
    expect(count.values?.[0].n).toBe(128);
    expect(Number(count.values?.[0].total)).toBe(128 * 65536);
    const check = await copy.query('PRAGMA integrity_check');
    expect(check.values?.[0].integrity_check).toBe('ok');
    await sqlite.closeConnection('big', false);
  });
});
