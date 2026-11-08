// p4_new_class: stick-figure student walks into "Thermofluids", panics at a PDE, decides to "just pass", then clones.
// Static camera (no push-in / zoom / drift): all motion comes from the characters and elements.
window.cam = () => ({ s: 1, x: 0, y: 0 });
const WHITE = '#FFFFFF', INK = '#0E0E10';
const FLOOR = 960;
const SW = 6; // main stroke width

// ---------- hand-drawn wobble ----------
let BOIL = 0, SEED = 0;
const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
const jit = (amp) => { SEED++; return (hash(SEED, BOIL) - 0.5) * 2 * amp; };
function rpath(pts, o = {}) {
  const amp = o.amp == null ? 1.3 : o.amp;
  if (o.close) pts = pts.concat([pts[0]]);
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 45));
    const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    for (let k = 0; k < n; k++) {
      const u = k / n, j = (i === 0 && k === 0) ? jit(amp * 0.4) : jit(amp);
      out.push([x0 + (x1 - x0) * u + nx * j, y0 + (y1 - y0) * u + ny * j]);
    }
  }
  const [xl, yl] = pts[pts.length - 1];
  out.push(o.close ? out[0] : [xl + jit(amp * 0.4), yl + jit(amp * 0.4)]);
  const d = 'M ' + out.map(p => `${f2(p[0])} ${f2(p[1])}`).join(' L ') + (o.close ? ' Z' : '');
  return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || TXT}" stroke-width="${o.sw || SW}" stroke-linecap="round" stroke-linejoin="round"${o.op != null ? ` opacity="${f2(o.op)}"` : ''}${o.extra ? ' ' + o.extra : ''}/>`;
}
function rcirc(cx, cy, r, o = {}) {
  const n = 26, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r + jit(o.amp == null ? 1.0 : o.amp); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return `<path d="M ${pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L ')} Z" fill="${o.fill || 'none'}" stroke="${o.stroke || TXT}" stroke-width="${o.sw || SW}" stroke-linejoin="round"${o.op != null ? ` opacity="${f2(o.op)}"` : ''}/>`;
}
const rrect = (x, y, w, h, o = {}) => rpath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true });

// ---------- expression keyframes ----------
const E0 = { brow: 0, worry: 0, wide: 0, lid: 0, mW: 24, mC: 0.8, mO: 0, smirk: 0, lx: 0, ly: 0, slump: 0, lean: 0, cross: 0 };
const KF = [
  [0.0, { mC: 1 }],
  [2.2, { brow: 7, mO: 0.45, mC: 0 }],
  [3.0, { brow: 5, mO: 0, mC: 1 }],
  [4.6, { brow: 3, mC: 1.3, mW: 30 }],
  [6.7, { brow: 8, mO: 0.35, mC: 0 }],
  [7.7, { brow: 2, worry: 0.5, mO: 0, mC: 0 }],
  [8.9, { brow: 4, worry: 1, mC: -0.7, wide: 0.35 }],
  [10.0, { brow: -2, worry: 1, mC: -1.1, wide: 0, slump: 1 }],
  [11.7, { brow: 2, worry: 0.2, mC: 0.4, lx: -4, ly: -3 }],
  [12.2, { brow: 6, worry: 0, mC: 0, mO: 0.2, lx: -4, ly: -4 }],
  [13.3, { brow: 12, wide: 1, mO: 0.9, mC: 0, lx: -3, ly: -3 }],
  [14.9, { brow: 3, wide: 0, mO: 0, lid: 1, smirk: 1, mC: 0.4, mW: 26, lean: 1, cross: 1, lx: 0, ly: 0 }],
  [18.2, { brow: 4, lid: 0.7, smirk: 0.6, mC: 0.9, lean: 1, cross: 1 }],
];
function expr(t) {
  let cur = { ...E0 };
  for (const [kt, k] of KF) {
    const tgt = { ...cur, ...k };
    if (t >= kt) { const p = eio((t - kt) / 0.28); const n = {}; for (const key in cur) n[key] = lerp(cur[key], tgt[key], p); cur = p >= 1 ? tgt : n; }
  }
  return cur;
}
const blink = (t, ph = 0) => { const c = ((t + ph) % 3.1) / 3.1; return c > 0.965 ? 0.15 : 1; };

