# lean_compiler — "Lean is a compiler for maths": C++ compile, a real Lean 4 proof going green/red/green, and Mathlib's library fanning out

Three full-screen clips for the "What is Lean?" section of *Has OpenAI Solved Maths?*. AI layer (#0E0E10 dotted grid, #16161A cards, Inter + JetBrains Mono), generic editor windows only, static camera, element motion to the end, then a 1 s held last frame. 1920x1080, 29.97 fps, H.264 CRF 14, yuv420p, bt709, no audio.

| File | Length (incl. 1 s hold) | Key moments |
|---|---|---|
| `cpp_compile_1080p.mp4` | 9.01 s | 0.1–0.9 code lines (`main.cpp`, 7 lines) stagger in · 2.15 terminal strip slides up · 2.5–3.2 types `g++ main.cpp -o main` · 3.2–4.0 "compiling..." · **4.0 green ✓ 0 errors** (glow pulse from 5.0) · 5.1 `./main` · 5.8 prints `5` · cursor blinks to 8.0 |
| `lean_proof_1080p.mp4` | 13.01 s | 0.0–0.5 `Proof.lean` lines fade in · 0.6/1.4/2.2 goal view steps through lines 4–6 (hypotheses a b, ha, hb appear) · **3.0 green ✓ No goals** · 6.0 line 7 `linarith` → `rw [add_comm]` (typed by 6.7), panel "checking..." · **7.5 red squiggle + ✗ unsolved goals** panel (`⊢ 0 ≤ b ^ 2 + a ^ 2`) · 9.2 edit reverts to `linarith` · **10.0 green ✓ No goals** again, pulses to 12.0 |
| `mathlib_1080p.mp4` | 10.01 s | 0.0 small editor · 0.6–1.5 types `import Mathlib` · 1.65 dashed "Mathlib" library frame + flowing connector · **2.0–5.3 eight cards fan out** (one every 0.42 s): ∀ Axioms, ℕ Natural numbers, ℝ Real numbers, ℂ Complex numbers, 𝒯 Topology, ∫ Analysis, ⊕ Linear algebra, ℙ Probability · **6.2 green badge "✓ checked by Lean’s kernel"** · 6.8–9.0 a green highlight travels across the cards, dashes flow, badge pulses |

## The Lean proof (real Lean 4 + Mathlib)
```lean
import Mathlib

theorem sum_sq_nonneg (a b : ℝ) :
    0 ≤ a ^ 2 + b ^ 2 := by
  have ha : 0 ≤ a ^ 2 := sq_nonneg a
  have hb : 0 ≤ b ^ 2 := sq_nonneg b
  linarith
```
The wrong step replaces `linarith` with `rw [add_comm]`: the rewrite succeeds but leaves `0 ≤ b ^ 2 + a ^ 2` open, so Lean reports "unsolved goals" (shown with the real context). Not machine-checked here (no Lean toolchain on this Mac); `sq_nonneg` and `linarith` are standard Mathlib.

## Re-render
```
cd src && npm install
nice -n 10 node render.mjs cpp.html 8.0 cpp_compile_1080p.mp4 cpp 0.5,2.6,3.5,4.2,6.2,7.9
nice -n 10 node render.mjs lean.html 12.0 lean_proof_1080p.mp4 lean 1.8,3.3,6.5,7.8,10.3,11.9
nice -n 10 node render.mjs mathlib.html 9.0 mathlib_1080p.mp4 mathlib 1.0,2.8,4.5,6.0,6.8,8.9
node stills.mjs lean.html 7.8 test   # quick stills, no encode
```
HTML pages expose `renderAt(t)`; `render.mjs` steps frames in headless Chromium (env `CHROME` optional, `FFMPEG` optional) and appends 30 held frames. ✓/✗ are SVG. Math glyphs (ℝ ≤ ⊢, card symbols) fall back to Menlo / STIX Two Math (macOS system fonts), since the Inter/JetBrains Mono subsets lack them. QA stills are in `qa/`.
