// Shared helpers (house style: graphics_spec.md). Same file copied into each asset's src/.
const W = 1920, H = 1080;
const BG = '#0E0E10', CARD = '#16161A', BORDER = '#2A2A30', TXT = '#F5F5F7', SEC = '#A1A1AA', OR = '#D97757',
  RED = '#FF5A4E', GREEN = '#3DDC97', AMBER = '#F5B800', BLUE = '#4DA3FF', MUTED = '#6B6B75';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const f2 = x => (+x).toFixed(2);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rv = (t, s, d = 0.37) => eo((t - s) / d);           // ~11 frame entrance
const fadeOut = (t, s, d = 0.25) => 1 - clamp((t - s) / d);
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join(''); };
const meas = document.createElement('canvas').getContext('2d');
const mw = (s, font) => { meas.font = font; return meas.measureText(s).width; };
const SH = `filter="url(#shadow)"`;
const DEFS = `<defs>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="glowBig" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>`;
const pop = (p, cx, cy, inner) => p <= 0 ? '' : `<g opacity="${f2(p)}" transform="translate(${f2(cx)} ${f2(cy)}) scale(${f2(lerp(.92, 1, p))}) translate(${f2(-cx)} ${f2(-cy)})">${inner}</g>`;
const T = (x, y, s, o = {}) => `<text x="${f2(x)}" y="${f2(y)}" font-family="${o.mono ? "'JetBrains Mono'" : 'Inter'}" font-size="${o.size || 34}" font-weight="${o.w || 600}" fill="${o.fill || TXT}" text-anchor="${o.anchor || 'start'}" ${o.ls ? `letter-spacing="${o.ls}"` : ''} opacity="${o.op == null ? 1 : f2(o.op)}">${esc(s)}</text>`;
const card = (x, y, w, h, o = {}) => `<g ${o.noShadow ? '' : SH}><rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${o.rx || 16}" fill="${o.fill || CARD}" stroke="${o.stroke || BORDER}" stroke-width="${o.sw || 1}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/></g>`;
const svgWrap = body => `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${DEFS}${body}</svg>`;
async function loadFonts() {
  await Promise.all(['400 40px Inter', '500 40px Inter', '600 40px Inter', '700 48px Inter', '800 100px Inter', '500 40px "JetBrains Mono"', '700 48px "JetBrains Mono"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
}
