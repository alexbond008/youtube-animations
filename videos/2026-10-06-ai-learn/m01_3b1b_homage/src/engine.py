"""Tiny frame engine around Manim CE's Cairo Camera.

Each scene module exposes:
    NAME, DURATION_FRAMES, VARIANTS (dict name -> output suffix)
    make(variant) -> object with .frame(t) -> (mobjects, glow_mobjects)
                     and optional .bloom = [(sigma_px, weight), ...]

Every frame is a pure function of t = i * 1001 / 30000 s, so timing is exact at
29.97 fps and any single frame can be rendered on its own for QA.
Frames are rendered by a few worker processes and piped, in order, to ffmpeg.

Usage (from src/):
    .venv/bin/python render.py video  [--variant NAME] [--workers 3]
    .venv/bin/python render.py stills --times 1.0 4.5 9.0 [--variant NAME]
"""
from __future__ import annotations

import argparse
import importlib
import multiprocessing as mp
import os
import subprocess
import sys
import tempfile
import time
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")

SRC = Path(__file__).resolve().parent
ASSET_DIR = SRC.parent
W, H = 1920, 1080
FPS_NUM, FPS_DEN = 30000, 1001
FPS = FPS_NUM / FPS_DEN
FFMPEG = os.environ.get("FFMPEG", "/opt/homebrew/bin/ffmpeg")
UNIT_PX = H / 8.0          # Manim units -> pixels (frame height = 8 units)
EM_PER_FONTSIZE = 1.875    # Manim Text(font_size=1) -> 1.875 px em at 1080p

# ---- SPEC palette (AI layer) ----
BG = "#0E0E10"
DOT = "#23232A"
CARD = "#16161A"
CARD_BORDER = "#2A2A30"
TEXT = "#F5F5F7"
TEXT2 = "#A1A1AA"
ORANGE = "#D97757"
BLUE = "#4DA3FF"
GREEN = "#3DDC97"
RED = "#FF5A4E"


def px(v: float) -> float:
    """pixels -> Manim units"""
    return v / UNIT_PX


def to_xy(x_px: float, y_px: float):
    """pixel coords (origin top-left) -> Manim point"""
    import numpy as _np
    return _np.array([(x_px - W / 2) / UNIT_PX, (H / 2 - y_px) / UNIT_PX, 0.0])


def fs(em_px: float) -> float:
    """em size in pixels -> Manim font_size"""
    return em_px / EM_PER_FONTSIZE


# ---------------------------------------------------------------- easing
def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def seg(t, a, b):
    """0..1 progress of t through [a, b]"""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return float(clamp01((t - a) / (b - a)))


