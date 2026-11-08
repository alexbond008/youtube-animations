// Frame-stepped headless Chrome renderer (no npm deps; Node >= 22 for global WebSocket).
// usage: node render.mjs <part a|b> <fmt h|v> <out.mp4> [--frames N] [--stills t1,t2,...]
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const [part, fmt, out] = process.argv.slice(2);
const argv = process.argv.slice(5);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const FPS = 30000 / 1001;
const DUR = { a: 14.3, b: 16.0 }[part];          // content length; +1 s held last frame via tpad
const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1350 : 1080;
const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(here, 'scene.html') + `?part=${part}&fmt=${fmt}`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'q2chrome-'));

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--hide-scrollbars',
  '--force-device-scale-factor=1', '--allow-file-access-from-files', '--no-first-run', '--no-default-browser-check',
  `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 80; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = l.find((x) => x.type === 'page'); if (target) break; } catch {}
  await sleep(150);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (m) => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
for (let i = 0; i < 100; i++) { try { if (await ev('document.readyState === "complete" && !!window.renderAt')) break; } catch {} await sleep(100); }
const fontsOK = await ev('window.fontsOK()');
if (!fontsOK) { console.error('FONTS NOT LOADED'); process.exit(2); }
console.error('fonts ok');

const shot = async (t) => { await ev(`renderAt(${t})`); const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, captureBeyondViewport: false }); return Buffer.from(r.data, 'base64'); };

const stills = opt('--stills');
if (stills) {
  fs.mkdirSync(out, { recursive: true });
  for (const s of stills.split(',')) { fs.writeFileSync(path.join(out, `${part}_${fmt}_${s}.png`), await shot(parseFloat(s))); }
} else {
  const N = opt('--frames') ? parseInt(opt('--frames')) : Math.round(DUR * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30000/1001', '-c:v', 'png', '-i', '-',
    '-vf', 'tpad=stop_mode=clone:stop_duration=1.001,format=yuv420p', '-r', '30000/1001',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < N; f++) {
    const buf = await shot(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.error(`${part}/${fmt} frame ${f}/${N}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
ws.close(); const gone = new Promise((r) => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, sleep(3000)]);
try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
process.exit(0);
