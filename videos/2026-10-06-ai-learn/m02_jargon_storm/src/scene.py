"""m02_jargon_storm: deep-learning jargon floods the frame, then everything falls
away except "training loop", which glows Claude orange, moves to centre, and a
3-line PyTorch-style loop types in underneath.

Timeline (s):
  0.00-5.50  ~130 terms spawn with escalating rate (spoken terms first, big + readable)
  5.50-6.15  everything else dims and falls away; "training loop" turns orange,
             glides to centre (5.55-6.20)
  6.18-6.51  code card enters
  6.50-8.63  3 lines type in (35 chars/s, block cursor #D97757)
  8.68-9.01  subtitle "the 20% I actually needed"
  9.01-10.01 clean static hold
"""
from __future__ import annotations

import numpy as np
from manim import VMobject, VGroup, Text, RoundedRectangle, Rectangle, MEDIUM, SEMIBOLD, NORMAL

from engine import (px, to_xy, fs, seg, ease_out_cubic, ease_in_cubic, ease_in_out_cubic,
                    tq, smootherstep, ease_spec, BG, CARD, CARD_BORDER, TEXT, TEXT2, ORANGE,
                    BLUE, GREEN, FPS, W, H, UNIT_PX)

NAME = "m02_jargon_storm"
DURATION_FRAMES = 300            # 10.01 s at 29.97 (9 s + 1 s hold)
VARIANTS = {"main": ""}

FAR = "#62626C"
POP = 10 / FPS                   # SPEC entrance: 10 frames
T_STORM = 5.5
T_FALL = 5.5
CENTER = np.array([0.0, 0.0])
ZMAX = 0.05

SPOKEN = ["forward pass", "activation functions", "softmax", "tanh", "ReLU", "inputs",
          "outputs", "matrices", "transformers", "neural networks", "graph neural networks",
          "backpropagation"]
BRIEF = ["attention", "message passing", "loss function", "gradients", "epochs", "dropout",
         "batch norm", "Adam", "learning rate", "embeddings"]
MORE = ["cross-entropy", "weight decay", "layer norm", "residual connections", "self-attention",
        "multi-head attention", "positional encoding", "tokenization", "sigmoid", "GELU",
        "convolutions", "pooling", "LSTM", "RNN", "vanishing gradients", "exploding gradients",
        "gradient clipping", "SGD", "momentum", "learning rate schedule", "warmup",
        "cosine decay", "overfitting", "regularization", "early stopping", "validation loss",
        "hyperparameters", "batch size", "mini-batches", "weight initialization", "chain rule",
        "Jacobian", "autograd", "computational graph", "tensors", "CUDA", "logits", "KV cache",
        "fine-tuning", "LoRA", "inference", "weights", "biases", "hidden layers", "MLP",
        "skip connections", "node features", "adjacency matrix", "aggregation", "GCN",
        "encoder", "decoder", "latent space", "optimizer", "loss landscape", "local minima",
        "saddle points", "bias–variance", "parameters", "perplexity", "beam search",
        "temperature", "normalization", "mixed precision", "data loaders", "train/test split",
        "∂L/∂w", "σ(Wx + b)"]
MONO = ["optimizer.zero_grad()", "torch.no_grad()", "nn.Linear(512, 512)", "x @ W + b",
        "softmax(QK^T/√d)"]

CODE = ["for epoch in range(n):",
        "    loss = model(x).loss",
        "    loss.backward(); opt.step()"]
KW, FN, ID, PU = BLUE, GREEN, TEXT, TEXT2
# per-character syntax classes (same length as each code line)
CODE_CLS = [
    "KKK_IIIII_KK_FFFFFPIPP",
    "____IIII_P_FFFFFPIPPIIII",
    "____IIIIPFFFFFFFFPPP_IIIPFFFFPP",
]
CLS_COL = {"K": KW, "F": FN, "I": ID, "P": PU}
TYPE_RATE = 35.0                 # chars / s (SPEC 28-35)
T_CARD = 6.18
T_TYPE = 6.50
LINE_PAUSE = 0.08
T_SUB = 8.68

TL_SPAWN = 2.55
TL_POS0 = (1300, 742)            # where "training loop" first appears (px)
TL_POS1 = (960, 316)             # hero position (px)
TL_EM0, TL_EM1 = 46, 100


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


class Word:
    def __init__(self, text, mono, tier, em, color, weight):
        font = "JetBrains Mono" if mono else "Inter"
        self.mob = Text(text, font=font, weight=weight, font_size=fs(em), color=color)
        c = self.mob.get_center()
        self.glyphs = [g for g in self.mob.family_members_with_points()]
        self.base = [g.points.copy() - c for g in self.glyphs]
        self.w_px = self.mob.width * UNIT_PX
        self.h_px = self.mob.height * UNIT_PX
        self.text, self.tier, self.em = text, tier, em
        self.rgb = hexrgb(color)

    def place(self, pos, scale, angle, alpha, rgb=None):
        ca, sa = np.cos(angle), np.sin(angle)
        R = np.array([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1.0]])
        for g, b in zip(self.glyphs, self.base):
            g.points = (b * scale) @ R.T + pos
            g.fill_rgbas[:, 3] = alpha
            if rgb is not None:
                g.fill_rgbas[:, :3] = rgb
        return self.mob