def ease_out_cubic(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in_cubic(x):
    x = clamp01(x)
    return x ** 3


def ease_in_out_cubic(x):
    x = float(clamp01(x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_in_out_sine(x):
    x = float(clamp01(x))
    return 0.5 - 0.5 * np.cos(np.pi * x)


def tq(t):
    """quantise to the frame centre (for discrete events under motion blur)"""
    return round(t * FPS) / FPS


def smootherstep(x):
    x = clamp01(x)
    return x * x * x * (x * (x * 6 - 15) + 10)


def _bezier_solver(x1, y1, x2, y2):
    """CSS cubic-bezier(x1,y1,x2,y2) easing as a function of progress."""
    ts = np.linspace(0, 1, 2001)
    bx = 3 * (1 - ts) ** 2 * ts * x1 + 3 * (1 - ts) * ts ** 2 * x2 + ts ** 3
    by = 3 * (1 - ts) ** 2 * ts * y1 + 3 * (1 - ts) * ts ** 2 * y2 + ts ** 3

    def f(x):
        return float(np.interp(clamp01(x), bx, by))
    return f


# SPEC entrance curve: cubic-bezier(.2,.8,.2,1)
ease_spec = _bezier_solver(0.2, 0.8, 0.2, 1.0)


# ---------------------------------------------------------------- setup
def setup_manim():
    import manimpango
    from manim import config
    config.pixel_width, config.pixel_height = W, H
    config.frame_height = 8.0
    config.frame_width = 8.0 * W / H
    config.frame_rate = FPS
    config.background_color = BG
    config.verbosity = "ERROR"
    config.media_dir = os.environ.get(
        "MANIM_MEDIA_DIR", str(Path(tempfile.gettempdir()) / "manim_media_ai_learn"))
    for f in sorted((SRC / "fonts").glob("*.ttf")):
        manimpango.register_font(str(f))


def hex_rgb(h: str):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def make_background() -> np.ndarray:
    """#0E0E10 with the SPEC dotted grid (dots #23232A, 24 px pitch, r = 1.2 px),
    analytically anti-aliased by 16x16 supersampling. Returns RGBA uint8."""
    tile, ss, r = 24, 16, 1.2
    sub = (np.arange(tile * ss) + 0.5) / ss
    X, Y = np.meshgrid(sub, sub)
    c = 12.5  # dot centred on a pixel centre
    cov = (((X - c) ** 2 + (Y - c) ** 2) <= r * r).reshape(tile, ss, tile, ss).mean(axis=(1, 3))
    bg, dot = hex_rgb(BG), hex_rgb(DOT)
    t = bg[None, None, :] * (1 - cov[..., None]) + dot[None, None, :] * cov[..., None]
    full = np.tile(t, (H // tile + 1, W // tile + 1, 1))[:H, :W]
    out = np.empty((H, W, 4), dtype=np.uint8)
    out[..., :3] = np.round(full).astype(np.uint8)
    out[..., 3] = 255
    return out


# ---------------------------------------------------------------- bloom
def _gauss_blur_float(img: np.ndarray, sigma_px: float) -> np.ndarray:
    """Gaussian blur of an HxWx3 float image, done at reduced resolution."""
    from PIL import Image
    from scipy.ndimage import gaussian_filter
    k = 4 if sigma_px >= 10 else 2
    h, w = img.shape[0] // k, img.shape[1] // k
    small = img[: h * k, : w * k].reshape(h, k, w, k, 3).mean(axis=(1, 3))
    small = gaussian_filter(small, sigma=(sigma_px / k, sigma_px / k, 0), mode="constant")
    out = np.empty_like(img)
    for ch in range(3):
        im = Image.fromarray(small[..., ch].astype(np.float32), mode="F")
        out[..., ch] = np.asarray(im.resize((img.shape[1], img.shape[0]), Image.BILINEAR))
    return out


# ---------------------------------------------------------------- worker
_S: dict = {}


def init_worker(module_name: str, variant: str, private_cache: bool = False):
    sys.path.insert(0, str(SRC))
    setup_manim()
    if private_cache:
        # Manim writes/unlinks temp SVGs next to its text cache; give each worker
        # its own copy of the (pre-warmed) cache so parallel workers never collide.
        import shutil
        from manim import config
        base = Path(config.media_dir)
        own = base.parent / f"{base.name}_w{os.getpid()}"
        if (base / "texts").exists() and not (own / "texts").exists():
            shutil.copytree(base / "texts", own / "texts")
        config.media_dir = str(own)
    from manim import Camera
    mod = importlib.import_module(module_name)
    _S["mod"] = mod
    _S["asset"] = mod.make(variant)
    cam = Camera()
    cam.set_background(make_background())
    cam.reset()
    gcam = Camera(background_color="#000000", background_opacity=0.0)
    gcam.reset()
    _S["cam"], _S["gcam"] = cam, gcam


def render_frame(i: int) -> bytes:
    """Render frame i. With asset.motion_blur = S > 1 the frame is the average of S
    sub-frames spread over a 180-degree shutter (true motion blur)."""
    asset, cam, gcam = _S["asset"], _S["cam"], _S["gcam"]
    t0 = i * FPS_DEN / FPS_NUM
    S = int(getattr(asset, "motion_blur", 1))
    shutter = 0.5
    offs = [((k + 0.5) / S - 0.5) * shutter for k in range(S)] if S > 1 else [0.0]
    acc = None
    gacc = None
    bg_dark = None
    for o in offs:
        t = (i + o) * FPS_DEN / FPS_NUM
        out = asset.frame(t)
        mobs, glows = out[0], out[1]
        shadows = out[2] if len(out) > 2 else None
        cam.reset()
        if shadows:
            if bg_dark is None:
                # SPEC card shadow: 0 20px 60px rgba(0,0,0,.55) -> darken the background
                gcam.reset()
                gcam.capture_mobjects(shadows)
                a = gcam.pixel_array[..., 3].astype(np.float32) / 255.0
                a = np.roll(a, 20, axis=0)
                a = _gauss_blur_float(np.repeat(a[..., None], 3, axis=2), 30.0)[..., 0]
                bgf = cam.pixel_array[..., :3].astype(np.float32) * (1 - 0.55 * a[..., None])
                bg_dark = np.clip(bgf + 0.5, 0, 255).astype(np.uint8)
            cam.pixel_array[..., :3] = bg_dark
        if mobs:
            cam.capture_mobjects(mobs)
        img = cam.pixel_array[..., :3].astype(np.float32)
        acc = img if acc is None else acc + img
        if glows:
            gcam.reset()
            gcam.capture_mobjects(glows)
            g = gcam.pixel_array[..., :3].astype(np.float32)  # premultiplied
            gacc = g if gacc is None else gacc + g
    img = acc / len(offs)
    if gacc is not None:
        g = gacc / len(offs)
        if g.max() > 0:
            for sigma, weight in getattr(asset, "bloom", [(6, 0.8), (22, 0.6)]):
                img += weight * _gauss_blur_float(g, sigma)
    post = getattr(asset, "post", None)
    if post is not None:
        img = post(img, t0)
    return np.clip(img + 0.5, 0, 255).astype(np.uint8).tobytes()


# ---------------------------------------------------------------- outputs
def encode_cmd(out_path: Path):
    return [
        FFMPEG, "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
        "-framerate", f"{FPS_NUM}/{FPS_DEN}", "-i", "-",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p,"
               "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
        "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-color_range", "tv", "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709",
        "-r", f"{FPS_NUM}/{FPS_DEN}", "-an", "-movflags", "+faststart",
        str(out_path),
    ]


def render_video(module_name: str, variant: str, workers: int, out_path: Path | None = None,
                 frames: int | None = None):
    sys.path.insert(0, str(SRC))
    mod = importlib.import_module(module_name)
    n = frames or mod.DURATION_FRAMES
    if out_path is None:
        out_path = ASSET_DIR / f"{mod.NAME}{mod.VARIANTS[variant]}_1080p.mp4"
    # warm the Pango/SVG text cache in this process first (avoids worker races)
    init_worker(module_name, variant)
    t0 = time.time()
    proc = subprocess.Popen(encode_cmd(out_path), stdin=subprocess.PIPE)
    ctx = mp.get_context("spawn")
    with ctx.Pool(workers, initializer=init_worker, initargs=(module_name, variant, True)) as pool:
        for k, buf in enumerate(pool.imap(render_frame, range(n), chunksize=2)):
            proc.stdin.write(buf)
            if k % 60 == 0:
                print(f"  {mod.NAME}[{variant}] frame {k}/{n}  {time.time() - t0:.0f}s", flush=True)
    proc.stdin.close()
    proc.wait()
    # remove the per-worker text-cache copies
    import glob
    import shutil
    from manim import config
    base = Path(config.media_dir)
    for d in glob.glob(str(base.parent / f"{base.name}_w*")):
        shutil.rmtree(d, ignore_errors=True)
    if proc.returncode != 0:
        raise SystemExit(f"ffmpeg failed ({proc.returncode})")
    print(f"wrote {out_path}  ({n} frames, {n * FPS_DEN / FPS_NUM:.3f}s) in {time.time() - t0:.0f}s")
    return out_path


def render_stills(module_name: str, variant: str, times, out_dir: Path, prefix="still"):
    from PIL import Image
    init_worker(module_name, variant)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for t in times:
        i = int(round(float(t) * FPS))
        buf = render_frame(i)
        p = out_dir / f"{prefix}_{variant}_{float(t):05.2f}s.png"
        Image.frombytes("RGB", (W, H), buf).save(p)
        paths.append(p)
        print(p)
    return paths


def main(module_name: str):
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["video", "stills", "all"])
    ap.add_argument("--variant", default=None)
    ap.add_argument("--workers", type=int, default=int(os.environ.get("WORKERS", "3")))
    ap.add_argument("--times", type=float, nargs="*", default=[])
    ap.add_argument("--out", default=None)
    ap.add_argument("--frames", type=int, default=None)
    a = ap.parse_args()
    sys.path.insert(0, str(SRC))
    mod = importlib.import_module(module_name)
    variants = [a.variant] if a.variant else list(mod.VARIANTS)
    if a.mode == "stills":
        out = Path(a.out) if a.out else Path(tempfile.gettempdir()) / f"{mod.NAME}_stills"
        for v in variants:
            render_stills(module_name, v, a.times, out)
    else:
        for v in variants:
            render_video(module_name, v, a.workers, Path(a.out) if a.out else None, a.frames)
