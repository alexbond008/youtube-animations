# alpha_brief — Point 4 "Research agents find your alpha"

Two clips. Both are 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio, static camera, with 1 s held last frame. Both are labelled **EXAMPLE**.

## alpha_satellite_1080p.mp4 — 6.0 s + 1 s hold (7.01 s, 210 frames)
A stylised top-down tank farm (12 floating-roof tanks, roof-shadow crescents inside the rims, cast shadows, berms, roads). It is tagged "Illustrative · not a real location". Right panel: cross-section explainer ("less oil → roof lower → longer shadow"), counters, and the signal.

| t (s) | what |
|---|---|
| 0.1–0.5 | image + panel in |
| 0.9–3.1 | orange scanner sweeps L→R; each tank gets brackets + its fill % ; "Tanks measured" counts to 12/12 |
| 3.2–3.9 | "Avg fill level" counts up to **62%** + bar |
| 4.5 | **signal ↑** chip "into the price model" (pulses to end) |

## alpha_brief_1080p.mp4 — 16.0 s + 1 s hold (17.02 s, 510 frames)
| t (s) | what |
|---|---|
| 0.2–1.6 | source chips: News, Y Combinator, YouTube, X, arXiv, Lab blogs, Forums (text only, no logos) |
| 1.5→ | item cards stream right continuously |
| 3.0–3.8 | "Agent swarm" card + nodes/edges; nodes beam onto items; most items grey out (filtered), a few turn orange |
| 6.0 | funnel "Top 5"; passing items flow through it |
| 8.5 | phone card "Daily brief · 09:00 / AI for engineering / RL / TOP 5 TODAY"; rows 8.8–9.7 |
| 11.2 | "Source weights" panel: lab blog ×2.0, forum ×0.7 |
| 12.1–12.6 | weights applied: lab-blog item 0.45 → 0.90 (green), forum item 0.86 → 0.60 (red) |
| 12.8–13.6 | re-rank: lab-blog item #5 → **#2**, forum thread #2 → #5 |

Headlines are generic and invented. They are not real announcements, and no company is named.

## Re-render
```
cd src && nice -n 10 node render.mjs satellite 6 ../alpha_satellite_1080p.mp4 ../qa 0.6,1.8,2.8,3.8,5.9
cd src && nice -n 10 node render.mjs brief 16 ../alpha_brief_1080p.mp4 ../qa 2.0,4.8,7.2,9.6,12.3,13.2,15.9
```
