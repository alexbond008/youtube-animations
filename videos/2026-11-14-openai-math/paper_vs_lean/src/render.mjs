// Frame-stepped capture: node render.mjs <page.html> <animSeconds> <out.mp4> <qaPrefix> [qaTimes comma sep]
// The page exposes window.ready (promise) and window.renderAt(tSeconds). Adds a 1 s held last frame.
import { launch } from "./browser.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const [pageRel, animS, out, qaPrefix, qaTimes] = process.argv.slice(2);
const W = 1920, H = 1080, FPS = 30000 / 1001, dt = 1001 / 30000, HOLD = 30;
const animFrames = Math.round(parseFloat(animS) * FPS);
const qaDir = path.join(root, "qa");
const qa = new Map();
if (qaTimes) { fs.mkdirSync(qaDir, { recursive: true }); qaTimes.split(",").forEach(s => qa.set(Math.min(animFrames - 1, Math.round(parseFloat(s) * FPS)), s)); }
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("console", m => { if (m.type() === "error") console.error("[page]", m.text()); });
page.on("pageerror", e => console.error("[pageerror]", e.message));
await page.goto("file://" + path.join(here, pageRel));
await page.evaluate(() => window.ready);
const ff = spawn(process.env.FFMPEG || "ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30000/1001", "-c:v", "png", "-i", "-",
  "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30000/1001", "-movflags", "+faststart", path.resolve(root, out)],
  { stdio: ["pipe", "inherit", "inherit"] });
const put = async b => { if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once("drain", r)); };
let last;
for (let i = 0; i < animFrames; i++) {
  await page.evaluate(t => window.renderAt(t), i * dt);
  last = await page.screenshot({ type: "png" });
  if (qa.has(i)) fs.writeFileSync(path.join(qaDir, `${qaPrefix}_t${qa.get(i).padStart(5, "0")}.png`), last);
  await put(last);
  if (i % 100 === 0) console.error(`frame ${i}/${animFrames}`);
}
for (let k = 0; k < HOLD; k++) await put(last);
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();
console.error("done", out, animFrames + HOLD, "frames");
