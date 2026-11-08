# q3_fifty_users

This is a concept animation for the internship-prep answer: "build a tool people actually use → 50 live users → serious candidate". It uses the AI layer (#0E0E10 + dotted grid, #16161A cards with radius 16, #D97757 accent, Inter / JetBrains Mono). Everything in it is generic and fictional: the "split-it" bill-splitting app and a "Your Name" CV.

## Files
| File | Spec |
|---|---|
| `q3_fifty_users_1080p.mp4` | 1920×1080, 29.97 fps, H.264 CRF 14, bt709, 30.0 s (899 frames), no audio |
| `q3_fifty_users_notext_1080p.mp4` | Same, but with no family name labels (Mom/Dad/Uncle/Auntie/Granddad) under the avatars |
| `q3_fifty_users_vertical_1080x1350.mp4` | 1080×1350 vertical re-layout for Shorts (same timings) |
| `q3_fifty_users_vertical_notext_1080x1350.mp4` | Vertical, no name labels |
| `qa/` | QA stills (landscape `frame_*`, vertical `vert_*`) |
| `src/` | `scene.html` (deterministic SVG scene with `render(t)`) and `render.mjs` (frame-stepped headless Chrome, piped to ffmpeg), plus local fonts |

There is no house-style (Aleks-layer) text in this asset. The `_notext` cut only removes the avatar name labels, which repeat the spoken words, so the editor can caption them in house style instead. All other text (the app UI, the counter, the CV line and the stamp) is part of the graphic itself.

## Key timestamps (clip-relative; the clip starts on "maybe you sat there…")
| t (s) | Beat |
|---|---|
| 0.0–3.5 | The split-it app window builds: title bar, heading, 3 rows, then the orange "Settle up" button **lands at 3.5** |
| 4.9 / 5.1 / 5.2 / 5.7 / 6.2 | Avatars pop clockwise on each word: Mom (top), Dad, Uncle, Auntie, Granddad. The "Live users" counter appears and reads 1→5 |
| 7.3–7.7 | ♥ badges pop on all five ("they all really liked it") |
| 7.85–8.95 | Camera pulls back (card and family shrink) to make room |
| 9.2–10.4 | Each family member spawns 3 people (15), with small floating hearts ("they liked it too") |
| 10.5–11.8 | Each of those spawns 2 more (30). The counter ticks up and **lands on 50 at 11.8**, turning orange with a small bump |
| 12.3–20.1 | The network breathes, with faint activity dots running along the edges |
| **15.4** | "Impact" pulse: an orange glow blooms from the centre and a wave travels out along the edges (≈15.5–16.8) |
| 20.55–21.2 | The network collapses into the app card |
| **21.2** | Morph: the CV card enters and the app card flies into the "Projects" icon |
| 23.4–24.4 | "Built a tool with 50 live users" types in (30 chars/s, orange block cursor), followed by the sub-line "split-it · a bill-splitting web app" |
| **26.7** | Orange marker sweep over "50 live users" (26.7–27.0) |
| **28.5** | The green "Serious candidate ✓" stamp slams down (it lands on 28.5) |
| 29.0–30.0 | Clean held last frame (1 s) |

Usage: cover the base for 0–30 s (full layout). Trim the tail as needed. If the cut to the CV beat should be tighter, the 12–20 s stretch is calm and can be shortened by cutting inside it (nothing keys between 11.8 and 15.4, or between 16.8 and 20.5).

## Re-render
```bash
cd assets/q3_fifty_users/src
export PW=<path>/node_modules/playwright-core          # npm i playwright-core@1.56.1 (anywhere)
export CHROME=~/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell
nice -n 10 node render.mjs --out ../q3_fifty_users_1080p.mp4 [--notext]
nice -n 10 node render.mjs --w 1080 --h 1350 --out ../q3_fifty_users_vertical_1080x1350.mp4 [--notext]
node render.mjs --stills 3.5,11.8,15.9,27.2,29.0 --stilldir ../qa            # QA stills
```
All beat times are in the `T` object at the top of `scene.html`, and the layout for each format is in `L`. Each full render takes about 2–3 min.
