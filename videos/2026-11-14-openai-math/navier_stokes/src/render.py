"""Renders the three navier_stokes clips from the LBM cache (sim.py) + text layers (overlays.mjs).

Particles (blue -> white by local vorticity) are advected through the simulated velocity field.
One particle state feeds three ffmpeg pipes: 16:9 with text, 16:9 clean, 4:5 clean (1080x1350).
Usage: python render.py <flow_cache.npz> <layers_dir> <out_dir> [--frames N]
"""
import os
import subprocess
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

FPS = 30000 / 1001
HOLD = 30
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

BG = np.array([14, 14, 16], np.float32) / 255
DOT = np.array([35, 35, 42], np.float32) / 255
BLUE = np.array([77, 163, 255], np.float32) / 255
WHITE = np.array([245, 245, 247], np.float32) / 255
CYL_FILL = np.array([22, 22, 26], np.float32) / 255
CYL_RING = np.array([161, 161, 170], np.float32) / 255

N_PART = 52000
SUBSTEPS = 6
DECAY = 0.80
T_EQ, T_HL, T_CLAIM = 1.0, 5.0, 8.0
ENTER = 10  # frames


def ease_out(t):
    t = np.clip(t, 0, 1)
    return 1 - (1 - t) ** 3


def background(w, h):
    img = np.empty((h, w, 3), np.float32)
    img[:] = BG
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ox, oy = (w % 24) / 2 + 12, (h % 24) / 2 + 12
    dx = (xx - ox + 12) % 24 - 12
    dy = (yy - oy + 12) % 24 - 12
    a = np.clip(1.2 + 0.5 - np.sqrt(dx * dx + dy * dy), 0, 1)[..., None]
    return img * (1 - a) + DOT * a


class View:
    """Maps a window of the lattice to an output raster."""

    def __init__(self, w, h, x0, y0, scale, meta, gain=1.0):
        self.w, self.h, self.x0, self.y0, self.s, self.gain = w, h, x0, y0, scale, gain
        self.buf = np.zeros((3, h * w), np.float32)
        self.bg = background(w, h)
        nx, ny, d, cx, cy = meta[:5]
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        lx, ly = xx / scale + x0, yy / scale + y0
        r = np.sqrt((lx - cx) ** 2 + (ly - cy) ** 2) * scale
        rad = d / 2 * scale
        self.fill = np.clip(rad - r + 0.5, 0, 1)[..., None]
        self.ring = np.clip(1.6 - np.abs(r - rad + 1.0), 0, 1)[..., None] * 0.55
        self.lxy = (ly, lx)

    def splat(self, px, py, col):
        x = (px - self.x0) * self.s
        y = (py - self.y0) * self.s
        ok = (x >= 0) & (x < self.w - 1) & (y >= 0) & (y < self.h - 1)
        x, y, col = x[ok], y[ok], col[ok]
        x0, y0 = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
        fx, fy = x - x0, y - y0
        n = self.w * self.h
        for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
            idx = (y0 + dy) * self.w + x0 + dx
            for c in range(3):
                self.buf[c] += np.bincount(idx, wt * col[:, c] * self.gain, minlength=n)

    def frame(self, vortmag):
        buf = self.buf.reshape(3, self.h, self.w).transpose(1, 2, 0)
        glow = ndimage.gaussian_filter(buf[::2, ::2], sigma=(5, 5, 0))
        glow = np.repeat(np.repeat(glow, 2, 0), 2, 1)[: self.h, : self.w]
        light = 1 - np.exp(-(buf * 2.8 + glow * 1.8))
        # faint vorticity haze so the street reads even between particles
        vm = ndimage.map_coordinates(vortmag, self.lxy, order=1, mode="nearest")[..., None]
        haze = np.clip(vm, 0, 1) * 0.10 * BLUE
        img = self.bg + haze + light * (1 - self.bg)
        img = img * (1 - self.fill) + CYL_FILL * self.fill
        img = img * (1 - self.ring) + CYL_RING * self.ring
        return img

    def decay(self):
        self.buf *= DECAY


def load_layer(path):
    a = np.asarray(Image.open(path).convert("RGBA"), np.float32) / 255
    ys, xs = np.nonzero(a[..., 3] > 0.004)
    return a, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def place(img, layer, bbox, opacity, scale):
    if opacity <= 0.001:
        return img
    x0, y0, x1, y1 = bbox
    pad = 40
    x0, y0 = max(x0 - pad, 0), max(y0 - pad, 0)
    x1, y1 = min(x1 + pad, layer.shape[1]), min(y1 + pad, layer.shape[0])
    crop = layer[y0:y1, x0:x1]
    if abs(scale - 1) > 1e-3:
        h, w = crop.shape[:2]
        nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
        im = Image.fromarray((crop * 255).astype(np.uint8), "RGBA").resize((nw, nh), Image.LANCZOS)
        crop = np.asarray(im, np.float32) / 255
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        x0, y0 = int(round(cx - nw / 2)), int(round(cy - nh / 2))
    h, w = crop.shape[:2]
    a = crop[..., 3:4] * opacity
    region = img[y0:y0 + h, x0:x0 + w]
    img[y0:y0 + h, x0:x0 + w] = region * (1 - a) + crop[..., :3] * a
    return img


