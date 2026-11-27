# Place the official-dims Uno stand-in in a run's enclosure and test it.
# freecadcmd fitcheck_calc.py <FCStd> <baseName> <ox> <oy> <oz> <boarddir> [mirror_y=0]
import sys, FreeCAD as App, Part
a = sys.argv[-7:] if len(sys.argv) >= 8 else None
f, bn, ox, oy, oz, bd, my = sys.argv[-7], sys.argv[-6], *map(float, sys.argv[-5:-2]), sys.argv[-2], int(sys.argv[-1])
doc = App.openDocument(f); base = doc.getObject(bn).Shape
V = App.Vector
def ld(k):
    s = Part.Shape(); s.importBrep(f"{bd}/uno_{k}.brep"); s = s.copy()
    s.translate(V(ox, oy, oz)); return s
res = {}
for k in ("pcb", "usb", "jack", "headers", "chip"):
    s = ld(k); res[k + "_collision_mm3"] = round(s.common(base).Volume, 1)
# is the path out of the box in front of each connector open? sweep its cross-section 15 mm in -x
for k in ("usb", "jack"):
    s = ld(k); b = s.BoundBox
    tunnel = Part.makeBox(ox + 20, b.YLength - 1, b.ZLength - 1, V(-20, b.YMin + 0.5, b.ZMin + 0.5))
    res[k + "_blocked_mm3_of"] = (round(tunnel.common(base).Volume, 1), round(tunnel.Volume, 1))
print("FIT", res)
