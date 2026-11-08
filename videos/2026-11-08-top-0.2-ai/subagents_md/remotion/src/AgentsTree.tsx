import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, C, cardStyle, FileGlyph, INTER, MONO, pop, prog} from './shared';

// Four boxes (same names as the Excalidraw diagram) each spawn their own
// subagent file in .claude/agents/. File beats at 2.0, 4.5, 7.0, 9.5 s.
const STEPS = [
	{title: 'Pre-lab', sub: 'at home · EDA + questions', file: 'prelab.md', fm: 'name: prelab · model: sonnet'},
	{title: 'Lab session', sub: 'run-sheet + rig data', file: 'lab-session.md', fm: 'name: lab-session · model: sonnet'},
	{title: 'Data analysis', sub: 'back home · plots + evidence', file: 'data-analysis.md', fm: 'name: data-analysis · model: opus'},
	{title: 'Write-up', sub: 'submittable report', file: 'write-up.md', fm: 'name: write-up · model: opus'},
];
const BEATS = [2.0, 4.5, 7.0, 9.5];
const ROW_Y = [345, 515, 685, 855];
const BOX = {x: 190, w: 470, h: 124};
const CARD = {x: 850, y: 200, w: 880, h: 760};
const TREE_X = 930; // x of the tree trunk inside the card
const FILE_X = 990;

export const AgentsTree: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	// trunk grows to the newest file row
	const shown = BEATS.filter((b) => t >= b - 0.35).length;
	const trunkTarget = shown === 0 ? 300 : ROW_Y[shown - 1];
	const prevTarget = shown <= 1 ? 300 : ROW_Y[shown - 2];
	const trunkP = shown === 0 ? 0 : prog(t, BEATS[shown - 1] - 0.35, BEATS[shown - 1] - 0.05);
	const trunkEnd = prevTarget + (trunkTarget - prevTarget) * trunkP;

	return (
		<AbsoluteFill style={{fontFamily: INTER}}>
			<Background />

			{/* title */}
			<div style={{position: 'absolute', left: BOX.x, top: 74, ...pop(t, 0.1)}}>
				<div style={{fontSize: 54, fontWeight: 800, color: C.text, letterSpacing: -1}}>
					One step → <span style={{color: C.accent}}>one subagent</span>
				</div>
				<div style={{fontSize: 28, color: C.text2, marginTop: 6}}>each with its own .md file of instructions</div>
			</div>

			{/* boxes */}
			{STEPS.map((s, i) => {
				const lit = t >= BEATS[i] - 0.5;
				const active = lit && t < (BEATS[i + 1] ?? 99) - 0.5;
				return (
					<div
						key={s.title}
						style={{
							...cardStyle,
							left: BOX.x,
							top: ROW_Y[i] - BOX.h / 2,
							width: BOX.w,
							height: BOX.h,
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							padding: '0 26px',
							boxSizing: 'border-box',
							border: `2px solid ${active ? C.accent : lit ? '#5A4038' : C.border}`,
							...pop(t, 0.15 + i * 0.1),
						}}
					>
						<div
							style={{
								width: 52,
								height: 52,
								borderRadius: 26,
								flexShrink: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 28,
								fontWeight: 800,
								color: lit ? C.bg : C.text2,
								background: lit ? C.accent : 'transparent',
								border: `2px solid ${lit ? C.accent : C.borderStrong}`,
							}}
						>
							{i + 1}
						</div>
						<div>
							<div style={{fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.1}}>{s.title}</div>
							<div style={{fontSize: 23, color: C.text2, marginTop: 4}}>{s.sub}</div>
						</div>
					</div>
				);
			})}

			{/* file-tree card */}
			<div style={{...cardStyle, left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, ...pop(t, 0.5)}} />
			<div style={{position: 'absolute', left: CARD.x + 36, top: CARD.y + 30, ...pop(t, 0.7)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 30, color: C.text2}}>
					<FileGlyph folder color={C.text2} size={30} />
					my-control-lab/<span style={{color: C.text}}>.claude/agents/</span>
				</div>
			</div>

			{/* connectors (SVG layer) */}
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
				{/* down arrows between boxes */}
				{[0, 1, 2].map((i) => {
					const y1 = ROW_Y[i] + BOX.h / 2 + 6;
					const y2 = ROW_Y[i + 1] - BOX.h / 2 - 8;
					const o = prog(t, 0.35 + i * 0.12, 0.65 + i * 0.12);
					const cx = BOX.x + BOX.w / 2;
					return (
						<g key={i} opacity={o} stroke={C.borderStrong} strokeWidth={3} fill="none" strokeLinecap="round">
							<line x1={cx} y1={y1} x2={cx} y2={y2} />
							<path d={`M${cx - 9} ${y2 - 10} L${cx} ${y2} L${cx + 9} ${y2 - 10}`} />
						</g>
					);
				})}
				{/* tree trunk */}
				{shown > 0 && <line x1={TREE_X} y1={300} x2={TREE_X} y2={trunkEnd} stroke={C.borderStrong} strokeWidth={3} />}
				{/* box → file arrows */}
				{BEATS.map((b, i) => {
					const p = prog(t, b - 0.45, b - 0.05);
					if (p <= 0) return null;
					const x1 = BOX.x + BOX.w + 8;
					const x2 = FILE_X - 14;
					const y = ROW_Y[i];
					const len = x2 - x1;
					const active = t < (BEATS[i + 1] ?? 99) - 0.45;
					const col = active ? C.accent : '#6B5146';
					return (
						<g key={i} stroke={col} strokeWidth={3.5} fill="none" strokeLinecap="round">
							<line x1={x1} y1={y} x2={x2} y2={y} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
							{p > 0.95 && <path d={`M${x2 - 12} ${y - 10} L${x2} ${y} L${x2 - 12} ${y + 10}`} />}
						</g>
					);
				})}
			</svg>

			{/* file rows */}
			{STEPS.map((s, i) => {
				const st = pop(t, BEATS[i]);
				return (
					<div key={s.file} style={{position: 'absolute', left: FILE_X, top: ROW_Y[i] - 34, ...st, transformOrigin: 'left center'}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
							<FileGlyph size={40} />
							<span style={{fontFamily: MONO, fontSize: 42, fontWeight: 500, color: C.text}}>{s.file}</span>
						</div>
						<div style={{fontFamily: MONO, fontSize: 22, color: C.text2, marginLeft: 56, marginTop: 4}}>{s.fm}</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
