// alpha_brief — two scenes: "satellite" (tank-farm shadow → fill level → signal) and "brief" (sources → swarm → funnel → daily brief → weights re-rank)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function header(t, title) {
  const ex = pill(110, 100, 'EXAMPLE', { size: 20, bg: 'rgba(245,184,0,.14)', stroke: AMBER, fill: AMBER, w: 800 });
  return pop(rv(t, 0), 300, 100, ex.svg + T(110 + ex.w + 18, 113, title, { size: 36, w: 800 }));
}
// ========================= SATELLITE =========================
const IX = 96, IY = 160, IW = 1240, IH = 790;
const FILLS = [71, 48, 66, 59, 80, 52, 63, 57, 74, 45, 68, 61]; // mean 62
const TANKS = [];
(function () { seed = 11; let k = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const rad = 74 + Math.round(rnd() * 14);
    TANKS.push({ x: IX + 250 + c * 250 + (r % 2) * 40 + (rnd() - .5) * 20, y: IY + 190 + r * 215 + (rnd() - .5) * 16, r: rad, fill: FILLS[k++] });
  } })();
const GROUND = (function () { seed = 5; let g = '';
  const tones = ['#1A1C19', '#1D201B', '#181A17', '#1F211D', '#1B1D1C'];
  for (let i = 0; i < 46; i++) { const x = IX + rnd() * IW, y = IY + rnd() * IH, w = 120 + rnd() * 320, h = 80 + rnd() * 220; g += `<rect x="${f2(x - w / 2)}" y="${f2(y - h / 2)}" width="${f2(w)}" height="${f2(h)}" fill="${tones[i % 5]}" opacity=".9" transform="rotate(${f2((rnd() - .5) * 8)} ${f2(x)} ${f2(y)})"/>`; }
  // roads
  g += `<path d="M ${IX} ${IY + 610} L ${IX + IW} ${IY + 640}" stroke="#2C2E29" stroke-width="22"/>`;
  g += `<path d="M ${IX + 90} ${IY} L ${IX + 120} ${IY + IH}" stroke="#2C2E29" stroke-width="18"/>`;
  g += `<path d="M ${IX + IW - 70} ${IY} L ${IX + IW - 60} ${IY + IH}" stroke="#262824" stroke-width="12"/>`;
  // berms around tank groups
  for (let r = 0; r < 3; r++) g += `<rect x="${IX + 160 + (r % 2) * 40}" y="${IY + 100 + r * 215}" width="1020" height="180" rx="6" fill="none" stroke="#2E302B" stroke-width="5"/>`;
  return g; })();
