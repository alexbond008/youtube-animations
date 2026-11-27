# sketch_to_model — a hand-drawn dimensioned bracket sketch is photographed by a phone and morphs into a clean 3D part

**File:** `sketch_to_model_1080p.mp4` — 1920x1080, 29.97 fps, 7.01 s (6.0 s animation + 1.0 s held last frame), no audio.
**Line:** "You can even draw the thing by hand … take a photo of a piece of paper of the drawing you have. It is incredible."

The sketch is vector (SVG, wobbled pencil strokes, single-stroke hand digits) — no real photo. L-bracket: 60 × 40, 5 thick, W = 30, Ø6 holes.

## Key beats
| t (s) | beat |
|---|---|
| 0.08–1.64 | sketch draws itself on graph paper (profile, hidden holes, dims 60 / 40 / 5, Ø6, W=30) |
| 1.60–1.90 | phone viewfinder snaps over the sheet, focus brackets tighten |
| **2.00** | **shutter + white flash** — lands on "take a photo" |
| 2.22 | viewfinder exits |
| 2.45–2.95 | photo deskews to straight; orange scan line sweeps 2.50–3.15 |
| 3.20 | paper fades, orange profile replaces the pencil lines exactly |
| 3.30–4.45 | profile extrudes to 30 mm and turns to isometric; holes appear |
| 4.55 / 4.72 / 4.89 / 5.06 | dimension labels: 60 mm, 40 mm, 30 mm, Ø6 mm |
| 4.45–6.0 | idle: part turns very slowly |
| 6.0–7.0 | held last frame |

## Re-render
```sh
cd src && npm install
# optional: CHROME=<chrome or chrome-headless-shell binary>  FFMPEG=<ffmpeg binary>
nice -n 10 node render.js            # -> ../<dir>_1080p.mp4 (+1 s held last frame)
node render.js --qa 1.0,2.5,5.0      # -> ../qa/frame_XX.png stills at those times
```
`src/scene.html` holds all timing (`window.render(t)` is a pure function of time); `common.js` has easing + a tiny orthographic 3D-to-SVG renderer; `render.js` frame-steps headless Chrome at 2x and encodes H.264 CRF 14 yuv420p bt709, 29.97 fps, no audio. Static camera: all motion is element motion.
