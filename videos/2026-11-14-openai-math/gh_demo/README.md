# gh_demo — OpenScreen-style GitHub screen demos of openai/math (cursor, click ripples, auto-zoom)

Three b-roll clips for "Has OpenAI Solved Maths?". Each one is a real public GitHub page, captured headless in dark theme at deviceScaleFactor 2 (history.md at DSF 4), then composited frame by frame on a canvas. It is not a live recording. The page sits in a generic browser window on the #0E0E10 dotted background, except history.md, which is full-bleed. On top of the page there is an eased macOS-style cursor, click ripples and a designed cursor-following camera (zoom). There were no logins, no cookies were accepted and nothing was downloaded. Captured 2026-11-14.

Format: 1920×1080, 29.97 fps, H.264 CRF 14 (preset slow), yuv420p, bt709 (tv range), no audio. The last frame is held for 1 s. QA stills are in `qa/`.

## 1. `gh_hook_demo_1080p.mp4`: 6.01 s (5.0 + 1 hold)
VO: "OpenAI just dropped hundreds of research level math papers all in one go."
`math` isn't near the top of github.com/openai (the list is sorted by last update), so the clip uses the org's repository search box.
| t (s) | Beat |
|---|---|
| 0.00 | github.com/openai org page, full window (zoom 1.0) |
| 0.00–0.45 | Cursor glides to the "Find a repository…" box; camera eases to 1.75× (settles at 0.60) |
| 0.50 | Click ripple in the search box (focus ring) |
| 0.62–0.74 | Types "math" (25 chars/s) |
| 0.86–0.96 | Results crossfade in ("3 results … math"); the page eases down 220 px (to 1.30) |
| 0.95–1.32 | Cursor glides to the `math` result |
| 1.40 | Click ripple on `math` |
| 1.50–1.60 | Crossfade to the openai/math repo page. Camera zooms out to 1.0 (2.10): repo header + file list |
| 2.30–5.00 | Smooth scroll into the README (sine ease, still moving at 5.0); camera eases to 1.4× on the README column (4.6) |
| ≈4.3–5.0 | README readable: "Readme", "This repository contains mathematical manuscripts…", "In our view… raw research data…", and "Navigating the collection" (which currently says "721 manuscripts") |

## 2. `gh_repo_anim_1080p.mp4`: 4.50 s (3.5 + 1 hold)
VO: "It releases the OpenAI slash math repository on GitHub." The next cut says "719 manuscripts".
| t (s) | Beat |
|---|---|
| 0.00 | openai/math repo page at 1.12×; camera pushes to 1.65× on the file list (0.55) |
| 0.00–0.50 | Cursor glides to `preprints` |
| 0.60 | Click ripple on `preprints` |
| 0.70–0.80 | Crossfade to the preprints/ folder listing; camera eases out to 1.2× (1.05) |
| 0.85–1.15 | Counter chip pops in at bottom right ("0 manuscripts") |
| 1.00–3.20 | Eased race scroll through all ~31,000 px of folders, with a slight directional motion blur. The counter ticks 0 → 719 in step with the scroll (≈362 at 2.1 s) |
| 3.20 | Lands on the last folders and the counter reaches **719**: orange border pulse and a small scale pop (to 3.55) |
| 3.20–3.50 | Camera keeps creeping (1.30 → 1.36×) |
Note: the folder actually lists **751** entries, and the repo README now says "721 manuscripts". The chip stops at 719 to match the VO. To change it, edit `719` in `render.js`.

## 3. `gh_history_zoom_1080p.mp4`: 6.01 s (5.0 + 1 hold)
VO: "three manuscripts are withdrawn from the repository. Fourteen are being revised."
github.com/openai/math/blob/main/history.md is rendered at a 1100 px viewport (DSF 4) and framed on the "October 7, 2026" section. Text renders at about 2× CSS size, so body text is about 32 px tall at 1080p. The camera makes a slow sine drift for the whole clip: down by 40 px and in from 1.98× to 2.12×.
| t (s) | Beat |
|---|---|
| 0.00–5.00 | Heading "October 7, 2026", the Withdrawals paragraph, the 3 titles and the "We have revised 14 other manuscripts" line are all in frame throughout |
| 0.30–1.45 | Cursor glides to "withdrawn" |
| 1.50–1.85 | Amber marker sweep (#F5B800 @30%) over "withdrawn the following three manuscripts"; the cursor rides the sweep |
| 2.55–2.95 | Cursor moves to "revised" |
| 3.00–3.35 | Amber sweep over "revised 14 other manuscripts" |
| 3.35–5.00 | Both highlights hold; the cursor drifts off right and down |

## Re-render
```
cd src && npm install
export CHROME="<path to a Chrome/Chromium binary>"   # optional; defaults to the playwright-core headless shell
export STATES_DIR=/tmp/gh_states                      # optional; defaults to src/.states
node capture.js                 # 1. fetch the public pages, writes state PNGs + states.json
node render.js all              #    (or hook | repo | history) 2. composite frames, encode the mp4s into ..
QA_T=0.5,1.4,3 node render.js hook --qa   # render a few frames only, into $FRAMES_DIR
```
- `capture.js`: page captures (full-page crops; typing states are set without events, then the real search runs).
- `compositor.html`: a pure canvas renderer (window frame, dotted background, chunked page layers with motion-blur samples, marker sweeps, cursor, ripple, counter chip).
- `render.js`: all timing. It contains the keyframes per clip, the easing and the camera clamp.
- `FFMPEG` is honoured.

Live pages change, so a re-capture can shift coordinates. The rects are measured on each capture, but check the QA stills.
