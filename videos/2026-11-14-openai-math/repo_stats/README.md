# repo_stats — openai/math repository card: 719-manuscript count-up with a "3 WITHDRAWN" stamp, plus a stats board that builds row by row

Two full-screen AI-layer clips for "Has OpenAI Solved Maths?". 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio. Each ends with a 1 s held clean last frame.

## Files
| File | Length | Notes |
|---|---|---|
| `repo_stats_hook_1080p.mp4` | 8.01 s (7 s anim + 1 s hold) | generic repo card "openai / math", counter and 720-cell grid |
| `repo_stats_hook_vertical.mp4` | 8.01 s | 1080x1350 Shorts variant of the hook, same timings |
| `repo_stats_board_1080p.mp4` | 20.99 s (20 s anim + 1 s hold) | stats board |
| `qa/` | | QA stills (`<clip>_t<seconds>.png`) |

## Key timestamps: hook (horizontal and vertical are the same)
- 0.00–0.34: the card fades and rises in.
- 0.25–2.00: the counter goes 0 → 719 "manuscripts" (ease-out). Grid cells light up left to right as it counts: 719 orange cells, 1 empty.
- 2.0–4.0: holds at 719 while the grid shimmers.
- **Piece 2 (srcIn ~3.6):** the card is fully built and reads "719 manuscripts" on its own.
- **4.00–4.20:** the red "3 WITHDRAWN" stamp slams on (rotated −7°, ink texture, small card jolt, red flash). At the same time 3 grid cells turn red and the other cells dim.
- 4.2–7.0: settled; the red cells pulse and the grid keeps shimmering. The counter stays at 719.

## Key timestamps: board (each beat lands on its VO time)
- 0.0: header "openai/math · Oct 6, 2026"
- 1.0: "719 manuscripts" (counts up in 0.9 s)
- 3.5: "372 result families"
- 6.0: "~4,000 problems posed"
- 9.0: "~3 hours of compute per result", with the sub-line "on average, unreleased model"
- 12.5: "~42% formalised in Lean". The ring fills to 42% by about 13.95, then its glow breathes and a sheen runs around the arc until the end.
- 16.0: the red row slides in from the left: "Oct 7: 3 withdrawn · 14 revised". It flashes red on arrival, then a red dot pulses.
- An orange accent bar marks the newest row, and older rows dim slightly.

## Re-render
```sh
cd src && npm install            # playwright only; Chromium from CHROME env or Playwright's headless shell
node render.mjs hook.html 1920 1080 7 repo_stats_hook_1080p.mp4 hook 1.0,3.7,4.25,6.9
node render.mjs "hook.html?v" 1080 1350 7 repo_stats_hook_vertical.mp4 vhook 1.0,3.7,4.25,6.9
node render.mjs board.html 1920 1080 20 repo_stats_board_1080p.mp4 board 0.5,2.2,5.0,10.5,13.2,16.2,19.9
```
Optional env: `FFMPEG` (default `ffmpeg`), `CHROME` (Chromium executable). The pages expose `window.renderAt(t)`, and `render.mjs` steps them frame by frame. Fonts (Inter, JetBrains Mono) are in `src/fonts/`.
