# latex_showcase — the real typeset "Catalan's constant is irrational" paper (openai/math) fans in, glides down a dense page and zooms onto eq. (14): "good luck reading this"

Full-screen b-roll for *Has OpenAI Solved Maths?* (VO: "...it looks like hieroglyphics..."). AI layer (#0E0E10 dotted grid, Inter / JetBrains Mono, accent #D97757, amber #F5B800 marker). The pages are the actual compiled `paper.pdf` from github.com/openai/math (`preprints/Catalans-constant-is-irrational-September-24-2026/`), rasterised with PyMuPDF (dense page at 450 dpi so the zoom stays crisp, others at 220 dpi). No LaTeX compile needed.

`latex_showcase_1080p.mp4`: 1920x1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio, **8.01 s (7.0 s motion + 1 s held last frame)**.

| Time | Moment |
|---|---|
| 0.00–0.80 | Three white pages slide/fan in (p.11 Lemma 3.1 and p.21 behind, tilted); title page lands front: **"Catalan's constant is irrational"** readable |
| 0.33–0.73 | Credit chip fades in bottom-left: `openai/math · Catalan’s constant is irrational` (stays to the end) |
| 1.13–1.60 | Dense page 6 slides up over the stack |
| 1.53–2.27 | Designed zoom into page 6 (~40% of the page in view, body text ~35 px) |
| 2.27–4.14 | Camera glides down the page: ∫ log tan, Σ ρ^k sin(kx), recurrences (13) to the cases array (14) |
| 4.14–4.74 | Zoom onto eq. (14) `M⁰(i,j) = { k⁻_{i−j} − Σ … }`; rest of page dims (from 4.34) |
| 4.67–5.14 | Amber marker sweep left to right over eq. (14) |
| 5.27–5.60 | Orange chip pops: **"good luck reading this"**; hand-drawn arrow draws to the equation (5.40–5.74) |
| 5.74–6.97 | Chip idle bob (one slow cycle, ends at rest) |
| 7.01–8.01 | Held last frame |

## Re-render
```
curl -L -o dl/paper.pdf https://raw.githubusercontent.com/openai/math/main/preprints/Catalans-constant-is-irrational-September-24-2026/paper.pdf
pip install -r src/requirements.txt
python src/render.py            # -> latex_showcase_1080p.mp4 (~80 s on M4)
python src/render.py --stills   # -> qa/frame_XX_fNNN.png
```
`FFMPEG` env var overrides the ffmpeg binary. Fonts (Inter, JetBrains Mono, OFL) are in `src/fonts/`. Timings and the eq. (14) bbox are constants at the top of `src/render.py`.
