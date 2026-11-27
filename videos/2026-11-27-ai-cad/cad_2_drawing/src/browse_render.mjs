// Frame-stepped composite of the captured Commons states (pattern from the gh_demo renderer).
// node browse_render.mjs <statesDir> <out.mp4> [--qa t1,t2]
import { chromium } from "../../cad_common/src/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [ST, OUTF] = [path.resolve(process.argv[2]), path.resolve(process.argv[3])];
const qaArg = process.argv.indexOf("--qa"), QA = qaArg > 0 ? process.argv[qaArg + 1].split(",").map(Number) : null;
const M = JSON.parse(fs.readFileSync(path.join(ST, "states.json")));
const FPS = 30000 / 1001, HOLD = 30, D = 13.5;
const E = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), sine: t => -(Math.cos(Math.PI * t) - 1) / 2, lin: t => t };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function kf(t, keys) { if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t1, v1, e = 'io'] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) { const u = E[e]((t - t0) / (t1 - t0)); return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * u) : v0 + (v1 - v0) * u; } }
  return keys[keys.length - 1][1]; }
const prog = (t, a, b, e = 'out') => E[e](clamp((t - a) / (b - a), 0, 1));
const cam = (z, c) => { const hw = 960 / z, hh = 540 / z; return { z, cx: clamp(c[0], hw, 1920 - hw), cy: clamp(c[1], hh, 1080 - hh) }; };
const WIN = { x: 64, y: 36, w: 1792, h: 992 }, C = { x: 64, y: 80, w: 1792, h: 948 };
const one = src => [{ src, y0: 0, h: 1e6, dsf: 2 }];
const S = (x, y, scroll) => [C.x + x, C.y + y - scroll];
const Q = "technical drawing shaft";
const T_TYPE0 = 0.6, CPS = 17, T_TYPE1 = T_TYPE0 + Q.length / CPS, T_SEARCH = T_TYPE1 + 0.3, T_RES = T_SEARCH + 0.18;
const T_CLICK = 6.5, T_FILE = T_CLICK + 0.2;
const TILE = M.tile, RES_SCROLL = Math.round(TILE.y - 330);
const LIC_SCROLL = 880;
const fileScroll = t => kf(t, [[9.3, 0], [10.6, LIC_SCROLL, 'io']]);
const resScroll = t => kf(t, [[T_RES + 0.3, 0], [5.6, RES_SCROLL, 'sine']]);
function spec(t) {
  const inp = S(M.input.x + 160, M.input.y + 16, 0), btn = S(M.input.x + M.input.w + 45, M.input.y + 16, 0);
  const tile = S(TILE.x + TILE.w / 2, TILE.y + TILE.h / 2, RES_SCROLL);
  const clicks = [[T_TYPE0 - 0.15, ...inp], [T_SEARCH, ...btn], [T_CLICK, ...tile]];
  let layers;
  if (t < T_RES) { const n = clamp(Math.floor((t - T_TYPE0) * CPS) + 1, 0, Q.length);
    layers = [{ chunks: one(n <= 0 ? 's_empty.png' : `s_t${String(n).padStart(2, '0')}.png`), alpha: 1, samples: [0] }]; }
  else if (t < T_FILE) { const a = clamp((t - T_RES) / 0.12, 0, 1);
    layers = [{ chunks: one('s_t23.png'), alpha: 1, samples: [0] }, { chunks: [{ src: 'res.png', y0: 0, h: M.resH, dsf: 2 }], alpha: a, samples: [resScroll(t)] }]; }
  else { const a = clamp((t - T_FILE) / 0.12, 0, 1);
    layers = [{ chunks: [{ src: 'res.png', y0: 0, h: M.resH, dsf: 2 }], alpha: 1, samples: [RES_SCROLL] }, { chunks: [{ src: 'file.png', y0: 0, h: M.fileH, dsf: 2 }], alpha: a, samples: [fileScroll(t)] }]; }
  const imgC = S(M.img.x + M.img.w / 2, M.img.y + M.img.h / 2, 0);
  const licC = S(946, 1318, LIC_SCROLL);
  const z = kf(t, [[0, 1.0], [0.5, 1.45], [T_SEARCH + 0.1, 1.45, 'lin'], [T_RES + 0.5, 1.0], [4.6, 1.0, 'lin'], [6.0, 1.5], [T_CLICK + 0.15, 1.55, 'lin'],
                   [T_FILE + 0.3, 1.0], [7.2, 1.0, 'lin'], [8.4, 1.6], [9.2, 1.62, 'lin'], [10.6, 1.75], [13.5, 1.8, 'out']]);
  const c = kf(t, [[0, [960, 540]], [0.5, [inp[0] + 280, inp[1] + 120]], [T_SEARCH + 0.1, [inp[0] + 420, inp[1] + 120], 'lin'], [T_RES + 0.5, [960, 540]], [4.6, [960, 540], 'lin'],
                   [6.0, [tile[0] + 120, tile[1]]], [T_CLICK + 0.15, [tile[0] + 120, tile[1]], 'lin'], [T_FILE + 0.3, [960, 540]], [7.2, [960, 540], 'lin'], [8.4, imgC], [9.2, imgC, 'lin'], [10.6, licC], [13.5, licC, 'lin']]);
  const cur = kf(t, [[0, [1100, 640]], [T_TYPE0 - 0.2, inp], [T_TYPE1, inp, 'lin'], [T_SEARCH - 0.02, btn], [T_RES + 0.4, btn, 'lin'], [4.2, [1250, 700]], [6.25, tile], [T_CLICK + 0.3, tile, 'lin'],
                     [8.0, [imgC[0] + 330, imgC[1] + 230]], [9.6, [imgC[0] + 330, imgC[1] + 230], 'lin'], [11.0, [1340, 620]]]);
  const press = clicks.some(([tc]) => t > tc - 0.06 && t < tc + 0.08) ? 0.86 : 1;
  let ripple = null; for (const [tc, x, y] of clicks) if (t >= tc && t < tc + 0.4) ripple = { x, y, p: (t - tc) / 0.4 };
  const fs_ = t >= T_FILE ? fileScroll(t) : 0;
  const lineR = { x: C.x + 625, y: C.y + 1279 - fs_, w: 643, h: 24 };
  const marks = t >= T_FILE ? [{ rects: [lineR], p: prog(t, 11.0, 11.45, 'io') }] : [];
  const rings = t >= T_FILE ? [{ x: C.x + 487, y: C.y + 1335 - fs_, r: 46, p: prog(t, 11.5, 11.85) }] : [];
  const ca = prog(t, 11.9, 12.25);
  const url = t < T_RES ? 'commons.wikimedia.org/wiki/Special:MediaSearch' : t < T_FILE ? 'commons.wikimedia.org/w/index.php?search=technical+drawing+shaft' : 'commons.wikimedia.org/wiki/File:Технический_чертёж_вала_с_размерами.png';
  return { win: WIN, content: C, url, cam: cam(z, c), layers, marks, rings, cursor: { x: cur[0], y: cur[1], k: press }, ripple,
    chip: { a: ca, sc: 0.92 + 0.08 * ca, big: 'CC0 · free to use', small: 'public domain · no permission needed' } };
}
const images = ['s_empty.png', ...Array.from({ length: Q.length }, (_, i) => `s_t${String(i + 1).padStart(2, '0')}.png`), 'res.png', 'file.png'];
const c = `${os.homedir()}/Library/Caches/ms-playwright`; const dd = fs.readdirSync(c).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()[0];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || `${c}/${dd}/chrome-headless-shell-mac-arm64/chrome-headless-shell`, args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); await page.goto('file://' + path.join(here, 'browse_compositor.html'));
await page.evaluate(([b, l]) => window.loadImages(b, l), ['file://' + ST + '/', images]);
const N = Math.round(D * FPS);
if (QA) { const qd = path.join(here, '..', 'qa', 'browse'); fs.mkdirSync(qd, { recursive: true });
  for (const t of QA) { await page.evaluate(s => window.draw(s), spec(t)); await page.screenshot({ path: path.join(qd, `frame_t${t.toFixed(1).padStart(4, '0')}.png`) }); }
  await browser.close(); process.exit(0); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'browse_'));
for (let f = 0; f < N; f++) { await page.evaluate(s => window.draw(s), spec(f / FPS)); await page.screenshot({ path: path.join(dir, `f_${String(f).padStart(4, '0')}.png`) }); }
for (let f = N; f < N + HOLD; f++) fs.copyFileSync(path.join(dir, `f_${String(N - 1).padStart(4, '0')}.png`), path.join(dir, `f_${String(f).padStart(4, '0')}.png`));
execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30000/1001', '-i', path.join(dir, 'f_%04d.png'),
  '-vf', 'scale=1920:1080:flags=lanczos:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', '30000/1001', '-movflags', '+faststart', OUTF]);
fs.rmSync(dir, { recursive: true, force: true });
await browser.close(); console.log('done', OUTF, ((N + HOLD) / FPS).toFixed(2));
