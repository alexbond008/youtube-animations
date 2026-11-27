// Frame-stepped headless Chrome renderer.
// Usage: node render.js            -> ../<dir>_1080p.mp4 (29.97 fps, + 1 s held last frame)
//        node render.js --qa 0.5,1,2.5  -> ../qa/frame_01.png ... (1x, for looking at)
// Env: FFMPEG (default 'ffmpeg'), CHROME (default: playwright's headless shell), FRAMES_DIR.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 30000 / 1001, HOLD = 30;
const ROOT = path.resolve(__dirname, '..'), NAME = path.basename(ROOT);

(async () => {
  const qi = process.argv.indexOf('--qa');
  const qa = qi > 0 ? process.argv[qi + 1].split(',').map(Number) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: qa ? 1 : 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  await page.evaluate(() => window.ready);
  const D = await page.evaluate(() => window.SCENE.D);
  if (qa) {
    const dir = path.join(ROOT, 'qa'); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < qa.length; i++) {
      await page.evaluate(t => window.render(t), qa[i]);
      await page.screenshot({ path: path.join(dir, `frame_${String(i + 1).padStart(2, '0')}.png`) });
    }
    await browser.close(); console.log('qa stills in', dir); return;
  }
  const N = Math.round(D * FPS);
  const dir = path.join(process.env.FRAMES_DIR || os.tmpdir(), NAME + '_frames');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const fn = f => path.join(dir, `f_${String(f).padStart(4, '0')}.png`);
  for (let f = 0; f < N; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    await page.screenshot({ path: fn(f) });
    if (f % 30 === 0) process.stdout.write(`\r${NAME} ${f}/${N}`);
  }
  await browser.close();
  for (let f = N; f < N + HOLD; f++) fs.copyFileSync(fn(N - 1), fn(f));
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', '30000/1001', '-i', path.join(dir, 'f_%04d.png'),
    '-vf', 'scale=1920:1080:flags=lanczos:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    '-an', '-movflags', '+faststart', path.join(ROOT, `${NAME}_1080p.mp4`)]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\ndone ${NAME}_1080p.mp4 ${((N + HOLD) / FPS).toFixed(2)} s`);
})().catch(e => { console.error(e); process.exit(1); });
