# cad_1_arduino — Arduino Uno enclosure designed by Claude Code in FreeCAD (freecad-mcp), real run + measured fit check

**What it is:** a real headless Claude Code session drives FreeCAD through freecad-mcp (neka-nat, MIT). Aleks's prompt is used verbatim, plus one line of context: "It's going on top of a robot, so it needs to screw on."
- Model: claude-opus-4-8 (from the stream-json init).
- Logs: `work/run_N/stream.jsonl` (full), `events.txt` / `events.json` (summary).

## Runs (same prompt, 3 runs; run 1 is used)

| run | time | source Claude used | hole pattern vs official board file | connectors | verdict |
|---|---|---|---|---|---|
| **1** | 536 s | WebSearch only (electricalflux.com, kapycad.com, KiCad #590). **No WebFetch, no datasheet.** | 3 of 4 holes within 0.07 mm; the **bottom-left one is 5.06 mm off** (y 7.6 instead of 2.54) | USB-B and jack both clear the window (USB-B top is tight, about 0.5 mm) | **best: the board drops in and 3 screws fit** |
| 2 | 406 s | WebFetch of a GitHub gist (max-dark/f2e367…) | the pattern is mirrored/wrong: two holes about 10 mm off | clear | worse |
| 3 | 482 s | the same gist (WebFetch), then Claude's own numbers | **all 4 holes exact** | the USB-B hits the solid wall (the port only spans y 3–30); the jack and headers hit the corner bosses, so the board can't go in | the holes are perfect but the box can't be used |

How it was measured: `src/measure.py` and `src/fitcheck_calc.py` place a stand-in board (`src/uno_board.py`), built from the numbers in Arduino's official board file A000066 UNO-TH_Rev3e.brd, inside each model. A FreeCAD boolean `common()` then measures collisions and port blockage.

**Honest verdict for run 1:** a good-looking, sensible two-part enclosure, with:
- a connector window
- 6 wire slots
- 4 M3 robot-mount ears
- a screw-on lid
- standoffs

It is not print-ready as it stands: one standoff is 5 mm off, because Claude trusted a web-search summary. It also never actually fetched a datasheet, although it said "Let me fetch the Arduino Uno mechanical specifications".

## Deliverables (all 1920×1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio, 1 s held last frame)

### `run_1080p.mp4` — 24.0 s + 1 s hold (25.0 s)
The terminal card holds the real log lines (condensed in time), next to a "FreeCAD — 3D view" card. A badge says "9 min run · condensed".
- 0.3 s: the prompt.
- 2.1 s: WebSearch.
- 3.1–4.0 s: the specs Claude settled on. These include the wrong (13.9, 7.6) hole.
- 4.7 s: AskUserQuestion, which went unanswered in the headless run, so Claude used defaults.
- 5.8–9.0 s: the first execute_code. The viewport builds up: tray → standoffs → ears → window → slots → holes → lid.
- 10.1 / 10.8 s: Claude's own get_view screenshots (the real images returned in the run).
- 11.6–12.3 s: the standoff check output.
- 13.5–13.8 s: the real SyntaxError, which Claude fixed.
- 14.9–16.9 s: the rebuild (24 mm walls, wider window).
- 17.8–18.4 s: the real outputs (86.0 × 71.0 mm, 110 mm with ears, 26.5 mm tall).
- 19.2 s: "✓ Done — ArduinoUno_Enclosure.step".

Viewport frames are not screen recordings. They are Claude's two build scripts (verbatim from the log), re-executed step by step by `src/stages_run1.py`, which only inserts export hooks. The final stage volume matches the run's own model exactly (34488.0 mm³). They are rendered in FreeCAD, dimetric view.

### `turntable_1080p.mp4` — 11.0 s + 1 s hold (12.0 s)
- The object turns 190°; the camera is static. Rendered in Blender Eevee, because Cycles ran at about 20 s per frame.
- 0–3 s: assembled.
- 3.0–5.0 s: the lid lifts 34 mm.
- About 8–11 s: the USB-B and jack show through the connector window.
- The lid was moved from Claude's exploded z = 40 down to z = 24, which is a pure translation.
- The board is the official-dims stand-in. It is not Claude's work, and is labelled so here.

### `fitcheck_1080p.mp4` — 8.0 s + 1 s hold (9.0 s)
- A FreeCAD orthographic top view of run 1's base, at 10 px/mm (mapping verified on the render).
- The official outline and 4 holes are overlaid at the board origin Claude used, (8.71, 8.83).
- Check items:
  - 1.0 s: the board fits the cavity ✓
  - 2.0 / 2.6 / 3.2 s: three holes ✓ (0.04, 0.07 and 0.06 mm)
  - 4.2 s: bottom-left ✗, 5.1 mm
  - 5.4 s: connectors clear ✓ (USB-B tight)
  - 6.4 s: "3 of 4 screws line up"

### `datasheet_1080p.mp4` — 7.0 s + 1 s hold (8.0 s)
- Page 11/14 of the official A000066 datasheet (docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf), at 300 dpi.
- 0.6–1.7 s: zoom onto "5.4 Board Outline & Mounting Holes".
- 2.0 s: marker on 4 × Ø3.20 mm, then rings on the 4 holes (2.25–2.55 s).
- 3.1 s: marker on 66.04 mm. 3.6 s: marker on 50.80 mm.
- 4.4 s: chip "Official spec · Arduino Uno Rev3 datasheet · docs.arduino.cc". This is Aleks's call, citing the ground truth. In run 1 Claude itself used a web search, not this PDF, so the chip does not say "fetched by Claude".
- The page does not print 68.6 × 53.4 mm anywhere.

### `hero_render.png` — 3840×2160, Cycles
The lid is lifted over the board, with the connector window toward the camera.

## Re-render
- Run: `../cad_common/src/run_session.sh work/run_N work/prompt.txt`. This needs `claude` logged in. It runs with `--setting-sources project`, so user hooks don't change the output.
- Stages: `freecadcmd src/stages_run1.py work/run_1/code_final.py work/run_1/stages`
- Frames: `python3 ../cad_common/src/render_breps.py work/run_1/vp_frames.json`. FreeCAD must be running with the RPC server.
- Clips: `node ../cad_common/src/render.mjs src/<page>.html <sec> <out>.mp4 qa/<name> "<qa times>"`. The datasheet page takes `?tag=…&url=…`.
- Turntable / hero: `freecadcmd src/export_assembly.py work/run_1 work/board work/blend`, then `blender -b -P ../cad_common/src/bl_scene.py -- src/turntable.json` (or `src/hero.json`).

### `pcb_slot_1080p.mp4` — 6.0 s + 1 s hold
- Shows run 1's real enclosure with the official-dims Uno stand-in board (green PCB; USB-B, jack, headers and ATmega at their Eagle positions). Eevee, static 3/4 camera.
- 0–3.0 s: the board descends.
- **3.0 s: the board seats.** It rests on run 1's standoffs; the misplaced 4th standoff sits 5 mm away from its hole, and no 4th screw is shown.
- From 3.0 s: the USB-B and jack sit in the window.
- 3.5–5.0 s: the lid lowers on.
- Spec: `src/pcb_slot.json`.
