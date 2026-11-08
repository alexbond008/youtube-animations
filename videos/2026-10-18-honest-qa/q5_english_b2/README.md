# q5_english_b2: "How good does my English need to be?"

Two full-screen concept animations in the AI-layer style: #0E0E10 background with a dotted grid, #16161A cards, accent #D97757, Inter and JetBrains Mono. All files are H.264, CRF 14 slow, yuv420p, bt709, exactly 30000/1001 fps, with no audio. Each ends with a clean 1 s hold.

| File | Size | Duration |
|---|---|---|
| `q5_english_b2_a_1080p.mp4` | 1920x1080 | 21.09 s (632 frames) |
| `q5_english_b2_a_vertical_1080x1350.mp4` | 1080x1350 | 21.09 s |
| `q5_english_b2_b_1080p.mp4` | 1920x1080 | 15.42 s (462 frames) |
| `q5_english_b2_b_vertical_1080x1350.mp4` | 1080x1350 | 15.42 s |

Times below are relative to clip start. They match the presenter's cues, so place clip 0 s at the start of each quoted line.

## A: CEFR scale (line starts "your general English skills don't need to be the best…")
- 0.0 s: the "English level" header appears. The six segments A1 to C2 pop in between 0.25 and 1.6 s. The Basic, Independent and Proficient brackets appear between 1.75 and 2.5 s.
- 3.1 s: C2 highlights. At 3.55 s it greys out, at 3.65 s a strike draws across it, and at 4.0 s the "✕ Not needed" pill appears.
- 9.0 s: an orange marker appears over A1. It slides to B2 by 10.3 s, with a faint orange fill trailing behind it.
- 10.4 s: B2 turns solid orange.
- 12.1 s: the "✓ More than enough" tag pops in under B2.
- 15.9 s: the scale rises and the "Your domain · the terminology of your field" panel enters. The EE chips (orange dot) and software chips (blue dot) fly in between 16.35 and 19.4 s: op-amp, interrupt, PCB, embedded, gradient descent, API, latency, firmware, oscilloscope.
- 19.7 s: a dashed "+ more" chip appears. The hold runs 20.1 to 21.09 s.

## B: Python reads like English (line starts "Python uses English syntax…")
- 0.0 to 3.9 s: the `sensors.py` card types out at 32 chars/s:
  - `for sensor in sensors:`
  - `if sensor.is_ready() and not sensor.failed:`
  - `readings.append(sensor.read())`
- From 1.8 s: orange underline sweeps play in turn on for (1.8), in (2.12), if (2.44), is_ready (2.78), and (3.12), not (3.46) and read (about 3.9, once the word has been typed).
- 4.7 to 5.8 s: the `# check every sensor before logging` comment types into line 1. The cursor disappears at 6.4 s.
- 9.6 s: the card slides up and a "What you actually read" plain-English version of the code fades in, with the keywords in orange.
- 12.4 s: an amber marker sweeps across the comment and its text brightens.
- 14.0 s: an "English too" pill pops in. The hold runs 14.35 to 15.42 s.

## QA
`qa/` holds the stills: `A_t*.png`, `AV_t*.png`, `B_t*.png`, `BV_t*.png` and `A_video_t17.6.png`, which was pulled from the final MP4. I checked all of them for legibility, edges and spelling.

## Re-render
```
cd assets/q5_english_b2
nice -n 10 node src/render.mjs              # all 4 videos + stills
node src/render.mjs --stills                # stills only
node src/render.mjs --only=A,AV             # subset (A, AV, B, BV)
```
The render uses the edit's Remotion install in `../../remotion/node_modules` at concurrency 4, and fonts load from Google Fonts. The source is in `src/` (`EnglishA.tsx`, `EnglishB.tsx`, `common.tsx`). Cue times are in the `T` object at the top of each file.
