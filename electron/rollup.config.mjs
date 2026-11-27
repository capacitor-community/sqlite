import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

const assertCapacitorSQLiteExport = {
  name: 'assert-capacitor-sqlite-export',
  generateBundle(_outputOptions, bundle) {
    if (!bundle['plugin.js'].exports.includes('CapacitorSQLite')) {
      this.error('plugin.js has no CapacitorSQLite export, which @capacitor-community/electron looks up.');
    }
  },
};

export default {
  input: 'electron/build/electron/src/index.js',
  output: [
    {
      file: 'electron/dist/plugin.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
    },
  ],
  external: [
    '@capacitor/core',
    'electron',
    'electron-json-storage',
    'better-sqlite3-multiple-ciphers',
    'crypto',
    'crypto-js',
    'path',
    'fs',
    'os',
    'jszip',
    'node-fetch',
  ],
  plugins: [
    nodeResolve(),
    commonjs({
      // ALWAYS keep this. The default (true) drops the top level CapacitorSQLite export
      // that @capacitor-community/electron looks up.
      strictRequires: 'auto',
      ignoreDynamicRequires: true,
      dynamicRequireTargets: ['node_modules/@capacitor-community/sqlite/electron/dist/plugin.js'],
    }),
    assertCapacitorSQLiteExport,
  ],
};
