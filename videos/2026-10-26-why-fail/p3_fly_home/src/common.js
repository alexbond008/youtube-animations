// Shared helpers for p3_skipping pages. Each page defines scene(t) -> svg inner markup.
const W = 1920, H = 1080;
const BG = '#0E0E10', CARD = '#16161A', BORDER = '#2A2A30', TXT = '#F5F5F7', SEC = '#A1A1AA', OR = '#D97757',
  BLUE = '#4DA3FF', GREEN = '#3DDC97', RED = '#FF5A4E', AMBER = '#F5B800', DIM = '#3A3A42';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const f2 = x => (+x).toFixed(2);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FR = 1001 / 30000;
// entrance progress: 10 frames ease-out by default
const rv = (t, s, d = 10 * FR) => eo((t - s) / d);
const meas = document.createElement('canvas').getContext('2d');
const mw = (s, size = 48, w = 700, mono = false) => { meas.font = `${w} ${size}px ${mono ? '"JetBrains Mono"' : 'Inter'}`; return meas.measureText(s).width; };
function T(x, y, s, o = {}) {
  const fam = o.mono ? "'JetBrains Mono'" : 'Inter';
  return `<text x="${f2(x)}" y="${f2(y)}" font-family="${fam}" font-size="${o.size || 48}" font-weight="${o.w || 700}" fill="${o.fill || TXT}" text-anchor="${o.anchor || 'middle'}" opacity="${o.op == null ? 1 : f2(o.op)}"${o.extra ? ' ' + o.extra : ''}>${esc(s)}</text>`;
}
function card(x, y, w, h, o = {}) {
  return `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${o.r == null ? 16 : o.r}" fill="${o.fill || CARD}" stroke="${o.stroke || BORDER}" stroke-width="${o.sw || 1.5}"${o.noShadow ? '' : ' filter="url(#shadow)"'}/>`;
}
// chip: rounded pill with text, centred at cx, baseline-ish centre cy
function chip(cx, cy, label, color, p, o = {}) {
  if (p <= 0.001) return '';
  const size = o.size || 40;
  const tw = mw(label, size, 800);
  const iconW = o.icon ? size * 0.9 + 14 : 0;
  const w = tw + iconW + 56, h = size * 1.75;
  const s = 0.92 + 0.08 * p;
  let g = `<rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(h / 2)}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="2.5"/>`;
  let tx = -w / 2 + 28;
  if (o.icon) { g += `<g transform="translate(${f2(tx + size * 0.45)} 0)">${o.icon(size * 0.45, color)}</g>`; tx += iconW; }
  g += T(tx, size * 0.36, label, { anchor: 'start', size, w: 800, fill: color });
  return `<g opacity="${f2(p)}" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(s)})">${g}</g>`;
}
const tick = (r, c) => `<path d="M ${-r * .7} 0 L ${-r * .2} ${r * .5} L ${r * .75} ${-r * .55}" fill="none" stroke="${c}" stroke-width="${f2(r * .32)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (r, c) => `<path d="M ${-r * .55} ${-r * .55} L ${r * .55} ${r * .55} M ${r * .55} ${-r * .55} L ${-r * .55} ${r * .55}" stroke="${c}" stroke-width="${f2(r * .32)}" stroke-linecap="round"/>`;
const pop = (inner, cx, cy, p) => p <= 0.001 ? '' : `<g opacity="${f2(p)}" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(0.92 + 0.08 * p)}) translate(${f2(-cx)} ${f2(-cy)})">${inner}</g>`;
const DEFS = `<defs>
 <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#000" flood-opacity="0.55"/></filter>
 <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
const stage = document.getElementById('stage');
// cam(t) -> {s, x, y}: gentle drift; pages may override window.cam
window.renderAt = function (t) {
  const c = window.cam ? window.cam(t) : { s: 1, x: 0, y: 0 };
  stage.style.backgroundPosition = `${f2(-c.x * 0.5)}px ${f2(-c.y * 0.5)}px`;
  stage.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${DEFS}<g transform="translate(${W / 2} ${H / 2}) scale(${f2(c.s)}) translate(${f2(-W / 2 - c.x)} ${f2(-H / 2 - c.y)})">${scene(t)}</g></svg>`;
};
window.ready = (async () => {
  await Promise.all(['400 40px Inter', '600 40px Inter', '700 48px Inter', '800 100px Inter', '500 40px "JetBrains Mono"', '700 48px "JetBrains Mono"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  window.renderAt(0);
  return true;
})();
