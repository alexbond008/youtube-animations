# p4_threshold

Full-screen AI-layer clip for point 4 (the "just pass" mentality). 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s. A static camera, a breathing "Fail" badge and a pulsing 2:1 glow keep it moving to the end.

## p4_threshold_1080p.mp4: 23.59 s (22.6 s anim + 1 s hold)
- 0.0–1.0: 0–100% axis, dashed "Pass 40%" and "First 70%" lines, headers "Aim: just pass" and "Aim: top grade" (the right column is dimmed). The left bar grows to 40% and "Target 40%" appears
- 2.1–2.7: red underline sweeps under "Aim: just pass" ("weak mentality")
- 7.9–8.35: the "Hard module −20%" weight drops onto the left bar
- 8.35–9.1: the bar is crushed 40 → 20% and turns red; "Fail" badge at 9.1
- 11.2: the right column lights up; the target climbs 40 → 85% (11.4–13.3) and the bar grows to 85%
- 14.6–15.05: the same weight drops on the right bar; it is crushed 85 → 65% by about 15.9 and stays above Pass 40%
- 19.8: green "Pass" badge with a drawn tick
- 20.9: glowing "Still a 2:1" badge
- Footnote: "UK marks: pass 40%, first 70%"

## Re-render
`cd src && nice -n 10 node render.mjs threshold 22.6 ../p4_threshold_1080p.mp4` (stills: `node stills.mjs threshold <dir> t1,t2`). QA stills are in `qa/`.
