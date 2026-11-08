"""m01_3b1b_homage: a 3Blue1Brown-style linear transformation (homage, no Pi
creatures, no logo) whose grid lines morph into an op-amp filter schematic.

Timeline (s):
  0.00-0.95  plane draws in from the centre; i-hat / j-hat grow; matrix card appears
  1.15-2.95  shear [[1,1],[0,1]]
  3.25-5.35  rotation by 90 degrees (composite matrix shown live in the card)
  5.85-6.10  vectors + matrix card exit
  6.00-6.90  grid relaxes to orthogonal while orange redraws every line from the centre
  6.80-7.40  unused grid retracts + fades; circuit pieces are cut from the remaining lines
  6.90-8.60  pieces slide / fold into an op-amp active low-pass filter (left to right)
  8.55-8.85  junction dots land
  8.85-9.98  signal pulses run through the circuit
 10.00-11.01 clean static hold
Variant "label" adds a small "engineering too" label at 8.75 s.
"""
from __future__ import annotations

import numpy as np
from manim import (VMobject, VGroup, Polygon, Circle, Dot, Text, RoundedRectangle,
                   SEMIBOLD, MEDIUM, ITALIC)
from scipy.optimize import linear_sum_assignment

from engine import (px, to_xy, fs, seg, ease_out_cubic, ease_in_cubic, ease_in_out_cubic,
                    ease_in_out_sine, tq, smootherstep, ease_spec, BG, CARD, CARD_BORDER, TEXT, TEXT2, ORANGE,
                    BLUE, GREEN, RED, FPS)

NAME = "m01_3b1b_homage"
DURATION_FRAMES = 330            # 11.011 s at 29.97 (10 s + 1 s hold)
VARIANTS = {"notext": "", "label": "_label"}

FW, FH = 14.0 + 2 / 9, 8.0       # frame in units
N = 14                           # source-space half extent of the grid lines
G = 1.2                          # grid unit in Manim units (1 unit = 135 px)
REF_GREY = "#2C2C34"
PULSE = "#FFE1D3"

T_SHEAR = (1.15, 2.95)
T_ROT = (3.25, 5.35)
T_EXIT = (5.85, 6.10)
T_RELAX = (6.00, 6.90)        # grid relaxes to orthogonal ("engineering paper")
T_MORPH0 = 6.90               # pieces are carved out of the grid lines
MORPH_DUR = 1.25
MORPH_STAGGER = 0.45
T_FADE = (6.80, 7.40)         # unused grid retracts + fades
T_DOTS = (8.55, 8.85)
T_HOLD = 10.0


def hexc(h):
    from manim import ManimColor
    return ManimColor(h)


def mix(c1, c2, a):
    a = float(np.clip(a, 0, 1))
    r1 = np.array(hexc(c1).to_rgb())
    r2 = np.array(hexc(c2).to_rgb())
    from manim import rgb_to_color
    return rgb_to_color((1 - a) * r1 + a * r2)


def matrix_at(t):
    k = ease_in_out_sine(seg(t, *T_SHEAR)) * (1 - ease_in_out_sine(seg(t, *T_RELAX)))
    phi = np.pi / 2 * ease_in_out_sine(seg(t, *T_ROT))
    S = np.array([[1.0, k], [0.0, 1.0]])
    R = np.array([[np.cos(phi), -np.sin(phi)], [np.sin(phi), np.cos(phi)]])
    return R @ S


def poly(points, closed=False):
    m = VMobject()
    pts = [np.array([p[0], p[1], 0.0]) for p in points]
    if closed:
        pts = pts + [pts[0]]
    m.set_points_as_corners(pts)
    return m


