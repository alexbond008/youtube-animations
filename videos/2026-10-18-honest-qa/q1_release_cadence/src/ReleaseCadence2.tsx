import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {
	FPS, REAL, PROJ, ALL, TODAY, DAY_2035, T_WEEK, T_2DAY, CARD_TIMES, LAB_ORDER, camera, level, clamp, smooth,
	easeOut, dayOf, fmtDate,
} from './model2.js';

const INTER = loadInter('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
const MONO = loadMono('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily;

const C = {
	bg: '#0E0E10', dot: '#23232A', card: '#16161A', border: '#2A2A30', borderStrong: '#3A3A42',
	text: '#F5F5F7', text2: '#A1A1AA', text3: '#6B6B75', accent: '#D97757',
};
// four muted lab colours (plain text legend, no logos)
const LAB_COLOR: Record<string, string> = {
	OpenAI: '#74C7A5', Anthropic: '#E3B58C', Google: '#7FA9E6', xAI: '#B79BE0',
};
const TEXT_SHADOW = '0 4px 24px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.6)';
const CARD_SHADOW = '0 20px 60px rgba(0,0,0,.55)';
const F = (n: number) => n / FPS;

export type Layout2 = {
	W: number; H: number; X0: number; X1: number;
	stripY: number; stripH: number; rowBottoms: number[];
	cardW: number; cardH: number; cs: number; base: number; kScale: number;
	labelX: number; labelY: number; labelSize: number; eyebrowY: number;
	bigSize: number; bigBaseline: number;
	histLeft: number; histRight: number; recentLeft: number; recentSpan: number; recentPlayF: number;
	finalLeft: number; finalRight: number;
	kFollow: number; tagSize: number; tagRows: number; tagRowH: number; markY: number; legendSize: number; chartTop: number;
};
export const LANDSCAPE2: Layout2 = {
	W: 1920, H: 1080, X0: 160, X1: 1760, stripY: 868, stripH: 84, rowBottoms: [828, 712],
	cardW: 300, cardH: 96, cs: 1, base: 580, kScale: 1.15,
	labelX: 160, labelY: 112, labelSize: 92, eyebrowY: 66, bigSize: 176, bigBaseline: 330,
	histLeft: dayOf(2022, 10, 1), histRight: dayOf(2026, 11, 15),
	recentLeft: dayOf(2026, 7, 8), recentSpan: 120, recentPlayF: 0.8,
	finalLeft: dayOf(2022, 10, 1), finalRight: dayOf(2035, 6, 1),
	kFollow: 1, tagSize: 23, tagRows: 4, tagRowH: 36, markY: 236, legendSize: 22, chartTop: 230,
};
export const VERTICAL2: Layout2 = {
	W: 1080, H: 1350, X0: 90, X1: 990, stripY: 1100, stripH: 84, rowBottoms: [1060, 940, 820],
	cardW: 310, cardH: 96, cs: 1, base: 660, kScale: 1.45,
	labelX: 90, labelY: 150, labelSize: 96, eyebrowY: 100, bigSize: 168, bigBaseline: 420,
	histLeft: dayOf(2022, 10, 1), histRight: dayOf(2026, 11, 20),
	recentLeft: dayOf(2026, 7, 12), recentSpan: 112, recentPlayF: 0.8,
	finalLeft: dayOf(2022, 10, 1), finalRight: dayOf(2035, 10, 1),
	kFollow: 0.72, tagSize: 24, tagRows: 6, tagRowH: 38, markY: 740, legendSize: 24, chartTop: 320,
};

// month starts (day index) Oct 2022 → 2036
const MONTHS: {day: number; m: number; y: number}[] = (() => {
	const out = [];
	for (let y = 2022; y <= 2036; y++) for (let m = 1; m <= 12; m++) if (y > 2022 || m >= 10) out.push({day: dayOf(y, m, 1), m: m - 1, y});
	return out;
})();
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const prog = (t: number, start: number, frames: number) => easeOut(clamp((t - start) / F(frames)));
const textW = (s: string, fs: number, k = 0.56) => s.length * fs * k;

type Rel = (typeof ALL)[number] & {lab?: string; label?: string; labelPriority?: number; card?: string; cardIdx?: number; date?: string; pre?: boolean; t: number};

// 1-D relaxation so cards in a row don't overlap but stay near their tick
function relax(targets: number[], minGap: number, lo: number, hi: number) {
	const p = [...targets];
	for (let it = 0; it < 80; it++) {
		for (let i = 0; i < p.length - 1; i++) {
			const ov = minGap - (p[i + 1] - p[i]);
			if (ov > 0) { p[i] -= ov / 2; p[i + 1] += ov / 2; }
		}
		for (let i = 0; i < p.length; i++) p[i] = clamp(p[i], lo, hi);
	}
	return p;
}

export const ReleaseCadence2: React.FC<{layout: Layout2; showText: boolean}> = ({layout: L, showText}) => {
	const frame = useCurrentFrame();
	const t = Math.min(frame / FPS, 18.0);
	const cam = camera(L, t);
	const {x, ppd, lref} = cam;
	const k = cam.k * (1 + (L.kFollow - 1) * smooth(9.6, 11.5, t) * (1 - smooth(15.6, 16.8, t)));
	const yOf = (day: number) => L.base - k * (level(day) - lref);
	const xToday = x(TODAY);

	// ---------- intro ----------
	const stripIn = prog(t, 0.15, 14);
	const ticksIn = (xx: number) => easeOut(clamp((t - 0.45 - ((xx - L.X0) / (L.X1 - L.X0)) * 0.5) / F(10)));
	const curveDraw = easeOut(clamp((t - 0.9) / 1.2));
	const headIn = prog(t, 1.95, 10);
	const frontierPill = prog(t, 2.25, 10) * (1 - prog(t, 9.85, 8) + prog(t, 11.0, 10)) * (1 - prog(t, L.W < 1500 ? 14.2 : 15.4, 8));
	const eyebrowIn = prog(t, 0.1, 10);
	const legendIn = prog(t, 0.6, 12);

	// ---------- curve (solid = real, dashed = projection past TODAY) ----------
	const xStart = L.X0 - 80;
	const xHead = cam.playX;
	const xEnd = xStart + (xHead - xStart) * curveDraw;
	const real: [number, number][] = [];
	const proj: [number, number][] = [];
	let exitX: number | null = null;
	if (xEnd > xStart + 1) {
		for (let xx = xStart; ; xx += 2) {
			const cx = Math.min(xx, xEnd);
			const day = cam.left + (cx - L.X0) / ppd;
			let y = yOf(day);
			const stop = y < -300;
			y = Math.max(y, -300);
			if (day <= TODAY) real.push([cx, y]);
			else {
				if (!proj.length && real.length) proj.push(real[real.length - 1]);
				proj.push([cx, y]);
			}
			if (stop) exitX = cx;
			if (cx >= xEnd || stop) break;
		}
	}
	const toPath = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
	const allPts = [...real, ...proj.slice(real.length ? 1 : 0)];
	const areaPath = allPts.length
		? `${toPath(allPts)}L${allPts[allPts.length - 1][0].toFixed(1)},${L.base + 8}L${allPts[0][0].toFixed(1)},${L.base + 8}Z`
		: '';
	const headDay = cam.left + (xEnd - L.X0) / ppd;
	const headY = yOf(headDay);
	const headVisible = headY > -40;
	const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);

	const mask = `linear-gradient(90deg, transparent 0px, transparent ${L.X0 - 90}px, #000 ${L.X0 + 10}px, #000 ${L.X1 - 10}px, transparent ${L.X1 + 90}px)`;
	const maskStyle: React.CSSProperties = {WebkitMaskImage: mask, maskImage: mask};

	// ---------- strip ----------
	const sTop = L.stripY;
	const right = cam.left + (L.X1 + 120 - L.X0) / ppd;
	const leftD = cam.left - 120 / ppd;
	const monthOp = smooth(72, 100, ppd * 30.4);
	const monthTickOp = smooth(8, 20, ppd * 30.4);
	const monthsVis = MONTHS.filter((m) => m.day > leftD && m.day < right);
	const yearLabelEvery = ppd * 365 < 85 ? 2 : 1;

	const rels = ALL as Rel[];
	const landed = rels.filter((r) => r.pre || r.t <= t + F(12));
	const tickW = clamp(ppd * 1.5, 3, 10);
	const cards = (REAL as Rel[]).filter((r) => r.card).sort((a, b) => (a.cardIdx ?? 0) - (b.cardIdx ?? 0));
	const cardZoomFade = 1 - smooth(150, 190, cam.span * (120 / L.recentSpan));
	const latestCard = [...cards].reverse().find((r) => t >= r.t);

	// card positions (row = index mod rows), relaxed per row
	const nRows = L.rowBottoms.length;
	const cardX = new Map<number, number>();
	for (let row = 0; row < nRows; row++) {
		const inRow = cards.filter((r) => (r.cardIdx ?? 0) % nRows === row);
		const pos = relax(inRow.map((r) => x(r.day)), L.cardW + 14, L.X0 - 40 + L.cardW / 2, L.X1 + 40 - L.cardW / 2);
		inRow.forEach((r, i) => cardX.set(r.i, pos[i]));
	}

	// ---------- key-release name tags (phase A) ----------
	const tagFade = 1 - prog(t, 3.45, 10);
	const tagRels = (REAL as Rel[]).filter((r) => r.label).sort((a, b) => (a.labelPriority ?? 9) - (b.labelPriority ?? 9));
	type Tag = {r: Rel; text: string; x0: number; w: number; row: number; tx: number};
	const tags: Tag[] = [];
	if (t < 4.0 || t > 16.0) {
		const placed: {x0: number; w: number; row: number; tx: number}[] = [];
		const fits = (x0: number, w: number, row: number, tx: number) => placed.every((q) => {
			if (q.row === row) return x0 + w + 18 < q.x0 || x0 > q.x0 + q.w + 18;
			if (q.row < row) return tx < q.x0 - 8 || tx > q.x0 + q.w + 8; // my leader would cross a lower label
			return q.tx < x0 - 8 || q.tx > x0 + w + 8; // a higher label's leader would cross me
		});
		for (const r of tagRels) {
			const isStart = r.labelPriority === 0;
			if (t > 16.0 && !isStart) continue;
			const text = isStart ? 'ChatGPT · Nov 2022' : r.label!;
			const w = textW(text, L.tagSize, isStart ? 0.6 : 0.56) + 8;
			const tx = x(r.day);
			let x0 = isStart ? tx - 10 : tx - w / 2;
			x0 = clamp(x0, L.X0 - 30, L.X1 + 30 - w);
			let row = -1;
			const rowOrder = isStart ? [L.tagRows - 1] : Array.from({length: L.tagRows}, (_, i) => i);
			for (const rr of rowOrder) {
				if (fits(x0, w, rr, tx)) { row = rr; break; }
			}
			if (row < 0) continue;
			placed.push({x0, w, row, tx});
			tags.push({r, text, x0, w, row, tx});
		}
	}

	// ---------- labels ----------
	const labelStates = [
		{text: '2–3 weeks', t0: 7.6},
		{text: 'week', t0: T_WEEK},
		{text: '2 days', t0: T_2DAY},
	];
	const labelPop = prog(t, 7.6, 10);
	const labelOut = prog(t, 15.55, 8);
	const bigIn = prog(t, 16.55, 12);
	const qIn = prog(t, 16.8, 10);
	const x2035 = x(DAY_2035);
	const futureIn = smooth(16.2, 17.0, t);
	const todayIn = prog(t, 9.95, 10);
	const projIn = prog(t, 10.35, 10);
	const markY = L.markY + (L.stripY - 46 - L.markY) * smooth(15.6, 16.6, t);
	const startMarkIn = prog(t, 16.3, 10);

	return (
		<AbsoluteFill style={{backgroundColor: C.bg, backgroundImage: `radial-gradient(circle at 12px 12px, ${C.dot} 1.2px, transparent 1.7px)`,
			backgroundSize: '24px 24px', fontFamily: INTER, overflow: 'hidden'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(14,14,16,0) 55%, rgba(8,8,10,.55) 100%)'}} />

			{/* eyebrow */}
			<div style={{position: 'absolute', left: L.labelX, top: L.eyebrowY, fontFamily: MONO, fontSize: 24, color: C.text2, letterSpacing: 0.3,
				opacity: eyebrowIn * (1 - prog(t, 15.55, 8)), transform: `translateY(${(1 - eyebrowIn) * 8}px)`}}>
				<span style={{color: C.accent}}>●</span>&nbsp; frontier model releases
			</div>

			{/* ---------- chart ---------- */}
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle}}>
				<defs>
					<linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={C.accent} stopOpacity={0.24} />
						<stop offset="1" stopColor={C.accent} stopOpacity={0} />
					</linearGradient>
					<linearGradient id="playline" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={C.accent} stopOpacity={0.55} />
						<stop offset="1" stopColor={C.accent} stopOpacity={0.05} />
					</linearGradient>
					<radialGradient id="headglow">
						<stop offset="0" stopColor={C.accent} stopOpacity={0.55} />
						<stop offset="1" stopColor={C.accent} stopOpacity={0} />
					</radialGradient>
					<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
					<pattern id="hatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
						<line x1="0" y1="0" x2="0" y2="18" stroke={C.accent} strokeWidth="2" strokeOpacity="0.10" />
					</pattern>
					<linearGradient id="projfade" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#fff" stopOpacity="0" />
						<stop offset="0.25" stopColor="#fff" stopOpacity="1" />
						<stop offset="1" stopColor="#fff" stopOpacity="1" />
					</linearGradient>
					<mask id="projmask"><rect x="0" y={L.chartTop - 40} width={L.W} height={sTop + L.stripH - L.chartTop + 40} fill="url(#projfade)" /></mask>
				</defs>

				{/* projection region past TODAY (hatched) */}
				{projIn > 0 && (
					<g opacity={projIn} mask="url(#projmask)">
						<rect x={xToday} y={L.chartTop - 40} width={Math.max(0, L.X1 + 120 - xToday)} height={sTop + L.stripH - L.chartTop + 40} fill="url(#hatch)" />
					</g>
				)}

				{areaPath && <path d={areaPath} fill="url(#area)" />}

				{/* today marker */}
				{todayIn > 0 && (
					<line x1={xToday} x2={xToday} y1={markY - 30} y2={sTop - 2} stroke={C.text2} strokeWidth={2} strokeDasharray="5 7" opacity={0.75 * todayIn} />
				)}

				{/* playhead */}
				{headIn > 0 && (
					<line x1={xHead} x2={xHead} y1={Math.max(headY, -20)} y2={sTop} stroke="url(#playline)" strokeWidth={2}
						opacity={headIn * (1 - smooth(15.6, 16.3, t))} />
				)}

				{/* frontier curve */}
				{real.length > 1 && (
					<>
						<path d={toPath(real)} fill="none" stroke={C.accent} strokeWidth={10} strokeOpacity={0.35} strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
						<path d={toPath(real)} fill="none" stroke={C.accent} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
					</>
				)}
				{proj.length > 1 && (
					<>
						<path d={toPath(proj)} fill="none" stroke={C.accent} strokeWidth={10} strokeOpacity={0.22} strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
						<path d={toPath(proj)} fill="none" stroke={C.accent} strokeWidth={4.5} strokeDasharray="12 10" strokeLinecap="round" />
					</>
				)}
				{headVisible && headIn > 0 && (
					<g opacity={headIn}>
						<circle cx={xEnd} cy={headY} r={34 + 6 * breathe} fill="url(#headglow)" />
						<circle cx={xEnd} cy={headY} r={9 * (0.6 + 0.4 * headIn)} fill={C.accent} />
						<circle cx={xEnd} cy={headY} r={4} fill="#FFE9DF" />
					</g>
				)}
				{exitX !== null && (
					<ellipse cx={exitX} cy={-10} rx={190} ry={120} fill="url(#headglow)" opacity={0.55 * smooth(15.7, 16.2, t)} />
				)}

				{/* future: dashed marker up to "2035 ?" */}
				{futureIn > 0 && (
					<g opacity={futureIn}>
						<line x1={x2035} x2={x2035} y1={L.bigBaseline + 40} y2={sTop - 6} stroke={C.accent} strokeWidth={2} strokeDasharray="6 9" opacity={0.75 * bigIn} />
						<circle cx={x2035} cy={sTop - 6} r={6} fill={C.accent} opacity={bigIn} />
					</g>
				)}

				{/* name tags on key releases (phase A) + start marker (final) */}
				{tags.map((g) => {
					const isStart = g.r.labelPriority === 0;
					const op = t > 16.0 ? startMarkIn : clamp((xEnd - g.tx + 40) / 70) * tagFade * stripIn;
					if (op <= 0.01) return null;
					const yb = sTop - 22 - g.row * L.tagRowH;
					const col = LAB_COLOR[g.r.lab as string];
					return (
						<g key={`tag${g.r.i}`} opacity={op}>
							<line x1={g.tx} x2={g.tx} y1={yb + 7} y2={sTop - 2} stroke={col} strokeWidth={1.5} strokeOpacity={0.55} />
							<text x={g.x0 + 4} y={yb} fontFamily={isStart ? MONO : INTER} fontSize={isStart ? L.tagSize - 1 : L.tagSize}
								fontWeight={isStart ? 500 : 600} fill={isStart ? C.text : col}
								style={{paintOrder: 'stroke'}} stroke={C.bg} strokeWidth={6} strokeLinejoin="round">{g.text}</text>
						</g>
					);
				})}
			</svg>

			{/* today / projection captions */}
			{todayIn > 0 && (
				<div style={{position: 'absolute', left: xToday - 14, top: markY - 30 - 34, transform: 'translateX(-100%)', fontFamily: MONO, fontSize: 22,
					color: C.text2, whiteSpace: 'nowrap', opacity: todayIn}}>today</div>
			)}
			{projIn > 0 && (
				<div style={{position: 'absolute', left: xToday + 14, top: markY - 30 - 34, fontFamily: MONO, fontSize: 22, color: C.accent,
					whiteSpace: 'nowrap', opacity: projIn * clamp((L.X1 + 60 - xToday - 150) / 60)}}>projection →</div>
			)}

			{/* ---------- strip ---------- */}
			<div style={{position: 'absolute', left: L.X0 - 40, top: sTop, width: L.X1 - L.X0 + 80, height: L.stripH, background: C.card,
				border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, opacity: stripIn, transform: `translateX(${(1 - stripIn) * 140}px)`}} />
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle, opacity: stripIn, transform: `translateX(${(1 - stripIn) * 140}px)`}}>
				<defs>
					<clipPath id="stripclip"><rect x={L.X0 - 38} y={sTop} width={L.X1 - L.X0 + 76} height={L.stripH} rx={16} /></clipPath>
				</defs>
				<g clipPath="url(#stripclip)">
					{projIn > 0 && <rect x={xToday} y={sTop} width={Math.max(0, L.X1 + 120 - xToday)} height={L.stripH} fill="url(#hatch)" opacity={projIn} />}
					{monthsVis.map((m) => {
						const xx = x(m.day);
						const isYear = m.m === 0;
						const op = (isYear ? 1 : monthTickOp) * ticksIn(xx);
						if (op < 0.01) return null;
						const showYearText = isYear && (yearLabelEvery === 1 || m.y % 2 === 1);
						const showMonthText = !isYear && monthOp > 0.01;
						return (
							<g key={`m${m.day}`} opacity={op}>
								<line x1={xx} x2={xx} y1={sTop + (isYear ? 12 : 38)} y2={sTop + 50} stroke={isYear ? C.text3 : C.borderStrong} strokeWidth={isYear ? 2 : 1.5} />
								{(showYearText || showMonthText) && (
									<text x={xx + 8} y={sTop + 72} fontFamily={INTER} fontSize={22} fontWeight={isYear ? 700 : 500} fill={isYear ? C.text : C.text2}
										opacity={isYear ? 1 : monthOp}>
										{isYear ? String(m.y) : MONTH_NAMES[m.m]}
									</text>
								)}
							</g>
						);
					})}
				</g>
			</svg>

			{/* ---------- release ticks ---------- */}
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle}}>
				<defs>
					<filter id="tickglow2" x="-20%" y="-200%" width="140%" height="500%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
						<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
					</filter>
				</defs>
				<clipPath id="tickclip"><rect x={L.X0 - 36} y={0} width={L.X1 - L.X0 + 72} height={L.H} /></clipPath>
				<g clipPath="url(#tickclip)">
				<g filter="url(#tickglow2)">
					{landed.map((r) => {
						const xx = x(r.day);
						if (xx < L.X0 - 120 || xx > L.X1 + 120) return null;
						const col = r.real ? LAB_COLOR[r.lab as string] : C.accent;
						if (r.pre) {
							const p = ticksIn(xx) * stripIn;
							if (p <= 0) return null;
							return <rect key={`t${r.i}`} x={xx - tickW / 2} y={sTop + 10} width={tickW} height={24} rx={Math.min(2, tickW / 2)} fill={col} opacity={p} />;
						}
						if (r.card) {
							const p = prog(t, r.t + F(7), 6);
							if (p <= 0) return null;
							return <rect key={`t${r.i}`} x={xx - tickW / 2} y={sTop + 10} width={tickW} height={24} rx={Math.min(3, tickW / 2)} fill={col} opacity={p} />;
						}
						const p = easeOut(clamp((t - r.t + F(8)) / F(8)));
						if (p <= 0) return null;
						const fall = r.t < T_WEEK ? 120 : r.t < T_2DAY ? 56 : 0;
						const yy = sTop + 10 - (1 - p) * fall;
						const baseOp = r.real ? 1 : 0.8;
						return <rect key={`t${r.i}`} x={xx - tickW / 2} y={yy} width={tickW} height={24 + (1 - p) * (fall / 9)}
							rx={Math.min(3, tickW / 2)} fill={col} opacity={(0.35 + 0.65 * p) * baseOp} />;
					})}
				</g>
				{landed.map((r) => {
					if (r.pre) return null;
					const tr = r.t + (r.card ? F(7) : 0);
					const u = (t - tr) / F(16);
					if (u < 0 || u > 1) return null;
					const big = r.card ? 1 : 0.6;
					const col = r.real ? LAB_COLOR[r.lab as string] : C.accent;
					return <circle key={`p${r.i}`} cx={x(r.day)} cy={sTop + 22} r={(6 + 26 * easeOut(u)) * big} fill="none" stroke={col} strokeWidth={2} opacity={(1 - u) * 0.8} />;
				})}
				</g>
			</svg>

			{/* ---------- release cards (real recent releases) ---------- */}
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle}}>
				{cards.filter((r) => t >= r.t - F(4)).map((r) => {
					const p = prog(t, r.t - F(4), 11);
					if (p <= 0 || cardZoomFade <= 0.001) return null;
					const row = (r.cardIdx ?? 0) % nRows;
					const bottom = L.rowBottoms[row];
					const cx = cardX.get(r.i)!;
					const tx = x(r.day);
					const yb = bottom + (1 - p) * -64;
					return <line key={`s${r.i}`} x1={cx} y1={yb} x2={tx} y2={sTop + 4} stroke={C.borderStrong} strokeWidth={1.5} opacity={p * cardZoomFade} />;
				})}
			</svg>
			<div style={{position: 'absolute', inset: 0, ...maskStyle}}>
				{cards.filter((r) => t >= r.t - F(4)).map((r) => {
					const p = prog(t, r.t - F(4), 11);
					if (p <= 0 || cardZoomFade <= 0.001) return null;
					const row = (r.cardIdx ?? 0) % nRows;
					const bottom = L.rowBottoms[row];
					const cx = cardX.get(r.i)!;
					const isLatest = latestCard?.i === r.i;
					const next = cards[(r.cardIdx ?? 0) + 1];
					const hl = isLatest ? 1 : 1 - prog(t, next ? next.t : 99, 14);
					const col = LAB_COLOR[r.lab as string];
					const [dd, mm, yy] = fmtDate(r.date as string).split(' ');
					return (
						<div key={`k${r.i}`} style={{position: 'absolute', left: cx - L.cardW / 2, top: bottom - L.cardH, width: L.cardW, height: L.cardH,
							opacity: p * cardZoomFade, transform: `translateY(${(1 - p) * -64}px) scale(${0.92 + 0.08 * p})`, transformOrigin: '50% 100%',
							background: C.card, borderRadius: 16, border: `1px solid ${hl > 0.02 ? mix(C.border, C.accent, hl) : C.border}`,
							boxShadow: `${CARD_SHADOW}${hl > 0.02 ? `, 0 0 ${24 * hl}px rgba(217,119,87,${0.28 * hl})` : ''}`,
							padding: `${13 * L.cs}px ${18 * L.cs}px`, boxSizing: 'border-box'}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 10 * L.cs, fontFamily: MONO, fontSize: 20 * L.cs, color: C.text2, lineHeight: `${24 * L.cs}px`}}>
								<span style={{width: 10 * L.cs, height: 10 * L.cs, borderRadius: 5 * L.cs, background: col, flex: 'none'}} />
								<span style={{color: col}}>{r.lab}</span>
								<span style={{marginLeft: 'auto', color: C.text2, fontSize: 18 * L.cs, whiteSpace: 'nowrap'}}>{dd} {mm} {yy}</span>
							</div>
							<div style={{marginTop: 9 * L.cs, fontSize: 26 * L.cs, fontWeight: 700, color: C.text, letterSpacing: -0.3, lineHeight: `${32 * L.cs}px`, whiteSpace: 'nowrap'}}>
								{r.card}
							</div>
						</div>
					);
				})}
			</div>

			{/* "frontier" tag */}
			{headVisible && frontierPill > 0 && (
				<div style={{position: 'absolute', left: xEnd - 18, top: headY - 66, transform: `translateX(-100%) translateY(${(1 - frontierPill) * 8}px)`,
					opacity: frontierPill, fontFamily: MONO, fontSize: 22, color: C.accent, padding: '6px 12px', background: 'rgba(217,119,87,0.10)',
					border: '1px solid rgba(217,119,87,0.35)', borderRadius: 10, whiteSpace: 'nowrap'}}>frontier</div>
			)}

			{/* legend (plain text, no logos) */}
			<div style={{position: 'absolute', left: L.X0 - 20, top: sTop + L.stripH + 22, display: 'flex', gap: L.legendSize * 1.3, fontFamily: MONO,
				fontSize: L.legendSize, color: C.text2, opacity: legendIn, whiteSpace: 'nowrap'}}>
				{LAB_ORDER.map((lab) => (
					<span key={lab} style={{display: 'flex', alignItems: 'center', gap: 10}}>
						<span style={{width: 12, height: 22, borderRadius: 3, background: LAB_COLOR[lab]}} />{lab}
					</span>
				))}
			</div>

			{/* house label */}
			{showText && labelPop > 0 && labelOut < 1 && (
				<div style={{position: 'absolute', left: L.labelX, top: L.labelY, display: 'flex', fontSize: L.labelSize, fontWeight: 800, color: '#FFFFFF',
					letterSpacing: -L.labelSize * 0.02, lineHeight: 1.1, textShadow: TEXT_SHADOW, whiteSpace: 'nowrap',
					opacity: labelPop * (1 - labelOut), transform: `scale(${0.92 + 0.08 * labelPop})`, transformOrigin: '0% 50%'}}>
					<span>Every</span>
					<span style={{position: 'relative', display: 'inline-block', width: L.labelSize * 4.6, height: '1.1em', marginLeft: '0.26em'}}>
						{labelStates.map((s, i) => {
							const a = i === 0 ? 1 : prog(t, s.t0, 10);
							const nx = labelStates[i + 1];
							const d = nx ? prog(t, nx.t0, 7) : 0;
							const op = a * (1 - d);
							if (op <= 0.001) return null;
							const dy = (1 - a) * 0.45 * L.labelSize - d * 0.45 * L.labelSize;
							return (
								<span key={s.text} style={{position: 'absolute', left: 0, top: 0, color: C.accent, opacity: op, transform: `translateY(${dy}px)`,
									filter: `blur(${(1 - a) * 6 + d * 6}px)`}}>{s.text}</span>
							);
						})}
					</span>
				</div>
			)}

			{/* "2035 ?" */}
			{bigIn > 0 && (
				<div style={{position: 'absolute', right: L.W - L.X1, top: L.bigBaseline - L.bigSize, fontSize: L.bigSize, fontWeight: 800, color: C.accent,
					letterSpacing: -L.bigSize * 0.03, lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 4px 24px rgba(0,0,0,.55), 0 0 60px rgba(217,119,87,.25)',
					opacity: bigIn, transform: `scale(${0.92 + 0.08 * bigIn})`, transformOrigin: '100% 100%'}}>
					2035<span style={{display: 'inline-block', marginLeft: L.bigSize * 0.18, opacity: qIn, transform: `translateY(${(1 - qIn) * 20}px)`}}>?</span>
				</div>
			)}
		</AbsoluteFill>
	);
};

function mix(a: string, b: string, u: number) {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(u))).join(',')})`;
}
export const _unused = [REAL, PROJ, CARD_TIMES];