// ---------- the student ----------
// o: x, y (hip), dir (-1..1 facing), pose 'stand'|'sit', ph (walk phase), wa (walk amount), e (expr), coffee, op, sweat, bl (blink)
function student(o) {
  const e = o.e, d = o.dir, sl = e.slump, ln = e.lean;
  let back = '', g = '';
  const torso = 132 - 12 * sl;
  const ang = (-6 * ln * Math.sign(d || 1) + 4 * sl * (d || 1)) * Math.PI / 180;
  const nx = Math.sin(ang) * torso, ny = -Math.cos(ang) * torso + 14 * ln;
  const hx = nx + d * 4 + d * 6 * sl, hy = ny - 50 + 16 * sl + 6 * ln, R = 40;
  const sh = [nx, ny + 14 + 6 * sl];
  // legs (standing only)
  if (o.pose === 'stand') {
    const a = o.wa * 0.42 * Math.sin(o.ph);
    const leg = s => { const aa = a * s, fx = Math.sin(aa) * 150 + (1 - o.wa) * 22 * s, fy = Math.cos(aa) * 150; const kx = fx * 0.5 + d * 8 * o.wa * Math.abs(Math.sin(o.ph)), ky = 76;
      return rpath([[0, 0], [kx, ky], [fx, fy], [fx + d * 18 + (d === 0 ? 14 * s : 0), fy]]); };
    g += leg(1) + leg(-1);
    // backpack behind, on the trailing side
    const bs = -(Math.sign(d) || 1);
    back += rrect(nx + bs * 22 - (bs < 0 ? 52 : 0), ny + 26, 52, 84, { fill: CARD, stroke: SEC, sw: 4.5 });
    back += rpath([[nx + bs * 22, ny + 40], [nx + bs * 40, ny + 64]], { stroke: SEC, sw: 3.5 });
  }
  // torso
  g += rpath([[0, 0], [nx, ny]]);
  // arms
  if (o.pose === 'stand') {
    const a = o.wa * 0.5 * Math.sin(o.ph);
    const drop = 12 * sl;
    const armB = s => rpath([sh, [sh[0] + s * 24 + Math.sin(-a * s) * 30, sh[1] + 62 + drop], [sh[0] + s * 30 + Math.sin(-a * s) * 58, sh[1] + 122 + drop]]);
    const fs = Math.sign(d) || 1;
    g += armB(-fs);
    if (o.coffee && sl < 0.5) {
      const el = [sh[0] + fs * 34, sh[1] + 60], hd = [sh[0] + fs * 66, sh[1] + 40 + 4 * Math.sin(o.ph) * o.wa];
      g += rpath([sh, el, hd]);
      g += cup(hd[0] + fs * 4, hd[1] - 8, o.t);
    } else if (o.coffee) {
      const hd = [sh[0] + fs * 34, sh[1] + 128];
      g += rpath([sh, [sh[0] + fs * 26, sh[1] + 66], hd]) + cup(hd[0] + fs * 6, hd[1] - 6, o.t, 0.0);
    } else g += armB(fs);
  } else {
    const c = e.cross;
    const L = (rx, ry, cx, cy) => [sh[0] + lerp(rx, cx, c), sh[1] + lerp(ry, cy, c)];
    g += rpath([sh, L(-50, 62, -44, 46), L(-66, 112, 34, 36)]);
    g += rpath([sh, L(50, 62, 44, 50), L(66, 112, -32, 32)]);
  }
  // head
  g += rcirc(hx, hy, R, { fill: BG });
  // cap worn backwards (dome + brim pointing away from facing direction)
  const bs = -(Math.sign(d) || 1);
  const dome = []; for (let i = 0; i <= 14; i++) { const a2 = Math.PI * (1.08 + 0.84 * i / 14); dome.push([hx + Math.cos(a2) * (R + 3), hy + Math.sin(a2) * (R + 3)]); }
  g += rpath(dome.concat([[hx + (R - 6), hy - 20], [hx - (R - 6), hy - 20]]), { fill: OR, stroke: OR, sw: 4, close: true });
  const bl = 16 + 22 * Math.abs(d);
  g += rpath([[hx + bs * (R - 4), hy - 21], [hx + bs * (R + bl), hy - 16]], { stroke: OR, sw: 11 });
  g += `<circle cx="${f2(hx)}" cy="${f2(hy - R - 4)}" r="5" fill="${OR}"/>`;
  // face
  const fx = hx + d * 8, ey = hy + 8;
  for (const s of [-1, 1]) {
    const ex = fx + s * 15;
    const ry = lerp(5.5, 2.4, e.lid) * o.bl, rx = lerp(5.5, 8, e.lid);
    if (e.wide > 0.05) g += `<circle cx="${f2(ex)}" cy="${f2(ey)}" r="${f2(6 + 6 * e.wide)}" fill="${BG}" stroke="${TXT}" stroke-width="3" opacity="${f2(e.wide)}"/>`;
    g += `<ellipse cx="${f2(ex + e.lx)}" cy="${f2(ey + e.ly + (e.lid * 1.5))}" rx="${f2(lerp(rx, 4, e.wide))}" ry="${f2(lerp(ry, 4 * o.bl, e.wide))}" fill="${TXT}"/>`;
    const by = hy - 5 - e.brow * 0.8 - (s > 0 ? e.smirk * 6 : 0);
    const inner = e.worry * 7;
    g += rpath([[ex - s * 10, by - (s < 0 ? 0 : inner) + (s > 0 ? 0 : 0)], [ex + s * 10, by]].map((p, i) => i === 0 ? [p[0], by - inner] : p), { sw: 4, amp: 0.5 });
  }
  const mx = fx, my = hy + 25;
  if (e.mO > 0.05) g += `<ellipse cx="${f2(mx)}" cy="${f2(my + 2)}" rx="${f2(5 + 5 * e.mO)}" ry="${f2(4 + 9 * e.mO)}" fill="${BG}" stroke="${TXT}" stroke-width="4"/>`;
  else g += `<path d="M ${f2(mx - e.mW / 2)} ${f2(my)} Q ${f2(mx)} ${f2(my + e.mC * 12)} ${f2(mx + e.mW / 2)} ${f2(my - e.smirk * 9)}" fill="none" stroke="${TXT}" stroke-width="4.5" stroke-linecap="round"/>`;
  // sweat drop
  if (o.sweat > 0.01) {
    const sx = hx + R * 0.9 * (bs < 0 ? -1 : 1) * -1, sy = hy - 18 + o.sweatY;
    g += `<path d="M ${f2(sx)} ${f2(sy - 24)} Q ${f2(sx + 15)} ${f2(sy)} ${f2(sx)} ${f2(sy + 9)} Q ${f2(sx - 15)} ${f2(sy)} ${f2(sx)} ${f2(sy - 24)} Z" fill="${BLUE}" opacity="${f2(o.sweat)}"/>`;
  }
  return `<g transform="translate(${f2(o.x)} ${f2(o.y)}) scale(${f2(o.s || 1)})" opacity="${f2(o.op == null ? 1 : o.op)}">${back}${g}</g>`;
}
function cup(x, y, t, steam = 1) {
  let g = rpath([[x - 17, y - 22], [x + 17, y - 22], [x + 13, y + 22], [x - 13, y + 22]], { close: true, fill: BG, sw: 4 });
  g += rpath([[x - 20, y - 26], [x + 20, y - 26]], { sw: 5 });
  g += `<rect x="${f2(x - 15.5)}" y="${f2(y - 6)}" width="31" height="12" fill="${OR}"/>`;
  if (steam > 0) for (const s of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 8; k++) { const yy = y - 34 - k * 5; pts.push(`${f2(x + s * 6 + 4 * Math.sin(k * 0.9 + t * 5 + s))} ${f2(yy)}`); }
    g += `<path d="M ${pts.join(' L ')}" fill="none" stroke="${SEC}" stroke-width="3" stroke-linecap="round" opacity="${f2(0.55 * steam)}"/>`;
  }
  return g;
}

