# excalidraw_workflow — drawing the system in Excalidraw, then handing it to Claude (Point 2)

B-roll for Point 2 ("design the system first, then split it into workflows"). It shows a real drawing session on the public **excalidraw.com** in dark theme: the control-lab workflow drawn box by box, then exported and dropped into a generic "claude — terminal" window.

Both clips are 1920x1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio, with the last frame held for 1 s. The camera is static.

## Files
- `drawing_1080p.mp4`: **26.16 s**, which is 25.16 s of animation plus a 1 s hold.
- `export_to_terminal_1080p.mp4`: **9.01 s**, which is 8.01 s of animation plus a 1 s hold.
- `diagram.png`: clean dark export, 3520x1120 (2x). It was captured with the UI hidden.
- `diagram.excalidraw`: open it in excalidraw.com with Open (Cmd+O).
- `qa/`: QA stills.
- `src/`: scripts and the scene dump.

## drawing_1080p.mp4: key timestamps
| t (s) | what |
|---|---|
| 0.4–2.6 | Text tool, title "Control lab: my workflow" typed |
| 2.8 → 3.4 | Box 1 dragged out (visible from about 2.9) |
| 3.9 | "Pre-lab (at home)" typed in box 1 |
| 5.6 / 7.7 / 9.3 | "Lab session" / "Data analysis (back home)" / "Write-up" done |
| 9.4–12.6 | Arrows 1→2 (10.5), 2→3 (11.5), 3→4 (12.6) in orange, bound to the boxes. Line these up with "arrow to the next thing". |
| 12.8–18.8 | in/out annotations in blue (40 chars/s), one box after another |
| 18.8–22.8 | Mono green labels (33 chars/s) `agent: prelab / lab-session / data-analysis / write-up` |
| 23.3–25.2 | Finished diagram, cursor idle; hold to 26.16 |

## export_to_terminal_1080p.mp4: key timestamps
| t (s) | what |
|---|---|
| 0–0.4 | Finished diagram |
| 0.4 | Real Excalidraw "Export image" dialog opens (Background on, Dark mode on) |
| 0.7–1.6 | Cursor goes to **PNG** and presses it at 1.67 |
| 1.84 | Background dims and blurs; "claude — terminal" window rises |
| 2.2–3.0 | The diagram PNG flies from the dialog preview into the terminal |
| 3.05 | `diagram.png` attachment chip pops in |
| 3.35–5.4 | Typed: "I've got this diagram of my workflow with all the subsections…" (31 chars/s, #D97757 block caret) |
| 5.4–8.0 | Caret blinks; hold to 9.01 |

## Notes / caveats
- Every frame was captured one step at a time: a scripted mouse or keyboard step on excalidraw.com, then a screenshot at DSF 2, downscaled with lanczos. The result has no jitter and exact pacing.
- The cursor is an injected overlay because headless screenshots have no OS cursor.
- CSS hides the welcome screen, hints, the Excalidraw+/Share buttons, the help button and the left properties panel. The panel was still clicked through script to set colours and fonts. The top toolbar, hamburger menu and zoom/undo stay visible.
- There was no login, no live collaboration and no download. The PNG button is pressed but never released, so nothing is saved. `diagram.png` is a UI-hidden screenshot of the canvas.
- The title sits about 58 px right of box 1's left edge. Excalidraw nudged the view on the first click; it happens before anything is drawn, so no jump is visible.
- Canvas at 145% zoom (static): box row spans 103–1818 px (89%), box-title cap height ~40 px, annotation/label font ~29 px. Annotations type at 40 chars/s (35 would overrun the 18.8 s beat); labels at 33 chars/s. Superseded v1 renders: ~/.Trash/excalidraw_workflow_v1.

## Re-render
Run these from `src/`. Each run needs network access to excalidraw.com, and Playwright falls back to the cached chromium-1223.
```
nice -n 10 node draw.mjs ../drawing_1080p.mp4 2      # ~100 s; also writes scene_dump.json
cp scene_dump.json scene_final.json
node export_parts.mjs                                 # diagram.png, diagram.excalidraw, partA frames
ffmpeg -y -i partA/a0054.png -vf scale=1920:1080:flags=lanczos bgA.png
node render_terminal.mjs                              # partB frames (terminal.html)
cd .. && ffmpeg -y -framerate 30000/1001 -i src/partA/a%04d.png -framerate 30000/1001 -i src/partB/b%04d.png \
  -filter_complex "[0]scale=1920:1080:flags=lanczos,setsar=1[a];[1]setsar=1[b];[a][b]concat=n=2:v=1,tpad=stop_mode=clone:stop=30,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 14 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -r 30000/1001 -movflags +faststart export_to_terminal_1080p.mp4
```
