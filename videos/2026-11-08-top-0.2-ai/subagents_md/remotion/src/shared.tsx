import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';

export const INTER = loadInter('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']}).fontFamily;

export const FPS = 30000 / 1001;

export const C = {
	bg: '#0E0E10',
	dot: '#23232A',
	card: '#16161A',
	raised: '#1C1C21',
	border: '#2A2A30',
	borderStrong: '#3A3A42',
	text: '#F5F5F7',
	text2: '#A1A1AA',
	text3: '#6B6B75',
	accent: '#D97757',
	blue: '#4DA3FF',
	green: '#3DDC97',
	red: '#FF5A4E',
	amber: '#F5B800',
};

export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
export const SHADOW = '0 20px 60px rgba(0,0,0,.55)';

/** 0→1 between seconds a and b (clamped, eased). */
export const prog = (t: number, a: number, b: number, ease = EASE) =>
	interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Standard entrance: ~10 frames, opacity + scale 0.92→1. */
export const pop = (t: number, at: number, dur = 10 / FPS): React.CSSProperties => {
	const p = prog(t, at, at + dur);
	return {opacity: p, scale: String(0.92 + 0.08 * p)};
};

export const Background: React.FC = () => (
	<AbsoluteFill
		style={{
			backgroundColor: C.bg,
			backgroundImage: `radial-gradient(circle, ${C.dot} 1.2px, transparent 1.7px)`,
			backgroundSize: '24px 24px',
			backgroundPosition: '12px 12px',
		}}
	/>
);

export const cardStyle: React.CSSProperties = {
	position: 'absolute',
	background: C.card,
	border: `1px solid ${C.border}`,
	borderRadius: 16,
	boxShadow: SHADOW,
};

/** Small document glyph drawn with CSS (no icon font needed). */
export const FileGlyph: React.FC<{color?: string; size?: number; folder?: boolean}> = ({color = C.accent, size = 30, folder}) =>
	folder ? (
		<svg width={size} height={size} viewBox="0 0 24 24">
			<path d="M2 6.5a2 2 0 0 1 2-2h5l2 2.2h9a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="none" stroke={color} strokeWidth={1.8} />
		</svg>
	) : (
		<svg width={size} height={size} viewBox="0 0 24 24">
			<path d="M6 2.5h8l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6.5 2.5z" fill="none" stroke={color} strokeWidth={1.8} />
			<path d="M14 2.5V7.5h5" fill="none" stroke={color} strokeWidth={1.8} />
			<path d="M8.5 12.5h7M8.5 16h5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
		</svg>
	);
