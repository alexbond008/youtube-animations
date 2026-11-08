import { launch } from "./launch.mjs";
import { CSS } from "./draw.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
export async function openWithScene(dsf) {
  const scene = JSON.parse(fs.readFileSync(path.join(here, "scene_final.json")));
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dsf, acceptDownloads: false });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("[pageerror]", e.message));
  await page.addInitScript(([els, st]) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("excalidraw-theme", "dark");
    localStorage.setItem("excalidraw", JSON.stringify(els));
    localStorage.setItem("excalidraw-state", JSON.stringify({ ...st, selectedElementIds: {}, activeTool: { type: "selection", customType: null, locked: false, lastActiveTool: null } }));
  }, [scene.elements, scene.state]);
  await page.goto("https://excalidraw.com", { waitUntil: "networkidle", timeout: 90000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  return { browser, page, scene };
}
