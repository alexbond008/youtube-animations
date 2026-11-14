"""arxiv_demo: abstract page -> click "View PDF" -> dark PDF viewer -> fast scroll to page 6 ->
zoom on the NL quote ("Four more derivatives") vs the Lean hypotheses (w.length + 5) with amber sweeps.

Frame-stepped and deterministic. Inputs (made by the other steps, see README):
  ../work/abs_2x.png, ../work/abs_boxes.json   (node capture_abs.js)
  ../dl/2610.08144.pdf                          (arXiv PDF)
Usage: python render.py [--stills]     (FFMPEG env var overrides the ffmpeg binary)
"""
import json, math, os, subprocess, sys
import numpy as np
import pymupdf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORK = os.path.join(ROOT, 'work')
PDF = os.path.join(ROOT, 'dl', '2610.08144.pdf')
OUT = os.path.join(ROOT, 'arxiv_demo_1080p.mp4')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
FONT = os.path.join(HERE, 'fonts', 'inter-latin-600-normal.woff2')
FONT_R = os.path.join(HERE, 'fonts', 'inter-latin-400-normal.woff2')

FPS = 30000 / 1001
W, H = 1920, 1080
T_ANIM = 9.0
N = round(T_ANIM * FPS)
HOLD = round(FPS)

# ---------- easing ----------
def clamp01(x): return max(0.0, min(1.0, x))
def ease_io(x): x = clamp01(x); return 4*x*x*x if x < .5 else 1 - (-2*x+2)**3/2
def ease_out(x): x = clamp01(x); return 1 - (1-x)**3
def ease_sine(x): x = clamp01(x); return -(math.cos(math.pi*x) - 1) / 2
def lerp(a, b, u): return a + (b - a) * u

def keyed(t, kfs, ease=ease_io):
    """kfs: [(t, value-tuple)], eased between consecutive keys."""
    if t <= kfs[0][0]: return kfs[0][1]
    for (ta, va), (tb, vb) in zip(kfs, kfs[1:]):
        if t <= tb:
            u = ease((t - ta) / (tb - ta))
            return tuple(lerp(a, b, u) for a, b in zip(va, vb))
    return kfs[-1][1]

# ---------- scene A: arXiv abstract page ----------
ABS_PAD = 120  # abs px of edge-replicated margin on the left/right
ABS = Image.fromarray(np.pad(np.asarray(Image.open(os.path.join(WORK, 'abs_2x.png')).convert('RGB')),
                             ((0, 0), (ABS_PAD * 2, ABS_PAD * 2), (0, 0)), mode='edge'))
BOX = json.load(open(os.path.join(WORK, 'abs_boxes.json')))
vp = BOX['viewPdf']
VIEW_PDF = (vp['x'] + vp['w'] * 0.45, vp['y'] + vp['h'] * 0.55)  # click point, abs coords

def clamp_cam(s, cx, cy, ww=1920, wh=1080, mx=0):
    hw, hh = W / 2 / s, H / 2 / s
    return s, min(max(cx, hw - mx), ww - hw + mx), min(max(cy, hh), wh - hh)

CAM_A = [(0.0, (1.14, 800, 474)), (0.30, (1.14, 800, 474)), (1.25, (1.38, 1224, 391)),
         (1.40, (1.38, 1224, 391)), (1.85, (1.46, 1300, 330))]

def cam_a(t): return clamp_cam(*keyed(t, CAM_A), mx=ABS_PAD * 0.9)

def view(img2x, s, cx, cy, scale=2, xoff=0):
    x0, y0 = cx - W / 2 / s + xoff, cy - H / 2 / s
    box = (x0 * scale, y0 * scale, (x0 + W / s) * scale, (y0 + H / s) * scale)
    return img2x.resize((W, H), Image.LANCZOS, box=box)

def w2o(p, cam):
    s, cx, cy = cam
    return ((p[0] - cx) * s + W / 2, (p[1] - cy) * s + H / 2)

