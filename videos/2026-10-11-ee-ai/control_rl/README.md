# 01 · Control loop vs RL loop (ee-ai, Point 3)

**Video:** "Why Electrical Engineers Are Great AI Engineers"
**Point 3:** "Control theory is basically reinforcement learning"
**Script note:** *(b-roll: control block diagram next to RL diagram)*

3Blue1Brown-style diagram animations, built with Manim Community Edition (the free, open-source fork of 3B1B's library). They show that the feedback-control block diagram from EE lectures and the agent–environment diagram from RL are the same loop under different names. Dark SPEC look (#0E0E10 background, Inter for labels, STIX Two for maths, glowing signal pulses).

## Deliverables (`renders/`)

| # | File | Duration | What it shows |
|---|------|----------|---------------|
| 01 | `01_control_loop_build_1080p.mp4` | 10.5 s | The classic negative-feedback loop draws itself on piece by piece: r(t) → Σ(+/−) → e(t) → Controller C(s) → u(t) → Plant G(s) → y(t), with a disturbance w(t), and an Observer (Kalman filter) on the feedback path returning the state estimate x̂(t). Glowing pulses then circulate the loop, and each block lights up as a signal passes through it. |
| 02 | `02_side_by_side_1080p.mp4` + `02_side_by_side_alpha.mov` | 15.0 s | **Main shot.** The control loop is on the left and the RL loop on the right, both animating. Matching parts are then highlighted pair by pair, each with its own colour, a connecting line and a label. The rest of the frame dims during each pair. The shot ends on the caption "design a controller ≈ learn a policy". |
| 03 | `03_morph_1080p.mp4` + `03_morph_alpha.mov` | 8.5 s | The "Spider-Man pointing" moment, done with diagrams. The control loop is relabelled in place (Controller → Agent, Plant → Environment, u(t) → aₜ, x̂(t) → sₜ₊₁, e(t) → rₜ₊₁ reward), then slides into the textbook agent/environment picture and the signals start flowing again. |
| 04 (optional) | `04_equation_echo_1080p.mp4` | 7.0 s | "Same recursion, different names": the dynamic-programming recursion from optimal control sits above the Bellman optimality equation from RL. The matching terms are boxed in the same colour (min/max = best decision; ℓ/r = cost or reward right now; V(x′)/γV*(s′) = value of the next state). It ends on the LQR special case (quadratic V, Riccati recursion). |

All files are 1920×1080, 30 fps. The masters are H.264 High, CRF 14, yuv420p, with +faststart and no audio. The alpha versions are ProRes 4444 (`yuva444p`) with a transparent background. Every shot has a clean hold of at least 0.5 s at the start and end. In 01 the first 0.5 s is an empty frame before the build begins. In 02 and 03 the pulses keep moving during the end hold.

Note on the alpha versions: blocks keep their dark panel fill (#17171A), so labels stay readable over footage. During the pair highlights in 02, a 72 % dark overlay dims the whole frame, including whatever footage sits underneath. That is deliberate (it pulls focus).

## Where to cut them in (Point 3 of brainstorm1.txt)

| Timestamp in brainstorm1 | Line | Shot |
|---|---|---|
| ~06:12–06:31 | "the study of control theory… negative and positive feedback loops… some sort of observer to look at a state and give the right feedback… Kalman filters" | **01** (the build follows the words: loop, then observer, then Kalman filter) |
| ~06:31–06:54 | "reinforcement learning reminds me so much of stochastic control… one of these crazy Spider-Man moments" | **03 morph** |
| ~06:59–07:14 | "I'm looking at these diagrams to represent reinforcement learning… all of a sudden, they look very similar" | **02 side-by-side** (main shot; works full-screen or picture-in-picture) |
| optional, after 07:14 or in a deeper-dive cut | "cross pollination of two on the surface unrelated things which are actually very related" | **04 equation echo** |

(The transcript says "Kahneman filters"; that is a transcription error for **Kalman** filters. The diagrams use "Kalman filter".)

## The mapping (as shown in 02 and 03)

| Control theory | Reinforcement learning | Pair colour / label in 02 |
|---|---|---|
| Controller C(s) | Agent, policy π(a \| s) | orange, "decides what to do" |
| Plant G(s) (+ disturbance w) | Environment, dynamics p(s′, r \| s, a) | blue, "the system it acts on" |
| Control input u(t) | Action aₜ | yellow, "control input = action" |
| Measured output y / state estimate x̂(t) | State / observation sₜ₊₁ | purple, "what it observes" |
| Cost, e.g. min 𝔼[∫(eᵀQe + uᵀRu)dt] (LQR-style) | Return, max 𝔼[Σₜ γᵗ rₜ₊₁] | green, "cost = negative reward" |
| Designing the controller | Learning the policy | final caption, "design a controller ≈ learn a policy" |
| Dynamic programming / Bellman recursion, HJB in continuous time | Bellman optimality equation | shot 04 |

The wording is deliberately modest: it is an analogy with a real shared mathematical core (MDPs, dynamic programming, Bellman equations), not an identity. The main practical difference is that classical control usually starts from a known model (G(s), A, B), while RL usually learns from samples without one.

## How to re-render

Requirements: macOS with Homebrew `cairo` and `pkgconf` (installed), plus `ffmpeg` on PATH.

```bash
cd ~/Projects/Youtube/broll/ee-ai/01_control_vs_rl_loop/src

# one-time setup (already done)
~/.local/bin/uv venv --python 3.12 .venv
~/.local/bin/uv pip install --python .venv/bin/python manim     # Manim CE 0.21.0

# render everything (≈1 min): 1080p masters + ProRes 4444 alpha for 02 and 03
./render.sh
# or individual shots
./render.sh 02 03
```

`render.sh` renders each scene to a PNG sequence with Manim (`-r 1920,1080 --fps 30 --format png`, and `-t` for transparency). It then encodes the sequence with ffmpeg: `libx264 -profile:v high -crf 14 -pix_fmt yuv420p` for the masters, and `prores_ks -profile:v 4 -pix_fmt yuva444p10le` for the alpha versions.

To preview a single scene quickly: `.venv/bin/manim -pql scenes.py SideBySide`. The scene classes are `ControlLoopBuild`, `SideBySide`, `Morph` and `EquationEcho`.

Source files:
- `src/common.py`: palette, fonts, Block / Junction / Wire primitives, the glowing-pulse `Flow` system, and the vignette.
- `src/diagrams.py`: the parameterised control-loop and RL-loop builders (full-frame and compact layouts).
- `src/scenes.py`: the four shots.
- `assets/fonts/`: Inter and JetBrains Mono (OFL), and STIX Two Text/Math (OFL). These are registered at runtime, so nothing is installed system-wide. No LaTeX is needed: maths is set with Pango markup in STIX Two.
- `frames/`: review stills from the final renders.

## [VERIFY] notes (technical claims to double-check)

1. **Feedback path in 01, 02 and 03.** The state estimate x̂(t) is fed back and compared with r(t) at the summing junction. This is a simplified textbook composite of an output-tracking loop with an observer in the feedback path. A strict LQG diagram would usually draw u = −K x̂ (state feedback, with the reference entering separately). That is fine for b-roll, but [VERIFY] if Aleks wants the strict LQG form.
2. **Kalman filter inputs.** The observer takes the measured output y(t) (solid line) and the control input u(t) (dashed branch). This is correct for a Kalman filter or Luenberger observer.
3. **x̂ ↔ s.** With a Kalman filter the closest RL term is strictly the *belief state* of a POMDP. The diagram simply says "what it observes" / state. [VERIFY] the wording if precision matters on screen.
4. **e(t) → reward in the 03 morph.** The error label turns into the reward label because the summing junction "measures how far you are from the goal", which plays the role the reward does in RL. This is a visual simplification: precisely, reward corresponds to *negative stage cost* (e.g. −(eᵀQe + uᵀRu)), which is how 02 states it.
5. **Cost formula in 02.** min_C 𝔼[∫(eᵀQe + uᵀRu)dt] is an LQR/LQG-style quadratic tracking cost. The expectation is there because the setting is stochastic (disturbance w).
6. **04 equations.** Control uses the finite-horizon DP recursion V_k(x) = min_u 𝔼[ℓ(x,u) + V_{k+1}(x′)] (Bertsekas-style). RL uses the Bellman optimality equation V*(s) = max_a 𝔼[r(s,a) + γV*(s′)] (Sutton & Barto write it as 𝔼[R_{t+1} + γv*(S_{t+1}) | S_t = s, A_t = a]). In the LQR special case (linear dynamics, quadratic ℓ), V_k(x) = xᵀP_k x + c_k, with P_k from the Riccati recursion (c_k = 0 when there is no noise). HJB is the continuous-time version; it is mentioned here only, not shown on screen.
7. **RL environment notation.** p(s′, r | s, a) follows Sutton & Barto (2nd ed., §3.1).

## Anything Aleks needs to do
Nothing to film. If he wants 02 or 03 over his own footage, he should use the `_alpha.mov` files.
