/**
 * Backgrounding and recovery (PLAN 6.7), plus the error shapes a developer actually meets.
 *
 * WKWebView invalidates OPFS access handles when the app is suspended. The gentle path closes
 * every connection and pauses the VFS before that happens, then unpauses and reopens. The heavy
 * path exists because the gentle one is unproven against real device suspension: when unpause
 * cannot be reached, a fresh worker takes the pool over instead.
 */
import { afterEach, describe, expect, test } from 'vitest';

import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import { workerLoadFailure } from '../../src/web/errors';
import type { Tier } from '../../src/web/protocol';
import { ownerLockName } from '../../src/web/protocol';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

import { TIERS, stopHarness, tierLabel } from './harness';

setSqliteWorkerFactory(
  () => new Worker(new URL('../../src/web/worker/worker.ts', import.meta.url), { type: 'module' }),
);

const open: CapacitorSQLiteWeb[] = [];
let poolCounter = 0;

async function boot(tier: Tier, suffix: string): Promise<{ plugin: CapacitorSQLiteWeb; pool: string }> {
  poolCounter += 1;
  const pool = `life-${poolCounter}-${suffix}`;
  setSqliteWebOptions({
    forceTier2: tier === 2,
    simulateInstallError: undefined,
    skipJeepMigration: true,
    poolName: pool,
    directory: `.${pool}`,
  });
  const plugin = new CapacitorSQLiteWeb();
  open.push(plugin);
  await new SQLiteConnection(plugin).initWebStore();
  return { plugin, pool };
}

async function seeded(plugin: CapacitorSQLiteWeb, name: string): Promise<any> {
  const sqlite = new SQLiteConnection(plugin);
  const db = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  await db.execute('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);');
  await db.run('INSERT INTO t (v) VALUES (?)', ['before']);
  return db;
}

afterEach(async () => {
  await Promise.all(open.splice(0).map((plugin) => plugin.closeWebStore()));
  await stopHarness();
});

describe('worker load failures name the right cause', () => {
  test('a parse failure is reported as an unsupported browser, not a bundler problem', () => {
    const err = workerLoadFailure('Uncaught SyntaxError: Unexpected token .');
    expect(err.message).toMatch(/below the minimum this plugin supports/i);
    expect(err.message).toMatch(/Chrome\/Android WebView 80, Safari 14, Firefox 74/);
    // The raw evidence survives: a guess that hides it is worse than no guess.
    expect(err.message).toMatch(/Unexpected token \./);
    expect(err.message).not.toMatch(/bundler/i);
    expect(err.code).toBe('UNSUPPORTED_ENGINE');
  });

  test('anything else points at the asset the bundler did not serve', () => {
    const err = workerLoadFailure('Failed to load script');
    expect(err.message).toMatch(/dist\/web-worker\.js/);
    expect(err.message).toMatch(/setSqliteWorkerFactory/);
    expect(err.code).toBe('WORKER_LOAD_FAILED');
  });

  test('HTML served where the worker should be is a bundler problem, not an old browser', () => {
    // What a 404 looks like from the browser: the dev server answers with index.html and the
    // parser stops on its first tag. Measured on Chrome 150 with a Vite build (PLAN 18.1 P3).
    for (const raw of ["Uncaught SyntaxError: Unexpected token '<'", 'SyntaxError: Unexpected token <']) {
      const err = workerLoadFailure(raw);
      expect(err.code).toBe('WORKER_LOAD_FAILED');
      expect(err.message).toMatch(/returned HTML instead of JavaScript/i);
      expect(err.message).toMatch(/setSqliteWorkerFactory/);
      // The claim that would send a developer chasing a browser floor that is not the problem.
      expect(err.message).not.toMatch(/below the minimum this plugin supports/i);
      expect(err.message).toContain(raw);
    }
  });

  test('a DOCTYPE in the message is read the same way', () => {
    const err = workerLoadFailure('Uncaught SyntaxError: Unexpected token <!DOCTYPE html>');
    expect(err.code).toBe('WORKER_LOAD_FAILED');
  });

  test('an empty browser message still produces a usable error', () => {
    expect(workerLoadFailure('').message).toMatch(/no further detail from the browser/);
  });
});

describe('multi-tab ownership', () => {
  test('a store whose owner lock is already held fails with the documented error', async () => {
    poolCounter += 1;
    const pool = `life-${poolCounter}-locked`;
    let release: (() => void) | null = null;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Take the lock the way another tab's worker would, and hold it.
    const granted = new Promise<void>((resolve) => {
      void navigator.locks.request(ownerLockName(pool), async () => {
        resolve();
        await held;
      });
    });
    await granted;

    setSqliteWebOptions({
      forceTier2: false,
      simulateInstallError: undefined,
      skipJeepMigration: true,
      poolName: pool,
      directory: `.${pool}`,
    });
    const plugin = new CapacitorSQLiteWeb();
    open.push(plugin);
    await expect(new SQLiteConnection(plugin).initWebStore()).rejects.toThrow(
      /open in another tab or window[\s\S]*single owning context per origin/i,
    );
    // And it did not quietly become a tier 2 store on top of the other tab's data.
    expect(plugin.getWebStoreTier()).toBeNull();

    release?.();
  });
});

