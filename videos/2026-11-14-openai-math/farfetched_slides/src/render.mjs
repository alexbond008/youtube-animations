// Frame-stepped capture of an HTML page into an H.264 MP4 (29.97 fps, CRF 14, bt709) + 1 s held last frame.
// Usage: node render.mjs <page.html[?query]> <width> <height> <animSeconds> <out.mp4 (relative to farfetched_slides/)> <qaPrefix> [qaTimes,comma,sep]
// The page must expose window.ready (promise) and window.renderAt(tSeconds).
// Env: FFMPEG (default "ffmpeg"), CHROME (optional Chromium executable; falls back to Playwright's headless shell).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const [pageRel, wS, hS, animS, out, qaPrefix, qaTimes] = process.argv.slice(2);
const W = parseInt(wS), H = parseInt(hS);
const FPS = 30000 / 1001, dt = 1001 / 30000, HOLD = 30;
const animFrames = Math.round(parseFloat(animS) * FPS);
const qaDir = path.join(root, "qa");
const qa = new Map();
if (qaTimes) {
  fs.mkdirSync(qaDir, { recursive: true });
  qaTimes.split(",").forEach(s => qa.set(Math.min(animFrames - 1, Math.round(parseFloat(s) * FPS)), s));
}

async function launch() {
  if (process.env.CHROME) return chromium.launch({ headless: true, executablePath: process.env.CHROME });
  try { return await chromium.launch({ headless: true }); } catch (e) { /* fall through */ }
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    for (const sub of ["chrome-headless-shell-mac-arm64", "chrome-headless-shell-mac-x64", "chrome-headless-shell-linux64"]) {
      const exe = path.join(cache, d, sub, "chrome-headless-shell");
      if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
    }
  }
  throw new Error("No Chromium found: set CHROME or run `npx playwright install chromium`");
}

const [pageFile, query] = pageRel.split("?");
const url = pathToFileURL(path.join(here, pageFile)).href + (query ? `?${query}` : "");
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("console", m => { if (m.type() === "error") console.error("[page]", m.text()); });
page.on("pageerror", e => console.error("[pageerror]", e.message));
await page.goto(url);
await page.evaluate(() => window.ready);

const ff = spawn(process.env.FFMPEG || "ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30000/1001", "-c:v", "png", "-i", "-",
  "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30000/1001", "-movflags", "+faststart",
  path.resolve(root, out)], { stdio: ["pipe", "inherit", "inherit"] });
const write = async buf => { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r)); };

let last;
for (let i = 0; i < animFrames; i++) {
  await page.evaluate(t => window.renderAt(t), i * dt);
  last = await page.screenshot({ type: "png" });
  if (qa.has(i)) fs.writeFileSync(path.join(qaDir, `${qaPrefix}_t${qa.get(i).padStart(5, "0")}.png`), last);
  await write(last);
  if (i % 100 === 0) console.error(`frame ${i}/${animFrames}`);
}
for (let k = 0; k < HOLD; k++) await write(last);
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();
console.error("done", out, animFrames + HOLD, "frames");