class Storm:
    bloom = [(5, 0.6), (20, 0.6)]
    motion_blur = 4          # sub-frames per frame (180-degree shutter)

    def __init__(self, variant):
        rng = np.random.default_rng(20261004)
        # ------------------------------------------------ word list + tiers
        specs = []  # (text, mono, tier)
        for s in SPOKEN:
            specs.append((s, False, "near"))
        rest = [(s, False) for s in BRIEF + MORE] + [(s, True) for s in MONO]
        order = rng.permutation(len(rest))
        brief_first = [i for i in order if rest[i][0] in BRIEF][:6]
        order = brief_first + [i for i in order if i not in brief_first]
        for k, i in enumerate(order):
            r = rng.random()
            tier = "near" if r < 0.22 else ("mid" if r < 0.62 else "far")
            specs.append((rest[i][0], rest[i][1], tier))
        # far-tier texture: repeats of random terms
        pool = SPOKEN + BRIEF + MORE
        for _ in range(34):
            specs.append((pool[rng.integers(len(pool))], False, "far"))
        n = len(specs)
        # ------------------------------------------------ spawn times (escalating rate)
        ns = len(SPOKEN)
        m = n - ns
        u = np.arange(m) / (m - 1)
        times = np.concatenate([np.arange(ns) * 0.16,
                                1.92 + (T_STORM - 0.25 - 1.92) * u ** 0.55])
        self.words = []
        boxes = []  # (x0, y0, x1, y1, weight)
        tl_box = (TL_POS0[0] - 190, TL_POS0[1] - 40, TL_POS0[0] + 190, TL_POS0[1] + 40)
        for k, ((text, mono, tier), t0) in enumerate(zip(specs, times)):
            if tier == "near":
                em = rng.uniform(58, 84) if k < len(SPOKEN) else rng.uniform(52, 78)
                col, wt, spd = TEXT, SEMIBOLD, rng.uniform(12, 20)
            elif tier == "mid":
                em, col, wt, spd = rng.uniform(36, 50), TEXT2, MEDIUM, rng.uniform(8, 13)
            else:
                em, col, wt, spd = rng.uniform(22, 31), FAR, NORMAL, rng.uniform(4, 8)
            if mono:
                em *= 0.9
            w = Word(text, mono, tier, em, col, wt)
            # placement: least-overlap of 48 candidates; the word must still be inside
            # the safe area at the end of the storm (after drift + camera push)
            ang = rng.uniform(0, 2 * np.pi)
            vel = np.array([np.cos(ang), -np.sin(ang)]) * spd      # px/s, screen coords
            life = T_FALL - t0
            best, best_cost = None, 1e18
            pad = {"near": 26, "mid": 14, "far": 0}[tier]
            early = 10.0 if k < 24 else (0.12 if t0 > 4.6 else 1.0)   # climax: let it pile up

            def zoom(tau):
                return 1 + ZMAX * ease_in_out_cubic(seg(tau, 0.0, T_STORM))

            def at(x, y, vx, vy, ts, tau):
                z = zoom(tau)
                return (W / 2 + (x + vx * (tau - ts) - W / 2) * z,
                        H / 2 + (y + vy * (tau - ts) - H / 2) * z)
            for _ in range(64):
                cx = rng.uniform(110 + w.w_px / 2, W - 110 - w.w_px / 2)
                cy = rng.uniform(80 + w.h_px / 2, H - 80 - w.h_px / 2)
                ex, ey = at(cx, cy, vel[0], vel[1], t0, T_FALL)
                hw, hh = w.w_px * (1 + ZMAX) / 2, w.h_px * (1 + ZMAX) / 2
                if ex - hw < 100 or ex + hw > W - 100 or ey - hh < 62 or ey + hh > H - 62:
                    continue
                cost = 0.0
                for (bx, by, bvx, bvy, bt0, bw, bh, wgt) in boxes:
                    for tau in (t0, 0.5 * (t0 + T_FALL), T_FALL):
                        ax, ay = at(cx, cy, vel[0], vel[1], t0, tau)
                        qx, qy = at(bx, by, bvx, bvy, bt0, tau)
                        ox = (w.w_px + bw) / 2 + pad - abs(ax - qx)
                        oy = (w.h_px + bh) / 2 + pad * 0.5 - abs(ay - qy)
                        if ox > 0 and oy > 0:
                            cost += ox * oy * wgt * early
                for tau in (t0, T_FALL):
                    ax, ay = at(cx, cy, vel[0], vel[1], t0, tau)
                    ox = max(0.0, min(ax + w.w_px / 2, tl_box[2]) - max(ax - w.w_px / 2, tl_box[0]))
                    oy = max(0.0, min(ay + w.h_px / 2, tl_box[3]) - max(ay - w.h_px / 2, tl_box[1]))
                    cost += ox * oy * (6.0 if tier == "near" else 2.0)
                if cost < best_cost:
                    best, best_cost = (cx, cy), cost
            if best is None:   # fall back: no drift, centred placement
                cx, cy, vel = W / 2, H / 2, np.zeros(2)
            else:
                cx, cy = best
            wgt = {"near": 3.0, "mid": 1.6, "far": 0.6}[tier]
            boxes.append((cx, cy, vel[0], vel[1], float(t0), w.w_px, w.h_px, wgt))
            w.t0 = float(t0)
            w.p0 = to_xy(cx, cy)
            w.v = np.array([vel[0], -vel[1], 0]) / UNIT_PX
            w.fall_t = T_FALL + rng.uniform(0.0, 0.22)
            w.fall_rot = rng.uniform(-0.22, 0.22)
            w.fall_g = px(rng.uniform(2200, 3000))
            w.fall_vx = px(rng.uniform(-60, 60))
            self.words.append(w)
        tier_rank = {"far": 0, "mid": 1, "near": 2}
        self.draw_order = sorted(self.words, key=lambda w: (tier_rank[w.tier], w.t0))
        # ------------------------------------------------ "training loop"
        self.tl = Word("training loop", False, "mid", TL_EM0, TEXT2, SEMIBOLD)
        self.tl_glow = Word("training loop", False, "mid", TL_EM0, ORANGE, SEMIBOLD)
        self.tl.p0 = to_xy(*TL_POS0)
        self.tl.v = np.array([-1.0, 0.4, 0]) / np.hypot(1, 0.4) * px(9)
        # ------------------------------------------------ code card
        em = 40
        self.code_em = em
        self.adv = px(em * 0.6)
        card_w, card_h = 880, 262
        self.card_c = (960, 408 + card_h / 2)
        self.card = RoundedRectangle(width=px(card_w), height=px(card_h), corner_radius=px(16),
                                     fill_color=CARD, fill_opacity=1, stroke_color=CARD_BORDER,
                                     stroke_width=1 / 1.35)
        self.card.move_to(to_xy(*self.card_c))
        self.shadow = RoundedRectangle(width=px(card_w), height=px(card_h), corner_radius=px(16),
                                       fill_color="#000000", fill_opacity=1, stroke_width=0)
        self.shadow.move_to(self.card.get_center())
        x0_px = 960 - 31 * em * 0.6 / 2          # left of column 0 (31 = longest line)
        top = 408 + 40
        self.line_base_px = [top + 44 + i * 64 for i in range(3)]   # baselines
        self.code_glyphs = []    # list of (time, glyph) in typing order
        self.cursor_track = []   # (time, col, line)
        t = T_TYPE
        for li, (line, cls) in enumerate(zip(CODE, CODE_CLS)):
            assert len(line) == len(cls), (line, cls)
            tm = Text(line.strip(), font="JetBrains Mono", weight=MEDIUM, font_size=fs(em), color=TEXT)
            glyphs = list(tm.submobjects)
            cols = [i for i, ch in enumerate(line) if ch != " "]
            assert len(glyphs) == len(cols), (line, len(glyphs), len(cols))
            # fit horizontal offset: glyph centred in its monospace cell
            off = np.mean([g.get_center()[0] - (px(x0_px - W / 2) + c * self.adv + self.adv / 2)
                           for g, c in zip(glyphs, cols)])
            tm.shift([-off, 0, 0])
            # baseline: first glyph of each line sits on the baseline (f / l)
            base_y = (H / 2 - self.line_base_px[li]) / UNIT_PX
            tm.shift([0, base_y - glyphs[0].get_bottom()[1], 0])
            for g, c in zip(glyphs, cols):
                g.set_fill(CLS_COL[cls[c]], 1.0)
            indent = len(line) - len(line.lstrip(" "))
            gi = 0
            if li > 0:
                t += LINE_PAUSE
            self.cursor_track.append((t, indent, li))
            for c in range(indent, len(line)):
                t += 1.0 / TYPE_RATE
                if line[c] != " ":
                    self.code_glyphs.append((t, glyphs[gi]))
                    gi += 1
                self.cursor_track.append((t, c + 1, li))
        self.t_type_end = t
        self.x0_px = x0_px
        self.cursor = Rectangle(width=self.adv * 0.92, height=px(em * 1.12), stroke_width=0,
                                fill_color=ORANGE, fill_opacity=0.9)
        # ------------------------------------------------ subtitle
        self.sub = Text("the 20% I actually needed", font="Inter", weight=MEDIUM,
                        font_size=fs(42), color=TEXT2)
        txt = "the 20% I actually needed"
        nonspace = [i for i, ch in enumerate(txt) if ch != " "]
        for gi, ci in enumerate(nonspace):
            if 4 <= ci <= 6:
                self.sub.submobjects[gi].set_fill(ORANGE, 1.0)
        self.sub.move_to(to_xy(960, 742))
        self.sub0 = self.sub.copy()

    # ---------------------------------------------------------------- frame
    def _zoom(self, t):
        return 1 + ZMAX * ease_in_out_cubic(seg(t, 0.0, T_STORM))

    def frame(self, t):
        mobs, glows, shadows = [], [], []
        Z = self._zoom(min(t, T_STORM + 0.6))
        # ------------------------------------------------ storm words
        for w in self.draw_order:
            tau = t - w.t0
            if tau < 0:
                continue
            e = ease_spec(tau / POP)
            alpha = e
            dim = 1 - 0.28 * smootherstep(seg(tau, 1.0, 3.6))
            pos = w.p0 + w.v * tau
            scale = (0.92 + 0.08 * e) * Z
            pos = pos * Z
            ang = 0.0
            if t > w.fall_t:
                ft = t - w.fall_t
                pos = pos + np.array([w.fall_vx * ft, -0.5 * w.fall_g * ft * ft, 0])
                ang = w.fall_rot * ease_in_cubic(seg(ft, 0, 0.5))
                alpha *= 1 - seg(ft, 0.0, 0.45) ** 2
            dim *= 1 - 0.45 * smootherstep(seg(t, T_FALL, T_FALL + 0.2))
            a = alpha * dim
            if a < 0.004:
                continue
            mobs.append(w.place(pos, scale, ang, a))
        # ------------------------------------------------ training loop
        tau = t - TL_SPAWN
        if tau >= 0:
            e = ease_spec(tau / POP)
            pos_storm = (self.tl.p0 + self.tl.v * min(tau, T_FALL - TL_SPAWN + 0.1)) * Z
            m = ease_in_out_cubic(seg(t, 5.55, 6.20))
            target = to_xy(*TL_POS1)
            pos = (1 - m) * pos_storm + m * target
            s0 = (0.92 + 0.08 * e) * Z
            s1 = TL_EM1 / TL_EM0
            scale = (1 - m) * s0 + m * s1
            warm = smootherstep(seg(t, 5.50, 5.95))
            rgb = (1 - warm) * hexrgb(TEXT2) + warm * hexrgb(ORANGE)
            mobs.append(self.tl.place(pos, scale, 0.0, e, rgb))
            gl = smootherstep(seg(t, 5.55, 6.2))
            if gl > 0:
                # gentle swell on arrival, then settle
                k = gl * (0.75 + 0.25 * np.exp(-((t - 6.35) / 0.25) ** 2))
                glows.append(self.tl_glow.place(pos, scale, 0.0, k))
        # ------------------------------------------------ code card
        pc = seg(t, T_CARD, T_CARD + POP)
        if pc > 0:
            e = ease_spec(pc)
            sc = 0.96 + 0.04 * e
            card = self.card.copy().scale(sc).set_fill(opacity=e).set_stroke(opacity=e)
            mobs.append(card)
            sh = self.shadow.copy().scale(sc).set_fill(opacity=e)
            shadows.append(sh)
            tk = tq(t)       # typing is discrete: evaluate at the frame centre (no ghosting)
            for tg, g in self.code_glyphs:
                if tk >= tg:
                    mobs.append(g)
            # cursor
            col, line = self.cursor_track[0][1], self.cursor_track[0][2]
            for tc, c, li in self.cursor_track:
                if tk >= tc:
                    col, line = c, li
                else:
                    break
            cx = self.x0_px + col * self.code_em * 0.6 + self.code_em * 0.3
            base = self.line_base_px[line]
            cy = base - self.code_em * 0.36
            cur = self.cursor.copy().move_to(to_xy(cx, cy))
            cur.set_fill(opacity=0.9 * e)
            mobs.append(cur)
            glows.append(cur.copy().set_fill(opacity=0.35 * e))
        # ------------------------------------------------ subtitle
        ps = seg(t, T_SUB, T_SUB + POP)
        if ps > 0:
            e = ease_spec(ps)
            sub = self.sub0.copy().scale(0.92 + 0.08 * e, about_point=self.sub0.get_center())
            for g in sub.family_members_with_points():
                g.fill_rgbas[:, 3] = e
            mobs.append(sub)
        return mobs, glows, shadows


def make(variant):
    return Storm(variant)
