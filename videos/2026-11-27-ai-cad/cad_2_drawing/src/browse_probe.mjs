import { chromium } from "../../cad_common/src/node_modules/playwright/index.mjs";
const b = await chromium.launch({ headless: true, executablePath: process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell" });
const p = await (await b.newContext({ viewport: { width: 1792, height: 948 }, deviceScaleFactor: 1, locale: 'en-GB' })).newPage();
for (const q of process.argv.slice(2)) {
  await p.goto("https://commons.wikimedia.org/w/index.php?search=" + encodeURIComponent(q) + "&title=Special:MediaSearch&type=image", { waitUntil: "networkidle" });
  for (let y = 0; y < 6000; y += 800) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); }
  const r = await p.evaluate(() => [...document.querySelectorAll('a[href*="/wiki/File:"]')].map((a, i) => { const rc = a.getBoundingClientRect(); return [i, decodeURIComponent(a.getAttribute('href')).split('File:')[1].slice(0, 60), Math.round(rc.y + scrollY)]; }));
  const hit = r.filter(x => /Технический/.test(x[1]));
  console.log(q, r.length, hit);
}
await b.close();
