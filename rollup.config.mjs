import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const wasmSource = require.resolve('@sqlite.org/sqlite-wasm/sqlite3.wasm');

/**
 * The web worker ships as a prebuilt CLASSIC script rather than a module worker: OPFS sync
 * access handles land in Firefox 111 but module workers only in Firefox 114, so an ESM worker
 * would fail to load outright on browsers that can otherwise run the OPFS tier. Classic output
 * costs nothing, the two builds being within a fraction of a KiB of each other.
 *
 * Rollup rewrites `import.meta.url` to a `document.currentScript` expression for iife output,
 * which throws "document is not defined" inside a worker. `self.location.href` is the worker
 * equivalent, and it is also what sqlite-wasm's own `new URL('sqlite3.wasm', import.meta.url)`
 * needs in order to find the wasm sitting next to the worker file.
 */
const importMetaUrlInWorker = {
  name: 'import-meta-url-in-worker',
  resolveImportMeta(property) {
    return property === 'url' ? 'self.location.href' : null;
  },
};

/** The wasm binary stays a separate asset. Base64 inlining it would cost about a third again. */
const copyWasmAsset = {
  name: 'copy-sqlite-wasm',
  writeBundle() {
    copyFileSync(wasmSource, 'dist/sqlite3.wasm');
  },
};

export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/plugin.js',
        format: 'iife',
        name: 'capacitorCapacitorSQLite',
        globals: {
          '@capacitor/core': 'capacitorExports',
        },
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/plugin.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: ['@capacitor/core'],
  },
  {
    input: 'dist/esm/web/worker/worker.js',
    output: {
      file: 'dist/web-worker.js',
      format: 'iife',
      sourcemap: true,
    },
    plugins: [nodeResolve({ browser: true }), importMetaUrlInWorker, terser(), copyWasmAsset],
  },
];
