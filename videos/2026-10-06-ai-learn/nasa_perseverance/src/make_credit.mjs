// Renders the baked-in credit as a transparent 1920x1080 PNG (Inter 500, 18 px, 60% white,
// bottom-left inside the 5% safe area). A soft dark halo keeps it legible over the white rover
// in the close-up; on the #0E0E10 background the halo is invisible. Uses the Playwright resolver from ../../web_captures/src.
//   node make_credit.mjs [out.png]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../../web_captures/src/pw.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, "credit_overlay.png");
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=block" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1920px; height: 1080px; background: transparent; }
  .credit { position: absolute; left: 96px; bottom: 58px; font-family: "Inter", sans-serif; font-weight: 500;
            font-size: 18px; line-height: 1; letter-spacing: 0.01em; color: rgba(255,255,255,0.6);
            text-shadow: 0 0 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.85), 0 0 7px rgba(0,0,0,0.8), 0 0 7px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.7), 0 0 12px rgba(0,0,0,0.6), 0 0 22px rgba(0,0,0,0.5), 0 0 36px rgba(0,0,0,0.35); font-feature-settings: "tnum" 0; }
</style></head><body><div class="credit">3D model: NASA/JPL-Caltech</div></body></html>`;
const b = await launch();
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
await p.setContent(html, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
const fam = await p.evaluate(() => document.fonts.check('500 18px "Inter"'));
if (!fam) throw new Error("Inter did not load");
await p.screenshot({ path: out, omitBackground: true });
await b.close();
console.log("credit ->", out);
