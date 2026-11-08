import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, C, cardStyle, FileGlyph, INTER, MONO, pop, prog} from './shared';

// Main session delegates to the 4 subagents IN SEQUENCE (each needs the previous
// one's output). Each subagent fills its own context window; only a short result
// returns to the main session. Outputs then assemble into the final report.
const AGENTS = [
	{name: 'prelab', model: 'sonnet', out: 'answers.md', fill: 0.62},
	{name: 'lab-session', model: 'sonnet', out: 'run-sheet.md', fill: 0.5},
	{name: 'data-analysis', model: 'opus', out: 'plots/', fill: 0.8},
	{name: 'write-up', model: 'opus', out: 'report.tex', fill: 0.7},
];
const PROMPT = '> Run prelab → lab-session →\n  data-analysis → write-up,\n  in order. Pass outputs on.';
const TYPE_START = 0.25;
const CPS = 35;
const FAN = 2.35;
const RUN0 = 2.9;
const RUN_STEP = 1.45;
const DONE_AT = 1.2;
const FLY0 = 8.75;

const MAIN = {x: 100, y: 250, w: 560, h: 600};
const SUB = {x: 790, w: 460, h: 150, ys: [180, 375, 570, 765]};
const CHIP_X = SUB.x + SUB.w + 24;
const REP = {x: 1530, y: 320, w: 300, h: 440};

const runStart = (i: number) => RUN0 + i * RUN_STEP;
const doneAt = (i: number) => runStart(i) + DONE_AT;

const Bar: React.FC<{p: number; w: number; color: string}> = ({p, w, color}) => (
	<div style={{width: w, height: 12, borderRadius: 6, background: '#24242B', overflow: 'hidden'}}>
		<div style={{width: w * p, height: 12, borderRadius: 6, background: color}} />
	</div>
);

// tile i of the 2x2 report grid
const tilePos = (i: number) => {
	const pad = 22;
	const head = 70;
	const tw = (REP.w - pad * 2 - 12) / 2;
	const th = (REP.h - head - pad - 12) / 2;
	return {x: REP.x + pad + (i % 2) * (tw + 12), y: REP.y + head + Math.floor(i / 2) * (th + 12), w: tw, h: th};
};

const TileArt: React.FC<{i: number; w: number; h: number}> = ({i, w, h}) => {
	if (i === 2) {
		// step response: model (dashed) vs measured
		const pts = Array.from({length: 40}, (_, k) => {
			const x = k / 39;
			const y = 1 - Math.exp(-5 * x) * Math.cos(9 * x);
			return `${10 + x * (w - 20)},${h - 18 - (y * (h - 62)) / 1.4}`;
		}).join(' ');
		const pts2 = Array.from({length: 40}, (_, k) => {
			const x = k / 39;
			const y = 1 - Math.exp(-4.6 * x) * Math.cos(8.5 * x) + 0.03 * Math.sin(40 * x);
			return `${10 + x * (w - 20)},${h - 18 - (y * (h - 62)) / 1.4}`;
		}).join(' ');
		return (
			<svg width={w} height={h}>
				<polyline points={pts} fill="none" stroke={C.text2} strokeWidth={2.5} strokeDasharray="6 5" />
				<polyline points={pts2} fill="none" stroke={C.blue} strokeWidth={2.5} />
			</svg>
		);
	}
	const lines = i === 1 ? 5 : 6;
	return (
		<div style={{padding: '34px 12px 0', display: 'flex', flexDirection: 'column', gap: 9}}>
			{Array.from({length: lines}, (_, k) => (
				<div key={k} style={{display: 'flex', gap: 6, alignItems: 'center'}}>
					{i === 1 && <div style={{width: 10, height: 10, borderRadius: 2, border: `1.5px solid ${C.green}`}} />}
					<div style={{height: 6, borderRadius: 3, background: k === 0 && i !== 1 ? C.text : '#3A3A42', width: `${[90, 75, 85, 60, 80, 50][k]}%`}} />
				</div>
			))}
		</div>
	);
};

