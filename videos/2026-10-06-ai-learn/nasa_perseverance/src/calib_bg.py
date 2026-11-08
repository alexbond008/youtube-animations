"""Find the scene-linear world colour that comes out of AgX (same view settings as the
renders) as exactly #0E0E10, and save it to bg_calib.json (read by scene.setup_world).

blender -b --factory-startup -P calib_bg.py
"""
import json
import math
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import scene as S  # noqa: E402

S.reset()
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 1
sc.cycles.use_denoising = False
sc.render.resolution_x = sc.render.resolution_y = 8
sc.render.resolution_percentage = 100
sc.render.dither_intensity = 0.0
S.set_view(sc)
looks = [i.identifier for i in bpy.types.ColorManagedViewSettings.bl_rna.properties["look"].enum_items_static]
print("LOOK", sc.view_settings.view_transform, "|", sc.view_settings.look)
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.render.image_settings.color_depth = "16"
cam = S.make_camera()
cam.location = (0, 0, 0)

target = [int(S.BG_HEX[i:i + 2], 16) / 255 for i in (1, 3, 5)]
tmp = os.path.join(tempfile.gettempdir(), "calib_bg.png")


def measure(rgb):
    w = S.setup_world(env_strength=0.0, cam_rgb=rgb)
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(tmp, check_existing=False)
    img.colorspace_settings.name = "Non-Color"
    px = list(img.pixels[:3])
    bpy.data.images.remove(img)
    bpy.data.worlds.remove(w)
    return px


x = S.lin(S.BG_HEX)[:3]
prev = None
for it in range(12):
    y = measure(x)
    err = max(abs(a - b) for a, b in zip(y, target))
    print(f"iter {it}: x={['%.6f' % v for v in x]} -> y*255={['%.3f' % (v * 255) for v in y]} err*255={err * 255:.3f}")
    if err * 255 < 0.05:
        break
    nx = []
    for c in range(3):
        if prev is None or abs(math.log(y[c]) - math.log(prev[1][c])) < 1e-9:
            slope = 0.5
        else:
            slope = (math.log(y[c]) - math.log(prev[1][c])) / (math.log(x[c]) - math.log(prev[0][c]))
            slope = max(0.05, min(3.0, slope))
        nx.append(math.exp(math.log(x[c]) + (math.log(target[c]) - math.log(y[c])) / slope))
    prev = (x, y)
    x = nx

json.dump({"target_hex": S.BG_HEX, "view": S.VIEW_TRANSFORM, "look": sc.view_settings.look,
           "camera_rgb_linear": x, "measured_255": [v * 255 for v in y]},
          open(S.CALIB, "w"), indent=2)
print("SAVED", S.CALIB, x)
