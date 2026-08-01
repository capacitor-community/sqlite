/**
 * The other suites run the worker from TypeScript source through setSqliteWorkerFactory. This
 * one runs the artefact that actually ships: `dist/web-worker.js`, a classic (non-module)
 * worker that has to find `dist/sqlite3.wasm` sitting next to it with no bundler involved.
 *
 * Requires `npm run build` first. It fails rather than skipping if the build is missing, because
 * a silently skipped packaging test is worse than no packaging test.
 */
import { afterEach, beforeAll, expect, test } from 'vitest';

import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

const WORKER_URL = '/dist/web-worker.js';
const WASM_URL = '/dist/sqlite3.wasm';

let plugin: CapacitorSQLiteWeb | null = null;

afterEach(async () => {
  await plugin?.closeWebStore();
  plugin = null;
});

beforeAll(async () => {
  const [worker, wasm] = await Promise.all([fetch(WORKER_URL), fetch(WASM_URL)]);
  if (!worker.ok || !wasm.ok) {
    throw new Error(`${WORKER_URL} / ${WASM_URL} are not built. Run "npm run build" before the web tests.`);
  }
  setSqliteWorkerFactory(() => new Worker(WORKER_URL));
});

test('the shipped classic worker boots and resolves sqlite3.wasm beside itself', async () => {
  setSqliteWebOptions({
    forceTier2: false,
    simulateInstallError: undefined,
    poolName: 'dist-check',
    directory: '.dist-check',
  });
  plugin = new CapacitorSQLiteWeb();
  const sqlite = new SQLiteConnection(plugin);
  await sqlite.initWebStore();
  expect(plugin.getWebStoreTier()).toBe(1);

  const db = await sqlite.createConnection('shipped', false, 'no-encryption', 1, false);
  await db.open();
  await db.execute("CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, v TEXT); INSERT INTO t (v) VALUES ('built');");
  const rows = await db.query('SELECT v FROM t');
  expect(rows.values).toEqual([{ v: 'built' }]);

  // BLOBs and BigInt cross the real worker boundary too, not just the source one.
  const payload = new Uint8Array([1, 2, 3, 250]);
  await db.execute('CREATE TABLE b (p BLOB, n INTEGER);');
  await db.run('INSERT INTO b (p, n) VALUES (?, ?)', [payload, 9007199254740993n]);
  const back = await db.query('SELECT p, n FROM b');
  expect(Array.from(back.values?.[0].p as Uint8Array)).toEqual([1, 2, 3, 250]);
  expect(back.values?.[0].n).toBe(9007199254740993n);

  await sqlite.closeConnection('shipped', false);
});

test('the wasm is a separate asset, not inlined into the worker', async () => {
  const [worker, wasm] = await Promise.all([fetch(WORKER_URL), fetch(WASM_URL)]);
  const workerSource = await worker.text();
  const wasmBytes = new Uint8Array(await wasm.arrayBuffer());

  expect(Array.from(wasmBytes.subarray(0, 4))).toEqual([0x00, 0x61, 0x73, 0x6d]);
  expect(workerSource).not.toContain('data:application/octet-stream;base64');
  // Classic workers have no import.meta and no document; both would be fatal in here.
  expect(workerSource).toContain('self.location.href');
  expect(workerSource).not.toContain('document.currentScript');
});
