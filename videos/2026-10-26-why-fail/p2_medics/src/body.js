// p2_medics_cohort: medics' journey track, cohort walks together, one drifts to the History group.
window.cam = t => ({ s: 1, x: 0, y: 0 }); // static camera (micro drift/push-in removed)
const TY = 720, TX0 = 200, TX1 = 1700;
const yearX = i => TX0 + 40 + i * ((TX1 - TX0 - 80) / 5);
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const RX = 560; // rough section starts here
function trackY(x, t) {
  const k = eio((t - 25.4) / 1.6);
  if (k <= 0 || x <= RX) return TY;
  const u = x - RX, ramp = sm(u / 120);
  const rise = 0.13 * u;
  const jag = (12 * Math.sin(u / 34) + 7 * Math.sin(u / 13 + 1.3)) * ramp;
  return TY - k * Math.max(0, rise * ramp + jag);
}
const SC = 1.55; // figure scale
function person(x, y, s, fill, op, rot = 0) {
  const body = `M -17 22 L -17 8 Q -17 -4 -5 -4 L 5 -4 Q 17 -4 17 8 L 17 22 Z`;
  const vneck = `M -6 -4 L 0 5 L 6 -4`;
  return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(s)})" opacity="${f2(op)}"><circle cx="0" cy="-17" r="10" fill="${fill}"/><path d="${body}" fill="${fill}"/><path d="${vneck}" fill="none" stroke="${BG}" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function plainPerson(x, y, s, fill, op, rot = 0) {
  const body = `M -17 22 L -17 8 Q -17 -4 -5 -4 L 5 -4 Q 17 -4 17 8 L 17 22 Z`;
  return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(s)})" opacity="${f2(op)}"><circle cx="0" cy="-17" r="10" fill="${fill}"/><path d="${body}" fill="${fill}"/></g>`;
}
const moon = (r, c) => `<mask id="mm"><rect x="${-2 * r}" y="${-2 * r}" width="${4 * r}" height="${4 * r}" fill="#fff"/><circle cx="${f2(r * .55)}" cy="${f2(-r * .35)}" r="${f2(r * .85)}" fill="#000"/></mask><circle cx="0" cy="0" r="${f2(r)}" fill="${c}" mask="url(#mm)"/>`;
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };

// group motion
const WALK0 = 21.5, V = 48;
const walkDist = t => { const tau = Math.max(0, t - WALK0); return V * (tau - 0.5 * (1 - Math.exp(-tau / 0.5))); };
const GX0 = 330, OFF = [-176, -88, 0, 88, 176];
const walking = t => clamp((t - WALK0) / 0.8);
const DET0 = 27.4, DET1 = 29.6; // detach drift
const HIST = { x: 960, y: 985 };
const STRAY_T = { x: 760, y: 972 };
function figPos(i, t) {
  const gx = GX0 + walkDist(t);
  const x = gx + OFF[i] * lerp(0.68, 1, eio((t - WALK0) / 1.2));
  const wk = walking(t);
  const bob = wk * Math.abs(Math.sin(t * 4.2 + i * 1.3)) * 6 + (1 - wk) * 2 * Math.sin(t * 1.6 + i);
  const base = { x, y: trackY(x, t) - 22 * SC - 4 - bob };
  if (i !== 0 || t < DET0) return base;
  const p = eio((t - DET0) / (DET1 - DET0));
  const drift = Math.sin(t * 1.1) * 3 * p;
  return { x: lerp(base.x, STRAY_T.x, p), y: lerp(base.y, STRAY_T.y, p) + drift - (1 - p) * 0 };
}

