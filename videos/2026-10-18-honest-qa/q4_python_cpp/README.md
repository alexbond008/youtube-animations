# q4_python_cpp: "Python first, then C++ to understand it"

This is the concept animation for Q4 ("How many programming languages does an EE student need?"). It is framed as **Python first, then C++ to learn what is under the hood**. It is not a versus graphic: there is no VS badge and no comparison layout.

## Files
| File | Spec |
|---|---|
| `q4_python_cpp_1080p.mp4` | 1920×1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio. 46.61 s (45.6 s of animation plus a 1 s held last frame). |
| `q4_python_cpp_1080x1350.mp4` | 1080×1350 vertical variant for Shorts. Same timings. The code card shrinks to the top and the machine diagram sits underneath. |
| `qa/frame_XX_<sec>.png`, `qa/vertical/…` | QA stills (the filename gives the time in seconds). |
| `src/` | `index.html` (the whole animation, with `renderAt(t)`), `render.mjs`, `stills.mjs` and fonts (Inter, JetBrains Mono). |

## Key timestamps (seconds from clip start = presenter VO times)
| t | Beat | What is on screen |
|---|---|---|
| 0.0 | — | `main.cpp` card enters and starts typing at 32 chars/s (done at about 6.6 s). |
| 2.2 | "I'd recommend C++" | Heading "Second language: **C++**". |
| 8.6–10.3 | (filler) | The terminal strip types `g++ -std=c++17 main.cpp -o main && ./main`, then shows "compiled · exit 0". |
| 14.6 | "deeper fundamentals" | The card slides left. CPU, Stack and Heap columns build one at a time (14.95, 15.4, 15.85). |
| 16.8 | "how a machine works" | Heading appears. Bus connectors draw at 17.2. |
| 19.8 | "what computations" | `int main()` is highlighted. The CPU runs `push rbp` and then `sub rsp, 16` (20.8). Registers flash, pulses travel to the stack and the `main()` frame builds. |
| 23.0 | "object-oriented programming" | The `class` keyword gets a marker sweep and a bracket over lines 3–8. "behaviour · methods" and "data · hidden state" tags appear. The rest of the frame dims. |
| 28.3 | "dynamic memory allocation" | `new Sensor()` is highlighted and the CPU runs `call operator new`. The **Sensor heap block allocates at 28.6** and the pointer arrow from stack `s` draws at 29.25. |
| 31.0–33.8 | "software design…" | `s->record(42)` runs: the `record()` frame pushes, the `int[1] {42}` buffer allocates (32.0), the `data` pointer draws (32.45) and the function returns (33.8). |
| 35.0 | "when you look at Python code" | The C++ scene exits. The `main.py` card types `readings = []` / `readings.append(42)`. |
| 38.9 | "know how this works under the hood" | A dashed seam appears under `.append(42)`. The card lifts and the panel peels open (39.3–40.0) to show the CPython objects: stack `readings` → `PyListObject` (size 1, allocated 4) → `ob_item[4]` → `PyLongObject 42`. Pointer arrows draw at 40.15, 40.65 and 41.15, and pulses run through the chain at 42.0–44.3. |
| 44.4 | "Python is holding your hand" | The panel rolls shut and the card settles back to centre. An orange cradle draws around it (44.78–45.3) with a soft glow. **Held from 45.6 to the end (46.6).** |

The editor can cut any section. Every beat is self-contained, and the frame at a section's start time is clean.

## Accuracy notes
- The C++ is valid C++17 (implicit `return 0` from `main`). `sizeof(Sensor)` is 24 B, which is one `std::vector<int>` (3 pointers on x86-64).
- The register and asm values are illustrative x86-64 values, consistent with each other.
- CPython: appending to an empty list allocates 4 slots (`(n + (n>>3) + 6) & ~3`), so `ob_size 1`, `allocated 4`, and three NULL slots.

## Re-render
```bash
cd src   # npm ci once (playwright; uses cached chromium_headless_shell)
nice -n 10 node render.mjs land 45.6 ../q4_python_cpp_1080p.mp4 ../qa "1.2,7,12,18,21,25.5,30,33,36.8,40,42.5,45.6"
nice -n 10 node render.mjs vert 45.6 ../q4_python_cpp_1080x1350.mp4 ../qa/vertical "7,21,25.5,33,42.5,45.6"
node stills.mjs land /tmp/x 23.5,29   # quick stills
```
All timings are in the `T` object at the top of `index.html`.
