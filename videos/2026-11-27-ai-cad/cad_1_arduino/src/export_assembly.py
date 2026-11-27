# Export run 1's final enclosure (verbatim geometry) + the official-dims Uno stand-in to STL for Blender.
# Lid is moved from Claude's exploded z=40 down onto the walls (z=24) - a pure translation for the assembled view.
# freecadcmd export_assembly.py <run_dir> <board_dir> <out_dir>
import sys, os, FreeCAD as App, Part, Mesh
run, bd, out = sys.argv[-3:]
V = App.Vector
def stl(shape, name):
    m = Mesh.Mesh(); m.addFacets(shape.tessellate(0.03)); m.write(os.path.join(out, name + ".stl"))
base = Part.Shape(); base.importBrep(os.path.join(run, "stages/6_holes.brep"))
lid = Part.Shape(); lid.importBrep(os.path.join(run, "stages/7_lid.brep")); lid.translate(V(0, 0, 24 - 40))
stl(base, "base"); stl(lid, "lid")
for k in ("pcb", "usb", "jack", "headers", "chip"):
    s = Part.Shape(); s.importBrep(os.path.join(bd, "uno_%s.brep" % k)); s.translate(V(8.71, 8.83, 8.5)); stl(s, "uno_" + k)
print("ok")
