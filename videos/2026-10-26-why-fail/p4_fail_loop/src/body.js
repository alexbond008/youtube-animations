// p4_fail_loop: fail -> learn -> pass (green) vs mistake -> don't learn -> repeat -> fail again spiral (red).
window.cam = t => ({ s: 1, x: 0, y: 0 }); // static camera (micro drift/push-in removed)
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };
const NS = 40, NH = 84;
const nodeW = (label, tickW = 0) => mw(label, NS, 800) + 72 + tickW;
function node(cx, cy, label, col, p, o = {}) {
  if (p <= 0.001) return '';
  const tw = o.tick ? 54 : 0, w = nodeW(label, tw), h = NH;
  let g = `<rect x="${f2(cx - w / 2)}" y="${f2(cy - h / 2)}" width="${f2(w)}" height="${h}" rx="18" fill="${col}" fill-opacity="${f2(o.fillOp == null ? 0.14 : o.fillOp)}" stroke="${col}" stroke-width="3"/>`;
  if (o.glow) g = `<rect x="${f2(cx - w / 2 - 6)}" y="${f2(cy - h / 2 - 6)}" width="${f2(w + 12)}" height="${h + 12}" rx="22" fill="none" stroke="${col}" stroke-width="10" opacity="${f2(o.glow * 0.35)}" filter="url(#glowS)"/>` + g;
  let tx = cx - w / 2 + 36;
  if (o.tick) { // drawn tick
    const r = 18, tp = clamp(o.tickP == null ? 1 : o.tickP);
    g += `<g transform="translate(${f2(tx + r)} ${cy})"><path d="M ${-r * .7} 0 L ${-r * .2} ${r * .5} L ${r * .75} ${-r * .55}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="${f2(60 * (1 - tp))}"/></g>`;
    tx += tw;
  }
  g += T(tx, cy + NS * 0.36, label, { anchor: 'start', size: NS, w: 800, fill: o.txt || col });
  const s = (0.92 + 0.08 * p) * (o.scale || 1);
  return `<g opacity="${f2(p)}" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(s)}) translate(${f2(-cx)} ${f2(-cy)})">${g}</g>`;
}
function arrow(x1, y1, x2, y2, col, p, o = {}) { // straight arrow drawn with progress
  if (p <= 0.001) return '';
  const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  let g = `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(ex)}" y2="${f2(ey)}" stroke="${col}" stroke-width="${o.w || 5}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  g += `<g transform="translate(${f2(ex)} ${f2(ey)}) rotate(${f2(a)})"><path d="M -14 -11 L 4 0 L -14 11" fill="none" stroke="${col}" stroke-width="${o.w || 5}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return g;
}
const cub = (P, u) => { const m = 1 - u; return [0, 1].map(k => m * m * m * P[0][k] + 3 * m * m * u * P[1][k] + 3 * m * u * u * P[2][k] + u * u * u * P[3][k]); };
function curveArrow(P, col, p, o = {}) {
  if (p <= 0.001) return '';
  const n = 40, pts = [];
  for (let i = 0; i <= n; i++) pts.push(cub(P, p * i / n));
  const e = pts[n], b = cub(P, Math.max(0, p - 0.02)), a = Math.atan2(e[1] - b[1], e[0] - b[0]) * 180 / Math.PI;
  let g = `<path d="M ${pts.map(q => f2(q[0]) + ' ' + f2(q[1])).join(' L ')}" fill="none" stroke="${col}" stroke-width="${o.w || 5}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  g += `<g transform="translate(${f2(e[0])} ${f2(e[1])}) rotate(${f2(a)})"><path d="M -14 -11 L 4 0 L -14 11" fill="none" stroke="${col}" stroke-width="${o.w || 5}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return g;
}
// layout
const TOPY = 280, BOTY = 640;
const TOP = { fail: 300, learn: 720, pass: 1120 };
const BOT = { mis: 230, dl: 560, rep: 880, fa: 1180 };
const SPC = { x: 1180, y: 880 }; // spiral centre
const GC = { x: 1620, y: 880 };  // gauge centre
function title(t) {
  const p = rv(t, 0.0, 12 * FR), out = eo((t - 8.2) / (8 * FR));
  if (p <= 0 || out >= 1) return '';
  let g = T(960, 500, 'Failure itself isn’t the issue', { size: 84, w: 800 });
  const sp = rv(t, 4.6);
  if (sp > 0) g += pop(T(960, 580, 'Sometimes it’s just a lack of knowledge', { size: 42, w: 600, fill: SEC }), 960, 565, sp);
  return `<g opacity="${f2(p * (1 - out))}" transform="translate(0 ${f2(-30 * out)})">${pop(g, 960, 520, p)}</g>`;
}
function topPath(t) {
  const dim = 1 - 0.65 * eio((t - 16.9) / 0.6);
  const emph = eio((t - 39.8) / 0.8);
  const op = Math.min(1, dim + (1 - dim) * emph);
  let g = '';
  const lp = rv(t, 8.8);
  if (lp > 0) g += T(160, TOPY - 86, 'When you learn from it', { anchor: 'start', size: 32, w: 700, fill: GREEN, op: lp });
  const wF = nodeW('Fail'), wL = nodeW('Learn'), wP = nodeW('Pass', 54);
  // glow under the green path at the end
  if (emph > 0) {
    const pul = 0.6 + 0.4 * Math.sin((t - 39.8) * 2.4);
    g += `<line x1="${TOP.fail}" y1="${TOPY}" x2="${TOP.pass}" y2="${TOPY}" stroke="${GREEN}" stroke-width="26" stroke-linecap="round" opacity="${f2(0.10 * emph * pul)}" filter="url(#glowS)"/>`;
  }
  g += arrow(TOP.fail + wF / 2 + 14, TOPY, TOP.learn - wL / 2 - 16, TOPY, GREEN, eo((t - 9.3) / 0.45));
  g += arrow(TOP.learn + wL / 2 + 14, TOPY, TOP.pass - wP / 2 - 16, TOPY, GREEN, eo((t - 12.9) / 0.5));
  g += node(TOP.fail, TOPY, 'Fail', RED, rv(t, 8.8));
  // Learn: pulses at 34.1
  const lt = t - 34.1, lpulse = lt > 0 ? 1 + 0.07 * Math.exp(-lt * 0.9) * Math.abs(Math.sin(lt * 4.5)) : 1;
  const lglow = lt > 0 ? clamp(lt / 0.3) * (0.6 + 0.4 * Math.sin(lt * 3)) : 0;
  const learnBoost = lt > 0 ? eio(lt / 0.5) : 0;
  let learn = node(TOP.learn, TOPY, 'Learn', GREEN, rv(t, 9.8), { scale: lpulse, glow: lglow });
  g = `<g opacity="${f2(op)}">${g}${node(TOP.pass, TOPY, 'Pass', GREEN, rv(t, 13.5), { tick: true, tickP: eo((t - 13.65) / 0.4) })}`;
  // keep going
  const kp = eio((t - 14.8) / 0.8);
  const kbob = kp >= 1 ? 4 * Math.sin((t - 15.6) * 1.8) : 0;
  const KP = [[TOP.pass + wP / 2 + 16, TOPY], [TOP.pass + wP / 2 + 220, TOPY], [1500, 150 + kbob], [1680, 120 + kbob]];
  g += curveArrow(KP, GREEN, kp, { w: 6 });
  const kl = rv(t, 15.0);
  if (kl > 0) g += T(1570, 300, 'Keep going', { size: 40, w: 800, fill: GREEN, op: kl });
  g += '</g>';
  // Learn node keeps itself bright when the exit is offered
  const learnOp = Math.min(1, op + (1 - op) * learnBoost);
  return g + `<g opacity="${f2(learnOp)}">${learn}</g>`;
}
// spiral: Archimedean, squashed vertically, rotates slowly, tightens over time
function spiralPts(t, u1 = 1) {
  const tight = 2.2 + 0.9 * eio((t - 24.0) / 12);
  const R0 = 150, sy = 0.72, rot = (t - 22.8) * 0.35;
  const pts = [], n = 220;
  for (let i = 0; i <= n * u1; i++) {
    const u = i / n, th = -Math.PI / 2 + u * tight * 2 * Math.PI + rot * u;
    const r = R0 * (1 - u * 0.9);
    pts.push([SPC.x + r * Math.cos(th), SPC.y + r * sy * Math.sin(th), u]);
  }
  return pts;
}
function bottomPath(t) {
  let g = '';
  const lp = rv(t, 16.9);
  if (lp > 0) g += T(160, BOTY - 86, 'When you don’t', { anchor: 'start', size: 32, w: 700, fill: RED, op: lp });
  const w = { mis: nodeW('Mistake'), dl: nodeW('Don’t learn'), rep: nodeW('Repeat'), fa: nodeW('Fail again') };
  g += arrow(BOT.mis + w.mis / 2 + 12, BOTY, BOT.dl - w.dl / 2 - 14, BOTY, RED, eo((t - 20.6) / 0.4));
  g += arrow(BOT.dl + w.dl / 2 + 12, BOTY, BOT.rep - w.rep / 2 - 14, BOTY, RED, eo((t - 21.6) / 0.35));
  g += arrow(BOT.rep + w.rep / 2 + 12, BOTY, BOT.fa - w.fa / 2 - 14, BOTY, RED, eo((t - 22.4) / 0.3));
  // spiral
  const sp = eio((t - 23.1) / 1.4);
  if (sp > 0) {
    const drop = eio((t - 37.9) / 1.2);
    const pts = spiralPts(t, sp);
    // warning glow
    const wg = eo((t - 24.7) / 0.6);
    if (wg > 0) {
      const pul = 0.75 + 0.25 * Math.sin((t - 24.7) * 3.2);
      g += `<ellipse cx="${SPC.x}" cy="${SPC.y}" rx="${f2(200 + 10 * pul)}" ry="${f2(150 + 8 * pul)}" fill="url(#warnG)" opacity="${f2(wg * pul * (1 - 0.6 * drop))}"/>`;
    }
    // entry from Fail again
    const e0 = pts[0];
    g += `<path d="M ${BOT.fa} ${BOTY + NH / 2} Q ${BOT.fa} ${f2(e0[1] - 20)} ${f2(e0[0])} ${f2(e0[1])}" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round" opacity="${f2(clamp(sp * 4))}"/>`;
    // spiral body, inner part greys and fades for "drop out"
    const seg = 6;
    for (let i = 0; i + seg < pts.length; i += seg) {
      const a = pts.slice(i, i + seg + 1), u = a[0][2];
      const inner = sm((u - 0.45) / 0.4);
      const col = mixHex(RED, '#6A6A74', drop * (0.4 + 0.6 * inner));
      const op = 1 - drop * inner * 0.9;
      g += `<path d="M ${a.map(q => f2(q[0]) + ' ' + f2(q[1])).join(' L ')}" fill="none" stroke="${col}" stroke-width="${f2(5 - 2 * u)}" stroke-linecap="round" opacity="${f2(op)}"/>`;
    }
    // marching dot travelling inward
    if (sp >= 1) {
      const k = Math.floor(((t * 0.22) % 1) * (pts.length - 1)), q = pts[k];
      g += `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(8 - 4 * q[2])}" fill="${mixHex(RED, '#6A6A74', drop)}" opacity="${f2(sm(q[2] / 0.05) * (1 - drop * q[2]))}"/>`;
    }
    // warning triangle
    if (wg > 0) {
      const tx = SPC.x - 250, ty = SPC.y - 60, s = 1 + 0.06 * Math.sin((t - 24.7) * 3.2);
      g += `<g opacity="${f2(wg * (1 - 0.5 * drop))}" transform="translate(${tx} ${ty}) scale(${f2(s * (0.92 + 0.08 * wg))})"><path d="M 0 -34 L 34 26 L -34 26 Z" fill="${RED}" fill-opacity=".16" stroke="${RED}" stroke-width="4" stroke-linejoin="round"/><line x1="0" y1="-12" x2="0" y2="6" stroke="${RED}" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="16" r="3.2" fill="${RED}"/></g>`;
    }
    if (drop > 0) {
      let d = `<rect x="${SPC.x - 110}" y="${SPC.y - 34}" width="220" height="68" rx="34" fill="${BG}" fill-opacity=".85" stroke="#6A6A74" stroke-width="2.5"/>`;
      d += T(SPC.x, SPC.y + 13, 'Drop out', { size: 36, w: 800, fill: '#9A9AA4' });
      g += pop(d, SPC.x, SPC.y, drop);
    }
  }
  g += node(BOT.mis, BOTY, 'Mistake', RED, rv(t, 19.3));
  g += node(BOT.dl, BOTY, 'Don’t learn', RED, rv(t, 21.1));
  g += node(BOT.rep, BOTY, 'Repeat', RED, rv(t, 22.1));
  g += node(BOT.fa, BOTY, 'Fail again', RED, rv(t, 22.8));
  return g;
}
function gauge(t) {
  const p = rv(t, 28.5, 12 * FR);
  if (p <= 0) return '';
  const { x, y } = GC, R = 130;
  let g = '';
  const arc = (a0, a1, col, w) => { const P = a => [x + R * Math.cos(a), y - R * Math.sin(a)]; const [x0, y0] = P(a0), [x1, y1] = P(a1); return `<path d="M ${f2(x0)} ${f2(y0)} A ${R} ${R} 0 0 1 ${f2(x1)} ${f2(y1)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="butt"/>`; };
  g += arc(Math.PI, Math.PI / 2 + 0.02, RED, 16).replace('stroke-linecap', 'opacity=".55" stroke-linecap');
  g += arc(Math.PI / 2 - 0.02, 0, GREEN, 16).replace('stroke-linecap', 'opacity=".55" stroke-linecap');
  for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8, c = Math.cos(a), s = Math.sin(a); g += `<line x1="${f2(x + (R - 30) * c)}" y1="${f2(y - (R - 30) * s)}" x2="${f2(x + (R - 18) * c)}" y2="${f2(y - (R - 18) * s)}" stroke="#5A5A64" stroke-width="3"/>`; }
  g += T(x - R - 34, y + 12, '−', { size: 44, w: 800, fill: RED });
  g += T(x + R + 34, y + 12, '+', { size: 44, w: 800, fill: GREEN });
  g += T(x, y - R - 22, '0', { size: 30, w: 700, fill: SEC, mono: true });
  // needle: +40deg (positive) -> -62deg (negative)
  const sw = eio((t - 29.0) / 1.6);
  const settle = sw >= 1 ? 2.5 * Math.sin((t - 30.6) * 2.1) * Math.exp(-(t - 30.6) * 0.3) + 1.2 * Math.sin(t * 1.3) : 0;
  const ang = (lerp(40, -62, sw) + settle) * Math.PI / 180; // 0 = straight up, + = right
  const nx = x + (R - 34) * Math.sin(ang), ny = y - (R - 34) * Math.cos(ang);
  const nc = mixHex(TXT, RED, sw);
  g += `<line x1="${x}" y1="${y}" x2="${f2(nx)}" y2="${f2(ny)}" stroke="${nc}" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="12" fill="${nc}"/>`;
  const nl = eo((t - 30.8) / 0.4);
  g += T(x, y + 70, 'Velocity', { size: 32, w: 700, fill: SEC, op: 1 - nl });
  if (nl > 0) g += pop(T(x, y + 70, 'Negative velocity', { size: 36, w: 800, fill: RED }), x, y + 52, nl);
  return pop(g, x, y - 40, p);
}
function exitArrow(t) {
  const p = eio((t - 34.4) / 1.0);
  if (p <= 0) return '';
  const P = [[SPC.x + 160, SPC.y - 60], [1500, 440], [880, 470], [TOP.learn + 20, TOPY + NH / 2 + 16]];
  const pul = p >= 1 ? 0.75 + 0.25 * Math.sin((t - 35.4) * 2.5) : 1;
  let g = `<g opacity="${f2(pul)}">${curveArrow(P, GREEN, p, { w: 6, dash: '14 10' })}</g>`;
  const lp = rv(t, 35.0);
  if (lp > 0) { const m = cub(P, 0.55); g += pop(T(m[0] + 20, m[1] - 48, 'Learn from it', { size: 34, w: 800, fill: GREEN }), m[0], m[1] - 40, lp); }
  return g;
}
function scene(t) {
  return `<defs><radialGradient id="warnG"><stop offset="0" stop-color="${RED}" stop-opacity=".28"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient></defs>` + title(t) + topPath(t) + bottomPath(t) + gauge(t) + exitArrow(t);
}
