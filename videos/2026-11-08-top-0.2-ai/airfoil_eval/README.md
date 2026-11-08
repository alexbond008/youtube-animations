# airfoil_eval — Point 3 example (aerospace eval)

`airfoil_eval_1080p.mp4` — 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, no audio.
10.0 s animation + 1.0 s held last frame = 11.01 s (330 frames). Static camera.

Left: cambered airfoil at α = 5° with streamlines and speed-coloured particles (blue = slower, orange = faster), labelled "NACA 2412 (example)". Top right: −Cp vs x/c (upper orange, lower blue). Bottom right: `eval_airfoil.py` checklist. No Airbus/brand anything.

**Physics:** exact 2-D potential flow (Joukowski transform, Kutta condition) around a 12%-thick, 2%-camber Joukowski section. It is shape-matched to NACA 2412, not the true NACA coordinates (a Joukowski section has a cusped trailing edge). Streamlines are RK2-integrated in the circle plane. The Cp curve is computed from the same field, with the suction peak at −Cp ≈ 2 near the LE and the stagnation point at −Cp = −1.

## Key moments
| t (s) | what |
|---|---|
| 0.1–1.9 | card, airfoil, streamlines draw left→right |
| 1.2–2.0 | flow particles fade in (keep moving to the end) |
| 3.0–4.9 | Cp card pops; curves draw LE→TE |
| 4.9 | eval checklist card (3 pending rows) |
| 5.5 | ✓ lift slope ≈ 2π /rad |
| 6.5 | ✓ Cp suction peak near leading edge (+ green ring on the Cp peak) |
| 7.5 | ✗ separation at 15° → flag (red row + dashed red separation bubble on the aft upper surface, "at α = 15°: flow separates") |

## Re-render
```
cd src && nice -n 10 node render.mjs airfoil 10 ../airfoil_eval_1080p.mp4 ../qa 1.0,2.5,4.2,5.8,7.0,9.9
```
