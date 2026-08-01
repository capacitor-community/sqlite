/**
 * Tier selection, which is the part of this implementation that can lose data if it guesses.
 *
 * A busy pool and an unsupported platform produce rejections that look alike; only the first
 * must fail loudly. Falling back on a busy pool would open an empty `:memory:` database over the
 * user's real data and then flush that empty image over the stored one.
 *
 * Everything here lives in one file on purpose: vitest browser mode gives each test FILE its own
 * storage partition, so a second owning context has to be a second worker inside one file.
 */
import { afterEach, describe, expect, test } from 'vitest';

import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

import { stopHarness } from './harness';

setSqliteWorkerFactory(
  () => new Worker(new URL('../../src/web/worker/worker.ts', import.meta.url), { type: 'module' }),
);

const open: CapacitorSQLiteWeb[] = [];

afterEach(async () => {
  await Promise.all(open.splice(0).map((p) => p.closeWebStore()));
  await stopHarness();
});

function makePlugin(): CapacitorSQLiteWeb {
  const plugin = new CapacitorSQLiteWeb();
  open.push(plugin);
  return plugin;
}

describe('tier selection', () => {
  test('a healthy environment selects tier 1 without cross-origin isolation', async () => {
    setSqliteWebOptions({
      forceTier2: false,
      simulateInstallError: undefined,
      poolName: 'tiers-happy',
      directory: '.tiers-happy',
    });
    const plugin = makePlugin();
    await new SQLiteConnection(plugin).initWebStore();
    expect(plugin.getWebStoreTier()).toBe(1);
    expect(self.crossOriginIsolated).toBe(false);
  });

  test('a second owning context is refused, not downgraded to tier 2', async () => {
    setSqliteWebOptions({
      forceTier2: false,
      simulateInstallError: undefined,
      poolName: 'tiers-shared',
      directory: '.tiers-shared',
    });
    const first = makePlugin();
    await new SQLiteConnection(first).initWebStore();
    expect(first.getWebStoreTier()).toBe(1);

    const second = makePlugin();
    await expect(new SQLiteConnection(second).initWebStore()).rejects.toThrow(/another tab or window/i);
    // The critical assertion: it did NOT silently become a tier 2 store.
    expect(second.getWebStoreTier()).toBeNull();
  });

  test('releasing the store lets the next context take over', async () => {
    setSqliteWebOptions({
      forceTier2: false,
      simulateInstallError: undefined,
      poolName: 'tiers-handover',
      directory: '.tiers-handover',
    });
    const first = makePlugin();
    await new SQLiteConnection(first).initWebStore();
    await first.closeWebStore();

    const second = makePlugin();
    await new SQLiteConnection(second).initWebStore();
    expect(second.getWebStoreTier()).toBe(1);
  });

  test('a busy-pool rejection that slips past the lock still fails loudly', async () => {
    setSqliteWebOptions({
      forceTier2: false,
      poolName: 'tiers-busy',
      directory: '.tiers-busy',
      simulateInstallError: 'NoModificationAllowedError',
    });
    const plugin = makePlugin();
    await expect(new SQLiteConnection(plugin).initWebStore()).rejects.toThrow(/another tab or window/i);
    expect(plugin.getWebStoreTier()).toBeNull();
  });

  test('an unrecognised rejection fails loudly rather than guessing', async () => {
    setSqliteWebOptions({
      forceTier2: false,
      poolName: 'tiers-weird',
      directory: '.tiers-weird',
      simulateInstallError: 'SomethingNobodyPlannedFor',
    });
    const plugin = makePlugin();
    await expect(new SQLiteConnection(plugin).initWebStore()).rejects.toThrow(/opfs-sahpool/i);
    expect(plugin.getWebStoreTier()).toBeNull();
  });

  test.each(['Missing required OPFS APIs.', 'The local OPFS API is too old for opfs-sahpool'])(
    'a genuine capability gap (%s) falls back to tier 2',
    async (message) => {
      setSqliteWebOptions({
        forceTier2: false,
        poolName: `tiers-gap-${message.length}`,
        directory: `.tiers-gap-${message.length}`,
        simulateInstallError: message,
      });
      const plugin = makePlugin();
      await new SQLiteConnection(plugin).initWebStore();
      expect(plugin.getWebStoreTier()).toBe(2);
    },
  );

  test('methods refuse to run before initWebStore', async () => {
    const plugin = new CapacitorSQLiteWeb();
    await expect(plugin.createConnection({ database: 'nope' })).rejects.toThrow(/initWebStore/);
    await expect(plugin.getDatabaseList()).rejects.toThrow(/initWebStore/);
  });
});