def ffmpeg_pipe(path, w, h):
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
           "-r", "30000/1001", "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
           "-movflags", "+faststart", path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def to8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    cache, layers_dir, out_dir = sys.argv[1:4]
    limit = int(sys.argv[sys.argv.index("--frames") + 1]) if "--frames" in sys.argv else None
    os.makedirs(os.path.join(out_dir, "qa"), exist_ok=True)
    data = np.load(cache)
    U, obs, meta = data["u"], data["obs"], data["meta"]
    nx, ny, d, cx, cy, spf = meta
    nx, ny = int(nx), int(ny)
    frames = U.shape[0] if limit is None else min(limit, U.shape[0])

    wide = View(1920, 1080, 0, 0, 3.0, meta)
    vert = View(1080, 1350, 78, 0, 3.75, meta, gain=1.35)
    views = [wide, vert]

    L_eq, B_eq = load_layer(os.path.join(layers_dir, "layer_eq.png"))
    L_hl, B_hl = load_layer(os.path.join(layers_dir, "layer_hl.png"))
    L_cl, B_cl = load_layer(os.path.join(layers_dir, "layer_claim.png"))

    rng = np.random.default_rng(7)

    def spawn(n):
        return (rng.uniform(0, nx - 2, n), rng.uniform(0, ny - 1, n), rng.uniform(0, 1, n) * 0, rng.uniform(90, 200, n))

    px, py, age, life = spawn(N_PART)
    age = rng.uniform(0, 1, N_PART) * life

    pipes = {
        "text": ffmpeg_pipe(os.path.join(out_dir, "navier_stokes_1080p.mp4"), 1920, 1080),
        "clean": ffmpeg_pipe(os.path.join(out_dir, "navier_stokes_notext_1080p.mp4"), 1920, 1080),
        "vert": ffmpeg_pipe(os.path.join(out_dir, "navier_stokes_notext_vertical_1080x1350.mp4"), 1080, 1350),
    }
    qa_times = {0.5, 1.5, 2.0, 5.5, 9.0, 11.5}
    qa_frames = {round(t * FPS): t for t in qa_times}
    PREWARM = 24
    last = {}
    for fi in range(-PREWARM, frames):
        u = U[max(fi, 0)].astype(np.float32) * spf  # cells per video frame
        ux, uy = u[0], u[1]
        vort = np.gradient(uy, axis=1) - np.gradient(ux, axis=0)
        vortmag = ndimage.gaussian_filter(np.abs(vort), 1.0) / 0.25
        for v in views:
            v.decay()
        h = 1.0 / SUBSTEPS
        for _ in range(SUBSTEPS):
            c = np.vstack([py, px])
            vx = ndimage.map_coordinates(ux, c, order=1, mode="nearest")
            vy = ndimage.map_coordinates(uy, c, order=1, mode="nearest")
            c2 = np.vstack([py + vy * h / 2, px + vx * h / 2])
            px = px + ndimage.map_coordinates(ux, c2, order=1, mode="nearest") * h
            py = (py + ndimage.map_coordinates(uy, c2, order=1, mode="nearest") * h) % (ny - 1)
            age = age + h
            w = ndimage.map_coordinates(vortmag, np.vstack([py, px]), order=1, mode="nearest")
            t = np.clip(w, 0, 1) ** 0.8
            fade = np.clip(np.minimum(age, life - age) / 15, 0, 1)
            bright = (0.15 + 0.85 * t ** 1.3) * fade * h * 0.9
            tc = (t ** 2)[:, None]
            col = (BLUE[None] * (1 - tc) + WHITE[None] * tc) * bright[:, None]
            for v in views:
                v.splat(px, py, col)
        ix = np.clip(px.astype(int), 0, nx - 1)
        iy = np.clip(py.astype(int), 0, ny - 1)
        dead = (px >= nx - 2) | (age >= life) | obs[iy, ix]
        k = int(dead.sum())
        if k:
            sx, sy, sa, sl = spawn(k)
            # half the respawns enter at the inlet so the freestream stays fed
            inlet = rng.uniform(0, 1, k) < 0.35
            sx[inlet] = rng.uniform(0, 4, inlet.sum())
            px[dead], py[dead], age[dead], life[dead] = sx, sy, sa, sl
        if fi < 0:
            continue

        base = wide.frame(vortmag)
        tsec = fi / FPS
        clean = to8(base)
        txt = base.copy()
        f_eq = (fi - round(T_EQ * FPS)) / ENTER
        if f_eq >= 0:
            e = ease_out(f_eq)
            s = 0.92 + 0.08 * e
            f_hl = ease_out((fi - round(T_HL * FPS)) / ENTER)
            if f_hl < 1:
                txt = place(txt, L_eq, B_eq, e, s)
            if f_hl > 0:
                txt = place(txt, L_hl, B_hl, e * f_hl, s)
        f_cl = (fi - round(T_CLAIM * FPS)) / ENTER
        if f_cl >= 0:
            e = ease_out(f_cl)
            txt = place(txt, L_cl, B_cl, e, 0.92 + 0.08 * e)
        txt = to8(txt)
        vimg = to8(vert.frame(vortmag))
        last = {"text": txt, "clean": clean, "vert": vimg}
        for key, arr in last.items():
            pipes[key].stdin.write(arr.tobytes())
        if fi in qa_frames:
            tag = f"{qa_frames[fi]:04.1f}s"
            Image.fromarray(txt).save(os.path.join(out_dir, "qa", f"text_{tag}.png"))
            Image.fromarray(clean).save(os.path.join(out_dir, "qa", f"notext_{tag}.png"))
            Image.fromarray(vimg).save(os.path.join(out_dir, "qa", f"vertical_{tag}.png"))
        if fi % 30 == 0:
            print(f"frame {fi}/{frames}  t={tsec:.1f}s", flush=True)
    for key, arr in last.items():
        for _ in range(HOLD):
            pipes[key].stdin.write(arr.tobytes())
        pipes[key].stdin.close()
    for p in pipes.values():
        p.wait()
    print("done")


if __name__ == "__main__":
    main()