// ---------- speech bubbles ----------
const typed = (t, segs) => { let n = 0; for (const [t0, s] of segs) n += Math.round(clamp((t - t0) * 32, 0, s.length)); return n; };
function bubble(t, segs, t0, t1, cx, cy, tip, size = 48) {
  if (t < t0 || t > t1 + 0.25) return '';
  const p = rv(t, t0) * (1 - eo((t - t1) / (7 * FR)));
  if (p <= 0.001) return '';
  const full = segs.map(s => s[1]).join('');
  const n = typed(t, segs);
  const pad = size * 0.72, w = mw(full, size, 700) + pad * 2, h = size * 1.9;
  cx = clamp(cx, 100 + w / 2, 1820 - w / 2);
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const bx = clamp(tip[0], x0 + 50, x0 + w - 50);
  let g = `<rect x="${f2(x0)}" y="${f2(y0)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(h * 0.38)}" fill="${WHITE}"/>`;
  g += `<path d="M ${f2(bx - 22)} ${f2(y0 + h - 2)} L ${f2(tip[0])} ${f2(tip[1])} L ${f2(bx + 18)} ${f2(y0 + h - 2)} Z" fill="${WHITE}"/>`;
  g += `<text x="${f2(x0 + pad)}" y="${f2(cy + size * 0.36)}" font-family="Inter" font-size="${size}" font-weight="700" fill="${INK}">${esc(full.slice(0, n))}</text>`;
  return `<g filter="url(#shadow)">${pop(g, cx, cy, p)}</g>`;
}

