"""m03_gnn_lungs: a bronchial airway tree drawn as a graph inside a two-lung
silhouette; GNN-style message passing (blue pulses along every edge, both ways,
in synchronous rounds), then a connected subtree with ~20% of the nodes lights up
Claude orange: "the 20% you need".

Timeline (s):
  0.00-0.50  lung silhouettes fade in (title pops at 0.15 in the "title" variant)
  0.20-1.40  tree grows from the trachea, generation by generation
  1.60-6.40  5 message-passing rounds (pulses 0.5 s, then node updates flash blue)
  6.50-7.25  the 20% subtree lights orange from the trachea down; the rest dims
  7.30-7.70  label + leader line (title variant only)
  7.75-9.80  two orange "airflow" waves run through the lit subtree
 10.00-11.01 clean static hold
"""
from __future__ import annotations

import numpy as np
from manim import VMobject, VGroup, Text, Dot, Line, Circle, SEMIBOLD, MEDIUM

from engine import (px, to_xy, fs, seg, ease_out_cubic, ease_in_cubic, ease_in_out_cubic,
                    smootherstep, ease_spec, BG, CARD, CARD_BORDER, TEXT, TEXT2, ORANGE,
                    BLUE, FPS, W, H, UNIT_PX)
from airway import build_tree, children_map

NAME = "m03_gnn_lungs"
DURATION_FRAMES = 330            # 11.011 s at 29.97 (10 s + 1 s hold)
VARIANTS = {"title": "", "notext": "_notext"}

EDGE_GREY = "#62626E"
NODE_GREY = "#B4B4BE"
LUNG_FILL = "#131317"
LUNG_EDGE = "#2C2C34"
PULSE_CORE = "#CFE6FF"

GROW_T0, GROW_DT, GROW_DUR = 0.20, 0.16, 0.24
ROUNDS = [1.60, 2.55, 3.50, 4.45, 5.40]
TRAVEL = 0.50
T_LIGHT = 6.50
LIGHT_STEP = 0.10
T_LABEL = 7.30
WAVES = [7.75, 8.75]
WAVE_STEP, WAVE_DUR = 0.12, 0.32
T_HOLD = 10.0


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def mixc(a, b, k):
    k = float(np.clip(k, 0, 1))
    return (1 - k) * hexrgb(a) + k * hexrgb(b)


SCALE, CEN = 1.06, np.array([960.0, 560.0])


def SP(p):
    """tree px -> scaled screen px (tree + lungs drawn 6% larger about the centre)"""
    return CEN + (np.asarray(p, dtype=float) - CEN) * SCALE


def P(p):
    """tree px -> Manim point"""
    q = SP(p)
    return to_xy(q[0], q[1])


