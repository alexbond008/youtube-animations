# text_to_cad — a typed prompt ("a box for my Arduino Uno") flies into an isometric enclosure that builds face by face

**File:** `text_to_cad_1080p.mp4` — 1920x1080, 29.97 fps, 6.01 s (5.0 s animation + 1.0 s held last frame), no audio.
**Line:** "You describe what you want and AI is going to build it in CAD."

## Key beats
| t (s) | beat |
|---|---|
| 0.00 | prompt bar in |
| 0.20–1.00 | types `a box for my Arduino Uno` (30 chars/s, orange block cursor) |
| 2.20 | send button pressed |
| 2.50–2.95 | words fly out of the bar into the model area |
| 2.72 | floor plate |
| 2.92 / 3.08 / 3.24 / 3.40 | walls rise one by one (left wall carries USB-B + barrel-jack cut-outs) |
| 3.56 | four standoffs (Uno hole pattern) |
| 3.72–**4.00** | **vented lid drops in, box complete at 4.0 s** (orange glow pulse) — lands on "build it in CAD" |
| 4.15 | chip: "80 × 64 × 30 mm · fits Arduino Uno" |
| 4.3–5.0 | idle: lid bobs gently |
| 5.0–6.0 | held last frame |

## Re-render
```sh
cd src && npm install
# optional: CHROME=<chrome or chrome-headless-shell binary>  FFMPEG=<ffmpeg binary>
nice -n 10 node render.js            # -> ../<dir>_1080p.mp4 (+1 s held last frame)
node render.js --qa 1.0,2.5,5.0      # -> ../qa/frame_XX.png stills at those times
```
`src/scene.html` holds all timing (`window.render(t)` is a pure function of time); `common.js` has easing + a tiny orthographic 3D-to-SVG renderer; `render.js` frame-steps headless Chrome at 2x and encodes H.264 CRF 14 yuv420p bt709, 29.97 fps, no audio. Static camera: all motion is element motion.
