# farfetched_slides — three ultra-abstract openai/math preprints as a snappy slide deck, each with an orange "useful for… ?" arrow on the real typeset maths

AI-layer full-screen clip for "Has OpenAI Solved Maths?". It plays under the VO line "if you look at the repo, there are a bunch of papers that are completely out of touch with reality".
- `farfetched_slides_1080p.mp4`: 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio.
- Length 7.01 s: 6 s of animation plus a 1 s held clean last frame (210 frames).

## The 3 papers (titles exactly as typeset on each PDF; paths verified via `gh api` on 2026-11-14)
| # | Title | Repo path | Why chosen |
|---|---|---|---|
| 1 | A CH obstruction to a prescribed categoricity threshold | `openai/math/preprints/A-CH-Obstruction-to-a-Prescribed-Categoricity-Threshold-September-24-2026/paper.pdf` | Result 240. It is model theory plus the continuum hypothesis, and it builds a class with two different models of size ℶ<sub>ω₂</sub>, an infinite cardinal far past countable infinity. Arrow points at ℶ<sub>ω₂</sub> in Theorem 1.1(ii). |
| 2 | The *p*-adic section conjecture | `openai/math/preprints/The-p-adic-section-conjecture-October-6-2026/main.pdf` | Result 019. It is anabelian geometry over p-adic fields: rational points of curves match sections of étale fundamental groups. Arrow points at the quotient `/π₁(X_k̄)` in Theorem 1.1. |
| 3 | The Grothendieck homotopy hypothesis via elementary expansions | `openai/math/preprints/The-Grothendieck-homotopy-hypothesis-via-elementary-expansions-September-24-2026/paper.pdf` | Result 312. It is higher category theory: weak globular ∞-groupoids and Grothendieck coherators. Arrow points at "C-infinity-groupoid" in Theorem 1.1, the one with the pushout square. |

These were picked to cover three different "pure" areas (logic/set theory, arithmetic geometry, higher categories). I avoided the withdrawn Weil-classes paper and all Fourier and Navier–Stokes work. The repo is Apache-2.0. The snippets are 300-dpi crops of each paper's own compiled PDF. No LaTeX compile was needed, because the repo ships the PDFs.

## Key timestamps
- **0.00–0.27:** slide 1 fades and scales in (0.96→1).
- 0.15: an amber marker sweeps over ℶ<sub>ω₂</sub>. 0.27–0.60: the orange arrow draws. 0.20–0.50: the label "useful for… ?" pops in, with the sub-line "an infinite size, far beyond countable infinity".
- **2.00–2.33:** push transition to slide 2 (*p*-adic). The arrow and label land at about 2.45–2.75. Sub-line: "étale fundamental groups of curves over *p*-adic fields".
- **4.00–4.33:** push to slide 3 (Grothendieck). Settled by about 4.75. Sub-line: "∞-groupoids: paths between paths between paths…".
- Idle motion on every slide: the arrow tip bobs about 7 px and the amber highlight breathes. The camera stays static.
- 6.00–7.01: held last frame (slide 3).
- Clean "money" frames: slide 1 at about 1.2 s, slide 2 at about 3.2 s, slide 3 at about 5.2 s.

## Files
- `dl/`: the three downloaded PDFs (one folder per paper).
- `snippets/`: the 300-dpi PNG crops of each Theorem 1.1.
- `qa/frame_t*.png`: QA stills.
- `src/`: `slides.html` (the deck), `render.mjs` (Playwright frame capture → ffmpeg), `make_snippets.py` (crops with PyMuPDF), plus fonts.

## Re-render
```
python -I src/make_snippets.py          # from farfetched_slides/, needs PyMuPDF
cd src && npm install && npm run render  # needs ffmpeg (or $FFMPEG) and Chromium ($CHROME or Playwright headless shell)
```
