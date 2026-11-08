import { launch } from "./launch.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30000 / 1001, DUR = parseFloat(process.argv[2] || "6.17");
const dir = path.join(here, "partB"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
const b = await launch(); const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error(e.message));
await page.goto(`file://${here}/terminal.html`); await page.evaluate(() => window.ready);
const N = Math.round(DUR * FPS);
for (let i = 0; i < N; i++) { await page.evaluate(t => window.renderAt(t), i / FPS); fs.writeFileSync(path.join(dir, `b${String(i).padStart(4, "0")}.png`), await page.screenshot()); }
await b.close(); console.error("partB", N);
