// Pure time model for q1_release_cadence (no React). Everything is a smooth
// function of clip time t (seconds) so motion is eased and judder-free.
// Day 0 = 1 Jan 2026 (fictional, generic timeline).

export const FPS = 30000 / 1001;
export const DUR = 19.0; // 18.0 s of motion + 1.0 s held last frame
export const DURATION_FRAMES = Math.round(DUR * FPS); // 569
export const DAY_2035 = 3287; // 1 Jan 2035

// ---------- helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => {
	const u = clamp((x - a) / (b - a));
	return u * u * (3 - 2 * u);
};
export const smoother = (a, b, x) => {
	const u = clamp((x - a) / (b - a));
	return u * u * u * (u * (u * 6 - 15) + 10);
};
// cubic-bezier(.2,.8,.2,1) — spec ease-out
export function bezier(p1x, p1y, p2x, p2y) {
	const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
	const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
	const sx = (t) => ((ax * t + bx) * t + cx) * t;
	const sy = (t) => ((ay * t + by) * t + cy) * t;
	const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
	return (x) => {
		x = clamp(x);
		let t = x;
		for (let i = 0; i < 8; i++) {
			const e = sx(t) - x;
			const d = dsx(t);
			if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
			t -= e / d;
		}
		t = clamp(t);
		return sy(t);
	};
}
export const easeOut = bezier(0.2, 0.8, 0.2, 1);
export const easeInOut = bezier(0.45, 0, 0.55, 1);

// Monotone cubic (Fritsch–Carlson): C1, no overshoot. Clamped outside range.
export function monotone(keys) {
	const xs = keys.map((k) => k[0]);
	const ys = keys.map((k) => k[1]);
	const n = xs.length;
	const d = [], m = new Array(n).fill(0);
	for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
	m[0] = d[0];
	m[n - 1] = d[n - 2];
	for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
	for (let i = 0; i < n - 1; i++) {
		if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
		const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
		if (s > 9) { const tau = 3 / Math.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
	}
	// flat ends so holds start/stop smoothly
	m[0] = 0; m[n - 1] = 0;
	return (x) => {
		if (x <= xs[0]) return ys[0];
		if (x >= xs[n - 1]) return ys[n - 1];
		let i = 0;
		while (x > xs[i + 1]) i++;
		const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
		const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u;
		const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
		return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
	};
}

// ---------- time → "now" (days) ----------
// Speed of calendar time in days per second.
const vel = monotone([
	[0, 0], [4.85, 0], [5.3, 21], [9.2, 21], [10.6, 52], [12.4, 92],
	[13.5, 58], [14.5, 56], [15.5, 78], [16.3, 46], [17.0, 0], [DUR, 0],
]);
const DT = 1 / 1200;
const N = Math.ceil(DUR / DT) + 2;
const NOW0 = 22;
const nowTab = new Float64Array(N);
{
	let acc = NOW0;
	nowTab[0] = acc;
	for (let i = 1; i < N; i++) {
		const t0 = (i - 1) * DT;
		acc += 0.5 * (Math.max(0, vel(t0)) + Math.max(0, vel(t0 + DT))) * DT;
		nowTab[i] = acc;
	}
}
export function nowDay(t) {
	const x = clamp(t, 0, DUR) / DT;
	const i = Math.floor(x), f = x - i;
	return nowTab[i] * (1 - f) + nowTab[Math.min(N - 1, i + 1)] * f;
}
export function timeOfDay(d) {
	if (d <= NOW0) return null;
	if (d > nowTab[N - 1]) return null;
	let lo = 0, hi = N - 1;
	while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (nowTab[mid] < d) lo = mid; else hi = mid; }
	const f = (d - nowTab[lo]) / (nowTab[hi] - nowTab[lo] || 1);
	return (lo + f) * DT;
}

// ---------- releases ----------
const LABS = ['Lab A', 'Lab B', 'Lab C', 'Lab D'];
const LAB_SEQ = [3, 0, 1, 2, 0, 3, 1, 2, 3, 0, 2, 1];
const PATTERN = [20, 17, 15, 19, 16, 14, 18, 21, 15, 17, 19, 16, 18, 15];
export const T_WEEK = 13.5;
export const T_2DAY = 14.5;
export const CARD_CUTOFF = 10.25; // releases before this get a full card
export const RELEASES = (() => {
	const out = [{day: 6, t: -1, lab: LABS[LAB_SEQ[0]], card: true, pre: true, i: 0}];
	let d = 26, k = 0;
	for (;;) {
		const t = timeOfDay(d);
		if (t === null || t > 16.9) break;
		out.push({day: d, t, lab: LABS[LAB_SEQ[out.length % LAB_SEQ.length]], card: t < CARD_CUTOFF, pre: false, i: out.length});
		const sp = t < T_WEEK ? PATTERN[k++ % PATTERN.length] : t < T_2DAY ? 7 : 2;
		d += sp;
	}
	return out;
})();
export const D_EXP = nowDay(15.4); // exponential take-off starts here

// ---------- frontier level ----------
const RAMP = 4; // days for each notch to rise
export function level(day) {
	let s = 0;
	for (const r of RELEASES) {
		if (day <= r.day - RAMP) break;
		s += smoother(r.day - RAMP, r.day + RAMP, day);
	}
	if (day > D_EXP) {
		const x = (day - D_EXP) / 17;
		s += 9 * (Math.exp(x) - 1 - x);
	}
	return s;
}

// ---------- camera ----------
// visible span in days (landscape); scaled per layout. Interpolated in log space.
const logSpan = monotone([
	[0, Math.log(120)], [9.3, Math.log(120)], [11.2, Math.log(200)], [13.5, Math.log(330)],
	[14.5, Math.log(420)], [15.5, Math.log(560)], [17.1, Math.log(3480)], [DUR, Math.log(3480)],
]);
export const spanDays = (t, scale = 1) => Math.exp(logSpan(t)) * (t < 15.5 ? scale : scale + (1 - scale) * smooth(15.5, 17.1, t));
// vertical scale (px per notch, landscape) — compresses as density grows
const kKeys = monotone([[0, 26], [9.2, 26], [12.0, 17], [13.5, 12.5], [14.5, 9.5], [15.5, 5.2], [16.2, 4.8], [DUR, 4.8]]);
export const kAt = (t) => kKeys(t);

/** Full camera for a layout L at time t. */
export function camera(L, t) {
	const win = L.X1 - L.X0;
	const span = spanDays(t, L.spanScale);
	const ppd = win / span;
	const now = nowDay(t);
	// follow mode: "now" sits at playX
	const playStart = L.X0 + (NOW0 + 10) * (win / (120 * L.spanScale));
	const playF = monotone([[0, playStart], [5.0, playStart], [8.2, L.X0 + win * 0.74], [9.6, L.X0 + win * 0.8], [DUR, L.X0 + win * 0.8]])(t);
	const leftFollow = now - (playF - L.X0) / ppd;
	// final mode: show 2026 → 2035
	const leftFinal = -14 - 10 * (span / 3480);
	// smooth max: never scroll before 2026; C-infinity so no velocity kinks
	const eps = 30 * (span / 560);
	const left = (leftFollow + leftFinal + Math.sqrt((leftFollow - leftFinal) ** 2 + eps * eps)) / 2;
	const x = (day) => L.X0 + (day - left) * ppd;
	return {span, ppd, now, left, x, playX: x(now), k: kAt(t) * L.kScale};
}
