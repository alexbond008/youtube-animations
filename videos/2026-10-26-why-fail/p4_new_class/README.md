# p4_new_class: stick-figure "just pass" student

`p4_new_class_1080p.mp4`: 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. 29.50 s (854 animated frames plus a 30-frame hold).
The camera is static (no push-in, zoom or drift). Motion comes from walking, typing, idle bob, blinking, steam and line boil.

## Key beats (s)
- 0.0–1.8: student (backwards cap, backpack, coffee) walks to the door labelled "Lecture Theatre B". The door opens at 1.0.
- 2.2 / 3.0 / 4.1: "Oh, we're studying thermofluids" types on. The "Thermofluids · Lecture 1" sign lights up at 4.1.
- 7.7 / 8.9: "I heard it's hard…" (he looks worried).
- 10.0: "Damn." and his shoulders slump.
- 10.8: he walks into the door. Static crossfade to the theatre at 11.3. He drops into a seat at 11.55–11.85.
- 12.2 / 12.75 / 13.3: three PDEs appear on the screen. 13.3–14.7: they grow out of the screen and shake, symbols float off, his eyes go wide and a sweat drop appears (13.6).
- 14.9: the equations snap back. He leans back with arms crossed. "Nah, this is peak still. Rah." types on (Rah. at 17.4).
- 18.2 / 19.5: "I just need to pass this module". The 40% target pins in at 18.9.
- 20.2–21.1: 4 clones pop into the row.
- 26.3: all 5 show "just pass". 27.1: the 40% target glows orange.

## Re-render
`cd src && nice -n 10 node render.mjs new_class.html 28.5 ../p4_new_class_1080p.mp4`
Stills: `node stills.mjs new_class.html ../qa 1.0,5.0,9.5,14.0,17.8,19.8,21.5,27.5`