function tank(tk, scanned, sp) {
  const { x, y, r, fill } = tk, ri = r * 0.86, d = ri * (1 - fill / 100) * 0.62;
  const id = `t${Math.round(x)}`;
  let g = `<circle cx="${f2(x + 16)}" cy="${f2(y + 18)}" r="${r}" fill="#0A0B0A" opacity=".7"/>`; // cast shadow (sun upper-left)
  g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#8C8F88"/>`; // rim / wall top
  g += `<clipPath id="${id}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(ri)}"/></clipPath>`;
  g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(ri)}" fill="#B9BCB4"/>`; // floating roof
  g += `<g clip-path="url(#${id})"><path fill-rule="evenodd" d="M ${f2(x - ri)} ${f2(y)} a ${f2(ri)} ${f2(ri)} 0 1 0 ${f2(2 * ri)} 0 a ${f2(ri)} ${f2(ri)} 0 1 0 ${f2(-2 * ri)} 0 Z M ${f2(x - ri + d)} ${f2(y + d)} a ${f2(ri)} ${f2(ri)} 0 1 1 ${f2(2 * ri)} 0 a ${f2(ri)} ${f2(ri)} 0 1 1 ${f2(-2 * ri)} 0 Z" fill="#26282A" opacity=".9"/></g>`;
  g += `<circle cx="${f2(x + d * .3)}" cy="${f2(y + d * .3)}" r="${f2(ri * .12)}" fill="#A4A7A0"/>`; // roof hatch
  let ov = '';
  if (sp > 0) {
    const s = r + 14, L = 22, o = f2(sp);
    const corner = (cx, cy, dx, dy) => `M ${f2(cx + dx * L)} ${f2(cy)} L ${f2(cx)} ${f2(cy)} L ${f2(cx)} ${f2(cy + dy * L)}`;
    ov += `<path d="${corner(x - s, y - s, 1, 1)} ${corner(x + s, y - s, -1, 1)} ${corner(x - s, y + s, 1, -1)} ${corner(x + s, y + s, -1, -1)}" fill="none" stroke="${OR}" stroke-width="3.5" opacity="${o}"/>`;
    const pl = pill(x, y + s + 2, `${fill}%`, { size: 22, bg: 'rgba(14,14,16,.88)', stroke: OR, fill: TXT, anchor: 'middle', h: 38 });
    ov += `<g opacity="${o}">${pl.svg}</g>`;
  }
  return [g, ov];
}
const SC0 = 0.9, SC1 = 3.1; // scan pass
function sceneSat(t) {
  let g = header(t, 'Alternative data: satellite → signal');
  const ip = rv(t, 0.1);
  let im = card(IX, IY, IW, IH) + `<clipPath id="ic"><rect x="${IX + 1}" y="${IY + 1}" width="${IW - 2}" height="${IH - 2}" rx="15"/></clipPath><g clip-path="url(#ic)"><rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" fill="#171916"/>${GROUND}`;
  const scanX = lerp(IX - 40, IX + IW + 40, eio((t - SC0) / (SC1 - SC0)));
  let ovs = '';
  TANKS.forEach(tk => { const hit = t > SC0 && scanX >= tk.x; const sp = hit ? rv(t, SC0 + (SC1 - SC0) * eio_inv((tk.x - IX + 40) / (IW + 80)), 0.3) : 0; const [b, o] = tank(tk, hit, sp); im += b; ovs += o; });
  if (t > SC0 && t < SC1 + 0.3) {
    const fo = 1 - clamp((t - SC1) / 0.3);
    im += `<rect x="${f2(scanX - 160)}" y="${IY}" width="160" height="${IH}" fill="url(#scanG)" opacity="${f2(fo)}"/><line x1="${f2(scanX)}" x2="${f2(scanX)}" y1="${IY}" y2="${IY + IH}" stroke="${OR}" stroke-width="4" opacity="${f2(fo)}"/>`;
  }
  im += ovs;
  im += `</g><linearGradient id="scanG" x1="0" x2="1"><stop offset="0" stop-color="${OR}" stop-opacity="0"/><stop offset="1" stop-color="${OR}" stop-opacity=".22"/></linearGradient>`;
  im += pill(IX + 28, IY + IH - 40, 'Illustrative · not a real location', { size: 20, bg: 'rgba(14,14,16,.85)', fill: SEC, w: 600 }).svg;
  im += pill(IX + 28, IY + 40, 'SAT · tank farm · top-down', { size: 20, bg: 'rgba(14,14,16,.85)', fill: TXT, mono: true, w: 500 }).svg;
  g += pop(ip, IX + IW / 2, IY + IH / 2, im);
  // right panel
  const PX = 1376, PY = 160, PW = 448, PH = 790;
  const pp = rv(t, 0.4);
  let p = card(PX, PY, PW, PH) + T(PX + 32, PY + 56, 'Shadow → fill level', { size: 28, w: 700 });
  // cross-section diagram: tank wall, floating roof, sun ray, shadow on roof
  const dx = PX + 96, dy = PY + 150, dw = 290, dh = 180, lvl = 0.62;
  const roofY = dy + dh - dh * lvl;
  p += `<rect x="${dx}" y="${f2(roofY)}" width="${dw}" height="${f2(dy + dh - roofY)}" fill="${BLUE}" opacity=".16"/>`;
  p += `<path d="M ${dx} ${dy} L ${dx} ${dy + dh} L ${dx + dw} ${dy + dh} L ${dx + dw} ${dy}" fill="none" stroke="#8C8F88" stroke-width="6" stroke-linejoin="round"/>`;
  p += `<line x1="${dx + 4}" x2="${dx + dw - 4}" y1="${f2(roofY)}" y2="${f2(roofY)}" stroke="#B9BCB4" stroke-width="8" stroke-linecap="round"/>`;
  const shW = (dy + dh * (1 - lvl) - dy) * 0.9; // shadow length on roof for ~48deg sun
  p += `<line x1="${dx + 4}" x2="${f2(dx + shW)}" y1="${f2(roofY)}" y2="${f2(roofY)}" stroke="#0A0B0A" stroke-width="8" stroke-linecap="round"/>`;
  p += `<line x1="${dx - 30}" y1="${f2(dy - 30 * (dh * (1 - lvl)) / shW)}" x2="${f2(dx + shW)}" y2="${f2(roofY)}" stroke="${AMBER}" stroke-width="2.5" stroke-dasharray="6 6"/>`;
  p += `<circle cx="${dx - 30}" cy="${f2(dy - 30 * (dh * (1 - lvl)) / shW)}" r="10" fill="${AMBER}"/>`;
  p += T(dx + shW + 14, roofY - 14, 'shadow', { size: 18, w: 700, fill: SEC });
  p += T(dx + dw / 2, dy + dh + 36, 'less oil → roof lower → longer shadow', { size: 18, w: 600, fill: SEC, anchor: 'middle' });
  // readouts
  const nScan = TANKS.filter(tk => t > SC0 && scanX >= tk.x).length;
  p += T(PX + 32, PY + 420, 'Tanks measured', { size: 22, w: 600, fill: SEC }) + T(PX + PW - 32, PY + 420, `${nScan} / 12`, { size: 28, w: 800, anchor: 'end' });
  const cp = rv(t, 3.2, 0.2), cnt = Math.round(62 * eo((t - 3.2) / 0.7));
  p += T(PX + 32, PY + 486, 'Avg fill level', { size: 22, w: 600, fill: SEC });
  if (cp > 0) {
    p += pop(cp, PX + 140, PY + 560, T(PX + 28, PY + 590, `${cnt}%`, { size: 96, w: 800 }));
    p += `<rect x="${PX + 32}" y="${PY + 620}" width="${PW - 64}" height="12" rx="6" fill="#26262D"/><rect x="${PX + 32}" y="${PY + 620}" width="${f2((PW - 64) * cnt / 100)}" height="12" rx="6" fill="${BLUE}"/>`;
  }
  const sg = rv(t, 4.5);
  if (sg > 0) {
    const pl = pill(PX + 32, PY + 700, 'signal ↑', { size: 30, bg: 'rgba(61,220,151,.14)', stroke: GREEN, fill: GREEN, h: 60, padX: 22, w: 800 });
    p += pop(sg, PX + 32 + pl.w / 2, PY + 700, pl.svg + T(PX + 48 + pl.w, PY + 709, 'into the price model', { size: 20, w: 600, fill: SEC }));
    const ph = ((t - 4.5) % 1.5) / 1.5; if (t > 4.9) p += `<rect x="${f2(PX + 32 - 10 * ph)}" y="${f2(PY + 670 - 10 * ph)}" width="${f2(pl.w + 20 * ph)}" height="${f2(60 + 20 * ph)}" rx="${f2(30 + 10 * ph)}" fill="none" stroke="${GREEN}" stroke-width="2" opacity="${f2(.6 * (1 - ph))}"/>`;
  }
  g += pop(pp, PX + PW / 2, PY + PH / 2, p);
  return g;
}
// inverse of eio for scan timing (bisection)
function eio_inv(y) { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (eio(m) < y) a = m; else b = m; } return (a + b) / 2; }
// ========================= BRIEF =========================
const SRC = [['News', BLUE], ['Y Combinator', OR], ['YouTube', RED], ['X', TXT], ['arXiv', GREEN], ['Lab blogs', AMBER], ['Forums', SEC]];
const SX = 110, SY0 = 236, SDY = 74;
const SWX0 = 470, SWX1 = 1040, SWY0 = 150, SWY1 = 700;
const NODES = (function () { seed = 3; const n = []; let tries = 0;
  while (n.length < 15 && tries++ < 2000) { const x = 540 + rnd() * 430, y = 240 + rnd() * 420; if (n.every(p => Math.hypot(p[0] - x, p[1] - y) > 100)) n.push([x, y, rnd()]); } return n; })();
