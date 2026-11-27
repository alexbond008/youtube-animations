# Re-execute run 1's real final build script (work/run_1/code_final.py, verbatim from the log) in freecadcmd,
# exporting the solid after each of its own steps. No geometry is added or changed; only file saving/GUI lines are skipped.
# freecadcmd stages_run1.py <code_final.py> <outdir>
import sys, os
src, out = sys.argv[-2], sys.argv[-1]; os.makedirs(out, exist_ok=True)
lines = open(src).read().split("\n")
cut = next(i for i, l in enumerate(lines) if l.startswith(("import FreeCADGui", "try:")))
lines = lines[:cut]
hooks = []  # (index_before, call)
def before(prefix, tag, obj="base"):
    i = next(i for i, l in enumerate(lines) if l.startswith(prefix)); hooks.append((i, f"_S({tag!r}, {obj})"))
def after(prefix, tag, obj="base"):
    i = next(i for i, l in enumerate(lines) if l.startswith(prefix)); hooks.append((i + 1, f"_S({tag!r}, {obj})"))
after("base = base.cut(Part.makeBox(cavity_L", "1_tray")
before("ear_t, ear_over", "2_standoffs")
before("base = base.cut(Part.makeBox(wall+2", "3_ears")
after("base = base.cut(Part.makeBox(wall+2", "4_window")
before("ear_t, ear_over", "2_standoffs") if False else None
before("for hx, hy in holes:\n" if False else "for hx, hy in holes:", "x")  # placeholder (removed below)
hooks.pop()
idx = [i for i, l in enumerate(lines) if l.startswith("for hx, hy in holes:")][1]
hooks.append((idx, "_S('5_slots', base)"))
before('Part.show(base, "Enclosure_Base")', "6_holes")
after('Part.show(lid, "Enclosure_Lid")', "7_lid", "lid")
for i, call in sorted(hooks, reverse=True): lines.insert(i, call)
pre = f'''
import os
_OUT = {out!r}
def _S(tag, shp):
    shp.exportBrep(os.path.join(_OUT, tag + ".brep"))
'''
code = pre + "\n".join(lines)
open(os.path.join(out, "_staged_code.py"), "w").write(code)
exec(compile(code, "staged", "exec"), {})
print("stages", sorted(os.listdir(out)))
