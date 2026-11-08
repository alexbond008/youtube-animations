// File B: Python reads like English. Code types -> English keywords get orange underline sweeps
// -> plain-English reading appears -> the # comment highlights.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background, C, EASE_IN_OUT, IN, INTER, MONO, SHADOW, lerp, mix, p, pop, useT} from './common';

export const B_DURATION_S = 15.4;

const T = {
	typeStart: 0.2,
	cps: 32, // spec: 28–35 chars/s
	sweepSched: [1.8, 2.12, 2.44, 2.78, 3.12, 3.46, 3.8], // for, in, if, is_ready, and, not, read
	commentStart: 4.7,
	cursorOff: 6.4,
	proxy: 9.6, // "you read a lot of English by proxy"
	comment: 12.4, // "a lot of the comments of code"
	englishToo: 14.0, // "is also in English"
};

type Kind = 'kw' | 'id' | 'fn' | 'p' | 'cm' | 'ws';
type Tok = {s: string; k: Kind; sweep?: number};

// Typed order: lines 1, 2, 3, then the comment on line 0.
const LINES: Tok[][] = [
	[{s: '# check every sensor before logging', k: 'cm'}],
	[
		{s: 'for', k: 'kw', sweep: 0},
		{s: ' ', k: 'ws'},
		{s: 'sensor', k: 'id'},
		{s: ' ', k: 'ws'},
		{s: 'in', k: 'kw', sweep: 1},
		{s: ' ', k: 'ws'},
		{s: 'sensors', k: 'id'},
		{s: ':', k: 'p'},
	],
	[
		{s: '    ', k: 'ws'},
		{s: 'if', k: 'kw', sweep: 2},
		{s: ' ', k: 'ws'},
		{s: 'sensor', k: 'id'},
		{s: '.', k: 'p'},
		{s: 'is_ready', k: 'fn', sweep: 3},
		{s: '()', k: 'p'},
		{s: ' ', k: 'ws'},
		{s: 'and', k: 'kw', sweep: 4},
		{s: ' ', k: 'ws'},
		{s: 'not', k: 'kw', sweep: 5},
		{s: ' ', k: 'ws'},
		{s: 'sensor', k: 'id'},
		{s: '.', k: 'p'},
		{s: 'failed', k: 'id'},
		{s: ':', k: 'p'},
	],
	[
		{s: '        ', k: 'ws'},
		{s: 'readings', k: 'id'},
		{s: '.', k: 'p'},
		{s: 'append', k: 'fn'},
		{s: '(', k: 'p'},
		{s: 'sensor', k: 'id'},
		{s: '.', k: 'p'},
		{s: 'read', k: 'fn', sweep: 6},
		{s: '())', k: 'p'},
	],
];

const lineLen = (l: Tok[]) => l.reduce((a, x) => a + x.s.length, 0);
const LINE_PAUSE = 4; // a newline "costs" 4 chars of time (Enter + auto-indent beat)

/** Start time (s) at which each line begins typing. */
const lineStart: number[] = (() => {
	const out: number[] = [0, 0, 0, 0];
	let t = T.typeStart;
	for (const li of [1, 2, 3]) {
		out[li] = t;
		t += (lineLen(LINES[li]) + LINE_PAUSE) / T.cps;
	}
	out[0] = T.commentStart;
	return out;
})();
const typedChars = (li: number, t: number) =>
	Math.max(0, Math.min(lineLen(LINES[li]), Math.floor((t - lineStart[li]) * T.cps)));

/** When each sweep starts: its scheduled time, but never before the word is on screen. */
const sweepStart: number[] = (() => {
	const out: number[] = [];
	LINES.forEach((l, li) => {
		let c = 0;
		for (const tok of l) {
			c += tok.s.length;
			if (tok.sweep !== undefined) {
				const typedAt = lineStart[li] + c / T.cps;
				out[tok.sweep] = Math.max(T.sweepSched[tok.sweep], typedAt + 0.12);
			}
		}
	});
	return out;
})();

const COLORS: Record<Kind, string> = {
	kw: C.text,
	id: '#C4C4CC',
	fn: C.blue,
	p: C.text3,
	cm: C.text3,
	ws: C.text,
};

