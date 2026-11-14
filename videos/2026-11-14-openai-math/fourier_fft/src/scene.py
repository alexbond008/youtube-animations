"""fourier_fft: square wave from sine harmonics -> FFT O(n log n) -> new O(n (log n)^(1-1e-13)).

Pure Python (numpy + Pillow) frame renderer piped into ffmpeg. Every frame is a pure function of t.
Usage:  python scene.py main|wave|vertical|stills  [--out DIR]
"""
import math, os, subprocess, sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FPS_N, FPS_D = 30000, 1001
FPS = FPS_N / FPS_D

BG, DOT = (14, 14, 16), (35, 35, 42)
TEXT, MUTED, FAINT = (245, 245, 247), (161, 161, 170), (70, 70, 80)
ORANGE, BLUE, GREEN, AMBER = (217, 119, 87), (77, 163, 255), (61, 220, 151), (245, 184, 0)

FONT_FILES = {
    "inter": "Inter-Regular.ttf", "inter_med": "Inter-Medium.ttf", "inter_semi": "Inter-SemiBold.ttf",
    "inter_bold": "Inter-Bold.ttf", "mono": "JetBrainsMono-Medium.ttf",
    "stix": "STIXTwoText.ttf", "stix_it": "STIXTwoText-Italic.ttf", "stixmath": "STIXTwoMath-Regular.ttf",
}


@lru_cache(None)
def font(key, size):
    return ImageFont.truetype(str(FONTS / FONT_FILES[key]), int(round(size)))


# ---------------------------------------------------------------- timing helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, t0, d):
    return clamp((t - t0) / d)


def ease(x):  # ease-out, close to cubic-bezier(.2,.8,.2,1)
    x = clamp(x)
    return 1 - (1 - x) ** 4


def fade(t, t_in, d_in=0.33, t_out=None, d_out=0.23):
    a = ease(prog(t, t_in, d_in))
    if t_out is not None:
        a *= 1 - ease(prog(t, t_out, d_out))
    return a


# ---------------------------------------------------------------- layouts
LAYOUTS = {
    "land": dict(W=1920, H=1080, x0=150, x1=1770, periods=2.5, cy=350, amp=150,
                 label=(150, 118, 30), comp_cy=640, comp_amp=72, form_y=868, form_size=50, form_w=1620,
                 head=(150, 652, 52), old=(150, 752, 60), since=28, new=(150, 880, 74),
                 tag_below=False, tag_size=30, note=(150, 968, 34)),
    "vert": dict(W=1080, H=1350, x0=70, x1=1010, periods=1.5, cy=340, amp=135,
                 label=(70, 120, 40), comp_cy=640, comp_amp=66, form_y=850, form_size=48, form_w=940,
                 head=(70, 650, 58), old=(70, 765, 66), since=34, new=(70, 915, 82),
                 tag_below=True, tag_size=40, note=(70, 1150, 46)),
}

# harmonic schedule: (k, t_on)
TERMS = [(1, 0.15), (3, 0.95), (5, 1.6), (7, 2.2), (9, 2.75)]
_fast = list(range(11, 41, 2))
TERMS += [(k, 3.2 + i * (1.3 / (len(_fast) - 1))) for i, k in enumerate(_fast)]
T_GROW = 0.35


def term_w(t, t_on):
    return ease(prog(t, t_on, T_GROW))


def phase(t):  # gentle travel of the whole wave (never static)
    return 0.32 * t


# ---------------------------------------------------------------- background
@lru_cache(None)
def background(W, H):
    S = 4
    im = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(im)
    r = 1.2 * S
    for y in range(12, H, 24):
        for x in range(12, W, 24):
            d.ellipse([x * S - r, y * S - r, x * S + r, y * S + r], fill=DOT)
    return im.resize((W, H), Image.LANCZOS).convert("RGBA")


@lru_cache(None)
def edge_mask(W, H, x0, x1):
    xs = np.arange(W, dtype=np.float32)
    m = np.clip((xs - (x0 - 10)) / 80, 0, 1) * np.clip(((x1 + 10) - xs) / 80, 0, 1)
    m = m * m * (3 - 2 * m)
    return np.tile(m[None, :], (H, 1))