// ---------- scene 1: corridor ----------
const DOOR = { x: 780, w: 240, y: 560 };
function corridor(t) {
  let g = '';
  g += rpath([[-40, FLOOR], [1960, FLOOR]], { stroke: DIM, sw: 5 });
  g += rpath([[-40, FLOOR - 22], [1960, FLOOR - 22]], { stroke: '#26262C', sw: 3 });
  // ceiling lights
  for (const lx of [300, 1420]) g += rpath([[lx - 90, 70], [lx + 90, 70]], { stroke: DIM, sw: 8 });
  // door frame + interior
  const op = eio((t - 1.0) / 0.5);
  const { x, w, y } = DOOR, h = FLOOR - y;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#08080A"/>`;
  if (op > 0) {
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${OR}" opacity="${f2(0.10 * op)}"/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g += `<rect x="${x + 26 + c * 50}" y="${y + 170 + r * 70}" width="34" height="26" rx="6" fill="#2A2A30" opacity="${f2(op)}"/>`;
  }
  const pw = w * Math.cos(op * 1.25);
  g += rrect(x, y, pw, h, { fill: CARD, stroke: TXT, sw: 5 });
  if (pw > 30) g += `<circle cx="${f2(x + pw - 26)}" cy="${y + h / 2 + 10}" r="8" fill="${TXT}"/>`;
  g += rpath([[x - 10, FLOOR], [x - 10, y - 10], [x + w + 10, y - 10], [x + w + 10, FLOOR]], { sw: 6 });
  // door plate
  g += card(x - 50, y - 92, w + 100, 64, { r: 12 });
  g += T(x + w / 2, y - 49, 'Lecture Theatre B', { size: 32, w: 700 });
  // timetable sign
  const li = rv(t, 4.1, 12 * FR);
  const sx = 1150, sy = 400, sw2 = 640, sh2 = 200;
  if (li > 0) g += `<rect x="${sx - 6}" y="${sy - 6}" width="${sw2 + 12}" height="${sh2 + 12}" rx="22" fill="${OR}" opacity="${f2(0.18 * li * (0.85 + 0.15 * Math.sin(t * 3)))}" filter="url(#glowS)"/>`;
  g += card(sx, sy, sw2, sh2, { stroke: li > 0 ? mixHex(BORDER, OR, li) : BORDER, sw: 2.5 });
  g += T(sx + 40, sy + 56, 'TIMETABLE · TODAY', { size: 28, w: 600, fill: SEC, anchor: 'start' });
  g += `<circle cx="${sx + sw2 - 48}" cy="${sy + 46}" r="11" fill="${li > 0 ? GREEN : DIM}" opacity="${f2(li > 0 ? 0.7 + 0.3 * Math.sin(t * 6) : 1)}"/>`;
  g += T(sx + 40, sy + 132, 'Thermofluids · Lecture 1', { size: 44, w: 800, anchor: 'start', fill: mixHex('#4A4A52', TXT, li) });
  g += `<rect x="${sx + 40}" y="${sy + 152}" width="${f2(520 * li)}" height="5" rx="2.5" fill="${OR}"/>`;
  return g;
}
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };

