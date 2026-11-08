// Frame-stepped capture of a real drawing session on https://excalidraw.com
// usage: node draw.mjs <out.mp4> [dsf=2] [--noqa]
// Every frame: apply a small input step (mouse / key), then screenshot. Output is perfectly paced (29.97 fps).
import { launch } from "./launch.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs"; import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const out = process.argv[2] || path.join(ROOT, "drawing_1080p.mp4");
const DSF = parseFloat(process.argv[3] || "2");
const FPS = 30000 / 1001;
const W = 1920, H = 1080, HOLD = 30;

export const CSS = `
[class*="welcome-screen"], .HintViewer, .excalidraw-ui-top-right, .layer-ui__wrapper__top-right,
.layer-ui__wrapper__footer-right, .footer-center, [class*="cookie"], [id*="cookie"] { display:none !important; }
.App-menu__left { opacity:0 !important; }
.App-menu__left, .App-menu__left *, .App-menu_top__left, .App-menu_top__left * { pointer-events:none !important; }
#fakecursor { position:fixed; left:0; top:0; width:26px; height:26px; z-index:99999; pointer-events:none; transform:translate(-3px,-2px); }
`;
const CURSOR = `<svg id="fakecursor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.6 20.3 L10.7 13.6 L17 13.6 Z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

export async function openExcalidraw(dsf) {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dsf, acceptDownloads: false });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("[pageerror]", e.message));
  await page.addInitScript(() => {
    try {
      localStorage.setItem("excalidraw-theme", "dark");
      localStorage.setItem("excalidraw-state", JSON.stringify({ theme: "dark", showWelcomeScreen: false, currentItemFontSize: 28,
        currentItemRoughness: 1, currentItemStrokeWidth: 2, currentItemRoundness: "round", exportWithDarkMode: true, exportBackground: true, zoom: { value: 1.45 }, scrollX: 0, scrollY: 0 }));
    } catch {}
  });
  await page.goto("https://excalidraw.com", { waitUntil: "networkidle", timeout: 90000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(svg => document.body.insertAdjacentHTML("beforeend", svg), CURSOR);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return { browser, page };
}

// ---------- frame engine ----------
export function makeEngine(page, ffOut, opts = {}) {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30000/1001", "-c:v", "png", "-i", "-",
    "-vf", `scale=${W}:${H}:flags=lanczos,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "30000/1001", "-movflags", "+faststart", ffOut],
    { stdio: ["pipe", "inherit", "inherit"] });
  const E = { n: 0, last: null, mx: 960, my: 600, marks: [], framesDir: opts.framesDir };
  E.t = () => E.n / FPS;
  E.mark = (label) => { E.marks.push([E.t().toFixed(2), label]); console.error(`  [${E.t().toFixed(2)}s] ${label}`); };
  E.frame = async () => {
    await page.evaluate(([x, y]) => { const c = document.getElementById("fakecursor"); c.style.left = x + "px"; c.style.top = y + "px"; }, [E.mx, E.my]);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    E.last = await page.screenshot({ type: "png" });
    if (E.framesDir) fs.writeFileSync(path.join(E.framesDir, `f${String(E.n).padStart(4, "0")}.png`), E.last);
    if (!ff.stdin.write(E.last)) await new Promise(r => ff.stdin.once("drain", r));
    E.n++;
    if (E.n % 60 === 0) console.error(`frame ${E.n} (${E.t().toFixed(1)}s)`);
  };
  E.idle = async (s) => { const k = Math.round(s * FPS); for (let i = 0; i < k; i++) await E.frame(); };
  E.idleUntil = async (s) => { while (E.t() < s) await E.frame(); };
  const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  E.move = async (x, y, s, { down = false } = {}) => {
    const k = Math.max(1, Math.round(s * FPS)); const x0 = E.mx, y0 = E.my;
    for (let i = 1; i <= k; i++) {
      const u = ease(i / k); E.mx = x0 + (x - x0) * u; E.my = y0 + (y - y0) * u;
      await page.mouse.move(E.mx, E.my, { steps: 2 }); await E.frame();
    }
  };
  E.drag = async (x0, y0, x1, y1, s) => {
    await page.mouse.move(x0, y0); E.mx = x0; E.my = y0; await page.mouse.down();
    await E.frame();
    await E.move(x1, y1, s);
    await page.mouse.up(); await E.frame();
  };
  // type text at ~cps chars per second; "\n" -> Enter
  E.nudge = async () => { const x0 = E.mx, y0 = E.my; for (let i = 1; i <= 6; i++) { E.mx = x0 + 34 * i / 6; E.my = y0 + 70 * i / 6; await page.mouse.move(E.mx, E.my); await E.frame(); } };
  E.type = async (str, cps = 32) => {
    let acc = 0; const per = cps / FPS;
    for (const ch of str) {
      if (ch === "\n") await page.keyboard.press("Enter"); else await page.keyboard.type(ch);
      acc += 1; if (acc >= per) { const k = Math.floor(acc / per); acc -= k * per; for (let i = 0; i < k; i++) await E.frame(); }
    }
    await E.frame();
  };
  E.key = async (k) => { await page.keyboard.press(k); };
  E.prop = async (tid) => { const ok = await page.evaluate(t => { const el = document.querySelector(`[data-testid="${t}"]`); if (!el) return false; el.click(); return true; }, tid); if (!ok) console.error("  !! missing prop", tid); };
  E.finish = async (hold = HOLD) => {
    for (let k = 0; k < hold; k++) if (!ff.stdin.write(E.last)) await new Promise(r => ff.stdin.once("drain", r));
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
  };
  return E;
}

