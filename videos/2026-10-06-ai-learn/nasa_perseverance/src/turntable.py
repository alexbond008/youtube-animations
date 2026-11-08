"""perseverance_turntable: slow hero turntable (+270 deg) with a gentle camera push.

blender -b --factory-startup -P turntable.py -- [--engine CYCLES|EEVEE] [--samples N]
        [--pct 100] [--frames A B] [--stills 1,150,300] [--out DIR]

Motion: 300 frames (10.0 s @ 29.97). The 1 s clean hold is added at encode time by
cloning the last frame (see encode.sh), so it is pixel-identical.
"""
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
import scene as S  # noqa: E402

ENGINE = S.arg("--engine", "CYCLES")
SAMPLES = S.arg("--samples", 96, int)
PCT = S.arg("--pct", 100, int)
OUT = S.arg("--out", os.path.join(S.ASSET, "frames", "turntable"))
N = 300                                   # motion frames

# yaw of the rover: 45 deg = front-right 3/4 (mast side towards camera) ... +270 -> front-left 3/4
YAW0, YAW1 = 38.0, 38.0 + 270.0
# camera: fixed azimuth (looking +Y), gentle push in + slight crane down
D0, D1 = 10.6, 9.4                        # horizontal distance to target
H0, H1 = 3.00, 2.65                       # camera height
T0, T1 = 1.02, 1.00                       # look-at height
LENS = 50.0

sc, root, objs, info, ground, lights, cam = S.build(ENGINE, SAMPLES)
print("ROVER", info)
sc.render.resolution_percentage = PCT
cam.data.lens = LENS


def pose(f):
    u = (f - 1) / (N - 1)
    yaw = YAW0 + (YAW1 - YAW0) * S.ease_plateau(u, 0.2)
    p = S.smoother(u)
    d = D0 + (D1 - D0) * p
    h = H0 + (H1 - H0) * p
    tz = T0 + (T1 - T0) * p
    return yaw, d, h, tz


for f in range(1, N + 1):
    yaw, d, h, tz = pose(f)
    root.rotation_euler = (0, 0, math.radians(yaw))
    root.keyframe_insert("rotation_euler", index=2, frame=f)
    cam.location = (0.0, -d, h)
    S.look_at(cam, (0.0, 0.0, tz))
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

sc.frame_start, sc.frame_end = 1, N
if "--frames" in S.args():
    a = S.args()
    i = a.index("--frames")
    sc.frame_start, sc.frame_end = int(a[i + 1]), int(a[i + 2])

os.makedirs(OUT, exist_ok=True)
stills = S.arg("--stills", None)
if stills:
    for f in [int(x) for x in stills.split(",")]:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, f"still_{f:04d}.png")
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print("STILL", f, sc.render.filepath, "%.1f s" % (time.time() - t0))
else:
    sc.render.filepath = os.path.join(OUT, "f_")
    sc.render.use_overwrite = False        # resumable: existing frames are skipped
    bpy.ops.render.render(animation=True)
