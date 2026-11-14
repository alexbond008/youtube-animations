# navier_stokes — real lattice-Boltzmann flow past a cylinder (von Kármán vortex street) with the Navier–Stokes equation

Full-screen b-roll for "Has OpenAI Solved Maths?". The flow is a genuine 2-D simulation
(D2Q9 lattice-Boltzmann, Re ≈ 160), not curl noise: ~52k tracer particles are advected through
the simulated velocity field and coloured blue → white by local vorticity, so the shed vortices glow.

## Files
| File | Size | Use |
|---|---|---|
| `navier_stokes_1080p.mp4` | 1920x1080, 13.0 s (12 s + 1 s held frame) | P1 "The famous Navier–Stokes equation…" |
| `navier_stokes_notext_1080p.mp4` | 1920x1080, 13.0 s | P4 "…how fluids operate" (same flow, no text) |
| `navier_stokes_notext_vertical_1080x1350.mp4` | 1080x1350, 13.0 s | Shorts (same flow, cropped around cylinder + wake, rendered natively) |
| `qa/` | PNG stills at 0.5 / 2 / 5.5 / 9 / 11.5 s for each clip |

All: 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio. Static camera; motion is the flow only.

## Key timestamps (text version)
| Time | Event |
|---|---|
| 0.0 s | Flow already running, vortex street fully developed |
| 1.0 s | Equation card pops in top-left (KaTeX): ∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u + f |
| 5.0 s | **f** turns orange with a box, label "external force" below |
| 8.0 s | Claim card bottom-right: "**Claimed** Sept 8, 2026 · forced case · not peer-reviewed" |
| 12.0 s | Last moving frame; held to 13.0 s |

Entrances are 10 frames, ease-out, scale 0.92 → 1. The wording says "Claimed", never "solved":
the claim (blow-up with a smooth external force, Clay alternatives C/D) is not accepted by Clay.

## Re-render
```bash
cd src
npm install
python sim.py ../cache/flow_cache.npz            # ~12 min on M4; needs numpy
CHROME="/path/to/chrome" node overlays.mjs ../cache/layers   # CHROME optional (playwright browser otherwise)
nice -n 10 python render.py ../cache/flow_cache.npz ../cache/layers ..   # needs numpy, scipy, pillow; FFMPEG env optional
```
`cache/` (≈330 MB velocity field) can be deleted after rendering.
