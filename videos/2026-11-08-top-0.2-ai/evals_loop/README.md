# evals_loop — Point 3 "Evals"

`evals_loop_1080p.mp4` — 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio.
16.0 s animation + 1.0 s held last frame = 17.02 s (510 frames). Static camera, element motion only.

Left: a generic editor window `eval_step.py — editor` with an 11-line Python eval (load output, check criteria, return a 0–10 score) and an `eval — terminal` window. Right: "Workflow runs" bar chart v1–v6 with a trend line. Labelled **EXAMPLE** in the header.

## Key moments
| t (s) | what |
|---|---|
| 0.0–1.6 | header + code lines reveal (all code visible by ~1.6) |
| 2.0–3.2 | terminal types `python eval_step.py --run v1` |
| 3.5–4.1 | v1 scored → **4.1** (return line glows, terminal prints score) |
| 4.5 / 5.4 | v2 **5.0**, v3 **5.8** |
| 6.5 / 6.85 / 7.2 | feedback chips: "I don't like this", "I don't like this", "I like this" (thumbs) |
| 8.2–9.0 | chips fly into `c.feedback_match(out)` (line 10); line highlights, "+3 labels" tag |
| 9.7 / 10.9 / 12.1 | v4 **6.9**, v5 **7.6**, v6 **8.4** (lands ~12.7) |
| 13.0 | "+4.3 since v1" pill |
| 13.7 | caption "feedback → better eval → better system"; v6 dot pulses to end |

## Re-render
```
cd src && nice -n 10 node render.mjs evals 16 ../evals_loop_1080p.mp4 ../qa 0.8,4.3,7.6,8.7,11.5,15.9
node stills.mjs evals <outdir> 1,4,8     # quick stills
```
HTML/SVG frame-stepped in headless Chromium (Playwright). `common.js` = palette/helpers, `scene.js` = animation. `node_modules` is a symlink to `why-fail/assets/p1_isolation_week/src/node_modules`.
