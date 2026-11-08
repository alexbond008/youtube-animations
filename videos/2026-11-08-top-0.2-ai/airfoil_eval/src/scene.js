// airfoil_eval — cambered Joukowski section (NACA 2412-like, 12% thick, 2% camber) in exact potential flow,
// Cp distribution, then an eval checklist ticks against it.
// complex helpers
const C = (re, im = 0) => ({ re, im });
const add = (a, b) => C(a.re + b.re, a.im + b.im), sub = (a, b) => C(a.re - b.re, a.im - b.im);
const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const cabs = a => Math.hypot(a.re, a.im), conj = a => C(a.re, -a.im), cexp = th => C(Math.cos(th), Math.sin(th));
const csqrt = a => { const r = cabs(a), th = Math.atan2(a.im, a.re) / 2; return C(Math.sqrt(r) * Math.cos(th), Math.sqrt(r) * Math.sin(th)); };
const EPS = 0.095, DEL = 0.04, ALPHA = 5 * Math.PI / 180;
const MU = C(-EPS, DEL), R = cabs(sub(C(1), MU));
const eA = cexp(-ALPHA), eAp = cexp(ALPHA), ONE = C(1);
// dW/dzeta without circulation term, then solve Kutta: dW/dzeta(1) = 0
const dW0 = zt => { const d = sub(zt, MU); return sub(eA, div(mul(C(R * R), eAp), mul(d, d))); };
const GAM = (() => { const d = sub(ONE, MU); const v = dW0(ONE); // v + i*G/(2π d) = 0 -> G = -v * 2π d / i = v*2π d * i
  return mul(mul(v, C(2 * Math.PI)), mul(d, C(0, 1))).re; })();
