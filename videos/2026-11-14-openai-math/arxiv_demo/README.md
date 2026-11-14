# arxiv_demo — arXiv abstract → click "View PDF" → scroll to the m+4 vs m+5 (Lean) mismatch, OpenScreen-style

**File:** `arxiv_demo_1080p.mp4` — 1920×1080, 29.97 fps, H.264 CRF 14 slow, yuv420p, bt709 (tv), no audio. 10.04 s (9.0 s animation + 1.04 s held last frame). Deterministic frame-stepped render.

Paper: arXiv 2610.08144, Bastounis, Circelli & Hansen, "Navier-Stokes lost in translation". The **key page is PDF page 6** (Example 3.1, Lemma 8.6): the natural-language quote "Four more derivatives of F than the requested output…" directly above the Lean theorem `norm_derivativeWord_inverse_le`, whose hypotheses `hfirst`/`hsecond` require `xJet (w.length + 5)` (the "+ 5" is printed red in the paper). The paper says the Lean result is *weaker* than (8.19); it does not say the NL proof is wrong, and nothing on screen claims that.

## Key timestamps
| t (s) | What |
|---|---|
| 0.0–0.3 | arXiv abstract page at 1.14×, title + authors readable; cursor visible |
| 0.3–1.25 | camera pans/zooms (→1.38×) to the "Access Paper" box; cursor glides to **View PDF**, hover underline at 1.15 |
| 1.40 | click (cursor press + orange ripple) |
| 1.50–1.85 | dark generic PDF viewer ("2610.08144.pdf", page counter, 125%) scales up out of the click point |
| 1.95–4.95 | fast eased scroll through pages 1→6 with vertical motion blur (page counter ticks 1…6; page 5's dark ChatGPT figure flies past ~4.2) |
| 4.55–5.85 | camera zooms 1.0→2.05× onto page 6 (quote + Lean listing), cursor glides to the quote |
| **6.00–6.46** | amber sweep (#F5B800, 32%) over "Four more derivatives of F than the requested output" (cursor rides the sweep) |
| **6.75–6.98** | sweep over `(w.length + 5)` in `hfirst` |
| **7.08–7.31** | sweep over `(w.length + 5)` in `hsecond` |
| 7.3–9.0 | slow camera drift 2.05→2.17×, cursor rests on empty space |
| 9.0–10.04 | held last frame |

## Re-render
```
cd src && npm install
CHROME="<path to Chrome/Chromium>" node capture_abs.js     # → ../work/abs_2x.png + abs_boxes.json (CHROME optional)
python render.py --stills                                   # QA stills
FFMPEG=ffmpeg python render.py                              # → ../arxiv_demo_1080p.mp4 (~1 min on M4)
```
Python 3.12 with PyMuPDF, Pillow, numpy. The PDF is expected at `dl/2610.08144.pdf` (from https://arxiv.org/pdf/2610.08144). Timing, camera keys and sweep boxes (PDF points, from PyMuPDF `search_for`) are constants at the top of `src/render.py`. Abstract page captured 2026-11-14; no cookies accepted, no login. QA stills (taken from the mp4) are in `qa/`.