def resample(points, K, closed=False):
    """K points along a polyline, all original vertices kept (so corners stay sharp)."""
    P = [np.array(p, dtype=float) for p in points]
    if closed:
        P = P + [P[0]]
    segs = list(zip(P[:-1], P[1:]))
    L = np.array([np.linalg.norm(b - a) for a, b in segs])
    n_int = K - len(P)                       # interior points to distribute
    alloc = np.floor(L / L.sum() * n_int).astype(int)
    while alloc.sum() < n_int:
        alloc[np.argmax(L / (alloc + 1))] += 1
    out, u = [P[0]], [0.0]
    cum = np.concatenate([[0], np.cumsum(L)])
    for s_idx, ((a, b), m) in enumerate(zip(segs, alloc)):
        for j in range(1, m + 1):
            f = j / (m + 1)
            out.append(a + (b - a) * f)
            u.append((cum[s_idx] + L[s_idx] * f) / cum[-1])
        out.append(b)
        u.append(cum[s_idx + 1] / cum[-1])
    return np.array(out), np.array(u)


def circle_pts(c, r, n=48):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False) + np.pi
    return [(c[0] + r * np.cos(t), c[1] + r * np.sin(t)) for t in a]


def zigzag(x0, x1, y, amp=0.17, cycles=3):
    pts = [(x0, y)]
    n = cycles * 2
    for i in range(n):
        x = x0 + (x1 - x0) * (2 * i + 1) / (2 * n)
        pts.append((x, y + (amp if i % 2 == 0 else -amp)))
    pts.append((x1, y))
    return pts


def build_schematic():
    """Inverting active low-pass filter: R_in, op-amp, R_f || C feedback, ground."""
    pieces = []  # (points, closed)
    Y_IN, Y_RF, Y_C = 0.6, 1.85, 2.9
    XL, XR = -1.8, 2.7            # feedback verticals
    OA_L, OA_APEX = -0.7, 1.5
    T_IN, T_OUT, TR = (-4.6, Y_IN), (4.6, 0.0), 0.12
    pieces.append((circle_pts(T_IN, TR), True))
    pieces.append(([(T_IN[0] + TR, Y_IN), (-3.6, Y_IN)], False))
    pieces.append((zigzag(-3.6, -2.6, Y_IN), False))
    pieces.append(([(-2.6, Y_IN), (OA_L, Y_IN)], False))
    pieces.append(([(XL, Y_IN), (XL, Y_C), (0.34, Y_C)], False))
    pieces.append(([(0.34, Y_C - 0.3), (0.34, Y_C + 0.3)], False))
    pieces.append(([(0.56, Y_C - 0.3), (0.56, Y_C + 0.3)], False))
    pieces.append(([(0.56, Y_C), (XR, Y_C), (XR, 0.0)], False))
    pieces.append(([(XL, Y_RF), (-0.05, Y_RF)], False))
    pieces.append((zigzag(-0.05, 0.95, Y_RF), False))
    pieces.append(([(0.95, Y_RF), (XR, Y_RF)], False))
    pieces.append(([(OA_L, 1.3), (OA_APEX, 0.0), (OA_L, -1.3)], True))
    pieces.append(([(-0.54, Y_IN), (-0.30, Y_IN)], False))          # minus
    pieces.append(([(-0.54, -Y_IN), (-0.30, -Y_IN)], False))        # plus -
    pieces.append(([(-0.42, -Y_IN - 0.12), (-0.42, -Y_IN + 0.12)], False))  # plus |
    pieces.append(([(OA_APEX, 0.0), (T_OUT[0] - TR, 0.0)], False))
    pieces.append((circle_pts(T_OUT, TR), True))
    pieces.append(([(OA_L, -Y_IN), (-1.3, -Y_IN), (-1.3, -1.55)], False))
    for w, y in [(0.62, -1.55), (0.40, -1.72), (0.18, -1.89)]:
        pieces.append(([(-1.3 - w / 2, y), (-1.3 + w / 2, y)], False))
    dots = [(XL, Y_IN), (XL, Y_RF), (XR, Y_RF), (XR, 0.0)]
    # signal paths for the pulses
    paths = {
        "in": [(T_IN[0] + TR, Y_IN)] + zigzag(-3.6, -2.6, Y_IN) + [(OA_L, Y_IN)],
        "out": [(OA_APEX, 0.0), (T_OUT[0] - TR, 0.0)],
        "rf": [(XR, 0.0), (XR, Y_RF)] + zigzag(-0.05, 0.95, Y_RF)[::-1] + [(XL, Y_RF), (XL, Y_IN)],
        "c": [(XR, 0.0), (XR, Y_C), (0.56, Y_C)],
    }
    # centre the drawing vertically
    allp = np.array([p for pts, _ in pieces for p in pts])
    cy = (allp[:, 1].max() + allp[:, 1].min()) / 2
    off = np.array([0.0, -cy])

    def sh(pts):
        return [tuple(np.array(p) + off) for p in pts]
    pieces = [(sh(p), c) for p, c in pieces]
    dots = sh(dots)
    paths = {k: sh(v) for k, v in paths.items()}
    return pieces, dots, paths


