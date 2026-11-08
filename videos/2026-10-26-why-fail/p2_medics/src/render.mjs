// Frame-stepped render: node render.mjs <page.html> <animSeconds> <out.mp4> [qaDir] [qaTimes comma sep]
// Copied from why-fail p3_skipping/src/render.mjs; adds optional T0 env start offset.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [html, animS, out, qaDir, qaTimes] = process.argv.slice(2);
const W = 1920, H = 1080;
const FPS = 30000 / 1001, dt = 1001 / 30000;
const animFrames = Math.round(parseFloat(animS) * FPS);
const HOLD = 30;
const T0 = parseFloat(process.env.T0 || "0"); // optional start offset (s) for cut-down versions
const qa = new Map();
if (qaDir && qaTimes) { fs.mkdirSync(qaDir, { recursive: true }); qaTimes.split(",").forEach(s => qa.set(Math.min(animFrames - 1, Math.round(parseFloat(s) * FPS)), s)); }
async function launch() {
  try { return await chromium.launch({ headless: true }); } catch (e) {}
  const cache = `${os.homedir()}/Library/Caches/ms-playwright`;
  for (const d of fs.readdirSync(cache).filter(d => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    const exe = `${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
    if (fs.existsSync(exe)) return chromium.launch({ headless: true, executablePath: exe });
  }
  throw new Error("no chromium");
}
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("console", m => { if (m.type() === "error") console.error("[page]", m.text()); });
page.on("pageerror", e => console.error("[pageerror]", e.message));
await page.goto(`file://${here}/${html}`);
await page.evaluate(() => window.ready);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30000/1001", "-c:v", "png", "-i", "-",
  "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30000/1001", "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] });
let last;
for (let i = 0; i < animFrames; i++) {
  const t = T0 + i * dt;
  await page.evaluate(t => window.renderAt(t), t);
  last = await page.screenshot({ type: "png" });
  if (qa.has(i)) fs.writeFileSync(path.join(qaDir, `${path.basename(html, ".html")}_t${qa.get(i).padStart(5, "0")}.png`), last);
  if (!ff.stdin.write(last)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 150 === 0) console.error(`${html} frame ${i}/${animFrames}`);
}
for (let k = 0; k < HOLD; k++) if (!ff.stdin.write(last)) await new Promise(r => ff.stdin.once("drain", r));
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();
console.error("done", out, animFrames + HOLD, "frames");
