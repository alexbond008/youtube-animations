// Frame-stepped headless Chrome renderer for scene.html.
// Usage:
//   node render.mjs --w 1920 --h 1080 --out ../q3_fifty_users_1080p.mp4 [--notext]
//   node render.mjs --w 1920 --h 1080 --stills 2.0,6.5,... --stilldir ../qa --prefix frame
// Needs playwright-core (NODE_PATH or local node_modules) and a Chromium headless shell (CHROME env).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright-core');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const W = +opt('w', 1920), H = +opt('h', 1080);
const notext = args.includes('--notext');
const out = opt('out');
const stills = opt('stills');
const here = path.dirname(fileURLToPath(import.meta.url));
const FR = 1001 / 30000;

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const url = pathToFileURL(path.join(here, 'scene.html')).href + `?w=${W}&h=${H}&notext=${notext ? 1 : 0}`;
await page.goto(url);
await page.evaluate(() => window.ready);
const dur = await page.evaluate(() => window.DURATION);

async function shot(t) {
  await page.evaluate((t) => window.render(t), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
}

if (stills) {
  const fs = await import('node:fs');
  const dir = opt('stilldir', path.join(here, '..', 'qa'));
  const prefix = opt('prefix', 'frame');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of stills.split(',')) {
    const t = +s;
    const buf = await shot(t);
    const name = `${prefix}_${t.toFixed(2).replace('.', 'p')}.png`;
    fs.writeFileSync(path.join(dir, name), buf);
    console.log('wrote', name);
  }
} else {
  const n = Math.round(dur / FR);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30000/1001', '-i', '-',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-r', '30000/1001', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = await shot(i * FR);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('done', out, n, 'frames');
}
await browser.close();
