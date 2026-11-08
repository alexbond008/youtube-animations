"""Shared house style for the ee-ai Manim assets (palette, fonts, background, cards)."""
import os
import numpy as np
from manim import *
from PIL import Image, ImageDraw, ImageFilter

VERT = os.environ.get("VARIANT", "h") == "v"
if VERT:
    config.frame_height = 10.0
    config.frame_width = 8.0
PXU = 135.0  # pixels per manim unit (1920/14.2222 = 1080/8 = 1080/8)
W, H = config.frame_width, config.frame_height
PW, PH = (1080, 1350) if VERT else (1920, 1080)

BG = "#0E0E10"; DOT = "#23232A"; CARD = "#16161A"; BORDER = "#2A2A30"
TXT = "#F5F5F7"; TXT2 = "#A1A1AA"; ORANGE = "#D97757"
BLUE = "#4DA3FF"; GREEN = "#3DDC97"; RED = "#FF5A4E"; AMBER = "#F5B800"

# Inter + STIX bundled in src/fonts (registered below); JetBrains Mono unavailable, Menlo kept.
UI = "Inter"
MONO = "Menlo"
MATH = "STIX Two Text"

import manimpango
for _f in sorted(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts"))):
    if _f.endswith(".ttf"):
        manimpango.register_font(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts", _f))

config.background_color = BG


def _calib():
    t = Text("H", font=UI, font_size=100, weight=BOLD)
    return t.height / 0.714  # em height in units at font_size=100
_EM100 = _calib()


def fs(px):
    """manim font_size giving an em of `px` pixels at the output pixel density."""
    return 100 * (px / PXU) / _EM100


def T(s, px=56, color=TXT, font=UI, weight=BOLD, slant=NORMAL, **kw):
    return Text(s, font=font, font_size=fs(px), color=color, weight=weight, slant=slant, **kw)


def MT(s, px=56, color=TXT, font=MATH, **kw):
    return MarkupText(s, font=font, font_size=fs(px), color=color, **kw)


def background():
    """Dotted grid (24 px pitch, r=1.2 px) + very soft warm glow, as a full-frame image."""
    ss = 3
    img = Image.new("RGB", (PW * ss, PH * ss), BG)
    d = ImageDraw.Draw(img)
    r = 1.2 * ss
    col = tuple(int(DOT[i:i + 2], 16) for i in (1, 3, 5))
    for x in range(12, PW, 24):
        for y in range(12, PH, 24):
            d.ellipse([x * ss - r, y * ss - r, x * ss + r, y * ss + r], fill=col)
    img = img.resize((PW, PH), Image.LANCZOS)
    # subtle centre glow
    yy, xx = np.mgrid[0:PH, 0:PW]
    g = np.exp(-(((xx - PW / 2) / (PW * 0.45)) ** 2 + ((yy - PH / 2) / (PH * 0.45)) ** 2))
    a = np.asarray(img).astype(float)
    a += g[..., None] * np.array([6, 3, 2])
    img = Image.fromarray(np.clip(a, 0, 255).astype("uint8"))
    path = os.path.join(os.path.dirname(__file__), f"_bg_{'v' if VERT else 'h'}.png")
    img.save(path)
    m = ImageMobject(path)
    m.set_height(H)
    m.set_z_index(-100)
    return m


def card(w, h, fill=CARD, stroke=BORDER, radius=0.119, shadow=True, sw=1.6):
    r = RoundedRectangle(corner_radius=radius, width=w, height=h, fill_color=fill, fill_opacity=1,
                         stroke_color=stroke, stroke_width=sw)
    if not shadow:
        return r
    sh = VGroup(*[
        RoundedRectangle(corner_radius=radius + 0.05 * i, width=w + 0.1 * i, height=h + 0.1 * i,
                         fill_color="#000000", fill_opacity=0.075, stroke_width=0)
        for i in range(1, 7)
    ]).move_to(r.get_center() + DOWN * 0.1)
    return VGroup(sh, r)


def card_body(c):
    return c[1] if len(c) == 2 and isinstance(c[0], VGroup) else c


def ease_out(t):
    # cubic-bezier(.2,.8,.2,1)-like: strong ease out
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** 3.2


def pop(m, run_time=0.4, shift=DOWN * 0.15):
    """Entrance: scale .92 -> 1, fade, slight rise."""
    return FadeIn(m, scale=0.92 / 1.0 if False else 1, shift=-shift, run_time=run_time, rate_func=ease_out)
