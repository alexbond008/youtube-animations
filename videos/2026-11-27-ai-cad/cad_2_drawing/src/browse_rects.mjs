import { chromium } from "../../cad_common/src/node_modules/playwright/index.mjs";
import fs from "node:fs"; import os from "node:os";
const c = `${os.homedir()}/Library/Caches/ms-playwright`; const d = fs.readdirSync(c).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()[0];
const b = await chromium.launch({ headless: true, executablePath: process.env.CHROME || `${c}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell` });
const p = await (await b.newContext({ viewport: { width: 1792, height: 948 }, deviceScaleFactor: 1, locale: "en-GB", colorScheme: "light" })).newPage();
await p.goto("https://commons.wikimedia.org/wiki/File:Технический_чертёж_вала_с_размерами.png", { waitUntil: "networkidle" });
await p.addStyleTag({ content: `#centralNotice,#siteNotice,.cn-banner{display:none!important}` });
await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; };
  const line = [...document.querySelectorAll('span, div, td, p')].filter(e => e.textContent.trim().startsWith('This file is made available under the') && e.textContent.length < 160).pop();
  const icon = document.querySelector('img[src*="CC0"], img[alt*="CC0"], img[src*="Cc-zero"], img[src*="cc-zero"]');
  return { line: line && R(line), icon: icon && R(icon), iconSrc: icon && icon.src };
});
const r2 = JSON.parse(fs.readFileSync("work/browse/states.json")); Object.assign(r2, { ccLine: r.line, ccIcon: r.icon });
fs.writeFileSync("work/browse/states.json", JSON.stringify(r2, null, 1)); console.log(r);
await b.close();
