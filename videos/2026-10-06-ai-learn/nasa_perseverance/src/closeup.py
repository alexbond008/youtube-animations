"""perseverance_closeup: slow detail move from the mast head (SuperCam / Mastcam-Z) down the
front of the rover to the front-right wheel and rocker-bogie, with a smooth rack focus.

blender -b --factory-startup -P closeup.py -- [--engine CYCLES|EEVEE] [--samples N]
        [--pct 100] [--frames A B] [--stills 1,90,180] [--out DIR]

Motion: 180 frames (6.0 s @ 29.97). The 1 s clean hold is added at encode time by cloning
the last frame (see encode.sh).
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
OUT = S.arg("--out", os.path.join(S.ASSET, "frames", "closeup"))
N = 180
LENS = 70.0
FSTOP = 4.0
YAW = 0.0                                  # rover faces -Y; its right side (-X) is towards the key

# rover-local points (metres): mast head front, a waypoint on the front face, front-right wheel
HEAD = Vector((-0.55, -0.97, 2.00))
MID = Vector((-0.95, -1.42, 1.10))
WHEEL = Vector((-1.18, -1.28, 0.25))


def norm(v):
    return Vector(v).normalized()


C_START = HEAD + 2.55 * norm((-0.50, -1.0, -0.12))   # front-right of the head, a touch below
C_END = WHEEL + 2.6 * norm((-0.88, -1.0, 0.36))     # front-right of the wheel, a touch above
C_MID_PUSH = Vector((-0.25, -0.15, 0.0))             # bows the dolly path slightly outwards

sc, root, objs, info, ground, lights, cam = S.build(ENGINE, SAMPLES, light_k=0.82)
sc.render.resolution_percentage = PCT
root.rotation_euler = (0, 0, math.radians(YAW))
cam.data.lens = LENS
cam.data.dof.use_dof = True
cam.data.dof.aperture_fstop = FSTOP
cam.data.dof.aperture_blades = 7
cam.data.dof.aperture_rotation = math.radians(12)


def bez(p0, p1, p2, t):
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2


def pose(f):
    u = S.ease_plateau((f - 1) / (N - 1), 0.32)
    tgt = bez(HEAD, MID, WHEEL, u)
    c = C_START.lerp(C_END, u) + C_MID_PUSH * (4 * u * (1 - u))
    return c, tgt


# focus distance: ray-cast from the camera through the look-at point, then smooth
dg = bpy.context.evaluated_depsgraph_get()


def hit_distance(origin, target):
    d = (target - origin).normalized()
    o = origin.copy()
    travelled = 0.0
    for _ in range(8):
        ok, loc, nrm, idx, ob, mat = sc.ray_cast(dg, o, d)
        if not ok:
            return (target - origin).length
        travelled += (loc - o).length
        if not ob.hide_render and ob.name != "Ground":
            return travelled
        o = loc + d * 1e-3
        travelled += 1e-3
    return (target - origin).length


raw = []
for f in range(1, N + 1):
    c, t = pose(f)
    raw.append(hit_distance(c, t))
K = 9
smooth = []
for i in range(N):
    w_sum = v_sum = 0.0
    for j in range(max(0, i - K), min(N, i + K + 1)):
        w = math.exp(-((j - i) / (K / 2)) ** 2)
        w_sum += w
        v_sum += w * raw[j]
    smooth.append(v_sum / w_sum)

for f in range(1, N + 1):
    c, t = pose(f)
    cam.location = c
    S.look_at(cam, t)
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)
    cam.data.dof.focus_distance = smooth[f - 1]
    cam.data.dof.keyframe_insert("focus_distance", frame=f)
print("FOCUS", [round(smooth[i], 2) for i in range(0, N, 15)] + [round(smooth[-1], 2)])

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
