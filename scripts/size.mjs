// Budget (per spec): the core engine, tree-shaken, minified, gzipped, under 6 KB.
// Also reports core + one effect and the full CDN bundle for information.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 6 * 1024;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const measure = async (contents) => {
  const { outputFiles } = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, minify: true, format: 'esm', target: 'es2019', write: false,
  });
  return gz(outputFiles[0].contents);
};

const core = await measure("export { Effects, registerEffect } from './src/core.ts';");
const withSnow = await measure("export { Effects, registerEffect, snow } from './src/core.ts';");
const withWinter = await measure("export { Effects, registerEffect, winter } from './src/core.ts';");
const full = gz(readFileSync('dist/atmosfx.global.js'));
console.log(`core engine:        ${core} B gz (budget ${BUDGET})`);
console.log(`core + snow:        ${withSnow} B gz`);
console.log(`core + winter:      ${withWinter} B gz (snow bank / frost / icicles scene)`);
console.log(`full CDN (all 10):  ${full} B gz`);
if (core > BUDGET) process.exit(1);