def apply_alpha(img, a, mask=None):
    arr = np.asarray(img).astype(np.float32)
    al = arr[..., 3] * a
    if mask is not None:
        al *= mask
    arr[..., 3] = al
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------- text helpers
@lru_cache(None)
def text_img(s, key, size, color):
    f = font(key, size)
    l, t_, r, b = f.getbbox(s, anchor="ls")
    pad = 4
    im = Image.new("RGBA", (r - l + 2 * pad, b - t_ + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - l, pad - t_), s, font=f, fill=color + (255,), anchor="ls")
    return im, (l - pad, t_ - pad)  # offset of image top-left relative to baseline origin


def put(layer, img_off, x, y, a=1.0, scale=1.0):
    """Paste a cached text image at baseline origin (x, y)."""
    if a <= 0.003:
        return
    img, (ox, oy) = img_off
    if scale != 1.0:
        w, h = img.size
        cx, cy = x + ox + w / 2, y + oy + h / 2
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        px, py = cx - img.size[0] / 2, cy - img.size[1] / 2
    else:
        px, py = x + ox, y + oy
    if a < 1:
        img = apply_alpha(img, a)
    layer.alpha_composite(img, (int(round(px)), int(round(py))))


def pop_text(layer, s, key, size, color, x, y, t, t_in, t_out=None):
    a = fade(t, t_in, 0.33, t_out)
    sc = 0.92 + 0.08 * ease(prog(t, t_in, 0.33))
    put(layer, text_img(s, key, size, color), x, y, a, sc)


# ---------------------------------------------------------------- mini maths layout
def layout_math(items, size, x, y):
    """items: ('t', text, fontkey, rel_size, rise_em) | ('frac', num, den) | ('sp', em).
    Returns pieces [dict(kind, x, y, s, key, size, rect)]; x,y = baseline origin."""
    out, cx = [], x
    for it in items:
        if it[0] == "sp":
            cx += it[1] * size
        elif it[0] == "t":
            _, s, key, rel, rise = it
            sz = size * rel
            f = font(key, sz)
            out.append(dict(kind="t", x=cx, y=y - rise * size, s=s, key=key, size=sz))
            cx += f.getlength(s)
        elif it[0] == "frac":
            _, num, den = it
            sz = size * 0.6
            f = font("stix", sz)
            wn, wd = f.getlength(num), f.getlength(den)
            w = max(wn, wd) + 0.16 * size
            axis = y - 0.27 * size
            out.append(dict(kind="t", x=cx + (w - wn) / 2, y=axis - 0.12 * size, s=num, key="stix", size=sz))
            out.append(dict(kind="rule", x=cx + 0.04 * size, y=axis, w=w - 0.08 * size, th=max(2, size * 0.045)))
            out.append(dict(kind="t", x=cx + (w - wd) / 2, y=axis + 0.12 * size + sz * 0.68, s=den, key="stix", size=sz))
            cx += w + 0.06 * size
    return out, cx


def draw_piece(layer, p, color, a=1.0):
    if p["kind"] == "t":
        put(layer, text_img(p["s"], p["key"], round(p["size"]), color), p["x"], p["y"], a)
    else:
        im = Image.new("RGBA", (int(p["w"]) + 2, int(p["th"]) + 2), color + (int(255 * a),))
        layer.alpha_composite(im, (int(round(p["x"])), int(round(p["y"] - p["th"] / 2))))


def piece_box(p):
    if p["kind"] == "rule":
        return p["x"], p["y"] - p["th"], p["x"] + p["w"], p["y"] + p["th"]
    f = font(p["key"], round(p["size"]))
    l, t_, r, b = f.getbbox(p["s"], anchor="ls")
    return p["x"] + l, p["y"] + t_, p["x"] + r, p["y"] + b


# Fourier series formula:  f(x) ≈ 4/π [ sin x + ⅓ sin 3x + … ]
def formula_items(k):
    if k == 1:
        return [("t", "sin", "stix", 1, 0), ("sp", 0.2), ("t", "x", "stix_it", 1, 0)]
    return [("t", "+", "stix", 1, 0), ("sp", 0.22), ("frac", "1", str(k)), ("sp", 0.08),
            ("t", "sin", "stix", 1, 0), ("sp", 0.2), ("t", str(k), "stix", 1, 0), ("t", "x", "stix_it", 1, 0)]


