// File A: CEFR scale -> C2 not needed -> marker to B2 -> "More than enough" -> domain vocabulary.
// Cue times (s, relative to clip start) come from the presenter's line; see README.md.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background, C, CheckIcon, CrossIcon, EASE_IN_OUT, IN, INTER, MONO, SHADOW, lerp, mix, p, pop, useT} from './common';

export const A_DURATION_S = 21.1;

const T = {
	c2Hi: 3.1, // "You don't need C2"
	c2Demote: 3.55,
	c2Strike: 3.65,
	c2Pill: 4.0,
	markerIn: 9.0, // "intermediate level"
	markerArrive: 10.3,
	b2Orange: 10.4, // "a B2"
	enough: 12.1, // "is more than enough"
	domain: 15.9, // "all the terminology"
	chipsStart: 16.35,
	chipsStep: 0.37,
	more: 19.7, // "your field of knowledge"
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const GROUPS = ['Basic', 'Independent', 'Proficient'];
const CHIPS: {w: string; kind: 'ee' | 'sw'}[] = [
	{w: 'op-amp', kind: 'ee'},
	{w: 'interrupt', kind: 'ee'},
	{w: 'PCB', kind: 'ee'},
	{w: 'embedded', kind: 'ee'},
	{w: 'gradient descent', kind: 'sw'},
	{w: 'API', kind: 'sw'},
	{w: 'latency', kind: 'sw'},
	{w: 'firmware', kind: 'ee'},
	{w: 'oscilloscope', kind: 'ee'},
];

type L = {
	W: number;
	H: number;
	segW: number;
	gap: number;
	segH: number;
	lvl: number;
	head: number;
	group: number;
	tag: number;
	y0Start: number;
	y0End: number;
	panel: {x: number; y: number; w: number; h: number};
	chip: number;
	chipGap: number;
};

const LH: L = {
	W: 1920,
	H: 1080,
	segW: 220,
	gap: 12,
	segH: 150,
	lvl: 64,
	head: 40,
	group: 24,
	tag: 36,
	y0Start: 450,
	y0End: 196,
	panel: {x: 270, y: 572, w: 1380, h: 390},
	chip: 34,
	chipGap: 18,
};
const LV: L = {
	W: 1080,
	H: 1350,
	segW: 148,
	gap: 10,
	segH: 128,
	lvl: 50,
	head: 38,
	group: 21,
	tag: 34,
	y0Start: 560,
	y0End: 290,
	panel: {x: 70, y: 690, w: 940, h: 530},
	chip: 34,
	chipGap: 18,
};

export const EnglishA: React.FC<{vertical?: boolean}> = ({vertical}) => {
	const t = useT();
	const L = vertical ? LV : LH;
	const barW = 6 * L.segW + 5 * L.gap;
	const x0 = (L.W - barW) / 2;
	const segX = (i: number) => x0 + i * (L.segW + L.gap);
	const segC = (i: number) => segX(i) + L.segW / 2;

	// Whole scale group rises to make room for the domain panel.
	const rise = p(t, T.domain, 0.5, EASE_IN_OUT);
	const y0 = lerp(L.y0Start, L.y0End, rise);

	// Header
	const headK = p(t, 0.0, IN);

	// Marker
	const mIn = p(t, T.markerIn, 0.3);
	const mMove = p(t, T.markerIn + 0.2, T.markerArrive - T.markerIn - 0.2, EASE_IN_OUT);
	const markerX = lerp(segC(0), segC(3), mMove);
	const b2K = p(t, T.b2Orange, 0.3);

	// C2
	const c2Hi = p(t, T.c2Hi, 0.25) * (1 - p(t, T.c2Demote, 0.3));
	const c2Dead = p(t, T.c2Demote, 0.3);
	const c2Strike = p(t, T.c2Strike, 0.3);
	const c2Pill = p(t, T.c2Pill, IN);

	const enoughK = p(t, T.enough, IN);
	const panelK = p(t, T.domain + 0.1, 0.4);

	return (
		<AbsoluteFill>
			<Background>
				{/* ---------- Header ---------- */}
				<div
					style={{
						position: 'absolute',
						left: x0,
						top: y0 - 132,
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						...pop(headK, 12),
						transformOrigin: 'left center',
					}}
				>
					<div style={{width: 12, height: 12, borderRadius: 3, background: C.accent}} />
					<div style={{fontSize: L.head, fontWeight: 700, letterSpacing: '-0.01em'}}>English level</div>
				</div>
				<div
					style={{
						position: 'absolute',
						right: L.W - (x0 + barW),
						top: y0 - 124,
						fontFamily: MONO,
						fontSize: vertical ? 22 : 24,
						color: C.text3,
						opacity: headK,
						letterSpacing: '0.04em',
					}}
				>
					CEFR scale
				</div>

				{/* ---------- Segments ---------- */}
				{LEVELS.map((lv, i) => {
					const k = p(t, 0.25 + i * 0.22, IN);
					const isB2 = i === 3;
					const isC2 = i === 5;
					// progress fill trailing the marker (A1..B2)
					const fill = i <= 3 ? Math.max(0, Math.min(1, (markerX - segX(i)) / L.segW)) * mIn : 0;
					let bg = C.card;
					let border = C.border;
					let color = C.text;
					let glow = SHADOW;
					let scale = 0.92 + 0.08 * k;
					if (isB2) {
						bg = mix(C.card, C.accent, b2K);
						border = mix(C.border, '#E89A7F', b2K);
						color = C.text;
						glow = `${SHADOW}, 0 0 ${48 * b2K}px rgba(217,119,87,${0.45 * b2K})`;
					}
					if (isC2) {
						border = mix(mix(C.border, '#F5F5F7', c2Hi), '#222227', c2Dead);
						bg = mix(C.card, '#121215', c2Dead);
						color = mix(C.text, '#4A4A52', c2Dead);
						glow = `${SHADOW}, 0 0 ${40 * c2Hi}px rgba(245,245,247,${0.25 * c2Hi})`;
						scale *= 1 + 0.05 * c2Hi;
					}
					return (
						<div
							key={lv}
							style={{
								position: 'absolute',
								left: segX(i),
								top: y0,
								width: L.segW,
								height: L.segH,
								borderRadius: 16,
								background: bg,
								border: `1.5px solid ${border}`,
								boxShadow: glow,
								opacity: k,
								transform: `translateY(${(1 - k) * 24}px) scale(${scale})`,
								overflow: 'hidden',
								zIndex: isC2 ? 2 : 1,
							}}
						>
							{fill > 0 && b2K < 1 && (
								<div
									style={{
										position: 'absolute',
										left: 0,
										top: 0,
										bottom: 0,
										width: `${fill * 100}%`,
										background: 'rgba(217,119,87,0.16)',
										opacity: isB2 ? 1 - b2K : 1,
									}}
								/>
							)}
							<div
								style={{
									position: 'absolute',
									inset: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: L.lvl,
									fontWeight: 800,
									letterSpacing: '-0.02em',
									color,
								}}
							>
								{lv}
							</div>
							{isC2 && (
								<div
									style={{
										position: 'absolute',
										left: '22%',
										top: '50%',
										height: 5,
										width: '56%',
										marginTop: -2,
										borderRadius: 3,
										background: '#A1A1AA',
										transform: `scaleX(${c2Strike})`,
										transformOrigin: 'left center',
									}}
								/>
							)}
						</div>
					);
				})}

				{/* ---------- Group brackets ---------- */}
				{GROUPS.map((g, gi) => {
					const k = p(t, 1.75 + gi * 0.22, IN);
					const left = segX(gi * 2);
					const w = 2 * L.segW + L.gap;
					return (
						<div key={g} style={{position: 'absolute', left, top: y0 + L.segH + 18, width: w, opacity: k}}>
							<div
								style={{
									height: 10,
									borderLeft: `1.5px solid #46464E`,
									borderRight: `1.5px solid #46464E`,
									borderBottom: `1.5px solid #46464E`,
									borderRadius: '0 0 6px 6px',
									margin: '0 10px',
									transform: `scaleX(${0.6 + 0.4 * k})`,
								}}
							/>
							<div
								style={{
									marginTop: 10,
									textAlign: 'center',
									fontSize: L.group,
									fontWeight: 600,
									letterSpacing: '0.14em',
									textTransform: 'uppercase',
									color: C.text2,
								}}
							>
								{g}
							</div>
						</div>
					);
				})}

				{/* ---------- C2 "Not needed" pill ---------- */}
				<div
					style={{
						position: 'absolute',
						left: segC(5),
						top: y0 - 66,
						transform: 'translateX(-50%)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: vertical ? '6px 14px 6px 10px' : '7px 16px 7px 12px',
							borderRadius: 999,
							background: C.cardRaised,
							border: `1.5px solid ${C.borderStrong}`,
							fontSize: vertical ? 22 : 26,
							fontWeight: 600,
							color: C.text2,
							whiteSpace: 'nowrap',
							...pop(c2Pill, 10),
						}}
					>
						<CrossIcon size={vertical ? 18 : 22} color={C.text2} />
						Not needed
					</div>
				</div>

				{/* ---------- Marker ---------- */}
				<div
					style={{
						position: 'absolute',
						left: markerX,
						top: y0 - 40,
						transform: `translateX(-50%) translateY(${(1 - mIn) * -12}px)`,
						opacity: mIn,
					}}
				>
					<svg width={36} height={28} viewBox="0 0 36 28" style={{display: 'block', filter: 'drop-shadow(0 4px 10px rgba(217,119,87,.5))'}}>
						<path d="M4 3 H32 Q35 3 33 6 L20 24 Q18 27 16 24 L3 6 Q1 3 4 3 Z" fill={C.accent} />
					</svg>
				</div>

				{/* ---------- "More than enough" ---------- */}
				<div
					style={{
						position: 'absolute',
						left: segC(3),
						top: y0 + L.segH + (vertical ? 86 : 96),
						transform: 'translateX(-50%)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 12,
							padding: vertical ? '10px 22px 10px 16px' : '12px 26px 12px 18px',
							borderRadius: 999,
							background: 'rgba(217,119,87,0.14)',
							border: `2px solid ${C.accent}`,
							boxShadow: `0 10px 40px rgba(0,0,0,.5), 0 0 30px rgba(217,119,87,${0.25 * enoughK})`,
							fontSize: L.tag,
							fontWeight: 700,
							letterSpacing: '-0.01em',
							color: C.text,
							whiteSpace: 'nowrap',
							...pop(enoughK, 14),
						}}
					>
						<CheckIcon size={L.tag} color={C.accent} k={p(t, T.enough + 0.12, 0.3)} />
						More than enough
					</div>
				</div>

				{/* ---------- Domain panel ---------- */}
				<DomainPanel L={L} t={t} k={panelK} />
			</Background>
		</AbsoluteFill>
	);
};

const DomainPanel: React.FC<{L: L; t: number; k: number}> = ({L, t, k}) => {
	const {x, y, w, h} = L.panel;
	const moreK = p(t, T.more, IN);
	const v = L.W < 1500;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 16,
				background: C.card,
				border: `1px solid ${C.border}`,
				boxShadow: SHADOW,
				opacity: k,
				transform: `translateY(${(1 - k) * 40}px) scale(${0.96 + 0.04 * k})`,
				padding: v ? '34px 36px' : '34px 44px',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
					<div style={{fontSize: v ? 42 : 44, fontWeight: 800, letterSpacing: '-0.02em'}}>Your domain</div>
					{!v && <div style={{fontSize: 28, fontWeight: 500, color: C.text2}}>the terminology of your field</div>}
				</div>
				<div style={{display: 'flex', gap: 20, fontSize: v ? 22 : 24, fontWeight: 600, color: C.text2}}>
					<Legend color={C.accent} label="EE" />
					<Legend color={C.blue} label="Software" />
				</div>
			</div>
			{v && <div style={{fontSize: 28, fontWeight: 500, color: C.text2, marginTop: 8}}>the terminology of your field</div>}
			<div
				style={{
					flex: 1,
					display: 'flex',
					flexWrap: 'wrap',
					alignContent: 'center',
					justifyContent: 'center',
					gap: L.chipGap,
					padding: '10px 0 0',
				}}
			>
				{CHIPS.map((c, i) => {
					const start = T.chipsStart + i * T.chipsStep;
					const ck = p(t, start, 0.42);
					// deterministic fly-in offsets
					const ang = (i * 137.5 * Math.PI) / 180;
					const dx = Math.cos(ang) * 140;
					const dy = 120 + Math.abs(Math.sin(ang)) * 80;
					const rot = (i % 2 ? 1 : -1) * (5 + (i % 3) * 2);
					const dot = c.kind === 'ee' ? C.accent : C.blue;
					return (
						<div
							key={c.w}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 14,
								padding: '14px 24px 14px 20px',
								borderRadius: 12,
								background: C.cardRaised,
								border: `1.5px solid ${mix(C.border, dot, 0.35)}`,
								boxShadow: '0 8px 24px rgba(0,0,0,.45)',
								fontFamily: MONO,
								fontSize: L.chip,
								fontWeight: 500,
								color: C.text,
								opacity: ck,
								transform: `translate(${(1 - ck) * dx}px, ${(1 - ck) * dy}px) rotate(${(1 - ck) * rot}deg) scale(${0.85 + 0.15 * ck})`,
								whiteSpace: 'nowrap',
							}}
						>
							<div style={{width: 10, height: 10, borderRadius: 5, background: dot}} />
							{c.w}
						</div>
					);
				})}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						padding: '14px 24px',
						borderRadius: 12,
						border: `1.5px dashed ${C.borderStrong}`,
						fontFamily: MONO,
						fontSize: L.chip,
						fontWeight: 500,
						color: C.text2,
						whiteSpace: 'nowrap',
						...pop(moreK, 10),
					}}
				>
					+ more
				</div>
			</div>
		</div>
	);
};

const Legend: React.FC<{color: string; label: string}> = ({color, label}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 8}}>
		<div style={{width: 10, height: 10, borderRadius: 5, background: color}} />
		{label}
	</div>
);