class Lungs:
    bloom = [(4, 0.75), (16, 0.7)]
    motion_blur = 4          # sub-frames per frame (180-degree shutter)

    def __init__(self, variant):
        self.variant = variant
        T = build_tree(frac=0.45, frac_deep=0.68)
        self.T = T
        nodes, gen, parent, edges = T["nodes"], T["gen"], T["parent"], T["edges"]
        self.N = len(nodes)
        self.pos = np.array([P(p) for p in nodes])
        self.gen = gen
        self.parent = parent
        ch = children_map(parent)
        depth = np.zeros(self.N, dtype=int)
        for i in range(1, self.N):
            depth[i] = depth[parent[i]] + 1
        self.depth = depth
        # ---------------- the ~20% connected subtree
        g2 = [i for i in range(self.N) if gen[i] == 2 and nodes[i][0] > 960]
        v = min(g2, key=lambda i: nodes[i][1])            # upper lobe, viewer's right
        lit = set()
        a = v
        while a >= 0:
            lit.add(a)
            a = parent[a]
        st = [v]
        while st:
            a = st.pop()
            if gen[a] <= 5:
                lit.add(a)
                st.extend(ch[a])
        g3 = sorted(ch[v], key=lambda i: nodes[i][1])
        st = [g3[0]]
        while st:
            a = st.pop()
            lit.add(a)
            st.extend(ch[a])
        self.lit = lit
        self.lit_frac = len(lit) / self.N
        # ---------------- lung silhouettes
        self.lungs = []
        for outline in (T["right"], T["left"]):
            m = VMobject()
            pts = [P(p) for p in outline]
            m.set_points_smoothly(pts + [pts[0]])
            m.set_fill(LUNG_FILL, 1.0).set_stroke(LUNG_EDGE, 1.6, 1.0)
            self.lungs.append(m)
        # ---------------- edges
        self.edges = []
        for (u, w, g) in edges:
            ln = Line(self.pos[u], self.pos[w])
            width_px = [5.6, 4.6, 3.8, 3.2, 2.7, 2.3, 2.0][min(g, 6)]
            self.edges.append(dict(u=u, w=w, g=g, mob=ln, wpx=width_px,
                                   lit=(u in lit and w in lit)))
        # ---------------- node + pulse pools
        unit = Dot(radius=1.0).points.copy()
        self.unit = unit - unit.mean(axis=0)
        self.node_mobs = [Dot(radius=1.0) for _ in range(self.N)]
        self.node_r = np.array([px([7.5, 7.0, 6.2, 5.6, 5.0, 4.5, 4.1][min(gen[i], 6)])
                                for i in range(self.N)])
        self.node_r[0] = px(7.5)
        self.pool = [Dot(radius=1.0) for _ in range(2 * len(self.edges) + 8)]
        self.tails = [VMobject() for _ in range(2 * len(self.edges) + 8)]
        # ---------------- text (title variant)
        self.title = self.label = None
        if variant == "title":
            self.title = Text("Thesis: GNNs for airflow in the lungs", font="Inter",
                              weight=SEMIBOLD, font_size=fs(40), color=TEXT)
            self.title.move_to(to_xy(112 + self.title.width * UNIT_PX / 2, 112))
            self.title0 = self.title.copy()
            lab = Text("the 20% you need", font="Inter", weight=SEMIBOLD, font_size=fs(48),
                       color=TEXT)
            s = "the 20% you need"
            nons = [i for i, c in enumerate(s) if c != " "]
            for gi, ci in enumerate(nons):
                if 4 <= ci <= 6:
                    lab.submobjects[gi].set_fill(ORANGE, 1.0)
            # anchor: right-most lit node in the upper half of the subtree
            lit_nodes = [i for i in lit if gen[i] >= 3]
            ys = np.array([nodes[i][1] for i in lit_nodes])
            ymid = np.median(ys)
            anchor = max([i for i in lit_nodes if nodes[i][1] <= ymid + 40],
                         key=lambda i: nodes[i][0])
            ax, ay = SP(nodes[anchor])
            lab_w = lab.width * UNIT_PX
            lx = max(ax + 110, 1408)
            lx = min(lx, W - 120 - lab_w)
            ly = min(max(ay - 70, 300), 820)
            lab.move_to(to_xy(lx + lab_w / 2, ly))
            self.label, self.label0 = lab, lab.copy()
            self.anchor = np.array([ax, ay])          # screen px (already scaled)
            self.leader_end = np.array([lx - 18, ly])
        # timing per edge for growth and lighting
        for e in self.edges:
            e["t_grow"] = GROW_T0 + GROW_DT * e["g"]
            e["t_light"] = T_LIGHT + LIGHT_STEP * self.depth[e["u"]]
        self.node_t_pop = np.zeros(self.N)
        self.node_t_pop[0] = GROW_T0
        for e in self.edges:
            self.node_t_pop[e["w"]] = e["t_grow"] + GROW_DUR
        self.node_t_light = np.array([T_LIGHT + LIGHT_STEP * self.depth[i] + 0.06 for i in range(self.N)])
        self.lit_edges = [e for e in self.edges if e["lit"]]

    # ---------------------------------------------------------------- helpers
    def _dot(self, mob, p, r, rgb, alpha):
        mob.points = self.unit * r + p
        mob.set_fill(rgb_to_hex(rgb), alpha)
        mob.set_stroke(width=0)
        return mob

    def _seg(self, mob, a, b, rgb, wpx, alpha):
        mob.set_points_as_corners([a, b])
        mob.set_stroke(rgb_to_hex(rgb), wpx / 1.35, alpha)
        return mob

    # ---------------------------------------------------------------- frame
    def frame(self, t):
        mobs, glows = [], []
        # ---- lungs
        la = smootherstep(seg(t, 0.0, 0.5))
        if la > 0:
            for m in self.lungs:
                m.set_fill(opacity=la).set_stroke(opacity=la)
                mobs.append(m)
        dim = 1 - 0.68 * smootherstep(seg(t, T_LIGHT, T_LIGHT + 0.45))
        # ---- round state
        r_idx, r_prog = None, 0.0
        for k, r0 in enumerate(ROUNDS):
            if r0 <= t < r0 + TRAVEL:
                r_idx, r_prog = k, (t - r0) / TRAVEL
        flash = 0.0
        for r0 in ROUNDS:
            dt = t - (r0 + TRAVEL)
            if 0 <= dt < 1.2:
                flash = max(flash, np.exp(-dt / 0.28) * smootherstep(seg(dt, 0, 0.06)))
        # ---- edges
        for e in self.edges:
            gp = seg(t, e["t_grow"], e["t_grow"] + GROW_DUR)
            if gp <= 0:
                continue
            a, b = self.pos[e["u"]], self.pos[e["w"]]
            bb = a + (b - a) * ease_out_cubic(gp)
            col = hexrgb(EDGE_GREY)
            if r_idx is not None:
                col = mixc(EDGE_GREY, "#6F8FB8", 0.55 * np.sin(np.pi * r_prog))
            alpha = 1.0
            wpx = e["wpx"]
            if e["lit"]:
                lp = smootherstep(seg(t, e["t_light"], e["t_light"] + 0.2))
                if lp > 0:
                    col = (1 - lp) * col + lp * hexrgb(ORANGE)
                    wpx = wpx * (1 + 0.5 * lp) + 0.6 * lp
                    glows.append(self._seg(VMobject(), a, bb, hexrgb(ORANGE), wpx, 0.85 * lp))
            else:
                alpha = dim
            mobs.append(self._seg(e["mob"], a, bb, col, wpx, alpha))
        # ---- pulses (message passing)
        if r_idx is not None:
            s = ease_in_out_cubic(r_prog)
            fade = smootherstep(seg(r_prog, 0, 0.12)) * (1 - smootherstep(seg(r_prog, 0.86, 1.0)))
            k = 0
            for e in self.edges:
                a, b = self.pos[e["u"]], self.pos[e["w"]]
                for (p0, p1) in ((a, b), (b, a)):
                    head = p0 + (p1 - p0) * s
                    tail = p0 + (p1 - p0) * max(0.0, s - 0.22)
                    tm = self._seg(self.tails[k], tail, head, hexrgb(BLUE), 2.6, 0.55 * fade)
                    dm = self._dot(self.pool[k], head, px(3.3), hexrgb(PULSE_CORE), fade)
                    mobs.extend([tm, dm])
                    glows.append(self._dot(Dot(radius=1.0), head, px(3.6), hexrgb(BLUE), fade))
                    k += 1
        # ---- orange airflow waves inside the lit subtree
        for w0 in WAVES:
            for e in self.lit_edges:
                ts = w0 + WAVE_STEP * self.depth[e["u"]]
                p = seg(t, ts, ts + WAVE_DUR)
                if 0 < p < 1:
                    a, b = self.pos[e["u"]], self.pos[e["w"]]
                    s = ease_in_out_cubic(p)
                    f = smootherstep(seg(p, 0, 0.15)) * (1 - smootherstep(seg(p, 0.85, 1)))
                    head = a + (b - a) * s
                    tail = a + (b - a) * max(0.0, s - 0.35)
                    mobs.append(self._seg(VMobject(), tail, head, hexrgb("#FFC9B3"), 3.0, 0.7 * f))
                    d = self._dot(Dot(radius=1.0), head, px(3.8), hexrgb("#FFE4D8"), f)
                    mobs.append(d)
                    glows.append(self._dot(Dot(radius=1.0), head, px(4.2), hexrgb(ORANGE), f))
        # ---- nodes
        for i in range(self.N):
            pp = seg(t, self.node_t_pop[i], self.node_t_pop[i] + 6 / FPS)
            if pp <= 0:
                continue
            r = self.node_r[i] * ease_out_cubic(pp)
            col = mixc(NODE_GREY, BLUE, 0.85 * flash)
            alpha = 1.0
            if i in self.lit:
                lp = smootherstep(seg(t, self.node_t_light[i], self.node_t_light[i] + 0.2))
                if lp > 0:
                    col = (1 - lp) * col + lp * hexrgb(ORANGE)
                    r = r * (1 + 0.18 * lp)
                    glows.append(self._dot(Dot(radius=1.0), self.pos[i], r * 1.05, hexrgb(ORANGE), 0.9 * lp))
            else:
                alpha = dim
            if flash > 0.003:
                glows.append(self._dot(Dot(radius=1.0), self.pos[i], r, hexrgb(BLUE),
                                       0.75 * flash * (1.0 if i in self.lit else dim)))
            mobs.append(self._dot(self.node_mobs[i], self.pos[i], r, col, alpha))
        # ---- text
        if self.title is not None:
            p = seg(t, 0.15, 0.15 + 10 / FPS)
            if p > 0:
                e = ease_spec(p)
                tt = self.title0.copy().scale(0.92 + 0.08 * e)
                for g in tt.family_members_with_points():
                    g.fill_rgbas[:, 3] = e
                mobs.append(tt)
            lp = seg(t, T_LABEL, T_LABEL + 0.25)
            if lp > 0:
                a = to_xy(*self.anchor)
                b = to_xy(*self.leader_end)
                d = (b - a) / np.linalg.norm(b - a)
                a2 = a + d * px(12)
                bb = a2 + (b - a2) * ease_out_cubic(lp)
                mobs.append(self._seg(VMobject(), a2, bb, hexrgb(ORANGE), 2.2, 0.9))
            p = seg(t, T_LABEL + 0.15, T_LABEL + 0.15 + 10 / FPS)
            if p > 0:
                e = ease_spec(p)
                lab = self.label0.copy().scale(0.92 + 0.08 * e)
                for g in lab.family_members_with_points():
                    g.fill_rgbas[:, 3] = e
                mobs.append(lab)
        return mobs, glows


def rgb_to_hex(rgb):
    r, g, b = (int(round(float(np.clip(c, 0, 1)) * 255)) for c in rgb)
    return f"#{r:02X}{g:02X}{b:02X}"


def make(variant):
    return Lungs(variant)
