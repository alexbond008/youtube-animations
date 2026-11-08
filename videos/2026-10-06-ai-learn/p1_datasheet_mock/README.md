# p1_datasheet_mock

**Point 1 (See it), STM32 story.** Line: *"I had an STM32 and had to connect it to an ST-Link to do some power measurements… it was very very confusing how to connect these together, the data sheet was terrible."*

A dense, fictional microcontroller reference manual. Its pages sit on the dark AI-layer grid. A slow push-in moves onto a power-supply page, then pages multiply and pile up into confusion.

| File | Spec |
|---|---|
| `p1_datasheet_mock_1080p.mp4` | 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, `-preset slow`, yuv420p, bt709, no audio. Opaque, full-screen. |
| Length | **6.006 s** (180 frames): 5.0 s of motion, then a 1.0 s clean hold. |
| `qa/frame_01..06.png` | Stills from the final MP4 at 0.30 / 1.40 / 2.60 / 3.50 / 4.40 / 5.80 s. |

## Key moments
| Time (s) | What happens |
|---|---|
| 0.00 | Page 214/1386 of the fictional *MCU-32 Series Reference Manual, Rev 7* is already on screen. It shows power supplies, the "Figure 14. Power supply overview" block diagram, and Run-mode and low-power current tables. |
| 0.00–0.33 | A file chip fades in at top centre: `MCU-32_Reference_Manual_Rev7.pdf · 1,386 pages`. |
| 0.00–5.00 | A slow push-in goes from 0.71× to 1.95× onto Figure 14 and Table 22. Most of the move is done by about 2.5 s, where the tiny text becomes readable. |
| 2.15–4.65 | Twelve more pages fly in one after another, about every 0.18 s, and overlap: LQFP64 pinout plus pin table, block diagram, register description, register map, SWD timing, clock tree, electrical characteristics, alternate-function table and package drawing. Older pages darken as new ones land on top. |
| 5.00–6.00 | **Clean hold** on the pile of pages. The file chip stays on top. |

**Cut-in suggestion:** start on "the data sheet was terrible…" or slightly before. The single readable page reads as "datasheet" within the first 0.5 s.

## Content notes
- **Everything is invented:** the "MCU-32" part, document ID `RM-M32 Rev 7`, register names (PMU_CRx, LVDTH, MONEN…), pin and alternate-function tables, figures and numbers.
- No vendor text, layout or register map was copied. The pin-table alternate functions are generated from a generic pool with a fixed seed.
- Standard industry terms (SWD, NRST, VDD/VSS, LQFP64) appear as generic vocabulary only. The package dimensions follow the generic JEDEC LQFP64 outline.
- There are no logos and no company name.

## Re-render
```sh
cd src
./render.sh          # captures 180 frames at 3840x2160 (headless Chrome), Lanczos-downscales, encodes, writes qa/ stills
ENCODE_ONLY=1 ./render.sh   # re-encode existing ../_frames only
node capture.mjs --stills 1.0,3.0 --out /tmp/p1   # quick 1080p review stills
```
- **Requirements:** node, Google Chrome and ffmpeg (`/opt/homebrew/bin/ffmpeg`).
- `capture.mjs` uses `puppeteer-core`. It loads a local install if present, otherwise the copy in `broll/ai-learn/02_stm32_power_wiring/src/node_modules`.
- **Source:** `src/index.html`. Open it in Chrome to see a looping live preview. All motion is a pure function of time (`window.renderAt(t)`), so frames are deterministic.
- **Timings:** the `FLY` table holds the page order, landing positions and arrival times. The `renderAt` camera curve sets the push-in.
- **Fonts:**
  - Inter and JetBrains Mono (OFL) are bundled in `src/fonts/`.
  - The page body uses Arial, a macOS system font.
