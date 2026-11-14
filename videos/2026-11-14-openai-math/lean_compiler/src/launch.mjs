import { chromium } from "playwright";
import fs from "node:fs"; import os from "node:os";
// CHROME env > playwright's bundled browser > newest cached playwright headless shell
export async function launch() {
  if (process.env.CHROME) return chromium.launch({ headless: true, executablePath: process.env.CHROME });
  try { return await chromium.launch({ headless: true }); } catch (e) {}
  const cache = `${os.homedir()}/Library/Caches/ms-playwright`;
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    const exe = `${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
    if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
  }
  throw new Error("no chromium: set CHROME or run `npx playwright install chromium-headless-shell`");
}
