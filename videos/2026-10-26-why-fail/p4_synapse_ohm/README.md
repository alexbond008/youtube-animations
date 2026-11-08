# p4_synapse_ohm — "It IS hard: it's applied maths"

AI-layer concept animation: V = IR lifts off a textbook card, docks onto a neuron's axon membrane, synapse zoom with membrane RC circuit, then an action potential with a −70 → +40 mV trace. 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio, last frame held 1 s.

## Files
- `p4_synapse_ohm_1080p.mp4` — 22.59 s (21.6 s anim + 1 s hold, 677 frames)
- `p4_synapse_ohm_short_1080p.mp4` — 13.21 s (12.2 s anim + 1 s hold, 396 frames) = full timeline from 9.4 s

Camera: static except the designed moves (slight zoom-out 15.3–16.3, synapse zoom-in 16.5–17.4, pull back 18.2–18.95); no micro push-ins.

## Key beats (full / short)
| beat | full | short |
|---|---|---|
| Textbook card "2.1 Ohm's law", V = IR | 0.0 | — |
| V = IR lifts off, glows, floats; textbook equations appear and dim | 1.6–9.9 | 0.0–0.5 |
| Neuron draws in (soma 9.9, dendrites, axon 10.6–11.9, terminals 11.8–12.4; postsynaptic dendrite 11.9–12.8) | 9.9 | 0.5 |
| "Neuron" label | 12.3 | 2.9 |
| V = IR docks onto axon membrane (pill + connector) | 14.0–14.7 | 4.6–5.3 |
| Brain outline draws in behind, slight zoom-out | 15.5–16.6 | 6.1–7.2 |
| Zoom into synapse (lands 17.4); RC circuit across membrane, "Synapse", "Membrane ≈ resistor + capacitor", V = IR beside R | 16.5–18.2 | 7.1–8.8 |
| Pull back; RC card top-right; "Electrical signal" panel | 18.2–18.95 | 8.8–9.55 |
| Action-potential pulse travels soma → terminals (passes probe ~19.3, trace peaks +40 mV) | 18.6–20.3 | 9.2–10.9 |
| Terminal flash + transmitter release (static camera to end) | 20.3–21.6 | 10.9–12.2 |

## Re-render
```
cd src && npm install
nice -n 10 node render.mjs land 21.6 ../p4_synapse_ohm_1080p.mp4 ../qa 0.8,4.0,11.0,14.9,17.8,20.6 0
nice -n 10 node render.mjs land 12.2 ../p4_synapse_ohm_short_1080p.mp4 ../qa_short 0.5,1.5,4.0,8.4,11.0 9.4
```
(last arg = timeline offset in seconds). Source: `src/index.html` (renderAt(t)), copied from ee-ai p4_power_chain renderer (Playwright).
