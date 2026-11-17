// Fails if the gzipped full bundle (core + built-in effects) exceeds the budget.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const BUDGET = 6 * 1024;
const gz = gzipSync(readFileSync(new URL('../dist/atmosfx.global.js', import.meta.url)), { level: 9 }).length;
console.log(`atmosfx.global.js: ${gz} B gzipped (budget ${BUDGET})`);
if (gz > BUDGET) process.exit(1);
