"""p3_microwave: branch-line coupler drawn on, 4x4 S-matrix, |S21| vs f plot."""
import numpy as np
from engine import *

DUR, HOLD = 9.0, 1.0
PCB, PCB_EDGE, VIA = "#0B1D17", "#1F4034", "#17382C"
CX, CY = 960, 560  # coupler centre before shift
HALF = 140
WIDE, NARROW, STUB = 26, 18, 130


def seg_list():
    L, R, T, B = CX - HALF, CX + HALF, CY - HALF, CY + HALF
    return [  # (p0, p1, width)
        ((L - STUB, T), (L, T), 22),
        ((L, T), (R, T), WIDE),
        ((R, T), (R + STUB, T), 22),
        ((R, T), (R, B), NARROW),
        ((R, B), (R + STUB, B), 22),
        ((R, B), (L, B), WIDE),
        ((L, B), (L - STUB, B), 22),
        ((L, B), (L, T), NARROW),
    ]


class Micro:
    def __init__(self):
        self.S = S = Stage(1920, 1080)
        self.segs = seg_list()
        self.lens = [np.hypot(b[0] - a[0], b[1] - a[1]) for a, b, _ in self.segs]
        self.total = sum(self.lens)
        L, R, T, B = CX - HALF, CX + HALF, CY - HALF, CY + HALF
        self.ports = {1: (L - STUB, T), 2: (R + STUB, T), 3: (R + STUB, B), 4: (L - STUB, B)}
        self.portlab = {1: (L - STUB - 8, T - 62), 2: (R + STUB + 8, T - 62),
                        3: (R + STUB + 8, B + 62), 4: (L - STUB - 8, B + 62)}
        self.title = S.text("Microwave circuit design", 52, weight=EXTRABOLD).move_to(S.P(960, 130))
        self.pl = {k: S.text(str(k), 46, weight=SEMIBOLD) for k in (1, 2, 3, 4)}
        # matrix
        mp = 40
        self.mp = mp
        self.entries = {}
        for i in range(1, 5):
            for j in range(1, 5):
                hi = (j == 1 and i in (2, 3))
                self.entries[(i, j)] = S.math(f"<i>S</i><sub>{i}{j}</sub>", mp + (4 if hi else 0),
                                              ORANGE if hi else TEXT)
        self.matlab = S.math("[<i>S</i>] =", 56)
        # plot
        self.ylab = S.math("|<i>S</i><sub>21</sub>| (dB)", 46)
        self.xlab = S.text("frequency", 40, color=MUTED, weight=MEDIUM)
        self.f0 = S.math("<i>f</i><sub>0</sub>", 56, ORANGE)
        self.db3 = S.text("−3 dB", 40, color=MUTED, weight=MEDIUM, font="JetBrains Mono")

    # ---- coupler transform
    def xf(self, t):
        a = smooth((t - 4.0) / 0.9)
        b = smooth((t - 7.0) / 0.8)
        s = lerp(1.0, 0.82, a)
        s = lerp(s, 0.74, b)
        cx = lerp(960, 520, a)
        cx = lerp(cx, 470, b)
        cy = lerp(560, 560, a)
        cy = lerp(cy, 590, b)
        return s, cx, cy

    def frame(self, t):
        S = self.S
        P = S.P
        mobs, glow = [], []
        add = mobs.append
        s, cx, cy = self.xf(t)
        X = lambda x, y: (cx + (x - CX) * s, cy + (y - CY) * s)
        # title
        m = self.pop(self.title, t, 0.3)
        if m is not None: add(m)
        # board
        bo = smooth((t - 0.0) / 0.6)
        bw, bh = 780, 640
        card = RoundedRectangle(width=bw * s / UNIT, height=bh * s / UNIT, corner_radius=18 * s / UNIT)
        card.move_to(P(cx, cy)).set_fill(PCB, bo).set_stroke(PCB_EDGE, sw(3), bo)
        add(card)
        # via dots
        if bo > 0.5:
            for gx in range(-360, 361, 40):
                for gy in range(-290, 291, 40):
                    d = Dot(P(cx + gx * s, cy + gy * s), radius=2.2 * s / UNIT, color=VIA)
                    d.set_opacity(bo)
                    add(d)
        # trace draw-on
        prog_ = ease_io(clamp((t - 0.5) / 2.9))
        drawn = prog_ * self.total
        acc = 0.0
        head = None
        for (a, b, w), ln in zip(self.segs, self.lens):
            if drawn <= acc: break
            f = clamp((drawn - acc) / ln)
            p1 = (lerp(a[0], b[0], f), lerp(a[1], b[1], f))
            A, Bp = X(*a), X(*p1)
            line = Line(P(*A), P(*Bp)).set_stroke(ORANGE, sw(w * s), 1).set_cap_style(CapStyleType.SQUARE)
            add(line)
            glow.append(line.copy().set_stroke(ORANGE, sw(w * s), 0.5 if prog_ < 1 else 0.28))
            head = Bp
            acc += ln
        if head is not None and prog_ < 1:
            d = Dot(P(*head), radius=11 * s / UNIT, color="#FFD2BC")
            add(d); glow.append(d.copy())
        # port pads + labels
        for k in (1, 2, 3, 4):
            a = ease((t - (2.2 + 0.25 * k)) / 0.5)
            if a <= 0: continue
            px, py = X(*self.ports[k])
            pad = Circle(radius=17 * s / UNIT).move_to(P(px, py)).set_fill(ORANGE, a).set_stroke(width=0)
            add(pad)
            lx, ly = X(*self.portlab[k])
            ring = Circle(radius=34 * s / UNIT).move_to(P(lx, ly)).set_fill(PCB, a).set_stroke(MUTED, sw(2.5), a)
            add(ring)
            num = self.pl[k].copy().scale(s * (0.9 + 0.1 * a)).move_to(P(lx, ly)).set_opacity(a)
            add(num)
        # ---- S matrix (4.2 -> )
        mc = 1.0
        mx_c = 1405
        my_c = 575
        b2 = smooth((t - 7.0) / 0.8)
        ms = lerp(1.0, 0.8, b2)
        myc = lerp(my_c, 365, b2)
        mxc = lerp(mx_c, 1400, b2)
        pitch_x, pitch_y = 150, 92
        mo = smooth((t - 4.4) / 0.6)
        if mo > 0:
            def MP(x, y):  # matrix-local (0,0 centre) -> screen
                return P(mxc + x * ms, myc + y * ms)
            gw = 3 * pitch_x + 120
            gh = 3 * pitch_y + 70
            # brackets
            for sgn in (-1, 1):
                xx = sgn * (gw / 2 + 14)
                p = ease((t - 4.4) / 0.7)
                pts = [(xx - sgn * -22 * -1 * 0 + (-sgn * 22), -gh / 2 * p), (xx, -gh / 2 * p), (xx, gh / 2 * p), (xx - sgn * 22, gh / 2 * p)]
                br = VMobject().set_points_as_corners([MP(*q) for q in pts])
                br.set_stroke(TEXT, sw(4.5 * ms), 1).set_fill(opacity=0)
                add(br)
            lab = self.matlab.copy().scale(ms).move_to(MP(-gw / 2 - 150, 0)).set_opacity(mo)
            add(lab)
            for i in range(1, 5):
                for j in range(1, 5):
                    ti = 4.8 + 0.045 * ((i - 1) * 4 + (j - 1))
                    a = ease((t - ti) / 0.35)
                    if a <= 0: continue
                    ex = (j - 2.5) * pitch_x
                    ey = (i - 2.5) * pitch_y
                    hi = (j == 1 and i in (2, 3))
                    h = smooth((t - 5.5 - (0.25 if i == 3 else 0)) / 0.4) if hi else 0
                    if h > 0:
                        pill = RoundedRectangle(width=128 * ms / UNIT, height=70 * ms / UNIT, corner_radius=14 * ms / UNIT)
                        pill.move_to(MP(ex, ey)).set_fill(ORANGE, 0.20 * h).set_stroke(ORANGE, sw(2.5 * ms), 0.9 * h)
                        add(pill); glow.append(pill.copy().set_fill(ORANGE, 0.08 * h).set_stroke(ORANGE, sw(2.5 * ms), 0.5 * h))
                    e = self.entries[(i, j)].copy()
                    if not hi: e.set_opacity(0.92)
                    e.scale(ms * (0.92 + 0.08 * a)).move_to(MP(ex, ey)).set_opacity(a * (1 if hi else 0.9))
                    add(e)
        # ---- pulses on coupler 1->2, 1->3 (5.6 .. 7.0)
        if 5.5 < t < 7.3:
            L, R, T, B = CX - HALF, CX + HALF, CY - HALF, CY + HALF
            p12 = [(L - STUB, T), (L, T), (R, T), (R + STUB, T)]
            p13a = [(L - STUB, T), (L, T), (R, T), (R, B), (R + STUB, B)]
            p13b = [(L - STUB, T), (L, T), (L, B), (R, B), (R + STUB, B)]
            for path, delay in [(p12, 0.0), (p13a, 0.25), (p13b, 0.25)]:
                f = (t - 5.6 - delay) / 1.3
                if 0 < f < 1:
                    for tr in range(4):
                        ff = clamp(f - tr * 0.025)
                        pt = path_pt(path, ease_io(ff))
                        d = Dot(P(*X(*pt)), radius=(10 - tr * 2) * s / UNIT, color="#FFD2BC")
                        d.set_opacity(0.95 - tr * 0.22) 
                        add(d); glow.append(d.copy())
            for k, tk in ((2, 6.45), (3, 6.9)):
                a = prog(t, tk, 0.6)
                if 0 < a < 1:
                    px, py = X(*self.ports[k])
                    rg = Circle(radius=(20 + 50 * a) * s / UNIT).move_to(P(px, py)).set_stroke(ORANGE, sw(4), 1 - a).set_fill(opacity=0)
                    add(rg); glow.append(rg.copy())
        # ---- plot (7.2 ->)
        po = smooth((t - 7.1) / 0.6)
        if po > 0:
            x0, y0, x1, y1 = 1000, 590, 1800, 985
            c = RoundedRectangle(width=(x1 - x0) / UNIT, height=(y1 - y0) / UNIT, corner_radius=16 / UNIT)
            c.move_to(P((x0 + x1) / 2, (y0 + y1) / 2)).set_fill(CARD, po).set_stroke(BORDER, sw(2), po)
            add(c)
            ax0, ax1, ay0, ay1 = 1085, 1750, 665, 880  # plot area
            ya = Line(P(ax0, ay0 - 20), P(ax0, ay1)).set_stroke("#4A4A53", sw(3), po)
            xa = Line(P(ax0, ay1), P(ax1, ay1)).set_stroke("#4A4A53", sw(3), po)
            add(ya); add(xa)
            m = self.pop(self.ylab, t, 7.2, pos=(ax0 + 135, y0 + 50))
            if m is not None: add(m)
            m = self.pop(self.xlab, t, 7.3, pos=(ax1 - 85, y1 - 35))
            if m is not None: add(m)
            # curve
            n = 160
            fs = np.linspace(0.6, 1.4, n)
            db = -3 - 10 * np.log10(1 + ((fs - 1) / 0.16) ** 2)
            xs = ax0 + 25 + (fs - 0.6) / 0.8 * (ax1 - ax0 - 50)
            ys = ay0 + (-db / 17.0) * (ay1 - ay0 - 25)
            pc = ease_io(clamp((t - 7.6) / 1.2))
            k = int(n * pc)
            if k > 2:
                cv = VMobject().set_points_as_corners([P(x, y) for x, y in zip(xs[:k], ys[:k])])
                cv.set_stroke(ORANGE, sw(6), 1).set_fill(opacity=0).set_cap_style(CapStyleType.ROUND)
                add(cv); glow.append(cv.copy())
                d = Dot(P(xs[k - 1], ys[k - 1]), radius=9 / UNIT, color="#FFD2BC")
                add(d); glow.append(d.copy())
            # f0 marker
            fo = smooth((t - 8.6) / 0.4)
            if fo > 0:
                x_pk, y_pk = xs[n // 2 - 1] if False else (ax0 + 25 + 0.5 * (ax1 - ax0 - 50)), ay0 + (3 / 17.0) * (ay1 - ay0 - 25)
                dl = DashedLine(P(x_pk, y_pk + 12), P(x_pk, ay1), dash_length=10 / UNIT, dashed_ratio=0.55)
                dl.set_stroke(ORANGE, sw(3), fo)
                add(dl)
                pk = Dot(P(x_pk, y_pk), radius=12 / UNIT, color=ORANGE).set_opacity(fo)
                add(pk); glow.append(pk.copy())
                fm = self.f0.copy().scale(0.92 + 0.08 * fo).move_to(P(x_pk, ay1 + 48)).set_opacity(fo)
                add(fm)
                dm = self.db3.copy().move_to(P(x_pk + 130, y_pk - 6)).set_opacity(fo)
                add(dm)
        return mobs, glow

    def pop(self, m, t, t0, pos=None):
        o = smooth((t - t0) / 0.4)
        if o <= 0.003: return None
        c = m.copy().scale(0.92 + 0.08 * ease((t - t0) / 0.4))
        if pos is not None: c.move_to(self.S.P(*pos))
        return c.set_opacity(o)


def ease_io(x):
    return smooth(x)


def path_pt(pts, f):
    ls = [np.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:])]
    d = f * sum(ls)
    for (a, b), l in zip(zip(pts, pts[1:]), ls):
        if d <= l:
            r = d / l
            return (lerp(a[0], b[0], r), lerp(a[1], b[1], r))
        d -= l
    return pts[-1]


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["stills", "render"])
    ap.add_argument("--times", type=float, nargs="*", default=[0.4, 1.8, 3.4, 4.7, 6.0, 6.8, 8.0, 9.0])
    ap.add_argument("--out", default="out")
    a = ap.parse_args()
    v = Micro()
    if a.cmd == "stills":
        stills(v.S, v.frame, a.times, a.out)
    else:
        encode(v.S, v.frame, DUR, HOLD, Path(a.out) / "p3_microwave_1080p.mp4", "p3")


if __name__ == "__main__":
    main()
