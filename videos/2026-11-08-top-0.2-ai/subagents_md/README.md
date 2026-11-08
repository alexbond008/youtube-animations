# subagents_md — Claude Code subagents b-roll (control-lab example)

Moment: "for each of these boxes… a special agent with its own markdown file… multiple sub-agents… come back together".
All clips: 1920x1080, 29.97 fps, H.264 CRF 14 yuv420p bt709, 13.01 s (12 s + 1 s clean hold), no audio, static camera.

## Real, reusable files
- `.claude/agents/prelab.md`, `lab-session.md`, `data-analysis.md`, `write-up.md` — valid subagent files (YAML frontmatter: name, description, tools, model; body = system prompt). 14 lines each.
- `CLAUDE.md` — orchestration section: run them in order, pass outputs on (lab-session runs twice: run-sheet before the lab, data log after Aleks uploads the rig CSVs — the agent can't touch the rig).

## Clips
1. `agents_tree_1080p.mp4` — Pre-lab → Lab session → Data analysis → Write-up boxes (left) each spawn their file in `my-control-lab/.claude/agents/` (right).
   - 0.0–0.8 title, boxes, empty tree card. Files pop at **2.0 / 4.5 / 7.0 / 9.5 s** (box lights orange + arrow draws ~0.4 s before). Static from 9.9 s.
2. `agent_md_1080p.mp4` — Code Hike token morph of the 4 files in an editor card, tab shows `.claude/agents/<file>` + "subagent n/4".
   - prelab 0–3 s, morph → lab-session at **3.0**, → data-analysis at **6.0**, → write-up at **9.0** (morph ~1 s each). Frozen from 12.0 s.
3. `orchestrate_1080p.mp4` — main session fans out to 4 subagents, each with its own context bar; they run **in sequence** (each needs the previous output), results return, outputs assemble into report.pdf.
   - Prompt types 0.25–2.3; fan-out 2.35–2.9; runs: prelab 2.9, lab-session 4.35, data-analysis 5.8, write-up 7.25 (each done +1.2 s, chip answers.md / run-sheet.md / plots/ / report.tex pops, main log line + main-context bar steps up a little).
   - **Puzzle beat: chips fly into report tiles 8.75–10.0**; report.pdf goes green ✓ at **~10.2**, "✓ report.pdf ready" at 10.5. Static from 12.0 s.

Suggested anchors: tree file 1 on "create a skill"; agent_md under "own specific markdown file"; orchestrate 8.75 on "puzzle pieces come back together".

## Accuracy notes
- Shows subagents (`.claude/agents/*.md`), not skills. Subagents run in their own context window; only their result returns to the main session. They can run in parallel in Claude Code, but this chain is sequential because each step depends on the last; subagents don't spawn other subagents — the main session orchestrates.
- Generic UI only ("claude — terminal" label); no real product UI copied.

## Re-render
- Code morph source: `code_steps/step1-4.md` → `~/.claude/skills/edit-longform-video/kits/code-hike/render_code.sh code_steps work/codehike.mp4 github-dark 1600`, then copy to `remotion/public/codehike.mp4`.
- `cd remotion` (node_modules is a symlink to the project's remotion/node_modules):
  `nice -n 10 npx remotion render src/index.ts <AgentsTree|AgentMd|Orchestrate> ../<name>_1080p.mp4 --codec=h264 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4`
- QA stills: `qa/<clip>_00..05.png`.
