from common import *

EE = ["Linear algebra", "Fourier transform", "Control theory", "Power systems"]
AI = ["Neural networks", "Voice AI", "Reinforcement learning", "Data centres"]


def wrapT(s, px, color=TXT):
    if not VERT:
        return T(s, px, color=color)
    return VGroup(*[T(w, px, color=color) for w in s.split(" ")]).arrange(DOWN, buff=0.12)


class Relabel(Scene):
    """Stacked EE terms -> each sweeps an orange underline and morphs into its AI name."""

    def construct(self):
        self.add(background())
        if VERT:
            cw, ch, gap, px, y0 = 6.9, 1.3, 0.3, 60, -0.35
        else:
            cw, ch, gap, px, y0 = 7.6, 1.05, 0.24, 64, -0.45
        ys = [y0 + (1.5 - i) * (ch + gap) for i in range(4)]
        cards, olds, news, cols = [], [], [], []
        for i in range(4):
            c = card(cw, ch).move_to(UP * ys[i])
            o = T(EE[i], px).move_to(c)
            n = T(AI[i], px, color=ORANGE).move_to(c)
            cards.append(c); olds.append(o); news.append(n)
        hdr_y = ys[0] + ch / 2 + 0.62
        pill_ee = T("EE", 50, TXT2).move_to(UP * hdr_y)
        pill_ai = T("AI", 50, ORANGE).move_to(UP * hdr_y)
        bar = Line(LEFT * 0.0, RIGHT * 0.0)
        # ---- 0-2.0 s : stacked terms appear
        anims = []
        for i in range(4):
            g = VGroup(cards[i], olds[i])
            anims.append(FadeIn(g, shift=UP * 0.18, scale=0.94, run_time=0.5, rate_func=ease_out))
        self.play(FadeIn(pill_ee, run_time=0.4),
                  AnimationGroup(*anims, lag_ratio=0.62), run_time=1.5)
        self.wait(0.5)
        # ---- 2.0-5.0 s : sweep + morph, one per ~0.65 s (single time-driven updater)
        uls = []
        for i in range(4):
            ul = Line(LEFT, RIGHT, color=ORANGE, stroke_width=7)
            uls.append(ul)
            news[i].set_opacity(0)
            self.add(news[i])
        base = [(olds[i].get_center().copy()) for i in range(4)]
        clip = lambda x: min(1.0, max(0.0, x))
        tr = ValueTracker(0)
        def upd(_):
            t = tr.get_value()
            for i in range(4):
                s0 = 0.65 * i
                a1 = ease_out(clip((t - s0) / 0.32))
                m = ease_out(clip((t - s0 - 0.32) / 0.45))
                f = clip((t - s0 - 0.77) / 0.25)
                tw = olds[i].width
                y = base[i][1] - 0.5 * ch + 0.2 if False else cards[i][-1].get_center()[1] - 0.2 * px / 64 - 0.17
                x0 = base[i][0] - tw / 2
                if a1 > 0 and f < 1:
                    uls[i].put_start_and_end_on([x0, y, 0], [x0 + tw * a1, y, 0])
                    uls[i].set_stroke(opacity=1 - f)
                else:
                    uls[i].put_start_and_end_on([x0, y, 0], [x0 + 0.001, y, 0]); uls[i].set_stroke(opacity=0)
                olds[i].move_to(base[i] + UP * 0.22 * m).set_opacity(1 - m)
                news[i].move_to(base[i] + DOWN * 0.22 * (1 - m)).set_opacity(m)
                card_body(cards[i]).set_stroke(interpolate_color(ManimColor(BORDER), ManimColor(ORANGE), 0.6 * m))
        drv = Mobject(); drv.add_updater(upd)
        self.add(drv, *uls)
        self.play(tr.animate.set_value(3 * 0.65 + 1.0), run_time=3 * 0.65 + 1.0, rate_func=linear)
        drv.remove_updater(upd)
        # ---- 5.0-7.0 s : header flips EE -> AI, gentle settle push-in
        allg = Group(*cards, *olds, *news)
        self.play(Transform(pill_ee, pill_ai, run_time=0.5),
                  allg.animate.scale(1.025).shift(UP * 0.0), run_time=2.0, rate_func=ease_out)
        # ---- clean 1 s hold
        self.wait(1.0)


class SideBySide(Scene):
    """EE (white) -> AI (orange) columns, both visible, with arrows."""

    def construct(self):
        self.add(background())
        if VERT:
            cw, ch, gap, px = 3.35, 1.55, 0.28, 48
            xl, xr = -2.0, 2.0
            y0 = -0.35
            lab = 50
        else:
            cw, ch, gap, px = 5.35, 1.05, 0.26, 52
            xl, xr = -3.9, 3.9
            y0 = -0.4
            lab = 50
        ys = [y0 + (1.5 - i) * (ch + gap) for i in range(4)]
        L, R, A = [], [], []
        for i in range(4):
            lc = card(cw, ch).move_to([xl, ys[i], 0])
            lt = wrapT(EE[i], px).move_to(lc)
            rc = card(cw, ch, fill="#1C1613", stroke=ORANGE).move_to([xr, ys[i], 0])
            card_body(rc).set_stroke(ORANGE, opacity=0.55)
            rt = wrapT(AI[i], px, ORANGE).move_to(rc)
            a = Arrow([xl + cw / 2 + 0.12, ys[i], 0], [xr - cw / 2 - 0.12, ys[i], 0], buff=0,
                      color=ORANGE, stroke_width=7, max_tip_length_to_length_ratio=0.35,
                      max_stroke_width_to_length_ratio=12)
            L.append(VGroup(lc, lt)); R.append(VGroup(rc, rt)); A.append(a)
        hy = ys[0] + ch / 2 + 0.62
        hee = T("EE", lab, TXT2).move_to([xl, hy, 0])
        hai = T("AI", lab, ORANGE).move_to([xr, hy, 0])
        # 0-1.8 left column
        self.play(FadeIn(hee, run_time=0.4),
                  AnimationGroup(*[FadeIn(g, shift=UP * 0.18, scale=0.94, run_time=0.5, rate_func=ease_out)
                                   for g in L], lag_ratio=0.6), run_time=1.8)
        # 1.8-5.3: arrow + AI card, one per 0.8 s
        seqs = []
        for i in range(4):
            seqs.append(Succession(
                Create(A[i], run_time=0.35, rate_func=ease_out),
                FadeIn(R[i], shift=RIGHT * 0.25, run_time=0.45, rate_func=ease_out)))
        self.play(FadeIn(hai, run_time=0.5), AnimationGroup(*seqs, lag_ratio=1.0),
                  run_time=3.5)
        # 5.3-7.0 settle
        allg = Group(*L, *R, *A, hee, hai)
        self.play(allg.animate.scale(1.02), run_time=1.7, rate_func=ease_out)
        self.wait(1.0)
