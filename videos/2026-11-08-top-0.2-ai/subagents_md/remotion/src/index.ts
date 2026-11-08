import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {AgentMd} from './AgentMd';
import {AgentsTree} from './AgentsTree';
import {Orchestrate} from './Orchestrate';

const FPS = 30000 / 1001;
const D = Math.round(13 * FPS); // 12 s + 1 s clean hold

const Root: React.FC = () =>
	React.createElement(
		React.Fragment,
		null,
		React.createElement(Composition, {id: 'AgentsTree', component: AgentsTree, durationInFrames: D, fps: FPS, width: 1920, height: 1080}),
		React.createElement(Composition, {id: 'AgentMd', component: AgentMd, durationInFrames: D, fps: FPS, width: 1920, height: 1080}),
		React.createElement(Composition, {id: 'Orchestrate', component: Orchestrate, durationInFrames: D, fps: FPS, width: 1920, height: 1080}),
	);

registerRoot(Root);
