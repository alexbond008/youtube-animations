"""Rasterise the theorem snippets from the three downloaded PDFs at 300 dpi (PyMuPDF).
Usage (from farfetched_slides/):  python -I src/make_snippets.py
Clips are in PDF points (72/in); output PNGs land in snippets/."""
import os, pymupdf
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
CLIPS = {  # name: (pdf relative to root, page index, clip rect in points)
    "ch":      ("dl/ch_obstruction/paper.pdf",      1, (66, 282, 546, 356)),
    "padic":   ("dl/padic_section/main.pdf",        1, (66, 214, 530, 294)),
    "homotopy":("dl/homotopy_hypothesis/paper.pdf", 1, (74, 100, 540, 252)),
}
os.makedirs(os.path.join(root, "snippets"), exist_ok=True)
for name, (pdf, pg, clip) in CLIPS.items():
    pix = pymupdf.open(os.path.join(root, pdf))[pg].get_pixmap(dpi=300, clip=pymupdf.Rect(*clip))
    out = os.path.join(root, "snippets", f"{name}.png"); pix.save(out); print(out, pix.width, pix.height)
