// node stills.mjs <land|vert> <outDir> t1,t2,...
import { chromium } from "playwright";
import fs from "node:fs"; import path from "node:path"; import os from "node:os";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [mode, dir, times] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
async function launch() {
  try { return await chromium.launch({ headless: true }); } catch (e) {}
  const cache = `${os.homedir()}/Library/Caches/ms-playwright`;
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    const exe = `${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
    if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
  }
}
const b = await launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", e => console.error("[pageerror]", e.message));
await p.goto(`file://${here}/index.html?scene=${mode}`);
await p.evaluate(() => window.ready);
for (const t of times.split(",")) { await p.evaluate(t => window.renderAt(t), parseFloat(t)); await p.screenshot({ path: path.join(dir, `t${t.padStart(5, "0")}.png`) }); }
await b.close();