# cursor path in scene A (abs coords)
CUR_A = [(0.0, (930, 640)), (0.25, (930, 640)), (1.25, VIEW_PDF)]

# ---------- scene B: dark PDF viewer ----------
doc = pymupdf.open(PDF)
NPAGES = len(doc)
PT_W, PT_H = doc[0].rect.width, doc[0].rect.height
PW = 1000.0                          # page width in world px
K = PW / PT_W                        # world px per pt
PH = PT_H * K
GAP = 28.0
WIN = (36, 28, 1884, 1052)           # viewer window
TB_H = 60
CONT = (WIN[0], WIN[1] + TB_H, WIN[2], WIN[3])
PX0 = (W - PW) / 2
HIRES_W = 3000
PAGE_IMG = {}
def page_img(i):
    if i not in PAGE_IMG:
        z = HIRES_W / PT_W
        pm = doc[i].get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False)
        PAGE_IMG[i] = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
    return PAGE_IMG[i]

def page_top(i): return GAP + i * (PH + GAP)
DOC_H = page_top(NPAGES)
KEY_PAGE = 5                          # page 6 (0-based 5)

def pt2world(i, x, y, sy):
    return (PX0 + x * K, CONT[1] + page_top(i) + y * K - sy)

# region of interest on page 6, in pt: NL quote line + Lean hfirst/hsecond hypotheses
ROI = (100, 150, 550, 360)
roi_c_doc_y = page_top(KEY_PAGE) + (ROI[1] + ROI[3]) / 2 * K
SY_END = round(CONT[1] + roi_c_doc_y - 570)
ROI_C = (PX0 + (ROI[0] + ROI[2]) / 2 * K - 24, 570)

def scroll_y(t):
    return lerp(0, SY_END, ease_sine((t - 1.95) / (4.95 - 1.95)))

CAM_B = [(0.0, (1.0, 960, 540)), (4.55, (1.0, 960, 540)), (5.85, (2.05, ROI_C[0], ROI_C[1])),
         (9.0, (2.17, ROI_C[0] + 4, ROI_C[1] + 6))]

# sweeps: (t0, t1, page-pt box)  -- word boxes from PyMuPDF search_for on page 6
SWEEPS = [
    (6.00, 6.30, (339.3, 159.7, 482.6, 169.7)),   # "Four more derivatives of F than the"
    (6.32, 6.46, (112.7, 174.1, 178.5, 184.0)),   # "requested output"
    (6.75, 6.98, (223.0, 321.5, 275.7, 328.8)),   # hfirst: (w.length + 5)
    (7.08, 7.31, (223.0, 344.5, 275.7, 351.8)),   # hsecond: (w.length + 5)
]
AMBER = (245, 184, 0, 82)

def sweep_u(t, t0, t1):
    u = clamp01((t - t0) / (t1 - t0))
    return u if u >= 1 else (0.3 * u + 0.7 * ease_io(u))

def sweep_pt(i):
    b = SWEEPS[i][2]
    return b

