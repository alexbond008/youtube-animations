# long_horizon — one long session rots, sub-agents don't (Point 2)

`long_horizon_1080p.mp4` — 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, **14.0 s + 1.0 s hold = 15.0 s**, no audio. Static camera.

| t (s) | Beat |
|---|---|
| 0.0–0.4 | title "Long-horizon task", chip "1 agent · 1 context window", empty chart/bar/meter |
| 0.4–6.6 | single task bar fills (orange); quality line draws and decays green→amber→red; context meter fills 6%→96% |
| **~4.9** | "context rot" label + arrow (decay clearly visible by 5.0) |
| 7.0–7.5 | line fades to grey ghost, meter + fill drain |
| **7.6–8.3** | SPLIT: bar breaks into 4 bars; chip → "1 orchestrator → 4 sub-agents" (7.7–8.15) |
| 8.4 | ghost label "before: one long session" |
| 8.6–12.2 | 4 sub-agents fill in parallel (staggered 0.22 s); each quality line stays high (green), each "fresh" context meter only reaches 32% |
| **12.3** | "✓ quality stays high" |
| 12.7–14 | hold |

Caption throughout: "illustrative · Anthropic calls this ‘context rot’" — curves are illustrative, not data.

Re-render: `cd src && nice -n 10 node render.mjs main 14 ../long_horizon_1080p.mp4 ../qa 3,5.5,8,13.9`.