const dWdzeta = zt => add(dW0(zt), div(C(0, GAM / (2 * Math.PI)), sub(zt, MU)));
const dzdzeta = zt => sub(ONE, div(ONE, mul(zt, zt)));
const toZ = zt => add(zt, div(ONE, zt));
const vel = zt => conj(div(dWdzeta(zt), dzdzeta(zt))); // complex velocity u + iv in z plane
function fromZ(z) { const s = csqrt(sub(mul(z, z), C(4))); let a = div(add(z, s), C(2)), b = div(sub(z, s), C(2)); return cabs(sub(a, MU)) > cabs(sub(b, MU)) ? a : b; }
// display: rotate by -alpha so freestream is horizontal; airfoil appears pitched nose-up
const FX = 96, FY = 160, FW = 1040, FH = 790;
const SC = 172, OX = FX + FW / 2 + 6, OY = FY + FH / 2 + 10;
const rot = mul; // alias
const toDisp = z => { const d = mul(z, eA); return [OX + d.re * SC, OY - d.im * SC]; };
const fromDisp = (x, y) => mul(C((x - OX) / SC, -(y - OY) / SC), eAp);
// airfoil outline
const FOIL = []; const beta = Math.atan2(DEL, 1 + EPS);
for (let k = 0; k <= 360; k++) { const th = -beta + 2 * Math.PI * k / 360; FOIL.push(toZ(add(MU, mul(C(R), cexp(th))))); }
const foilPath = 'M ' + FOIL.map(z => toDisp(z).map(f2).join(' ')).join(' L ') + ' Z';
const xs = FOIL.map(z => z.re), XLE = Math.min(...xs), XTE = Math.max(...xs);
// Cp on the surface (upper: k 1..~180 , lower: rest)
const iLE = xs.indexOf(XLE);
const CP_U = [], CP_L = [];
for (let k = 3; k < 357; k++) {
  const th = -beta + 2 * Math.PI * k / 360, zt = add(MU, mul(C(R), cexp(th)));
  const v = cabs(vel(zt)), cp = 1 - v * v, xc = (toZ(zt).re - XLE) / (XTE - XLE);
  (k <= iLE ? CP_U : CP_L).push([xc, -cp]);
}
CP_U.sort((a, b) => a[0] - b[0]); CP_L.sort((a, b) => a[0] - b[0]);
const CPMAX = Math.max(...CP_U.map(p => p[1]));
const peak = CP_U.reduce((a, b) => (b[1] > a[1] ? b : a));
// streamlines: seeds upstream in display coords, integrate in zeta with physical time
const STREAMS = [];
(function build() {
  const seedsY = []; for (let y = -2.45; y <= 2.46; y += 0.175) seedsY.push(y);
  for (const sy of seedsY) {
    let zt = fromZ(fromDisp(OX - 4.6 * SC, OY - sy * SC)); const pts = []; const dt = 0.004;
    for (let n = 0; n < 20000; n++) {
      const z = toZ(zt), [px, py] = toDisp(z); const v = vel(zt);
      if (n % 3 === 0) pts.push([px, py, cabs(v)]);
      if (px > FX + FW + 120) break;
      // RK2 in zeta: dzeta/dt = (u+iv)/(dz/dzeta)
      const f = q => div(vel(q), dzdzeta(q));
      const k1 = f(zt), mid = add(zt, mul(k1, C(dt / 2))), k2 = f(mid);
      zt = add(zt, mul(k2, C(dt)));
      if (cabs(sub(zt, MU)) < R * 1.0005) { zt = add(MU, mul(C(R * 1.0005), div(sub(zt, MU), C(cabs(sub(zt, MU)))))); }
    }
    STREAMS.push({ sy, pts }); // pts sampled every 3*dt = 0.012 time units
  }
})();
const spdCol = s => s < 1 ? mix(BLUE, '#C9C9D1', clamp((s - 0.55) / 0.45)) : mix('#C9C9D1', OR, clamp((s - 1) / 0.45));
// Cp plot geometry
const PX = 1176, PY = 160, PW = 648, PH = 410;
const pl = PX + 92, pr = PX + PW - 36, pt = PY + 116, pb = PY + PH - 72;
const ymin = -1, ymax = Math.ceil(CPMAX * 2) / 2;
const cpx = x => pl + (pr - pl) * x, cpy = y => pb - (pb - pt) * (y - ymin) / (ymax - ymin);
const EX = 1176, EY = 600, EW = 648, EH = 350;
const CHECKS = [{ t: 5.5, ok: true, s: 'lift slope ≈ 2π /rad' }, { t: 6.5, ok: true, s: 'Cp suction peak near leading edge' }, { t: 7.5, ok: false, s: 'separation at 15° → flag' }];
function scene(t) {
  let g = '';
  const hp = rv(t, 0);
  const ex = pill(110, 100, 'EXAMPLE', { size: 20, bg: 'rgba(245,184,0,.14)', stroke: AMBER, fill: AMBER, w: 800 });
  g += pop(hp, 300, 100, ex.svg + T(110 + ex.w + 18, 113, 'An eval only an engineer could write', { size: 36, w: 800 }));
  // ---- flow card
  const fp = rv(t, 0.1);
  let f = card(FX, FY, FW, FH);
  f += `<clipPath id="fc"><rect x="${FX + 1}" y="${FY + 1}" width="${FW - 2}" height="${FH - 2}" rx="15"/></clipPath>`;
  const reveal = eio((t - 0.3) / 1.6); // streamlines draw left->right
  f += `<clipPath id="rv"><rect x="${FX}" y="${FY}" width="${f2(FW * reveal)}" height="${FH}"/></clipPath>`;
  let sl = '';
  for (const s of STREAMS) { sl += `<polyline points="${s.pts.map(p => f2(p[0]) + ',' + f2(p[1])).join(' ')}" fill="none" stroke="#33333D" stroke-width="2"/>`; }
  f += `<g clip-path="url(#fc)"><g clip-path="url(#rv)">${sl}</g>`;
  // particles: comet streaks moving at local speed
  const pp = clamp((t - 1.2) / 0.8);
  if (pp > 0) {
    let ps = '';
    STREAMS.forEach((s, si) => {
      const n = s.pts.length, gap = 60, speed = 2.1; // samples per frame-time unit
      const base = (t * speed * 30 + si * 23) % gap;
      for (let k = base; k < n; k += gap) {
        const i = Math.floor(k), j = Math.max(0, i - 7);
        const a = s.pts[j], b = s.pts[i];
        ps += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="${spdCol(b[2])}" stroke-width="3.2" stroke-linecap="round" opacity="${f2(.95 * pp)}"/>`;
      }
    });
    f += ps;
  }
  f += `<linearGradient id="fadeT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CARD}" stop-opacity="1"/><stop offset=".6" stop-color="${CARD}" stop-opacity=".85"/><stop offset="1" stop-color="${CARD}" stop-opacity="0"/></linearGradient>`;
  f += `<rect x="${FX}" y="${FY}" width="${FW}" height="110" fill="url(#fadeT)"/><rect x="${FX}" y="${FY + FH - 110}" width="${FW}" height="110" fill="url(#fadeT)" transform="rotate(180 ${FX + FW / 2} ${FY + FH - 55})"/>`;
  f += `</g>`;
  // airfoil body
  const ap = rv(t, 0.25);
  f += `<g opacity="${f2(ap)}"><path d="${foilPath}" fill="#24242B" stroke="${TXT}" stroke-width="3" stroke-linejoin="round"/></g>`;
  // separation flag region (check 3)
  const sp = rv(t, CHECKS[2].t + 0.1, 0.4);
  if (sp > 0) {
    // hug aft upper surface: points from x/c 0.6..1 on upper surface, offset outward
    const up = FOIL.slice(0, iLE + 1).filter(z => (z.re - XLE) / (XTE - XLE) > 0.55);
    const sel = up.filter(z => (z.re - XLE) / (XTE - XLE) > 0.5);
    const inner = sel.map(z => toDisp(z));
    const outer = sel.map(z => { const [x, y] = toDisp(z); const u = ((z.re - XLE) / (XTE - XLE) - 0.5) / 0.5; return [x + 6, y - 8 - 62 * Math.sin(Math.PI * Math.pow(u, 0.75) * 0.62)]; });
    const te = inner[0];
    const d = 'M ' + inner.map(p => p.map(f2).join(' ')).join(' L ') + ' L ' + outer.slice().reverse().map(p => p.map(f2).join(' ')).join(' L ') + ` Q ${f2(te[0] + 40)} ${f2(te[1] - 30)} ${f2(te[0])} ${f2(te[1])} Z`;
    f += `<g opacity="${f2(sp)}"><path d="${d}" fill="${RED}" fill-opacity=".16" stroke="${RED}" stroke-width="2.5" stroke-dasharray="6 6" stroke-linejoin="round"/>`;
    const top = outer.reduce((a, b) => (b[1] < a[1] ? b : a));
    const lx = top[0], ly = top[1] + 90;
    const lw = mw('at α = 15°: flow separates', '700 24px Inter') + 28; f += `<rect x="${f2(lx + 40 - lw / 2)}" y="${f2(ly - 150)}" width="${f2(lw)}" height="42" rx="10" fill="${CARD}" stroke="${RED}" stroke-opacity=".5"/>` + T(lx + 40, ly - 121, 'at α = 15°: flow separates', { size: 24, w: 700, fill: RED, anchor: 'middle' }) + `</g>`;
  }
  f += T(FX + 36, FY + 56, 'Flow around the section', { size: 30, w: 700 }) + T(FX + FW - 36, FY + 56, 'α = 5°', { size: 28, w: 700, fill: SEC, anchor: 'end' });
  // legend + label
  const lab = pill(FX + 36, FY + FH - 50, 'NACA 2412 (example)', { size: 22, bg: '#22222A', fill: TXT });
  f += lab.svg;
  const lg = FX + FW - 36; f += `<g opacity="${f2(pp)}">${T(lg, FY + FH - 42, 'faster', { size: 20, w: 700, fill: OR, anchor: 'end' })}<rect x="${lg - 196}" y="${FY + FH - 58}" width="110" height="8" rx="4" fill="url(#spd)"/>${T(lg - 208, FY + FH - 42, 'slower', { size: 20, w: 700, fill: BLUE, anchor: 'end' })}</g>`;
  f += `<linearGradient id="spd"><stop offset="0" stop-color="${BLUE}"/><stop offset=".5" stop-color="#C9C9D1"/><stop offset="1" stop-color="${OR}"/></linearGradient>`;
  g += pop(fp, FX + FW / 2, FY + FH / 2, f);
  // ---- Cp plot card
  const cp = rv(t, 3.0);
  if (cp > 0) {
    let c = card(PX, PY, PW, PH) + T(PX + 32, PY + 52, 'Pressure coefficient', { size: 28, w: 700 });
    c += T(PX + PW - 32, PY + 52, 'lower', { size: 20, w: 700, fill: BLUE, anchor: 'end' }) + T(PX + PW - 106, PY + 52, 'upper', { size: 20, w: 700, fill: OR, anchor: 'end' });
    for (let v = ymin; v <= Math.floor(ymax); v++) c += `<line x1="${pl}" x2="${pr}" y1="${f2(cpy(v))}" y2="${f2(cpy(v))}" stroke="${v === 0 ? '#3A3A42' : '#26262D'}" stroke-width="${v === 0 ? 2 : 1.5}" ${v === 0 ? '' : 'stroke-dasharray="4 8"'}/>` + T(pl - 14, cpy(v) + 7, String(v), { size: 20, w: 600, fill: DIM, anchor: 'end' });
    c += T(pl - 66, pt - 28, '−Cp', { size: 22, w: 700, fill: SEC });
    [0, 0.5, 1].forEach(x => { c += T(cpx(x), pb + 32, String(x), { size: 20, w: 600, fill: DIM, anchor: 'middle' }); });
    c += T(pr, pb + 58, 'x / c', { size: 20, w: 700, fill: SEC, anchor: 'end' });
    const dr = eio((t - 3.2) / 1.7);
    const line = (arr, col) => { const pts = arr.filter(p => p[0] <= dr + 1e-6 && p[1] >= ymin - .2); return pts.length > 1 ? `<polyline points="${pts.map(p => f2(cpx(p[0])) + ',' + f2(cpy(Math.max(ymin, p[1])))).join(' ')}" fill="none" stroke="${col}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` : ''; };
    c += line(CP_L, BLUE) + line(CP_U, OR);
    // peak marker with check 2
    const mp = rv(t, CHECKS[1].t + 0.1);
    if (mp > 0) { const x = cpx(peak[0]), y = cpy(peak[1]); c += `<g opacity="${f2(mp)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(10 + 8 * (1 - mp))}" fill="none" stroke="${GREEN}" stroke-width="3"/>${T(x + 22, y + 8, 'suction peak', { size: 20, w: 700, fill: GREEN })}</g>`; }
    g += pop(cp, PX + PW / 2, PY + PH / 2, c);
  }
  // ---- eval card
  const ep = rv(t, 4.9);
  if (ep > 0) {
    let e = card(EX, EY, EW, EH) + T(EX + 32, EY + 52, 'eval_airfoil.py', { size: 24, w: 700, fill: SEC, mono: true });
    CHECKS.forEach((k, i) => {
      const p = rv(t, k.t); const y = EY + 120 + i * 78;
      // pending placeholder
      e += `<circle cx="${EX + 54}" cy="${y}" r="20" fill="none" stroke="#3A3A42" stroke-width="2.5" opacity="${f2(1 - p)}"/>`;
      if (p > 0) {
        if (!k.ok) e += `<rect x="${EX + 18}" y="${y - 34}" width="${f2((EW - 36) * p)}" height="68" rx="12" fill="${RED}" opacity=".12"/>`;
        e += pop(p, EX + 54, y, k.ok ? ICON_CHECK(EX + 54, y, 20, GREEN) : ICON_CROSS(EX + 54, y, 20, RED));
      }
      e += T(EX + 92, y + 9, k.s, { size: 26, w: 700, fill: p > 0 ? (k.ok ? TXT : RED) : '#5A5A64' });
    });
    g += pop(ep, EX + EW / 2, EY + EH / 2, e);
  }
  return g;
}
mount(scene);
