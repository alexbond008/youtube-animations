# fourier_fft — a square wave builds from sine harmonics, then the FFT's O(n log n) meets the new O(n (log n)^(1−10⁻¹³)) bound

"Has OpenAI Solved Maths?" — the FFT beat (VO: "optimisations in the fast Fourier transform… electrical engineering"; P4: "a paper that claims an optimisation for the fast Fourier transform… we electrical engineers rely on it"). House look: #0E0E10 dotted grid, Inter / JetBrains Mono, maths in STIX Two, wave blue #4DA3FF, newest harmonic green #3DDC97, accent #D97757. No audio. Static camera; the wave travels gently the whole time.

Fact basis: openai/math family 130, "Exact Fourier transforms below n log n": a deterministic exact DFT in O(n (log n)^(1−10^−13)), formalised in Lean, theoretical only (hence "faster… in theory"). "since 1965" = Cooley–Tukey.

| File | Format |
|---|---|
| `fourier_fft_1080p.mp4` | 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709; 13.0 s content + 1.0 s held last frame (420 frames) |
| `fourier_fft_wave_1080p.mp4` | Same look, square-wave build only; 7.0 s + 1.0 s hold (240 frames) |
| `fourier_fft_vertical_1080x1350.mp4` | 1080x1350 re-layout of the main clip, same timing (tag sits under the maths line) |

## Key moments (clip time, s)
| t | What |
|---|---|
| 0.0–0.5 | Axis + faint dashed target square wave; label "Fourier series"; formula f(x) ≈ 4/π[ … |
| 0.15 | Term 1 (sin x) grows in; each harmonic shows in green in the lower band and in the formula |
| 0.95 / 1.6 / 2.2 / 2.75 | Terms 3, 5, 7, 9 pulse in (glow pulse on the sum) |
| 3.2–4.5 | "+ …" and terms 11→39 add quickly; counter reaches 20 terms; wave is square with Gibbs ripple |
| 4.85–5.15 | Harmonic band + formula fade out (main/vertical only; the wave clip keeps them to the end) |
| **5.05** | "Fast Fourier transform" heading |
| 5.5 / 5.85 | "O(n log n)" (JetBrains Mono) / "since 1965" |
| **7.0–7.6** | **Key reveal: O(n (log n)^(1−10⁻¹³)) types in** (orange block cursor, ~30 chars/s); old line dims |
| 7.85 | Orange tag "new · formalised in Lean"; cursor gone by 8.4 |
| **9.5** | Grey note "faster… in theory"; amber marker sweep over the exponent 10⁻¹³ (9.5–9.95) |
| 13.0–14.0 | Held last frame |

## Re-render
```
cd src && pip install -r requirements.txt      # numpy, Pillow; ffmpeg on PATH (or FFMPEG=...)
nice -n 10 python scene.py stills              # qa/*.png
nice -n 10 python scene.py main | wave | vertical
```
Timings live at the top of `scene.py` (`TERMS`) and inline in `render()` (5.05, 5.5, 7.0, 7.85, 9.5). Fonts in `src/fonts` are SIL OFL (Inter, JetBrains Mono, STIX Two).
