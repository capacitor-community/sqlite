/**
 * How the worker gets constructed, and the two escape hatches around it.
 *
 * The shipped worker is a self-contained classic script at `dist/web-worker.js` with
 * `sqlite3.wasm` beside it. Classic rather than a module worker on purpose: OPFS sync access
 * handles land in Firefox 111 but module workers only in Firefox 114, so an ESM worker would
 * fail to load outright on browsers that can otherwise run tier 1.
 *
 * Bundlers that inline this module lose the ability to resolve that URL, which is what
 * `setSqliteWorkerFactory` is for. It is an additive export: it does not appear in
 * `CapacitorSQLitePlugin` and does not change any existing signature.
 */
import { DEFAULT_POOL_DIRECTORY, DEFAULT_POOL_NAME } from './protocol';
import type { WorkerInitArgs } from './protocol';

export type SqliteWorkerFactory = () => Worker;

let workerFactory: SqliteWorkerFactory | null = null;

const options: WorkerInitArgs = {
  poolName: DEFAULT_POOL_NAME,
  directory: DEFAULT_POOL_DIRECTORY,
};

/**
 * Supply your own worker, for bundlers that cannot resolve the shipped one.
 *
 * ```ts
 * import { setSqliteWorkerFactory } from '@capacitor-community/sqlite';
 * setSqliteWorkerFactory(() => new Worker(new URL('...', import.meta.url), { type: 'module' }));
 * ```
 */
export function setSqliteWorkerFactory(factory: SqliteWorkerFactory | null): void {
  workerFactory = factory;
}

/**
 * Override the pool identity or force the IndexedDB tier.
 *
 * The pool name and directory are part of the on-disk contract: changing them on an existing
 * installation orphans the databases already stored under the old name.
 */
export function setSqliteWebOptions(overrides: Partial<WorkerInitArgs>): void {
  Object.assign(options, overrides);
}

export function getSqliteWebOptions(): WorkerInitArgs {
  return { ...options };
}

/**
 * `dist/web-worker.js` relative to whichever build is running: `dist/esm/web/worker-factory.js`
 * for the module build, `dist/plugin.js` for the iife/cjs bundles.
 */
function defaultWorkerUrl(): URL {
  const here = new URL('.', import.meta.url);
  const root = here.pathname.endsWith('/esm/web/') ? new URL('../../', here) : here;
  return new URL('web-worker.js', root);
}

export function createSqliteWorker(): Worker {
  if (workerFactory) return workerFactory();
  return new Worker(defaultWorkerUrl());
}
