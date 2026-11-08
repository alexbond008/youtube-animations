# hook_funnel — Karpathy's AI-usage tiers (hook)

`hook_funnel_1080p.mp4` — 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, **22.0 s animation + 1.0 s hold = 23.0 s**, no audio.
`hook_funnel_static.png` — final state.

Left: waffle of 1,000 dots = everyone on Earth (1 dot ≈ 8M people). Right: funnel of tier cards (narrowing widths). Static camera.

| t (s) | Beat | Anchor to VO |
|---|---|---|
| 0.00–0.40 | A: source chip "Andrej Karpathy · X · Oct 2026" | clip start |
| 0.5–3.2 | dot field ripples in (faint), caption "Everyone on Earth · 1 dot ≈ 8M people" at 1.2 | — |
| **4.00** | B: grey dots light top→bottom; card "~6B · 75% · barely touched AI" | "**most**" |
| **6.00** | C: bottom 200 dots turn blue; card "~1–2B · 20% · chatbot users" | "**20%**" |
| 6.55 | chat bubble "can you make me a chicken & rice recipe?" + drawn drumstick (fades 12.6) | "chicken and rice" |
| **13.00** | D: 2 orange dots glow + ring + "0.2% = 2 dots"; card "~20M · 0.2% · agents doing real work" glows orange; rest dims | "**0.2%**" |
| **17.00** | E: small card "~5K · frontier labs" | — |
| 17–22 | idle: orange glow pulse + ping ring | — |

Note: the dot field uses 75/20/0.2 (remainder shown grey) — illustrative proportions, numbers per Karpathy.

Re-render: `cd src && nice -n 10 node render.mjs main 22 ../hook_funnel_1080p.mp4 ../qa 0.3,5,9,14,21.9` (stills: `node stills.mjs main ../qa 21.95`). Source: `src/index.html` + `src/lib.js`.
