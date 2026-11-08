"""Shared Blender scene for the NASA Perseverance renders (turntable + close-up).

Model: assets/nasa/Mars 2020 Perseverance Rover.glb (NASA/JPL-Caltech, public 3D resource).
Scene: dark studio (#0E0E10 to camera), dusty Mars-red ground disc that fades into the
background, soft warm key, cool fill, warm + cool rim lights. Units are metres, Z up.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ASSET = os.path.abspath(os.path.join(HERE, ".."))
PROJECT = os.path.abspath(os.path.join(ASSET, "..", ".."))
GLB = os.path.join(PROJECT, "assets", "nasa", "Mars 2020 Perseverance Rover.glb")
CALIB = os.path.join(HERE, "bg_calib.json")

FPS_NUM, FPS_DEN = 30000, 1001          # 29.97 fps
BG_HEX = "#0E0E10"
POSE_FRAME = 90                         # action frame: mast up, head forward, arm still stowed


# ---------------------------------------------------------------- helpers
def args():
    a = sys.argv
    return a[a.index("--") + 1:] if "--" in a else []


def arg(name, default=None, cast=str):
    a = args()
    if name in a:
        return cast(a[a.index(name) + 1])
    return default


def lin(h):
    """#RRGGBB (sRGB) -> linear RGBA."""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c] + [1.0]


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def smoother(t):
    """C2-continuous ease in/out (smootherstep)."""
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def ease_plateau(t, ramp=0.22):
    """Ease-in, near-constant middle, ease-out. Integral of a trapezoid-ish velocity
    with smooth (cosine) ramps. Returns 0..1. `ramp` = fraction of time spent ramping at each end."""
    t = max(0.0, min(1.0, t))
    r = ramp
    # velocity v(t): 0->1 over [0,r] with (1-cos)/2, 1 in middle, 1->0 over [1-r,1]
    # position = integral normalised
    def integ(x):
        if x <= r:
            return (x - r / math.pi * math.sin(math.pi * x / r)) / 2
        if x <= 1 - r:
            return r / 2 + (x - r)
        y = x - (1 - r)
        return r / 2 + (1 - 2 * r) + (y + r / math.pi * math.sin(math.pi * y / r)) / 2
    return integ(t) / integ(1.0)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


# ---------------------------------------------------------------- render settings
VIEW_TRANSFORM = "AgX"
VIEW_LOOK = os.environ.get("VIEW_LOOK", "AgX - Medium High Contrast")


def set_view(sc):
    """Colour management shared by the renders and the background calibration."""
    sc.display_settings.display_device = "sRGB"
    vs = sc.view_settings
    vs.view_transform = VIEW_TRANSFORM
    try:
        vs.look = VIEW_LOOK
    except TypeError:
        vs.look = "None"
    vs.exposure = 0.0
    vs.gamma = 1.0
    vs.use_curve_mapping = False


