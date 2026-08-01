/**
 * Error plumbing for the web implementation.
 *
 * The jeep-based facade wrapped everything in `throw new Error(\`${err}\`)`, which turned a real
 * Error into the string "Error: ...". Errors are rebuilt from the worker payload here instead,
 * so `err.message` stays clean and the `name` survives the structured-clone boundary.
 */
import type { WorkerErrorPayload } from './protocol';

export const WEBSTORE_NOT_OPEN = 'WebStore is not open yet. You have to call "initWebStore()" first.';

export const MULTI_TAB_LOCKED =
  'Database is open in another tab or window. @capacitor-community/sqlite supports a single ' +
  'owning context per origin on the web; close the other tab and retry.';

/**
 * A worker that fails to load has two very different causes, and telling them apart is the
 * difference between a five-minute bundler fix and an unsupported browser.
 *
 * A parse failure means the engine is below the floor documented in docs/Web-Usage.md: the
 * shipped worker and `@sqlite.org/sqlite-wasm` inside it are ES2020, and BigInt is a runtime
 * dependency of int64 that no transpiler can supply. Anything else is almost always the bundler
 * failing to serve `dist/web-worker.js` or `dist/sqlite3.wasm`.
 *
 * One parse failure is not an old engine at all, and it is the common one: a worker URL that
 * 404s is answered with the application's own HTML, and the browser then reports
 * `Unexpected token '<'` on a perfectly modern engine. Checked first, because a missing asset
 * blamed on the user's browser sends them somewhere there is no fix.
 *
 * The raw browser message is always appended: a guess that hides the evidence is worse than no
 * guess at all.
 */
export function workerLoadFailure(raw: string): SQLiteWebError {
  const detail = raw && raw.trim().length > 0 ? raw.trim() : 'no further detail from the browser';
  if (/Unexpected token ['"`<]?</.test(detail) || /<!DOCTYPE|<html/i.test(detail)) {
    return new SQLiteWebError(
      'The SQLite worker URL returned HTML instead of JavaScript, which means it did not resolve: ' +
        'your bundler is not emitting dist/web-worker.js, or the server answered the request with ' +
        'the application page. Serve dist/web-worker.js and dist/sqlite3.wasm side by side, or ' +
        `supply your own worker with setSqliteWorkerFactory(). Browser reported: ${detail}`,
      { name: 'SQLiteWebWorkerLoadError', code: 'WORKER_LOAD_FAILED' },
    );
  }
  if (/SyntaxError|Unexpected (token|identifier|end of input)/i.test(detail)) {
    return new SQLiteWebError(
      'The SQLite worker could not be parsed by this browser, which means it is below the minimum ' +
        'this plugin supports (Chrome/Android WebView 80, Safari 14, Firefox 74). This cannot be ' +
        `fixed by changing your build target. Browser reported: ${detail}`,
      { name: 'SQLiteWebUnsupportedEngineError', code: 'UNSUPPORTED_ENGINE' },
    );
  }
  return new SQLiteWebError(
    'The SQLite worker failed to load. Check that your bundler serves dist/web-worker.js and ' +
      'dist/sqlite3.wasm, or supply your own worker with setSqliteWorkerFactory(). ' +
      `Browser reported: ${detail}`,
    { name: 'SQLiteWebWorkerLoadError', code: 'WORKER_LOAD_FAILED' },
  );
}

export class SQLiteWebError extends Error {
  readonly code?: string;

  constructor(message: string, options?: { name?: string; code?: string; cause?: unknown }) {
    super(message);
    this.name = options?.name ?? 'SQLiteWebError';
    this.code = options?.code;
    if (options?.cause !== undefined) (this as any).cause = options.cause;
  }
}

/** Turn anything thrown into a message without the "Error: " prefix a template literal adds. */
export function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  const message = (err as any)?.message;
  return typeof message === 'string' ? message : String(err);
}

/** Shape an arbitrary throwable for postMessage (Error is cloneable, but not all fields survive). */
export function toErrorPayload(err: unknown): WorkerErrorPayload {
  return {
    message: messageOf(err),
    name: err instanceof Error ? err.name : undefined,
    code: (err as any)?.code !== undefined ? String((err as any).code) : undefined,
  };
}

/** Rebuild an Error on the main thread from what the worker sent. */
export function fromErrorPayload(payload: WorkerErrorPayload | undefined): SQLiteWebError {
  return new SQLiteWebError(payload?.message ?? 'Unknown worker error', {
    name: payload?.name,
    code: payload?.code,
  });
}

/** Prefix a message the way the native implementations do, without stringifying the Error. */
export function prefixed(prefix: string, err: unknown): SQLiteWebError {
  return new SQLiteWebError(`${prefix}: ${messageOf(err)}`, {
    name: err instanceof Error ? err.name : undefined,
    code: (err as any)?.code !== undefined ? String((err as any).code) : undefined,
    cause: err,
  });
}
