# NASA Perseverance: Blender renders

Two Cycles renders of **NASA's official Mars 2020 Perseverance 3D model**
(`assets/nasa/Mars 2020 Perseverance Rover.glb`, from science.nasa.gov/3d-resources, used with
permission). **Credit: NASA/JPL-Caltech.** The credit "3D model: NASA/JPL-Caltech" is baked into
both clips: Inter Medium 18 px, 60% white, bottom-left at x = 96 px, about 58 px above the bottom
edge (inside the 5% safe area). A tight, soft dark halo keeps it legible where it crosses the white
rover in the close-up; on the dark background the halo is invisible.

Both are 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, yuv420p, BT.709 (tv range), no
audio. Each **ends with a 1 s clean hold** (the last rendered frame cloned 30×, pixel-identical).

| File | Duration | What |
|---|---|---|
| `perseverance_turntable_1080p.mp4` | 11.01 s (330 fr = 10.0 s motion + 1 s hold) | Hero turntable, +270° with a gentle camera push |
| `perseverance_closeup_1080p.mp4` | 7.01 s (210 fr = 6.0 s motion + 1 s hold) | Detail crane from the mast head down to the front wheel |

QA stills: `qa/turntable/frame_01..06.png`, `qa/closeup/frame_01..06.png`.

## Look
- **Background:** exactly #0E0E10. The world colour seen by the camera is calibrated through AgX (`src/bg_calib.json`); the decoded MP4 measures (14, 13–14, 16).
- **Ground:** a subtle dusty Mars-red disc that fades into the background. It is lit only by its own soft overhead spot (light linking), so the pool stays dim and centred under the rover, with soft contact shadows.
- **Lights:** warm soft key (camera-left, high), cool fill, Mars-orange rim back-left, cool rim back-right, soft top light.
- **Render:** Cycles on Metal GPU, 128 spp adaptive, OpenImageDenoise on the GPU, AgX "Medium High Contrast", 0.5-shutter motion blur. Tested against EEVEE: EEVEE was ~1 s/frame but had dithered-transparency noise on the ground fade and weaker contact shadows, so Cycles won (~8–15 s/frame on the M4, depending on load).
- **Pose:** the GLB stores each part's animation as a muted NLA strip. `scene.py` bakes action-frame 90, which gives the iconic pose: mast deployed, remote-sensing head panned forward (SuperCam "eye" and Mastcam-Z facing front), robotic arm stowed. A stray helper sphere and the invisible pivot meshes are hidden.

## Key moments

### perseverance_turntable_1080p.mp4
- **0.00** The money frame: front-right 3/4 hero view, mast head facing camera, already on screen at frame 1.
- **0.0–2.0** Rotation eases in, constant ≈34°/s from 2.0 to 8.0, eases out from 8.0 to 10.0. The camera pushes in 11% over the full 10 s.
- **≈2.5** right-side profile · **≈5.2** rear (MMRTG power source) · **≈7.9** left-side profile.
- **10.0** Ends on a front-left 3/4 view. **10.0–11.0** clean hold.

### perseverance_closeup_1080p.mp4
- **0.0–1.9** Mast head: SuperCam aperture, Mastcam-Z and NavCams, slow ease-in.
- **1.9–4.1** Cranes down the mast and across the front of the body (NASA logo, stowed robotic-arm turret), with focus racking along the way (ray-cast autofocus, smoothed).
- **4.1–6.0** Arrives on the front-right wheel and rocker-bogie and eases out, sharp on the wheel.
- **6.0–7.0** Clean hold on the wheel.
- Known nit: around 2.5–3.5 s the defocused white deck on the left of frame runs bright. It's white paint under the key light; the subject in the centre (NASA logo, arm turret) is correctly exposed.

## Re-render
```bash
cd assets/nasa_perseverance/src
FRESH=1 ./render_all.sh           # both renders back to back, then encode (~1–1.5 h on the M4)
# or step by step:
./blender.sh turntable.py -- --samples 128   # -> ../frames/turntable/f_0001..0300.png
./blender.sh closeup.py   -- --samples 128   # -> ../frames/closeup/f_0001..0180.png
./encode.sh                                  # credit overlay + 1 s hold -> ../perseverance_*_1080p.mp4
./qa.sh turntable 0 2.5 5 7.5 9.9 10.9       # QA stills
```
- `blender.sh` runs Blender with `nice -n 10` and **waits while any other Blender is running** (never two renders at once). Renders skip frames that already exist, so they are resumable. Delete `frames/<shot>/` to re-render from scratch.
- If Metal hangs, use the CPU fallback: `RENDER_DEVICE=CPU ./blender.sh turntable.py -- --samples 128`.
- Quick look test: `./blender.sh turntable.py -- --pct 50 --samples 32 --stills 1,150,300 --out /tmp/tt`.
- `calib_bg.py` re-derives `bg_calib.json` if the view transform or look changes.
- `make_credit.mjs` re-renders `credit_overlay.png`, using the Playwright resolver in `../../web_captures/src`.
- `frames/` keeps the rendered PNG sequences (~0.9 GB) so you can re-encode, for example to ProRes, without re-rendering. Delete it if you need the space.

## Files
```
src/scene.py          shared scene: import + pose bake, ground, lights, world, render settings
src/turntable.py      turntable animation (300 frames)
src/closeup.py        close-up camera path + autofocus (180 frames)
src/calib_bg.py       background colour calibration -> src/bg_calib.json
src/make_credit.mjs   credit overlay -> src/credit_overlay.png
src/encode.sh         PNG sequence -> MP4 (credit, 1 s hold, BT.709)
src/blender.sh        Blender wrapper (nice, single-render lock)
src/render_all.sh     everything in order
src/qa.sh             QA still extraction
```
