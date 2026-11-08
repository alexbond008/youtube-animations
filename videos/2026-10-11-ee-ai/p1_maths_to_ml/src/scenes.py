from common import *

clip01 = lambda x: min(1.0, max(0.0, x))
EQ = '<i>y</i> = <span foreground="%s"><i>m</i></span><i>x</i> + <span foreground="%s"><i>c</i></span>' % (BLUE, GREEN)


def make_eq(px, color=TXT):
    return MT(EQ, px, color=color)


class LinReg(Scene):
    def construct(self):
        self.add(background())
        rng = np.random.default_rng(7)
        mt, ct = 0.8, 1.2
        xs = np.sort(rng.uniform(0.7, 9.3, 14))
        ys = mt * xs + ct + rng.normal(0, 0.75, 14)
        # real gradient descent (centred x so it converges smoothly)
        xm = xs.mean(); m, cc = -0.35, 6.2
        path = []
        for k in range(130):
            e = m * (xs - xm) + cc - ys
            path.append((m, cc - m * xm, float(np.mean(e ** 2))))
            m -= 0.012 * 2 * np.mean(e * (xs - xm)); cc -= 0.012 * 2 * np.mean(e)
        path = np.array(path)
        def P(idx):
            i = int(idx); j = min(i + 1, len(path) - 1); f = idx - i
            return path[i] * (1 - f) + path[j] * f
        l0 = path[0, 2]

        # ---------- 0-2.5 : equation
        eq = make_eq(190); eq.set_z_index(5)
        self.play(Write(eq, run_time=1.5, lag_ratio=0.25))
        sl = T("slope", 52, BLUE); ic = T("intercept", 52, GREEN)
        # annotate m and c (m is char index 4, c is last)
        mch = eq[0][4] if len(eq[0]) > 4 else eq[0]
        cch = eq[0][-1]
        wq = eq.width
        sl.move_to([eq.get_left()[0] + 0.45 * wq, eq.get_bottom()[1] - 0.6, 0])
        ic.move_to([eq.get_right()[0] - 0.12 * wq, eq.get_bottom()[1] - 1.25, 0])
        ic.shift(LEFT * max(0, ic.get_right()[0] - (W / 2 - 0.5)))
        self.add(eq)
        self.play(FadeIn(sl, shift=UP * 0.15), FadeIn(ic, shift=UP * 0.15), run_time=0.5, rate_func=ease_out)
        self.wait(0.5)

        # ---------- layout
        if VERT:
            xl, yl = 6.5, 4.6
            plot_c = [0.0, -1.5, 0]
            panel = card(7.2, 2.3).move_to([0, 3.35, 0])
            eq_t = [0, 3.9, 0]; eq_px = 84
            rd_pos = lambda g: g.move_to([1.55, 3.55, 0])
            rd_px = 48
        else:
            xl, yl = 6.8, 5.6
            plot_c = [2.5, -0.1, 0]
            panel = card(3.6, 5.8).move_to([-4.6, -0.1, 0])
            eq_t = [-4.6, 1.75, 0]; eq_px = 88
            rd_px = 52
        ax = Axes(x_range=[0, 10, 2], y_range=[0, 9, 3], x_length=xl, y_length=yl, tips=False,
                  axis_config={"color": TXT2, "stroke_width": 3, "include_ticks": True, "tick_size": 0.07,
                               "include_numbers": False}).move_to(plot_c)
        axcard = card(xl + 0.7, yl + 0.7).move_to(ax.get_center())
        for l in ax.get_x_axis().ticks: pass
        dots = VGroup(*[Dot(ax.c2p(x, y), radius=0.1, color=TXT) for x, y in zip(xs, ys)])
        tm = ValueTracker(0)
        def clipline(mm, c0):
            # clip y=mm*x+c0 to the axes box
            pts = []
            for xe in (0, 10):
                pts.append((xe, mm * xe + c0))
            (xa, ya), (xb, yb) = pts
            def cl(xa, ya, xb, yb):
                if ya < 0 or ya > 9:
                    yt = 0 if ya < 0 else 9
                    if abs(yb - ya) > 1e-9: xa = xa + (yt - ya) * (xb - xa) / (yb - ya); ya = yt
                return xa, ya
            xa, ya = cl(xa, ya, xb, yb); xb, yb = cl(xb, yb, xa, ya)
            return xa, ya, xb, yb
        def fit_line():
            mm, c0, _ = P(tm.get_value())
            xa, ya, xb, yb = clipline(mm, c0)
            ln = Line(ax.c2p(xa, ya), ax.c2p(xb, yb), color=ORANGE, stroke_width=8)
            return ln
        def resid():
            mm, c0, _ = P(tm.get_value())
            g = VGroup()
            for x, y in zip(xs, ys):
                yp = mm * x + c0
                yp = min(9, max(0, yp)); yy = min(9, max(0, y))
                g.add(Line(ax.c2p(x, y), ax.c2p(x, yp), color=RED, stroke_width=2.5, stroke_opacity=0.55))
            return g
        line = always_redraw(fit_line); res = always_redraw(resid)
        def readout():
            mm, c0, L = P(tm.get_value())
            col = interpolate_color(ManimColor(GREEN), ManimColor(RED), clip01(L / l0) ** 0.5)
            g = VGroup(T(f"m = {mm:5.2f}", rd_px, BLUE, font=MONO, weight=BOLD),
                       T(f"c = {c0:5.2f}", rd_px, GREEN, font=MONO, weight=BOLD),
                       T(f"loss {L:5.2f}", rd_px, col, font=MONO, weight=BOLD))
            if VERT:
                g = VGroup(T(f"m {mm:.2f}", rd_px, BLUE, font=MONO), T(f"c {c0:.2f}", rd_px, GREEN, font=MONO),
                           T(f"loss {L:.2f}", rd_px, col, font=MONO)).arrange(RIGHT, buff=0.4).move_to([0, 2.85, 0])
            else:
                g.arrange(DOWN, aligned_edge=LEFT, buff=0.3).move_to([-4.6, -0.55, 0])
            return g
        rd = always_redraw(readout)
        # ---------- 2.5-3.3 : equation to panel, plot appears
        self.play(FadeOut(sl, run_time=0.25), FadeOut(ic, run_time=0.25),
                  FadeIn(panel, run_time=0.6), FadeIn(axcard, run_time=0.6),
                  eq.animate.scale(eq_px / 190).move_to(eq_t), run_time=0.6, rate_func=ease_out)
        self.play(Create(ax, run_time=0.5), LaggedStart(*[FadeIn(d, scale=0.3) for d in dots], lag_ratio=0.04, run_time=0.6))
        # ---------- fit (about 3.7 -> 5.5)
        self.add(res, line, rd, dots)
        self.play(tm.animate.set_value(len(path) - 1), run_time=1.8, rate_func=lambda t: 1 - (1 - t) ** 2.2)
        self.remove(line, res, rd)
        mm, c0, L = path[-1]
        xa, ya, xb, yb = clipline(mm, c0)
        # freeze final state as plain mobjects
        fl = Line(ax.c2p(xa, ya), ax.c2p(xb, yb), color=ORANGE, stroke_width=8)
        fr = resid(); frd = readout()
        self.add(fr, fl, frd)
        # ---------- 5.5-8.0 : label morph -> neuron
        big = T("Linear regression", 96 if not VERT else 84, ORANGE)
        big.move_to([0, 2.45, 0] if not VERT else [0, 3.6, 0])
        old = VGroup(panel, ax, axcard, dots, fl, fr, frd)
        self.play(FadeOut(old, run_time=0.4),
                  eq.animate.scale(1.9).move_to([0, 0.2, 0] if not VERT else [0, 1.0, 0]), run_time=0.4, rate_func=ease_out)
        self.play(ReplacementTransform(eq, big), run_time=0.5, rate_func=ease_out)
        # neuron
        cx = 0
        gy = -0.55 if not VERT else -0.2
        sp = 1.15 if not VERT else 1.3
        xin = -3.3 if not VERT else -2.6
        xo = 3.5 if not VERT else 2.7
        ins = VGroup(*[VGroup(Circle(0.42, color=TXT2, stroke_width=3, fill_color=CARD, fill_opacity=1),
                              MT("<i>x</i>" + "₁₂₃"[k], 52 if not VERT else 52)) for k in range(3)])
        for k, g in enumerate(ins):
            g[1].move_to(g[0]); g.move_to([xin, gy + (1 - k) * sp, 0])
        sig = VGroup(Circle(0.85 if not VERT else 0.75, color=ORANGE, stroke_width=5, fill_color=CARD, fill_opacity=1),
                     MT("Σ", 100, ORANGE)).move_to([cx, gy, 0]); sig[1].move_to(sig[0])
        out = VGroup(Circle(0.5, color=TXT2, stroke_width=3, fill_color=CARD, fill_opacity=1),
                     MT("ŷ", 60, TXT)).move_to([xo, gy, 0]); out[1].move_to(out[0])
        edges = VGroup(*[Line(g[0].get_right(), sig[0].point_at_angle(PI + (1 - k) * 0.55 * -1 if False else PI + (k - 1) * 0.45),
                              color=TXT2, stroke_width=4) for k, g in enumerate(ins)])
        oe = Arrow(sig[0].get_right(), out[0].get_left(), buff=0.0, color=TXT2, stroke_width=5,
                   max_tip_length_to_length_ratio=0.3)
        cp = 62 if not VERT else 54
        cap = VGroup(T("the simplest", cp, TXT), T("AI", cp, ORANGE), T("model", cp, TXT)).arrange(RIGHT, buff=0.22, aligned_edge=DOWN)
        cap.move_to([0, gy - 2.45 if not VERT else gy - 2.9, 0])
        self.play(LaggedStart(*[FadeIn(g, scale=0.85) for g in ins], lag_ratio=0.15),
                  *[Create(e) for e in edges], FadeIn(sig, scale=0.85), Create(oe), FadeIn(out, scale=0.85),
                  run_time=0.6)
        # signal pulses 
        pulses = VGroup(*[Dot(radius=0.09, color=ORANGE).move_to(e.get_start()) for e in edges])
        self.add(pulses)
        self.play(*[MoveAlongPath(p, e) for p, e in zip(pulses, edges)], FadeIn(cap, shift=UP * 0.15),
                  run_time=0.5, rate_func=ease_out)
        self.remove(pulses)
        self.play(Flash(sig[0], color=ORANGE, flash_radius=1.2, line_length=0.25, num_lines=10, run_time=0.35))
        self.wait(1.0)
        self.wait(1.0)  # static hold


