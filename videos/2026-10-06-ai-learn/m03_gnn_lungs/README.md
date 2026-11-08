# m03_gnn_lungs: airway tree as a graph, and the 20 % you need

This is a full-screen AI-layer concept clip for Point 3 ("80/20 it"). It plays under:

> "when I was working on my thesis in graph neural networks for simulating airway flow in the lungs, I got stuck"

**The visual:**
- A bronchial airway tree is drawn as a **graph**: the trachea sits at the top and branches recursively for 6 generations into a two-lung silhouette. Nodes are dots and edges are grey.
- GNN-style **message passing** runs on it: blue pulses travel along every edge in both directions in synchronous rounds, and then every node "updates" with a blue flash.
- At 6.5 s a **connected subtree with 20 % of the nodes** lights up in Claude orange, from the trachea down, with the label **"the 20% you need"**.

## Files
| File | What | Duration |
|---|---|---|
| `m03_gnn_lungs_1080p.mp4` | **With text:** the small title "Thesis: GNNs for airflow in the lungs" (top-left, Inter SemiBold, white) and the label "the 20% you need" with a leader line. | 11.011 s (330 frames) |
| `m03_gnn_lungs_notext_1080p.mp4` | **No text at all** (no title, label or leader line). Otherwise identical. | 11.011 s (330 frames) |

Format:
- 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, preset slow, yuv420p.
- bt709 tags, tv range, +faststart, no audio.
- The content runs 10 s, followed by a **clean static hold from 10.00 s to 11.01 s**. The frame is actually static from about 9.8 s.

## Key moments (clip time)
| t (s) | What happens |
|---|---|
| 0.00–0.50 | Lung silhouettes fade in. The title pops in at 0.15 s (text version only). |
| 0.20–1.40 | The airway tree grows from the trachea, one generation at a time (0.16 s apart). |
| 1.60 / 2.55 / 3.50 / 4.45 / 5.40 | **Five message-passing rounds.** Pulses take 0.5 s along all 127 edges in both directions, then all nodes flash blue (the update step). |
| **6.50–7.25** | **The 20 % subtree lights up orange** from the trachea downward, one depth level every 0.1 s. Everything else dims to about 32 %. |
| 7.30–7.78 | The leader line draws and **"the 20% you need"** pops in ("20%" in orange). Text version only. |
| 7.75–9.80 | Two orange "airflow" waves run down the lit subtree. |
| 10.00–11.01 | Static hold. |

**Sync tip:** the "money" frame is 6.5–7.8 s. Put the orange cascade (6.5 s) on "I got stuck", or wherever the 80/20 line lands in the edit.

## The graph
- 128 nodes, 127 edges and 64 terminal branches (the trachea plus 6 generations).
- The tree is generated (`src/airway.py`) with a 2-D version of the space-filling branching algorithms of Kitaoka (1999) and Tawhai (2000):
  - each branch is given the patch of lung it supplies;
  - the patch is split through its centroid along the parent direction;
  - each child grows 45–68 % of the way toward the centroid of its half, with a branch-angle limit of 62°.
- The tree is seeded and deterministic.
- The view is anterior, so the patient's left lung (narrower, with the cardiac notch) is on the viewer's right.
- **Lit subtree:** 26 of 128 nodes = **20.3 %**. It covers:
  - the trachea and carina;
  - the main bronchus on the viewer's right and its upper lobar branch down to generation 5;
  - the terminal (generation 6) branches of one segmental branch.
- [VERIFY] This is a stylised illustration, not Aleks's thesis geometry or real patient data. Swap in a real airway mesh only if he wants it to be literal.

## QA stills (`qa/`, taken from the final MP4s)
| Still | Time | Shows |
|---|---|---|
| `frame_01.png` | 0.90 s | Tree growing (title version) |
| `frame_02.png` | 1.95 s | Message passing (blue pulses) |
| `frame_03.png` | 6.95 s | Orange cascade halfway; rest dimming |
| `frame_04.png` | 9.10 s | Orange airflow wave, label in place |
| `frame_05.png` | 10.50 s | Final hold, title version |
| `frame_06.png` | 10.50 s | Final hold, no-text version |

Checked:
- **Size:** the title is 40 px and the label 48 px Inter SemiBold, which reads at phone size.
- **Safe area:**
  - Title: x 112–816, y about 90–130.
  - Label: x 1381–1800.
  - Tree and lungs: about x 573–1347, y 144–980.
- No typos.
- The last second is static (verified by frame diff of the decoded MP4).

## How to re-render
```bash
cd ~/Projects/Youtube/edit/ai-learn/assets/m03_gnn_lungs/src
./render.sh                      # both variants (about 2-3 min each on the M4)
./render.sh --variant notext     # one variant ("title" or "notext")
WORKERS=2 ./render.sh            # fewer worker processes (default 3); runs under nice -n 10
.venv/bin/python render.py stills --variant title --times 1.95 7.0 10.5 --out /tmp/m03_stills
```
- `render.sh` creates `src/.venv` with uv on first use: Python 3.12 + `manim==0.21.0`. It needs Homebrew `cairo` and `pkgconf`.
- `src/scene.py` contains the timeline (constants at the top) and rendering.
- `src/airway.py` contains the lung outlines and tree generation. Change `build_tree(frac=…, frac_deep=…)` for a sparser or denser tree.
- `src/engine.py` (shared by m01/m02/m03) drives Manim CE's Cairo camera:
  - It renders at exact 29.97 fps timing with 4-sample 180° motion blur.
  - It adds a bloom pass for the pulse and orange glow, plus the SPEC dotted background.
  - It encodes with ffmpeg.
- Fonts: Inter and JetBrains Mono are bundled in `src/fonts/` (OFL).