def cursor_b_world(t, sy):
    """cursor in world coords during scene B."""
    def P(x, y): return pt2world(KEY_PAGE, x, y, sy)
    click_world = None
    if t < 2.4:
        start = CLICK_OUT  # scene B camera is identity until 4.55
        return keyed(t, [(1.85, start), (2.45, (1590, 640))])
    if t < 4.85:
        return keyed(t, [(2.45, (1590, 640)), (4.85, (1572, 662))], ease_sine)
    b = [s[2] for s in SWEEPS]
    pad = 0.0
    path = [
        (4.85, (1572, 662)),
        (5.95, P(b[0][0] - 2.5, (b[0][1] + b[0][3]) / 2 + 2)),
        (6.00, P(b[0][0] - 2.5, (b[0][1] + b[0][3]) / 2 + 2)),
        (6.30, P(b[0][2] + 2.5, (b[0][1] + b[0][3]) / 2 + 2)),
        (6.32, P(b[1][0] - 2.5, (b[1][1] + b[1][3]) / 2 + 2)),
        (6.46, P(b[1][2] + 2.5, (b[1][1] + b[1][3]) / 2 + 2)),
        (6.73, P(b[2][0] - 2.5, (b[2][1] + b[2][3]) / 2 + 2)),
        (6.75, P(b[2][0] - 2.5, (b[2][1] + b[2][3]) / 2 + 2)),
        (6.98, P(b[2][2] + 2.5, (b[2][1] + b[2][3]) / 2 + 2)),
        (7.06, P(b[3][0] - 2.5, (b[3][1] + b[3][3]) / 2 + 2)),
        (7.08, P(b[3][0] - 2.5, (b[3][1] + b[3][3]) / 2 + 2)),
        (7.31, P(b[3][2] + 2.5, (b[3][1] + b[3][3]) / 2 + 2)),
        (7.90, P(b[3][2] + 30, b[3][3] + 0)),
        (9.00, P(b[3][2] + 36, b[3][3] + 2)),
    ]
    for t0, t1, bb in SWEEPS:
        if t0 <= t <= t1:
            u = sweep_u(t, t0, t1)
            x0 = bb[0] - 2.5; x1 = bb[2] + 2.5
            return P(lerp(x0, x1, u), (bb[1] + bb[3]) / 2 + 2)
    return keyed(t, path, ease_io)

def font(size, path=FONT): return ImageFont.truetype(path, max(6, int(round(size))))

