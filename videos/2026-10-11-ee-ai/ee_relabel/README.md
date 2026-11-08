# ee_relabel: EE terms get relabelled as AI names

Generic concept animation (Manim CE, house style: #0E0E10 + dotted grid, #16161A cards, accent #D97757).
Spoken over it: "...as an electrical engineering grad is super super related, just maybe has a few different names."

| File | What | Duration |
|---|---|---|
| `ee_relabel_1080p.mp4` | Main. Four white EE cards stack, then each is underlined and morphs into its AI name (orange) | 7.97 s (239 f) incl. 1 s hold |
| `ee_relabel_sidebyside_1080p.mp4` | EE column (white) -> orange arrows -> AI column (orange), both visible; for the recap | 8.01 s (240 f) |
| `ee_relabel_vertical_1080x1350.mp4` | 1080x1350 variant of main (Shorts) | 7.97 s |
| `ee_relabel_sidebyside_vertical_1080x1350.mp4` | 1080x1350 variant of side-by-side (2-line cards, text 48 px) | 8.01 s |

Format: 29.97 fps, H.264 CRF 14 yuv420p, bt709, no audio. The last 1 s is static (frame diff PSNR > 70 dB, encoder noise only).

## Key moments, main (s)
- 0.0-2.0: "EE" tag, then Linear algebra / Fourier transform / Control theory / Power systems cards rise in (stagger ~0.3 s).
- 2.00 / 2.65 / 3.30 / 3.95: underline sweep (0.32 s) then crossfade+slide to Neural networks / Voice AI / Reinforcement learning / Data centres.
- 4.95-5.5: last card lands; header flips "EE" -> "AI" (5.0-5.5).
- 5.0-7.0: slow settle push-in (1.0 -> 1.025). 7.0-8.0: static hold.

## Key moments, side-by-side (s)
0-1.8 EE column in; 1.8-5.3 arrow + AI card, one every ~0.9 s (AI header at 1.8); 5.3-7.0 settle; 7.0-8.0 hold.

## Fonts
Inter / JetBrains Mono are not installed on this machine, so the nearest system faces are used (Helvetica Neue Bold, Menlo). To get the exact faces, change `UI` and `MONO` in `src/common.py`. Maths text uses STIX Two Text.

## QA
`qa/` has stills of every variant (checked: no clipping or typos; vertical text >= 48 px). Vertical side-by-side cards sit ~3% from the left/right edges.

## Re-render
`cd src && ./render.sh` (uses `.venv` with manim CE; ~2 min). Env `VARIANT=v` selects the vertical layout.
