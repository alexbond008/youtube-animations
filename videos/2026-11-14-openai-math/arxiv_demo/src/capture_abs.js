// Captures the arXiv abstract page once (1920x1080 viewport, DPR 2) and writes
// ../work/abs_2x.png + ../work/abs_boxes.json (CSS-pixel boxes in the 1920x1080 frame).
// Browser: process.env.CHROME, else playwright-core's own resolved chromium.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const URL = process.env.ARXIV_URL || 'https://arxiv.org/abs/2610.08144';
const WORK = path.resolve(__dirname, '..', 'work');
(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  const opts = { headless: true }; if (process.env.CHROME) opts.executablePath = process.env.CHROME;
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: 'reduce', locale: 'en-GB' });
  const page = await ctx.newPage();
  const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  console.log('status', resp.status());
  // hide banners/cookie notices (never accept), scrollbars; zoom so the title is legible
  await page.addStyleTag({ content: `::-webkit-scrollbar{display:none!important} html{zoom:1.3}
    .slider-wrapper,.bps-banner,[class*="cookie" i],[id*="cookie" i],[class*="consent" i]{display:none!important}` });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
  const boxes = await page.evaluate(() => {
    const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
    const link = [...document.querySelectorAll('a')].filter(a => a.textContent.trim() === 'View PDF').find(a => a.getBoundingClientRect().width > 0);
    return { viewPdf: r(link), title: r(document.querySelector('h1.title')), authors: r(document.querySelector('.authors')) };
  });
  console.log(JSON.stringify(boxes));
  fs.writeFileSync(path.join(WORK, 'abs_boxes.json'), JSON.stringify(boxes, null, 1));
  await page.screenshot({ path: path.join(WORK, 'abs_2x.png') });
  await browser.close();
})();
