// Shared helpers (AI-layer palette per graphics_spec.md)
const W = 1920, H = 1080;
const stage = document.getElementById('stage');
const SCENE = new URLSearchParams(location.search).get('scene') || '';
const BG = '#0E0E10', CARD = '#16161A', BORDER = '#2A2A30', TXT = '#F5F5F7', SEC = '#A1A1AA', DIM = '#6B6B75',
  OR = '#D97757', BLUE = '#4DA3FF', GREEN = '#3DDC97', RED = '#FF5A4E', AMBER = '#F5B800', NODE = '#1C1C21';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const f2 = x => (+x).toFixed(2);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// reveal progress: start s, duration d (s). 10 frames ≈ .33 s
const rv = (t, s, d = 0.36) => eo((t - s) / d);
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join(''); };
const meas = document.createElement('canvas').getContext('2d');
const mw = (s, font) => { meas.font = font; return meas.measureText(s).width; };
const SH = `filter="url(#sh)"`;
const DEFS = `<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000" flood-opacity=".55"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
const pop = (p, cx, cy, inner) => p <= 0 ? '' : `<g opacity="${f2(p)}" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(lerp(.92, 1, p))}) translate(${f2(-cx)} ${f2(-cy)})">${inner}</g>`;
const T = (x, y, s, o = {}) => `<text x="${f2(x)}" y="${f2(y)}" font-family="${o.mono ? "'JetBrains Mono'" : 'Inter'}" font-size="${o.size || 34}" font-weight="${o.w || 600}" fill="${o.fill || TXT}" text-anchor="${o.anchor || 'start'}" opacity="${o.op == null ? 1 : f2(o.op)}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
const card = (x, y, w, h, o = {}) => `<g ${SH}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${o.fill || CARD}" stroke="${o.stroke || BORDER}" stroke-width="${o.sw || 1}"/></g>`;
// window card with title bar + traffic dots (generic)
function win(x, y, w, h, title) {
  return card(x, y, w, h) + `<line x1="${x}" x2="${x + w}" y1="${y + 56}" y2="${y + 56}" stroke="${BORDER}"/>` +
    [0, 1, 2].map(i => `<circle cx="${x + 30 + i * 24}" cy="${y + 28}" r="7" fill="#3A3A42"/>`).join('') +
    T(x + w / 2, y + 37, title, { size: 22, w: 600, fill: SEC, anchor: 'middle', mono: true });
}
function pill(x, y, label, o = {}) { // left-anchored pill, y = centre
  const size = o.size || 22, padX = o.padX || 16, h = o.h || size + 20;
  const w = mw(label, `${o.w || 700} ${size}px ${o.mono ? 'JetBrains Mono' : 'Inter'}`) + padX * 2 + (o.dot ? 22 : 0);
  const ax = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x;
  return { w, svg: `<rect x="${f2(ax)}" y="${f2(y - h / 2)}" width="${f2(w)}" height="${h}" rx="${h / 2}" fill="${o.bg || '#22222A'}" stroke="${o.stroke || 'none'}"/>` +
    (o.dot ? `<circle cx="${f2(ax + padX + 6)}" cy="${f2(y)}" r="6" fill="${o.dot}"/>` : '') +
    T(ax + padX + (o.dot ? 22 : 0), y + size * 0.36, label, { size, w: o.w || 700, fill: o.fill || TXT, mono: o.mono }) };
}
const ICON_CHECK = (cx, cy, r, col) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="2.5"/><path d="M ${cx - r * .42} ${cy + r * .02} L ${cx - r * .1} ${cy + r * .34} L ${cx + r * .45} ${cy - r * .32}" fill="none" stroke="${col}" stroke-width="${r * .22}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICON_CROSS = (cx, cy, r, col) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="2.5"/><path d="M ${cx - r * .32} ${cy - r * .32} L ${cx + r * .32} ${cy + r * .32} M ${cx + r * .32} ${cy - r * .32} L ${cx - r * .32} ${cy + r * .32}" fill="none" stroke="${col}" stroke-width="${r * .22}" stroke-linecap="round"/>`;
// thumb icon (Material Icons path, Apache-2.0), 24x24 box; down = rotated
const THUMB = 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';
const thumb = (cx, cy, s, up, col) => `<g transform="translate(${f2(cx)} ${f2(cy)}) ${up ? '' : 'rotate(180)'} scale(${s / 24}) translate(-12 -12)"><path d="${THUMB}" fill="${col}"/></g>`;
function mount(sceneFn) {
  window.renderAt = function (t) {
    stage.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${DEFS}${sceneFn(t)}</svg>`;
  };
  window.ready = (async () => {
    await Promise.all(['400 40px Inter', '600 40px Inter', '700 48px Inter', '800 100px Inter', '500 40px "JetBrains Mono"', '700 48px "JetBrains Mono"'].map(f => document.fonts.load(f)));
    await document.fonts.ready;
    window.renderAt(+(new URLSearchParams(location.search).get('t') || 0));
    return true;
  })();
}
