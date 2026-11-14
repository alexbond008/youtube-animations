// Quick preview stills: node stills.mjs <page.html> <outDir> t1,t2,...
import { launch } from "./browser.mjs";
import path from "node:path"; import fs from "node:fs";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [pg, out, ts] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", e => console.error("[pageerror]", e.message));
await p.goto("file://" + path.join(here, pg)); await p.evaluate(() => window.ready);
for (const t of ts.split(",")) { await p.evaluate(x => window.renderAt(x), +t); await p.screenshot({ path: path.join(out, `s_${t}.png`) }); }
await b.close();
