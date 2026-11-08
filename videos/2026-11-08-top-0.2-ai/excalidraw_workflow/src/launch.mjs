import { chromium } from "playwright";
import fs from "node:fs"; import os from "node:os";
export async function launch() {
  try { return await chromium.launch({ headless: true }); } catch (e) { console.error("default launch failed", e.message.slice(0,200)); }
  const cache = `${os.homedir()}/Library/Caches/ms-playwright`;
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium")).sort().reverse()) {
    for (const exe of [`${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`, `${cache}/${d}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`])
      if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
  }
  throw new Error("no chromium");
}
