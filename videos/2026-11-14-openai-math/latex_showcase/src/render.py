"""latex_showcase: the real typeset paper "Catalan's constant is irrational" (openai/math)
fans in, the camera glides down a dense page, then zooms onto eq. (14) with an amber
marker sweep and a "good luck reading this" chip.

Usage:  python render.py            -> ../latex_showcase_1080p.mp4
        python render.py --stills   -> ../qa/frame_XX.png only
Needs ../dl/paper.pdf (see README). FFMPEG env var overrides the ffmpeg binary.
"""
import math
import os
import subprocess
import sys

import numpy as np
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PDF = os.path.join(ROOT, "dl", "paper.pdf")
OUT = os.path.join(ROOT, "latex_showcase_1080p.mp4")
FONTS = os.path.join(HERE, "fonts")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

W, H = 1920, 1080
FPS_NUM, FPS_DEN = 30000, 1001
N_ANIM = 210          # 7.0 s of motion
N_HOLD = 30           # 1 s held last frame
SS = 2                # supersampling for vector overlays

BG = (14, 14, 16)
DOT = (35, 35, 42)
CARD = (22, 22, 26)
BORDER = (42, 42, 48)
TEXT = (245, 245, 247)
TEXT2 = (161, 161, 170)
ACCENT = (217, 119, 87)
AMBER = (245, 184, 0)

PAGE_W, PAGE_H = 612.0, 792.0     # pt
TITLE_PAGE, DENSE_PAGE = 0, 5     # 0-based: page 1 and page 6 (eq. 14)
BACK_PAGES = [10, 20]             # page 11 (Lemma 3.1) and page 21 (sec 4.2)
BLOCK = (182.0, 430.0, 424.0, 504.0)  # eq. (14) bbox on page 6, pt (x0,y0,x1,y1)
PAD = 6                           # transparent px border on page bitmaps (AA edges)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


# ---------------------------------------------------------------- easing
def bez(x1, y1, x2, y2):
    def f(t):
        t = min(max(t, 0.0), 1.0)
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            xm = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m * m * x2 + m ** 3
            lo, hi = (m, hi) if xm < t else (lo, m)
        m = (lo + hi) / 2
        return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m * m * y2 + m ** 3
    return f


EASE_OUT = bez(0.2, 0.8, 0.2, 1.0)
EASE_IO = bez(0.55, 0.0, 0.25, 1.0)


def prog(f, a, b, ease=EASE_OUT):
    return ease((f - a) / float(b - a))


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- page bitmaps (mip pyramid)
class Page:
    def __init__(self, doc, idx, dpi):
        pix = doc[idx].get_pixmap(dpi=dpi, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).convert("RGBA")
        self.levels = []  # (px_per_pt, padded RGBA)
        scale = dpi / 72.0
        while True:
            padded = Image.new("RGBA", (img.width + 2 * PAD, img.height + 2 * PAD), (255, 255, 255, 0))
            padded.paste(img, (PAD, PAD))
            self.levels.append((scale, padded))
            if scale < 0.8:
                break
            scale /= math.sqrt(2)
            img = img.resize((round(PAGE_W * scale), round(PAGE_H * scale)), Image.LANCZOS)

    def pick(self, s):
        best = self.levels[0]
        for lv in self.levels:
            if lv[0] >= s:
                best = lv
        return best


def page_inverse(cam, place, L):
    """Affine coefficients mapping screen px -> source px of a page bitmap at L px/pt.
    cam=(cx,cy,s) world pt at screen centre, px per pt. place=(wx,wy,rot_deg,dx,dy):
    page top-left in world pt, rotation about page centre, extra screen offset px."""
    cx, cy, s = cam
    wx, wy, rot, dx, dy = place
    th = math.radians(-rot)
    c, sn = math.cos(th), math.sin(th)
    # screen -> world
    M1 = np.array([[1 / s, 0, cx - (W / 2 + dx) / s], [0, 1 / s, cy - (H / 2 + dy) / s], [0, 0, 1]])
    pcx, pcy = wx + PAGE_W / 2, wy + PAGE_H / 2
    # world -> page-local (inverse rotation about page centre)
    M2 = np.array([[c, -sn, PAGE_W / 2 - c * pcx + sn * pcy],
                   [sn, c, PAGE_H / 2 - sn * pcx - c * pcy], [0, 0, 1]])
    M3 = np.array([[L, 0, PAD], [0, L, PAD], [0, 0, 1]])
    M = M3 @ M2 @ M1
    return M


