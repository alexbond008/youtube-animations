// Step 2: frame-stepped compositing of the captured states. Usage: node render.js <hook|repo|history|all> [--qa]
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const STATES = process.env.STATES_DIR || path.join(__dirname, '.states');
const FRAMES = process.env.FRAMES_DIR || path.join(os.tmpdir(), 'gh_demo_frames');
const OUT = path.resolve(__dirname, '..');
const FPS = 30000 / 1001, HOLD = 30;
const M = JSON.parse(fs.readFileSync(path.join(STATES, 'states.json')));

// ---------- easing + keyframes
const E = { lin: t => t, io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3),
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2, in: t => t * t * t };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function kf(t, keys) { // keys: [time, value, easeIntoThisKey?]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t1, v1, e = 'io'] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) { const u = E[e]((t - t0) / (t1 - t0)); return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * u) : v0 + (v1 - v0) * u; } }
  return keys[keys.length - 1][1]; }
const prog = (t, a, b, e = 'out') => E[e](clamp((t - a) / (b - a), 0, 1));
function cam(z, c, W = 1920, H = 1080, x0 = 0, y0 = 0) { // clamp so the view never leaves the scene
  const hw = 960 / z, hh = 540 / z; return { z, cx: clamp(c[0], x0 + hw, x0 + W - hw), cy: clamp(c[1], y0 + hh, y0 + H - hh) }; }
const ripple = (t, clicks) => { for (const [tc, x, y] of clicks) if (t >= tc && t < tc + 0.4) return { x, y, p: (t - tc) / 0.4 }; return null; };
const press = (t, clicks) => clicks.some(([tc]) => t > tc - 0.06 && t < tc + 0.08) ? 0.86 : 1;
// framed browser window on the dotted background
const WIN = { x: 64, y: 36, w: 1792, h: 992 }, C = { x: 64, y: 80, w: 1792, h: 948 };
const one = src => [{ src, y0: 0, h: 1e6, dsf: 2 }];
const S = (sx, sy, scroll) => [C.x + sx, C.y + sy - scroll]; // doc -> scene
const fade = (t, list) => { // list: [startTime, chunks, scrollFn] ; 3-frame crossfades
  const L = []; list.forEach(([ts, chunks, sc], i) => { const next = list[i + 1];
    const a = t < ts ? 0 : Math.min(1, (t - ts) / 0.1); if (a <= 0) return; if (next && t >= next[0] + 0.1) return;
    L.push({ chunks, alpha: i === 0 ? 1 : a, samples: [sc(t)] }); }); return L; };

