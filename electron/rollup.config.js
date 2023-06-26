import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

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
    'path',
    'fs',
    'os',
    'jszip',
    'node-fetch',
  ],
  plugins: [
    nodeResolve(),
    commonjs({
      ignoreDynamicRequires: true,
      dynamicRequireTargets: [
        'node_modules/@capacitor-community/sqlite/electron/dist/plugin.js',
      ],
    }),
  ],
};
