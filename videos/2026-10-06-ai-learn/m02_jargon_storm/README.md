# m02_jargon_storm: jargon overload collapses to "training loop"

This is a full-screen AI-layer concept clip for Point 3 ("80/20 it"). It plays under:

> "in deep learning you've got forward passes, activation functions, softmax, tanh and ReLU, inputs, outputs, matrices… transformers, normal neural networks, graph neural networks, what's the difference? Oh my God, I can go on forever… I needed to really filter that down… I just need to get a training loop going."

**The story:**
1. Deep-learning terms flood the frame faster and faster until it is overwhelming.
2. Everything dims and falls away except **"training loop"**.
3. "training loop" glows Claude orange and moves to the centre.
4. A three-line PyTorch-style loop types in underneath.
5. The subtitle "the 20% I actually needed" appears.

## File
| File | Duration |
|---|---|
| `m02_jargon_storm_1080p.mp4` | 10.010 s (300 frames). The content ends at 9.01 s, followed by a **clean static hold from 9.01 s to 10.01 s**. |

Format:
- 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, preset slow, yuv420p.
- bt709 tags, tv range, +faststart, no audio.

## Key moments (clip time)
| t (s) | What happens |
|---|---|
| 0.00–1.90 | The terms he actually says appear in his order, about 6 per second, large and readable: forward pass, activation functions, softmax, tanh, ReLU, inputs, outputs, matrices, transformers, neural networks, graph neural networks, backpropagation. |
| 1.90–5.25 | 117 more terms arrive, escalating from about 2 per second to about 60 per second. |
| 2.55 | "training loop" quietly appears as an ordinary grey term (lower right). |
| 5.25–5.50 | Peak overload: 129 terms on screen. |
| **5.50** | **The drop.** Everything dims at once and falls away (gone by about 6.15 s). "training loop" turns #D97757 and glows (5.50–5.95), then glides to the top centre and grows to 100 px (5.55–6.20). |
| 6.18–6.51 | The code card enters (#16161A, radius 16, SPEC shadow). |
| 6.50–8.63 | Three lines type in at 35 chars/s behind an orange block cursor (indentation is instant, like auto-indent): `for epoch in range(n):` / `    loss = model(x).loss` / `    loss.backward(); opt.step()` |
| 8.68–9.01 | The subtitle **"the 20% I actually needed"** pops in ("20%" in orange). |
| 9.01–10.01 | Static hold. |

**Storm detail:**
- Terms come in three depth tiers:
  - near: Inter SemiBold, white #F5F5F7, 52–84 px;
  - mid: Medium, grey #A1A1AA, 36–50 px;
  - far: Regular, #62626C, 22–31 px.
- Every term drifts slowly, and a gentle 5 % camera push builds tension.
- Each term enters with the SPEC pop (scale 0.92→1 plus fade, 10 frames).
- The early terms are placed so they never overlap while drifting. Terms spawned after 4.6 s are allowed to pile up.
- Every term stays inside the 5 % safe area until it falls.

**Sync tips:**
- Start the clip on "forward passes".
- Put **5.5 s (the drop)** on "I needed to really filter that down" (trim the storm to taste; it works from about 3 s on).
- The code then types under "I just need to get a training loop going".

## QA stills (`qa/`, taken from the final MP4)
| Still | Time | Shows |
|---|---|---|
| `frame_01.png` | 1.20 s | First spoken terms, readable |
| `frame_02.png` | 3.50 s | Building |
| `frame_03.png` | 5.40 s | Peak overload |
| `frame_04.png` | 5.85 s | Fall-away; "training loop" turns orange |
| `frame_05.png` | 7.60 s | Typing in progress |
| `frame_06.png` | 9.50 s | Final hold |

Checked:
- Every term, the code and the subtitle were spell-checked.
- The hero text, code and subtitle are 100 / 40 / 42 px and readable at phone size.
- Nothing is cut off at the edges, and the last second is static (verified by frame diff of the decoded MP4).
- **Cursor:** the cursor stays solid while typing and in the hold, with no blink. This keeps the final second a clean static frame for trimming.

The term list lives in `src/scene.py`: `SPOKEN`, `BRIEF`, `MORE` and `MONO` (monospace code fragments). The layout is seeded, so every render is identical.

## How to re-render
```bash
cd ~/Projects/Youtube/edit/ai-learn/assets/m02_jargon_storm/src
./render.sh                      # -> ../m02_jargon_storm_1080p.mp4  (about 2-3 min on the M4)
WORKERS=2 ./render.sh            # fewer worker processes (default 3); runs under nice -n 10
.venv/bin/python render.py stills --times 1.2 5.4 9.5 --out /tmp/m02_stills
```
- `render.sh` creates `src/.venv` with uv on first use: Python 3.12 + `manim==0.21.0`. It needs Homebrew `cairo` and `pkgconf`.
- `src/scene.py` is the animation as a pure function of time.
- `src/engine.py` (shared by m01/m02/m03) drives Manim CE's Cairo camera:
  - It renders at exact 29.97 fps timing with 4-sample 180° motion blur. Typing and the cursor are frame-quantised so they never ghost.
  - It adds a bloom pass for the orange glow, plus the SPEC dotted background and card shadow.
  - It encodes with ffmpeg.
- Fonts: Inter and JetBrains Mono are bundled in `src/fonts/` (OFL).
- To change timing, edit the constants at the top of `scene.py`: `T_FALL`, `T_CARD`, `T_TYPE`, `TYPE_RATE`, `T_SUB`.