def draw_page(frame, shadow_acc, page, cam, place, opacity=1.0):
    s = cam[2]
    L, img = page.pick(s)
    M = page_inverse(cam, place, L)
    layer = img.transform((W, H), Image.AFFINE, tuple(M[:2].ravel()), resample=Image.BICUBIC)
    # shadow at quarter res
    q = 4
    Mq = M @ np.diag([q, q, 1.0])
    a = img.getchannel("A").transform((W // q, H // q), Image.AFFINE, tuple(Mq[:2].ravel()),
                                       resample=Image.BILINEAR)
    a = a.filter(ImageFilter.GaussianBlur(10))
    a = Image.eval(a, lambda v: int(v * 0.6 * opacity))
    a = a.resize((W, H), Image.BILINEAR)
    shifted = Image.new("L", (W, H), 0)
    shifted.paste(a, (0, 18))  # drop shadow offset (no wrap-around)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh.putalpha(shifted)
    frame.alpha_composite(sh)
    if opacity < 1:
        layer.putalpha(Image.eval(layer.getchannel("A"), lambda v: int(v * opacity)))
    frame.alpha_composite(layer)
    return M


def world_to_screen(cam, x, y):
    cx, cy, s = cam
    return (x - cx) * s + W / 2, (y - cy) * s + H / 2


# ---------------------------------------------------------------- static layers
def make_bg():
    bg = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(bg)
    r = 1.2
    for y in range(12, H, 24):
        for x in range(12, W, 24):
            d.ellipse((x - r, y - r, x + r, y + r), fill=DOT)
    return bg


def make_credit():
    f1 = font("jetbrains-mono-latin-500-normal.woff2", 21 * SS)
    f2 = font("inter-latin-600-normal.woff2", 21 * SS)
    t1, t2 = "openai/math", "  ·  Catalan’s constant is irrational"
    w1 = f1.getlength(t1)
    w2 = f2.getlength(t2)
    pw, ph = 22 * SS, 13 * SS
    cw, ch = int(w1 + w2 + 2 * pw), 50 * SS
    im = Image.new("RGBA", (cw + 4, ch + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1, 1, cw, ch), radius=12 * SS, fill=CARD + (250,), outline=BORDER, width=SS)
    d.text((1 + pw, 1 + ch / 2), t1, font=f1, fill=ACCENT, anchor="lm")
    d.text((1 + pw + w1, 1 + ch / 2), t2, font=f2, fill=TEXT2, anchor="lm")
    return im.resize((im.width // SS, im.height // SS), Image.LANCZOS)


def make_chip():
    f = font("inter-latin-700-normal.woff2", 40 * SS)
    t = "good luck reading this"
    tw = f.getlength(t)
    pw = 30 * SS
    cw, ch = int(tw + 2 * pw), 76 * SS
    m = 40 * SS
    im = Image.new("RGBA", (cw + 2 * m, ch + 2 * m), (0, 0, 0, 0))
    # soft shadow
    sh = Image.new("L", im.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((m, m + 12 * SS, m + cw, m + ch + 12 * SS), radius=18 * SS, fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(16 * SS))
    shl = Image.new("RGBA", im.size, (0, 0, 0, 0))
    shl.putalpha(sh)
    im.alpha_composite(shl)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((m, m, m + cw, m + ch), radius=18 * SS, fill=ACCENT)
    d.text((m + cw / 2, m + ch / 2 + 1 * SS), t, font=f, fill=(255, 255, 255), anchor="mm")
    im = im.rotate(-3, resample=Image.BICUBIC, expand=True)  # PIL: positive = CCW; -3 = tilt down-right
    return im.resize((im.width // SS, im.height // SS), Image.LANCZOS)


def arrow_points():
    """Hand-drawn arrow (screen px) from chip towards the equation block; slight wobble."""
    p0, p1, p2 = (1585.0, 372.0), (1590.0, 440.0), (1478.0, 448.0)
    pts = []
    for i in range(60):
        t = i / 59
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        w = 2.2 * math.sin(t * 9.0) * math.sin(t * math.pi)
        pts.append((x + w, y + w * 0.6))
    return pts


def draw_arrow(frame, k):
    if k <= 0:
        return
    pts = arrow_points()
    n = max(2, int(len(pts) * min(k, 1.0)))
    ox, oy = W // 2, H // 4  # draw only right half/middle region at SS
    layer = Image.new("RGBA", ((W - ox) * SS, (H // 2) * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sp = [((x - ox) * SS, (y - oy) * SS) for x, y in pts[:n]]
    d.line(sp, fill=ACCENT + (255,), width=7 * SS, joint="curve")
    for x, y in (sp[0], sp[-1]):
        r = 3.5 * SS
        d.ellipse((x - r, y - r, x + r, y + r), fill=ACCENT)
    if k >= 1.0:  # arrow head
        (x1, y1), (x2, y2) = sp[-6], sp[-1]
        ang = math.atan2(y2 - y1, x2 - x1)
        for da in (2.55, -2.45):
            hx, hy = x2 + 30 * SS * math.cos(ang + da), y2 + 30 * SS * math.sin(ang + da)
            d.line([(x2, y2), (hx, hy)], fill=ACCENT, width=7 * SS)
            d.ellipse((hx - 3.5 * SS, hy - 3.5 * SS, hx + 3.5 * SS, hy + 3.5 * SS), fill=ACCENT)
    layer = layer.resize((W - ox, H // 2), Image.LANCZOS)
    frame.alpha_composite(layer, (ox, oy))


# ---------------------------------------------------------------- per-frame state
def camera(f):
    # fan view (title readable) -> zoom into dense page -> glide -> zoom to eq. (14)
    s0, c0 = 2.0, (306.0, 235.0)
    s1, c1 = 3.5, (306.0, 158.0)
    c2 = (306.0, 470.0)
    s3, c3 = 5.0, (329.0, 455.0)
    if f < 46:
        return (c0[0], c0[1], s0)
    if f < 68:
        t = prog(f, 46, 68, EASE_IO)
        return (c0[0], lerp(c0[1], c1[1], t), lerp(s0, s1, t))
    if f < 124:
        t = prog(f, 68, 124, EASE_IO)
        return (c1[0], lerp(c1[1], c2[1], t), s1)
    if f < 142:
        t = prog(f, 124, 142, EASE_IO)
        return (lerp(c2[0], c3[0], t), lerp(c2[1], c3[1], t), lerp(s1, s3, t))
    return (c3[0], c3[1], s3)


def slide(f, a, b, dy0=760.0, rot0=0.0, rot1=0.0):
    t = prog(f, a, b)
    return (1 - t) * dy0, lerp(rot0, rot1, t), min(1.0, max(0.0, (f - a) / 5.0))


def render_frame(f, P, bg, credit, chip):
    frame = bg.copy()
    cam = camera(f)
    # back pages fanned behind the title page
    fans = [(P["b0"], 0, 14, -170.0, 30.0, -7.0), (P["b1"], 3, 17, 170.0, 30.0, 6.0)]
    if f < 70:  # fully covered after the zoom
        for page, a, b, wx, wy, rot in fans:
            if f >= a:
                dy, r, op = slide(f, a, b, rot0=rot * 2, rot1=rot)
                draw_page(frame, None, page, cam, (wx, wy, r, 0.0, dy), op)
        if f >= 6:
            dy, r, op = slide(f, 6, 24, rot0=4.0, rot1=0.0)
            draw_page(frame, None, P["title"], cam, (0.0, 0.0, r, 0.0, dy), op)
    if f >= 34:
        dy, r, op = slide(f, 34, 48, dy0=900.0, rot0=3.0, rot1=0.0)
        M = draw_page(frame, None, P["dense"], cam, (0.0, 0.0, r, 0.0, dy), op)

    # block in screen px
    bx0, by0 = world_to_screen(cam, BLOCK[0], BLOCK[1])
    bx1, by1 = world_to_screen(cam, BLOCK[2], BLOCK[3])

    # amber marker sweep (multiply so ink stays black)
    if f >= 140:
        k = prog(f, 140, 154)
        mx0, my0, mx1, my1 = bx0 - 14, by0 - 10, bx1 + 14, by1 + 10
        xe = lerp(mx0, mx1, k)
        a = 0.34
        tint = tuple(int(255 * (1 - a) + c * a) for c in AMBER)
        lay = Image.new("RGB", ((int(mx1 - mx0) + 40) * SS, (int(my1 - my0) + 40) * SS), (255, 255, 255))
        d = ImageDraw.Draw(lay)
        ox, oy = mx0 - 20, my0 - 20
        # slightly rough marker edges
        top = [((x - ox) * SS, (my0 - oy + 3 * math.sin(x * 0.031) + 2 * math.sin(x * 0.11)) * SS)
               for x in np.linspace(mx0, xe, 80)]
        bot = [((x - ox) * SS, (my1 - oy + 3 * math.sin(x * 0.027 + 1) + 2 * math.sin(x * 0.13)) * SS)
               for x in np.linspace(xe, mx0, 80)]
        if xe - mx0 > 2:
            d.polygon(top + bot, fill=tint)
        lay = lay.resize((lay.width // SS, lay.height // SS), Image.LANCZOS)
        ix, iy = int(round(ox)), int(round(oy))
        region = frame.crop((ix, iy, ix + lay.width, iy + lay.height)).convert("RGB")
        region = ImageChops.multiply(region, lay).convert("RGBA")
        frame.paste(region, (ix, iy))

    # dim everything except the block
    if f >= 130:
        k = prog(f, 130, 142)
        mask = Image.new("L", (W, H), int(255 * 0.42 * k))
        ImageDraw.Draw(mask).rounded_rectangle((bx0 - 12, by0 - 8, bx1 + 12, by1 + 8), radius=10, fill=0)
        mask = mask.filter(ImageFilter.GaussianBlur(3))
        dim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dim.putalpha(mask)
        frame.alpha_composite(dim)

    # hand-drawn arrow + chip
    if f >= 162:
        draw_arrow(frame, prog(f, 162, 172))
    if f >= 158:
        k = prog(f, 158, 168)
        sc = lerp(0.92, 1.0, k)
        bob = 0.0
        if 172 <= f < N_ANIM - 1:
            bob = -4.0 * math.sin(2 * math.pi * (f - 172) / float(N_ANIM - 1 - 172))
        c = chip.resize((max(1, int(chip.width * sc)), max(1, int(chip.height * sc))), Image.BICUBIC)
        if k < 1:
            c.putalpha(Image.eval(c.getchannel("A"), lambda v: int(v * k)))
        cx, cy = 1520, 318 + bob
        frame.alpha_composite(c, (int(cx - c.width / 2), int(round(cy - c.height / 2))))

    # credit chip bottom-left
    if f >= 10:
        k = prog(f, 10, 22)
        c = credit
        if k < 1:
            c = credit.copy()
            c.putalpha(Image.eval(c.getchannel("A"), lambda v: int(v * k)))
        frame.alpha_composite(c, (96, int(H - 54 - c.height + (1 - k) * 8)))
    return frame.convert("RGB")


def main():
    stills = "--stills" in sys.argv
    doc = pymupdf.open(PDF)
    P = {
        "title": Page(doc, TITLE_PAGE, 220),
        "b0": Page(doc, BACK_PAGES[0], 220),
        "b1": Page(doc, BACK_PAGES[1], 220),
        "dense": Page(doc, DENSE_PAGE, 450),
    }
    bg, credit, chip = make_bg(), make_credit(), make_chip()
    if stills:
        qa = os.path.join(ROOT, "qa")
        os.makedirs(qa, exist_ok=True)
        for i, f in enumerate([20, 40, 66, 96, 123, 150, 175, 209]):
            render_frame(f, P, bg, credit, chip).save(os.path.join(qa, f"frame_{i:02d}_f{f:03d}.png"))
        return
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-framerate", f"{FPS_NUM}/{FPS_DEN}", "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
           "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709",
           "-movflags", "+faststart", "-an", OUT]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for f in range(N_ANIM):
        last = render_frame(f, P, bg, credit, chip).tobytes()
        proc.stdin.write(last)
        if f % 30 == 0:
            print("frame", f, flush=True)
    for _ in range(N_HOLD):
        proc.stdin.write(last)
    proc.stdin.close()
    sys.exit(proc.wait())


if __name__ == "__main__":
    main()
