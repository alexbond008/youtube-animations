"""p2_voice_fourier: voice -> sound wave -> sines (Fourier series) -> spectrum -> spectrogram / Voice AI."""
import sys
import numpy as np
from engine import *

DUR, HOLD = 18.0, 1.0
NS = [1, 2, 3, 5]
AMP = [1.0, 0.7, 0.5, 0.34]
PHI = [0.4, 1.9, 0.9, 2.6]
COL = [ORANGE, BLUE, GREEN, PURPLE]
NBINS = 24
rng = np.random.RandomState(7)
FLOOR = rng.uniform(0.025, 0.075, NBINS + 1)

LAYOUT = {
    "wide": dict(
        W=1920, H=1080, C=4,
        head=dict(s=0.9, mouth=(500, 560)), wave_y=560, wave_x=(570, 1780), dec_x0=470,
        head_lab=(960, 150, 76), sub=(960, 235, 48),
        sum_y=300, k=52, formula=(1125, 425, 60), rows=[560, 680, 800, 920], lab_x=300, lab_px=60,
        base_y=900, bin_x0=330, pitch=60, bar_w=30, maxh=430, tick_px=40, tick_y=948, freq_cap=(1760, 948, 44),
        spec_card=(150, 330, 1010, 790), cell=(22, 17), cap_y=836, cap_px=44,
        arrow=((1030, 560), (1170, 560)), model_card=(1190, 330, 1770, 790), model_cap=True,
        min_px=40),
    "tall": dict(
        W=1080, H=1350, C=3,
        head=dict(s=0.78, mouth=(440, 600)), wave_y=600, wave_x=(500, 990), dec_x0=260,
        head_lab=(540, 140, 70), sub=(540, 222, 48),
        sum_y=340, k=44, formula=(625, 470, 54), rows=[650, 810, 970, 1130], lab_x=150, lab_px=60,
        base_y=1130, bin_x0=100, pitch=37.5, bar_w=22, maxh=640, tick_px=48, tick_y=1192, freq_cap=(990, 1250, 48),
        spec_card=(90, 330, 990, 790), cell=(22, 16), cap_y=840, cap_px=48,
        arrow=((540, 880), (540, 950)), model_card=(190, 975, 890, 1245), model_cap=False,
        min_px=48),
}


def heat(v):
    v = clamp(v)
    stops = [(0.0, (22, 22, 26)), (0.28, (88, 40, 28)), (0.6, (217, 119, 87)), (1.0, (255, 226, 209))]
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if v <= b:
            x = (v - a) / (b - a)
            c = [ca[i] + (cb[i] - ca[i]) * x for i in range(3)]
            return "#%02X%02X%02X" % tuple(int(q) for q in c)
    return "#FFE2D1"


def spec_amp(c, r):
    """spectrogram value for column c (0..35), row r (0..23, bin k=r+1). col 0 == real spectrum."""
    if c == 0:
        base = {1: AMP[0], 2: AMP[1], 3: AMP[2], 5: AMP[3]}
        return base.get(r + 1, FLOOR[r + 1])
    p = 1.0 + 0.30 * np.sin(c * 0.33) + 0.06 * np.sin(c * 1.1)
    form = 0.55 + 0.45 * np.sin(c * 0.21 + 1.0)
    v = 0.0
    for h in range(1, 9):
        pos = h * p
        env = np.exp(-((pos - (2.4 + 1.2 * form)) ** 2) / 8.0) * (1.0 / (0.6 + 0.35 * h)) + 0.25 * np.exp(-((pos - (8 + 3 * form)) ** 2) / 6.0)
        v += env * np.exp(-((r + 1 - pos) ** 2) / (2 * 0.32 ** 2))
    n = 0.03 + 0.05 * (0.5 + 0.5 * np.sin(c * 12.9898 + r * 78.233) * 43758.5453 % 1)
    return float(np.clip(v + n, 0, 1))


def catmull(pts, n=14):
    pts = [np.array(p, float) for p in pts]
    P = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out


