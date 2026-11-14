// Launch headless Chromium: $CHROME, else Playwright's bundled browser, else any cached playwright headless shell.
import { chromium } from "playwright";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
export async function launch() {
  if (process.env.CHROME) return chromium.launch({ headless: true, executablePath: process.env.CHROME });
  try { return await chromium.launch({ headless: true }); } catch (e) {}
  const cache = path.join(os.homedir(), os.platform() === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright");
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse())
    for (const sub of fs.readdirSync(path.join(cache, d))) {
      const exe = path.join(cache, d, sub, "chrome-headless-shell");
      if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
    }
  throw new Error("No Chromium found: set CHROME or run `npx playwright install chromium-headless-shell`");
}
