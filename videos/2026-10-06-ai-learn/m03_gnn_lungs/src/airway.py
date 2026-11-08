"""2-D airway tree inside a two-lung silhouette (all coordinates in screen px).

Space-filling branching in the spirit of Kitaoka (1999) / Tawhai (2000): every
branch is assigned the patch of lung it must supply; the patch is split in two by a
line through its centroid along the parent direction, and each child branch grows a
fraction of the way toward the centroid of its half. Deterministic (fixed seed).
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

TRACHEA_TOP = np.array([960.0, 168.0])
CARINA = np.array([960.0, 392.0])
MAX_GEN = 6            # generations below the trachea (main bronchi = 1)


def catmull_rom_closed(ctrl, n_per=24):
    P = np.asarray(ctrl, dtype=float)
    out = []
    k = len(P)
    for i in range(k):
        p0, p1, p2, p3 = P[(i - 1) % k], P[i], P[(i + 1) % k], P[(i + 2) % k]
        for t in np.linspace(0, 1, n_per, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    return np.array(out)


# viewer's left = patient's right lung (3 lobes, broader); viewer's right = left lung
# (narrower, cardiac notch on its lower medial border)
RIGHT_LUNG = [(838, 262), (782, 272), (720, 322), (668, 410), (630, 520), (606, 650), (594, 790),
              (606, 905), (664, 948), (756, 936), (840, 912), (884, 876), (896, 760),
              (892, 610), (880, 480), (868, 360)]
LEFT_LUNG = [(1082, 262), (1138, 272), (1200, 322), (1252, 410), (1290, 520), (1314, 650),
             (1326, 790), (1314, 905), (1256, 952), (1168, 948), (1108, 924), (1118, 860),
             (1084, 790), (1046, 700), (1036, 600), (1040, 480), (1052, 360)]


def lung_outlines():
    return catmull_rom_closed(RIGHT_LUNG), catmull_rom_closed(LEFT_LUNG)


def sample_points(polys, n=9000, seed=11):
    W, H = 1920, 1080
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    for p in polys:
        d.polygon([tuple(v) for v in p], fill=255)
    m = np.asarray(mask) > 0
    ys, xs = np.nonzero(m)
    rng = np.random.default_rng(seed)
    idx = rng.choice(len(xs), size=n, replace=False)
    pts = np.stack([xs[idx] + rng.random(n), ys[idx] + rng.random(n)], axis=1)
    return pts, m


def build_tree(frac=0.42, frac_deep=0.52, max_angle=62.0, min_pts=12):
    right, left = lung_outlines()
    pts, mask = sample_points([right, left])
    nodes = [TRACHEA_TOP.copy(), CARINA.copy()]
    gen = [0, 0]
    parent = [-1, 0]
    edges = [(0, 1, 0)]  # (u, v, generation of the edge)

    def inside(p):
        x, y = int(round(p[0])), int(round(p[1]))
        return 0 <= x < mask.shape[1] and 0 <= y < mask.shape[0] and mask[y, x]

    def grow(ni, pdir, P, g):
        if g > MAX_GEN or len(P) < min_pts:
            return
        c = P.mean(axis=0)
        nrm = np.array([-pdir[1], pdir[0]])
        side = (P - c) @ nrm > 0
        halves = [P[side], P[~side]]
        for S in halves:
            if len(S) < min_pts // 2:
                continue
            cs = S.mean(axis=0)
            d = cs - nodes[ni]
            dist = np.linalg.norm(d)
            if dist < 1e-6:
                continue
            u = d / dist
            # limit branching angle relative to the parent direction
            ang = np.degrees(np.arctan2(pdir[0] * u[1] - pdir[1] * u[0], pdir @ u))
            if abs(ang) > max_angle:
                a = np.radians(np.sign(ang) * max_angle)
                ca, sa = np.cos(a), np.sin(a)
                u = np.array([ca * pdir[0] - sa * pdir[1], sa * pdir[0] + ca * pdir[1]])
            f = frac if g <= 2 else frac_deep
            L = f * dist
            end = nodes[ni] + u * L
            # stay inside the lung: shorten if needed
            for _ in range(12):
                if inside(end) or g == 1:
                    break
                L *= 0.82
                end = nodes[ni] + u * L
            nodes.append(end)
            gen.append(g)
            parent.append(ni)
            vi = len(nodes) - 1
            edges.append((ni, vi, g))
            grow(vi, u, S, g + 1)

    grow(1, np.array([0.0, 1.0]), pts, 1)
    return dict(nodes=np.array(nodes), gen=np.array(gen), parent=np.array(parent),
                edges=edges, right=right, left=left)


def children_map(parent):
    ch = {i: [] for i in range(len(parent))}
    for i, p in enumerate(parent):
        if p >= 0:
            ch[p].append(i)
    return ch


def pick_subtree(tree, target=0.20, prefer_side=+1):
    """Connected subtree containing the root path: path(root -> v) + all descendants of v.
    Picks v (generation >= 2) whose node count is closest to target * N."""
    parent, gen, nodes = tree["parent"], tree["gen"], tree["nodes"]
    N = len(parent)
    ch = children_map(parent)

    def desc(v):
        out, st = [], [v]
        while st:
            a = st.pop()
            out.append(a)
            st.extend(ch[a])
        return out

    def path(v):
        out = []
        while v >= 0:
            out.append(v)
            v = parent[v]
        return out

    best, best_err = None, 1e9
    for v in range(N):
        if gen[v] < 2:
            continue
        S = set(desc(v)) | set(path(v))
        side = np.sign(nodes[v][0] - 960)
        err = abs(len(S) / N - target) + (0.0 if side == prefer_side else 0.02)
        if err < best_err:
            best, best_err = (v, S), err
    return best
