import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './common';
import {A_DURATION_S, EnglishA} from './EnglishA';
import {B_DURATION_S, EnglishB} from './EnglishB';

const f = (s: number) => Math.round(s * FPS);

export const Root: React.FC = () => (
	<>
		<Composition id="A" component={EnglishA} durationInFrames={f(A_DURATION_S)} fps={FPS} width={1920} height={1080} defaultProps={{vertical: false}} />
		<Composition id="AV" component={EnglishA} durationInFrames={f(A_DURATION_S)} fps={FPS} width={1080} height={1350} defaultProps={{vertical: true}} />
		<Composition id="B" component={EnglishB} durationInFrames={f(B_DURATION_S)} fps={FPS} width={1920} height={1080} defaultProps={{vertical: false}} />
		<Composition id="BV" component={EnglishB} durationInFrames={f(B_DURATION_S)} fps={FPS} width={1080} height={1350} defaultProps={{vertical: true}} />
	</>
);
