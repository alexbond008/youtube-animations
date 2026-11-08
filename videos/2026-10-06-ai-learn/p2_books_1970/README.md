# p2_books_1970

**Point 2 / 3 (Filter it → 80/20 it).** Line: *"the professor says I have these book recommendations… they're all like 1000 pages, one was written in 1970… You should not read all five books… ask it which chapters… the 80/20 of this book."*

The asset uses the AI-layer background (#0E0E10 with a dotted grid). The books are drawn as cloth-bound textbooks lying in a stack, spines facing the camera so the titles read horizontally on a phone.

| File | Spec |
|---|---|
| `p2_books_1970_1080p.mp4` | 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, `-preset slow`, yuv420p, bt709, no audio. Opaque, full-screen. |
| Length | **9.009 s** (270 frames): 8.0 s of motion, then a 1.0 s clean hold. |
| `qa/frame_01..06.png` | Stills from the final MP4 at 1.30 / 2.70 / 4.20 / 5.30 / 6.60 / 8.60 s. |

## Key moments
| Time (s) | What happens |
|---|---|
| 0.05 | The heading "Recommended reading" fades in. |
| 0.00 / 0.40 / 0.80 / 1.20 / 1.60 | Books drop onto the stack one by one: **Signals & Systems**, **Electromagnetic Fields**, **Control Engineering**, **Microwave Communication Systems**, **Stochastic Control**. Each gets a **"1000 pages"** tag 0.24 s after it lands. |
| 2.12–2.54 | *Electromagnetic Fields* ages into dusty sepia, with dust specks and a faded title. |
| 2.30 | A dusty sepia **"1970"** rubber stamp slams onto its spine with a small dust puff. |
| 2.95 | The heading exits. |
| 3.05–3.60 | A big red **✗** draws across the stack, one stroke after the other. |
| 3.62 | **"Don't read all 5"** pops in, with "all 5" in red. |
| 4.42–4.68 | Everything except the 1970 book exits. |
| 4.60–5.26 | The 1970 book is pulled to centre and flips to show its cover, with the 1970 stamp. |
| 5.30–5.92 | The cover swings open (3D) to **CONTENTS**. The left endpaper carries a library "DATE DUE" slip stamped 1971–2003. |
| 6.02 / 6.36 | Amber marker sweeps cross **9 Maxwell's Equations** and **11 Transmission Lines**. |
| 6.74 | Amber connectors draw from the two chapters. |
| 6.98 / 7.30 | The **"Your syllabus"** label pops, then **"200 of 1000 pages"** (the 80/20). |
| 8.00–9.00 | **Clean hold** on the open book, the highlighted chapters and the label. |

**Cut-in suggestion:**
- 0–2.6 s goes under "they're all like 1000 pages, one was written in 1970".
- The ✗ lands on "You should not read all five books".
- The open-book section lands on "ask it which chapters… the 80/20".
- The halves can be split at about 4.4 s if the lines are far apart.

## Content notes
- **Spines carry generic subject names only.** There are no authors or publishers; editions are generic ("3rd ed.", "Vol. II").
- **The contents page is a generic electromagnetics chapter list**, not copied from any real book. The page numbers are chosen so the two highlighted chapters total exactly 200 of about 1000 pages.
- **The library due-date slip is fictional.**

## Re-render
```sh
cd src
./render.sh                  # 270 frames at 3840x2160 -> MP4 + qa/ stills
ENCODE_ONLY=1 ./render.sh
node capture.mjs --stills 2.7,6.6,8.6 --out /tmp/p3
```
- **Requirements:** node, Google Chrome and ffmpeg.
- **Source:** `src/index.html`.
- **Timing constants:**
  - Books: `BOOKS` and `T_BOOK`.
  - Stamp: `T_AGE` and `T_STAMP`.
  - Cross: `T_X1` and `T_X2`.
  - Book transition: `T_EXIT`, `T_PULL`, `T_FLIP` and `T_OPEN`.
  - Highlights and label: `T_HL`, `T_LINK` and `T_LABEL`.
- **Contents list:** `TOC` in `src/index.html`.
- **Fonts:**
  - Inter and JetBrains Mono (OFL) are bundled.
  - Book typography uses Georgia, Arial Black and Courier New, which are macOS system fonts.
