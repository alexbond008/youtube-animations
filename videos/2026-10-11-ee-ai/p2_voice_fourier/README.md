# p2_voice_fourier: voice -> sines -> spectrum -> Voice AI

Point 2 ("the biggest AI products are built on what you study in EE"). Manim CE concept animation, generic (no company, no real person). House look: #0E0E10 dotted grid, Inter / JetBrains Mono, maths in STIX Two, accent #D97757. No audio.

| File | Format |
|---|---|
| `p2_voice_fourier_1080p.mp4` | 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p, 18.0 s content + 1.0 s held last frame = 18.99 s (569 frames) |
| `p2_voice_fourier_vertical_1080x1350.mp4` | Shorts-safe 1080x1350 re-layout, same timing; all text >= 48 px |

## Key moments / cut points (clip time, s)
| t | What |
|---|---|
| 0.0-1.1 | Head profile draws on; orange throat ("sound box") pulse from 0.5 s |
| 0.35 | Label "voice"; sound arcs leave the mouth (0.55-3.6) and become a scrolling irregular voice waveform (from 0.9) |
| **3.0** | **CUT A (waveform section) -> label "sound wave"**; wave decelerates and freezes (3.3), orange highlight + amber sweep (3.3-5.0); head fades 5.3-6.2 |
| **6.1** | **CUT B (sines section starts)**: label "Fourier series"; wave slides up to become the "voice" sum row (6.0-6.9) |
| 6.75-8.25 | Four pure sinusoids peel off one by one: omega (orange), 2omega (blue), 3omega (green), 5omega (purple) |
| 8.9 | Formula "= Sum a_n cos(n w t) + b_n sin(n w t)" (STIX) fades in; sines then slowly travel and the top row stays their exact sum |
| **11.0** | **CUT C (spectrum section starts)**: label "Fourier transform", then "time -> frequency" (11.5); sines collapse into stems (11.3-12.5), axis + other bins grow (12.2-14), stems pulse (13.6-14.9) |
| **15.0** | **CUT D (Voice AI section)**: bars morph into the first spectrogram column, rest sweeps in 15.9-17; label "Voice AI" (15.2) |
| 16.3-16.9 | "spectrogram" caption, arrow, model block appears; network lights up layer by layer 16.9-17.9 |
| 18.0-18.99 | Static hold |

Suggested split: waveform 0-6.1, sines 6.1-11.0, spectrum 11.0-15.0, Voice AI 15.0-19.0. Spoken lines ("Fourier series, Fourier transforms, processing of audio") land best on cuts C/D.

## QA
`qa/frame_01-08.png` (wide: 1.5, 4.0, 8.0, 9.8, 12.5, 14.0, 16.0, 18.0 s) and `qa/tall_01-04.png` (1.5, 8.0, 12.5, 18.0 s). Checked: legible at phone size (wide min text 40 px, vertical 48 px), nothing in the outer 5%.

## Re-render
```bash
cd src   # .venv = Python 3.12 + manim 0.21.0 (uv); needs brew cairo, pkgconf, ffmpeg
nice -n 10 .venv/bin/python scene.py render --variant wide --out ..   # ~4 min
nice -n 10 .venv/bin/python scene.py render --variant tall --out ..
.venv/bin/python scene.py stills --variant wide --times 1.5 8 --out /tmp/stills
```
`scene.py` is a pure function frame(t); `engine.py` drives Manim's Cairo camera, adds bg, glow and the ffmpeg pipe. Fonts (OFL) bundled in `src/fonts/`.