def setup_render(engine="CYCLES", samples=96, res=(1920, 1080), device=None):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.fps, sc.render.fps_base = FPS_NUM, FPS_DEN
    sc.render.film_transparent = False
    sc.render.use_persistent_data = True
    sc.render.dither_intensity = 1.0
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    device = device or os.environ.get("RENDER_DEVICE", "GPU")
    if engine == "CYCLES":
        sc.render.engine = "CYCLES"
        cy = sc.cycles
        if device == "GPU":
            prefs = bpy.context.preferences.addons["cycles"].preferences
            prefs.compute_device_type = "METAL"
            prefs.get_devices()
            # GPU only: CPU+GPU hybrid is slower on Apple Silicon
            for d in prefs.devices:
                d.use = (d.type == "METAL")
            cy.device = "GPU"
            if hasattr(cy, "denoising_use_gpu"):
                cy.denoising_use_gpu = True        # OIDN on Metal: ~1 s vs ~14 s on a busy CPU
        else:
            cy.device = "CPU"
        cy.samples = samples
        cy.use_adaptive_sampling = True
        cy.adaptive_threshold = 0.015
        cy.use_denoising = True
        cy.denoiser = "OPENIMAGEDENOISE"
        if hasattr(cy, "denoising_input_passes"):
            cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
        if hasattr(cy, "denoising_prefilter"):
            cy.denoising_prefilter = "ACCURATE"
        if hasattr(cy, "denoising_quality"):
            cy.denoising_quality = "HIGH"
        cy.max_bounces = 8
        cy.diffuse_bounces = 3
        cy.glossy_bounces = 4
        cy.transmission_bounces = 6
        cy.transparent_max_bounces = 12
        cy.caustics_reflective = False
        cy.caustics_refractive = False
        cy.blur_glossy = 1.0
        cy.seed = 7
        cy.use_animated_seed = False
    else:
        sc.render.engine = "BLENDER_EEVEE"
        ee = sc.eevee
        ee.taa_render_samples = samples
        if hasattr(ee, "use_raytracing"):
            ee.use_raytracing = True
        if hasattr(ee, "use_shadows"):
            ee.use_shadows = True
    set_view(sc)
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.image_settings.compression = 15
    return sc


# ---------------------------------------------------------------- rover import + pose
def _fcurves(act):
    out = []
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            for cb in strip.channelbags:
                out += list(cb.fcurves)
    if not out and hasattr(act, "fcurves"):
        try:
            out = list(act.fcurves)
        except Exception:
            pass
    return out


def bake_pose(t=POSE_FRAME):
    """The GLB stores each part's animation as a separate (muted) NLA strip. Evaluate every
    action at action-frame `t` (mast deployed, head panned forward, arm still stowed), write
    the values into the objects/pose bones and drop all animation so the pose is static."""
    for o in list(bpy.data.objects):
        ad = o.animation_data
        if not ad:
            continue
        acts = ([ad.action] if ad.action else []) + [s.action for tr in ad.nla_tracks for s in tr.strips if s.action]
        vals = {}
        for a in acts:
            for fc in _fcurves(a):
                vals[(fc.data_path, fc.array_index)] = fc.evaluate(t)
        o.animation_data_clear()
        for (path, idx), v in vals.items():
            if "." in path and path.startswith("pose."):
                owner_path, prop = path.rsplit(".", 1)
                owner = o.path_resolve(owner_path)
            else:
                owner, prop = o, path
            getattr(owner, prop)[idx] = v
    bpy.context.view_layer.update()


def world_bbox(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != "MESH" or o.hide_render:
            continue
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            w = oe.matrix_world @ Vector(c)
            mn = Vector(map(min, mn, w))
            mx = Vector(map(max, mx, w))
    return mn, mx


def import_rover():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=GLB)
    new = [o for o in bpy.data.objects if o not in before]
    bake_pose(POSE_FRAME)
    for o in new:
        # stray helper sphere at the origin + invisible pivot helpers
        if o.name.startswith("Icosphere"):
            o.hide_render = True
            o.hide_viewport = True
        elif o.type == "MESH" and o.data.materials and all(m and m.name == "transparent" for m in o.data.materials):
            o.hide_render = True
    mn, mx = world_bbox(new)
    centre = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, 0.0))
    root = bpy.data.objects.new("RoverRoot", None)
    bpy.context.scene.collection.objects.link(root)
    root.location = centre
    bpy.context.view_layer.update()
    inv = root.matrix_world.inverted()
    for o in new:
        if o.parent is None:
            o.parent = root
            o.matrix_parent_inverse = inv
    root.location = (0, 0, -mn.z)            # wheels on z = 0, footprint centred on origin
    bpy.context.view_layer.update()
    mn2, mx2 = world_bbox(new)
    info = {"bbox_min": tuple(mn2), "bbox_max": tuple(mx2), "size": tuple(mx2 - mn2)}
    # Tidy glTF materials for Cycles: transparent textures use alpha blending -> hashed is fine
    for m in bpy.data.materials:
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "DITHERED"
    return root, new, info


