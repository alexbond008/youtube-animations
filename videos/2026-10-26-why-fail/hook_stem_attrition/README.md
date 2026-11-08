# hook_stem_attrition

Opening hook: 100 student figures in a 10x10 grid, then 48 of them leave STEM (20 drop out, 28 switch majors). Source: NCES 2014-001, US bachelor's students who entered STEM 2003–09. 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s.

## hook_stem_attrition_1080p.mp4 (10.51 s = 9.5 s anim + 1 s hold, 315 frames)
- 0.0–0.35 Title "100 students start a STEM degree"
- 0.12–1.2 Grid builds on a diagonal stagger; source line fades in at 0.9
- 1.3–5.0 Gentle opacity ripple (static camera)
- 5.1 ("drop out") 20 figures turn red. From 5.55 they slide down and fade to dashed ghosts. Chip "20 leave uni without a degree" at 5.25
- 6.7 ("change") 28 figures turn blue. From 7.1 they drift left and fade. Chip "28 switch to a non-STEM major" at 6.85
- 7.6 "48%" counts up 0→48 (#D97757) with "left STEM" below. The 52 who stay brighten slightly
- 7.6–9.5 Hold (static framing, no camera move)

## hook_stem_attrition_maths_1080p.mp4 (5.21 s = 4.2 s anim + 1 s hold, 156 frames)
Optional. Starts on the main clip's end frame.
- 0–1.0 Panel and title fade out; the grid slides to centre and dims
- 0.55–1.75 Maths symbols float in (∫, Σ, dy/dx, matrices)
- 2.5 "It's not just the maths." pops in; amber marker sweeps "just the maths" 2.85–3.3

## Re-render
`cd src && nice -n 10 node render.mjs main 9.5 ../hook_stem_attrition_1080p.mp4` (or `maths 4.2 ../hook_stem_attrition_maths_1080p.mp4`). Stills: `node stills.mjs <scene> ../qa 1,5,9`. Uses playwright plus the cached chromium headless shell.
