// Step 1: capture page "states" as full-page PNG crops (deterministic, no recording).
// Usage: node capture.js            -> writes $STATES_DIR (default ./.states) + states.json
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const STATES = process.env.STATES_DIR || path.join(__dirname, '.states');
fs.mkdirSync(STATES, { recursive: true });

const CSS = `
  *{scroll-behavior:auto!important;caret-color:transparent!important;transition:none!important;animation:none!important}
  ::-webkit-scrollbar{display:none!important} html{scrollbar-width:none!important}
  [class*="cookie" i],[id*="cookie" i],[class*="consent" i],[id*="consent" i],#ghcc,.js-notification-shelf,.flash-full{display:none!important}
  .AppHeader-globalBar .tooltipped{ }
`;
const meta = {};

async function open(browser, url, vw, vh, dsf) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'en-GB' });
  const p = await ctx.newPage();
  const r = await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  if (r.status() >= 400) throw new Error(url + ' -> ' + r.status());
  await p.addStyleTag({ content: CSS });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 800) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(60); }
  await p.evaluate(() => scrollTo(0, 0)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  return { p, ctx, H: await p.evaluate(() => document.documentElement.scrollHeight) };
}
const shot = (p, name, y, h, w) => p.screenshot({ path: path.join(STATES, name), fullPage: true, clip: { x: 0, y, width: w, height: h } });
// rect of an element / text phrase in document coords
const rectOf = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }, sel);
const phrase = (p, text) => p.evaluate(text => {
  const norm = s => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes = []; let full = '';
  while (tw.nextNode()) { const n = tw.currentNode; if (!n.parentElement || !n.parentElement.offsetParent) continue; nodes.push([n, full.length]); full += n.nodeValue; }
  let nf = '', map = []; for (let i = 0; i < full.length; i++) { const c = full[i], ws = /\s/.test(c); if (ws && nf.endsWith(' ')) continue; nf += ws ? ' ' : norm(c); map.push(i); }
  const idx = nf.indexOf(norm(text)); if (idx < 0) return null;
  const s = map[idx], e = map[idx + norm(text).length - 1];
  const loc = off => { for (let k = nodes.length - 1; k >= 0; k--) if (nodes[k][1] <= off) return [nodes[k][0], off - nodes[k][1]]; };
  const r = document.createRange(); const [a, ao] = loc(s), [b, bo] = loc(e); r.setStart(a, ao); r.setEnd(b, bo + 1);
  const L = []; for (const q of r.getClientRects()) { if (q.width < 1) continue; const l = L.find(z => Math.abs(z.y - q.top) < 6);
    if (l) { l.x1 = Math.max(l.x1, q.right); l.x = Math.min(l.x, q.left); } else L.push({ x: q.left, y: q.top, x1: q.right, h: q.height }); }
  return L.map(l => ({ x: l.x, y: l.y + scrollY, w: l.x1 - l.x, h: l.h }));
}, text);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true });
  const VW = 1792, VH = 948;

  // ---- org page + repo search
  { const { p, ctx } = await open(browser, 'https://github.com/openai', VW, VH, 2);
    meta.org = { input: await rectOf(p, '#your-repos-filter') };
    await shot(p, 'org_0.png', 0, 1500, VW);
    await p.focus('#your-repos-filter');
    await shot(p, 'org_focus.png', 0, 1500, VW);
    const word = 'math';
    for (let i = 1; i <= word.length; i++) {
      await p.evaluate(v => { document.querySelector('#your-repos-filter').value = v; }, word.slice(0, i));
      await shot(p, `org_t${i}.png`, 0, 1500, VW);
    }
    await p.evaluate(() => { document.querySelector('#your-repos-filter').value = ''; });
    await p.type('#your-repos-filter', word, { delay: 60 });
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(2500);
    await p.evaluate(() => { const a = document.activeElement; a && a.blur && 0; });
    meta.org.math = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => a.getAttribute('href') === '/openai/math' && a.textContent.trim() === 'math'); const r = a.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; });
    await shot(p, 'org_res.png', 0, 1500, VW);
    await ctx.close(); }

  // ---- repo page
  { const { p, ctx, H } = await open(browser, 'https://github.com/openai/math', VW, VH, 2);
    meta.repo = { H,
      preprints: await p.evaluate(() => { const a = [...document.querySelectorAll('table a[href$="/tree/main/preprints"]')].find(a => a.getBoundingClientRect().width > 0); const r = a.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }),
      readme: await phrase(p, 'In our view, these manuscripts are best understood as a form of raw research data'),
      readmeHead: await p.evaluate(() => { const a = document.querySelector('article.markdown-body'); const r = a.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }) };
    await shot(p, 'repo.png', 0, H, VW);
    await ctx.close(); }

  // ---- preprints listing (DSF2 top/bottom, DSF1 chunks for the fast scroll)
  { let { p, ctx, H } = await open(browser, 'https://github.com/openai/math/tree/main/preprints', VW, VH, 2);
    const info = await p.evaluate(() => { const rows = [...document.querySelectorAll('table tbody tr')].filter(r => r.querySelector('a[href*="/preprints/"]'));
      return { n: rows.length, first: rows[0].getBoundingClientRect().top + scrollY, last: rows[rows.length - 1].getBoundingClientRect().bottom + scrollY }; });
    const chunks = [];
    await shot(p, 'pre_top.png', 0, 2400, VW); chunks.push({ src: 'pre_top.png', y0: 0, h: 2400, dsf: 2 });
    await shot(p, 'pre_bot.png', H - 2400, 2400, VW); chunks.push({ src: 'pre_bot.png', y0: H - 2400, h: 2400, dsf: 2 });
    await ctx.close();
    ({ p, ctx, H } = await open(browser, 'https://github.com/openai/math/tree/main/preprints', VW, VH, 1));
    for (let y = 0, i = 0; y < H; y += 4000, i++) { const h = Math.min(4000, H - y); await shot(p, `pre_lo${i}.png`, y, h, VW); chunks.push({ src: `pre_lo${i}.png`, y0: y, h, dsf: 1 }); }
    meta.pre = { H, ...info, chunks };
    await ctx.close(); }

  // ---- history.md (narrow viewport, DSF4 so a ~2x camera stays native-sharp)
  { const { p, ctx, H } = await open(browser, 'https://github.com/openai/math/blob/main/history.md', 1100, 619, 4);
    const head = await p.evaluate(() => { const h = [...document.querySelectorAll('h1,h2,h3')].find(h => h.textContent.includes('October 7, 2026')); const r = h.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; });
    const y0 = Math.round(head.y - 200), h = 900;
    meta.hist = { H, head, y0, h,
      withdrawn: await phrase(p, 'withdrawn the following three manuscripts'),
      revised: await phrase(p, 'revised 14 other manuscripts'),
      revisedLine: await phrase(p, 'We have revised 14 other manuscripts') };
    await shot(p, 'hist.png', y0, h, 1100);
    await ctx.close(); }

  fs.writeFileSync(path.join(STATES, 'states.json'), JSON.stringify(meta, null, 1));
  console.log(JSON.stringify(meta, (k, v) => k === 'chunks' ? v.length : v, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
