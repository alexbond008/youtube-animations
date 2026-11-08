# p4_all_the_way_down
Vertical camera descent through 8 layers (tokens > network/cloud > data centre > GPU > CPU > transistor > logic gate > 0s and 1s), with a left depth gauge (orange dot). HTML/SVG, frame-stepped in Playwright Chromium, ffmpeg H.264 CRF14 yuv420p bt709, 29.97 fps, no audio.
- `p4_all_the_way_down_1080p.mp4` 1920x1080, 26.0 s + 1.0 s held last frame = 26.99 s (809 frames)
- `p4_all_the_way_down_1080x1350.mp4` Shorts-safe 1080x1350 (gauge reduced to rail only; layer name in chip)
- `layers.json` exact layer start times for time-remapping
Key times (s, camera starts moving; 0.6 s ease): 0 Next-token (mat chosen ~2.85), 3.5 Network/Cloud, 7.0 Data centre, 10.5 GPU, 14.0 CPU, 17.0 Transistor (gate ON ~17.9-18.9, 19.5+), 20.0 Logic gates (NAND steps every 0.62 s), 23.0 0s and 1s (orange "1" lands ~25.0-25.5). Hold 26.0-27.0.
QA: `qa/`, `qa_vertical/`.
Re-render: `cd src && npm i && nice -n 10 node render.mjs land 26 ../p4_all_the_way_down_1080p.mp4 ../qa 1.9,5.5` (use `vert` for 1080x1350). `stills.mjs` makes quick stills.
