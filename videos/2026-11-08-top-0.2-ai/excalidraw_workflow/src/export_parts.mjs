// 1) clean diagram.png + diagram.excalidraw from the recorded scene
// 2) part A frames for export_to_terminal: real Excalidraw "Export image" dialog, cursor to PNG
import { openWithScene } from "./restore.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(here, "..");
const FPS = 30000 / 1001;
const { browser, page, scene } = await openWithScene(2);
// --- .excalidraw file
fs.writeFileSync(path.join(ROOT, "diagram.excalidraw"), JSON.stringify({ type: "excalidraw", version: 2, source: "https://excalidraw.com",
  elements: scene.elements, appState: { viewBackgroundColor: "#ffffff", gridSize: 20, theme: "dark" }, files: {} }, null, 2));
// --- clean PNG (UI hidden)
await page.addStyleTag({ content: ".layer-ui__wrapper{visibility:hidden!important}", });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, "diagram.png"), clip: { x: 80, y: 255, width: 1760, height: 560 } });
await page.addStyleTag({ content: ".layer-ui__wrapper{visibility:visible!important}" });
await page.evaluate(svg => document.body.insertAdjacentHTML("beforeend", svg),
  `<svg id="fakecursor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.6 20.3 L10.7 13.6 L17 13.6 Z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`);
await page.waitForTimeout(500);
// --- part A frames
const dir = path.join(here, "partA"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
let n = 0, mx = 1500, my = 870;
await page.mouse.move(mx, my);
const frame = async () => {
  await page.evaluate(([x, y]) => { const c = document.getElementById("fakecursor"); c.style.left = x + "px"; c.style.top = y + "px"; }, [mx, my]);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  fs.writeFileSync(path.join(dir, `a${String(n++).padStart(4, "0")}.png`), await page.screenshot({ type: "png" }));
};
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const move = async (x, y, s) => { const k = Math.round(s * FPS), x0 = mx, y0 = my; for (let i = 1; i <= k; i++) { const u = ease(i / k); mx = x0 + (x - x0) * u; my = y0 + (y - y0) * u; await page.mouse.move(mx, my); await frame(); } };
for (let i = 0; i < 12; i++) await frame();                       // 0.4 s idle on finished diagram
await page.keyboard.press("Meta+Shift+E");                         // Export image dialog
for (let i = 0; i < 10; i++) await frame();
console.error("preview", JSON.stringify(await page.evaluate(() => { const r = document.querySelector(".ImageExportModal canvas").getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })));
await move(1133, 700, 0.75);                                       // to "PNG"
for (let i = 0; i < 6; i++) await frame();
await page.mouse.down(); for (let i = 0; i < 5; i++) await frame(); // pressed (never released: no file is saved)
console.error("partA frames", n, (n / FPS).toFixed(2), "s");
await browser.close();
