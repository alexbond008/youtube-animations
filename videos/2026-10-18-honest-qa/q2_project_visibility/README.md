# q2_project_visibility

Concept animation for Q2, "Do companies actually look at my personal projects?". It is split into two clips so the editor can place them separately. AI layer: #0E0E10 background with a dotted grid, #16161A cards, accent #D97757, Inter and JetBrains Mono. All content is fictional: "my_project/", "robo-arm.dev", and a generic video player with no platform branding.

## Files
| File | Size | Duration |
|---|---|---|
| `q2_project_visibility_a_1080p.mp4` | 1920x1080 | 15.32 s (14.3 s + 1 s held last frame) |
| `q2_project_visibility_b_1080p.mp4` | 1920x1080 | 17.02 s (16.0 s + 1 s held last frame) |
| `q2_project_visibility_a_1080x1350.mp4` | 1080x1350 vertical | 15.32 s |
| `q2_project_visibility_b_1080x1350.mp4` | 1080x1350 vertical | 17.02 s |

All files are H.264 at 29.97 fps (30000/1001), CRF 14, yuv420p, tagged bt709, with no audio. Timings are the same in the horizontal and vertical versions.

## Key moments: Part A ("hidden"), t=0 at "if you have some project…"
- 0.10: the project card fades in (robot arm on a PCB, "my_project/"). The arm moves slowly.
- 5.55: the folder and hard drive appear ("Local disk").
- 5.80–6.50: the card shrinks into the folder, and the folder bumps.
- 7.55: the drive moves aside.
- 8.30: a plain CV page slides in. 8.75: the grey bullet "• Built a robot arm in Python" appears. 9.40: an amber marker sweeps over it.
- 11.30: the search bar appears and types "robot arm python" (11.55–12.05). 12.20: "0 results".
- 12.55: the eye pill "0 views" appears.
- 12.95–13.85: everything greys out. It holds to the end, with a clean last frame from 14.3.

## Key moments: Part B ("visible"), t=0 at "but if you built this super cool thing"
- 0.50: the project card pops in.
- 3.30: the card morphs into the browser (robo-arm.dev, "Robo Arm" landing page).
- 6.00: the domain in the URL bar gets an orange highlight sweep, a glow and a pulse.
- 7.55: the browser moves aside. 7.75: the video player card enters ("I built a robot arm from scratch", 0 views).
- 8.70–10.90: the counter rockets from 0 to 248K (shown orange while rising) as the graph draws.
- 12.55: both cards gather into a central cluster.
- 13.30: eight generic person and company badges (Recruiter, Startup, Hiring manager, Big tech, Founder, Research lab, Engineer) pop in around the edges in stages. Orange dots stream into the project along dotted paths, and ripples pulse from the cluster from 13.9.
- 13.55: the house-style label "People find **you**" appears ("you" in #D97757). It loops until 16.0, then holds the last frame.

## Re-render
```
cd src
nice -n 10 node render.mjs a h ../q2_project_visibility_a_1080p.mp4
nice -n 10 node render.mjs b h ../q2_project_visibility_b_1080p.mp4
nice -n 10 node render.mjs a v ../q2_project_visibility_a_1080x1350.mp4
nice -n 10 node render.mjs b v ../q2_project_visibility_b_1080x1350.mp4
node render.mjs b h <dir> --stills 6.5,15.5   # PNG stills only
```
- `src/scene.html` holds the deterministic `renderAt(t)` scene. Use `?part=a|b&fmt=h|v`.
- `src/render.mjs` launches headless Google Chrome over CDP with no npm dependencies, needs Node 22 or later, and needs network access for Google Fonts. It captures each frame and pipes it to ffmpeg, which adds the 1 s `tpad` hold. Each clip takes about 2 min.
- QA stills are in `qa/`.
