# p2_old_uni_webpage

**Point 2 (Filter it), "one was written in 1970" / out-of-date reading lists.** This is a comedic but authentic-looking 1990s university module page, built as real HTML and captured frame by frame in headless Chrome.

| File | Spec |
|---|---|
| `p2_old_uni_webpage_1080p.mp4` | 1920×1080, 29.97 fps (30000/1001), H.264 High, CRF 14, `-preset slow`, yuv420p, bt709, no audio. Opaque, full-screen. |
| Length | **6.006 s** (180 frames): 5.0 s of motion, then a 1.0 s clean hold. |
| `qa/frame_01..06.png` | Stills from the final MP4 at 0.20 / 1.40 / 2.60 / 3.60 / 4.30 / 5.80 s. |

## What's on the page
- A generic retro browser window: grey bevels, Back/Forward/Reload/Home/Search/Print/Stop and "Location:".
- **URL:** `http://www.ee.example.ac.uk/~ee2xx/reading.html`.
- **Page title:** "EE2xx Electromagnetics — Recommended Reading", set in Times New Roman on a #C0C0C0 grey background with blue underlined links (two in visited purple).
- **Period furniture:**
  - A hand-drawn **under construction** road sign, whose worker digs at 4 fps like a GIF.
  - A hazard stripe and a scrolling yellow-on-navy marquee.
  - A blinking **NEW!** starburst.
  - An odometer **visitor counter** reading `004217` "since 01/10/1997".
  - "Best viewed at 800 x 600 in 256 colours."
- **A 5-book reading list**, all fictional:
  1. Thornbury, R. J., *Electromagnetic Fields*, 2nd edn, 1970 (approx. 1000 pages), marked **ESSENTIAL**.
  2. Ashcombe & Rudd, *Waves, Lines and Guides*, 1974.
  3. Pellingham, *Problems in Fields and Waves, with Answers*, 1981.
  4. Wexford, *Antennas for the Practical Engineer*, 1977.
  5. Collected Lecture Notes, 1989, £4.50.
- **Module leader:** "Dr A. N. Other" (the British placeholder name). Email `a.n.other@ee.example.ac.uk`.
- **Footer:** **"Last updated: 14/03/1999"** and "© 1997–1999 Dept. of Electrical & Electronic Engineering".

## Key moments
| Time (s) | What happens |
|---|---|
| 0.00 | The top of the page is on screen: heading, under-construction sign and marquee. |
| 0.30–3.05 | A slow eased scroll to the bottom of the page. The scrollbar thumb moves with it. |
| 3.00–4.15 | The camera zooms from 1× to 2.35× onto the centred footer. |
| 4.22–4.62 | An **amber marker sweep** (#F5B800 at about 40%) crosses **"Last updated: 14/03/1999"**. |
| 5.00–6.00 | **Clean hold.** The visitor counter, "Best viewed at 800 x 600…", the highlighted *Last updated: 14/03/1999* and the © line are all fully inside the safe area. |

## Content notes
- **The university, department page, people, books and URL are all invented.** `example.ac.uk` is deliberately generic, and there are no crests or logos.
- **The browser chrome is generic** and names no product. The status bar shows only "Done" and a padlock.
- **The book titles were web-checked** to avoid exact matches with real books.

## Re-render
```sh
cd src
./render.sh                  # 180 frames at 3840x2160 -> MP4 + qa/ stills
ENCODE_ONLY=1 ./render.sh
node capture.mjs --stills 1,3,5.8 --out /tmp/p4
```
- **Requirements:** node, Google Chrome and ffmpeg.
- **Capture method:** the asset is captured with headless Chrome via `puppeteer-core`, the same deterministic approach as the earlier b-roll.
- **Layout:** the whole screen is laid out on a virtual 960×540 canvas and scaled ×2, so the text is about 32 px tall at 1080p.
- **Timing and camera constants** (in `src/index.html`):
  - Scroll: `S0` and `S1`.
  - Zoom: `Z0`, `Z1` and `ZOOM`.
  - Highlight: `H0` and `H1`.
- **Fonts:** Times New Roman, Arial, Courier New and Arial Black (macOS system fonts, used for period authenticity).
