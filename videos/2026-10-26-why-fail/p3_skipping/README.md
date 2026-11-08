# p3_skipping: point 3 "Skipping lectures" (3 concept animations)

AI layer style (#0E0E10 dotted grid, #16161A cards, Inter / JetBrains Mono). 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Each clip's last frame is held for 1 s (30 frames). Static camera (no drift/push-in); per-element motion continues until the hold.

## p3_flight_trade_1080p.mp4 (16.02 s = 15.0 s anim + 1 s hold)
- 0.0 FLY boarding pass (LDN → HOME) slides in; 0.2 lecture calendar (Wk 11–12, Mon–Fri, 9am/2pm = 20 lectures)
- 0.8–1.8 lectures grey out one by one; 1.9 red "−20 lectures" chip
- 4.0 "2 weeks earlier £49" row highlights green (vs "Fri, end of term £64"); 5.0 "Save £15" chip
- 10.25 cards exit; 10.5 "UK home fees £9,535 / year (2025/26)"
- 12.6 "≈ £40 per hour of teaching" + basis text "≈ £9,535 ÷ ~240 contact hours; international fees are higher"
- 13.1 "Save £15 (on the flight)"; 13.4 "vs"; 13.6 "≈ £800 of teaching missed" (20 lectures × ≈ £40)

## p3_home_distractions_1080p.mp4 (15.02 s = 14.0 s anim + 1 s hold)
- 0.15 Lecture 7 / recording available notification, "0% watched"
- 2.0 red strike + "Watch later" chip
- 3.4 Grandma "more cake?" (vector cake); 5.2 Mum "spaghetti's ready" (vector bowl)
- 7.8 incoming call "The boys · calling…"; 11.6 "yo when are you coming outside??"; the lecture card is pushed down and fades out by ~11.9
- Phone buzz on each arrival (phone otherwise still)

## p3_momentum_1080p.mp4 (27.49 s = 26.5 s anim + 1 s hold)
- 0.0 axes; 0.4–2.2 dashed "Course" line
- 2.4–4.4 green "Came back early"; 5.0–8.4 orange "Skipped 2 weeks" (flat wk 1–3); 6.0 "2 weeks away" bracket
- 12.9 red "Behind" area
- 16.5–17.8 orange slope bends lower (faint dashed ghost of old path); 17.0 "Losing momentum"
- 20.3 "Exams" marker at week 12; 21.3 dashed "Pass" line
- 24.1 red "Fail" chip at orange end; 24.6 green "Pass" chip at green end

## Re-render
```
cd src && npm install   # playwright (uses cached chromium headless shell)
nice -n 10 node render.mjs clip1_flight_trade.html 15.0 ../p3_flight_trade_1080p.mp4 ../qa 0.5,1.3,4.5,5.6,11.0,14.9
nice -n 10 node render.mjs clip2_home_distractions.html 14.0 ../p3_home_distractions_1080p.mp4 ../qa 0.6,2.6,5.8,8.6,12.4,13.9
nice -n 10 node render.mjs clip3_momentum.html 26.5 ../p3_momentum_1080p.mp4 ../qa 3.5,8.0,13.6,18.0,21.0,26.4
```
Shared helpers in `src/common.js`; page template in `src/head.part`. QA stills in `qa/`.
