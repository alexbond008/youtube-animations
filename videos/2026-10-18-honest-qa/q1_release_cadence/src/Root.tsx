import React from 'react';
import {Composition} from 'remotion';
import {ReleaseCadence, LANDSCAPE, VERTICAL} from './ReleaseCadence';
import {ReleaseCadence2, LANDSCAPE2, VERTICAL2} from './ReleaseCadence2';
import {DURATION_FRAMES, FPS} from './model.js';

// v1 = generic/fictional (Lab A–D); v2 = real dated releases (releases.json)
const variants = [
	{id: 'Landscape', layout: LANDSCAPE, showText: true},
	{id: 'LandscapeNoText', layout: LANDSCAPE, showText: false},
	{id: 'Vertical', layout: VERTICAL, showText: true},
	{id: 'VerticalNoText', layout: VERTICAL, showText: false},
];
const variants2 = [
	{id: 'V2Landscape', layout: LANDSCAPE2, showText: true},
	{id: 'V2LandscapeNoText', layout: LANDSCAPE2, showText: false},
	{id: 'V2Vertical', layout: VERTICAL2, showText: true},
	{id: 'V2VerticalNoText', layout: VERTICAL2, showText: false},
];

export const Root: React.FC = () => (
	<>
		{variants.map((v) => (
			<Composition key={v.id} id={v.id} component={ReleaseCadence} durationInFrames={DURATION_FRAMES} fps={FPS}
				width={v.layout.W} height={v.layout.H} defaultProps={{layout: v.layout, showText: v.showText}} />
		))}
		{variants2.map((v) => (
			<Composition key={v.id} id={v.id} component={ReleaseCadence2} durationInFrames={DURATION_FRAMES} fps={FPS}
				width={v.layout.W} height={v.layout.H} defaultProps={{layout: v.layout, showText: v.showText}} />
		))}
	</>
);
