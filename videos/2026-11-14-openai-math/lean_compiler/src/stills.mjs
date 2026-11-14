// Quick stills without encoding: node stills.mjs <page.html> <t1,t2,...> <prefix>  -> ../qa/<prefix>_t<sec>.png
import { launch } from "./launch.mjs";
import path from "node:path"; import fs from "node:fs"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [pageRel, times, prefix] = process.argv.slice(2);
const b = await launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", e => console.error("[pageerror]", e.message));
await p.goto(`file://${path.join(here, pageRel)}`); await p.evaluate(() => window.ready);
fs.mkdirSync(path.join(here, "..", "qa"), { recursive: true });
for (const s of times.split(",")) { await p.evaluate(t => window.renderAt(t), parseFloat(s)); await p.screenshot({ path: path.join(here, "..", "qa", `${prefix}_t${s.padStart(5, "0")}.png`) }); }
await b.close();
