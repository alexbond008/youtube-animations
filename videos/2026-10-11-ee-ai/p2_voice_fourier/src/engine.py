"""Tiny frame engine: Manim CE Cairo camera + PIL background/bloom + ffmpeg pipe.
Every frame is a pure function of time t. 1 Manim unit = 135 px."""
import os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import manimpango
from manim import *

FONTS = Path(__file__).resolve().parent / "fonts"
for f in ["Inter-Regular", "Inter-Medium", "Inter-SemiBold", "Inter-Bold", "Inter-ExtraBold",
          "STIXTwoText", "STIXTwoText-Italic", "STIXTwoMath-Regular",
          "JetBrainsMono-Regular", "JetBrainsMono-Medium"]:
    manimpango.register_font(str(FONTS / f"{f}.ttf"))

EXTRABOLD = ULTRABOLD
FPS_N, FPS_D = 30000, 1001
FPS = FPS_N / FPS_D
UNIT = 135.0
BG, CARD, BORDER = "#0E0E10", "#16161A", "#2A2A30"
TEXT, MUTED, ORANGE = "#F5F5F7", "#A1A1AA", "#D97757"
BLUE, GREEN, RED, AMBER, PURPLE = "#4DA3FF", "#3DDC97", "#FF5A4E", "#F5B800", "#B48CFF"
CAP = {"Inter": 0.727, "STIX Two Text": 0.662, "JetBrains Mono": 0.73}


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, t0, dur):
    return clamp((t - t0) / dur) if dur > 0 else float(t >= t0)


def ease(x):  # cubic-bezier(.2,.8,.2,1)-like ease-out
    x = clamp(x)
    return 1 - (1 - x) ** 4


def smooth(x):
    x = clamp(x)
    return x * x * x * (x * (6 * x - 15) + 10)


def lerp(a, b, x):
    return a + (b - a) * x


class Stage:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.cam = Camera(pixel_width=W, pixel_height=H, frame_width=W / UNIT,
                          frame_height=H / UNIT, background_opacity=0.0, frame_rate=30)
        self.bg = self._make_bg()
        self._capcache = {}

    def P(self, x, y):
        return np.array([(x - self.W / 2) / UNIT, (self.H / 2 - y) / UNIT, 0.0])

    def _make_bg(self):
        S = 3
        W, H = self.W, self.H
        im = Image.new("RGB", (W * S, H * S), BG)
        d = ImageDraw.Draw(im)
        r = 1.2 * S
        for y in range(12, H, 24):
            for x in range(12, W, 24):
                d.ellipse([x * S - r, y * S - r, x * S + r, y * S + r], fill="#23232A")
        im = im.resize((W, H), Image.LANCZOS)
        # very soft vignette
        yy, xx = np.mgrid[0:H, 0:W]
        v = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
        a = np.asarray(im).astype(np.float32) * (1 - 0.22 * np.clip(v - 0.35, 0, 1.2) [..., None])
        return Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert("RGBA")

    # ---- text -------------------------------------------------------
    def text(self, s, px, color=TEXT, weight=SEMIBOLD, font="Inter", slant=NORMAL):
        key = (font, weight, slant)
        if key not in self._capcache:
            h = Text("H", font=font, font_size=100, weight=weight, slant=slant).height
            self._capcache[key] = h
        m = Text(s, font=font, font_size=100, weight=weight, slant=slant, color=color)
        m.scale((px * CAP[font] / UNIT) / self._capcache[key])
        return m

    def math(self, markup, px, color=TEXT):
        key = ("math",)
        if key not in self._capcache:
            self._capcache[key] = Text("H", font="STIX Two Text", font_size=100).height
        m = MarkupText(markup, font="STIX Two Text", font_size=100, color=color)
        m.scale((px * CAP["STIX Two Text"] / UNIT) / self._capcache[key])
        return m

    # ---- render -----------------------------------------------------
    def _cap(self, cam, mobs):
        cam.reset()
        cam.capture_mobjects([m for m in mobs if m is not None])
        return Image.fromarray(cam.pixel_array.copy(), "RGBA")

    def render(self, mobs, glow=None, gain=0.6):
        """mobs: drawn normally. glow: extra mobjects whose blurred copy is added (accent bloom)."""
        out = Image.alpha_composite(self.bg, self._cap(self.cam, mobs)).convert("RGB")
        if glow:
            if not hasattr(self, "cam2"):
                self.cam2 = Camera(pixel_width=self.W, pixel_height=self.H, frame_width=self.W / UNIT,
                                   frame_height=self.H / UNIT, background_opacity=0.0, frame_rate=30)
            g = self._cap(self.cam2, glow)
            a = g.filter(ImageFilter.GaussianBlur(10)).convert("RGB")
            b = g.filter(ImageFilter.GaussianBlur(34)).convert("RGB")
            lut = [min(255, int(v * gain)) for v in range(256)]
            out = ImageChops.add(out, a.point(lut * 3))
            out = ImageChops.add(out, b.point([min(255, int(v * gain * 1.3)) for v in range(256)] * 3))
        return out


def sw(px):
    """pixels -> manim stroke_width"""
    return px / 1.35


def encode(stage, frame_fn, dur, hold, out_path, name="clip", stills=None):
    """frame_fn(t)->list of mobjects. Content runs 0..dur, then t=dur is held for `hold` s."""
    total = int(round((dur + hold) * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{stage.W}x{stage.H}", "-r", f"{FPS_N}/{FPS_D}", "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709",
           "-color_trc", "bt709", "-movflags", "+faststart", "-an", str(out_path)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for i in range(total):
        t = i * FPS_D / FPS_N
        if t >= dur:
            if last is None:
                last = stage.render(*frame_fn(dur)).tobytes()
            p.stdin.write(last)
        else:
            p.stdin.write(stage.render(*frame_fn(t)).tobytes())
        if i % 60 == 0:
            print(f"{name}: frame {i}/{total}", flush=True)
    p.stdin.close()
    p.wait()


def stills(stage, frame_fn, times, outdir, prefix="frame"):
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    for k, t in enumerate(times, 1):
        stage.render(*frame_fn(t)).save(outdir / f"{prefix}_{k:02d}.png")
