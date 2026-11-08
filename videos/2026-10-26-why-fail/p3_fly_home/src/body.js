// p3_fly_home: dotted map, Uni pin in the UK, homes light up, flight arcs, Poland highlighted.
const PJ = { lon0: 30, lat0: 36, kx: 10.6, ky: 13 }; // must match make_dots.mjs
const prj = (lon, lat) => [960 + (lon - PJ.lon0) * PJ.kx, 540 - (lat - PJ.lat0) * PJ.ky];
const UNI = prj(-1.2, 52.8);
const HOMES = [
  { p: prj(21.0, 52.2), pl: true, d: 0.0 },   // Poland
  { p: prj(-9.1, 38.7), d: 0.15 },            // Iberia
  { p: prj(3.4, 6.5), d: 0.3 },               // West Africa
  { p: prj(55.3, 25.2), d: 0.45 },            // Gulf
  { p: prj(72.9, 19.1), d: 0.6 },             // South Asia
];
// zoomed on Europe at the start, eases out to reveal the wider map at 4.6–7.0
window.cam = t => {
  const z = eio((t - 4.6) / 2.4);
  return { s: lerp(1.32, 1.0, z), x: lerp(-230, 0, z), y: lerp(-190, 0, z) }; // designed zoom-out only; slow drift/push removed
};
// static land dots rendered once to an image
let LAND = '';
(function () {
  const c = document.createElement('canvas'), S = 2, X0 = -60, Y0 = -60, Wc = 2040, Hc = 1200;
  c.width = Wc * S; c.height = Hc * S;
  const g = c.getContext('2d'); g.fillStyle = '#4A4A56';
  for (const [x, y, k] of DOTS) if (k === 0) { g.beginPath(); g.arc((x - X0) * S, (y - Y0) * S, 2.4 * S, 0, 7); g.fill(); }
  LAND = `<image href="${c.toDataURL('image/png')}" x="${X0}" y="${Y0}" width="${Wc}" height="${Hc}"/>`;
})();
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };
function plane(cx, cy, s, c, rot) {
  return `<g transform="translate(${f2(cx)} ${f2(cy)}) rotate(${f2(rot)}) scale(${f2(s)})"><path d="M -30 -4 L 18 -4 Q 32 -4 32 0 Q 32 4 18 4 L -30 4 Z M -2 -4 L -16 -26 L -8 -26 L 12 -4 Z M -2 4 L -16 26 L -8 26 L 12 4 Z M -28 -4 L -34 -15 L -28 -15 L -20 -4 Z M -28 4 L -34 15 L -28 15 L -20 4 Z" fill="${c}"/></g>`;
}
function pinShape(x, y, s, c) { // teardrop pin, tip at (x,y)
  return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})"><path d="M 0 0 C -6 -14 -20 -24 -20 -38 A 20 20 0 1 1 20 -38 C 20 -24 6 -14 0 0 Z" fill="${c}"/><circle cx="0" cy="-38" r="8" fill="${BG}"/></g>`;
}
function house(x, y, s, c) { // base centre at (x,y)
  return `<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})"><path d="M -18 0 L -18 -22 L 0 -38 L 18 -22 L 18 0 Z" fill="${c}"/><rect x="-6" y="-14" width="12" height="14" rx="2" fill="${BG}"/></g>`;
}
// arcs
function arcCtrl(a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  let nx = -dy / L, ny = dx / L; if (ny > 0) { nx = -nx; ny = -ny; }
  const h = Math.max(70, 0.28 * L);
  return [mx + nx * h, my + ny * h];
}
const qb = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
const qd = (a, c, b, u) => [2 * (1 - u) * (c[0] - a[0]) + 2 * u * (b[0] - c[0]), 2 * (1 - u) * (c[1] - a[1]) + 2 * u * (b[1] - c[1])];
function arcPath(a, c, b, u1) {
  const n = 48, pts = [];
  for (let i = 0; i <= n; i++) { const u = u1 * i / n; pts.push(qb(a, c, b, u)); }
  return 'M ' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L ');
}
function flights(t) {
  let g = '', planes = '';
  const hl = eo((t - 12.3) / 0.5);
  HOMES.forEach((h, i) => {
    const st = 11.3 + h.d * 0.6, dp = eio((t - st) / 1.1);
    if (dp <= 0) return;
    const b = [h.p[0], h.p[1] - 4], a = [UNI[0], UNI[1] - 4], c = arcCtrl(a, b);
    const isPL = !!h.pl;
    const col = isPL ? mixHex('#C9C9D1', OR, hl) : '#C9C9D1';
    const op = isPL ? 1 : 1 - 0.55 * hl;
    const sw = isPL ? 3 + 2.5 * hl : 3;
    g += `<path d="${arcPath(a, c, b, dp)}" fill="none" stroke="${col}" stroke-width="${f2(sw)}" stroke-dasharray="10 9" stroke-linecap="round" opacity="${f2(op)}"/>`;
    if (isPL && hl > 0) g += `<path d="${arcPath(a, c, b, dp)}" fill="none" stroke="${OR}" stroke-width="14" opacity="${f2(0.12 * hl)}" stroke-linecap="round"/>`;
    // plane travelling along the arc, looping
    const period = isPL ? 3.2 : 4.2;
    const tt = t - st;
    if (tt > 0) {
      let u = (tt / period + i * 0.17) % 1;
      if (tt < period) u = Math.min(u, dp); // first trip follows the draw
      const fade = sm(u / 0.08) * sm((1 - u) / 0.08);
      const [px, py] = qb(a, c, b, u), [dx, dy] = qd(a, c, b, u);
      planes += `<g opacity="${f2(fade * op * eo(tt / 0.3))}">${plane(px, py, isPL ? 0.62 + 0.12 * hl : 0.55, isPL ? mixHex(TXT, OR, hl) : TXT, Math.atan2(dy, dx) * 180 / Math.PI)}</g>`;
    }
  });
  return g + planes;
}
function homes(t) {
  let g = '';
  HOMES.forEach((h, i) => {
    const lp = eo((t - (5.2 + h.d)) / (10 * FR));
    if (lp <= 0) return;
    const [x, y] = h.p;
    const isPL = !!h.pl, plh = isPL ? eo((t - 12.3) / 0.5) : 0;
    const col = mixHex(TXT, OR, plh);
    const ring = ((t - 5.2 - h.d) * 0.6) % 1;
    g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(8 + 26 * ring)}" fill="none" stroke="${col}" stroke-width="2" opacity="${f2(0.5 * (1 - ring) * lp)}"/>`;
    g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(8 * lp)}" fill="${col}"/>`;
    const hp = eo((t - (8.5 + h.d * 1.2)) / (10 * FR));
    if (hp > 0) { const bob = 2 * Math.sin(t * 1.5 + i); g += pop(house(x, y - 16 + bob, 1.05, col), x, y - 30, hp); }
  });
  // Poland label
  const lp = rv(t, 5.4);
  if (lp > 0) {
    const [x, y] = HOMES[0].p, plh = eo((t - 12.3) / 0.5);
    g += pop(T(x + 36, y - 14, 'Home (PL)', { anchor: 'start', size: 34, w: 800, fill: mixHex(TXT, OR, plh) }), x + 30, y + 40, lp);
  }
  return g;
}
function uni(t) {
  const p = rv(t, 0.3, 12 * FR);
  if (p <= 0) return '';
  const [x, y] = UNI;
  let g = '';
  const ring = (t * 0.5) % 1;
  g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(10 + 30 * ring)}" fill="none" stroke="${BLUE}" stroke-width="2" opacity="${f2(0.6 * (1 - ring) * p)}"/>`;
  g += pop(pinShape(x, y, 1.0, BLUE), x, y, p);
  g += T(x, y - 72, 'Uni', { anchor: 'middle', size: 38, w: 800, fill: BLUE, op: rv(t, 0.6) });
  // Lectures chip: greys out at 18.1
  const lp = rv(t, 0.9), gr = eo((t - 18.1) / 0.6);
  if (lp > 0) {
    const cx = x - 196, cy = y - 34;
    const col = mixHex(BLUE, '#8A8A94', gr);
    g += `<g opacity="${f2(1 - 0.2 * gr)}">${chip(cx, cy, 'Lectures', col, lp, { size: 32 })}</g>`;
    if (gr > 0) { const w = mw('Lectures', 32, 800) + 30; g += `<line x1="${f2(cx - w / 2)}" y1="${f2(cy)}" x2="${f2(cx - w / 2 + w * gr)}" y2="${f2(cy)}" stroke="${RED}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`; }
  }
  return g;
}
function priceTag(t) {
  const p = rv(t, 16.3, 10 * FR);
  if (p <= 0) return '';
  const a = [UNI[0], UNI[1] - 4], b = [HOMES[0].p[0], HOMES[0].p[1] - 4], c = arcCtrl(a, b);
  const [mx, my] = qb(a, c, b, 0.5);
  const tx = mx - 20, ty = my - 100;
  const tt = t - 16.3;
  const wob = 9 * Math.sin(tt * 7) * Math.exp(-tt * 0.9) + 3 * Math.sin(tt * 2.2);
  let tag = `<path d="M -40 -30 L 26 -30 L 50 0 L 26 30 L -40 30 Q -48 30 -48 22 L -48 -22 Q -48 -30 -40 -30 Z" fill="${AMBER}" fill-opacity=".18" stroke="${AMBER}" stroke-width="3"/>`;
  tag += `<circle cx="30" cy="0" r="6" fill="none" stroke="${AMBER}" stroke-width="3"/>`;
  tag += T(-10, 16, '£', { size: 46, w: 800, fill: AMBER });
  let g = `<line x1="${f2(mx)}" y1="${f2(my)}" x2="${f2(tx)}" y2="${f2(ty + 30)}" stroke="${AMBER}" stroke-width="2" stroke-dasharray="4 5" opacity="${f2(p)}"/>`;
  g += `<g opacity="${f2(p)}" transform="translate(${f2(tx)} ${f2(ty)}) rotate(${f2(wob)}) scale(${f2(0.92 + 0.08 * p)})">${tag}</g>`;
  g += chip(tx + 270, ty, 'Students are broke', AMBER, rv(t, 16.5), { size: 32 });
  return g;
}
function familyChip(t) {
  const p = rv(t, 8.9);
  if (p <= 0) return '';
  const icon = (r, c) => house(0, r * 0.95, r / 19, c);
  return chip(330, 860, 'Family', TXT, p, { size: 34, icon });
}
function scene(t) {
  let g = `<g opacity="${f2(eo(t / 0.5))}">${LAND}`;
  // UK and Poland dots
  const plh = eo((t - 12.3) / 0.5);
  for (const [x, y, k] of DOTS) {
    if (k === 1) g += `<circle cx="${x}" cy="${y}" r="2.7" fill="${BLUE}"/>`;
    else if (k === 2) g += `<circle cx="${x}" cy="${y}" r="2.5" fill="${mixHex('#4A4A56', OR, 0.25 + 0.75 * plh)}"/>`;
  }
  g += '</g>';
  return g + flights(t) + homes(t) + uni(t) + priceTag(t) + familyChip(t);
}
