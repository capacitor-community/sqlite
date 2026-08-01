import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * An in-memory fixture endpoint on the dev server.
 *
 * copyFromAssets and getFromHTTPRequest fetch from inside the worker, which has its own global
 * scope, so stubbing `fetch` on the main thread would not reach them. Tests PUT real database
 * bytes here and then point the plugin at the resulting URLs, which exercises the actual
 * network path (real fetch, real ReadableStream body) without ever leaving localhost.
 */
function fixtureServer() {
  const store = new Map();
  return {
    name: 'sqlite-web-test-fixtures',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const path = (req.url || '').split('?')[0];
        if (!path.startsWith('/__fixture/')) return next();
        if (req.method === 'PUT') {
          const chunks: any[] = [];
          req.on('data', (chunk: any) => chunks.push(chunk));
          req.on('end', () => {
            store.set(path, Buffer.concat(chunks));
            res.statusCode = 204;
            res.end();
          });
          return;
        }
        if (req.method === 'DELETE') {
          store.clear();
          res.statusCode = 204;
          res.end();
          return;
        }
        const body = store.get(path);
        if (!body) {
          res.statusCode = 404;
          res.end('no fixture');
          return;
        }
        res.setHeader('content-type', 'application/octet-stream');
        res.setHeader('content-length', String(body.length));
        res.end(body);
      });
    },
  };
}

/**
 * Real Chromium, not jsdom: OPFS sync access handles and dedicated workers do not exist there,
 * and both are load-bearing for this implementation.
 *
 * browser.fileParallelism stays on. opfs-sahpool is single-owner per origin, which looks like it
 * would collide across parallel files, but each file runs in its own Playwright browser context
 * with its own storage partition. The consequence is the opposite of the obvious one: any
 * multi-context scenario has to be built inside a single file with several workers.
 */
export default defineConfig({
  plugins: [fixtureServer()],
  optimizeDeps: {
    // sqlite-wasm resolves sqlite3.wasm with `new URL('sqlite3.wasm', import.meta.url)`.
    // Pre-bundling moves the module and breaks that resolution.
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  test: {
    include: ['test/web/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }],
    },
  },
});