@lru_cache(None)
def formula_layout(L):
    lay = LAYOUTS[L]
    size, x, y = lay["form_size"], lay["x0"], lay["form_y"]
    for _ in range(6):
        pre, cx = layout_math([("t", "f", "stix_it", 1, 0), ("t", "(", "stix", 1, 0), ("t", "x", "stix_it", 1, 0),
                               ("t", ")", "stix", 1, 0), ("sp", 0.3), ("t", "≈", "stixmath", 1, 0), ("sp", 0.3),
                               ("frac", "4", "π"), ("t", "[", "stix", 1.15, 0.0), ("sp", 0.1)], size, x, y)
        groups = []
        for k in (1, 3, 5, 7, 9):
            ps, cx2 = layout_math(formula_items(k), size, cx, y)
            groups.append((k, ps))
            cx = cx2 + 0.3 * size
        tail, cx_end = layout_math([("t", "+", "stix", 1, 0), ("sp", 0.3), ("t", "…", "stix", 1, 0), ("sp", 0.15),
                                    ("t", "]", "stix", 1.15, 0.0)], size, cx, y)
        if cx_end - x <= lay["form_w"] - 230 * (lay["W"] / 1920) or L == "land":
            break
        size *= 0.93
    return pre, groups, tail, cx_end, size


# New complexity:  O(n (log n)^{1 − 10^{−13}})
@lru_cache(None)
def newline_layout(L):
    lay = LAYOUTS[L]
    x, y, size = lay["new"]
    sup, sup2 = 0.62, 0.62 * 0.72
    items = [("t", "O", "stix_it", 1, 0), ("t", "(", "stix", 1, 0), ("t", "n", "stix_it", 1, 0), ("sp", 0.25),
             ("t", "(", "stix", 1, 0), ("t", "log", "stix", 1, 0), ("sp", 0.18), ("t", "n", "stix_it", 1, 0),
             ("t", ")", "stix", 1, 0), ("sp", 0.04),
             ("t", "1", "stix", sup, 0.45), ("sp", 0.05), ("t", "−", "stix", sup, 0.45), ("sp", 0.05),
             ("t", "10", "stix", sup, 0.45), ("t", "−13", "stix", sup2, 0.72), ("sp", 0.06),
             ("t", ")", "stix", 1, 0)]
    pieces, cx = layout_math(items, size, x, y)
    hl = [i for i, p in enumerate(pieces) if p.get("s") in ("10", "−13")]
    return pieces, cx, hl


# ---------------------------------------------------------------- wave geometry
def wave_points(L, t, S, extra=None):
    lay = LAYOUTS[L]
    x0, x1, cy, amp, per = lay["x0"], lay["x1"], lay["cy"], lay["amp"], lay["periods"]
    px = np.linspace(x0, x1, 2400)
    th = (px - x0) / (x1 - x0) * per * 2 * math.pi - phase(t)
    s = np.zeros_like(px)
    for k, t_on in TERMS:
        w = term_w(t, t_on)
        if w > 0:
            s += w * np.sin(k * th) / k
    s *= 4 / math.pi
    return np.stack([px * S, (cy - amp * s) * S], 1)


def square_path(L, t, S):
    lay = LAYOUTS[L]
    x0, x1, cy, amp, per = lay["x0"], lay["x1"], lay["cy"], lay["amp"], lay["periods"]
    ppr = (x1 - x0) / (per * 2 * math.pi)  # px per radian
    off = phase(t) * ppr
    half = (x1 - x0) / per / 2
    # sign(sin(th)) changes at th = m*pi -> px = x0 + off + m*half
    m0 = math.floor((x0 - 1 - x0 - off) / half)
    edges = [x0 + off + m * half for m in range(m0, m0 + int(2 * per) + 4)]
    pts = []
    for i, e in enumerate(edges[:-1]):
        a, b = max(e, x0), min(edges[i + 1], x1)
        if b <= a:
            continue
        mid = (a + b) / 2
        thm = (mid - x0) / ppr - phase(t)
        lvl = cy - amp * (1 if math.sin(thm) > 0 else -1)
        if pts:
            pts.append((a, lvl))
        else:
            pts.append((a, lvl))
        pts.append((b, lvl))
    return [(x * S, y * S) for x, y in pts]