def part_center(name):
    o = bpy.data.objects[name]
    dg = bpy.context.evaluated_depsgraph_get()
    oe = o.evaluated_get(dg)
    pts = [oe.matrix_world @ Vector(c) for c in oe.bound_box]
    return sum(pts, Vector()) / 8


# ---------------------------------------------------------------- world, ground, lights
def load_bg_calib():
    if os.path.exists(CALIB):
        return json.load(open(CALIB))["camera_rgb_linear"]
    return lin(BG_HEX)[:3]


def setup_world(env_strength=0.035, cam_rgb=None):
    """Camera rays see a flat colour calibrated so it comes out as #0E0E10 through AgX;
    lighting rays see a dim neutral studio environment (slightly brighter from above)."""
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Studio")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    mix = nt.nodes.new("ShaderNodeMixShader")
    lp = nt.nodes.new("ShaderNodeLightPath")
    bg_cam = nt.nodes.new("ShaderNodeBackground")
    bg_env = nt.nodes.new("ShaderNodeBackground")
    cam_rgb = cam_rgb or load_bg_calib()
    bg_cam.inputs["Color"].default_value = list(cam_rgb) + [1.0]
    bg_cam.inputs["Strength"].default_value = 1.0
    # env: vertical gradient, dark below, a touch brighter above
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = (0.25, 0.22, 0.21, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -1.0
    mr.inputs["From Max"].default_value = 1.0
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg_env.inputs["Color"])
    bg_env.inputs["Strength"].default_value = env_strength
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(bg_env.outputs[0], mix.inputs[1])
    nt.links.new(bg_cam.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return w


def ground_disc(radius=5.0, fade=(1.7, 3.6), color_a="#2B140C", color_b="#1C0C07", parent=None):
    """Dusty Mars-red ground that fades (alpha) into the studio background towards the edge."""
    bpy.ops.mesh.primitive_circle_add(vertices=192, radius=radius, fill_type="TRIFAN", location=(0, 0, 0))
    g = bpy.context.active_object
    g.name = "Ground"
    for p in g.data.polygons:
        p.use_smooth = True
    m = bpy.data.materials.new("MarsGround")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    # radial fade on object coords
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    length = nt.nodes.new("ShaderNodeVectorMath")
    length.operation = "LENGTH"
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Y"], comb.inputs["Y"])
    nt.links.new(comb.outputs[0], length.inputs[0])
    fr = nt.nodes.new("ShaderNodeMapRange")
    fr.interpolation_type = "SMOOTHERSTEP"
    fr.inputs["From Min"].default_value = fade[0]
    fr.inputs["From Max"].default_value = fade[1]
    fr.inputs["To Min"].default_value = 1.0
    fr.inputs["To Max"].default_value = 0.0
    nt.links.new(length.outputs["Value"], fr.inputs["Value"])
    nt.links.new(fr.outputs["Result"], mix.inputs["Fac"])
    nt.links.new(transp.outputs[0], mix.inputs[1])
    nt.links.new(bsdf.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    # albedo variation (regolith) + fine bump
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.55
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB")
    cr.color_ramp.elements[0].position = 0.35
    cr.color_ramp.elements[0].color = lin(color_b)
    cr.color_ramp.elements[1].position = 0.7
    cr.color_ramp.elements[1].color = lin(color_a)
    nt.links.new(noise.outputs["Fac"], cr.inputs["Fac"])
    nt.links.new(cr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.93
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25
    fine = nt.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 60.0
    fine.inputs["Detail"].default_value = 4.0
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(fine.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    g.data.materials.append(m)
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "DITHERED"
    if parent is not None:
        g.parent = parent
    return g


def area_light(name, loc, target, size, energy, color="#FFFFFF", size_y=None, spread=None, shape=None):
    l = bpy.data.lights.new(name, "AREA")
    l.energy = energy
    if shape or size_y:
        l.shape = shape or "RECTANGLE"
    l.size = size
    if size_y:
        l.size_y = size_y
    if spread:
        l.spread = math.radians(spread)
    l.color = lin(color)[:3]
    ob = bpy.data.objects.new(name, l)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    if hasattr(ob, "visible_camera"):
        ob.visible_camera = False
    return ob


def studio_lights(k=1.0):
    t = (0, 0, 0.9)
    lights = {
        # warm soft key, camera-left and high
        "Key": area_light("Key", (-4.0, -4.6, 7.4), (0, 0, 0.6), 3.0, 560 * k, "#FFF1E2", spread=48),
        # cool, low fill from camera-right
        "Fill": area_light("Fill", (6.5, -4.5, 2.6), (0, 0, 1.3), 4.0, 140 * k, "#DCE6FF", spread=42),
        # warm Mars-orange rim, back-left
        "RimWarm": area_light("RimWarm", (-5.4, 5.4, 2.6), (0, 0, 1.0), 2.2, 850 * k, "#FF9466", spread=55),
        # cool rim, back-right
        "RimCool": area_light("RimCool", (5.6, 5.0, 3.0), (0, 0, 1.1), 2.2, 700 * k, "#CFE0FF", spread=55),
        # soft overhead to open the deck
        "Top": area_light("Top", (0.0, 0.5, 7.5), (0, 0, 0), 4.0, 110 * k, "#FFFFFF", spread=80),
    }
    return lights


def exclude_from_lights(obj, light_objs, name="GroundExcluded"):
    """Light linking: these lights skip `obj` (rims/fill shape the rover only, so the ground
    pool is lit by the key + top light alone and stays centred under the rover)."""
    coll = bpy.data.collections.new(name)
    coll.objects.link(obj)
    coll.collection_objects[0].light_linking.link_state = "EXCLUDE"
    for lo in light_objs:
        lo.light_linking.receiver_collection = coll
    return coll


def ground_pool_light(ground, energy=22000.0, height=9.0, cone_deg=50.0, blend=1.0, radius=1.6, color="#FFE6D2"):
    """Soft overhead spot that lights ONLY the ground (light linking): a dim pool centred under
    the rover with a soft contact shadow, independent of how hard the rover itself is lit."""
    l = bpy.data.lights.new("GroundPool", "SPOT")
    l.energy = energy
    l.spot_size = math.radians(cone_deg)
    l.spot_blend = blend
    l.shadow_soft_size = radius
    l.color = lin(color)[:3]
    ob = bpy.data.objects.new("GroundPool", l)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = (0.0, 0.0, height)          # spot lights point down their local -Z
    if hasattr(ob, "visible_camera"):
        ob.visible_camera = False
    coll = bpy.data.collections.new("GroundOnly")
    coll.objects.link(ground)
    ob.light_linking.receiver_collection = coll
    return ob


def make_camera(lens=50.0, sensor=36.0):
    cam = bpy.data.cameras.new("Cam")
    cam.lens = lens
    cam.sensor_width = sensor
    cam.sensor_fit = "HORIZONTAL"
    cam.clip_start = 0.05
    cam.clip_end = 200
    ob = bpy.data.objects.new("Cam", cam)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.scene.camera = ob
    return ob


def build(engine="CYCLES", samples=96, device=None, light_k=1.0, env=0.02):
    reset()
    # import + bake BEFORE switching the scene to 29.97 fps: the glTF importer converts
    # animation times with the scene fps and mis-handles fps_base (keys end up ~1M frames apart)
    root, objs, info = import_rover()
    sc = setup_render(engine, samples, device=device)
    setup_world(env_strength=env)
    ground = ground_disc(parent=root)
    lights = studio_lights(light_k)
    exclude_from_lights(ground, list(lights.values()))
    lights["GroundPool"] = ground_pool_light(ground)
    cam = make_camera()
    return sc, root, objs, info, ground, lights, cam
