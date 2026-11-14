// Renders the transparent text layers (equation card, highlighted equation card, claim card)
// as 1920x1080 PNGs with KaTeX + Inter/JetBrains Mono via headless Chromium.
// Usage: node overlays.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] || path.join(here, '..', 'cache', 'layers'));
fs.mkdirSync(outDir, { recursive: true });
const nm = path.join(here, 'node_modules');
const fileUrl = (p) => 'file://' + p;

const TEX = String.raw`\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u}\cdot\nabla)\,\mathbf{u} = -\frac{\nabla p}{\rho} + \nu\,\nabla^{2}\mathbf{u} + \htmlClass{fterm}{\mathbf{f}}`;
const eqHtml = katex.renderToString(TEX, { displayMode: true, trust: true, strict: false, output: 'html' });

const page = (state) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${fileUrl(nm + '/katex/dist/katex.min.css')}">
<link rel="stylesheet" href="${fileUrl(nm + '/@fontsource/inter/400.css')}">
<link rel="stylesheet" href="${fileUrl(nm + '/@fontsource/inter/600.css')}">
<link rel="stylesheet" href="${fileUrl(nm + '/@fontsource/inter/700.css')}">
<style>
  html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden}
  body{font-family:Inter,sans-serif;color:#F5F5F7}
  .card{position:absolute;background:rgba(22,22,26,.94);border:1px solid #2A2A30;border-radius:16px;
        box-shadow:0 20px 60px rgba(0,0,0,.55)}
  #eq{left:110px;top:84px;padding:26px 40px 30px}
  #eq .kicker{font-size:22px;font-weight:600;letter-spacing:.04em;color:#A1A1AA;text-transform:uppercase;margin-bottom:6px}
  #eq .katex-display{margin:0}
  #eq .katex{font-size:58px;color:#F5F5F7}
  .fterm{position:relative}
  .hl .fterm{color:#D97757}
  #box{position:absolute;border-radius:10px;background:rgba(217,119,87,.20);border:2px solid #D97757;display:none}
  #lbl{position:absolute;display:none;color:#D97757;font-size:26px;font-weight:600;white-space:nowrap}
  #tick{position:absolute;display:none;width:2px;background:#D97757}
  .hl #box,.hl #lbl,.hl #tick{display:block}
  #claim{right:110px;bottom:84px;padding:20px 30px;font-size:30px;font-weight:600;color:#A1A1AA;white-space:nowrap}
  #claim b{color:#D97757;font-weight:700}
</style></head><body class="${state === 'hl' ? 'hl' : ''}">
${state === 'claim' ? `<div id="claim" class="card"><b>Claimed</b> Sept 8, 2026 · forced case · not peer-reviewed</div>`
  : `<div id="eq" class="card"><div class="kicker">Navier–Stokes · momentum</div>${eqHtml}</div>
     <div id="box"></div><div id="tick"></div><div id="lbl">external force</div>`}
<script>
  document.fonts.ready.then(() => {
    const f = document.querySelector('.fterm');
    if (f) {
      const r = f.getBoundingClientRect(), card = document.getElementById('eq').getBoundingClientRect();
      const pad = 8, box = document.getElementById('box');
      Object.assign(box.style, {left:(r.left-pad)+'px', top:(r.top-pad)+'px', width:(r.width+2*pad)+'px', height:(r.height+2*pad)+'px'});
      const cx = r.left + r.width/2, tick = document.getElementById('tick');
      Object.assign(tick.style, {left:(cx-1)+'px', top:(r.bottom+pad)+'px', height:(card.bottom - r.bottom - pad + 22)+'px'});
      const lbl = document.getElementById('lbl');
      lbl.style.top = (card.bottom + 26) + 'px';
      lbl.style.left = (cx - lbl.getBoundingClientRect().width + 20) + 'px';
    }
    document.body.dataset.ready = '1';
  });
</script></body></html>`;

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
for (const state of ['eq', 'hl', 'claim']) {
  const tmp = path.join(outDir, `_${state}.html`);
  fs.writeFileSync(tmp, page(state));
  await pg.goto(fileUrl(tmp));
  await pg.waitForSelector('body[data-ready="1"]');
  await pg.screenshot({ path: path.join(outDir, `layer_${state}.png`), omitBackground: true });
  fs.unlinkSync(tmp);
  console.log('wrote', state);
}
await browser.close();
