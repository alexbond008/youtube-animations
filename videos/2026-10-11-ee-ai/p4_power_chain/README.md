# p4_power_chain
Left-to-right power chain as line-art with energy flow dots (camera pans along it): solar + power station > step-up > HV pylons > step-down substation > data centre with GPU racks and blue water cooling loop. Generic, no logos. 29.97 fps, H.264 CRF14, no audio.
- `p4_power_chain_1080p.mp4` 1920x1080, 12.0 s + 1.0 s hold = 13.01 s (390 frames)
- `p4_power_chain_1080x1350.mp4` Shorts-safe 1080x1350 (scaled 0.85, tighter camera)
Key times (s): 0 sun/solar panels (label Solar 1.4); 1.3 power station (label 2.2); 3.0 camera arrives at step-up (label 3.2), pylons draw 3.3-4.5; 5.0 substation (label step-down 5.3); 7.0 data centre arrives, racks 7.3, cooling loop 7.7, water flows 8.3; 8.7 headline "Energy = the bottleneck" (marker sweep on "bottleneck" 9.1); 10-12 hold with flow continuing; 12.0-13.0 frozen hold.
QA: `qa/`, `qa_vertical/`. Re-render: `cd src && nice -n 10 node render.mjs land 12 ../p4_power_chain_1080p.mp4` (`vert` for 1080x1350).
