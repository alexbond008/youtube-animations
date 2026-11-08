import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, C, cardStyle, FileGlyph, INTER, MONO, pop, prog} from './shared';

// Wraps the Code Hike render (work/codehike.mp4: 4 steps x 3 s, tokens morph at
// the start of each step) in a generic editor card whose tab shows the file name.
const FILES = ['prelab.md', 'lab-session.md', 'data-analysis.md', 'write-up.md'];
const SCALE = 0.8;
const VW = 1600 * SCALE;
const VH = 1080 * SCALE;
const HEADER = 66;

export const AgentMd: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const idx = Math.min(3, Math.floor(t / 3));
	const left = (1920 - VW) / 2;
	const top = (1080 - VH - HEADER) / 2;
	const lastFrame = Math.floor(11.95 * fps);
	const video = <OffthreadVideo src={staticFile('codehike.mp4')} muted style={{width: VW, height: VH}} />;

	return (
		<AbsoluteFill style={{fontFamily: INTER}}>
			<Background />
			<div style={{...cardStyle, left, top, width: VW, height: VH + HEADER, overflow: 'hidden', background: '#101114', ...pop(t, 0, 8 / fps)}}>
				<div
					style={{
						height: HEADER,
						background: C.card,
						borderBottom: `1px solid ${C.border}`,
						display: 'flex',
						alignItems: 'center',
						padding: '0 26px',
						gap: 16,
						fontFamily: MONO,
						fontSize: 27,
					}}
				>
					<FileGlyph size={30} />
					<span style={{color: C.text2}}>.claude/agents/</span>
					<span style={{position: 'relative', color: C.text, fontWeight: 700}}>
						{FILES.map((f, i) => {
							const o = i === idx ? (i === 0 ? 1 : prog(t, i * 3, i * 3 + 0.25)) : 0;
							return (
								<span key={f} style={{position: i === 0 ? 'relative' : 'absolute', left: 0, top: 0, opacity: i === 0 ? (idx === 0 ? 1 : 0) : o, whiteSpace: 'nowrap'}}>
									{f}
								</span>
							);
						})}
					</span>
					<span style={{marginLeft: 'auto', fontFamily: INTER, fontSize: 22, fontWeight: 600, color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 999, padding: '4px 14px'}}>
						subagent {idx + 1}/4
					</span>
				</div>
				{frame < lastFrame ? video : <Freeze frame={lastFrame}>{video}</Freeze>}
			</div>
		</AbsoluteFill>
	);
};
