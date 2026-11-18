// Budget: core engine + one effect, tree-shaken, minified, gzipped, must stay under 6 KB.
// Also reports the full CDN bundle (every effect) for information.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 6 * 1024;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

const { outputFiles } = await build({
  stdin: { contents: "export { Effects, registerEffect, snow } from './src/core.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, minify: true, format: 'esm', target: 'es2019', write: false, treeShaking: true,
});
const core = gz(outputFiles[0].contents);
const full = gz(readFileSync('dist/atmosfx.global.js'));
console.log(`core + 1 effect: ${core} B gz (budget ${BUDGET})`);
console.log(`full CDN bundle (all effects): ${full} B gz`);
if (core > BUDGET) process.exit(1);
