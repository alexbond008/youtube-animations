// QA stills: node stills.mjs <outdir> <Composition> <sec,sec,...> [<Composition> <secs> ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const [out, ...rest] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'index.ts')});
for (let i = 0; i < rest.length; i += 2) {
  const id = rest[i];
  const comp = await selectComposition({serveUrl, id});
  for (const s of rest[i + 1].split(',')) {
    const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(s) * comp.fps));
    const file = path.resolve(out, `${id}_${Number(s).toFixed(1).padStart(4, '0')}s.png`);
    await renderStill({serveUrl, composition: comp, frame, output: file, chromiumOptions: {gl: 'angle'}});
    console.log(file);
  }
}