function track(t) {
  const p = eio((t - 0.0) / 1.3);
  if (p <= 0) return '';
  const xEnd = lerp(TX0, TX1, p);
  const pts = [];
  for (let x = TX0; x <= xEnd; x += 6) pts.push([x, trackY(x, t)]);
  pts.push([xEnd, trackY(xEnd, t)]);
  const d = 'M ' + pts.map(q => f2(q[0]) + ' ' + f2(q[1])).join(' L ');
  const k = eio((t - 25.4) / 1.6);
  let g = `<path d="${d}" fill="none" stroke="#4A4A52" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (k > 0) { // rough part tinted
    const rp = pts.filter(q => q[0] >= RX);
    if (rp.length > 1) g += `<path d="M ${rp.map(q => f2(q[0]) + ' ' + f2(q[1])).join(' L ')}" fill="none" stroke="${AMBER}" stroke-opacity="${f2(0.55 * k)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
    // rocks
    [[760, 14], [930, 10], [1120, 16], [1290, 11], [1470, 15], [1610, 10]].forEach(([x, r], j) => {
      const rk = eo((t - 25.6 - j * 0.12) / 0.4);
      if (rk > 0 && x < xEnd) { const y = trackY(x, t) - 3; g += `<path d="M ${x - r} ${f2(y)} L ${x - r * .3} ${f2(y - r * 1.1 * rk)} L ${x + r * .5} ${f2(y - r * .8 * rk)} L ${x + r} ${f2(y)} Z" fill="#5A5A64" opacity="${f2(rk)}"/>`; }
    });
  }
  if (p >= 1) { // arrow head
    const y = trackY(TX1, t), y2 = trackY(TX1 - 12, t), a = Math.atan2(y - y2, 12) * 180 / Math.PI;
    g += `<g transform="translate(${TX1 + 6} ${f2(y)}) rotate(${f2(a)})"><path d="M -4 -16 L 22 0 L -4 16 Z" fill="#4A4A52"/></g>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = yearX(i), lp = rv(t, 0.4 + i * 0.12);
    if (lp <= 0) continue;
    const y = trackY(x, t);
    const last = i === 5, hl = last ? eo((t - 15.3) / 0.4) : 0;
    g += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(9 * lp)}" fill="${hl > 0 ? mixHex('#6A6A74', OR, hl) : '#6A6A74'}"/>`;
    let ly = -1e9; for (let dx = -70; dx <= 70; dx += 10) ly = Math.max(ly, trackY(x + dx, t));
    g += T(x, ly + 62, last ? 'Year 6+' : `Year ${i + 1}`, { size: 32, w: 700, fill: hl > 0 ? mixHex(SEC, OR, hl) : SEC, op: lp });
  }
  return g;
}
function scheduleCard(t) {
  const p = rv(t, 6.4, 11 * FR);
  if (p <= 0) return '';
  const X = 80, Y = 86, Wd = 760, Hd = 286;
  let c = card(X, Y, Wd, Hd);
  c += `<text x="${X + 34}" y="${Y + 62}" font-family="Inter" font-size="38" font-weight="800"><tspan fill="${BLUE}">Lectures</tspan><tspan fill="${SEC}"> · </tspan><tspan fill="${GREEN}">Placements</tspan><tspan fill="${SEC}"> · </tspan><tspan fill="${RED}">Exams</tspan></text>`;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cw = 112, gx = X + 40;
  days.forEach((d, i) => c += T(gx + cw * i + 50, Y + 112, d, { size: 28, w: 600, fill: SEC }));
  const pat = [[0, 1, 0, 1, 0, 1], [1, 1, 0, 1, 2, 1], [0, 1, 1, 0, 1, 1]]; // 0 lec 1 placement 2 exam
  const col = [BLUE, GREEN, RED];
  pat.forEach((row, r) => row.forEach((v, i) => {
    const bp = eo((t - (6.55 + (r * 6 + i) * 0.045)) / (5 * FR));
    if (bp <= 0) return;
    const x = gx + cw * i, y = Y + 132 + r * 48;
    c += `<rect x="${x}" y="${y}" width="${f2(100 * bp)}" height="38" rx="8" fill="${col[v]}" fill-opacity=".22" stroke="${col[v]}" stroke-width="2"/>`;
  }));
  return pop(c, X + Wd / 2, Y + Hd / 2, p);
}
function hospital(t) {
  const p = rv(t, 11.5, 11 * FR);
  if (p <= 0) return '';
  const cx = 1090, by = 250; // base y
  let g = '';
  g += `<rect x="${cx - 110}" y="${by - 120}" width="220" height="120" rx="8" fill="#1C1C22" stroke="${SEC}" stroke-width="3"/>`;
  g += `<rect x="${cx - 46}" y="${by - 168}" width="92" height="56" rx="6" fill="#1C1C22" stroke="${SEC}" stroke-width="3"/>`;
  g += `<rect x="${cx - 8}" y="${by - 158}" width="16" height="36" rx="3" fill="${RED}"/><rect x="${cx - 18}" y="${by - 148}" width="36" height="16" rx="3" fill="${RED}"/>`;
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
    if (k === 1 || k === 2) { if (r === 1) continue; }
    const x = cx - 92 + k * 50, y = by - 100 + r * 46;
    const lit = 0.5 + 0.5 * Math.sin(t * 0.9 + r * 2 + k);
    g += `<rect x="${x}" y="${y}" width="34" height="28" rx="4" fill="${BLUE}" fill-opacity="${f2(0.18 + 0.15 * lit)}"/>`;
  }
  g += `<rect x="${cx - 22}" y="${by - 48}" width="44" height="48" rx="4" fill="${BLUE}" fill-opacity=".3"/>`;
  g += `<line x1="${cx - 140}" y1="${by}" x2="${cx + 140}" y2="${by}" stroke="${SEC}" stroke-width="3" stroke-linecap="round"/>`;
  let out = pop(g, cx, by - 60, p);
  out += chip(cx, by + 58, 'Hospital placements', GREEN, rv(t, 11.7), { size: 34 });
  return out;
}
function nightChip(t) {
  const p = rv(t, 17.1);
  if (p <= 0) return '';
  const cx = 1090, cy = 410;
  const bob = 3 * Math.sin((t - 17.1) * 1.6);
  return `<g transform="translate(0 ${f2(bob)})">${chip(cx, cy, 'Night shifts', '#B9A6FF', p, { size: 34, icon: moon })}</g>`;
}
function counter(t) {
  const p = rv(t, 14.1, 10 * FR);
  if (p <= 0) return '';
  const X = 1380, Y = 86, Wd = 460, Hd = 286, cx = X + Wd / 2;
  let c = card(X, Y, Wd, Hd);
  c += T(cx, Y + 62, 'Training', { size: 32, w: 700, fill: SEC });
  c += `<clipPath id="cc"><rect x="${X + 10}" y="${Y + 84}" width="${Wd - 20}" height="${Hd - 100}"/></clipPath>`;
  // digit roll 6 -> 7 -> 8, then "6–8 years"
  const fin = eo((t - 15.8) / 0.45);
  const d1 = eio((t - 14.65) / 0.3), d2 = eio((t - 15.25) / 0.3);
  const val = d1 + d2; // 0..2
  let roll = '';
  for (let n = 0; n < 3; n++) {
    const off = (n - val) * 120;
    if (Math.abs(off) > 130) continue;
    roll += T(cx - 70, Y + 228 + off, String(6 + n), { size: 130, w: 800, fill: TXT, op: 1 - Math.abs(off) / 130 });
  }
  let inner = `<g opacity="${f2(1 - fin)}">${roll}${T(cx + 0, Y + 222, 'years', { size: 52, w: 700, fill: SEC, anchor: 'start' })}</g>`;
  if (fin > 0) inner += `<g opacity="${f2(fin)}" transform="translate(0 ${f2(20 * (1 - fin))})">${T(cx, Y + 222, '6–8 years', { size: 78, w: 800, fill: OR })}</g>`;
  c += `<g clip-path="url(#cc)">${inner}</g>`;
  return pop(c, cx, Y + Hd / 2, p);
}
function history(t) {
  const p = rv(t, 26.8, 14 * FR);
  if (p <= 0) return '';
  const { x, y } = HIST;
  let g = '';
  // sofa
  g += `<rect x="${x - 170}" y="${y - 6}" width="340" height="40" rx="14" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-opacity=".6" stroke-width="2.5"/>`;
  g += `<rect x="${x - 190}" y="${y - 34}" width="34" height="68" rx="12" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-opacity=".6" stroke-width="2.5"/>`;
  g += `<rect x="${x + 156}" y="${y - 34}" width="34" height="68" rx="12" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-opacity=".6" stroke-width="2.5"/>`;
  [[-100, -12], [-20, 9], [70, -6]].forEach(([dx, r], j) => {
    const sway = 2.5 * Math.sin(t * 0.9 + j * 1.7);
    g += plainPerson(x + dx, y - 34, 1.45, BLUE, 1, r + sway);
  });
  // drink cup in hand of the right one
  g += `<rect x="${x + 108}" y="${y - 52 + 2 * Math.sin(t * 1.3)}" width="16" height="22" rx="3" fill="${OR}" fill-opacity=".85"/>`;
  let out = `<g opacity="${f2(p)}">${g}</g>`;
  // label with pulse at 31.8
  const pt = t - 31.8;
  const pulse = pt > 0 ? 1 + 0.09 * Math.exp(-pt * 1.4) * Math.abs(Math.sin(pt * 6)) : 1;
  const lp = rv(t, 27.1);
  if (lp > 0) {
    if (pt > 0) { const rr = 1 - Math.exp(-pt * 1.2); out += `<rect x="${x - 110 - 40 * rr}" y="${f2(y - 165 - 20 * rr)}" width="${f2(220 + 80 * rr)}" height="${f2(70 + 40 * rr)}" rx="${f2(35 + 20 * rr)}" fill="none" stroke="${BLUE}" stroke-width="3" opacity="${f2(0.7 * (1 - rr))}"/>`; }
    out += `<g transform="translate(${x} ${y - 130}) scale(${f2(pulse)}) translate(${-x} ${-(y - 130)})">${chip(x, y - 130, 'History', BLUE, lp, { size: 36 })}</g>`;
  }
  return out;
}
function cohort(t) {
  let g = '', links = '';
  const pos = OFF.map((_, i) => figPos(i, t));
  // halo behind the attached group
  const hp = eio((t - 22.4) / 0.8);
  if (hp > 0) {
    const att = t > 28.0 ? pos.slice(1) : pos;
    const x0 = Math.min(...att.map(q => q.x)) - 60, x1 = Math.max(...att.map(q => q.x)) + 60;
    const yc = att.reduce((s, q) => s + q.y, 0) / att.length + 4;
    g += `<rect x="${f2(x0)}" y="${f2(yc - 70)}" width="${f2(x1 - x0)}" height="140" rx="70" fill="${GREEN}" fill-opacity="${f2(0.07 * hp)}" stroke="${GREEN}" stroke-opacity="${f2(0.25 * hp)}" stroke-width="2" stroke-dasharray="6 8"/>`;
  }
  // links
  for (let i = 0; i < 4; i++) {
    const lp = eo((t - (21.6 + i * 0.25)) / 0.5);
    if (lp <= 0) continue;
    const a = pos[i], b = pos[i + 1];
    const ya = a.y + 6 * SC, yb = b.y + 6 * SC;
    if (i === 0 && t > DET0) {
      // stretch then break at 28.0
      const br = t - 28.0;
      if (br < 0) {
        const mx = (a.x + b.x) / 2, my = (ya + yb) / 2 + 10;
        g += `<path d="M ${f2(a.x)} ${f2(ya)} Q ${f2(mx)} ${f2(my)} ${f2(b.x)} ${f2(yb)}" fill="none" stroke="${GREEN}" stroke-opacity=".6" stroke-width="${f2(4 - 2 * clamp((t - DET0) / 0.6))}" stroke-linecap="round"/>`;
      } else if (br < 0.8) {
        const u = eo(br / 0.8), fade = 1 - u;
        const L = 0.45 * (1 - u);
        const ax2 = lerp(a.x, b.x, L), ay2 = lerp(ya, yb, L), bx2 = lerp(b.x, a.x, L), by2 = lerp(yb, ya, L);
        g += `<line x1="${f2(a.x)}" y1="${f2(ya)}" x2="${f2(ax2)}" y2="${f2(ay2)}" stroke="${RED}" stroke-opacity="${f2(0.8 * fade)}" stroke-width="3" stroke-linecap="round"/>`;
        g += `<line x1="${f2(b.x)}" y1="${f2(yb)}" x2="${f2(bx2)}" y2="${f2(by2)}" stroke="${GREEN}" stroke-opacity="${f2(0.6 * fade)}" stroke-width="3" stroke-linecap="round"/>`;
        if (br < 0.35) { const sx = lerp(a.x, b.x, .5), sy = lerp(ya, yb, .5), sr = 10 + 40 * (br / 0.35); g += `<circle cx="${f2(sx)}" cy="${f2(sy)}" r="${f2(sr)}" fill="none" stroke="${RED}" stroke-width="3" opacity="${f2(1 - br / 0.35)}"/>`; }
      }
      continue;
    }
    const ax = a.x + 15 * SC, bx = b.x - 15 * SC;
    const ex = lerp(ax, bx, lp), ey = lerp(ya, yb, lp);
    const mx = (ax + ex) / 2, my = (ya + ey) / 2 + 12;
    links += `<path d="M ${f2(ax)} ${f2(ya)} Q ${f2(mx)} ${f2(my)} ${f2(ex)} ${f2(ey)}" fill="none" stroke="${GREEN}" stroke-opacity=".85" stroke-width="5" stroke-linecap="round"/>`;
  }
  // figures
  for (let i = 0; i < 5; i++) {
    const ap = eo((t - (1.9 + i * 0.4)) / (10 * FR));
    if (ap <= 0) continue;
    const q = pos[i];
    let col = GREEN, rot = 0, op = ap;
    if (i === 0 && t > DET0) {
      const st = clamp((t - 29.1) / 1.0);
      col = mixHex(GREEN, '#6E7F78', st);
      rot = 10 * eio(st) + 1.5 * Math.sin(t * 0.8) * st;
    }
    g += pop(person(q.x, q.y, SC, col, 1, rot), q.x, q.y + 30, op);
  }
  g += links;
  // label above the group (follows the group's 4 attached figures)
  const lp = rv(t, 4.0);
  if (lp > 0) {
    const att = t > DET0 ? pos.slice(1) : pos;
    const lx = att.reduce((s, q) => s + q.x, 0) / att.length;
    const ly = Math.min(...att.map(q => q.y)) - 104;
    const sw = eio((t - 22.5) / 0.5);
    if (sw < 1) g += chip(lx, ly, 'Medics', GREEN, lp * (1 - sw), { size: 36 });
    if (sw > 0) g += chip(lx, ly, 'Cohort', GREEN, sw, { size: 36 });
  }
  return g;
}
function difficult(t) {
  const p = rv(t, 25.6);
  if (p <= 0) return '';
  const x = 1430, y = trackY(x, t) - 110;
  return chip(x, y, 'Difficult journey', AMBER, p, { size: 32 });
}
function scene(t) {
  const dimTop = 1 - 0.5 * eio((t - 21.3) / 0.8);
  let top = scheduleCard(t) + hospital(t) + nightChip(t) + counter(t);
  return `<g opacity="${f2(dimTop)}">${top}</g>` + track(t) + difficult(t) + history(t) + cohort(t);
}