// ---------- the diagram ----------
export const BOX = { w: 374, h: 189, y: 445, x0: 103, pitch: 447 };
export const STAGES = [
  { title: "Pre-lab\n(at home)",        inp: "in: lab sheet, sample data", out: "out: answers, predictions", agent: "agent: prelab" },
  { title: "Lab session",               inp: "in: rig + procedure",        out: "out: raw .mat/.xlsx data",  agent: "agent: lab-session" },
  { title: "Data analysis\n(back home)",inp: "in: raw data + model",       out: "out: plots, evidence",      agent: "agent: data-analysis" },
  { title: "Write-up",                  inp: "in: evidence",               out: "out: report PDF",           agent: "agent: write-up" },
];
const bx = i => BOX.x0 + i * BOX.pitch;

async function main() {
  const { browser, page } = await openExcalidraw(DSF);
  const E = makeEngine(page, out);
  E.mx = 980; E.my = 640;
  await page.mouse.move(E.mx, E.my);
  await E.idle(0.4);
  // title
  E.mark("title: text tool");
  await E.move(1080, 38, 0.35); await E.key("t"); await E.prop("fontSize-veryLarge"); await E.idle(0.1);
  await E.move(bx(0) + 4, 320, 0.4);
  await page.mouse.click(E.mx, E.my); await E.frame(); await E.nudge();
  await E.type("Control lab: my workflow", 38);
  await E.key("Escape"); await E.key("Escape"); await E.frame();
  // boxes
  for (let i = 0; i < 4; i++) {
    const x = bx(i), y = BOX.y;
    await E.move(840, 38, i === 0 ? 0.3 : 0.25); await E.key("r"); await E.frame();
    await E.move(x, y, 0.35);
    if (i === 0) E.mark("box 1 drag start");
    await E.drag(x, y, x + BOX.w, y + BOX.h, 0.5);
    if (i === 0) E.mark("box 1 drawn");
    await E.key("Enter"); await E.frame();
    await E.type(STAGES[i].title, 34);
    await E.key("Escape"); await E.key("Escape"); await E.frame();
    E.mark(`box ${i + 1} done`);
    await E.idle(0.1);
  }
  // arrows (orange)
  E.mark("arrows start");
  for (let i = 0; i < 3; i++) {
    await E.move(960, 38, 0.25); await E.key("a"); await E.prop("color-top-pick-#f08c00"); await E.frame();
    const xa = bx(i) + BOX.w + 7, xb = bx(i + 1) - 7, ym = BOX.y + BOX.h / 2;
    await E.move(xa, ym, 0.3);
    await E.drag(xa, ym, xb, ym, 0.4);
    await E.key("Escape"); await E.frame();
    E.mark(`arrow ${i + 1}->${i + 2} done`);
  }
  await E.idle(0.2);
  // annotations: in/out (blue, medium)
  E.mark("annotations start");
  for (let i = 0; i < 4; i++) {
    await E.key("t"); await E.prop("fontSize-medium"); await E.prop("color-top-pick-#1971c2");
    await E.move(bx(i) + 10, BOX.y + BOX.h + 26, 0.2);
    await page.mouse.click(E.mx, E.my); await E.frame(); await E.nudge();
    await E.type(STAGES[i].inp + "\n" + STAGES[i].out, 40);
    await E.key("Escape"); await E.key("Escape"); await E.frame();
    E.mark(`in/out ${i + 1} done`);
  }
  // agent labels (green, code font, small)
  E.mark("agent labels start");
  for (let i = 0; i < 4; i++) {
    await E.key("t"); await E.prop("fontSize-medium"); await E.prop("font-family-code"); await E.prop("color-top-pick-#2f9e44");
    await E.move(bx(i) + 10, BOX.y + BOX.h + 128, 0.2);
    await page.mouse.click(E.mx, E.my); await E.frame(); await E.nudge();
    await E.type(STAGES[i].agent, 33);
    await E.key("Escape"); await E.key("Escape"); await E.frame();
  }
  E.mark("agent labels done");
  await E.key("Escape");
  await E.move(1500, 860, 0.5);
  E.mark("drawing complete");
  await E.idle(1.9);
  // save scene for reuse
  const scene = await page.evaluate(() => ({ elements: JSON.parse(localStorage.getItem("excalidraw") || "[]"), state: JSON.parse(localStorage.getItem("excalidraw-state") || "{}") }));
  fs.writeFileSync(path.join(here, "scene_dump.json"), JSON.stringify(scene));
  fs.writeFileSync(path.join(here, "marks.json"), JSON.stringify({ frames: E.n, marks: E.marks }, null, 1));
  fs.writeFileSync(path.join(here, "last_frame.png"), E.last);
  await E.finish();
  console.error("done", out, E.n + HOLD, "frames =", ((E.n + HOLD) / FPS).toFixed(2), "s");
  await browser.close();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
