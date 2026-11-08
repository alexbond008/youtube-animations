# p2_medics: point 2 fix, "find a cohort, like medics do"

AI layer style (#0E0E10 dotted grid, #16161A cards, Inter / JetBrains Mono). 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s. Static camera; walking bob and sofa sway continue to the end. No real people (glyph figures only).

## p2_medics_cohort_1080p.mp4 (34.5 s = 33.5 s anim + 1 s hold)
- 0.0–1.3 journey track draws, labels Year 1 … Year 6+
- 1.9–3.5 five teal medic figures pop at Year 1; 4.0 "Medics" chip
- 6.4 schedule card "Lectures · Placements · Exams" (dense Mon–Sat grid fills 6.55–7.4)
- 11.5 vector hospital; 11.7 "Hospital placements" chip
- 14.1 "Training" counter: 6 → 7 (14.65) → 8 (15.25) → "6–8 years" (15.8); "Year 6+" turns orange at 15.3
- 17.1 "Night shifts" chip with moon
- 21.3 top cards dim; 21.5 group starts walking; links draw 21.6–22.6; 22.5 label becomes "Cohort" + halo
- 25.4–27.0 track turns rough/steep (amber); 25.6 "Difficult journey" chip
- 26.8 blue "History" group lounging on a sofa
- 27.4 rear medic drifts off; 28.0 its link snaps (red); 29.1 it greys and stalls beside the sofa (~29.6)
- 31.8 "History" chip pulses; cohort keeps walking to the end

## p2_medics_cohort_short_1080p.mp4 (23.5 s = 22.5 s anim + 1 s hold)
Same render starting at 11.0 s of the full clip (subtract 11.0 from the beats above; hospital at 0.5).

## Re-render
```
cd src   # node_modules (playwright) copied from p3_skipping
nice -n 10 node render.mjs medics.html 33.5 ../p2_medics_cohort_1080p.mp4
T0=11.0 nice -n 10 node render.mjs medics.html 22.5 ../p2_medics_cohort_short_1080p.mp4
node stills.mjs medics.html ../qa 3.8,9.0,16.2,23.5,28.3,33.4
```
Scene code in `src/body.js`; `medics.html` = head.part + common.js + body.js. `render.mjs` takes optional `T0` env (start offset).
