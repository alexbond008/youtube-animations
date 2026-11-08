# knowledge_expiry — "Your knowledge expires" (Point 5)

Static camera, 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio.

## knowledge_expiry_1080p.mp4 — 12.0 s + 1.0 s hold = 13.0 s
| t (s) | Beat |
|---|---|
| 0.05–0.7 | timeline draws (today, +3 mo, +6 mo, +9 mo) |
| 0.3–0.9 | "Today's AI skills" + 4 cards: Coding agents, Subagents, Evals, Token budgeting |
| **3.0** | food-label sticker "BEST BEFORE ~3 months" slides on (settles 3.4–3.6) |
| 3.45 | red dashed marker rises from "+3 mo" to the sticker |
| **6.0–7.6** | exponential curve sweeps up (glow + area fill); "exponential / what AI can do" at 7.3 |
| **9.0** | today's cards grey out (0.5 s) |
| 9.2 / 9.5 / 9.8 | three dashed "?" cards pop along the curve |
| 10–12 | hold ("?" cards gently pulse) |

## knowledge_expiry_curve_1080p.mp4 — 6.0 s + 1.0 s hold = 7.0 s (for "exponential" line)
No sticker / marker. Cards 0.0–0.6 · curve 0.5–2.1 · label 1.8 · cards grey 2.6 · "?" cards 2.8/3.1/3.4 · hold.

Re-render: `cd src && nice -n 10 node render.mjs main 12 ../knowledge_expiry_1080p.mp4 ../qa 3.8,11.9` and `node render.mjs curve 6 ../knowledge_expiry_curve_1080p.mp4 ../qa 1.5,5.9`.
