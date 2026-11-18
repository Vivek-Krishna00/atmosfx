// Runs demo/bench.html in real Chrome with CDP CPU throttling and prints fps / main-thread cost.
// Usage: npm run build && npm run bench [-- --headed]
// Filters: EFFECTS=snow,rain RATES=6,20 QUALITIES=auto
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';

const page_url = pathToFileURL(fileURLToPath(new URL('../demo/bench.html', import.meta.url))).href;
const headed = process.argv.includes('--headed');
const WARMUP = 3000;
const MEASURE = 6000;

const cases = [];
for (const vp of [
  { name: 'laptop 1366x768 @1x', width: 1366, height: 768, dpr: 1 },
  { name: 'phone 390x844 @3x', width: 390, height: 844, dpr: 3 },
])
  for (const rate of (process.env.RATES || '1,6,20').split(',').map(Number))
    for (const effect of (process.env.EFFECTS || 'snow,winter,rain,cherry-blossom,autumn,summer,confetti,stars,fog,thunderstorm').split(','))
      for (const quality of (process.env.QUALITIES || 'auto,low').split(',')) cases.push({ vp, rate, effect, quality });

const browser = await chromium.launch({ channel: 'chrome', headless: !headed });
const rows = [];
for (const c of cases) {
  const ctx = await browser.newContext({ viewport: { width: c.vp.width, height: c.vp.height }, deviceScaleFactor: c.vp.dpr });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.rate });
  await cdp.send('Performance.enable');
  await page.goto(`${page_url}?effect=${c.effect}&quality=${c.quality}&intensity=1`);
  await page.waitForTimeout(WARMUP);
  const metric = async () => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  };
  const m0 = await metric();
  const f0 = await page.evaluate(() => performance.now());
  const samples = [];
  for (let t = 0; t < MEASURE; t += 1000) {
    await page.waitForTimeout(1000);
    samples.push(await page.evaluate(() => window.__bench()));
  }
  const m1 = await metric();
  const elapsed = (await page.evaluate(() => performance.now())) - f0;
  const last = samples.at(-1);
  const fps = samples.map((s) => s.rafFps).sort((a, b) => a - b);
  const effFps = samples.map((s) => s.fps).sort((a, b) => a - b);
  const frames = (elapsed / 1000) * fps[fps.length >> 1];
  rows.push({
    viewport: c.vp.name,
    cpu: `${c.rate}x`,
    effect: c.effect,
    quality: c.quality,
    'page fps (min/med)': `${fps[0]}/${fps[fps.length >> 1]}`,
    'effect fps': effFps[effFps.length >> 1],
    particles: last.particles,
    tier: `${last.quality} L${last.level}`,
    dpr: last.dpr,
    'main ms/frame': (((m1.TaskDuration - m0.TaskDuration) * 1000) / frames).toFixed(2),
  });
  console.error(JSON.stringify(rows.at(-1)));
  await ctx.close();
}
await browser.close();
console.table(rows);
