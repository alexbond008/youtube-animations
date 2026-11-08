import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

const inter = loadInter('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});
export const INTER = inter.fontFamily;
export const MONO = mono.fontFamily;

export const FPS = 30000 / 1001;

export const C = {
	bg: '#0E0E10',
	dot: '#23232A',
	card: '#16161A',
	cardRaised: '#1C1C21',
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
	marker: 'rgba(245, 184, 0, 0.32)',
};

export const SHADOW = '0 20px 60px rgba(0,0,0,.55)';
export const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Current time in seconds. */
export const useT = () => useCurrentFrame() / FPS;

/** 0→1 eased progress of a tween starting at `start` s and lasting `dur` s. */
export const p = (t: number, start: number, dur: number, easing = EASE_OUT) =>
	interpolate(t, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Entrance durations from the spec: 8–12 frames ≈ 0.27–0.40 s. */
export const IN = 0.34;

export const pop = (k: number, lift = 0): React.CSSProperties => ({
	opacity: k,
	transform: `translateY(${(1 - k) * lift}px) scale(${0.92 + 0.08 * k})`,
});

/** Mix two hex colours. */
export const mix = (a: string, b: string, k: number) => {
	const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
	const [A, B] = [h(a), h(b)];
	return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
};

export const Background: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			backgroundColor: C.bg,
			backgroundImage: `radial-gradient(circle at center, ${C.dot} 1.2px, transparent 1.6px)`,
			backgroundSize: '24px 24px',
			backgroundPosition: '12px 12px',
			overflow: 'hidden',
			fontFamily: INTER,
			color: C.text,
		}}
	>
		{/* soft vignette so the centre reads first */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: 'radial-gradient(ellipse at 50% 45%, rgba(14,14,16,0) 40%, rgba(14,14,16,.75) 100%)',
			}}
		/>
		{children}
	</div>
);

export const CheckIcon: React.FC<{size: number; color: string; k?: number}> = ({size, color, k = 1}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
		<path
			d="M4.5 12.5 L10 18 L19.5 6.5"
			fill="none"
			stroke={color}
			strokeWidth={3.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - k}
		/>
	</svg>
);

export const CrossIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
		<path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
	</svg>
);
