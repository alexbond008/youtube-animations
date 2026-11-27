# mcp_bridge — Claude terminal talks to a CAD app over an MCP bridge; tool calls flow across and a cube appears, no clicks

**File:** `mcp_bridge_1080p.mp4` — 1920x1080, 29.97 fps, 8.01 s (7.0 s animation + 1.0 s held last frame), no audio.
**Line:** "use something like FreeCAD MCP … model context protocol … you won't even have to open up the CAD software."

Generic windows only: "claude — terminal" card (left), a generic CAD window labelled "FreeCAD" (right, no real UI or logo), joined by an "MCP · Model Context Protocol" bridge.

## Key beats
| t (s) | beat |
|---|---|
| 0.00 | both cards in (11 frames) |
| 0.12–0.70 | prompt types: `make a 40 mm cube` |
| 0.55 | MCP pill pops in (dim) |
| **1.00** | **bridge lights up** (rails fill orange from both ends, pill glows) — cut so this lands on "MCP" |
| 1.18 | terminal: "freecad connected via MCP" |
| 2.50 / 3.20 / 3.90 | tool-call packets flow right: `create_object`, `execute_code`, `get_view` (1.15 s each; matching terminal lines) |
| 5.00 | wireframe 40 mm cube draws in, "Box" appears in the model tree |
| 5.30 | chip: "no clicks needed" |
| 5.3–7.0 | idle: cube turns slowly, bridge dashes flow, pill breathes |
| 7.0–8.0 | held last frame |

## Re-render
```sh
cd src && npm install
# optional: CHROME=<chrome or chrome-headless-shell binary>  FFMPEG=<ffmpeg binary>
nice -n 10 node render.js            # -> ../<dir>_1080p.mp4 (+1 s held last frame)
node render.js --qa 1.0,2.5,5.0      # -> ../qa/frame_XX.png stills at those times
```
`src/scene.html` holds all timing (`window.render(t)` is a pure function of time); `common.js` has easing + a tiny orthographic 3D-to-SVG renderer; `render.js` frame-steps headless Chrome at 2x and encodes H.264 CRF 14 yuv420p bt709, 29.97 fps, no audio. Static camera: all motion is element motion.
