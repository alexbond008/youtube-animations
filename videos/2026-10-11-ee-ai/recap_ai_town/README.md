# recap_ai_town
Isometric "AI landscape" town recap for "Why Electrical Engineers Are Great AI Engineers". Canvas 2D, frame-stepped in headless Chromium, encoded with ffmpeg. No audio.

Files: `recap_ai_town_1080p.mp4` (1920x1080) and `recap_ai_town_1080x1350.mp4` (vertical). Both 29.97 fps, H.264 CRF 14 yuv420p. 17.0 s animation plus 1 s held last frame = 17.98 s (539 frames). QA stills: `qa/`, `qa_vertical/`.

## Key timestamps (s from clip start)
- 0.0-2.3 descent: zoom in from high above, town fades in, buildings rise
- 2.3-5.0 overview, slow drift; 7 label chips pop 2.5-4.8 (all visible by 5.0)
- 5.5-7.0 glide + zoom to AI Research (lit, label enlarged, "research" 7.0), hold to 8.0
- 8.0-9.4 pull back to the Maths hall; lights up 8.9-9.5 (peak at "maths" 9.2), floating formula glyphs
- 9.9-12.0 glide to the GPU factory; zoomed in by 12.0 ("hardware"); belt of GPU chips and chimney smoke running
- 13.5 "GPUs" card (ticking counter, chip icons stack)
- 14.6 "RAM" card with red pulsing "SHORTAGE" badge, draining supply bar
- 15.3-17.0 pull out to the whole town, all lights on, power lines to factory and data centres glow (energised 15.0-16.2)
- 17.0-18.0 hold

## Re-render
```
cd src   # playwright in node_modules; falls back to ~/Library/Caches/ms-playwright chrome-headless-shell
nice -n 10 node render.mjs land 17.0 ../recap_ai_town_1080p.mp4 ../qa 1,4.9,6.9,9.4,12,13.6,14.7,16.9
nice -n 10 node render.mjs vert 17.0 ../recap_ai_town_1080x1350.mp4 ../qa_vertical 4.9,6.9,12,14.7,16.9
node stills.mjs land ../qa 3,8    # quick stills only
```
Scene is `src/index.html` (`window.renderAt(t)`); camera keyframes are the `KF` table. Fonts: Inter from `src/fonts`. Pipeline copied from p4_water_cooling (original untouched).
