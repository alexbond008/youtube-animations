# Measure a finished enclosure: bounding boxes and every vertical cylindrical face (centre, radius, z-range).
# freecadcmd measure.py <file.FCStd>
import sys, FreeCAD as App
doc = App.openDocument(sys.argv[-1])
for o in doc.Objects:
    if not hasattr(o, "Shape") or o.Shape.isNull() or o.TypeId.startswith(("App::", "Sketcher::")): continue
    s = o.Shape; b = s.BoundBox
    print("OBJ", o.Name, o.Label, round(s.Volume, 1), [round(v, 2) for v in (b.XMin, b.YMin, b.ZMin, b.XMax, b.YMax, b.ZMax)], "solids", len(s.Solids))
    seen = set()
    for f in s.Faces:
        su = f.Surface
        if su.__class__.__name__ != "Cylinder": continue
        ax = su.Axis
        if abs(abs(ax.z) - 1) > 1e-3: continue
        c = su.Center; k = (round(c.x, 2), round(c.y, 2), round(su.Radius, 2))
        if k in seen: continue
        seen.add(k)
        print("  CYL", k, "z", round(f.BoundBox.ZMin, 2), round(f.BoundBox.ZMax, 2))
