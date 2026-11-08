## Control lab workflow (subagents in .claude/agents/)
Run the subagents in order, one at a time, and pass
each one the files the previous one wrote:
1. prelab        -> prelab/answers.md
2. lab-session   -> lab/run-sheet.md (before the lab)
   I run the rig and drop CSVs in data/rig/, then
   lab-session again -> lab/data-log.md
3. data-analysis -> analysis/results.md + plots/
4. write-up      -> report/report.pdf
If an agent flags missing or bad data, stop and ask me.
