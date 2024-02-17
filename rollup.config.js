export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorCapacitorSQLite',
      globals: {
        '@capacitor/core': 'capacitorExports',
        'localforage': 'localForage',
        'sql.js': 'initSqlJs',
        'fs': 'FS',
        'path': 'Path',
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
  external: ['@capacitor/core', 'localforage', 'sql.js', 'fs', 'path'],
};