const EDGES = []; NODES.forEach((a, i) => NODES.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 175) EDGES.push([i, j]); }));
const FUN = { x0: 1075, x1: 1250, y0a: 190, y0b: 660, y1a: 400, y1b: 450 };
const ITEMS = (function () { seed = 21; const it = [];
  for (let s = 1.5; s < 16; s += 0.075 + rnd() * 0.07) {
    const src = Math.floor(rnd() * SRC.length);
    const pass = s >= 2.5 && rnd() < 0.16;
    it.push({ s, src, pass, ye: SWY0 + 90 + rnd() * (SWY1 - SWY0 - 150), drift: (rnd() - .5) * 80, fy: FUN.y0a + 30 + rnd() * (FUN.y0b - FUN.y0a - 60) });
  } return it; })();
const TA = 1.4, TB = 2.2, TC = 0.7, TD = 0.35;
const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };
function itemPos(it, t) {
  const sy = SY0 + it.src * SDY, sx = SX + 250;
  let u = t - it.s; if (u < 0) return null;
  if (u < TA) { const k = eio(u / TA); return { x: bez(sx, sx + 120, SWX0 - 100, SWX0 + 20, k), y: bez(sy, sy, it.ye, it.ye, k), ph: 'A', k }; }
  u -= TA;
  if (u < TB) { const k = u / TB; const x = lerp(SWX0 + 20, SWX1 + 30, k); const y = it.pass ? lerp(it.ye, it.fy, eio(k)) : it.ye + it.drift * k + (k > .45 ? 60 * (k - .45) * (k - .45) * 4 : 0); return { x, y, ph: 'B', k }; }
  if (!it.pass) return null; u -= TB;
  if (u < TC) { const k = eio(u / TC); const fx = lerp(FUN.x0 - 10, FUN.x1 + 10, k); return { x: lerp(SWX1 + 30, fx, Math.min(1, k * 3)), y: lerp(it.fy, (FUN.y1a + FUN.y1b) / 2, k), ph: 'C', k }; }
  u -= TC;
  if (u < TD) { const k = u / TD; return { x: lerp(FUN.x1 + 10, 1330, k), y: (FUN.y1a + FUN.y1b) / 2, ph: 'D', k }; }
  return null;
}
const ROWS = [
  { a: 'Open-source robot-learning', b: 'dataset released', src: 'arXiv', sc: 0.91 },
  { a: 'Is RL post-training worth it', b: 'for small teams?', src: 'Forum thread', sc: 0.86, w: 0.7 },
  { a: 'Benchmark: LLM agents on', b: 'circuit-layout tasks', src: 'arXiv', sc: 0.82 },
  { a: 'Sim-to-real lessons from', b: 'robot arms', src: 'YouTube talk', sc: 0.77 },
  { a: 'New RL post-training method', b: 'for agents', src: 'Lab blog', sc: 0.45, w: 2.0 },
];
const PHX = 1316, PHY = 130, PHW = 480, PHH = 850, ROWY0 = PHY + 236, ROWH = 118;
const RW0 = 12.1, RW1 = 12.6, RR0 = 12.8, RR1 = 13.6; // weight apply, re-rank
function sceneBrief(t) {
  let g = header(t, 'Your own alpha: a daily research brief');
  // swarm card
  const swp = rv(t, 3.0);
  if (swp > 0) {
    let s = card(SWX0, SWY0, SWX1 - SWX0, SWY1 - SWY0) + T(SWX0 + 28, SWY0 + 48, 'Agent swarm', { size: 26, w: 700 }) + T(SWX1 - 28, SWY0 + 48, 'filter: relevant to you?', { size: 20, w: 600, fill: SEC, anchor: 'end' });
    EDGES.forEach(([i, j], k) => { const a = NODES[i], b = NODES[j]; const fl = .25 + .2 * Math.sin(t * 2.2 + k); s += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="${OR}" stroke-width="1.5" opacity="${f2(fl * rv(t, 3.2 + k * 0.02, .4))}"/>`; });
    NODES.forEach((n, i) => { const np = rv(t, 3.1 + i * 0.04, .3); const pul = 1 + .12 * Math.sin(t * 3 + n[2] * 6); s += `<circle cx="${f2(n[0])}" cy="${f2(n[1])}" r="${f2(10 * np * pul)}" fill="${CARD}" stroke="${OR}" stroke-width="3"/><circle cx="${f2(n[0])}" cy="${f2(n[1])}" r="${f2(4 * np)}" fill="${OR}"/>`; });
    g += pop(swp, (SWX0 + SWX1) / 2, (SWY0 + SWY1) / 2, s);
  }
  // funnel
  const fp = rv(t, 6.0);
  if (fp > 0) {
    const F = FUN;
    const nk = 1190, ny0 = 400, ny1 = 450;
    let fs = `<path d="M ${F.x0} ${F.y0a} L ${nk} ${ny0} L ${F.x1 + 10} ${ny0} L ${F.x1 + 10} ${ny1} L ${nk} ${ny1} L ${F.x0} ${F.y0b}" fill="${OR}" fill-opacity=".07" stroke="${OR}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    [0.3, 0.6].forEach(k => { const x = lerp(F.x0, nk, k), ya = lerp(F.y0a, ny0, k), yb = lerp(F.y0b, ny1, k); fs += `<line x1="${f2(x)}" x2="${f2(x)}" y1="${f2(ya + 8)}" y2="${f2(yb - 8)}" stroke="${OR}" stroke-width="2" stroke-dasharray="3 9" opacity=".55"/>`; });
    g += pop(fp, (F.x0 + F.x1) / 2, 425, fs + T((F.x0 + F.x1) / 2 - 10, F.y0b + 46, 'Top 5', { size: 26, w: 800, fill: OR, anchor: 'middle' }));
  }
  // items
  let its = '';
  ITEMS.forEach(it => {
    const p = itemPos(it, t); if (!p) return;
    if (p.ph === 'B' && t < 3.0) { /* swarm not yet visible: items wait at entry */ }
    const col = SRC[it.src][1];
    let op = 1, stroke = col, sc = 1;
    if (p.ph === 'A') op = clamp(p.k * 4);
    if (p.ph === 'B') {
      if (!it.pass && p.k > .45) { op = 1 - clamp((p.k - .45) / .35); stroke = mix(col, '#3A3A42', clamp((p.k - .45) / .15)); }
      if (it.pass && p.k > .45) stroke = mix(col, OR, clamp((p.k - .45) / .15));
      // scan beam from nearest node
      if (t > 3.3 && p.k < .6) { let best = null, bd = 1e9; NODES.forEach(n => { const d = Math.hypot(n[0] - p.x, n[1] - p.y); if (d < bd) { bd = d; best = n; } }); if (bd < 120) its += `<line x1="${f2(best[0])}" y1="${f2(best[1])}" x2="${f2(p.x)}" y2="${f2(p.y)}" stroke="${OR}" stroke-width="1.5" opacity="${f2(.6 * (1 - bd / 120) * op)}"/>`; }
    }
    if (p.ph === 'C') { stroke = OR; sc = lerp(1, .7, p.k); }
    if (p.ph === 'D') { stroke = OR; sc = .7; op = 1 - p.k; }
    if (op <= 0.01) return;
    its += `<g transform="translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(sc)})" opacity="${f2(op)}"><rect x="-34" y="-13" width="68" height="26" rx="7" fill="#1E1E24" stroke="${stroke}" stroke-width="2"/><rect x="-24" y="-4" width="${it.pass ? 40 : 30}" height="4" rx="2" fill="${stroke}" opacity=".8"/><rect x="-24" y="4" width="20" height="3" rx="1.5" fill="${SEC}" opacity=".5"/></g>`;
  });
  g += its;
  // source chips (on top of item spawn)
  SRC.forEach(([name, col], i) => {
    const p = rv(t, 0.2 + i * 0.22); const y = SY0 + i * SDY;
    const pl = pill(SX, y, name, { size: 24, dot: col, bg: CARD, stroke: BORDER, h: 56, padX: 20 });
    // pulse when emitting
    g += pop(p, SX + 80, y, `<g ${SH}>${pl.svg}</g>`);
  });
  if (rv(t, 0.2) > 0) g += T(SX, SY0 - 52, 'Sources', { size: 22, w: 700, fill: SEC, op: rv(t, 0.2) });
  // phone brief
  const php = rv(t, 8.5, .4);
  if (php > 0) {
    let ph = `<g ${SH}><rect x="${PHX}" y="${PHY}" width="${PHW}" height="${PHH}" rx="48" fill="#121216" stroke="#3A3A42" stroke-width="3"/></g>`;
    ph += `<rect x="${PHX + PHW / 2 - 60}" y="${PHY + 18}" width="120" height="30" rx="15" fill="#0A0A0C"/>`;
    ph += T(PHX + 34, PHY + 100, 'Daily brief · 09:00', { size: 34, w: 800 });
    ph += T(PHX + 34, PHY + 140, 'AI for engineering / RL', { size: 22, w: 600, fill: OR });
    ph += T(PHX + 34, PHY + 196, 'TOP 5 TODAY', { size: 18, w: 800, fill: SEC, ls: 2 });
    // compute positions (before/after re-rank)
    const wp = clamp((t - RW0) / (RW1 - RW0));
    const scores = ROWS.map(r => r.w ? lerp(r.sc, r.sc * r.w, eo(wp)) : r.sc);
    const finalOrder = ROWS.map((r, i) => i).sort((a, b) => (ROWS[b].sc * (ROWS[b].w || 1)) - (ROWS[a].sc * (ROWS[a].w || 1)));
    const rk = eio((t - RR0) / (RR1 - RR0));
    [1, 2, 3, 0, 4].forEach(i => { const r = ROWS[i];
      const rp = rv(t, 8.8 + i * 0.22); if (rp <= 0) return;
      const fi = finalOrder.indexOf(i), pos = lerp(i, fi, rk), y = ROWY0 + pos * ROWH;
      const rankNum = rk > .5 ? fi + 1 : i + 1;
      let row = '';
      const moving = Math.sin(Math.PI * rk) * (fi !== i ? 1 : 0);
      row += `<rect x="${PHX + 12}" y="${f2(y - 18)}" width="${PHW - 24}" height="${ROWH - 2}" rx="16" fill="#121216"${moving > 0 && r.w === 2 ? ` ${SH}` : ''}/>`;
      const hi = r.w === 2 ? clamp((t - RW0) / .3) * (1 - clamp((t - RR1 - 1.2) / .6)) : 0;
      const lo = r.w && r.w < 1 ? clamp((t - RW0) / .3) : 0;
      if (hi > 0) row += `<rect x="${PHX + 16}" y="${f2(y - 14)}" width="${PHW - 32}" height="${ROWH - 10}" rx="16" fill="${GREEN}" fill-opacity="${f2(.1 * hi)}" stroke="${GREEN}" stroke-opacity="${f2(.7 * hi)}" stroke-width="2"/>`;
      row += `<circle cx="${PHX + 52}" cy="${f2(y + 22)}" r="20" fill="${rankNum === 1 ? OR : '#26262D'}"/>` + T(PHX + 52, y + 30, String(rankNum), { size: 22, w: 800, anchor: 'middle', fill: TXT });
      const tc = lo > 0 ? mix(TXT, '#8A8A94', lo) : TXT;
      row += T(PHX + 88, y + 16, r.a, { size: 23, w: 700, fill: tc }) + T(PHX + 88, y + 46, r.b, { size: 23, w: 700, fill: tc });
      row += T(PHX + 88, y + 80, r.src, { size: 18, w: 600, fill: SEC }) + T(PHX + PHW - 34, y + 80, scores[i].toFixed(2), { size: 19, w: 700, fill: hi > 0 ? GREEN : lo > 0 ? RED : SEC, anchor: 'end', mono: true });
      if (r.w) { const bp = rv(t, RW0, .3); if (bp > 0) { const pl = pill(PHX + PHW - 100, y + 74, `×${r.w.toFixed(1)}`, { size: 17, bg: r.w > 1 ? 'rgba(61,220,151,.16)' : 'rgba(255,90,78,.16)', fill: r.w > 1 ? GREEN : RED, h: 28, padX: 10, anchor: 'end', mono: true }); row += `<g opacity="${f2(bp)}">${pl.svg}</g>`; } }
      if (i < 4 || rk > 0) row += `<line x1="${PHX + 34}" x2="${PHX + PHW - 34}" y1="${f2(y + ROWH - 18)}" y2="${f2(y + ROWH - 18)}" stroke="#222228" stroke-width="1.5"/>`;
      const lift = r.w === 2 ? moving : 0;
      if (lift > 0) row = `<g transform="translate(${PHX + PHW / 2} ${f2(y + 40)}) scale(${f2(1 + .04 * lift)}) translate(${-(PHX + PHW / 2)} ${f2(-(y + 40))})">${row}</g>`;
      ph += pop(rp, PHX + PHW / 2, y + 40, row);
    });
    g += pop(php, PHX + PHW / 2, PHY + PHH / 2, ph);
  }
  // weights panel
  const wpn = rv(t, 11.2);
  if (wpn > 0) {
    const WX = SWX0, WY = 740, WW = FUN.x1 - SWX0, WH = 236;
    let w = card(WX, WY, WW, WH) + T(WX + 28, WY + 50, 'Source weights', { size: 26, w: 700 }) + T(WX + WW - 28, WY + 50, 'score × weight', { size: 20, w: 600, fill: SEC, anchor: 'end', mono: true });
    [['lab blog', 2.0, GREEN], ['forum', 0.7, RED]].forEach(([n, v, c], i) => {
      const y = WY + 112 + i * 66, bx = WX + 220, bw = WW - 220 - 150;
      w += T(WX + 28, y + 9, n, { size: 26, w: 700 }) + `<rect x="${bx}" y="${y - 7}" width="${bw}" height="14" rx="7" fill="#26262D"/>`;
      const k = eo((t - 11.5 - i * 0.2) / .5);
      w += `<rect x="${bx}" y="${y - 7}" width="${f2(bw * (v / 2) * k)}" height="14" rx="7" fill="${c}"/>`;
      w += `<line x1="${bx + bw / 2}" x2="${bx + bw / 2}" y1="${y - 16}" y2="${y + 16}" stroke="${SEC}" stroke-width="2" opacity=".5"/>`;
      w += T(WX + WW - 28, y + 10, `×${v.toFixed(1)}`, { size: 28, w: 800, fill: c, anchor: 'end', mono: true });
    });
    w += T(WX + 220 + (WW - 370) / 2, WY + WH - 16, '×1.0', { size: 16, w: 600, fill: DIM, anchor: 'middle', mono: true });
    g += pop(wpn, WX + WW / 2, WY + WH / 2, w);
  }
  return g;
}
mount(SCENE === 'satellite' ? sceneSat : sceneBrief);
