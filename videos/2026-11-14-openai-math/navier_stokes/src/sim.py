"""2-D lattice-Boltzmann (D2Q9, BGK) flow past a cylinder -> von Karman vortex street.

Writes the velocity field for every video frame to an .npz cache that render.py reads.
Usage: python sim.py [out.npz]
"""
import sys
import time
import numpy as np

NX, NY = 640, 360          # lattice (3 px per cell at 1920x1080)
D = 48                     # cylinder diameter (cells)
CX, CY = 150, NY // 2 + 2  # slightly off-centre to break symmetry
U = 0.08                   # inflow speed (lattice units)
RE = 160
NU = U * D / RE
TAU = 3 * NU + 0.5
WARMUP = 20000             # steps before recording
STEPS_PER_FRAME = 33
FRAMES = 360

cxs = np.array([0, 1, 0, -1, 0, 1, -1, -1, 1])
cys = np.array([0, 0, 1, 0, -1, 1, 1, -1, -1])
W = np.array([4 / 9] + [1 / 9] * 4 + [1 / 36] * 4, dtype=np.float32)
OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]


def feq(rho, ux, uy):
    out = np.empty((9,) + rho.shape, dtype=np.float32)
    usq = ux * ux + uy * uy
    for i in range(9):
        cu = cxs[i] * ux + cys[i] * uy
        out[i] = W[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * usq)
    return out


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "flow_cache.npz"
    Y, X = np.mgrid[0:NY, 0:NX]
    obs = (X - CX) ** 2 + (Y - CY) ** 2 <= (D / 2) ** 2
    ux0 = np.full((NY, NX), U, np.float32) * (1 + 0.02 * np.sin(2 * np.pi * Y / NY)).astype(np.float32)
    uy0 = (0.01 * U * np.sin(2 * np.pi * X / NX)).astype(np.float32)
    F = feq(np.ones((NY, NX), np.float32), ux0, uy0)
    inlet = feq(np.ones((NY, 1), np.float32), np.full((NY, 1), U, np.float32), np.zeros((NY, 1), np.float32))
    omega = np.float32(1 / TAU)
    total = WARMUP + FRAMES * STEPS_PER_FRAME
    rec_u = np.zeros((FRAMES, 2, NY, NX), np.float16)
    t0 = time.time()
    for step in range(total):
        for i in range(1, 9):
            F[i] = np.roll(F[i], (cys[i], cxs[i]), axis=(0, 1))
        F[:, :, 0:1] = inlet
        F[[3, 6, 7], :, -1] = F[[3, 6, 7], :, -2]
        bnd = F[:, obs][OPP]
        rho = F.sum(0)
        ux = (F * cxs[:, None, None]).sum(0) / rho
        uy = (F * cys[:, None, None]).sum(0) / rho
        F += omega * (feq(rho, ux, uy) - F)
        F[:, obs] = bnd
        k = step - WARMUP
        if k >= 0 and (k + 1) % STEPS_PER_FRAME == 0:
            fi = (k + 1) // STEPS_PER_FRAME - 1
            ux[obs] = 0
            uy[obs] = 0
            rec_u[fi, 0] = ux
            rec_u[fi, 1] = uy
        if step % 2000 == 0:
            print(f"step {step}/{total}  {time.time() - t0:.0f}s  max|u|={np.abs(ux).max():.3f}", flush=True)
    np.savez(out, u=rec_u, obs=obs, meta=np.array([NX, NY, D, CX, CY, STEPS_PER_FRAME], np.float32))
    print("saved", out)


if __name__ == "__main__":
    main()