def dashed(draw, pts, on, off, fill, width):
    acc, drawing = 0.0, True
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        seg = math.hypot(bx - ax, by - ay)
        pos = 0.0
        while pos < seg:
            lim = on if drawing else off
            step = min(lim - acc, seg - pos)
            if drawing and step > 0:
                f0, f1 = pos / seg, (pos + step) / seg
                draw.line([(ax + (bx - ax) * f0, ay + (by - ay) * f0), (ax + (bx - ax) * f1, ay + (by - ay) * f1)],
                          fill=fill, width=width)
            pos += step
            acc += step
            if acc >= lim - 1e-6:
                acc, drawing = 0.0, not drawing


# ---------------------------------------------------------------- frame
def render(L, t, mode):
    """mode: 'main' (full sequence) or 'wave' (build only)."""
    lay = LAYOUTS[L]
    W, H = lay["W"], lay["H"]
    S = 2
    frame = background(W, H).copy()
    full = mode == "main"
    after5 = full and t >= 4.8
    band_out = 4.85 if full else None  # components + formula leave before the FFT block

    # --- shapes layer (2x supersampled): target square, axis, components
    shp = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(shp)
    a_target = 0.55 * fade(t, 0.0, 0.5)
    if a_target > 0:
        dashed(d, square_path(L, t, S), 14 * S, 10 * S, FAINT + (int(255 * a_target),), int(2 * S))
    ax_a = fade(t, 0.0, 0.4) * 0.5
    d.line([(lay["x0"] * S, lay["cy"] * S), (lay["x1"] * S, lay["cy"] * S)], fill=(45, 45, 54, int(255 * ax_a)), width=2 * S)

    band_a = fade(t, 0.1, 0.4, band_out, 0.3)
    newest_k = max([k for k, to in TERMS if t >= to] or [0])
    if band_a > 0:
        cy2, A = lay["comp_cy"], lay["comp_amp"]
        px = np.linspace(lay["x0"], lay["x1"], 1600)
        th = (px - lay["x0"]) / (lay["x1"] - lay["x0"]) * lay["periods"] * 2 * math.pi - phase(t)
        d.line([(lay["x0"] * S, cy2 * S), (lay["x1"] * S, cy2 * S)], fill=(40, 40, 48, int(200 * band_a)), width=S)
        for k, t_on in TERMS[:5]:
            w = term_w(t, t_on)
            if w <= 0:
                continue
            ys = cy2 - A * (4 / math.pi) * w * np.sin(k * th) / k
            is_new = k == newest_k and k <= 9 and t < 3.2
            since = t - t_on
            if is_new:
                col, alpha = GREEN, 1.0
                width = 3 + 2.5 * math.exp(-since / 0.25)
            else:
                col, alpha, width = (92, 92, 104), 0.75, 2.2
            pts = list(zip((px * S).tolist(), (ys * S).tolist()))
            d.line(pts, fill=col + (int(255 * alpha * band_a),), width=int(round(width * S)), joint="curve")

    shp = shp.resize((W, H), Image.LANCZOS)
    shp = apply_alpha(shp, 1.0, edge_mask(W, H, lay["x0"], lay["x1"]))
    frame.alpha_composite(shp)

    # --- partial-sum wave with glow
    wv = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    dw = ImageDraw.Draw(wv)
    pulse = 0.0
    for k, t_on in TERMS:
        if t >= t_on:
            strength = 1.0 if k <= 9 else 0.35
            pulse = max(pulse, strength * math.exp(-(t - t_on) / 0.22))
    pts = wave_points(L, t, S)
    wave_a = fade(t, 0.0, 0.4) * (1 - 0.15 * ease(prog(t, 5.0, 0.6)) if full else 1)
    dw.line([tuple(p) for p in pts.tolist()], fill=BLUE + (255,), width=int(round((4.2 + 1.6 * pulse) * S)), joint="curve")
    wv = wv.resize((W, H), Image.LANCZOS)
    wv = apply_alpha(wv, wave_a, edge_mask(W, H, lay["x0"], lay["x1"]))
    glow = wv.filter(ImageFilter.GaussianBlur(10))
    g = 0.55 + 0.9 * pulse
    garr = np.asarray(glow).astype(np.float32)
    garr[..., 3] = np.clip(garr[..., 3] * g, 0, 255)
    frame.alpha_composite(Image.fromarray(garr.astype(np.uint8), "RGBA"))
    frame.alpha_composite(wv)

    # --- text layer
    tx = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lx, ly, ls = lay["label"]
    # label pill: orange dot + "Fourier series"
    la = fade(t, 0.1, 0.33)
    if la > 0:
        dot = Image.new("RGBA", (int(ls * 0.9),) * 2, (0, 0, 0, 0))
        ImageDraw.Draw(dot).ellipse([0, 0, dot.size[0] - 1, dot.size[1] - 1], fill=ORANGE + (255,))
        dot = dot.resize((int(ls * 0.36),) * 2, Image.LANCZOS)
        tx.alpha_composite(apply_alpha(dot, la), (int(lx), int(ly - ls * 0.36 - ls * 0.18)))
        put(tx, text_img("Fourier series", "inter_semi", ls, MUTED), lx + ls * 0.62, ly, la)

    # formula (terms appear with their harmonic, newest term green)
    if band_a > 0:
        pre, groups, tail, _, fsize = formula_layout(L)
        pa = fade(t, 0.1, 0.33) * band_a
        for p in pre:
            draw_piece(tx, p, TEXT, pa)
        for k, ps in groups:
            t_on = dict(TERMS)[k]
            a = fade(t, t_on, 0.3) * band_a
            col = GREEN if (k == newest_k and t < 3.2) else TEXT
            for p in ps:
                draw_piece(tx, p, col, a)
        ta = fade(t, 3.2, 0.3) * band_a
        for p in tail:
            draw_piece(tx, p, TEXT, ta)
        # term counter
        n_terms = sum(1 for k, to in TERMS if t >= to)
        if n_terms:
            ca = fade(t, 0.15, 0.3) * band_a
            cs = f"{n_terms} term" + ("s" if n_terms > 1 else "")
            ci = text_img(cs, "mono", int(fsize * 0.6), MUTED)
            put(tx, ci, lay["x1"] - ci[0].size[0] + 8, lay["form_y"], ca)

    if full:
        hx, hy, hs = lay["head"]
        pop_text(tx, "Fast Fourier transform", "inter_bold", hs, TEXT, hx, hy, t, 5.05)
        ox, oy, os_ = lay["old"]
        old_a = fade(t, 5.5, 0.33) * (1 - 0.45 * ease(prog(t, 7.0, 0.4)))
        oi = text_img("O(n log n)", "mono", os_, TEXT)
        sc = 0.92 + 0.08 * ease(prog(t, 5.5, 0.33))
        put(tx, oi, ox, oy, old_a, sc)
        si = text_img("since 1965", "inter_med", lay["since"], MUTED)
        put(tx, si, ox + oi[0].size[0] + 28, oy, fade(t, 5.85, 0.33) * (1 - 0.45 * ease(prog(t, 7.0, 0.4))))

        # typed new line
        pieces, cx_end, hl = newline_layout(L)
        T0, CPS = 7.0, 30.0
        chars = np.cumsum([len(p["s"]) if p["kind"] == "t" else 0 for p in pieces])
        typed = (t - T0) * CPS
        nx, ny, ns = lay["new"]
        if t >= T0:
            # highlight sweep behind the 10^-13 exponent
            hp = ease(prog(t, 9.5, 0.45))
            if hp > 0:
                boxes = [piece_box(pieces[i]) for i in hl]
                bx0, by0 = min(b[0] for b in boxes) - 6, min(b[1] for b in boxes) - 4
                bx1, by1 = max(b[2] for b in boxes) + 6, max(b[3] for b in boxes) + 4
                ww = int((bx1 - bx0) * hp)
                if ww > 1:
                    rr = Image.new("RGBA", (ww, int(by1 - by0)), (0, 0, 0, 0))
                    ImageDraw.Draw(rr).rounded_rectangle([0, 0, ww - 1, int(by1 - by0) - 1], radius=6,
                                                         fill=AMBER + (int(255 * 0.26),))
                    tx.alpha_composite(rr, (int(bx0), int(by0)))
            last_x = nx
            for i, p in enumerate(pieces):
                if chars[i] <= typed + 1e-6:
                    col = TEXT
                    if i in hl:
                        mix = 0.55 * ease(prog(t, 9.6, 0.4))
                        col = tuple(int(TEXT[c] * (1 - mix) + AMBER[c] * mix) for c in range(3))
                    draw_piece(tx, p, col, 1.0)
                    last_x = piece_box(p)[2]
                    last_p = p
            # block cursor
            done = typed >= chars[-1]
            cur_end = 8.4
            if t < cur_end:
                blink = 1.0 if not done else (1.0 if ((t - T0) * 2.2) % 1 < 0.6 else 0.0)
                ch = ns * 0.78 if not typed or not done else ns * 0.78
                cw = ns * 0.42
                cur = Image.new("RGBA", (int(cw), int(ch)), ORANGE + (int(255 * blink),))
                tx.alpha_composite(cur, (int(last_x + 6), int(ny - ch * 0.92)))

            # orange tag
            T_TAG = 7.85
            ta = fade(t, T_TAG, 0.33)
            if ta > 0:
                ts = lay["tag_size"]
                lab = "new · formalised in Lean"
                ti = text_img(lab, "inter_semi", ts, ORANGE)
                tw = ti[0].size[0] - 8
                pw, ph = int(tw + ts * 1.3), int(ts * 1.75)
                pill = Image.new("RGBA", (pw * 2, ph * 2), (0, 0, 0, 0))
                ImageDraw.Draw(pill).rounded_rectangle([1, 1, pw * 2 - 2, ph * 2 - 2], radius=ph, fill=ORANGE + (40,),
                                                       outline=ORANGE + (230,), width=4)
                pill = pill.resize((pw, ph), Image.LANCZOS)
                sc = 0.92 + 0.08 * ease(prog(t, T_TAG, 0.33))
                if lay["tag_below"]:
                    px0, pyc = nx, ny + ns * 0.55 + ph / 2
                else:
                    px0, pyc = cx_end + ns * 0.55, ny - ns * 0.3
                pimg = pill.resize((max(1, int(pw * sc)), max(1, int(ph * sc))), Image.LANCZOS)
                tx.alpha_composite(apply_alpha(pimg, ta), (int(px0 + pw * (1 - sc) / 2), int(pyc - pimg.size[1] / 2)))
                put(tx, ti, px0 + ts * 0.65, pyc + ts * 0.36, ta, sc)

        # note
        mx, my, ms = lay["note"]
        pop_text(tx, "faster… in theory", "inter", ms, MUTED, mx, my, t, 9.5)

    frame.alpha_composite(tx)
    return frame.convert("RGB")