// ---------- scene 2: lecture theatre ----------
const SCR = { x: 120, y: 80, w: 760, h: 370 };
const DESK = 820;
const SEATS = [460, 720, 980, 1240, 1500];
const ME = 3;
const HIPY = DESK + 4, SS = 1.3;
function theatre(t, eqLayer) {
  let g = '';
  // screen
  const glow = clamp((t - 13.3) / 0.4) * (1 - clamp((t - 14.9) / 0.4));
  if (glow > 0) g += `<rect x="${SCR.x - 8}" y="${SCR.y - 8}" width="${SCR.w + 16}" height="${SCR.h + 16}" rx="20" fill="${RED}" opacity="${f2(0.16 * glow)}" filter="url(#glowS)"/>`;
  g += rpath([[SCR.x + SCR.w / 2, 40], [SCR.x + SCR.w / 2, SCR.y]], { stroke: DIM, sw: 4 });
  g += rrect(SCR.x, SCR.y, SCR.w, SCR.h, { fill: CARD, stroke: TXT, sw: 5 });
  g += T(SCR.x + 32, SCR.y + 50, 'Thermofluids · Lecture 1', { size: 28, w: 600, fill: SEC, anchor: 'start' });
  g += rpath([[SCR.x + 32, SCR.y + 70], [SCR.x + SCR.w - 32, SCR.y + 70]], { stroke: DIM, sw: 3 });
  g += eqLayer.inScreen;
  // floor + chair backs
  g += rpath([[-40, 990], [1960, 990]], { stroke: DIM, sw: 5 });
  for (const sx of SEATS) g += rrect(sx - 58, 690, 116, 140, { fill: '#121216', stroke: DIM, sw: 4 });
  return g;
}
function deskFront() {
  let g = `<rect x="300" y="${DESK}" width="1360" height="${990 - DESK}" fill="${BG}"/>`;
  g += rpath([[290, DESK], [1670, DESK]], { sw: 6 });
  g += rpath([[320, DESK], [320, 990]], { sw: 5 }) + rpath([[1640, DESK], [1640, 990]], { sw: 5 });
  g += rpath([[320, 900], [1640, 900]], { stroke: DIM, sw: 3 });
  return g;
}
// equations
const MF = "MathI, MathR, 'STIX Two Math', serif";
function equations(t) {
  const p1 = rv(t, 12.2, 9 * FR), p2 = rv(t, 12.75, 9 * FR), p3 = rv(t, 13.3, 9 * FR);
  if (p1 <= 0) return { inScreen: '', over: '' };
  const grow = eio((t - 13.3) / 1.4), back = eio((t - 14.9) / (10 * FR));
  const k = grow * (1 - back);
  const s = 1 + 0.75 * k;
  const c0 = [500, 290], c1 = [800, 280];
  const cx = lerp(c0[0], c1[0], k), cy = lerp(c0[1], c1[1], k);
  const shake = k > 0.05 && k < 0.999 ? 2.5 * Math.sin(t * 47) : (k >= 0.999 ? 1.5 * Math.sin(t * 40) : 0);
  const tx = (sz, y, inner, p) => `<text x="${c0[0]}" y="${y}" font-family="${MF}" font-size="${sz}" fill="${TXT}" text-anchor="middle" opacity="${f2(p)}">${inner}</text>`;
  let g = '';
  g += tx(84, 240, '∂T/∂t = α ∇²T', p1);
  g += tx(44, 318, 'ρc<tspan baseline-shift="sub" font-size="30">p</tspan>(∂T/∂t + u·∇T) = k∇²T', p2);
  g += tx(44, 388, '∂²T/∂x² + ∂²T/∂y² = 0', p3);
  const grp = `<g transform="translate(${f2(cx + shake)} ${f2(cy)}) scale(${f2(s)}) translate(${-c0[0]} ${-c0[1]})">${g}</g>`;
  // floating extra symbols escaping the screen
  let fl = '';
  const syms = [['∫', 1060, 160, OR, 96], ['∇', 1250, 300, BLUE, 80], ['∂', 980, 520, OR, 84], ['Σ', 1420, 150, BLUE, 76], ['∮', 1150, 430, RED, 80]];
  syms.forEach(([ch, x, y, col, sz], i) => {
    const q = rv(t, 13.5 + i * 0.18, 10 * FR) * (1 - eo((t - 14.9) / (8 * FR)));
    if (q > 0.01) fl += `<text x="${x}" y="${f2(y + 8 * Math.sin(t * 2.2 + i))}" font-family="${MF}" font-size="${sz}" fill="${col}" text-anchor="middle" opacity="${f2(q)}" transform="rotate(${f2(8 * Math.sin(t * 1.3 + i * 2))} ${x} ${y})">${ch}</text>`;
  });
  return k > 0.02 ? { inScreen: '', over: grp + fl } : { inScreen: grp, over: fl };
}
function target(x, y, p, hot, t) {
  if (p <= 0.001) return '';
  const col = hot > 0 ? mixHex(TXT, OR, hot) : TXT;
  let g = '';
  if (hot > 0) g += `<circle cx="${x}" cy="${y}" r="62" fill="${OR}" opacity="${f2(0.22 * hot * (0.8 + 0.2 * Math.sin(t * 7)))}" filter="url(#glowS)"/>`;
  g += `<circle cx="${x}" cy="${y}" r="34" fill="${BG}" stroke="${col}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${col}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="7" fill="${col}"/>`;
  g += `<circle cx="${x}" cy="${y - 44}" r="7" fill="${RED}"/><line x1="${x}" y1="${y - 38}" x2="${x}" y2="${y - 30}" stroke="${SEC}" stroke-width="3"/>`;
  g += T(x + 52, y + 16, '40%', { size: 46, w: 800, anchor: 'start', fill: col });
  return pop(g, x, y, p);
}