# ----------------------------------------------------------------- shot B
def bitmap(n):
    if n == 12:
        rows = ["000000000000", "011111111110", "011111111110", "000000001100", "000000011000",
                "000000110000", "000001100000", "000011000000", "000110000000", "000110000000",
                "000110000000", "000000000000"]
    else:
        rows = ["00000000", "01111110", "00000110", "00001100", "00011000", "00110000", "00110000", "00000000"]
    return np.array([[int(c) for c in r] for r in rows])


class MatrixCNN(Scene):
    def construct(self):
        self.add(background())
        n = 8 if VERT else 12
        img = bitmap(n)
        ker = np.array([[1, 1, 1], [0, 0, 0], [-1, -1, -1]])
        no = n - 2
        feat = np.zeros((no, no), int)
        for i in range(no):
            for j in range(no):
                feat[i, j] = max(0, int((img[i:i + 3, j:j + 3] * ker).sum()))
        cs = 0.42 if VERT else 0.4
        npx = 48 if VERT else 40
        if VERT:
            ic = np.array([-1.95, 1.8, 0]); fc = np.array([1.95, 1.8, 0]); fcs = cs
            lab_y = 1.8 + n * cs / 2 + 0.5
        else:
            ic = np.array([-4.0, 0.55, 0]); fc = np.array([4.0, 0.55, 0]); fcs = cs
            lab_y = 0.55 + n * cs / 2 + 0.5
        def grid(center, k, size, vals, fmt_orange=False):
            cells = VGroup(); nums = VGroup()
            for i in range(k):
                for j in range(k):
                    pos = center + np.array([(j - (k - 1) / 2) * size, ((k - 1) / 2 - i) * size, 0])
                    sq = Square(size * 0.92, stroke_width=0, fill_opacity=1, fill_color=CARD).move_to(pos)
                    cells.add(sq)
                    nums.add(T(str(vals[i, j]), npx, TXT2, font=MONO, weight=BOLD).move_to(pos))
            return cells, nums
        icells, inums = grid(ic, n, cs, img)
        fcells, fnums = grid(fc, no, fcs, feat)
        # ink colouring
        def ink(c, nm, on):
            c.set_fill(TXT if on else CARD, 1)
            nm.set_color("#0E0E10" if on else "#5a5a63")
        for idx in range(n * n):
            ink(icells[idx], inums[idx], img.flat[idx] == 1)
        for idx in range(no * no):
            v = feat.flat[idx]
            fcells[idx].set_fill(interpolate_color(ManimColor(CARD), ManimColor(ORANGE), v / 3.0) if v else CARD, 1)
            fnums[idx].set_color("#0E0E10" if v >= 2 else (ORANGE if v else "#5a5a63"))
        # brackets
        def brackets(center, k, size, color):
            h = k * size / 2 + 0.06; w = k * size / 2 + 0.17
            L = VGroup(Line([-w + .13, h, 0], [-w, h, 0]), Line([-w, h, 0], [-w, -h, 0]), Line([-w, -h, 0], [-w + .13, -h, 0]))
            R = L.copy().flip(RIGHT)
            L.shift(center); R.shift(center)
            return VGroup(L, R).set_color(color).set_stroke(width=5)
        ibr = brackets(ic, n, cs, TXT2); fbr = brackets(fc, no, fcs, ORANGE)
        ilab = T("image", 52 if not VERT else 48, TXT2).move_to([ic[0], lab_y, 0])
        flab = T("feature map", 52 if not VERT else 48, ORANGE).move_to([fc[0], lab_y, 0])
        inums.set_opacity(0)
        # ---------- 0-2.5 : pixel image -> matrix
        # pixel art first (cells only, numbers hidden)
        self.play(FadeIn(ilab, run_time=0.4),
                  LaggedStart(*[FadeIn(c, scale=0.6) for c in icells], lag_ratio=0.008, run_time=1.0))
        self.wait(0.1)
        self.play(inums.animate.set_opacity(1), FadeIn(ibr), run_time=0.7, rate_func=ease_out)
        self.wait(0.2)
        # ---------- 2.5-6.5 : kernel slides
        pad = 0.035
        win = Square(3 * cs + pad * 0, stroke_color=ORANGE, stroke_width=7, fill_color=ORANGE, fill_opacity=0.12)
        # kernel card
        if VERT:
            kc_pos = np.array([0, -2.15, 0]); ks = 0.62
        else:
            kc_pos = np.array([0, 0.3, 0]); ks = 0.62
        kcard = card(3 * ks + 0.5, 3 * ks + 0.5).move_to(kc_pos)
        knums = VGroup()
        for i in range(3):
            for j in range(3):
                v = ker[i, j]
                knums.add(T(str(v), 48, ORANGE if v else TXT2, font=MONO).move_to(kc_pos + np.array([(j - 1) * ks, (1 - i) * ks, 0])))
        kclab = T("3×3 kernel", 48, TXT2).next_to(kcard, UP, buff=0.2)
        total = no * no
        pr = ValueTracker(0)
        def f_alpha(a):
            t = a * 4.0
            v = (3 * t / 1.4) if t < 1.4 else 3 + (total - 3) * (t - 1.4) / 2.6
            return min(1.0, v / total)
        def wpos():
            p = min(pr.get_value(), total - 1e-3)
            r = int(p // no); cx = p - r * no
            return ic + np.array([(cx + 1 - (n - 1) / 2) * cs, ((n - 1) / 2 - (r + 1)) * cs, 0])
        win.add_updater(lambda m: (m.move_to(wpos()), reveal(m)))
        def reveal(m):
            p = pr.get_value()
            for idx in range(total):
                on = idx < int(p)
                fcells[idx].set_opacity(1 if on else 0)
                fnums[idx].set_opacity(1 if on else 0)
        for c in fcells: c.set_opacity(0)
        for nm in fnums: nm.set_opacity(0)
        fcells.add_updater(lambda m, dt: None); fnums.add_updater(lambda m, dt: None)
        self.add(fcells, fnums)
        win.move_to(wpos())
        self.add(win)
        self.play(FadeIn(kcard), FadeIn(knums), FadeIn(kclab), FadeIn(flab), FadeIn(fbr), run_time=0.45)
        self.play(pr.animate.set_value(total), run_time=4.0, rate_func=f_alpha)
        win.clear_updaters()
        for c in fcells: c.set_opacity(1)
        for nm in fnums: nm.set_opacity(1)
        # ---------- 6.5 : label
        lab = VGroup(T("Convolutional", 70, ORANGE), T("neural network", 70, TXT)).arrange(RIGHT, buff=0.25)
        if VERT:
            lab = VGroup(T("Convolutional", 62, ORANGE), T("neural network", 62, TXT)).arrange(DOWN, buff=0.15)
            lab.move_to([0, -4.0, 0])
        else:
            lab.move_to([0, -3.2, 0])
        self.play(FadeIn(lab, shift=UP * 0.2, scale=0.94), FadeOut(win), run_time=0.5, rate_func=ease_out)
        self.wait(1.0)
        self.wait(1.0)  # hold
