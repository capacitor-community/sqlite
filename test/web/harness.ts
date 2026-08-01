/**
 * Shared harness for the web contract tests.
 *
 * Tests drive the real `SQLiteConnection` / `SQLiteDBConnection` wrappers from
 * `src/definitions.ts` over the real facade, so the wrappers are part of the surface under test
 * exactly as the M1 exit criteria require.
 *
 * The worker is supplied through `setSqliteWorkerFactory` rather than the shipped
 * `dist/web-worker.js`, so the suite runs against TypeScript sources and exercises the
 * documented escape hatch at the same time.
 */
import { SQLiteConnection } from '../../src/definitions';
import { CapacitorSQLiteWeb } from '../../src/web';
import type { Tier } from '../../src/web/protocol';
import { setSqliteWebOptions, setSqliteWorkerFactory } from '../../src/web/worker-factory';

export interface Harness {
  plugin: CapacitorSQLiteWeb;
  sqlite: SQLiteConnection;
  tier: Tier;
}

let poolCounter = 0;
let active: CapacitorSQLiteWeb | null = null;

setSqliteWorkerFactory(
  () => new Worker(new URL('../../src/web/worker/worker.ts', import.meta.url), { type: 'module' }),
);

/**
 * @param tier which durability tier to exercise. Tier 2 is forced through the documented test
 *   hook, which skips the VFS install rather than faking a failure inside sqlite-wasm.
 * @param freshPool give this suite its own pool directory so tests in the same file do not see
 *   each other's databases.
 */
export async function startHarness(tier: Tier, freshPool = true): Promise<Harness> {
  // One worker at a time. Each holds a wasm heap and, on tier 1, the pool's access handles.
  if (active) await active.closeWebStore();
  active = null;
  poolCounter += 1;
  setSqliteWebOptions({
    forceTier2: tier === 2,
    poolName: freshPool ? `capacitor-sqlite-test-${poolCounter}` : 'capacitor-sqlite',
    directory: freshPool ? `.capacitor-sqlite-test-${poolCounter}` : '.capacitor-sqlite',
  });

  const plugin = new CapacitorSQLiteWeb();
  const sqlite = new SQLiteConnection(plugin);
  await sqlite.initWebStore();

  active = plugin;
  const selected = plugin.getWebStoreTier();
  if (selected !== tier) throw new Error(`harness expected tier ${tier} but got ${selected}`);
  return { plugin, sqlite, tier };
}

/** Both tiers, so every contract test runs twice. */
export const TIERS: Tier[] = [1, 2];

export function tierLabel(tier: Tier): string {
  return tier === 1 ? 'tier 1 (opfs-sahpool)' : 'tier 2 (:memory: + IndexedDB)';
}

/** Release the worker held by the most recent startHarness call. */
export async function stopHarness(): Promise<void> {
  if (active) await active.closeWebStore();
  active = null;
}