describe.each(TIERS)('%s', (tier) => {
  const label = tierLabel(tier);

  test(`${label}: pause closes everything and resume brings it back`, async () => {
    const { plugin } = await boot(tier, 'pause');
    const db = await seeded(plugin, 'paused');

    await plugin.pauseWebStore();
    // While paused the store is genuinely unavailable rather than quietly serving stale data.
    if (tier === 1) await expect(db.query('SELECT v FROM t')).rejects.toThrow();

    await plugin.resumeWebStore();
    expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);

    // Writes work again afterwards, so the reopened connection is a real one.
    await db.run('INSERT INTO t (v) VALUES (?)', ['after']);
    expect((await db.query('SELECT v FROM t ORDER BY id')).values).toEqual([{ v: 'before' }, { v: 'after' }]);
  });

  test(`${label}: pause and resume are idempotent`, async () => {
    const { plugin } = await boot(tier, 'idem');
    const db = await seeded(plugin, 'idem');
    await plugin.pauseWebStore();
    await plugin.pauseWebStore();
    await plugin.resumeWebStore();
    await plugin.resumeWebStore();
    expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
  });

  test(`${label}: a resume that arrives before the pause has finished still restores the store`, async () => {
    const { plugin } = await boot(tier, 'race');
    const db = await seeded(plugin, 'race');

    // The device sequence from PLAN 18.4, reproduced without a device: iOS freezes the page
    // inside pauseWebStore's worker round trip and delivers the foreground signal first, so the
    // resume runs while the pause is still in flight and before it has published any state.
    const pausing = plugin.pauseWebStore();
    const resuming = plugin.resumeWebStore();
    await Promise.all([pausing, resuming]);

    // Before the fix this read failed with "Database race is not open": the resume had returned a
    // no-op and the pause then closed every connection with nothing left to reopen them.
    expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
    await db.run('INSERT INTO t (v) VALUES (?)', ['after the race']);
    expect((await db.query('SELECT v FROM t ORDER BY id')).values).toEqual([{ v: 'before' }, { v: 'after the race' }]);
  });

  test(`${label}: the store is usable again after a raced pause and resume, without a second cycle`, async () => {
    const { plugin } = await boot(tier, 'race2');
    const db = await seeded(plugin, 'race2');

    // Same race, driven the way the plugin's own listener drives it: neither call is awaited by
    // the caller, which is what `void (going ? pause : resume)()` does in watchAppState.
    void plugin.pauseWebStore();
    await plugin.resumeWebStore();

    expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
  });

  test(`${label}: a transaction open at pause time is rolled back and reported`, async () => {
    const { plugin } = await boot(tier, 'txn');
    const db = await seeded(plugin, 'txn');
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => warnings.push(args.join(' '));
    try {
      await db.beginTransaction();
      await db.run('INSERT INTO t (v) VALUES (?)', ['uncommitted'], false);
      await plugin.pauseWebStore();
    } finally {
      console.warn = originalWarn;
    }
    await plugin.resumeWebStore();

    if (tier === 1) {
      expect(warnings.join(' ')).toMatch(/rolled back an open transaction on txn/i);
      // Rolled back means rolled back: the uncommitted row is not there.
      expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
    }
  });

  test(`${label}: restartWebStore rebuilds the store and reopens what was open`, async () => {
    const { plugin } = await boot(tier, 'restart');
    const db = await seeded(plugin, 'restart');

    await plugin.restartWebStore();

    expect(plugin.getWebStoreTier()).toBe(tier);
    if (tier === 1) {
      // Tier 1 is durable across a worker teardown; tier 2 keeps its image only to a flush point,
      // which is why the assertion is scoped.
      expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
    }
  });
});

describe('recovery when the gentle path cannot run', () => {
  test('a worker that dies while paused is replaced, and the data comes back', async () => {
    const { plugin } = await boot(1, 'dead');
    const db = await seeded(plugin, 'dead');
    await plugin.pauseWebStore();

    // What a real suspension can do behind our back: the worker is simply gone, so `unpause`
    // never arrives and the heavy path is the only way back.
    (plugin as any).client.terminate();

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => warnings.push(args.join(' '));
    try {
      await plugin.resumeWebStore();
    } finally {
      console.warn = originalWarn;
    }

    expect(warnings.join(' ')).toMatch(/restarting the worker/i);
    expect(plugin.getWebStoreTier()).toBe(1);
    expect((await db.query('SELECT v FROM t')).values).toEqual([{ v: 'before' }]);
    await db.run('INSERT INTO t (v) VALUES (?)', ['after recovery']);
    expect((await db.query('SELECT v FROM t ORDER BY id')).values).toEqual([{ v: 'before' }, { v: 'after recovery' }]);
  });
});
