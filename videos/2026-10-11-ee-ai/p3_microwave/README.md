# p3_microwave: branch-line coupler, S-matrix, |S21| plot

Point 3 (niche EE knowledge as an edge). Manim CE, generic, no audio. 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p, 9.0 s content + 1.0 s held last frame = 10.01 s (300 frames). File: `p3_microwave_1080p.mp4`.

## Key moments (clip time, s)
| t | What |
|---|---|
| 0.3 | Label "Microwave circuit design" |
| 0.5-3.4 | Top-down microstrip branch-line coupler (square ring, 4 feed lines) is drawn on in orange over a dark PCB-green board |
| 2.45-3.2 | Port labels 1-4 pop in |
| 4.0-4.9 | Board slides left and scales down |
| 4.4-5.5 | 4x4 scattering matrix [S] (STIX Two) builds |
| 5.5-6.1 | S21 and S31 highlighted in orange; pulses run port 1 -> 2 (direct) and 1 -> 3 (coupled) 5.6-7.0 |
| 7.0-7.8 | Matrix shrinks up; |S21| plot card appears (7.1) |
| 7.6-8.8 | Curve draws on (peak -3 dB at f0) |
| 8.6-9.0 | f0 dashed marker, "f0" and "-3 dB" |
| 9.0-10.01 | Static hold |

Suggested cuts: 0-4.0 coupler, 4.0-7.0 matrix, 7.0-10.0 plot.

QA stills in `qa/frame_01-06.png` (2.0, 3.6, 5.0, 6.4, 8.2, 9.0 s). Min text 40 px.

## Re-render
```bash
cd src   # .venv = Python 3.12 + manim 0.21.0; needs brew cairo, pkgconf, ffmpeg
nice -n 10 .venv/bin/python scene.py render --out ..    # ~3 min
.venv/bin/python scene.py stills --times 2 5 --out /tmp/stills
```
