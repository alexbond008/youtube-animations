// v2 time model for q1_release_cadence: REAL dated releases (src/releases.json).
// Day 0 = 30 Nov 2022 (ChatGPT launch). Beat timings identical to v1 (fixed VO).
import RAW from './releases.json';
import {clamp, smooth, smoother, monotone, easeOut, easeInOut} from './model.js';
export {clamp, smooth, smoother, monotone, easeOut, easeInOut};

export const FPS = 30000 / 1001;
export const DUR = 19.0;
export const DURATION_FRAMES = Math.round(DUR * FPS); // 569

const EPOCH = Date.UTC(2022, 10, 30);
export const dayOf = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000);
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return dayOf(y, m, d); };
export const TODAY = dayOf(2026, 10, 17);
export const DAY_2035 = dayOf(2035, 1, 1);
export const LAB_ORDER = ['OpenAI', 'Anthropic', 'Google', 'xAI'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (s) => { const [y, m, d] = s.split('-').map(Number); return `${d} ${MON[m - 1]} ${y}`; };

// ---------- beats (unchanged from v1) ----------
export const CARD_TIMES = [5.27, 6.22, 7.03, 7.74, 8.65, 9.40, 9.92];
export const T_WEEK = 13.5;
export const T_2DAY = 14.5;

// ---------- real releases ----------
export const REAL = RAW.map((r, i) => ({...r, day: parse(r.date), i, real: true}));
const CARDS = REAL.filter((r) => r.card);
if (CARDS.length !== CARD_TIMES.length) throw new Error('need 7 cards');
CARDS.forEach((r, k) => { r.cardIdx = k; r.t = CARD_TIMES[k]; });

// ---------- "now" (playhead day) ----------
// Phase A (0–4.9 s): playhead parked just before the first card release.
// Phase B (4.9–10.4 s): passes through each card's real date exactly at its beat.
// Then crosses TODAY into the projection, speeding up (integrated velocity).
export const N0 = CARDS[0].day - 4;
const T_TODAY = 10.4;
const nowB = monotone([[4.9, N0], ...CARDS.map((r) => [r.t, r.day]), [T_TODAY, TODAY]]);
const V_TODAY = 9; // d/s at the hand-off (matches slope into TODAY)
const vel = monotone([
	[T_TODAY, V_TODAY], [11.0, 18], [12.4, 30], [13.5, 58], [14.5, 56], [15.5, 78], [16.3, 46], [17.0, 0], [DUR, 0],
]);
const DT = 1 / 1200;
const N = Math.ceil((DUR - T_TODAY) / DT) + 2;
const tabC = new Float64Array(N);
{
	let acc = TODAY;
	tabC[0] = acc;
	for (let i = 1; i < N; i++) {
		const t0 = T_TODAY + (i - 1) * DT;
		acc += 0.5 * (Math.max(0, vel(t0)) + Math.max(0, vel(t0 + DT))) * DT;
		tabC[i] = acc;
	}
}
export function nowDay(t) {
	if (t <= 4.9) return N0;
	if (t <= T_TODAY) return nowB(t);
	const x = (Math.min(t, DUR) - T_TODAY) / DT;
	const i = Math.floor(x), f = x - i;
	return tabC[i] * (1 - f) + tabC[Math.min(N - 1, i + 1)] * f;
}
function timeOfDay(d) {
	if (d <= N0) return null;
	// bisection on monotone nowDay
	if (d > nowDay(DUR)) return null;
	let lo = 4.9, hi = DUR;
	for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (nowDay(mid) < d) lo = mid; else hi = mid; }
	return hi;
}

// landing time for each real release (pre = already on the strip in phase A)
for (const r of REAL) {
	if (r.card) { r.pre = false; continue; }
	if (r.day <= N0) { r.pre = true; r.t = -1; } else { r.pre = false; r.t = timeOfDay(r.day); }
}

