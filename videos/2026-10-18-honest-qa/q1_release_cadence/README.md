# q1_release_cadence

## v2 (2026-10-17): real, dated releases. **Use this one.**
v2 keeps exactly the v1 beat timings (the VO is fixed). It replaces the fictional data with **71 real frontier-model releases** from OpenAI, Anthropic, Google and xAI, 30 Nov 2022 → 13 Oct 2026, stored in `src/releases.json`. The research table, sources and cadence analysis are in my research notes (not published).

| File | Format |
|---|---|
| `q1_release_cadence_v2_1080p.mp4` | 1920×1080, 29.97 (30000/1001), H.264 CRF 14 slow, yuv420p, bt709, no audio, 569 frames = 18.99 s, last 1 s held |
| `q1_release_cadence_v2_notext_1080p.mp4` | Same, without the house label ("Every 2–3 weeks / week / 2 days") |
| `q1_release_cadence_v2_vertical_1080x1350.mp4` (+ `_notext`) | 4:5 Shorts variant: 3 card rows, flatter projection curve |
| `qa/v2_*.png` | QA stills |

### Key moments (v2)
| t (s) | What happens |
|---|---|
| 0.15–2.25 | Strip slides in spanning **Oct 2022 → Nov 2026**. Each real release is a tick coloured by lab (muted green OpenAI, sand Anthropic, blue Google, violet xAI; legend under the strip, plain text). The curve (one notch per release) draws 0.9–2.1 and the head stops just before 24 Jul 2026. Name tags pop in as the curve passes: **ChatGPT · Nov 2022** start marker, GPT-4, Gemini 1.0, Claude 3, GPT-4o, o1, Grok 3, Claude 4, GPT-5, Gemini 3 Pro, Claude Fable 5 (the vertical variant drops some). "frontier" tag at 2.25 |
| 3.45–4.85 | Tags fade, then the camera zooms into Jul → Nov 2026 |
| 5.27 / 6.22 / 7.03 / 7.74 / 8.65 / 9.40 / 9.92 | Real cards drop, and the playhead hits each real date on its beat: Claude Opus 5 (24 Jul), Grok 4.6 (12 Aug), GPT-6 Astra (3 Sep), Claude Opus 5.5 (22 Sep), GPT-6.1 Sol (29 Sep), Claude Haiku 5.5 (7 Oct), Gemini 4 Argon (13 Oct 2026). Other real releases in the window fall in as small chips (Gemini 3.6/3.7/3.8 Flash, Fable 5.1, GPT-6 Sol, Grok 4.7, Sonnet 5.5) |
| **7.6** | "Every 2–3 weeks" |
| 9.95 / 10.35 | Dashed **today** marker (17 Oct 2026), then a hatched region labelled **projection →**. From here on the curve is dashed, and the chips are orange "projected" ticks (no lab), not data |
| 9.3–13.5 | Zoom out and follow into the projection, about 9-day spacing (the real current pace). 2027 passes at about 13.3 |
| **13.5 / 14.5** | "Every week" / "Every 2 days" (presenter's prediction, all inside the projection region) |
| 15.4–15.9 | Dashed curve goes exponential off the top |
| 15.55–17.1 | Zoom out to 2022 → 2035. The ChatGPT start marker returns, and today/projection move down to the strip |
| **16.55 / 16.8** | "2035", then "?" |
| 18.0–19.0 | Held last frame |

Honesty note: the data says the pace across the four labs is already about **8 days median** (last 12 months). The VO's "2–3 weeks" is conservative; it matches Anthropic alone (21 days). The 2–3-week label sits over real releases that are mostly closer together than that, so it isn't overstated.

### Re-render (v2)
```
cd assets/q1_release_cadence/src
nice -n 10 node render.mjs               # the 4 v2 variants (V2Landscape, V2LandscapeNoText, V2Vertical, V2VerticalNoText)
nice -n 10 node render.mjs v1            # the 4 original v1 variants
node stills.mjs <outdir> V2Landscape 2.6,8,15
```
- `src/model2.js` holds the time model. Day 0 is 30 Nov 2022. `CARD_TIMES` holds the beats, and `nowDay` passes through each card's date at its beat. Projected chips are in `PROJ`.
- `src/ReleaseCadence2.tsx` holds the layouts (`LANDSCAPE2`, `VERTICAL2`), lab colours and tags.
- To change data, edit `src/releases.json`. Fields: `label` + `labelPriority` (tag), and `card` (exactly 7, in date order).

---

## v1 (generic, fictional): superseded

This is a concept animation for the line "a new AI model every two, three weeks … every week, or every two days … only god knows what happens in 10 years".

It is an AI-layer full-screen clip: #0E0E10 background with a dotted grid, #16161A cards (radius 16), #D97757 accent, Inter and JetBrains Mono. Everything in it is generic and fictional: "Lab A–D", "New frontier model", and a made-up 2026–2035 timeline. There are no real companies, logos or model names.

## Files
| File | Format |
|---|---|
| `q1_release_cadence_1080p.mp4` | 1920×1080, 29.97 (30000/1001), H.264 CRF 14 slow, yuv420p, bt709, no audio, 569 frames = 18.99 s |
| `q1_release_cadence_notext_1080p.mp4` | Same, without the house-text label ("Every 2–3 weeks / week / 2 days") |
| `q1_release_cadence_vertical_1080x1350.mp4` | 1080×1350 (4:5) Shorts variant with bigger cards |
| `q1_release_cadence_vertical_notext_1080x1350.mp4` | Vertical variant without the house-text label |
| `qa/` | Stills taken from the final renders |
| `src/` | Remotion source |

Motion finishes by 17.1 s. **From 18.0 s to 19.0 s the frame is held clean** so you can trim.

`_notext` drops only the white/orange house label. It keeps the chart labels: the mono "frontier model releases" eyebrow, the "frontier" tag, the months and years, and "2035 ?". These are part of the graphic and don't repeat what the voice-over says.

## Key moments (seconds from clip start = VO timing)
| t | What happens |
|---|---|
| 0.15–0.6 | Calendar strip slides in from the right. Week ticks and months (2026, Feb, Mar, Apr) stagger in |
| 0.9–2.1 | Frontier curve draws left to right. A past release card (Lab D) drops at 1.45. The head dot glows at 2.0 and the "frontier" tag appears at 2.25 |
| 5.27 | First new card drops ("coming out", VO 5.3). Each landing gives a tick, a pulse ring and a notch up on the curve |
| 6.22 / 7.03 / 7.74 / 8.65 / 9.40 / 9.92 | Next cards land at 2–3-week spacing. The newest card gets an orange border |
| **7.6** | House label **"Every 2–3 weeks"** pops in |
| 9.3–13.5 | Timeline starts zooming out. Cards fade into the strip and releases keep falling as orange chips. The **2027** boundary passes at about 13.35 ("next year") |
| **13.5** | Label changes to **"Every week"**. Chips land weekly, about 8 per second |
| **14.5** | Label changes to **"Every 2 days"**. Ticks merge into a glowing solid band |
| 15.4–15.9 | Curve goes exponential and shoots off the top of the frame, with a glow at the exit point. The label exits at 15.55–15.8 |
| 15.55–17.1 | Zoom out to the full decade, 2026 → 2035. A dashed orange marker rises from 2035 |
| **16.55 / 16.8** | **"2035"** pops in, then **"?"** |
| 18.0–19.0 | Held last frame |

## Re-render
Node 25. `src/node_modules` is a symlink to `../../../remotion/node_modules`, the project's Remotion 4.0.532 kit.
```
cd assets/q1_release_cadence/src
nice -n 10 node render.mjs                      # all 4 variants (concurrency 4)
nice -n 10 node render.mjs Landscape            # one: Landscape | LandscapeNoText | Vertical | VerticalNoText
node stills.mjs <outdir> Landscape 2.5,8,15.2   # QA stills at given seconds
```
- Timing lives in `src/model.js`: the speed-of-time curve, the zoom keyframes, the release schedule and the curve level.
- Layout and visuals live in `src/ReleaseCadence.tsx`, with one `LANDSCAPE` and one `VERTICAL` layout object.
- Fonts load at render time through `@remotion/google-fonts`, so rendering needs a network connection.
