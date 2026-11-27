// Capture deterministic page "states" of a real Wikimedia Commons search -> file page (no login, no cookies accepted).
// node browse_capture.mjs <statesDir>
import { chromium } from "../../cad_common/src/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path"; import os from "node:os";
const OUT = path.resolve(process.argv[2] || "work/browse"); fs.mkdirSync(OUT, { recursive: true });
const exe = process.env.CHROME || (() => { const c = `${os.homedir()}/Library/Caches/ms-playwright`; const d = fs.readdirSync(c).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()[0]; return `${c}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`; })();
const CSS = `*{scroll-behavior:auto!important;caret-color:transparent!important;transition:none!important;animation:none!important}
 ::-webkit-scrollbar{display:none!important} html{scrollbar-width:none!important}
 #centralNotice,#siteNotice,.cn-banner,[class*="cookie" i],[id*="cookie" i],[class*="consent" i],.mw-dismissable-notice{display:none!important}`;
const Q = "technical drawing shaft", TARGET = "Технический_чертёж_вала_с_размерами.png";
const VW = 1792, VH = 948, meta = {};
const b = await chromium.launch({ headless: true, executablePath: exe });
async function open(url) {
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, locale: "en-GB", colorScheme: "light", reducedMotion: "reduce" });
  const p = await ctx.newPage(); const r = await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  if (r.status() >= 400) throw new Error(url + " " + r.status());
  await p.addStyleTag({ content: CSS });
  for (let y = 0; y < 5000; y += 700) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(250); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForLoadState("networkidle"); await p.waitForTimeout(1200);
  return { p, ctx };
}
const rect = (p, fn, arg) => p.evaluate(([fs, a]) => { const e = (new Function("a", fs))(a); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }, [fn, arg]);
const shot = (p, name, y, h) => p.screenshot({ path: path.join(OUT, name), fullPage: true, clip: { x: 0, y, width: VW, height: h } });
// 1) empty MediaSearch, typing the query
{ const { p, ctx } = await open("https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image");
  const sel = await p.evaluate(() => { const c = [...document.querySelectorAll('input')].filter(e => /images, audio/i.test(e.placeholder || '')); c[0].id = c[0].id || 'msinput'; return '#' + c[0].id; });
  meta.input = await rect(p, `return document.querySelector('${sel}')`);
  await shot(p, "s_empty.png", 0, VH);
  for (let i = 1; i <= Q.length; i++) { await p.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.blur(); }, [sel, Q.slice(0, i)]);
    await p.waitForTimeout(40); await shot(p, `s_t${String(i).padStart(2, "0")}.png`, 0, VH); }
  await ctx.close(); }
// 2) results
{ const { p, ctx } = await open("https://commons.wikimedia.org/w/index.php?search=" + encodeURIComponent(Q) + "&title=Special:MediaSearch&type=image");
  meta.tile = await rect(p, `return [...document.querySelectorAll('a[href*="/wiki/File:"]')].find(e => decodeURIComponent(e.href).includes(a))`, TARGET);
  meta.resH = Math.min(await p.evaluate(() => document.documentElement.scrollHeight), 3200);
  await shot(p, "res.png", 0, meta.resH);
  await ctx.close(); }
// 3) file page
{ const { p, ctx } = await open("https://commons.wikimedia.org/wiki/File:" + TARGET);
  meta.fileH = Math.min(await p.evaluate(() => document.documentElement.scrollHeight), 4000);
  meta.img = await rect(p, `return document.querySelector('#file img')`);
  meta.cc0 = await rect(p, `const t=[...document.querySelectorAll('table, div')].filter(e=>/Creative Commons CC0/.test(e.textContent) && e.getBoundingClientRect().height<400 && e.getBoundingClientRect().height>40); return t[t.length-1]`);
  meta.cc0text = await rect(p, `const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){ if(/CC0 1\\.0 Universal Public Domain Dedication|Creative Commons CC0/.test(n.nodeValue)&&n.parentElement.offsetParent){return n.parentElement}}`);
  await shot(p, "file.png", 0, meta.fileH);
  await ctx.close(); }
fs.writeFileSync(path.join(OUT, "states.json"), JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta));
await b.close();