// ---------- projected (NOT real) releases past TODAY ----------
// before T_WEEK: continue the REAL recent pace (median gap 8 d, last 12 months)
const PATTERN = [9, 8, 10, 8, 9, 7, 10, 8];
export const PROJ = (() => {
	const out = [];
	let d = TODAY + 9, k = 0;
	for (;;) {
		const t = timeOfDay(d);
		if (t === null || t > 16.9) break;
		out.push({day: d, t, real: false, i: 1000 + out.length});
		d += t < T_WEEK ? PATTERN[k++ % PATTERN.length] : t < T_2DAY ? 7 : 2;
	}
	return out;
})();
export const ALL = [...REAL, ...PROJ];
export const D_EXP = nowDay(15.4);

// ---------- frontier level (one notch per release entry) ----------
const RAMP = 4;
const SORTED = [...ALL].sort((a, b) => a.day - b.day);
export function level(day) {
	let s = 0;
	for (const r of SORTED) {
		if (day <= r.day - RAMP) break;
		s += smoother(r.day - RAMP, r.day + RAMP, day);
	}
	if (day > D_EXP) {
		const x = (day - D_EXP) / 17;
		s += 9 * (Math.exp(x) - 1 - x);
	}
	return s;
}
// heavily smoothed level for the vertical camera reference (no steps)
export function levelSmooth(day) {
	let s = 0;
	for (const r of SORTED) {
		if (day <= r.day - 45) break;
		s += smoother(r.day - 45, r.day + 45, day);
	}
	return s;
}

// ---------- camera ----------
// Each state is [left day, span days]. Transitions zoom about the fixed point.
function zoomBlend(a, b, u) {
	const [la, sa] = a, [lb, sb] = b;
	if (u <= 0) return a;
	if (u >= 1) return b;
	const span = Math.exp(Math.log(sa) + (Math.log(sb) - Math.log(sa)) * u);
	if (Math.abs(sa - sb) < 1e-6) return [la + (lb - la) * u, span];
	// fixed point p: (p - la)/sa = (p - lb)/sb
	const p = (la * sb - lb * sa) / (sb - sa);
	const f = (p - la) / sa;
	if (f < -0.5 || f > 1.5) return [la + (lb - la) * u, span]; // pan-ish fallback
	return [p - f * span, span];
}
const followSpan = monotone([[9.3, 120], [11.2, 200], [13.5, 330], [14.5, 420], [15.5, 560], [DUR, 560]]);

export function camera(L, t) {
	const win = L.X1 - L.X0;
	const A = [L.histLeft, L.histRight - L.histLeft];
	const B = [L.recentLeft, L.recentSpan];
	let st;
	if (t < 3.6) st = A;
	else if (t < 4.85) st = zoomBlend(A, B, easeInOut(clamp((t - 3.6) / 1.25)));
	else st = B;
	if (t > 9.3) {
		// follow: playhead at playF of the window, span grows
		const span = followSpan(t) * (L.recentSpan / 120);
		const playF = (L.recentPlayF ?? 0.8);
		const fl = [nowDay(t) - playF * span, span];
		const u = smoother(9.3, 10.6, t);
		st = [st[0] + (fl[0] - st[0]) * u, Math.exp(Math.log(st[1]) + (Math.log(fl[1]) - Math.log(st[1])) * u)];
	}
	if (t > 15.5) {
		const F = [L.finalLeft, L.finalRight - L.finalLeft];
		st = zoomBlend(st, F, easeInOut(clamp((t - 15.5) / 1.6)));
	}
	const [left, span] = st;
	const ppd = win / span;
	const now = nowDay(t);
	const x = (day) => L.X0 + (day - left) * ppd;
	const k = kAt(t) * L.kScale;
	const lref = levelSmooth(left);
	return {span, ppd, now, left, x, playX: x(now), k, lref};
}
const kKeys = monotone([[0, 4.4], [3.6, 4.4], [4.85, 15], [9.2, 15], [12.0, 13], [13.5, 10], [14.5, 8], [15.5, 5.0], [16.4, 3.0], [DUR, 3.0]]);
export const kAt = (t) => kKeys(t);
