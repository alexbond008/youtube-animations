# p2_paper_flood

**Point 2 (Filter it).** Line: *"in my job a big element is reading research papers… there's so much to read and you can't read everything, so you need to decide what you're going to read."*

The asset uses the AI-layer style throughout: #0E0E10 background, dotted grid, #16161A cards and the orange accent.

| File | Spec |
|---|---|
| `p2_paper_flood_1080p.mp4` | 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, `-preset slow`, yuv420p, bt709, no audio. Opaque, full-screen. |
| Length | **9.009 s** (270 frames): 8.0 s of motion, then a 1.0 s clean hold. |
| `qa/frame_01..06.png` | Stills from the final MP4 at 0.80 / 2.40 / 3.90 / 5.20 / 6.90 / 8.60 s. |

## Key moments
| Time (s) | What happens |
|---|---|
| 0.00 | Paper cards are already raining (about 10 in flight). The "papers to read" counter chip (top-left) starts climbing. |
| 0.00–4.00 | 78 fictional abstract cards rain down and pile up until they cover the frame. Older cards darken under newer ones. The counter climbs from 0 to **214**. |
| 4.00–4.40 | The pile dims and blurs. The orange **AI filter** funnel appears, with its label at 4.22. |
| 4.42–6.35 | Cards lift off the pile and pour into the funnel mouth while the funnel shimmers. The counter drops from 214 to **2**. |
| 6.30 | Glowing card 1, **"Sparse Experts for Efficient Post-Training"**, pops out of the spout on a dashed connector. |
| 6.78 | Glowing card 2, **"Verifier-Guided Rollouts for Long-Horizon Agents"**, pops out. |
| 7.05 / 7.45 | Green **✓ Worth reading** badges pop on cards 1 and 2. The counter's "2" turns green between 6.9 and 7.3. |
| 8.00–9.00 | **Clean hold**: funnel, the two worth-reading cards and "2 papers to read". |

**Cut-in suggestion:**
- 0–4 s goes under "there's so much to read…".
- The funnel lands on "you need to decide what you're going to read".
- To use only the payoff, start at about 4.0 s.

## Content notes
- **All paper titles are invented**, for example "Scaling Laws for Reward Models" and "Tool-Use Traces as Free Supervision".
- The two "worth reading" titles were web-searched and do not exist as papers. "Scaling Laws for Reward Models" is a rain card only, because it is close to a real title's prefix.
- **Authors:** cards show "Anonymous authors · under review" or "et al. · 2026". There are no real names.
- There are no arXiv or other site branding and no logos.
- **"AI filter":** Inter's serifed capital I (`cv08`) is enabled so "AI" never reads as "Al".

## Re-render
```sh
cd src
./render.sh                  # 270 frames at 3840x2160 -> MP4 + qa/ stills
ENCODE_ONLY=1 ./render.sh    # re-encode existing ../_frames
node capture.mjs --stills 2,5,8 --out /tmp/p2
```
- **Requirements:** node, Google Chrome and ffmpeg.
- `capture.mjs` uses a local `puppeteer-core` or falls back to the copy in `broll/ai-learn/02_stm32_power_wiring/src`.
- **Source:** `src/index.html`. The pile physics is a deterministic height-map simulation with a fixed seed.
- **Timing constants:**
  - Rain spawn curve: `c.t0`.
  - Suction window: `SUCK0`, `SUCK1`, `FLIGHT`.
  - Output cards: `OUTS[].t0` and `.tb`.
  - Counter total: `TOTAL`.
- **Fonts:** Inter and JetBrains Mono (OFL) are bundled in `src/fonts/`.
