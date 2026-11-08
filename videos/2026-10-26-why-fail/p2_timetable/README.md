# p2_timetable

Two full-screen AI-layer clips for point 2 ("Living like a history student"). 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s. The camera is static (no push-in); per-element motion keeps it alive.

## p2_timetable_week_1080p.mp4: 18.99 s (18.0 s anim + 1 s hold)
- 0.0–0.5: empty Engineering and History / Psychology week grids (Mon–Fri, 09–18, plus an "Eve" band)
- 1.5–2.9: 11 orange "Lecture" blocks fill Engineering (15 h); 5 sparse blue Lecture/Seminar blocks fill the right card (1.6–2.8)
- 2.7: "≈3×" badge pops between the cards
- 4.9: right card border turns blue and "Psychology" gets an amber marker sweep; "History" is swept at 5.9
- 12.4–13.6: "Lectures" hours bars grow: ≈15 h / week vs ≈5 h / week (text lands at about 13.5; the right bar finishes at 13.0). Footnote: "≈ illustrative weeks: typical first-year lecture hours"
- 14.4–15.4: amber coursework blocks drop and stack into the Mon–Thu evenings; the "Coursework" tag appears at 15.55
- 16.2 / 16.45: green "Lab · 3 h" blocks drop in (Tue and Thu, 14–17)

## p2_timetable_friday_1080p.mp4: 10.51 s (9.5 s anim + 1 s hold)
- 0.0: "Fri 21:00" slot card
- 2.2: "Lab report due Mon" slides in from the left; 2.9: "Exam in 2 weeks"
- 4.55: the group-chat card shows typing dots; 4.9: the bubble "Pres at 9, club at 11" with a vector party popper
- 6.6–7.5: the cursor moves in and clicks the bubble at 7.5; green tick badge, green connector, left cards dim to 60%

## Re-render
```
cd src && nice -n 10 node render.mjs week 18.0 ../p2_timetable_week_1080p.mp4
nice -n 10 node render.mjs friday 9.5 ../p2_timetable_friday_1080p.mp4
```
Stills: `node stills.mjs <week|friday> <dir> t1,t2`. QA stills are in `qa/`.
