# m01_3b1b_homage: grid transform that becomes a circuit

This is a full-screen AI-layer concept clip for Point 1 ("See it"). It plays under:

> "back in the day… watching 3Blue1Brown… exceptional presentations of maths in a very visual manner… an incredible Python tool that he built to just make maths beautiful. And guess what? Now we can do this with anything we want, not just maths, but with engineering too."

- **0–6 s:** a linear transformation in the style of 3Blue1Brown. It is an homage built with Manim CE, with no Pi creatures and no logo.
  - A blue #4DA3FF plane carries the basis vectors î (green #3DDC97) and ĵ (red #FF5A4E).
  - The plane shears, then rotates.
  - The composite matrix is shown live in a small card in the top-left. Column 1 (green) is where î lands and column 2 (red) is where ĵ lands.
- **6–10 s:** the same grid lines turn Claude orange #D97757 and are cut into an EE schematic: an op-amp inverting active low-pass filter (R_in, R_f ∥ C feedback, ground).
- Signal pulses then run through the circuit.

## Files
| File | What | Duration |
|---|---|---|
| `m01_3b1b_homage_1080p.mp4` | **Main, no text.** The editor adds captions. The matrix digits and the î/ĵ symbols are part of the maths visual. | 11.011 s (330 frames) |
| `m01_3b1b_homage_label_1080p.mp4` | The same clip plus a small "engineering too" label (Inter SemiBold, white, bottom-centre) that pops in at 8.75 s. | 11.011 s (330 frames) |

Format:
- 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, preset slow, yuv420p.
- bt709 tags (primaries/trc/matrix), tv range, +faststart, no audio.
- The content runs 10 s, followed by a **clean static hold from 10.00 s to 11.01 s**.

## Key moments (clip time)
| t (s) | What happens |
|---|---|
| 0.00–0.95 | The plane draws in from the centre (white axes, blue lines, faint reference grid). î and ĵ grow from 0.45 s. The matrix card pops in at 0.60–0.95 s showing the identity. |
| 1.15–2.95 | Shear: the matrix runs live to [[1, 1], [0, 1]]. |
| 3.25–5.35 | Rotation by 90°: the composite runs to [[0, −1], [1, 1]] (shear, then rotation). |
| 5.35–5.85 | Hold on the transformed plane. |
| 5.85–6.10 | The vectors and matrix card exit (8 frames). |
| **6.00–6.90** | The grid relaxes back to orthogonal while orange redraws every line from the centre outward, giving "engineering paper". |
| **6.80–7.40** | Unused grid lines retract and fade. The circuit pieces are cut from the lines that remain. |
| **6.90–8.60** | The pieces slide and fold into the schematic, assembling left to right. The orange glow builds. |
| 8.55–8.85 | The junction dots land. |
| 8.85–9.98 | Signal pulses run input → R_in → op-amp, then output, then back around the R_f and C feedback. |
| 10.00–11.01 | Static hold on the finished glowing circuit. |

**Sync tip:** in the raw take, "not just maths, but with engineering too" spans about 1.4 s.
- Place the clip so that **6.8 s (the carve) lands on "engineering"**.
- The orange grid at 6.0–6.8 s then sits on "not just maths".
- The transform from 0 to 6 s plays under the 3Blue1Brown sentence.

## QA stills (`qa/`, taken from the final MP4s)
| Still | Time | Shows |
|---|---|---|
| `frame_01.png` | 1.10 s | Plane, î/ĵ and the identity matrix |
| `frame_02.png` | 2.20 s | Mid-shear (live matrix) |
| `frame_03.png` | 5.60 s | Final transform [[0, −1], [1, 1]] |
| `frame_04.png` | 6.70 s | Orange "engineering paper" grid relaxing |
| `frame_05.png` | 7.60 s | Circuit being carved out of the grid |
| `frame_06.png` | 10.50 s | Final hold, label variant |

Checked:
- Text is legible at phone size: the matrix digits are 34 px JetBrains Mono and the label is 52 px Inter.
- Nothing critical sits in the outer 5 %. The matrix card is at x 112–442, y 92–242. The circuit spans about x 323–1597, y 197–885.
- There are no typos, and the last second is static (verified by frame diff of the decoded MP4).

## How to re-render
```bash
cd ~/Projects/Youtube/edit/ai-learn/assets/m01_3b1b_homage/src
./render.sh                     # both variants -> ../m01_3b1b_homage[_label]_1080p.mp4
./render.sh --variant label     # one variant
WORKERS=2 ./render.sh           # fewer worker processes (default 3); runs under nice -n 10
# single frames for checking:
.venv/bin/python render.py stills --variant notext --times 1.1 5.6 10.5 --out /tmp/m01_stills
```
- `render.sh` creates `src/.venv` with uv on first use: Python 3.12 + `manim==0.21.0`. It needs Homebrew `cairo` and `pkgconf`.
- One run takes about 1–3 minutes per variant on the M4.

How it works:
- `src/scene.py` holds the whole animation as a pure function of time, `frame(t)`:
  - geometry, the schematic and the "carve" plan;
  - the live matrix;
  - the pulses.
- `src/engine.py` (identical in m01/m02/m03) drives Manim CE's Cairo `Camera` directly:
  - Each frame is rendered at exactly t = i·1001/30000 s.
  - It uses 6-sample 180° motion blur. The matrix digits are frame-quantised so they never ghost.
  - It adds a two-radius bloom pass for the orange glow and the SPEC dotted background (#0E0E10, dots #23232A, 24 px pitch, r = 1.2 px).
  - It applies the SPEC card shadow.
  - It pipes frames in order to ffmpeg (`/opt/homebrew/bin/ffmpeg`, overridable with `FFMPEG=`).
- Fonts: Inter and JetBrains Mono are bundled in `src/fonts/` (OFL) and registered at runtime. Nothing is installed system-wide.
- `MANIM_MEDIA_DIR` (default: the system temp folder) holds Manim's text cache.
- To tune timings, edit the `T_*` constants at the top of `scene.py`.