HEAD_SEGS = [
    [(150, 540), (138, 470), (124, 410), (88, 350), (66, 275), (72, 195), (108, 125), (170, 68),
     (250, 40), (330, 52), (384, 100), (406, 165), (404, 215), (414, 245)],
    [(414, 245), (432, 280), (452, 322), (430, 338), (412, 342)],
    [(412, 342), (420, 358), (406, 372), (414, 388), (398, 402)],
    [(398, 402), (404, 430), (392, 462), (350, 478), (300, 470), (284, 505), (282, 545)],
]


class Voice:
    def __init__(self, variant):
        self.v = variant
        L = self.L = LAYOUT[variant]
        self.S = S = Stage(L["W"], L["H"])
        P = S.P
        # ---- head ----
        s = L["head"]["s"]
        mx, my = L["head"]["mouth"]
        ox, oy = mx - 410 * s, my - 372 * s
        self.hp = lambda x, y: (ox + x * s, oy + y * s)
        pts = []
        for seg in HEAD_SEGS:
            pts += catmull(seg, 12)
        self.head_pts = [P(*self.hp(x, y)) for x, y in pts]
        ear = catmull([(235, 300), (212, 292), (196, 318), (204, 350), (226, 362)], 10)
        self.ear_pts = [P(*self.hp(x, y)) for x, y in ear]
        self.mouth = (mx, my)
        self.throat = self.hp(262, 470)
        # ---- text (static) ----
        mp = L["min_px"]
        hl = L["head_lab"]
        self.T = {}
        self.T["voice"] = S.text("voice", hl[2], weight=EXTRABOLD).move_to(P(hl[0], hl[1]))
        self.T["sound"] = S.text("sound wave", hl[2], weight=EXTRABOLD).move_to(P(hl[0], hl[1]))
        self.T["series"] = S.text("Fourier series", hl[2], weight=EXTRABOLD).move_to(P(hl[0], hl[1]))
        self.T["ft"] = S.text("Fourier transform", hl[2], weight=EXTRABOLD).move_to(P(hl[0], hl[1]))
        self.T["ai"] = S.text("Voice AI", hl[2] + 8, color=ORANGE, weight=EXTRABOLD).move_to(P(hl[0], hl[1]))
        sb = L["sub"]
        self.T["sub"] = S.text("time → frequency", sb[2], color=MUTED, weight=MEDIUM).move_to(P(sb[0], sb[1]))
        # formula
        fx, fy, fp = L["formula"]
        self.T["formula"] = S.math("= Σ <i>a</i><sub><i>n</i></sub> cos(<i>n</i>ω<i>t</i>) + "
                                   "<i>b</i><sub><i>n</i></sub> sin(<i>n</i>ω<i>t</i>)", fp).move_to(P(fx, fy))
        self.T["formula"][:].set_color(TEXT)
        # row labels
        lp = L["lab_px"]
        labs = ["ω", "2ω", "3ω", "5ω"]
        self.rowlab = []
        for i, lb in enumerate(labs):
            pre = "" if i == 0 else "+ "
            m = S.math(f"{pre}<i>{lb}</i>" if False else f"{pre}{lb}", lp, COL[i])
            m.move_to(P(L["lab_x"], L["rows"][i]))
            self.rowlab.append(m)
        self.sumlab = S.text("voice", lp - 4, color=MUTED, weight=MEDIUM)
        self.sumlab.move_to(P(L["lab_x"], L["sum_y"]))
        # spectrum ticks
        self.ticks = []
        for i, n in enumerate(NS):
            m = S.text(str(n), L["tick_px"], color=COL[i], weight=SEMIBOLD, font="JetBrains Mono")
            m.move_to(P(self.bin_x(n), L["tick_y"]))
            self.ticks.append(m)
        fc = L["freq_cap"]
        self.freqcap = S.text("frequency →", fc[2], color=MUTED, weight=MEDIUM)
        self.freqcap.move_to(P(fc[0] - self.freqcap.width * UNIT / 2, fc[1]))
        # spectrogram caption
        self.speccap = S.text("spectrogram", L["cap_px"], color=MUTED, weight=MEDIUM)
        x0, y0, x1, y1 = L["spec_card"]
        self.speccap.move_to(P((x0 + x1) / 2, L["cap_y"]))
        self.modelcap = S.text("model", L["cap_px"], color=MUTED, weight=MEDIUM)
        mx0, my0, mx1, my1 = L["model_card"]
        self.modelcap.move_to(P((mx0 + mx1) / 2, L["cap_y"]))
        # ---- spectrogram cells ----
        cw, ch = L["cell"]
        self.ncol = 36
        padx = (x1 - x0 - self.ncol * cw) / 2
        self.cx0 = x0 + padx
        self.cy_bot = y1 - (y1 - y0 - NBINS * ch) / 2
        self.cellrect = lambda c, r: (self.cx0 + c * cw, self.cy_bot - (r + 1) * ch, cw, ch)
        self.vals = np.array([[spec_amp(c, r) for r in range(NBINS)] for c in range(self.ncol)])
        # real spectrum values (col 0) = bar heights
        self.cells = {}
        for c in range(self.ncol):
            for r in range(NBINS):
                x, y, w, h = self.cellrect(c, r)
                rc = Rectangle(width=(w - 1.5) / UNIT, height=(h - 1.5) / UNIT)
                rc.set_fill(heat(self.vals[c, r] ** 0.8), 1).set_stroke(width=0)
                rc.move_to(P(x + w / 2, y + h / 2))
                self.cells[(c, r)] = rc
        # ---- model network ----
        self.build_net()

    # --------------------------------------------------------------
    def bin_x(self, k):
        return self.L["bin_x0"] + (k - 1) * self.L["pitch"]

    def build_net(self):
        S, L = self.S, self.L
        P = S.P
        x0, y0, x1, y1 = L["model_card"]
        counts = [3, 5, 5, 3] if self.v == "wide" else [3, 4, 4, 3]
        padx, pady = 70, 60
        xs = np.linspace(x0 + padx, x1 - padx, 4)
        self.nodes = []
        for li, n in enumerate(counts):
            ys = np.linspace(y0 + pady, y1 - pady, n) if n > 1 else [(y0 + y1) / 2]
            self.nodes.append([(xs[li], y) for y in ys])
        self.edges = []
        for li in range(3):
            for a in self.nodes[li]:
                for b in self.nodes[li + 1]:
                    self.edges.append((li, a, b))

    # --------------------------------------------------------------
    def wave(self, u, s, irr, ramp_amt, comps=None):
        """u in [0,1]; returns sum (len u) and per-component arrays (unit amplitude)."""
        C = self.L["C"]
        g = C * u - s
        ge = g + irr * 0.05 * np.sin(2 * np.pi * g / 1.7)
        parts = [A * np.sin(2 * np.pi * n * ge + p) for n, A, p in zip(NS, AMP, PHI)]
        e = 0.5 + 0.5 * np.sin(2 * np.pi * g / 3.1 + 1.0)
        e = 0.45 + 0.55 * e * (0.75 + 0.25 * np.sin(2 * np.pi * g / 1.3))
        env = 1 + irr * (e - 1)
        tex = irr * (0.11 * np.sin(2 * np.pi * 7.3 * ge + 1.0) + 0.08 * np.sin(2 * np.pi * 11.7 * ge + 2.2)
                     + 0.05 * np.sin(2 * np.pi * 19.1 * ge + 0.3))
        ramp = 1 + irr * ramp_amt * 0 + (np.clip(u / 0.16, 0, 1) ** 2 * (3 - 2 * np.clip(u / 0.16, 0, 1)) - 1) * irr * 1.0
        tot = env * sum(parts) * ramp + tex * ramp
        return tot, parts

    def poly(self, xs, ys, color, px=4.5, op=1.0):
        P = self.S.P
        pts = [P(x, y) for x, y in zip(xs, ys)]
        m = VMobject().set_points_as_corners(pts)
        m.set_stroke(color, sw(px), op)
        m.set_fill(opacity=0)
        m.set_cap_style(CapStyleType.ROUND)
        m.joint_type = LineJointType.ROUND
        return m

    def lab(self, key, t, t0, t1, dy=0, tin=0.35, tout=0.25):
        o = smooth((t - t0) / tin) * (1 - smooth((t - (t1 - tout)) / tout)) if t1 else smooth((t - t0) / tin)
        if o <= 0.003:
            return None
        m = self.T[key].copy() if isinstance(key, str) else key.copy()
        m.scale(0.92 + 0.08 * ease((t - t0) / tin))
        m.set_opacity(o)
        return m

    def fade(self, mob, t, t0, t1=None, tin=0.35, tout=0.25):
        return self.lab(mob, t, t0, t1, tin=tin, tout=tout)

    # --------------------------------------------------------------
    def frame(self, t):
        S, L = self.S, self.L
        P = S.P
        mobs, glow = [], []
        add = mobs.append
        W = L["W"]
        # --- scroll + irregularity ---
        x = clamp(t / 3.3)
        sc = 3.6 * (1 - (1 - x) ** 2.2)
        sc += 0.30 * (smooth((t - 8.3) / 1.2) * (t - 8.3) if t > 8.3 else 0)
        irr = 1 - smooth((t - 3.0) / 1.9)
        appear = smooth((t - 0.9) / 1.0)
        # --- head (0..5.9) ---
        if t < 6.2:
            hd = prog(t, 0.0, 1.1)
            ho = 1 - smooth((t - 5.3) / 0.9)
            shift = -50 * smooth((t - 5.3) / 0.9)
            if hd > 0 and ho > 0:
                n = max(2, int(len(self.head_pts) * ease(hd)))
                shift_v = np.array([shift / UNIT, 0, 0])
                m = VMobject().set_points_as_corners([p + shift_v for p in self.head_pts[:n]])
                m.set_stroke(TEXT, sw(5), 0.92 * ho).set_fill(opacity=0).set_cap_style(CapStyleType.ROUND)
                m.joint_type = LineJointType.ROUND
                add(m)
                if hd > 0.55:
                    ne = int(len(self.ear_pts) * ease((hd - 0.55) / 0.45))
                    if ne > 1:
                        e = VMobject().set_points_as_corners([p + shift_v for p in self.ear_pts[:ne]])
                        e.set_stroke(MUTED, sw(3.5), 0.8 * ho).set_fill(opacity=0).set_cap_style(CapStyleType.ROUND)
                        add(e)
                # throat glow + pulse
                if 0.5 < t < 5.3:
                    tx, ty = self.throat
                    a = smooth((t - 0.5) / 0.4) * (1 - smooth((t - 4.6) / 0.7))
                    pul = 0.5 + 0.5 * np.sin((t - 0.5) * 2 * np.pi * 2.2)
                    d = Circle(radius=(7 + 3 * pul) / UNIT).move_to(P(tx + shift, ty)).set_fill(ORANGE, a).set_stroke(width=0)
                    add(d); glow.append(d.copy())
                    rr = Circle(radius=(16 + 26 * ((t * 1.9) % 1)) / UNIT).move_to(P(tx + shift, ty))
                    rr.set_stroke(ORANGE, sw(3), a * (1 - (t * 1.9) % 1) * 0.9).set_fill(opacity=0)
                    add(rr)
                # sound arcs from mouth
                if 0.55 < t < 3.6:
                    mx, my = self.mouth
                    for j in range(7):
                        te = 0.55 + 0.42 * j
                        age = (t - te) / 1.25
                        if 0 < age < 1 and te < 2.9:
                            r = 30 + 330 * ease(age)
                            op = (1 - age) ** 1.4 * smooth(age * 6)
                            a0 = Arc(radius=r / UNIT, start_angle=-0.62, angle=1.24, arc_center=P(mx + shift, my))
                            a0.set_stroke(ORANGE, sw(5 - 2 * age), op * ho)
                            add(a0); glow.append(a0.copy().set_stroke(ORANGE, sw(5), op * 0.7))
        # --- header labels ---
        for key, a, b in [("voice", 0.35, 3.0), ("sound", 3.0, 6.1), ("series", 6.1, 11.0),
                          ("ft", 11.0, 15.2), ("ai", 15.2, None)]:
            m = self.lab(key, t, a, b)
            if m is not None: add(m)
        m = self.lab("sub", t, 11.5, 15.0)
        if m is not None: add(m)

        # --- waveform (0 .. 11.4) ---
        N = 420
        u = np.linspace(0, 1, N)
        wx0, wx1 = L["wave_x"]
        dx0 = lerp(wx0, L["dec_x0"], smooth((t - 5.4) / 1.0))
        xs = dx0 + u * (wx1 - dx0)
        tot, parts = self.wave(u, sc, irr, 1.0)
        # moving amplitude: stage-1 k (big) -> sum row k
        kbig = 96 if self.v == "wide" else 62
        ksum = L["k"]
        split = smooth((t - 6.0) / 0.9)
        k_now = lerp(kbig, ksum, split)
        ycen = lerp(L["wave_y"], L["sum_y"], split)
        wv_in = appear if t < 3.0 else 1.0
        # stage-1 (fade-in amplitude from mouth)
        if t < 11.3:
            hi = smooth((t - 3.1) / 0.7) * (1 - smooth((t - 6.0) / 0.9))  # orange highlight
            col = interpolate_color(ManimColor(TEXT), ManimColor(ORANGE), hi)
            fade_out = 1 - smooth((t - 10.9) / 0.4)
            vis = smooth((t - 0.8) / 0.4) * fade_out
            if vis > 0.01:
                ys = ycen - tot * k_now * (wv_in if t < 3.0 else 1)
                m = self.poly(xs, ys, col, 5.5, vis)
                add(m)
                if hi > 0.02:
                    g = self.poly(xs, ys, ORANGE, 6, hi); glow.append(g)
                # marker sweep (3.2..5.2)
                if 3.3 < t < 5.6:
                    a = prog(t, 3.3, 1.6)
                    bw = 150
                    cx = lerp(wx0 - bw, wx1 + bw, ease(a))
                    op = 0.22 * np.sin(np.pi * a)
                    for q in range(6):
                        wq = bw * (1 - q * 0.14)
                        r = Rectangle(width=wq / UNIT, height=(2 * kbig * 1.3 + 40) / UNIT)
                        r.move_to(P(cx, L["wave_y"])).set_fill(AMBER, op * 0.35).set_stroke(width=0)
                        add(r)
        # --- decomposition rows ---
        if 6.0 < t < 14.95:
            for i in range(4):
                ti = 6.75 + 0.5 * i
                a = ease((t - ti) / 0.75)
                if a <= 0: continue
                yrow = lerp(L["sum_y"], L["rows"][i], a)
                kk = ksum * a
                comp = parts[i]
                # compress phase
                c = ease((t - 11.3 - 0.1 * i) / 0.85)
                if c > 0:
                    sx = self.bin_x(NS[i])
                    h = AMP[i] * L["maxh"]
                    bw = L["bar_w"]
                    yc = lerp(yrow, L["base_y"] - h / 2, c)
                    xx = lerp(xs, sx, c)
                    ys = yc - (comp / AMP[i]) * lerp(kk * AMP[i], (h - bw) / 2, c)
                    px = 4.5
                    fb = smooth((c - 0.7) / 0.3)
                    if fb > 0:
                        bar = Line(P(sx, L["base_y"] - bw / 2), P(sx, L["base_y"] - h + bw / 2))
                        bar.set_stroke(COL[i], sw(bw), fb).set_cap_style(CapStyleType.ROUND)
                        add(bar)
                        glow.append(bar.copy().set_stroke(COL[i], sw(bw), fb * (0.35 + 0.3 * np.sin(np.pi * prog(t, 13.6, 1.3)))))
                    a = a * (1 - fb)
                else:
                    xx = xs
                    ys = yrow - comp * kk
                    px = 4.5
                add(self.poly(xx, ys, COL[i], px, a))
                if a > 0.01: glow.append(self.poly(xx, ys, COL[i], px, 0.5 * a))
                if c <= 0.01:
                    m = self.fade(self.rowlab[i], t, ti + 0.15, 11.2)
                    if m is not None: add(m)
            # sum row (always exact sum of the four)
            if t < 11.6:
                so = smooth((t - 6.2) / 0.5) * (1 - smooth((t - 10.9) / 0.5))
                if so > 0:
                    pass
            m = self.fade(self.sumlab, t, 6.5, 10.9)
            if m is not None: add(m)
            m = self.fade(self.T["formula"], t, 8.9, 10.9, tin=0.5, tout=0.4)
            if m is not None:
                add(m)
                if t < 9.6:
                    glow.append(m.copy().set_opacity(0.25 * (1 - (t - 8.9) / 0.7)))

        # --- spectrum (axis, floor bars, ticks) ---
        if 11.3 < t < 15.4:
            by = L["base_y"]
            ax = prog(t, 12.2, 0.9)
            xa0 = self.bin_x(1) - 40
            xa1 = self.bin_x(NBINS) + 40
            fo = 1 - smooth((t - 15.0) / 0.5) * 0  # keep until morph
            if ax > 0:
                ln = Line(P(xa0, by + 14), P(lerp(xa0, xa1, ease(ax)), by + 14))
                ln.set_stroke("#3A3A42", sw(3), 1 - smooth((t - 14.9) / 0.4))
                add(ln)
            for k in range(1, NBINS + 1):
                if k in NS: continue
                a = ease((t - 12.7 - 0.035 * k) / 0.5)
                if a <= 0: continue
                h = FLOOR[k] * L["maxh"] * a
                bx = self.bin_x(k)
                bw = L["bar_w"]
                ln = Line(P(bx, by - bw / 2), P(bx, by - max(h, bw / 2)))
                ln.set_stroke("#4A4A53", sw(bw), 1 - smooth((t - 14.95) / 0.1)).set_cap_style(CapStyleType.ROUND)
                add(ln)
            for i, m in enumerate(self.ticks):
                mm = self.fade(m, t, 13.4 + 0.08 * i, 15.0)
                if mm is not None: add(mm)
            mm = self.fade(self.freqcap, t, 13.6, 15.0)
            if mm is not None: add(mm)
        # --- stage 5: spectrum bars -> spectrogram -> model ---
        if t >= 14.9:
            x0, y0, x1, y1 = L["spec_card"]
            ca = smooth((t - 14.9) / 0.5)
            card = RoundedRectangle(width=(x1 - x0) / UNIT, height=(y1 - y0) / UNIT, corner_radius=16 / UNIT)
            card.move_to(P((x0 + x1) / 2, (y0 + y1) / 2)).set_fill(CARD, ca).set_stroke("#2A2A30", sw(2), ca)
            add(card)
            by = L["base_y"]
            cw, ch = L["cell"]
            # column 0: morph of the bars
            for r in range(NBINS):
                k = r + 1
                val = self.vals[0, r]
                h = max(val * L["maxh"], L["bar_w"])
                bx = self.bin_x(k)
                bw = L["bar_w"]
                tint = COL[NS.index(k)] if k in NS else "#4A4A53"
                a = ease((t - 15.0 - 0.012 * r) / 0.85)
                sx, sy, w_, h_ = self.cellrect(0, r)
                cxy = lerp(bx, sx + w_ / 2, a), lerp(by - h / 2, sy + h_ / 2, a)
                wi, hi_ = lerp(bw, w_ - 1.5, a), lerp(h, h_ - 1.5, a)
                rc = Rectangle(width=wi / UNIT, height=hi_ / UNIT).move_to(P(*cxy))
                colr = interpolate_color(ManimColor(tint), ManimColor(heat(val ** 0.8)), smooth((a - 0.35) / 0.65))
                rc.set_fill(colr, 1).set_stroke(width=0)
                add(rc)
            # columns sweep in
            for c in range(1, self.ncol):
                a = smooth((t - 15.9 - 0.026 * c) / 0.25)
                if a <= 0: continue
                cell_col = []
                for r in range(NBINS):
                    cl = self.cells[(c, r)].copy().set_fill(opacity=a)
                    cell_col.append(cl)
                mobs.extend(cell_col)
            mm = self.fade(self.speccap, t, 16.3, None)
            if mm is not None: add(mm)
            # arrow
            pa = prog(t, 16.3, 0.55)
            if pa > 0:
                (ax0, ay0), (ax1, ay1) = L["arrow"]
                ex, ey = lerp(ax0, ax1, ease(pa)), lerp(ay0, ay1, ease(pa))
                ar = Arrow(P(ax0, ay0), P(ex, ey), buff=0, stroke_width=sw(6), color=ORANGE,
                           max_tip_length_to_length_ratio=0.5, tip_length=0.2, max_stroke_width_to_length_ratio=100)
                if pa > 0.1: add(ar)
            # model card
            mx0, my0, mx1, my1 = L["model_card"]
            mo = smooth((t - 16.6) / 0.6)
            if mo > 0:
                mc = RoundedRectangle(width=(mx1 - mx0) / UNIT, height=(my1 - my0) / UNIT, corner_radius=16 / UNIT)
                mc.move_to(P((mx0 + mx1) / 2, (my0 + my1) / 2)).set_fill(CARD, mo).set_stroke("#2A2A30", sw(2), mo)
                mc.scale(0.96 + 0.04 * mo)
                add(mc)
                # edges
                for li, a_, b_ in self.edges:
                    e = Line(P(*a_), P(*b_)).set_stroke("#3A3A42", sw(2), mo)
                    add(e)
                # layer activations sweep 17.1 -> 17.9
                tt = min(t, 18.0)
                for li, layer in enumerate(self.nodes):
                    act = smooth((tt - 16.9 - 0.25 * li) / 0.3)
                    for (nx, ny) in layer:
                        fillc = interpolate_color(ManimColor(CARD), ManimColor(ORANGE), act)
                        d = Circle(radius=14 / UNIT).move_to(P(nx, ny)).set_fill(fillc, mo)
                        d.set_stroke(interpolate_color(ManimColor("#5A5A63"), ManimColor(ORANGE), act), sw(3), mo)
                        add(d)
                        if act > 0.05: glow.append(d.copy().set_fill(ORANGE, 0.8 * act).set_stroke(ORANGE, sw(3), act))
                # traveling pulse dots
                if 16.8 < t < 18.0:
                    for li in range(3):
                        pa2 = prog(t, 16.9 + 0.25 * li, 0.5)
                        if 0 < pa2 < 1:
                            for _, a_, b_ in [e for e in self.edges if e[0] == li][::2]:
                                px_ = lerp(a_[0], b_[0], pa2); py_ = lerp(a_[1], b_[1], pa2)
                                dd = Dot(P(px_, py_), radius=4.5 / UNIT, color="#FFB08F")
                                add(dd); glow.append(dd.copy())
                if L["model_cap"]:
                    mm = self.fade(self.modelcap, t, 16.9, None)
                    if mm is not None: add(mm)
                else:
                    pass
        return mobs, glow


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["stills", "render"])
    ap.add_argument("--variant", default="wide")
    ap.add_argument("--times", type=float, nargs="*", default=[1.5, 2.8, 4.0, 7.6, 9.6, 12.0, 13.8, 15.5, 16.8, 18.0])
    ap.add_argument("--out", default="out")
    a = ap.parse_args()
    v = Voice(a.variant)
    if a.cmd == "stills":
        stills(v.S, v.frame, a.times, a.out, prefix=a.variant)
    else:
        name = "p2_voice_fourier_1080p.mp4" if a.variant == "wide" else "p2_voice_fourier_vertical_1080x1350.mp4"
        encode(v.S, v.frame, DUR, HOLD, Path(a.out) / name, name)


if __name__ == "__main__":
    main()
