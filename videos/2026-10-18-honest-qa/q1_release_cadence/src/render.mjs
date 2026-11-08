// Render: nice -n 10 node render.mjs [CompId ...]   (no args = the 4 v2 variants; 'v1' = the 4 v1 variants)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = {
  Landscape: 'q1_release_cadence_1080p.mp4',
  LandscapeNoText: 'q1_release_cadence_notext_1080p.mp4',
  Vertical: 'q1_release_cadence_vertical_1080x1350.mp4',
  VerticalNoText: 'q1_release_cadence_vertical_notext_1080x1350.mp4',
  V2Landscape: 'q1_release_cadence_v2_1080p.mp4',
  V2LandscapeNoText: 'q1_release_cadence_v2_notext_1080p.mp4',
  V2Vertical: 'q1_release_cadence_v2_vertical_1080x1350.mp4',
  V2VerticalNoText: 'q1_release_cadence_v2_vertical_notext_1080x1350.mp4',
};
const args = process.argv.slice(2);
const ids = !args.length ? Object.keys(OUT).filter((k) => k.startsWith('V2')) : args[0] === 'v1' ? Object.keys(OUT).filter((k) => !k.startsWith('V2')) : args;
const serveUrl = await bundle({entryPoint: path.join(here, 'index.ts')});
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id});
  const outputLocation = path.resolve(here, '..', OUT[id]);
  const t0 = Date.now();
  await renderMedia({
    serveUrl, composition, outputLocation, codec: 'h264', crf: 14, x264Preset: 'slow',
    pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'jpeg', jpegQuality: 95,
    concurrency: 4, muted: true, overwrite: true, chromiumOptions: {gl: 'angle'},
  });
  console.log(`${id} -> ${outputLocation} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
