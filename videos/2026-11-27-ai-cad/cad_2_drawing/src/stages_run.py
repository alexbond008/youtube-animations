# Re-execute Claude's execute_code scripts from the run log (verbatim) in freecadcmd, exporting the shape after
# every top-level "shape = ..." step. Only export hooks are added; geometry code is untouched.
# EVENTS=<events.json> OUTDIR=<dir> freecadcmd stages_run.py
import sys, os, json, FreeCAD as App
ev, out = os.environ["EVENTS"], os.environ["OUTDIR"]; os.makedirs(out, exist_ok=True)
E = json.load(open(ev))["events"]
App.newDocument("Shaft_1234")
n = [0]
def _S(tag, shp):
    if shp is None: return
    n[0] += 1; shp.exportBrep(os.path.join(out, "%02d_%s.brep" % (n[0], tag)))
codes = [e["input"]["code"] for e in E if e["k"] == "tool" and e["name"].endswith("execute_code")]
for ci, code in enumerate(codes):
    if "saveAs" in code: continue
    lines = code.split("\n"); outl = []
    for l in lines:
        outl.append(l)
        if l.startswith("shape = "):
            tag = l.split("(", 1)[0].replace("shape = ", "").replace(".", "_").strip() or "step"
            outl.append("_S(%r, shape)" % (tag + "_c%d" % ci))
    g = {"_S": _S}
    exec(compile("\n".join(outl), "code%d" % ci, "exec"), g)
print("stages", sorted(os.listdir(out)))