const clips = {
  // 1 ---- org page -> search "math" -> repo -> README
  hook: { out: 'gh_hook_demo_1080p.mp4', D: 5.0, spec(t) {
    const orgScroll = kf(t, [[0.9, 0], [1.3, 220, 'io']]);
    const repoScroll = kf(t, [[2.3, 0], [5.0, 830, 'sine']]);
    const inp = S(420, 763, 0), math = S(M.org.math.x + 19, M.org.math.y + 12, 220);
    const clicks = [[0.50, ...inp], [1.40, ...math]];
    const org = n => [[0, one('org_0.png')], [0.50, one('org_focus.png')], [0.62, one('org_t1.png')], [0.66, one('org_t2.png')], [0.70, one('org_t3.png')], [0.74, one('org_t4.png')], [0.86, one('org_res.png')]];
    const seq = [...org().map(([ts, ch]) => [ts, ch, () => orgScroll]), [1.50, one('repo.png'), () => repoScroll]];
    // hard cuts for typing, 3-frame crossfade for page loads
    let layers = []; for (let i = seq.length - 1; i >= 0; i--) if (t >= seq[i][0]) { layers.push({ chunks: seq[i][1], alpha: 1, samples: [seq[i][2](t)] });
      const soft = seq[i][0] === 0.86 || seq[i][0] === 1.50; const a = (t - seq[i][0]) / 0.1;
      if (soft && a < 1 && i > 0) { layers = [{ chunks: seq[i - 1][1], alpha: 1, samples: [seq[i - 1][2](t)] }, { chunks: seq[i][1], alpha: a, samples: [seq[i][2](t)] }]; } break; }
    const z = kf(t, [[0, 1.0], [0.6, 1.75], [1.45, 1.75, 'lin'], [2.1, 1.0], [2.35, 1.0, 'lin'], [4.6, 1.4], [5.0, 1.45, 'out']]);
    const c = kf(t, [[0, [960, 540]], [0.6, [620, 790]], [0.9, [620, 790], 'lin'], [1.35, [600, 720]], [1.45, [600, 720], 'lin'], [2.1, [960, 540]], [2.35, [960, 540], 'lin'], [4.6, [804, 470]], [5.0, [804, 480], 'out']]);
    const cur = kf(t, [[0, [1250, 640]], [0.45, inp], [0.95, inp, 'lin'], [1.32, math], [1.55, math, 'lin'], [2.6, [1330, 700]]]);
    return { win: WIN, content: C, url: t < 0.86 ? 'github.com/openai' : t < 1.5 ? 'github.com/openai?q=math' : 'github.com/openai/math',
      cam: cam(z, c), layers, cursor: { x: cur[0], y: cur[1], k: press(t, clicks) }, ripple: ripple(t, clicks) }; },
    images: () => ['org_0.png', 'org_focus.png', 'org_t1.png', 'org_t2.png', 'org_t3.png', 'org_t4.png', 'org_res.png', 'repo.png'] },

  // 2 ---- repo -> click preprints -> race through the folder list, counter to 719
  repo: { out: 'gh_repo_anim_1080p.mp4', D: 3.5, spec(t, dt) {
    const pre = S(M.repo.preprints.x + 29, M.repo.preprints.y + 9, 0);
    const clicks = [[0.60, ...pre]];
    const FINAL = M.pre.H - C.h, T0 = 1.0, T1 = 3.2;
    const sc = tt => kf(tt, [[T0, 0], [T1, FINAL, 'io']]);
    // motion blur: 180-degree shutter, one sample per ~10 px of travel
    // (blur length capped at 24 px: each frame still shows readable folder rows, as in a real fast scroll)
    const y = sc(t), ext = Math.min(24, Math.abs(sc(t + dt / 4) - sc(t - dt / 4))), k = clamp(Math.ceil(ext / 3), 1, 8);
    const samples = k === 1 ? [y] : Array.from({ length: k }, (_, i) => y - ext / 2 + ext * (i + 0.5) / k);
    const preL = { chunks: M.pre.chunks, alpha: 1, samples };
    const repoL = { chunks: one('repo.png'), alpha: 1, samples: [0] };
    const layers = t < 0.70 ? [repoL] : t < 0.80 ? [repoL, { ...preL, alpha: (t - 0.70) / 0.1, samples: [0] }] : [preL];
    const z = kf(t, [[0, 1.12], [0.55, 1.65], [0.7, 1.65, 'lin'], [1.05, 1.2], [3.2, 1.3, 'lin'], [3.5, 1.36, 'out']]);
    const c = kf(t, [[0, [820, 500]], [0.55, [560, 545]], [0.7, [560, 545], 'lin'], [1.05, [1110, 600]], [3.5, [1110, 600], 'lin']]);
    const cur = kf(t, [[0, [900, 770]], [0.5, pre], [0.75, pre, 'lin'], [1.4, [1560, 690]]]);
    const n = Math.round(719 * clamp(sc(t) / FINAL, 0, 1));
    const ca = prog(t, 0.85, 1.15), pulse = t >= T1 ? Math.max(0, 1 - (t - T1) / 0.6) : 0;
    return { win: WIN, content: C, url: t < 0.7 ? 'github.com/openai/math' : 'github.com/openai/math/tree/main/preprints',
      cam: cam(z, c), layers, cursor: { x: cur[0], y: cur[1], k: press(t, clicks) }, ripple: ripple(t, clicks),
      chip: { a: ca, sc: (0.92 + 0.08 * ca) * (1 + 0.07 * Math.sin(Math.PI * Math.min(1, pulse > 0 ? (t - T1) / 0.35 : 0))), n, pulse } }; },
    images: () => ['repo.png', ...M.pre.chunks.map(c => c.src)] },

  // 3 ---- history.md, zoomed on the October 7, 2026 section, marker sweeps
  history: { out: 'gh_history_zoom_1080p.mp4', D: 5.0, spec(t) {
    const H = M.hist, HC = { x: 0, y: H.y0, w: 1100, h: H.h };
    const z = kf(t, [[0, 1.98], [5.0, 2.12, 'sine']]);
    const c = kf(t, [[0, [715, 1660]], [5.0, [715, 1700], 'sine']]);
    const w = H.withdrawn, r = H.revised, mid = q => q[0].y + q[0].h * 0.62;
    const w0 = [w[0].x, mid(w)], w1 = [w[0].x + w[0].w, mid(w)], r0 = [r[0].x, mid(r)], r1 = [r[0].x + r[0].w, mid(r)];
    const pw = prog(t, 1.5, 1.85, 'io'), pr = prog(t, 3.0, 3.35, 'io');
    const cur = kf(t, [[0, [930, 1560]], [0.3, [930, 1560], 'lin'], [1.45, w0], [1.5, w0, 'lin'], [1.85, w1], [2.55, w1, 'lin'], [2.95, r0], [3.0, r0, 'lin'], [3.35, r1], [3.9, r1, 'lin'], [5.0, [760, 1925]]]);
    return { bg: '#0d1117', content: HC, cam: cam(z, c, 1100, H.h, 0, H.y0),
      layers: [{ chunks: [{ src: 'hist.png', y0: H.y0, h: H.h, dsf: 4 }], alpha: 1, samples: [H.y0] }],
      marks: [{ rects: w, p: pw }, { rects: r, p: pr }], cursor: { x: cur[0], y: cur[1] } }; },
    images: () => ['hist.png'] },
};

(async () => {
  const which = process.argv[2] || 'all', qaOnly = process.argv.includes('--qa');
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--allow-file-access-from-files'] });
  for (const name of which === 'all' ? Object.keys(clips) : [which]) {
    const clip = clips[name]; const N = Math.round(clip.D * FPS), dt = 1 / FPS;
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); await page.goto('file://' + path.join(__dirname, 'compositor.html'));
    await page.evaluate(([b, l]) => window.loadImages(b, l), ['file://' + STATES + '/', clip.images()]);
    const dir = path.join(FRAMES, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const list = qaOnly ? (process.env.QA_T || '0,1,2,3').split(',').map(s => Math.round(+s * FPS)) : [...Array(N).keys()];
    for (const f of list) { await page.evaluate(s => window.draw(s), clip.spec(f / FPS, dt));
      await page.screenshot({ path: path.join(dir, `f_${String(f).padStart(4, '0')}.png`) }); }
    await ctx.close();
    if (qaOnly) { console.log('qa frames in', dir); continue; }
    for (let f = N; f < N + HOLD; f++) fs.copyFileSync(path.join(dir, `f_${String(N - 1).padStart(4, '0')}.png`), path.join(dir, `f_${String(f).padStart(4, '0')}.png`));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', '30000/1001', '-i', path.join(dir, 'f_%04d.png'),
      '-vf', 'scale=1920:1080:flags=lanczos:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0', '-movflags', '+faststart', path.join(OUT, clip.out)]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('done', clip.out, ((N + HOLD) / FPS).toFixed(2) + ' s');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