def clip_line(p0, d, xr=FW / 2 + 0.05, yr=FH / 2 + 0.05):
    """Visible part of the infinite line p0 + s d inside the frame rectangle."""
    lo, hi = -1e9, 1e9
    for k, r in ((0, xr), (1, yr)):
        if abs(d[k]) < 1e-12:
            if abs(p0[k]) > r:
                return None
            continue
        a, b = (-r - p0[k]) / d[k], (r - p0[k]) / d[k]
        lo, hi = max(lo, min(a, b)), min(hi, max(a, b))
    if hi - lo < 0.01:
        return None
    return p0 + lo * d, p0 + hi * d


class Homage:
    bloom = [(5, 0.55), (20, 0.55)]
    motion_blur = 6          # sub-frames per frame (180-degree shutter)

    def __init__(self, variant):
        self.variant = variant
        # ---------------- grid definitions (source space)
        self.lines = []  # dict(kind, axis, offset)
        for i in range(-N, N + 1):
            self.lines.append(dict(kind="axis" if i == 0 else "main", dirn="v", off=float(i)))
            self.lines.append(dict(kind="axis" if i == 0 else "main", dirn="h", off=float(i)))
        for i in range(-N, N):
            self.lines.append(dict(kind="sub", dirn="v", off=i + 0.5))
            self.lines.append(dict(kind="sub", dirn="h", off=i + 0.5))
        for L in self.lines:
            L["mob"] = VMobject()
            L["omob"] = VMobject()
        # static reference grid (faint, 3B1B "background plane")
        ref = VGroup()
        for i in range(-7, 8):
            ref.add(poly([(i * G, -FH / 2 - .1), (i * G, FH / 2 + .1)]))
        for j in range(-4, 5):
            ref.add(poly([(-FW / 2 - .1, j * G), (FW / 2 + .1, j * G)]))
        ref.set_stroke(REF_GREY, 1.1, 1.0)
        self.ref = ref
        # ---------------- vectors
        self.i_line, self.j_line = VMobject(), VMobject()
        self.i_bg, self.j_bg = VMobject(), VMobject()
        self.i_tip, self.j_tip = VMobject(), VMobject()
        self.i_lab = Text("î", font="Inter", slant=ITALIC, weight=SEMIBOLD, font_size=fs(60), color=GREEN)
        self.j_lab = Text("ĵ", font="Inter", slant=ITALIC, weight=SEMIBOLD, font_size=fs(60), color=RED)
        for lab in (self.i_lab, self.j_lab):
            lab.set_stroke(BG, 7, 1.0, background=True)
        self.i_lab0 = self.i_lab.copy()
        self.j_lab0 = self.j_lab.copy()
        # ---------------- matrix card (top-left, inside the 5% safe area)
        self._build_matrix_card()
        # ---------------- schematic + morph plan
        self.pieces, self.dots, self.paths = build_schematic()
        self._plan_morph()
        # ---------------- label variant
        self.label = None
        if variant == "label":
            self.label = Text("engineering too", font="Inter", weight=SEMIBOLD,
                              font_size=fs(52), color=TEXT)
            self.label.move_to(to_xy(960, 966))
            self.label0 = self.label.copy()

    # ------------------------------------------------------------ matrix
    def _build_matrix_card(self):
        em = 34
        ref = Text("0123456789.−", font="JetBrains Mono", weight=MEDIUM, font_size=fs(em))
        adv = px(em * 0.6)
        left = ref.get_left()[0]
        cy = ref.get_center()[1]
        self.glyph = {}
        # the ink of '0' starts at its left side bearing; every glyph gets the same offset
        for j, ch in enumerate("0123456789.−"):
            g = ref.submobjects[j]
            self.glyph[ch] = (g, g.get_center()[0] - (left + j * adv), g.get_center()[1] - cy)
        self.adv = adv
        # layout (pixels): card at top-left
        x0, y0, w, h = 112, 92, 330, 150
        self.card_rect = (x0, y0, w, h)
        self.card = RoundedRectangle(width=px(w), height=px(h), corner_radius=px(16),
                                     fill_color=CARD, fill_opacity=1, stroke_color=CARD_BORDER,
                                     stroke_width=1 / 1.35)
        self.card.move_to(to_xy(x0 + w / 2, y0 + h / 2))
        self.shadow = RoundedRectangle(width=px(w), height=px(h), corner_radius=px(16),
                                       fill_color="#000000", fill_opacity=1, stroke_width=0)
        self.shadow.move_to(self.card.get_center())
        # bracket geometry
        cx, cyp = x0 + w / 2, y0 + h / 2
        col_w = 5 * em * 0.6
        gap = 30
        self.col_x = [cx - gap / 2 - col_w, cx + gap / 2]           # left x of each 5-char slot
        self.row_y = [cyp - 24, cyp + 24]
        bx_l, bx_r = self.col_x[0] - 22, self.col_x[1] + col_w + 22
        bt, bb, tick = cyp - 52, cyp + 52, 11
        self.brackets = VGroup(
            poly([to_xy(bx_l + tick, bt)[:2], to_xy(bx_l, bt)[:2], to_xy(bx_l, bb)[:2], to_xy(bx_l + tick, bb)[:2]]),
            poly([to_xy(bx_r - tick, bt)[:2], to_xy(bx_r, bt)[:2], to_xy(bx_r, bb)[:2], to_xy(bx_r - tick, bb)[:2]]),
        ).set_stroke(TEXT, 2.2, 1.0)

    def _number(self, v, x_left_px, y_px, color):
        v = 0.0 if abs(v) < 0.005 else v
        s = f"{v:5.2f}".replace("-", "−")
        g = VGroup()
        base = to_xy(x_left_px, y_px)
        for k, ch in enumerate(s):
            if ch == " ":
                continue
            glyph, dx, dy = self.glyph[ch]
            c = glyph.copy()
            c.move_to(np.array([base[0] + k * self.adv + dx, base[1] + dy, 0]))
            g.add(c)
        g.set_fill(color, 1.0)
        return g

    def matrix_group(self, M, alpha, scale):
        grp = VGroup(self.card, self.brackets)
        cols = [GREEN, RED]
        for r in range(2):
            for c in range(2):
                grp.add(self._number(M[r, c], self.col_x[c], self.row_y[r], cols[c]))
        grp = grp.copy()
        if scale != 1:
            grp.scale(scale, about_point=self.card.get_center())
        self._set_alpha(grp, alpha)
        return grp

    @staticmethod
    def _set_alpha(m, a):
        for sm in m.family_members_with_points():
            if not hasattr(sm, "_a0"):
                sm._a0 = (sm.get_fill_opacity(), sm.get_stroke_opacity())
            fo, so = sm._a0
            sm.set_fill(opacity=fo * a)
            sm.set_stroke(opacity=so * a)
            if sm.get_stroke_width(background=True) > 0:
                sm.set_stroke(opacity=a, background=True)

    # ------------------------------------------------------------ morph plan
    def _plan_morph(self):
        """Each circuit piece is cut from the nearest parallel grid line of the
        relaxed (orthogonal) grid, then slides / folds into its final shape."""
        K = 64
        Hs = sorted({round(j * G, 6) for j in range(-N, N + 1) if abs(j * G) <= FH / 2})
        Vs = sorted({round(i * G, 6) for i in range(-N, N + 1) if abs(i * G) <= FW / 2})
        self.morphs = []
        xs = []
        for j, (pts, closed) in enumerate(self.pieces):
            P = np.array(pts, dtype=float)
            T, u = resample(pts, K, closed)
            lo, hi = P.min(axis=0), P.max(axis=0)
            cen = (lo + hi) / 2
            w, h = hi - lo
            arc = np.sum(np.linalg.norm(np.diff(np.vstack([P, P[:1]]) if closed else P, axis=0), axis=1))
            if closed:
                horiz = min(abs(np.array(Hs) - cen[1])) <= min(abs(np.array(Vs) - cen[0]))
                length = min(arc, max(w, h) * 1.15)
            else:
                horiz = w >= h
                length = arc
            if horiz:
                y = min(Hs, key=lambda v: abs(v - cen[1]))
                a0 = np.array([cen[0] - length / 2, y])
                a1 = np.array([cen[0] + length / 2, y])
            else:
                x = min(Vs, key=lambda v: abs(v - cen[0]))
                a0 = np.array([x, cen[1] - length / 2])
                a1 = np.array([x, cen[1] + length / 2])
            S = a0[None, :] + u[:, None] * (a1 - a0)[None, :]
            Sr = a1[None, :] + u[:, None] * (a0 - a1)[None, :]
            if np.linalg.norm(Sr - T, axis=1).sum() < np.linalg.norm(S - T, axis=1).sum():
                S = Sr
            on_axis = (horiz and abs(a0[1]) < 1e-6) or ((not horiz) and abs(a0[0]) < 1e-6)
            xs.append(cen[0])
            self.morphs.append(dict(S=S, T=T, axis=on_axis, mob=VMobject()))
        xs = np.array(xs)
        xn = (xs - xs.min()) / (xs.max() - xs.min())
        for mo, x in zip(self.morphs, xn):
            mo["delay"] = MORPH_STAGGER * x
        self.piece_mobs = [poly(pts, closed) for pts, closed in self.pieces]
        for m in self.piece_mobs:
            m.set_stroke(ORANGE, 3.6, 1.0)
        # pulse paths as polylines with cumulative length
        self.pulse_paths = {}
        for k, pts in self.paths.items():
            P = np.array(pts, dtype=float)
            L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
            self.pulse_paths[k] = (P, L)

    # ------------------------------------------------------------ helpers
    def _line_pts(self, L, M, grow):
        o = L["off"] * G
        if L["dirn"] == "v":
            a = np.array([o, -grow])
            b = np.array([o, grow])
        else:
            a = np.array([-grow, o])
            b = np.array([grow, o])
        A, B = M @ a, M @ b
        return [np.array([A[0], A[1], 0]), np.array([B[0], B[1], 0])]

    def _arrow(self, line, bg, tip, vec, color, alpha, scale=1.0):
        v = np.array(vec) * scale
        n = np.linalg.norm(v)
        if n < 1e-4:
            return []
        d = v / n
        tl, tw = 0.30, 0.25
        tl_eff = min(tl, n * 0.6)
        base = v - d * tl_eff
        nrm = np.array([-d[1], d[0]])
        line.set_points_as_corners([np.array([0, 0, 0]), np.array([base[0] + d[0] * 0.02, base[1] + d[1] * 0.02, 0])])
        line.set_stroke(color, 4.6, alpha)
        bg.set_points_as_corners([np.array([0, 0, 0]), np.array([v[0], v[1], 0])])
        bg.set_stroke(BG, 9.0, 0.85 * alpha)
        P = [np.array([*v, 0]), np.array([*(base + nrm * tw / 2), 0]), np.array([*(base - nrm * tw / 2), 0])]
        tip.set_points_as_corners(P + [P[0]])
        tip.set_fill(color, alpha).set_stroke(width=0)
        tip.set_stroke(BG, 4.0, 0.85 * alpha, background=True)
        return [bg, line, tip]

    def _pulse(self, key, prog, alpha):
        """comet: bright head + tapered continuous tail along the named path"""
        P, L = self.pulse_paths[key]
        total = L[-1]
        head = prog * (total + 0.7)
        out = []
        for tail, op, w in ((0.75, 0.22, 4.4), (0.5, 0.3, 4.4), (0.28, 0.45, 4.6), (0.12, 0.7, 5.0)):
            s0, s1 = max(0.0, head - tail), min(total, head)
            if s1 - s0 < 0.01:
                continue
            ss = np.linspace(s0, s1, 12)
            pts = [np.array([np.interp(v, L, P[:, 0]), np.interp(v, L, P[:, 1]), 0]) for v in ss]
            m = VMobject().set_points_as_corners(pts)
            m.set_stroke(PULSE, w, op * alpha)
            out.append(m)
        if 0 <= head <= total:
            x, y = np.interp(head, L, P[:, 0]), np.interp(head, L, P[:, 1])
            d = Dot(point=[x, y, 0], radius=0.055, color=PULSE)
            d.set_fill(PULSE, alpha).set_stroke(width=0)
            out.append(d)
        return out

    # ------------------------------------------------------------ frame
    def frame(self, t):
        mobs, glows, shadows = [], [], []
        M = matrix_at(t)
        morph_on = t >= T_MORPH0
        # ---- reference grid
        ref_a = seg(t, 0.0, 0.5) * (1 - smootherstep(seg(t, 6.0, 7.0)))
        if ref_a > 0.01:
            self.ref.set_stroke(opacity=ref_a)
            mobs.append(self.ref)
        # ---- moving plane (draw-in, shear, rotation, relax, fade)
        sub_a = 1 - smootherstep(seg(t, 6.0, 6.6))
        fade_f = seg(t, *T_FADE)
        fade = 1 - smootherstep(fade_f)
        layers = {"sub": [], "main": [], "axis": [], "orange": []}
        for L in self.lines:
            if L["kind"] == "sub" and sub_a <= 0:
                continue
            if fade <= 0:
                continue
            delay = 0.036 * abs(L["off"]) + (0.05 if L["dirn"] == "h" else 0.0)
            p = seg(t, 0.0 + delay, 0.75 + delay)
            if p <= 0:
                continue
            vis = 4.4 if L["dirn"] == "v" else 7.4
            grow = N if p >= 1 else max(0.02, vis * ease_out_cubic(p))
            if L["kind"] == "sub":
                m = L["mob"]
                m.set_points_as_corners(self._line_pts(L, M, grow))
                m.set_stroke(BLUE, 1.2, 0.30 * sub_a)
                layers["sub"].append(m)
                continue
            d2 = 0.03 * abs(L["off"])
            under_a = 1 - smootherstep(seg(t, 6.40 + d2, 6.95 + d2))
            if under_a > 0:
                m = L["mob"]
                m.set_points_as_corners(self._line_pts(L, M, grow))
                if L["kind"] == "axis":
                    m.set_stroke(TEXT, 2.6, 0.95 * under_a)
                else:
                    m.set_stroke(BLUE, 2.2, 0.88 * under_a)
                layers[L["kind"]].append(m)
            # orange redraws each line from its centre outward ("engineering paper")
            po = seg(t, 6.10 + d2, 6.75 + d2)
            if po > 0:
                g_o = 9.5 * ease_in_out_cubic(po) if po < 1 else N
                if fade_f > 0:
                    g_o = 9.5 * (1 - 0.45 * smootherstep(fade_f))
                om = L["omob"]
                om.set_points_as_corners(self._line_pts(L, M, max(g_o, 0.02)))
                om.set_stroke(ORANGE, 2.6 if L["kind"] == "axis" else 2.2, 0.92 * fade)
                layers["orange"].append(om)
        mobs += layers["sub"] + layers["main"] + layers["axis"] + layers["orange"]
        # ---- carved pieces
        if t >= T_FADE[0]:
            for mo in self.morphs:
                a_raw = seg(t, T_MORPH0 + mo["delay"], T_MORPH0 + mo["delay"] + MORPH_DUR)
                a = smootherstep(a_raw)
                Pp = (1 - a) * mo["S"] + a * mo["T"]
                m = mo["mob"]
                m.set_points_as_corners(np.column_stack([Pp, np.zeros(len(Pp))]))
                ramp = smootherstep(seg(t, T_FADE[0], T_FADE[0] + 0.35))
                width = 2.2 + 0.6 * ramp + (3.6 - 2.8) * a
                m.set_stroke(ORANGE, width, 0.92 + 0.08 * ramp)
                mobs.append(m)
        if morph_on:
            # glow builds as the circuit settles
            g_a = smootherstep(seg(t, 7.6, 8.8))
            if g_a > 0:
                for pm in self.piece_mobs:
                    pm.set_stroke(ORANGE, 3.6, g_a)
                glows.extend(self.piece_mobs)
            # junction dots
            dp = seg(t, *T_DOTS)
            if dp > 0:
                r = 0.072 * ease_out_cubic(dp)
                for (x, y) in self.dots:
                    d = Dot(point=[x, y, 0], radius=max(r, 0.001), color=ORANGE)
                    d.set_stroke(width=0)
                    mobs.append(d)
                    if g_a > 0:
                        glows.append(d.copy())
            # pulses
            if t < T_HOLD:
                for key, (a0, a1) in {"in": (8.85, 9.45), "rf": (9.36, 9.98), "c": (9.36, 9.86),
                                      "out": (9.40, 9.86)}.items():
                    p = seg(t, a0, a1)
                    if 0 < p < 1:
                        pf = 1 - smootherstep(seg(p, 0.8, 1.0))
                        com = self._pulse(key, p, pf)
                        mobs.extend(com)
                        glows.extend([c.copy() for c in com])
        # ---- vectors (above the grid)
        if t < T_EXIT[1] + 0.01:
            grow = ease_out_cubic(seg(t, 0.45, 0.95))
            ex = seg(t, *T_EXIT)
            va = 1 - smootherstep(ex)
            vs = grow * (1 - 0.25 * smootherstep(ex))
            if va > 0 and grow > 0:
                e1, e2 = M @ np.array([G, 0.0]), M @ np.array([0.0, G])
                mobs += self._arrow(self.i_line, self.i_bg, self.i_tip, e1, GREEN, va, vs)
                mobs += self._arrow(self.j_line, self.j_bg, self.j_tip, e2, RED, va, vs)
                la = seg(t, 0.75, 1.05) * va
                if la > 0:
                    for lab, lab0, e, rot in ((self.i_lab, self.i_lab0, e1, -1), (self.j_lab, self.j_lab0, e2, 1)):
                        d = e / np.linalg.norm(e)
                        nrm = rot * np.array([-d[1], d[0]])
                        pos = e * vs + d * 0.05 + nrm * 0.36
                        lab.become(lab0)
                        lab.move_to([pos[0], pos[1], 0])
                        lab.set_fill(opacity=la)
                        lab.set_stroke(BG, 7, la, background=True)
                        mobs.append(lab)
        # ---- matrix card (top-left)
        ma_in = seg(t, 0.60, 0.95)
        if ma_in > 0 and t < T_EXIT[1]:
            ex = seg(t, T_EXIT[0], T_EXIT[0] + 0.24)
            a = ease_spec(ma_in) * (1 - smootherstep(ex))
            sc = (0.92 + 0.08 * ease_spec(ma_in)) * (1 - 0.04 * smootherstep(ex))
            grp = self.matrix_group(matrix_at(tq(t)), a, sc)   # digits: no motion-blur ghosting
            mobs.append(grp)
            sh = self.shadow.copy().scale(sc)
            sh.set_fill(opacity=a)
            shadows.append(sh)
        # ---- optional label
        if self.label is not None:
            p = seg(t, 8.75, 8.75 + 11 / FPS)
            if p > 0:
                e = ease_spec(p)
                lab = self.label0.copy().scale(0.92 + 0.08 * e)
                lab.set_fill(opacity=e)
                mobs.append(lab)
        return mobs, glows, shadows


def make(variant):
    return Homage(variant)
