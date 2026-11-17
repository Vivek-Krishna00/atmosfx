import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', core: 'src/core.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: true,
    target: 'es2019',
  },
  {
    entry: { atmosfx: 'src/index.ts' },
    format: ['iife'],
    globalName: 'atmosfx',
    minify: true,
    target: 'es2019',
    outExtension: () => ({ js: '.global.js' }),
  },
]);