def build_chrome():
    s2 = 2
    im = Image.new('RGB', (W * s2, H * s2), (14, 14, 16))
    d = ImageDraw.Draw(im)
    for y in range(0, H * s2, 48):
        for x in range(0, W * s2, 48):
            d.ellipse((x - 2.4, y - 2.4, x + 2.4, y + 2.4), fill=(35, 35, 42))
    # shadow
    sh = Image.new('L', im.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle([v * s2 for v in (WIN[0], WIN[1] + 20, WIN[2], WIN[3] + 20)], 32, fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(60))
    im.paste(Image.new('RGB', im.size, (0, 0, 0)), (0, 0), sh)
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = [v * s2 for v in WIN]
    d.rounded_rectangle((x0, y0, x1, y1), 32, fill=(22, 22, 26), outline=(42, 42, 48), width=2)
    # content area
    d.rectangle((CONT[0] * s2 + 2, CONT[1] * s2, CONT[2] * s2 - 2, CONT[3] * s2 - 30), fill=(40, 40, 45))
    d.rounded_rectangle((CONT[0] * s2 + 2, CONT[3] * s2 - 60, CONT[2] * s2 - 2, CONT[3] * s2 - 2), 30, fill=(40, 40, 45))
    d.line((x0, CONT[1] * s2, x1, CONT[1] * s2), fill=(42, 42, 48), width=2)
    # toolbar: sidebar icon, filename, zoom, icons
    ty = (WIN[1] + TB_H / 2) * s2
    for k in (-10, 0, 10):
        d.rounded_rectangle((70 * s2, ty + k * 2 - 2, 92 * s2, ty + k * 2 + 2), 2, fill=(161, 161, 170))
    f = font(19 * s2)
    d.text((114 * s2, ty), '2610.08144.pdf', font=f, fill=(245, 245, 247), anchor='lm')
    fz = font(18 * s2, FONT_R)
    d.text((1180 * s2, ty), '−', font=fz, fill=(161, 161, 170), anchor='mm')
    d.rounded_rectangle((1204 * s2, ty - 32, 1286 * s2, ty + 32), 12, fill=(32, 32, 37), outline=(52, 52, 58), width=2)
    d.text((1245 * s2, ty), '125%', font=fz, fill=(245, 245, 247), anchor='mm')
    d.text((1310 * s2, ty), '+', font=fz, fill=(161, 161, 170), anchor='mm')
    # download (arrow into tray) + print-ish icons, simple strokes
    cx = 1770 * s2
    d.line((cx, ty - 22, cx, ty + 10), fill=(161, 161, 170), width=5)
    d.line((cx - 12, ty - 2, cx, ty + 10, cx + 12, ty - 2), fill=(161, 161, 170), width=5, joint='curve')
    d.line((cx - 18, ty + 20, cx + 18, ty + 20), fill=(161, 161, 170), width=5)
    cx = 1830 * s2
    for k in (-12, 0, 12):
        d.ellipse((cx - 5, ty + k * 2 - 5, cx + 5, ty + k * 2 + 5), fill=(161, 161, 170))
    return im

CHROME = build_chrome()
F_COUNTER = FONT_R

def render_b_base(t, sy, cam):
    """viewer frame without cursor/markers, at camera cam."""
    s, cx, cy = cam
    frame = view(CHROME, s, cx, cy)
    # pages, clipped to content area
    c0 = w2o((CONT[0] + 2, CONT[1]), cam); c1 = w2o((CONT[2] - 2, CONT[3] - 2), cam)
    clip = (max(0, c0[0]), max(0, c0[1]), min(W, c1[0]), min(H, c1[1]))
    d = ImageDraw.Draw(frame)
    first = max(0, int((sy - GAP) // (PH + GAP)) - 1)
    for i in range(first, min(NPAGES, first + 4)):
        wx0, wy0 = PX0, CONT[1] + page_top(i) - sy
        o0 = w2o((wx0, wy0), cam); o1 = w2o((wx0 + PW, wy0 + PH), cam)
        # shadow
        sx0, sy0, sx1, sy1 = o0[0] + 3 * s, o0[1] + 5 * s, o1[0] + 3 * s, o1[1] + 5 * s
        sx0, sy0, sx1, sy1 = max(sx0, clip[0]), max(sy0, clip[1]), min(sx1, clip[2]), min(sy1, clip[3])
        if sx1 > sx0 and sy1 > sy0:
            d.rectangle((sx0, sy0, sx1, sy1), fill=(24, 24, 28))
        ix0, iy0 = max(o0[0], clip[0]), max(o0[1], clip[1])
        ix1, iy1 = min(o1[0], clip[2]), min(o1[1], clip[3])
        if ix1 - ix0 < 1 or iy1 - iy0 < 1: continue
        X0, Y0, X1, Y1 = int(round(ix0)), int(round(iy0)), int(round(ix1)), int(round(iy1))
        img = page_img(i)
        f = img.width / (o1[0] - o0[0])
        box = (max(0.0, (X0 - o0[0]) * f), max(0.0, (Y0 - o0[1]) * f), min(img.width, (X1 - o0[0]) * f), min(img.height, (Y1 - o0[1]) * f))
        frame.paste(img.resize((X1 - X0, Y1 - Y0), Image.LANCZOS, box=box), (X0, Y0))
    # scrollbar thumb
    ch = CONT[3] - CONT[1]
    th = max(44, ch * ch / DOC_H)
    ty = CONT[1] + 6 + (ch - th - 12) * (sy / (DOC_H - ch))
    a = w2o((CONT[2] - 13, ty), cam); b = w2o((CONT[2] - 7, ty + th), cam)
    d.rounded_rectangle((a[0], a[1], b[0], b[1]), radius=3 * s, fill=(110, 110, 118))
    # page counter in toolbar
    cur = min(NPAGES, int((sy + ch / 2 - GAP) // (PH + GAP)) + 1)
    p = w2o((960, WIN[1] + TB_H / 2), cam)
    if -60 < p[1] < H + 60:
        f = font(18 * s, F_COUNTER)
        bx = w2o((902, WIN[1] + 14), cam); bx2 = w2o((960, WIN[1] + TB_H - 14), cam)
        d.rounded_rectangle((bx[0], bx[1], bx2[0], bx2[1]), radius=6 * s, fill=(32, 32, 37), outline=(52, 52, 58), width=max(1, int(s)))
        d.text(((bx[0] + bx2[0]) / 2, p[1]), str(cur), font=f, fill=(245, 245, 247), anchor='mm')
        d.text((w2o((970, 0), cam)[0], p[1]), f'/ {NPAGES}', font=f, fill=(161, 161, 170), anchor='lm')
    return frame

# ---------- cursor + effects ----------
def make_cursor():
    S = 8
    pts = [(0, 0), (0, 20.5), (4.9, 16.1), (8.1, 23.6), (11.3, 22.2), (8.2, 15.1), (14.6, 15.1)]
    pad = 6
    size = (int((16 + 2 * pad) * S), int((26 + 2 * pad) * S))
    P = [((x + pad) * S, (y + pad) * S) for x, y in pts]
    sh = Image.new('L', size, 0)
    ImageDraw.Draw(sh).polygon([(x + 1.2 * S, y + 2.2 * S) for x, y in P], fill=110)
    sh = sh.filter(ImageFilter.GaussianBlur(1.6 * S))
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    im.paste((0, 0, 0, 255), (0, 0), sh)
    d = ImageDraw.Draw(im)
    d.polygon(P, fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=int(1.5 * S))
    return im, pad * S, S

CUR_IMG, CUR_PAD, CUR_S = make_cursor()

def draw_cursor(frame, pos, scale):
    h = 30 * scale  # nominal ~26 px arrow at scale 1 plus pad
    f = scale / CUR_S * 1.12
    img = CUR_IMG.resize((max(1, int(CUR_IMG.width * f)), max(1, int(CUR_IMG.height * f))), Image.LANCZOS)
    frame.paste(img, (int(round(pos[0] - CUR_PAD * f)), int(round(pos[1] - CUR_PAD * f))), img)

def draw_ripple(frame, pos, u):
    if not (0 <= u <= 1): return
    ov = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    e = ease_out(u)
    r = 10 + 46 * e
    a = 1 - u
    d.ellipse((pos[0] - r, pos[1] - r, pos[0] + r, pos[1] + r), fill=(217, 119, 87, int(60 * a)),
              outline=(217, 119, 87, int(235 * a)), width=4)
    frame.alpha_composite(ov) if frame.mode == 'RGBA' else frame.paste(ov, (0, 0), ov)

def draw_sweeps(frame, t, sy, cam):
    ov = Image.new('RGBA', frame.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    s = cam[0]
    any_ = False
    for t0, t1, b in SWEEPS:
        if t < t0: continue
        u = sweep_u(t, t0, t1)
        x0, y0 = pt2world(KEY_PAGE, b[0] - 2.5, b[1] - 1.8, sy)
        x1, y1 = pt2world(KEY_PAGE, b[2] + 2.5, b[3] + 1.8, sy)
        xe = lerp(x0, x1, u)
        if xe - x0 < 0.5: continue
        a, c = w2o((x0, y0), cam), w2o((xe, y1), cam)
        d.rounded_rectangle((a[0], a[1], c[0], c[1]), radius=3.5 * s, fill=AMBER)
        any_ = True
    if any_:
        frame.paste(ov, (0, 0), ov)

# ---------- per-frame ----------
def cam_b(t, sy, cursor_w):
    s, cx, cy = keyed(t, CAM_B)
    # gentle cursor-follow once zoomed (OpenScreen-style)
    k = 0.10 * clamp01((t - 4.6) / 1.2)
    if cursor_w is not None:
        cx += 0.3 * k * (cursor_w[0] - cx); cy += k * (cursor_w[1] - cy)
    return (s, cx, cy)

def cursor_scale(s): return s ** 0.55

def frame_b(t, mblur=True):
    sy = scroll_y(t)
    cw = cursor_b_world(t, sy)
    cam = cam_b(t, sy, cw)
    v = abs(scroll_y(t + 1 / FPS) - sy)
    base = render_b_base(t, sy, cam)
    L = int(round(v * 0.5 * cam[0]))
    if mblur and L >= 3:
        c0 = w2o((CONT[0] + 2, CONT[1]), cam); c1 = w2o((CONT[2] - 16, CONT[3] - 2), cam)
        y0, y1 = max(0, int(c0[1])), min(H, int(c1[1]))
        x0, x1 = max(0, int(c0[0])), min(W, int(c1[0]))
        a = np.asarray(base).copy()
        reg = a[y0:y1, x0:x1].astype(np.float32)
        h2 = L // 2
        padr = np.pad(reg, ((h2 + 1, L - h2), (0, 0), (0, 0)), mode='edge')
        cs = np.cumsum(padr, axis=0)
        out = (cs[L:L + reg.shape[0]] - cs[0:reg.shape[0]]) / L
        a[y0:y1, x0:x1] = np.clip(out + 0.5, 0, 255).astype(np.uint8)
        base = Image.fromarray(a)
    draw_sweeps(base, t, sy, cam)
    return base, w2o(cw, cam), cam

CLICK_OUT = w2o(VIEW_PDF, cam_a(1.40))

def frame_at(t):
    if t < 1.50:
        cam = cam_a(t)
        fr = view(ABS, *cam, xoff=ABS_PAD)
        cur = w2o(keyed(t, CUR_A), cam)
        # hover underline on "View PDF"
        if t >= 1.15:
            a = w2o((vp['x'], vp['y'] + vp['h'] - 2), cam); b = w2o((vp['x'] + vp['w'], vp['y'] + vp['h']), cam)
            ImageDraw.Draw(fr).rectangle((a[0], a[1], b[0], b[1]), fill=(0, 0, 238))
        press = 1 - 0.14 * math.sin(math.pi * clamp01((t - 1.36) / 0.14))
        draw_ripple(fr, CLICK_OUT, (t - 1.40) / 0.45)
        draw_cursor(fr, cur, cursor_scale(cam[0]) * press)
        return fr
    if t < 1.85:
        u = ease_out((t - 1.50) / 0.35)
        cam = cam_a(t)
        fa = view(ABS, *cam, xoff=ABS_PAD)
        fa = Image.blend(fa, Image.new('RGB', (W, H), (0, 0, 0)), 0.45 * u)
        fb, _, _ = frame_b(1.85, mblur=False)
        sc = 0.86 + 0.14 * u
        ox, oy = CLICK_OUT
        # scale fb about the click point
        nb = fb.resize((int(W * sc), int(H * sc)), Image.LANCZOS)
        px, py = int(round(ox - ox * sc)), int(round(oy - oy * sc))
        mask = Image.new('L', nb.size, int(255 * u))
        fa.paste(nb, (px, py), mask)
        draw_ripple(fa, CLICK_OUT, (t - 1.40) / 0.45)
        draw_cursor(fa, CLICK_OUT, cursor_scale(1.0))
        return fa
    fr, cur, cam = frame_b(t)
    draw_cursor(fr, cur, cursor_scale(cam[0]))
    return fr

def main():
    if '--stills' in sys.argv:
        os.makedirs(os.path.join(ROOT, 'qa'), exist_ok=True)
        for k, ts in enumerate([0.3, 1.2, 1.45, 1.7, 2.6, 3.5, 4.4, 5.3, 6.2, 6.5, 7.4, 9.0]):
            frame_at(ts).save(os.path.join(ROOT, 'qa', f'frame_{k:02d}_{ts:.2f}s.png'))
        return
    cmd = [FFMPEG, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
           '-r', '30000/1001', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
           '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
           '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
           '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', '-movflags', '+faststart', OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for n in range(N):
        t = n / FPS
        last = frame_at(t).convert('RGB').tobytes()
        p.stdin.write(last)
        if n % 30 == 0: print(f'{n}/{N}', flush=True)
    last = frame_at(T_ANIM).convert('RGB').tobytes()
    for _ in range(HOLD + 1):
        p.stdin.write(last)
    p.stdin.close(); p.wait()
    print('wrote', OUT, N + HOLD + 1, 'frames')

if __name__ == '__main__':
    main()
