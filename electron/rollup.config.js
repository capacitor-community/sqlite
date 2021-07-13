import commonjs from '@rollup/plugin-commonjs';
import NodeResolve from '@rollup/plugin-node-resolve';

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
  external: ['@capacitor/core'],
  plugins: [NodeResolve(), commonjs()],
};