export const Orchestrate: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	const typed = Math.max(0, Math.min(PROMPT.length, Math.floor((t - TYPE_START) * CPS)));
	const typingDone = typed >= PROMPT.length;
	const returned = AGENTS.filter((_, i) => t >= doneAt(i)).length;
	const mainFill = 0.07 + 0.035 * returned + (t >= FLY0 + 1.5 ? 0.02 : 0);
	const allIn = prog(t, FLY0 + 1.35, FLY0 + 1.7);
	const flowing = t < 12 ? t : 12; // dashes stop before the 1 s clean hold

	const mainOut = {x: MAIN.x + MAIN.w, y: MAIN.y + 210};

	return (
		<AbsoluteFill style={{fontFamily: INTER}}>
			<Background />

			{/* title */}
			<div style={{position: 'absolute', left: MAIN.x, top: 62, ...pop(t, 0.05)}}>
				<div style={{fontSize: 50, fontWeight: 800, color: C.text, letterSpacing: -1}}>
					One main session, <span style={{color: C.accent}}>four subagents</span>
				</div>
				<div style={{fontSize: 26, color: C.text2, marginTop: 6}}>each in its own context window · only the results come back</div>
			</div>

			{/* connectors */}
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
				{AGENTS.map((a, i) => {
					const cy = SUB.ys[i] + SUB.h / 2;
					const x2 = SUB.x - 6;
					const d = `M${mainOut.x + 4} ${mainOut.y} C ${mainOut.x + 80} ${mainOut.y}, ${x2 - 80} ${cy}, ${x2} ${cy}`;
					const p = prog(t, FAN + i * 0.08, FAN + 0.4 + i * 0.08);
					const running = t >= runStart(i) && t < doneAt(i);
					const ret = t >= doneAt(i) && t < doneAt(i) + 0.45;
					return (
						<g key={a.name}>
							<path d={d} fill="none" stroke={C.borderStrong} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
							{(running || ret) && (
								<path
									d={d}
									fill="none"
									stroke={ret ? C.green : C.accent}
									strokeWidth={3.5}
									strokeDasharray="10 12"
									strokeDashoffset={ret ? flowing * 60 : -flowing * 60}
								/>
							)}
						</g>
					);
				})}
			</svg>

			{/* main session card */}
			<div style={{...cardStyle, left: MAIN.x, top: MAIN.y, width: MAIN.w, height: MAIN.h, boxSizing: 'border-box', padding: 28, ...pop(t, 0.1)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<div style={{width: 14, height: 14, borderRadius: 7, background: t >= FLY0 + 1.7 ? C.green : C.accent}} />
					<span style={{fontSize: 30, fontWeight: 700, color: C.text}}>main session</span>
					<span style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 19, color: C.text3}}>claude — terminal</span>
				</div>
				<div style={{fontFamily: MONO, fontSize: 25, lineHeight: 1.45, color: C.text, marginTop: 24, minHeight: 110, whiteSpace: 'pre'}}>
					{PROMPT.slice(0, typed)}
					{(!typingDone || Math.floor(t * 2) % 2 === 0) && t < FAN + 0.2 && (
						<span style={{display: 'inline-block', width: 13, height: 26, background: C.accent, verticalAlign: -4, marginLeft: 2}} />
					)}
				</div>
				<div style={{fontFamily: MONO, fontSize: 23, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
					{AGENTS.map((a, i) => (
						<div key={a.name} style={{...pop(t, doneAt(i) + 0.3), color: C.text2, transformOrigin: 'left center'}}>
							<span style={{color: C.green}}>✓</span> {a.name} <span style={{color: C.text3}}>→</span> <span style={{color: C.text}}>{a.out}</span>
						</div>
					))}
					<div style={{...pop(t, FLY0 + 1.75), color: C.green, fontWeight: 700, transformOrigin: 'left center'}}>✓ report.pdf ready</div>
				</div>
				<div style={{position: 'absolute', left: 28, bottom: 26}}>
					<div style={{fontSize: 20, color: C.text2, marginBottom: 8}}>main context</div>
					<Bar p={mainFill} w={MAIN.w - 56} color={C.blue} />
				</div>
			</div>

			{/* subagent cards */}
			{AGENTS.map((a, i) => {
				const y = SUB.ys[i];
				const running = t >= runStart(i) && t < doneAt(i);
				const done = t >= doneAt(i);
				const fill = a.fill * prog(t, runStart(i) + 0.05, doneAt(i) - 0.05);
				const pulse = running ? 0.55 + 0.45 * Math.abs(Math.sin((t - runStart(i)) * 5)) : 1;
				const status = done ? 'done' : running ? 'running…' : 'queued';
				const dot = done ? C.green : running ? C.accent : C.text3;
				return (
					<div
						key={a.name}
						style={{
							...cardStyle,
							left: SUB.x,
							top: y,
							width: SUB.w,
							height: SUB.h,
							boxSizing: 'border-box',
							padding: '20px 24px',
							border: `2px solid ${running ? C.accent : C.border}`,
							...pop(t, 0.3 + i * 0.1),
						}}
					>
						<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
							<div style={{width: 14, height: 14, borderRadius: 7, background: dot, opacity: pulse}} />
							<span style={{fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.text}}>{a.name}</span>
							<span style={{marginLeft: 'auto', fontSize: 19, color: C.text2, border: `1px solid ${C.borderStrong}`, borderRadius: 999, padding: '2px 12px'}}>{a.model}</span>
						</div>
						<div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 20}}>
							<span style={{fontSize: 19, color: C.text2, width: 118}}>own context</span>
							<Bar p={fill} w={SUB.w - 48 - 132} color={C.accent} />
						</div>
						<div style={{fontSize: 21, color: done ? C.green : running ? C.accent : C.text3, marginTop: 12}}>{status}</div>
					</div>
				);
			})}

			{/* report placeholder → assembled */}
			<div
				style={{
					position: 'absolute',
					left: REP.x,
					top: REP.y,
					width: REP.w,
					height: REP.h,
					borderRadius: 16,
					boxSizing: 'border-box',
					border: `2px ${allIn > 0 ? 'solid' : 'dashed'} ${allIn > 0 ? C.green : C.borderStrong}`,
					background: allIn > 0 ? C.card : 'transparent',
					boxShadow: allIn > 0 ? '0 20px 60px rgba(0,0,0,.55)' : 'none',
					opacity: prog(t, 0.6, 0.9),
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '20px 22px'}}>
					<FileGlyph size={30} color={allIn > 0 ? C.green : C.text3} />
					<span style={{fontFamily: MONO, fontSize: 28, fontWeight: 700, color: allIn > 0 ? C.text : C.text3}}>report.pdf</span>
					<span style={{marginLeft: 'auto', fontSize: 30, color: C.green, opacity: allIn}}>✓</span>
				</div>
			</div>

			{/* output chips: pop beside each subagent, then fly into the report as puzzle tiles */}
			{AGENTS.map((a, i) => {
				const cy = SUB.ys[i] + SUB.h / 2;
				const tp = tilePos(i);
				const fs = FLY0 + i * 0.25;
				const f = prog(t, fs, fs + 0.5);
				const landed = prog(t, fs + 0.42, fs + 0.55);
				const chipW = 196;
				const chipH = 48;
				const x = interpolate(f, [0, 1], [CHIP_X, tp.x]);
				const y = interpolate(f, [0, 1], [cy - chipH / 2, tp.y]);
				const w = interpolate(f, [0, 1], [chipW, tp.w]);
				const h = interpolate(f, [0, 1], [chipH, tp.h]);
				const snap = 1 + 0.06 * (landed > 0 && landed < 1 ? Math.sin(landed * Math.PI) : 0);
				return (
					<div
						key={a.out}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: w,
							height: h,
							borderRadius: interpolate(f, [0, 1], [24, 10]),
							background: f > 0 ? C.raised : C.card,
							border: `1.5px solid ${f >= 1 ? C.border : C.accent}`,
							boxSizing: 'border-box',
							overflow: 'hidden',
							scale: String(snap),
							...(f === 0 ? pop(t, doneAt(i)) : {}),
						}}
					>
						<div style={{position: 'absolute', inset: 0, opacity: 1 - landed}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 8, height: chipH, padding: '0 14px', whiteSpace: 'nowrap'}}>
								<FileGlyph size={24} folder={a.out.endsWith('/')} />
								<span style={{fontFamily: MONO, fontSize: 22, color: C.text}}>{a.out}</span>
							</div>
						</div>
						<div style={{position: 'absolute', inset: 0, opacity: landed}}>
							<div style={{position: 'absolute', left: 10, top: 8, fontFamily: MONO, fontSize: 15, color: C.text2}}>{a.out}</div>
							<TileArt i={i} w={tp.w} h={tp.h} />
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
