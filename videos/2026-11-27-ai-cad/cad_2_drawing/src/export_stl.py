# BREP -> STL (fine tessellation). BREP=<in> STL=<out> freecadcmd export_stl.py
import os, Part, Mesh
s = Part.Shape(); s.importBrep(os.environ["BREP"])
m = Mesh.Mesh(); m.addFacets(s.tessellate(0.02)); m.write(os.environ["STL"]); print("ok", m.CountFacets)
