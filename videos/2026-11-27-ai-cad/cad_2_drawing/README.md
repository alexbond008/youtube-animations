# cad_2_drawing — CC0 shaft drawing to a FreeCAD model by Claude Code (freecad-mcp), real run + measured comparison

**What it is:** Aleks's prompt is used verbatim: "Hey Claude, here's an engineering drawing. Create the same exact part in CAD, matching every single dimension."
- The drawing PNG was attached as an image.
- It is a real headless Claude Code run (claude-opus-4-8) driving FreeCAD via freecad-mcp.
- Log: `work/run_1/stream.jsonl`. Code and results: `work/run_1/events.txt`.
- Drawing: `../inputs/shaft/shaft_drawing.png`, by VEronikapoluyanova, CC0, Wikimedia Commons.

## Runs
- `work/failed_modal_dialog/`: the first attempt never reached the CAD step. FreeCAD opened a "Document Recovery" modal (left over from an earlier kill), so every tool call timed out. Claude correctly diagnosed it and asked for the dialog to be closed. This was my infrastructure fault, not a model failure. Fixed: the harness now closes documents cleanly and turns off view animations.
- **run_1 (used)**: 270 s, 8 turns, model saved and verified.

## Honest verdict (measured with `src/measure_shaft.py` on the real FCStd)

| | drawing | model | result |
|---|---|---|---|
| Overall length | 258 | 258.0 | ✓ |
| Chain | 24 / 178 / 56 | 24.0 / 178.0 / 56.0 | ✓ |
| Boss | Ø39.70/39.35 | Ø39.70 | ✓ |
| Body | Ø32.00/31.91 | Ø32.00 | ✓ |
| Boss position + width | 12.5 wide, ends at 202 | 24 wide, starts at 202 | ✗ (feature about 12 mm off) |
| Inner steps (25 / 123), threads, grooves, keyways | — | interpreted / simplified (cosmetic threads, square grooves) | ≈ |

Claude flagged the inner steps itself ("my best reconstruction… confirm").

The drawing has its own oddities, for example a "224" where a diameter is expected. Overall it is a good, recognisable stepped shaft with the main dimensions right. It is **not** "every single dimension": the collar is in the wrong place and the details are simplified.

Note: Claude saved its own copy to `~/Shaft_1234.FCStd`. I moved it to `work/run_1/session/`.

## Deliverables (1920×1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio, 1 s held last frame)

### `browse_1080p.mp4` — 13.5 s + 1 s hold (14.5 s)
Real Wikimedia Commons pages, captured by Playwright at DSF 2 and frame-stepped, with a synthetic cursor, click ripple and cursor-following zoom. There was no login and no cookie banner; the site notices were hidden with CSS.
- 0.45 s: click into the search box.
- 0.6–2.0 s: typing "technical drawing shaft".
- 2.0 s: click Search, and the results appear.
- 2.8–5.6 s: scroll past the drawings.
- **6.5 s: click the shaft drawing.**
- 6.7 s: the file page.
- 7.2–8.4 s: zoom into the drawing.
- 9.3–10.6 s: scroll to Licensing.
- 11.0 s: marker on "made available under the Creative Commons CC0 1.0…".
- 11.5 s: ring on the CC0 icons.
- 11.9 s: chip "CC0 · free to use".

Re-render: `node src/browse_capture.mjs work/browse && node src/browse_rects.mjs && node src/browse_render.mjs work/browse browse_1080p.mp4`. Commons search results can change; the capture re-measures the tile.

### `drawing_reveal_1080p.mp4` — 6.0 s + 1 s hold
See the timings in the earlier note: zoom 1.3–3.5 s, credit at 2.6 s.

### `run_1080p.mp4` — 21.0 s + 1 s hold (22.0 s)
The terminal holds the real tool calls; the badge says "4.5 min run · condensed".
- 0.3 s: the prompt plus the image attachment.
- 2.2 s: ToolSearch.
- 2.9–3.7 s: Claude's reading (258 = 24 + 178 + 56; the 7 steps).
- 4.6 s: `create_document`.
- 5.5 s: `execute_code` (the stepped body).
- 7.9 s: `execute_code` (chamfers, undercuts, grooves, keyways). The 3D view steps through each feature, 8.4–11.3 s.
- 12.4 s: volume.
- 13.1 / 13.8 s: `get_view` Top and Front (Claude's own screenshots).
- 15.6 s: "Length 258.0 · Max dia 39.69".
- 16.4 s: Done.
- 17.1 s: Claude's "interpreted" caveat.

The 3D-view frames are Claude's scripts re-run step by step by `src/stages_run.py`, which only adds export hooks.

### `compare_1080p.mp4` — 10.0 s + 1 s hold (11.0 s)
The drawing (top) and a FreeCAD front orthographic view of the real model (bottom) at the same scale, with guides at 0 / 24 / 202 / 258 mm.
- 1.2 s: 258 ✓
- 2.3 s: chain ✓
- 3.4 s: Ø39.70 ✓
- 4.4 s: Ø32 ✓
- 5.5 s: boss position ✗ (red boxes on both)
- 6.7 s: ≈ simplified items

### `turntable_1080p.mp4` — 10.0 s + 1 s hold
Eevee, steel; the object turns 200°.

### `hero_render.png`
3840×2160, Cycles 128 spp.