# ---------------------------------------------------------------- output
JOBS = {
    "main": ("land", "main", 13.0, "fourier_fft_1080p.mp4"),
    "wave": ("land", "wave", 7.0, "fourier_fft_wave_1080p.mp4"),
    "vertical": ("vert", "main", 13.0, "fourier_fft_vertical_1080x1350.mp4"),
}


def encode(job, outdir):
    L, mode, dur, name = JOBS[job]
    lay = LAYOUTS[L]
    W, H = lay["W"], lay["H"]
    n = int(round(dur * FPS))
    hold = 30
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", f"{FPS_N}/{FPS_D}", "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
           "-movflags", "+faststart", str(Path(outdir) / name)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for i in range(n):
        last = render(L, i * FPS_D / FPS_N, mode).tobytes()
        p.stdin.write(last)
        if i % 60 == 0:
            print(f"{job}: {i}/{n}", flush=True)
    for _ in range(hold):
        p.stdin.write(last)
    p.stdin.close()
    p.wait()


def stills(outdir, which=None):
    q = Path(outdir) / "qa"
    q.mkdir(exist_ok=True)
    shots = [("land", "main", 0.6), ("land", "main", 2.4), ("land", "main", 4.6), ("land", "main", 6.2),
             ("land", "main", 7.4), ("land", "main", 8.6), ("land", "main", 12.9),
             ("vert", "main", 2.4), ("vert", "main", 12.9), ("land", "wave", 6.9)]
    for i, (L, m, t) in enumerate(shots):
        if which and i not in which:
            continue
        render(L, t, m).save(q / f"frame_{i:02d}_{L}_{m}_{t:.1f}s.png")


if __name__ == "__main__":
    job = sys.argv[1] if len(sys.argv) > 1 else "stills"
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else str(HERE.parent)
    if job == "stills":
        stills(out)
    else:
        encode(job, out)