// ---------- main ----------
const CUT = 11.3; // static crossfade corridor -> theatre (no camera move)
function scene(t) {
  BOIL = Math.floor(t * 8); SEED = 0;
  const e = expr(t);
  let out = '';
  // ---- scene 1 ----
  const a1 = 1 - eio((t - CUT) / (8 * FR));
  if (a1 > 0.001) {
    let g = corridor(t);
    let x, wa, dir, ph, op = 1;
    if (t < 10.8) {
      const u = eo(clamp(t / 1.8) * 1.0);
      x = lerp(-140, 560, clamp(t / 1.8) < 1 ? 1 - Math.pow(1 - clamp(t / 1.8), 1.6) : 1);
      wa = 1 - eio((t - 1.35) / 0.45); dir = lerp(1, 0.45, eio((t - 1.6) / 0.4)); ph = x / 34;
      void u;
    } else {
      const q = clamp((t - 10.8) / 0.5);
      x = lerp(560, 900, q); wa = 1; dir = 1; ph = x / 34; op = 1 - eio((t - 11.05) / 0.25);
    }
    const breathe = 2 * Math.sin(t * 2.1);
    const hipY = FLOOR - 150 - (wa * 6 * Math.abs(Math.sin(ph))) + breathe * (1 - wa) * 0.5;
    g += student({ x, y: hipY, dir, pose: 'stand', ph, wa, e, coffee: true, op, bl: blink(t), sweat: 0, t });
    const tip = [x + 10, hipY - 270];
    g += bubble(t, [[2.2, 'Oh, '], [3.0, "we're studying "], [4.1, 'thermofluids']], 2.2, 6.5, 640, 330, tip);
    g += bubble(t, [[7.7, 'I heard '], [8.9, "it's hard…"]], 7.7, 9.85, 640, 330, tip);
    g += bubble(t, [[10.0, 'Damn.']], 10.0, 10.75, 560, 340, [tip[0], tip[1] + 14]);
    out += `<g opacity="${f2(a1)}">${g}</g>`;
  }
  // ---- scene 2 ----
  const a2 = eio((t - CUT) / (8 * FR));
  if (a2 > 0.001) {
    const eq = equations(t);
    let g = theatre(t, eq);
    // clones appear at 20.2+ ; main student drops into seat at 11.75
    const studs = [];
    SEATS.forEach((sx, i) => {
      if (i === ME) {
        const drop = eio((t - 11.55) / (9 * FR));
        if (drop <= 0) return;
        studs.push({ i, sx, p: drop, y: HIPY - 70 * (1 - drop) });
      } else {
        const order = [2, 4, 1, 0, 0, 3][i] ?? 0; // pop order
        const st = 20.2 + [0.6, 0.3, 0.0, 0, 0.45][i] * 1 + (i === 4 ? 0.15 : 0);
        const p = rv(t, st, 10 * FR); void order;
        if (p <= 0) return;
        studs.push({ i, sx, p, y: HIPY - 40 * (1 - p), clone: true });
      }
    });
    let figs = '';
    for (const s of studs) {
      const ce = s.clone ? { ...expr(Math.max(t, 18.6)) } : { ...e };
      const bob = 2.2 * Math.sin(t * 2.0 + s.i * 1.7);
      const sweat = !s.clone ? clamp((t - 13.6) / 0.15) * (1 - clamp((t - 14.85) / 0.2)) : 0;
      figs += student({ x: s.sx, y: s.y + bob, s: SS, dir: -0.4, pose: 'sit', ph: 0, wa: 0, e: ce, op: s.p, bl: blink(t, s.i * 0.7), sweat, sweatY: 40 * clamp((t - 13.6) / 1.2), t });
    }
    g += figs;
    g += deskFront();
    // coffee on desk next to main student
    g += cup(SEATS[ME] + 96, DESK - 26, t, 1) ;
    g += eq.over;
    const me = SEATS[ME];
    const headTop = HIPY - 236 * SS + 8;
    g += bubble(t, [[14.9, 'Nah, '], [15.6, 'this is peak still. '], [17.4, 'Rah.']], 14.9, 18.05, me + 40, 330, [me - 10, headTop - 6]);
    g += bubble(t, [[18.2, 'I just need to pass '], [19.5, 'this module']], 18.2, 20.1, me + 40, 330, [me - 10, headTop - 6]);
    // target 40%
    const tp = rv(t, 18.9, 12 * FR);
    const rise = eio((t - 26.0) / 0.5);
    const ty = lerp(440, 300, rise) + 6 * Math.sin(t * 1.8);
    g += target(me - 220, ty, tp, eio((t - 27.1) / (8 * FR)), t);
    // all clones: "just pass"
    for (const s of studs) g += bubble(t, [[26.3, 'just pass']], 26.3, 99, s.sx + 10, 495, [s.sx - 8, 572], 40);
    out += `<g opacity="${f2(a2)}">${g}</g>`;
  }
  return out;
}
