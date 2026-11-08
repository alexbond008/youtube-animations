// Precompute dotted-map lattice from Natural Earth 110m countries (world-atlas). Writes dots.js
import fs from "node:fs";
import { feature } from "topojson-client";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json"));
const fc = feature(topo, topo.objects.countries);
const proj = { lon0: 30, lat0: 36, kx: 10.6, ky: 13 }; // must match map.html
const inv = (x, y) => [proj.lon0 + (x - 960) / proj.kx, proj.lat0 - (y - 540) / proj.ky];
const polys = [];
for (const f of fc.features) {
  const g = f.geometry; if (!g) continue;
  const ps = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const p of ps) {
    let b = [1e9, 1e9, -1e9, -1e9];
    for (const [x, y] of p[0]) { b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; }
    polys.push({ id: f.id, rings: p, b });
  }
}
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const P = 9, out = [];
for (let y = -40; y <= 1120; y += P) for (let x = -40; x <= 1960; x += P) {
  const [lon, lat] = inv(x, y);
  for (const p of polys) {
    if (lon < p.b[0] || lon > p.b[2] || lat < p.b[1] || lat > p.b[3]) continue;
    if (inRing(p.rings[0], lon, lat) && !p.rings.slice(1).some(r => inRing(r, lon, lat))) {
      out.push([x, y, p.id === "826" ? 1 : p.id === "616" ? 2 : 0]); break;
    }
  }
}
fs.writeFileSync("dots.js", "const DOTS=" + JSON.stringify(out) + ";\n");
console.log(out.length, "dots", out.filter(d => d[2] === 1).length, "UK", out.filter(d => d[2] === 2).length, "PL");
