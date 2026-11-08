// Deterministic frame capture of index.html with headless Chrome (puppeteer-core).
// The page exposes window.SCENE = {dur} and window.renderAt(tSeconds); every frame is a pure function of t.
//   node capture.mjs --count                      -> prints the frame count (29.97 fps)
//   node capture.mjs --range 0:90 --out DIR       -> writes DIR/f_00000.png ... (3840x2160, downscaled later)
//   node capture.mjs --stills 0.5,2,4 --out DIR   -> writes DIR/t_0.50.png at 1920x1080 for quick review
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
let puppeteer;
puppeteer = (await import('puppeteer-core')).default;   // npm install (see package.json)
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const FPS = 30000 / 1001;
const html = 'file://' + path.join(__dir, 'index.html');
const stills = opt('--stills');
const dsf = +(opt('--dsf') || (stills ? 1 : 2));
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: dsf });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('PAGE', m.type(), m.text()); });
page.on('pageerror', e => console.log('PAGE EXC', e.message));
await page.goto(html + '?capture=1', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.sceneReady ? window.sceneReady() : null);
const dur = await page.evaluate(() => window.SCENE.dur);
const N = Math.round(dur * FPS);
if (args.includes('--count')) { console.log(N); await Promise.race([browser.close(), new Promise(r => setTimeout(r, 4000))]); process.exit(0); }
const outDir = path.resolve(opt('--out') || path.join(__dir, '..', '_frames'));
fs.mkdirSync(outDir, { recursive: true });
let jobs;
if (stills) jobs = stills.split(',').map(Number).map(t => ({ t, f: path.join(outDir, `t_${t.toFixed(2)}.png`) }));
else {
  const [a, b] = (opt('--range') || `0:${N}`).split(':').map(Number);
  jobs = [];
  for (let i = a; i < Math.min(b, N); i++) jobs.push({ t: i / FPS, f: path.join(outDir, `f_${String(i).padStart(5, '0')}.png`) });
}
const t0 = Date.now();
for (const j of jobs) {
  await page.evaluate(t => window.renderAt(t), j.t);
  await page.screenshot({ path: j.f, type: 'png', optimizeForSpeed: true });
}
console.log(`${jobs.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${outDir}`);
// Chrome occasionally hangs on close under heavy load: don't let that block the render
await Promise.race([browser.close(), new Promise(r => setTimeout(r, 4000))]);
process.exit(0);
