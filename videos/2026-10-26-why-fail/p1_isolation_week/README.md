# p1_isolation_week

Point 1 ("It gets lonely"): going back to halls early, then a week alone. 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s.

## p1_isolation_week_calendar_1080p.mp4 (6.01 s = 5.0 s anim + 1 s hold, 180 frames)
- 0–0.35 September calendar card. "Term starts" marks Sun 28 (white ring and chip)
- 0.6–1.3 ("two") Orange arrow sweeps back from 28 to 14; the 14 days in between tint orange; "−14 days" at 0.9
- 1.15 "Back to halls" marker on Sun 14 (orange)
- 1.5 ("early") Dimmed halls building with empty windows: "Halls · nobody here yet"
- to 5.0 Arrow dashes keep flowing (static camera)

## p1_isolation_week_loop_1080p.mp4 (22.49 s = 21.5 s anim + 1 s hold, 674 frames)
- 0–1.4 Room card, 4 nodes (Eat/Gym/Sleep/Study) and loop ring; "Conversations: 0" from 0.8 (stays throughout); "Day 1" at 1.8
- 2.85 Eat, 3.4 Gym, 4.25 Sleep, 5.45 Study light up (orange comet moves between them)
- 5.6–7.0 Loop spins 6 fast cycles; counter ticks Day 1 → Day 7 ("of 7")
- 6.6 Mood meter appears full green; 7.0–12.2 it drains green→amber→red, then hits low with a red pulse
- 7.0+ Loop keeps cycling slowly
- 16.7–18.1 Whole palette desaturates and dims
- 19.85 ("for a month") Counter flips to "Day 30?" in red with a soft pulse until the end

## Re-render
`cd src && nice -n 10 node render.mjs calendar 5.0 ../p1_isolation_week_calendar_1080p.mp4` / `node render.mjs loop 21.5 ../p1_isolation_week_loop_1080p.mp4`. Stills: `node stills.mjs <scene> ../qa 1,5,9`.
