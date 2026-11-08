// evals_loop — eval code (left) scores workflow runs v1..v6 (right); feedback feeds the eval; curve rises.
const CODE = [
  'from evals import load_output, Criteria',
  '',
  'def eval_step(run_id) -> float:',
  '    out = load_output(run_id)   # agent output',
  '    c = Criteria("good_circuit.yaml")',
  '    score = 0.0',
  '    score += 3 * c.passes_drc(out)',
  '    score += 3 * c.meets_spec(out, gain_db=20)',
  '    score += 2 * c.power_ok(out, max_mw=50)',
  '    score += 2 * c.feedback_match(out)',
  '    return round(score, 1)      # 0-10',
];
const KW = new Set(['from', 'import', 'def', 'return']);
function hl(line) { // returns [[text,color],...]
  const out = []; const re = /(#.*$)|("[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/g; let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push([m[1], DIM]); else if (m[2]) out.push([m[2], GREEN]); else if (m[3]) out.push([m[3], AMBER]);
    else if (m[4]) { const nx = line[re.lastIndex]; out.push([m[4], KW.has(m[4]) ? OR : m[4] === 'float' ? BLUE : nx === '(' ? BLUE : TXT]); }
    else out.push([m[0], SEC]);
  }
  return out;
}
const CX = 100, CY = 160, CWd = 860, CHt = 610, LH = 46, FS = 25, CH0 = CY + 56 + 46;
const charW = FS * 0.6; // JetBrains Mono advance = 600/1000 em
const codeX = CX + 84;
function codeLine(i, t, op = 1) {
  const y = CH0 + i * LH;
  let s = `<text x="${codeX}" y="${y}" font-family="'JetBrains Mono'" font-size="${FS}" font-weight="500" xml:space="preserve">`;
  for (const [tx, col] of hl(CODE[i])) s += `<tspan fill="${col}">${esc(tx)}</tspan>`;
  s += '</text>';
  return `<g opacity="${f2(op)}">${T(CX + 56, y, String(i + 1), { size: 20, w: 500, fill: '#4A4A54', mono: true, anchor: 'end' })}${s}</g>`;
}
const RUNS = [4.1, 5.0, 5.8, 6.9, 7.6, 8.4];
const RS = [3.5, 4.5, 5.4, 9.7, 10.9, 12.1]; // scoring start times
const BD = 0.62; // bar grow duration
// chart geometry
const RX = 1000, RY = 160, RW = 820, RH = 800;
const PL = 1096, PR = 1784, PB = 830, PT = 410;
const slot = (PR - PL) / 6, bx = i => PL + slot * (i + .5), by = s => PB - (PB - PT) * s / 10;
const barCol = s => s < 6.2 ? mix(RED, AMBER, clamp((s - 4.1) / 2.1)) : mix(AMBER, GREEN, clamp((s - 6.2) / 2.2));
const FB = [{ up: false, label: "I don't like this", t: 6.5 }, { up: false, label: "I don't like this", t: 6.85 }, { up: true, label: 'I like this', t: 7.2 }];
const FBX = [1176, 1420, 1650], FBY = 316;
const FLY0 = 8.2, FLYD = 0.75;
const L10 = 9; // index of feedback_match line
function scene(t) {
  let g = '';
  // header
  const hp = rv(t, 0);
  const ex = pill(110, 100, 'EXAMPLE', { size: 20, bg: 'rgba(245,184,0,.14)', stroke: AMBER, fill: AMBER, w: 800 });
  g += pop(hp, 300, 100, ex.svg + T(110 + ex.w + 18, 113, 'Evals: code that scores every step', { size: 36, w: 800 }));
  // code window
  const cp = rv(t, 0.1);
  let code = win(CX, CY, CWd, CHt, 'eval_step.py — editor');
  // highlight for line 10 (feedback) after feedback lands
  const hl10 = rv(t, FLY0 + FLYD - 0.05, 0.4);
  if (hl10 > 0) code += `<rect x="${CX + 12}" y="${CH0 + L10 * LH - 33}" width="${f2((CWd - 24) * hl10)}" height="${LH - 2}" rx="8" fill="${AMBER}" opacity=".22"/>`;
  // scoring highlight on return line while a run is being scored
  let scoring = 0; RS.forEach(s => { scoring = Math.max(scoring, clamp((t - s + .15) / .15) * clamp((s + BD + .25 - t) / .2)); });
  if (scoring > 0) code += `<rect x="${CX + 12}" y="${CH0 + 10 * LH - 33}" width="${CWd - 24}" height="${LH - 2}" rx="8" fill="${OR}" opacity="${f2(.2 * scoring)}"/>`;
  CODE.forEach((_, i) => { code += codeLine(i, t, rv(t, 0.3 + i * 0.11, 0.3)); });
  // "+3 labels" tag at end of line 10
  const tagp = rv(t, FLY0 + FLYD + 0.15);
  if (tagp > 0) { const pl = pill(codeX + CODE[L10].length * charW + 18, CH0 + L10 * LH - 9, '+3 labels', { size: 19, bg: 'rgba(245,184,0,.18)', fill: AMBER, h: 34 }); code += `<g opacity="${f2(tagp)}">${pl.svg}</g>`; }
  g += pop(cp, CX + CWd / 2, CY + CHt / 2, code);
  // terminal
  const tp = rv(t, 2.0);
  if (tp > 0) {
    const TY = 800, TH = 160;
    let tg = win(CX, TY, CWd, TH, 'eval — terminal');
    let ri = -1; RS.forEach((s, i) => { if (t >= (i ? s - 0.15 : 0)) ri = i; });
    const cmd0 = 'python eval_step.py --run v1';
    let cmd = cmd0; if (ri <= 0) cmd = cmd0.slice(0, Math.max(0, Math.floor((t - 2.3) * 32))); else cmd = `python eval_step.py --run v${ri + 1}`;
    const ly = TY + 56 + 44;
    tg += T(CX + 32, ly, '$', { size: 25, w: 700, fill: GREEN, mono: true }) + T(CX + 60, ly, cmd, { size: 25, w: 500, mono: true });
    const ri2 = RS.findIndex((s, i) => t >= s && (i === 5 || t < RS[i + 1] - 0.9));
    const showOut = t >= RS[ri];
    const curX = CX + 60 + cmd.length * charW + 4;
    if (!showOut) { if (Math.floor(t * 2.2) % 2 === 0 || t < 3.3) tg += `<rect x="${f2(curX)}" y="${ly - 22}" width="13" height="28" fill="${OR}"/>`; }
    else tg += T(CX + 32, ly + 44, `score  ${(RUNS[ri] * eo((t - RS[ri]) / BD)).toFixed(1)} / 10`, { size: 25, w: 700, fill: barCol(RUNS[ri]), mono: true });
    g += pop(tp, CX + CWd / 2, TY + TH / 2, tg);
  }
  // right card: chart
  const rp = rv(t, 0.45);
  let r = card(RX, RY, RW, RH) + T(RX + 36, RY + 58, 'Workflow runs', { size: 30, w: 700 }) + T(RX + RW - 36, RY + 58, 'score / 10', { size: 24, w: 600, fill: SEC, anchor: 'end' });
  [0, 5, 10].forEach(v => { r += `<line x1="${PL}" x2="${PR}" y1="${by(v)}" y2="${by(v)}" stroke="${v ? '#26262D' : '#3A3A42'}" stroke-width="${v ? 1.5 : 2}" ${v ? 'stroke-dasharray="4 8"' : ''}/>` + T(PL - 16, by(v) + 8, String(v), { size: 22, w: 600, fill: DIM, anchor: 'end' }); });
  // bars
  RUNS.forEach((s, i) => {
    const lp = rv(t, RS[i] - 0.5, 0.3);
    r += T(bx(i), PB + 44, `v${i + 1}`, { size: 26, w: 700, fill: lp > 0 && t >= RS[i] ? TXT : '#4A4A54', anchor: 'middle', op: Math.max(lp, .0) + (1 - lp) * 0 });
    const gp = eo((t - RS[i]) / BD); if (gp <= 0) return;
    const v = s * gp, top = by(v), bw = 66;
    const x0 = bx(i) - bw / 2, x1 = bx(i) + bw / 2, rr = Math.min(10, (PB - top) / 2);
    r += `<path d="M ${f2(x0)} ${PB} L ${f2(x0)} ${f2(top + rr)} Q ${f2(x0)} ${f2(top)} ${f2(x0 + rr)} ${f2(top)} L ${f2(x1 - rr)} ${f2(top)} Q ${f2(x1)} ${f2(top)} ${f2(x1)} ${f2(top + rr)} L ${f2(x1)} ${PB} Z" fill="${barCol(s)}" opacity=".9"/>`;
    r += T(bx(i), top - 22, v.toFixed(1), { size: 30, w: 800, anchor: 'middle', fill: TXT, op: clamp(gp * 2) });
  });
  // trend line through bar tops (drawn after each bar lands)
  let path = '';
  for (let i = 1; i < 6; i++) {
    const sp = eo((t - (RS[i] + BD - 0.1)) / 0.4); if (sp <= 0) break;
    const x0 = bx(i - 1), y0 = by(RUNS[i - 1]), x1 = bx(i), y1 = by(RUNS[i]);
    path += `<line x1="${x0}" y1="${y0}" x2="${f2(lerp(x0, x1, sp))}" y2="${f2(lerp(y0, y1, sp))}" stroke="${OR}" stroke-width="4" stroke-linecap="round"/>`;
  }
  RUNS.forEach((s, i) => { const dp = rv(t, RS[i] + BD - 0.1, 0.25); if (dp > 0 && i > 0 || (i === 0 && dp > 0)) path += `<circle cx="${bx(i)}" cy="${by(s)}" r="${f2(7 * dp)}" fill="${OR}" stroke="${CARD}" stroke-width="3"/>`; });
  // pulse on latest dot (element motion)
  if (t > RS[5] + BD) { const ph = ((t - RS[5] - BD) % 1.4) / 1.4; path += `<circle cx="${bx(5)}" cy="${by(8.4)}" r="${f2(8 + 22 * ph)}" fill="none" stroke="${OR}" stroke-width="2.5" opacity="${f2(.7 * (1 - ph))}"/>`; }
  r += path;
  // feedback chips (pop near v1..v3, then fly to code line 10)
  FB.forEach((f, i) => {
    const p = rv(t, f.t); if (p <= 0) return;
    const fly = eio((t - FLY0 - i * 0.08) / FLYD);
    if (fly >= 1) return;
    const col = f.up ? GREEN : RED;
    const w = mw(f.label, '700 22px Inter') + 66, h = 50;
    const x0 = FBX[i], y0 = FBY;
    const tx = codeX + CODE[L10].length * charW + 70, ty = CH0 + L10 * LH - 9;
    const x = lerp(x0, tx, fly), y = lerp(y0, ty, fly) - Math.sin(Math.PI * fly) * 120, sc = lerp(1, .45, fly), op = p * (1 - clamp((fly - .8) / .2));
    // connector to the bar this feedback is about
    if (fly <= 0) r += `<line x1="${x0}" y1="${y0 + h / 2 + 4}" x2="${bx(i)}" y2="${f2(by(RUNS[i]) - 64)}" stroke="${col}" stroke-width="2" stroke-dasharray="4 6" opacity="${f2(.6 * p)}"/>`;
    r += `<g opacity="${f2(op)}" transform="translate(${f2(x)} ${f2(y)}) scale(${f2(sc * lerp(.92, 1, p))})"><g ${SH}><rect x="${f2(-w / 2)}" y="${-h / 2}" width="${f2(w)}" height="${h}" rx="${h / 2}" fill="#1E1E24" stroke="${col}" stroke-width="2"/></g>${thumb(-w / 2 + 30, 0, 24, f.up, col)}${T(-w / 2 + 52, 8, f.label, { size: 22, w: 700, fill: TXT })}</g>`;
  });
  // "feedback" label above chips
  const fl = rv(t, 6.4) * (1 - clamp((t - FLY0) / .3));
  if (fl > 0) r += T(RX + 36, FBY - 46, 'Your feedback', { size: 22, w: 700, fill: SEC, op: fl });
  g += pop(rp, RX + RW / 2, RY + RH / 2, r);
  // the flying chips need to be above the code window: re-render fly layer on top
  // (chips are inside right card group; card pop is complete by then so no transform issue)
  // delta pill
  const dp = rv(t, 13.0);
  if (dp > 0) { const pl = pill(RX + RW - 36, FBY - 10, '+4.3 since v1', { size: 26, bg: 'rgba(61,220,151,.14)', stroke: GREEN, fill: GREEN, anchor: 'end', h: 52 }); g += pop(dp, RX + RW - 140, FBY - 10, pl.svg); }
  const cap = rv(t, 13.7);
  if (cap > 0) g += pop(cap, RX + RW / 2, RY + RH - 40, T(RX + 36, RY + RH - 42 + 6, 'feedback → better eval → better system', { size: 26, w: 700, fill: SEC }));
  return g;
}
mount(scene);
