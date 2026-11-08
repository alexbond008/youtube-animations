# p4_subagents_fanout

**Point 4 (Source it).** Lines: *"I got AI to run these sub-agents to pretty much scour the whole internet… I found NASA 3D models of Mars rovers, satellite files in .stl"* and *"you are slower than 10 sub-agents scouring the internet"*.

The asset uses the AI-layer style. A **"you + Claude"** node spawns 10 orange sub-agents. They hop across a faint web graph of about 560 site dots, sending out scanning pulses, and bring back file chips. The chips stack in the centre card under **"Found:"**.

| File | Spec |
|---|---|
| `p4_subagents_fanout_1080p.mp4` | 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, `-preset slow`, yuv420p, bt709, no audio. Opaque, full-screen. |
| Length | **10.010 s** (300 frames): 9.0 s of motion, then a 1.0 s clean hold (bit-identical frames). |
| `qa/frame_01..06.png` | Stills from the final MP4 at 0.70 / 2.20 / 3.90 / 5.40 / 6.90 / 9.50 s. |

## Key moments
| Time (s) | What happens |
|---|---|
| 0.00 | The faint web graph (sites, links, generic hub labels such as `forum`, `repo`, `*.edu`, `archive`) and the **you + Claude** node are on screen. The HUD "10 sub-agents · N sites scanned" fades in at top left. |
| 0.36–0.95 | **10 sub-agents spawn** one after another out of the node, with dashed tethers back to it. |
| 0.9–4.6 | The agents fly out across the graph in 3–4 hops each. Each stop fires an orange **scanning pulse** that lights up nearby sites, which stay faintly orange once visited. The counter climbs to about 2,600 sites scanned, and the camera slowly pulls back (1.07× to 1.0×). |
| 3.55 / 3.80 / 4.05 / 4.30 / 4.55 | Green "found" flashes, each with a file chip popping in, in this order: `perseverance.glb`, `curiosity.stl`, `satellite.stl`, `mars-rover.blend`, `nasa-3d-resources`. |
| 4.3–5.3 | The five empty-handed agents fly home and merge into the node. |
| 5.24–5.66 | The node grows into the results card; **"Found:"** appears at 5.52. |
| 6.00 / 6.42 / 6.84 / 7.26 / 7.68 | One delivery at a time, alternating right and left: an agent flies its chip to the card edge and the chip slides into its row, with a green ✓ about 0.3 s later. |
| 7.7–8.1 | The HUD dot turns green (done). |
| 8.4 | The camera settles; everything is static from here. |
| 9.00–10.00 | **Clean hold**: the card with all 5 files ticked, over the lit-up graph. |

**Cut-in suggestions:**
- The spawn and fan-out (0–4.6 s) go under "run these sub-agents to pretty much scour the whole internet".
- The deliveries (6–8 s) go under "I found NASA 3D models of Mars rovers, satellite files in .stl".
- The finished card also works over "you are slower than 10 sub-agents…".
- This asset hands off naturally to the real Perseverance model in `assets/nasa_perseverance/`.

## Content notes
- **The graph, site labels and counter are illustrative**, not real crawl data.
- **The filenames are exactly the ones in the script.** `nasa-3d-resources` is shown as a link chip (globe icon) because it is a site, not a file.
- **No logos are used.** The node uses a generic `>_` terminal glyph next to the text "you + Claude".

## Re-render
```sh
cd src
./render.sh                  # 300 frames at 3840x2160 -> MP4 + qa/ stills
ENCODE_ONLY=1 ./render.sh
node capture.mjs --stills 1,4,7,9.5 --out /tmp/p5
```
- **Requirements:** node, Google Chrome and ffmpeg.
- **Source:** `src/index.html`. The graph is drawn on canvas; the card and chips are DOM.
- **Determinism:** the graph uses Poisson-disc sampling with a fixed seed. Agent paths are keyframed, and the time each site lights up is precomputed, so every frame is deterministic.
- **Timing constants** (in `src/index.html`):
  - File chips: `FILES`.
  - Which agent carries which file: `CARRIER`.
  - Find and dock times: `FIND_T` and `DOCK_T`.
  - Card growth: `T_CARD`.
- **Fonts:** Inter and JetBrains Mono (OFL) are bundled in `src/fonts/`.
