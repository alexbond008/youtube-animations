// Shared helpers: easing, timing, a tiny orthographic 3D -> SVG renderer.
const U = (() => {
  function bez(x1, y1, x2, y2) {
    return t => { if (t <= 0) return 0; if (t >= 1) return 1; let u = t;
      for (let i = 0; i < 10; i++) { const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 - t;
        const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2); if (Math.abs(dx) < 1e-6) break;
        u = Math.min(1, Math.max(0, u - x / dx)); }
      return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3; };
  }
  const out = bez(.2, .8, .2, 1), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, lin = t => t, inn = t => t * t * t;
  const sine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (t, a, b, e = out) => e(clamp((t - a) / (b - a)));
  const lerp = (a, b, u) => a + (b - a) * u;
  const FPS = 30000 / 1001, fr = n => n / FPS;
  // pop-in: opacity + scale .92 -> 1 over 10 frames, optional exit over 7 frames
  const pop = (t, t0, t1 = 1e9) => { const a = prog(t, t0, t0 + fr(10)), b = 1 - prog(t, t1, t1 + fr(7), io);
    return { o: Math.min(a, b), s: lerp(.92, 1, a) }; };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  return { bez, out, io, lin, inn, sine, clamp, prog, lerp, fr, pop, mix, FPS };
})();

const ISO = (() => {
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const L = norm([-0.15, -0.6, 0.8]);
  function camera({ yaw, pitch, s, cx, cy }) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const r = ([x, y, z]) => [x * ca - y * sa, x * sa + y * ca, z];
    return { s,
      p: v => { const [a, b, z] = r(v); return [cx + s * a, cy - s * (z * cp + b * sp)]; },
      d: v => { const [, b, z] = r(v); return -b * cp + z * sp; },
      vis: n => { const [, b, z] = r(n); return -b * cp + z * sp; } };
  }
  const shade = (n, lo = '#0B0B0E', hi = '#4A4A56') => { const k = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2] + 1) / 2; return U.mix(lo, hi, k); };
  function box(x0, y0, z0, x1, y1, z1, o = {}) {
    const P = (x, y, z) => [x, y, z];
    const faces = [
      { n: [0, 0, -1], q: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)] },
      { n: [0, 0, 1], q: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)] },
      { n: [0, -1, 0], q: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)] },
      { n: [0, 1, 0], q: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)] },
      { n: [-1, 0, 0], q: [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)] },
      { n: [1, 0, 0], q: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)] }];
    return { type: 'poly', faces, c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], ...o };
  }
  // vertical cylinder (drawn as hull + top cap)
  function cyl(x, y, z0, z1, r, o = {}) { return { type: 'cyl', x, y, z0, z1, r, c: [x, y, (z0 + z1) / 2], ...o }; }
  // circle on a plane: centre c, unit axes u, v
  const circle = (c, u, v, r, n = 28) => [...Array(n)].map((_, i) => { const a = i / n * Math.PI * 2;
    return [0, 1, 2].map(k => c[k] + r * (Math.cos(a) * u[k] + Math.sin(a) * v[k])); });
  function hull(pts) { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); }
  const pts = (cam, q) => q.map(v => cam.p(v).map(n => n.toFixed(2)).join(',')).join(' ');
  // prims: {type, faces|cyl, c, layer?, alpha?, stroke?, sw?}; painter's order by layer then depth
  function draw(cam, prims, st = {}) {
    const stroke0 = st.stroke || '#D97757', sw0 = st.sw || 2.4;
    const list = prims.filter(Boolean).map(p => ({ p, k: (p.layer || 0) * 1e5 + cam.d(p.c) })).sort((a, b) => a.k - b.k);
    let s = '';
    for (const { p } of list) {
      const op = p.alpha ?? 1; if (op <= 0.001) continue;
      const stroke = p.stroke || stroke0, sw = p.sw || sw0;
      s += `<g opacity="${op.toFixed(3)}">`;
      if (p.type === 'poly') for (const f of p.faces) {
        if (cam.vis(f.n) <= 1e-4) continue;
        s += `<polygon points="${pts(cam, f.q)}" fill="${f.fill || shade(f.n, st.lo, st.hi)}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
        for (const dc of (f.decals || [])) s += `<polygon points="${pts(cam, dc)}" fill="#09090B" stroke="${stroke}" stroke-width="${sw * 0.8}" stroke-linejoin="round"/>`;
      } else if (p.type === 'cyl') {
        const bot = circle([p.x, p.y, p.z0], [1, 0, 0], [0, 1, 0], p.r), top = circle([p.x, p.y, p.z1], [1, 0, 0], [0, 1, 0], p.r);
        const h = hull([...bot, ...top].map(cam.p));
        s += `<polygon points="${h.map(q => q.map(n => n.toFixed(2)).join(',')).join(' ')}" fill="${shade([0.7, -0.7, 0], st.lo, st.hi)}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
        s += `<polygon points="${pts(cam, top)}" fill="${shade([0, 0, 1], st.lo, st.hi)}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (p.hole) s += `<polygon points="${pts(cam, circle([p.x, p.y, p.z1], [1, 0, 0], [0, 1, 0], p.hole))}" fill="#09090B" stroke="${stroke}" stroke-width="${sw * 0.7}"/>`;
      }
      s += '</g>';
    }
    return s;
  }
  return { camera, box, cyl, circle, draw, shade };
})();
