# p1_maths_to_ml: two separate shots (Manim CE, house style)

Fictional/generic data only (synthetic scatter, a generic "7" pixel bitmap).

| File | Shot | Duration |
|---|---|---|
| `p1_linreg_1080p.mp4` / `p1_linreg_vertical_1080x1350.mp4` | A: y = mx + c -> fit -> Linear regression -> 1 neuron | 9.88 s incl. 1 s hold |
| `p1_matrix_cnn_1080p.mp4` / `p1_matrix_cnn_vertical_1080x1350.mp4` | B: pixels -> matrix -> kernel slide -> feature map | 8.98 s incl. 1 s hold |

Format: 1920x1080 or 1080x1350, 29.97 fps, H.264 CRF 14 yuv420p, bt709, no audio. Last 1 s static (encoder noise only).

## Shot A key moments (s)
- 0-1.5 "y = mx + c" written in STIX Two (m blue, c green); 1.5-2.0 "slope" / "intercept" tags; 2.0-2.5 beat.
- 2.5-3.1 equation moves into a readout panel, axes card appears; 3.1-3.7 axes + 14 scatter points.
- 3.7-5.5 line fits via real gradient descent (130 steps, start m=-0.35); live m, c and loss tick down (red -> green), red residuals shrink.
- 5.5-5.9 plot fades, equation grows to centre; 5.9-6.4 morphs into orange "Linear regression".
- 6.4-8.0 neuron builds: x1 x2 x3 -> Sigma -> y-hat, pulses, caption "the simplest AI model"; 8.0-9.0 beat; 9.0-9.9 hold.

## Shot B key moments (s)
- 0-1.1 pixel-art "7" appears (12x12; vertical uses 8x8); 1.1-1.8 pixels become the 0/1 matrix with brackets.
- 2.1-2.5 3x3 edge kernel card and "feature map" bracket appear.
- 2.5-6.5 orange window slides across (slow first 3 positions, then row sweep); the feature map (ReLU values 0-3, orange heat) fills in as it goes.
- 6.5 label "Convolutional neural network" (6.5-7.0 fade-in); 7.0-8.0 beat; 8.0-9.0 hold.

## Fonts
Inter / JetBrains Mono not installed here: Helvetica Neue and Menlo used as fallbacks (`UI`, `MONO` in `src/common.py`). Maths is STIX Two Text. No LaTeX needed.

## QA
`qa/` has stills for each variant. Vertical text >= 48 px (cell digits 48 px, 8x8 grid).

## Re-render
`cd src && ./render.sh [LinReg|MatrixCNN]` (both variants; ~5 min).
