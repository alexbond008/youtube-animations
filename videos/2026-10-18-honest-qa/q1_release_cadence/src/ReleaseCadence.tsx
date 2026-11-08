import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {
	FPS, RELEASES, DAY_2035, T_WEEK, T_2DAY, camera, level, clamp, smooth, easeOut, nowDay,
} from './model.js';

const INTER = loadInter('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
const MONO = loadMono('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily;

// ---- spec tokens ----
const C = {
	bg: '#0E0E10', dot: '#23232A', card: '#16161A', border: '#2A2A30', borderStrong: '#3A3A42',
	text: '#F5F5F7', text2: '#A1A1AA', text3: '#6B6B75', accent: '#D97757',
	blue: '#4DA3FF', green: '#3DDC97', red: '#FF5A4E', amber: '#F5B800',
};
const LAB_COLOR: Record<string, string> = {'Lab A': C.blue, 'Lab B': C.green, 'Lab C': C.amber, 'Lab D': C.red};
const TEXT_SHADOW = '0 4px 24px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.6)';
const CARD_SHADOW = '0 20px 60px rgba(0,0,0,.55)';
const F = (n: number) => n / FPS; // frames → seconds

export type Layout = {
	W: number; H: number; X0: number; X1: number;
	stripY: number; stripH: number; rowBottoms: [number, number];
	cardW: number; cardH: number; cs: number; base: number; kScale: number; spanScale: number;
	labelX: number; labelY: number; labelSize: number; eyebrowY: number;
	bigSize: number; bigBaseline: number;
};
export const LANDSCAPE: Layout = {
	W: 1920, H: 1080, X0: 160, X1: 1760, stripY: 868, stripH: 84, rowBottoms: [828, 714],
	cardW: 272, cardH: 92, cs: 1, base: 580, kScale: 1.15, spanScale: 1,
	labelX: 160, labelY: 112, labelSize: 92, eyebrowY: 66, bigSize: 176, bigBaseline: 330,
};
export const VERTICAL: Layout = {
	W: 1080, H: 1350, X0: 90, X1: 990, stripY: 1100, stripH: 84, rowBottoms: [1060, 922],
	cardW: 326, cardH: 110, cs: 1.2, base: 770, kScale: 1.45, spanScale: 0.62,
	labelX: 90, labelY: 150, labelSize: 96, eyebrowY: 100, bigSize: 168, bigBaseline: 420,
};

// month starts (day index from 1 Jan 2026) through 2035
const MONTHS: {day: number; m: number; y: number}[] = (() => {
	const out = [];
	let d = 0;
	for (let y = 2026; y <= 2036; y++) {
		for (let m = 0; m < 12; m++) {
			out.push({day: d, m, y});
			const leap = y % 4 === 0;
			d += [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
		}
	}
	return out;
})();
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const prog = (t: number, start: number, frames: number) => easeOut(clamp((t - start) / F(frames)));

export const ReleaseCadence: React.FC<{layout: Layout; showText: boolean}> = ({layout: L, showText}) => {
	const frame = useCurrentFrame();
	// all motion finishes by 18.0 s; the last second is a held clean frame
	const t = Math.min(frame / FPS, 18.0);
	const cam = camera(L, t);
	const {x, ppd, k} = cam;
	const now = cam.now;
	const yOf = (day: number) => L.base - k * level(day);

	// ---------- intro ----------
	const stripIn = prog(t, 0.15, 14);
	const ticksIn = (xx: number) => easeOut(clamp((t - 0.45 - ((xx - L.X0) / (L.X1 - L.X0)) * 0.5) / F(10)));
	const curveDraw = easeOut(clamp((t - 0.9) / 1.2));
	const headIn = prog(t, 1.95, 10);
	const frontierPill = prog(t, 2.25, 10) * (1 - prog(t, 15.4, 8));
	const eyebrowIn = prog(t, 0.1, 10);

	// ---------- curve ----------
	const xStart = L.X0 - 80;
	const xHead = cam.playX;
	const xEnd = xStart + (xHead - xStart) * curveDraw;
	const pts: [number, number][] = [];
	if (xEnd > xStart + 1) {
		for (let xx = xStart; ; xx += 2) {
			const cx = Math.min(xx, xEnd);
			const day = cam.left + (cx - L.X0) / ppd;
			let y = yOf(day);
			const stop = y < -300;
			y = Math.max(y, -300);
			pts.push([cx, y]);
			if (cx >= xEnd || stop) break;
		}
	}
	const linePath = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
	const areaPath = pts.length
		? `${linePath}L${pts[pts.length - 1][0].toFixed(1)},${L.base + 8}L${pts[0][0].toFixed(1)},${L.base + 8}Z`
		: '';
	const headDay = cam.left + (xEnd - L.X0) / ppd;
	const headY = yOf(headDay);
	const headVisible = headY > -40;
	const exitX = pts.length && pts[pts.length - 1][1] <= -299 ? pts[pts.length - 1][0] : null;
	const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);

	// ---------- edge mask for scrolling content ----------
	const mask = `linear-gradient(90deg, transparent 0px, transparent ${L.X0 - 90}px, #000 ${L.X0 + 10}px, #000 ${L.X1 - 10}px, transparent ${L.X1 + 90}px)`;
	const maskStyle: React.CSSProperties = {WebkitMaskImage: mask, maskImage: mask};

	// ---------- strip contents ----------
	const sTop = L.stripY;
	const right = cam.left + (L.X1 + 120 - L.X0) / ppd;
	const leftD = cam.left - (120 / ppd);
	const weekOp = smooth(9, 18, ppd * 7);
	const monthOp = smooth(72, 110, ppd * 30.4);
	const weekTicks: number[] = [];
	if (weekOp > 0.01) for (let d = Math.ceil(leftD / 7) * 7; d < right; d += 7) weekTicks.push(d);
	const monthsVis = MONTHS.filter((m) => m.day > leftD && m.day < right);

	// releases that have happened
	const landed = RELEASES.filter((r) => r.pre || r.t <= t + F(12));
	const tickW = clamp(ppd * 1.5, 1.6, 10);
	const cardIdx = new Map<number, number>();
	let ci = 0;
	for (const r of RELEASES) if (r.card) cardIdx.set(r.i, ci++);
	const relT = (r: (typeof RELEASES)[number]) => (r.pre ? 1.45 : r.t);
	// index of the most recent landed card (gets the accent border)
	const latestCard = [...landed].reverse().find((r) => r.card && t >= relT(r));
	const cardZoomFade = 1 - smooth(140, 185, cam.span / L.spanScale);

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

	return (
		<AbsoluteFill
			style={{
				backgroundColor: C.bg,
				backgroundImage: `radial-gradient(circle at 12px 12px, ${C.dot} 1.2px, transparent 1.7px)`,
				backgroundSize: '24px 24px',
				fontFamily: INTER,
				overflow: 'hidden',
			}}
		>
			{/* soft vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(14,14,16,0) 55%, rgba(8,8,10,.55) 100%)'}} />

			{/* eyebrow (chart label, AI layer) */}
			<div
				style={{
					position: 'absolute', left: L.labelX, top: L.eyebrowY, fontFamily: MONO, fontSize: 24,
					color: C.text2, letterSpacing: 0.3, opacity: eyebrowIn * (1 - prog(t, 15.55, 8)),
					transform: `translateY(${(1 - eyebrowIn) * 8}px)`,
				}}
			>
				<span style={{color: C.accent}}>●</span>&nbsp; frontier model releases
			</div>

			{/* ---------- chart SVG (scrolling, masked at the edges) ---------- */}
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle}}>
				<defs>
					<linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={C.accent} stopOpacity={0.26} />
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
					<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="7" />
					</filter>
					<filter id="tickglow" x="-20%" y="-200%" width="140%" height="500%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
						<feMerge>
							<feMergeNode in="b" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* area + connectors */}
				{areaPath && <path d={areaPath} fill="url(#area)" />}
				{landed.filter((r) => r.card).map((r) => {
					const p = prog(t, relT(r) + F(6), 12);
					if (p <= 0 || cardZoomFade <= 0) return null;
					const row = (cardIdx.get(r.i) ?? 0) % 2;
					const yTop = L.rowBottoms[row] - L.cardH;
					const cx = x(r.day);
					const yC = yOf(r.day + 5) + 10;
					return (
						<line key={`c${r.i}`} x1={cx} x2={cx} y1={yTop} y2={yTop + (yC - yTop) * p}
							stroke={C.borderStrong} strokeWidth={1.5} strokeDasharray="4 6" opacity={cardZoomFade} />
					);
				})}

				{/* playhead line from strip to the frontier head */}
				{headIn > 0 && (
					<line x1={xHead} x2={xHead} y1={Math.max(headY, -20)} y2={sTop}
						stroke="url(#playline)" strokeWidth={2} opacity={headIn * (1 - smooth(15.6, 16.3, t))} />
				)}

				{/* frontier curve */}
				{linePath && (
					<>
						<path d={linePath} fill="none" stroke={C.accent} strokeWidth={10} strokeOpacity={0.35}
							strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
						<path d={linePath} fill="none" stroke={C.accent} strokeWidth={4.5}
							strokeLinejoin="round" strokeLinecap="round" />
					</>
				)}
				{headVisible && headIn > 0 && (
					<g opacity={headIn}>
						<circle cx={xEnd} cy={headY} r={34 + 6 * breathe} fill="url(#headglow)" />
						<circle cx={xEnd} cy={headY} r={9 * (0.6 + 0.4 * headIn)} fill={C.accent} />
						<circle cx={xEnd} cy={headY} r={4} fill="#FFE9DF" />
					</g>
				)}

				{/* exit glow where the curve leaves the top of frame */}
				{exitX !== null && (
					<ellipse cx={exitX} cy={-10} rx={190} ry={120} fill="url(#headglow)" opacity={0.55 * smooth(15.7, 16.2, t)} />
				)}

				{/* future region (phase 4): dashed marker up to "2035 ?" */}
				{futureIn > 0 && (
					<g opacity={futureIn}>
						<line x1={xHead + 16} x2={x2035 - 10} y1={sTop + 22} y2={sTop + 22}
							stroke={C.accent} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" opacity={0.55} />
						<line x1={x2035} x2={x2035} y1={L.bigBaseline + 40} y2={sTop - 6}
							stroke={C.accent} strokeWidth={2} strokeDasharray="6 9" opacity={0.75 * bigIn} />
						<circle cx={x2035} cy={sTop - 6} r={6} fill={C.accent} opacity={bigIn} />
					</g>
				)}
			</svg>

			{/* ---------- timeline strip ---------- */}
			<div
				style={{
					position: 'absolute', left: L.X0 - 40, top: sTop, width: L.X1 - L.X0 + 80, height: L.stripH,
					background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW,
					opacity: stripIn, transform: `translateX(${(1 - stripIn) * 140}px)`,
				}}
			/>
			<svg width={L.W} height={L.H}
				style={{position: 'absolute', inset: 0, ...maskStyle, opacity: stripIn, transform: `translateX(${(1 - stripIn) * 140}px)`}}>
				<defs>
					<clipPath id="stripclip">
						<rect x={L.X0 - 38} y={sTop} width={L.X1 - L.X0 + 76} height={L.stripH} rx={16} />
					</clipPath>
				</defs>
				<g clipPath="url(#stripclip)">
				{/* week ticks */}
				{weekTicks.map((d) => {
					const xx = x(d);
					return <line key={`w${d}`} x1={xx} x2={xx} y1={sTop + 40} y2={sTop + 47}
						stroke={C.borderStrong} strokeWidth={1.5} opacity={weekOp * ticksIn(xx)} />;
				})}
				{/* month + year boundaries and labels */}
				{monthsVis.map((m) => {
					const xx = x(m.day);
					const isYear = m.m === 0;
					const op = (isYear ? 1 : monthOp) * ticksIn(xx);
					if (op < 0.01) return null;
					return (
						<g key={`m${m.day}`} opacity={op}>
							<line x1={xx} x2={xx} y1={sTop + (isYear ? 12 : 36)} y2={sTop + 52}
								stroke={isYear ? C.text3 : C.borderStrong} strokeWidth={isYear ? 2 : 1.5} />
							<text x={xx + 8} y={sTop + 72} fontFamily={INTER} fontSize={22}
								fontWeight={isYear ? 700 : 500} fill={isYear ? C.text : C.text2}>
								{isYear ? String(m.y) : MONTH_NAMES[m.m]}
							</text>
						</g>
					);
				})}
				</g>
			</svg>

			{/* ---------- release ticks / falling chips (glowing) ---------- */}
			<svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, ...maskStyle}}>
				<g filter="url(#tickglow2)">
					<defs>
						<filter id="tickglow2" x="-20%" y="-200%" width="140%" height="500%">
							<feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
							<feMerge>
								<feMergeNode in="b" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					{landed.map((r) => {
						const tr = relT(r);
						const xx = x(r.day);
						if (r.card) {
							// tick appears as the card lands
							const p = prog(t, tr + F(7), 6);
							if (p <= 0) return null;
							return <rect key={`t${r.i}`} x={xx - tickW / 2} y={sTop + 10} width={tickW} height={24}
								rx={Math.min(3, tickW / 2)} fill={C.accent} opacity={p} />;
						}
						// chip falls onto the strip
						const p = easeOut(clamp((t - tr + F(8)) / F(8)));
						if (p <= 0) return null;
						const fall = r.t < T_WEEK ? 120 : r.t < T_2DAY ? 56 : 0;
						const yy = sTop + 10 - (1 - p) * fall;
						const w = tickW;
						return <rect key={`t${r.i}`} x={xx - w / 2} y={yy} width={w} height={24 + (1 - p) * (fall / 9)}
							rx={Math.min(3, w / 2)} fill={C.accent} opacity={0.35 + 0.65 * p} />;
					})}
				</g>
				{/* landing pulses */}
				{landed.map((r) => {
					const tr = relT(r) + (r.card ? F(7) : 0);
					const u = (t - tr) / F(16);
					if (u < 0 || u > 1) return null;
					const big = r.card ? 1 : 0.6;
					return <circle key={`p${r.i}`} cx={x(r.day)} cy={sTop + 22} r={(6 + 26 * easeOut(u)) * big}
						fill="none" stroke={C.accent} strokeWidth={2} opacity={(1 - u) * 0.8} />;
				})}
			</svg>

			{/* ---------- release cards ---------- */}
			<div style={{position: 'absolute', inset: 0, ...maskStyle}}>
				{landed.filter((r) => r.card).map((r) => {
					const tr = relT(r);
					const p = prog(t, tr - F(4), 11);
					if (p <= 0 || cardZoomFade <= 0.001) return null;
					const row = (cardIdx.get(r.i) ?? 0) % 2;
					const bottom = L.rowBottoms[row];
					const cx = x(r.day);
					const isLatest = latestCard?.i === r.i;
					const hl = isLatest ? 1 : 1 - prog(t, (RELEASES.find((q) => q.card && q.i > r.i) ? relT(RELEASES.find((q) => q.card && q.i > r.i)!) : 99), 14);
					const stemH = L.stripY - bottom;
					return (
						<div key={`k${r.i}`} style={{position: 'absolute', left: cx - L.cardW / 2, top: bottom - L.cardH, width: L.cardW, height: L.cardH + stemH,
							opacity: p * cardZoomFade, transform: `translateY(${(1 - p) * -64}px) scale(${0.92 + 0.08 * p})`, transformOrigin: '50% 100%'}}>
							{/* stem */}
							<div style={{position: 'absolute', left: L.cardW / 2 - 0.75, top: L.cardH, width: 1.5, height: stemH,
								background: `linear-gradient(${C.borderStrong}, ${C.border})`}} />
							<div style={{position: 'absolute', inset: 0, height: L.cardH, background: C.card, borderRadius: 16,
								border: `1px solid ${hl > 0.02 ? mix(C.border, C.accent, hl) : C.border}`,
								boxShadow: `${CARD_SHADOW}${hl > 0.02 ? `, 0 0 ${24 * hl}px rgba(217,119,87,${0.28 * hl})` : ''}`,
								padding: `${14 * L.cs}px ${18 * L.cs}px`, boxSizing: 'border-box'}}>
								<div style={{display: 'flex', alignItems: 'center', gap: 10 * L.cs, fontFamily: MONO, fontSize: 20 * L.cs, color: C.text2, lineHeight: `${24 * L.cs}px`}}>
									<span style={{width: 10 * L.cs, height: 10 * L.cs, borderRadius: 5 * L.cs, background: LAB_COLOR[r.lab]}} />
									{r.lab}
								</div>
								<div style={{marginTop: 8 * L.cs, fontSize: 25 * L.cs, fontWeight: 700, color: C.text, letterSpacing: -0.3, lineHeight: `${30 * L.cs}px`, whiteSpace: 'nowrap'}}>
									New frontier model
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* "frontier" tag near the head */}
			{headVisible && frontierPill > 0 && (
				<div style={{position: 'absolute', left: xEnd - 18, top: headY - 66, transform: `translateX(-100%) translateY(${(1 - frontierPill) * 8}px)`,
					opacity: frontierPill, fontFamily: MONO, fontSize: 22, color: C.accent, padding: '6px 12px',
					background: 'rgba(217,119,87,0.10)', border: '1px solid rgba(217,119,87,0.35)', borderRadius: 10, whiteSpace: 'nowrap'}}>
					frontier
				</div>
			)}

			{/* ---------- house-text label (Aleks layer) ---------- */}
			{showText && labelPop > 0 && labelOut < 1 && (
				<div style={{position: 'absolute', left: L.labelX, top: L.labelY, display: 'flex', fontSize: L.labelSize, fontWeight: 800, color: '#FFFFFF',
					letterSpacing: -L.labelSize * 0.02, lineHeight: 1.1, textShadow: TEXT_SHADOW, whiteSpace: 'nowrap',
					opacity: labelPop * (1 - labelOut), transform: `scale(${0.92 + 0.08 * labelPop})`, transformOrigin: '0% 50%'}}>
					<span>Every</span>
					<span style={{position: 'relative', display: 'inline-block', width: L.labelSize * 4.6, height: '1.1em', marginLeft: '0.26em'}}>
						{labelStates.map((s, i) => {
							const a = i === 0 ? 1 : prog(t, s.t0, 10);
							const next = labelStates[i + 1];
							const d = next ? prog(t, next.t0, 7) : 0;
							const op = a * (1 - d);
							if (op <= 0.001) return null;
							const dy = (1 - a) * 0.45 * L.labelSize - d * 0.45 * L.labelSize;
							return (
								<span key={s.text} style={{position: 'absolute', left: 0, top: 0, color: C.accent,
									opacity: op, transform: `translateY(${dy}px)`, filter: `blur(${(1 - a) * 6 + d * 6}px)`}}>
									{s.text}
								</span>
							);
						})}
					</span>
				</div>
			)}

			{/* ---------- "2035 ?" ---------- */}
			{bigIn > 0 && (
				<div style={{position: 'absolute', right: L.W - L.X1, top: L.bigBaseline - L.bigSize, fontSize: L.bigSize, fontWeight: 800,
					color: C.accent, letterSpacing: -L.bigSize * 0.03, lineHeight: 1, whiteSpace: 'nowrap',
					textShadow: '0 4px 24px rgba(0,0,0,.55), 0 0 60px rgba(217,119,87,.25)',
					opacity: bigIn, transform: `scale(${0.92 + 0.08 * bigIn})`, transformOrigin: '100% 100%'}}>
					2035<span style={{display: 'inline-block', marginLeft: L.bigSize * 0.18, opacity: qIn,
						transform: `translateY(${(1 - qIn) * 20}px)`}}>?</span>
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

// keep tree-shaker honest for helpers referenced only in debug
export const _debugNow = nowDay;
