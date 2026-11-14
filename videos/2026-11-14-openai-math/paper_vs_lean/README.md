# paper_vs_lean — a paper proof and a Lean proof that both "check out" but don't say the same thing (m + 4 vs m + 5)

For "Has OpenAI Solved Maths?" (VO: "So does verified mean that it's correct?…"). Illustrative only: generic "Paper proof" vs "Lean proof",
no real authors or pages. Based on the argument that the Lean-verified Navier–Stokes proof does not correspond to the paper proof
(e.g. the paper's inverse estimate uses m + 4 derivatives, the Lean lemma m + 5). It does NOT claim either proof is wrong.

## Files
- `paper_vs_lean_1080p.mp4`: 14.0 s anim + 1 s held last frame (15.015 s)
- `verify_validate_1080p.mp4`: 9.0 s anim + 1 s held last frame (10.010 s)
- 1920×1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio. QA stills in `qa/`.

## paper_vs_lean key moments
| t (s) | what |
|---|---|
| 0.2 / 0.55 | Paper card, then Lean card enter; lines fade in to ~1.6 |
| 2.5 | green "✓ compiles" badge on the Lean card |
| 5.0–5.9 | 5 dashed connectors draw between matching steps (dashes flow) |
| 5.85 / 6.2 / 6.55 / 6.9 | links 1, 2, 3, 5 turn green with ✓ |
| 7.5 | link 4 snaps red with ✗ (paper "m + 4" ↔ Lean "m + 5"); red glow pulses (1.4 s period) to the end |
| 7.75 / 8.05 | amber marker sweeps "m + 4", then "m + 5" |
| 10.0 | caption "Checked ≠ the proof you're reading" |

## verify_validate key moments
| t (s) | what |
|---|---|
| 0.5 | "Verification — Did we build it right?" card, green ✓, chip "Lean" |
| 3.5 | "Validation — Did we build the right thing?" card, orange "?", chip "humans" |
| 6.0 | gradient bar draws between the cards; 6.45 "in sync" pill; dots shuttle along it to the end |
Idle motion: both icons breathe gently. Static camera.

## Re-render
```
cd src && npm install
nice -n 10 node render.mjs paper_vs_lean.html 14 paper_vs_lean_1080p.mp4 pvl 1.0,2.8,5.4,6.4,8.3,11.5
nice -n 10 node render.mjs verify_validate.html 9 verify_validate_1080p.mp4 vv 1.0,4.0,6.3,8.5
```
HTML pages expose `window.renderAt(t)`; `render.mjs` steps frames in headless Chromium and pipes PNGs to ffmpeg.
Env: `FFMPEG` (default `ffmpeg`), `CHROME` (default: Playwright's Chromium, then any cached Playwright headless shell).
Quick stills: `node stills.mjs <page.html> <outDir> 3,8.5,12`. Fonts: Inter, JetBrains Mono, Crimson Pro (OFL, in `src/fonts`).
