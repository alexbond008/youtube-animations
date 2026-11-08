#!/usr/bin/env node
// Standalone renderer for q5_english_b2 (uses the edit's Remotion install, writes only to this asset folder).
//   nice -n 10 node src/render.mjs            # all four videos + QA stills
//   node src/render.mjs --stills              # QA stills only
//   node src/render.mjs --only=A,B            # subset of compositions (A, AV, B, BV)
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSET = path.resolve(HERE, '..');
const REMOTION = path.resolve(ASSET, '../../remotion');
const NM = path.join(REMOTION, 'node_modules');
const require = createRequire(path.join(REMOTION, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {renderMedia, renderStill, selectComposition} = require('@remotion/renderer');

const argv = process.argv.slice(2);
const stillsOnly = argv.includes('--stills');
const only = (argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const FPS = 30000 / 1001;

const OUT = {
	A: 'q5_english_b2_a_1080p.mp4',
	AV: 'q5_english_b2_a_vertical_1080x1350.mp4',
	B: 'q5_english_b2_b_1080p.mp4',
	BV: 'q5_english_b2_b_vertical_1080x1350.mp4',
};
// QA still times (s)
const STILLS = {
	A: [1.0, 2.6, 4.8, 9.7, 11.0, 13.0, 17.6, 20.6],
	AV: [4.8, 13.0, 20.6],
	B: [1.0, 2.6, 4.4, 6.0, 11.0, 13.2, 15.0],
	BV: [4.4, 11.0, 15.0],
};

const serveUrl = await bundle({
	entryPoint: path.join(HERE, 'index.ts'),
	webpackOverride: (c) => ({
		...c,
		resolve: {...c.resolve, modules: [NM, 'node_modules']},
		resolveLoader: {...(c.resolveLoader || {}), modules: [NM, 'node_modules']},
	}),
});

const chromiumOptions = {gl: 'angle'};
const ids = only.length ? only : Object.keys(OUT);
fs.mkdirSync(path.join(ASSET, 'qa'), {recursive: true});

for (const id of ids) {
	const composition = await selectComposition({serveUrl, id, chromiumOptions});
	for (const s of STILLS[id]) {
		const frame = Math.min(composition.durationInFrames - 1, Math.round(s * FPS));
		const output = path.join(ASSET, 'qa', `${id}_t${s.toFixed(1)}.png`);
		await renderStill({composition, serveUrl, output, frame, chromiumOptions, overwrite: true});
		console.log('still', output);
	}
	if (stillsOnly) continue;
	const tmp = path.join(ASSET, `.tmp_${id}.mp4`);
	await renderMedia({
		composition,
		serveUrl,
		codec: 'h264',
		outputLocation: tmp,
		crf: 10,
		x264Preset: 'fast',
		pixelFormat: 'yuv420p',
		colorSpace: 'bt709',
		concurrency: 4,
		chromiumOptions,
		imageFormat: 'png',
		muted: true,
		enforceAudioTrack: false,
		overwrite: true,
		onProgress: ({progress}) => process.stdout.write(`\r${id} ${(progress * 100).toFixed(0)}%   `),
	});
	process.stdout.write('\n');
	// Final encode to spec: exact 30000/1001, CRF 14 slow, bt709 tags, faststart, no audio.
	const out = path.join(ASSET, OUT[id]);
	const r = spawnSync('ffmpeg', [
		'-y', '-v', 'error', '-i', tmp, '-an',
		'-vf', 'setpts=N/(30000/1001)/TB', '-r', '30000/1001',
		'-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p',
		'-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
		'-movflags', '+faststart', out,
	], {stdio: 'inherit'});
	if (r.status !== 0) process.exit(1);
	fs.rmSync(tmp);
	console.log('video', out);
}