// Plain-English reading. hl = matches a swept keyword.
const GLOSS: {s: string; hl?: boolean}[] = [
	{s: 'For', hl: true},
	{s: ' each sensor '},
	{s: 'in', hl: true},
	{s: ' sensors: '},
	{s: 'if', hl: true},
	{s: ' it '},
	{s: 'is ready', hl: true},
	{s: ' '},
	{s: 'and', hl: true},
	{s: ' '},
	{s: 'not', hl: true},
	{s: ' failed, '},
	{s: 'read', hl: true},
	{s: ' it and save the reading.'},
];

type L = {
	W: number;
	H: number;
	cardW: number;
	font: number;
	lineH: number;
	gutter: number;
	pad: number;
	header: number;
	gloss: number;
	glossBlock: number;
};
const LH: L = {W: 1920, H: 1080, cardW: 1380, font: 40, lineH: 70, gutter: 72, pad: 44, header: 62, gloss: 44, glossBlock: 190};
const LV: L = {W: 1080, H: 1350, cardW: 970, font: 30, lineH: 54, gutter: 50, pad: 26, header: 54, gloss: 38, glossBlock: 200};

export const EnglishB: React.FC<{vertical?: boolean}> = ({vertical}) => {
	const t = useT();
	const L = vertical ? LV : LH;
	const charW = L.font * 0.6; // JetBrains Mono advance = 0.6 em
	const cardH = L.header + 2 * (L.pad * 0.8) + 4 * L.lineH;
	const gap = vertical ? 44 : 40;
	const topBefore = (L.H - cardH) / 2;
	const topAfter = (L.H - (cardH + gap + L.glossBlock)) / 2;
	const shift = p(t, T.proxy, 0.45, EASE_IN_OUT);
	const top = lerp(topBefore, topAfter, shift);
	const left = (L.W - L.cardW) / 2;
	const cardK = p(t, 0, 0.3);

	// Cursor position
	let cursorLine = 1;
	let cursorCol = 0;
	if (t >= T.commentStart) {
		cursorLine = 0;
		cursorCol = typedChars(0, t);
	} else {
		for (const li of [1, 2, 3]) {
			if (t >= lineStart[li]) {
				cursorLine = li;
				cursorCol = typedChars(li, t);
			}
		}
	}
	const typing =
		(t >= T.typeStart && t < lineStart[3] + lineLen(LINES[3]) / T.cps + 0.1) ||
		(t >= T.commentStart && t < T.commentStart + lineLen(LINES[0]) / T.cps + 0.1);
	const blink = typing ? 1 : (t * 1.0) % 1 < 0.53 ? 1 : 0;
	const cursorVis = t < T.cursorOff ? blink : 0;

	const commentHi = p(t, T.comment, 0.36);
	const tooK = p(t, T.englishToo, IN);
	const glossK = p(t, T.proxy + 0.15, 0.4);

	return (
		<AbsoluteFill>
			<Background>
				{/* ---------- Code card ---------- */}
				<div
					style={{
						position: 'absolute',
						left,
						top,
						width: L.cardW,
						height: cardH,
						borderRadius: 16,
						background: C.card,
						border: `1px solid ${C.border}`,
						boxShadow: SHADOW,
						overflow: 'hidden',
						opacity: cardK,
						transform: `translateY(${(1 - cardK) * 28}px) scale(${0.95 + 0.05 * cardK})`,
					}}
				>
					{/* title bar */}
					<div
						style={{
							height: L.header,
							borderBottom: `1px solid ${C.border}`,
							display: 'flex',
							alignItems: 'center',
							padding: `0 ${L.pad}px`,
							gap: 10,
							background: '#131317',
						}}
					>
						{[0, 1, 2].map((i) => (
							<div key={i} style={{width: 13, height: 13, borderRadius: 7, background: '#2E2E35'}} />
						))}
						<div
							style={{
								marginLeft: 18,
								fontFamily: MONO,
								fontSize: vertical ? 22 : 24,
								color: C.text2,
								letterSpacing: '0.02em',
							}}
						>
							sensors.py
						</div>
						<div style={{flex: 1}} />
						<div style={{fontFamily: MONO, fontSize: vertical ? 20 : 22, color: C.text3}}>Python</div>
					</div>

					{/* code */}
					<div style={{position: 'relative', padding: `${L.pad * 0.8}px ${L.pad}px`, fontFamily: MONO, fontSize: L.font}}>
						{LINES.map((line, li) => {
							const n = typedChars(li, t);
							let used = 0;
							const isComment = li === 0;
							return (
								<div key={li} style={{position: 'relative', height: L.lineH, display: 'flex', alignItems: 'center'}}>
									{/* comment marker sweep */}
									{isComment && (
										<div
											style={{
												position: 'absolute',
												left: L.gutter - 10,
												width: lineLen(line) * charW + 20,
												top: L.lineH * 0.14,
												height: L.lineH * 0.72,
												borderRadius: 8,
												background: C.marker,
												transform: `scaleX(${commentHi})`,
												transformOrigin: 'left center',
											}}
										/>
									)}
									<div
										style={{
											width: L.gutter,
											flexShrink: 0,
											color: '#3E3E46',
											fontSize: L.font * 0.7,
											textAlign: 'left',
										}}
									>
										{li + 1}
									</div>
									<div style={{position: 'relative', whiteSpace: 'pre', fontWeight: 500}}>
										{line.map((tok, ti) => {
											const vis = Math.max(0, Math.min(tok.s.length, n - used));
											used += tok.s.length;
											if (vis <= 0) return null;
											let color = COLORS[tok.k];
											let weight = tok.k === 'kw' ? 700 : 500;
											let sweepK = 0;
											if (tok.sweep !== undefined) {
												sweepK = p(t, sweepStart[tok.sweep], 0.3);
												color = mix(tok.k === 'fn' ? C.blue : C.text, '#F0A585', sweepK);
											}
											if (isComment) {
												color = mix(C.text3, C.text, commentHi);
												weight = 500;
											}
											return (
												<span key={ti} style={{position: 'relative', color, fontWeight: weight}}>
													{tok.s.slice(0, vis)}
													{tok.sweep !== undefined && sweepK > 0 && (
														<span
															style={{
																position: 'absolute',
																left: -2,
																right: -2,
																bottom: -L.font * 0.2,
																height: vertical ? 4 : 5,
																borderRadius: 3,
																background: C.accent,
																boxShadow: '0 0 12px rgba(217,119,87,.6)',
																transform: `scaleX(${sweepK})`,
																transformOrigin: 'left center',
															}}
														/>
													)}
												</span>
											);
										})}
										{cursorLine === li && cursorVis > 0 && (
											<span
												style={{
													position: 'absolute',
													left: cursorCol * charW,
													top: '50%',
													marginTop: -L.font * 0.62,
													width: charW,
													height: L.font * 1.24,
													background: C.accent,
													borderRadius: 2,
												}}
											/>
										)}
									</div>
									{/* "English too" tag on the comment row */}
									{isComment && (
										<div
											style={{
												position: 'absolute',
												left: L.gutter + lineLen(line) * charW + (vertical ? 22 : 34),
												top: '50%',
												transform: 'translateY(-50%)',
											}}
										>
											<div
												style={{
													padding: vertical ? '5px 14px' : '6px 18px',
													borderRadius: 999,
													background: 'rgba(217,119,87,0.16)',
													border: `2px solid ${C.accent}`,
													color: C.text,
													fontSize: vertical ? 21 : 26,
													fontWeight: 700,
													whiteSpace: 'nowrap',
													...pop(tooK, 8),
												}}
											>
												<span style={{fontFamily: INTER}}>English too</span>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* ---------- Plain-English reading ---------- */}
				<div
					style={{
						position: 'absolute',
						left: left + 6,
						width: L.cardW - 12,
						top: top + cardH + gap,
						opacity: glossK,
						transform: `translateY(${(1 - glossK) * 24}px)`,
						display: 'flex',
						gap: vertical ? 22 : 28,
					}}
				>
					<div style={{width: 4, borderRadius: 2, background: C.accent, flexShrink: 0}} />
					<div>
						<div
							style={{
								fontSize: vertical ? 22 : 24,
								fontWeight: 600,
								letterSpacing: '0.14em',
								textTransform: 'uppercase',
								color: C.text2,
								marginBottom: vertical ? 12 : 14,
							}}
						>
							What you actually read
						</div>
						<div style={{fontSize: L.gloss, fontWeight: 600, lineHeight: 1.34, letterSpacing: '-0.01em', color: C.text}}>
							{GLOSS.map((g, i) => (
								<span key={i} style={{color: g.hl ? '#F0A585' : C.text, fontWeight: g.hl ? 800 : 600}}>
									{g.s}
								</span>
							))}
						</div>
					</div>
				</div>
			</Background>
		</AbsoluteFill>
	);
};
