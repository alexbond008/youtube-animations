# Measure Claude's shaft: every cylindrical face along the X axis (diameter, x-start, x-end) + overall extents.
# freecadcmd measure_shaft.py <FCStd>
import sys, FreeCAD as App
doc = App.openDocument(sys.argv[-1])
s = [o for o in doc.Objects if hasattr(o, "Shape") and not o.Shape.isNull() and o.Shape.Solids][-1].Shape
b = s.BoundBox
print("NAME", [o.Name for o in doc.Objects], "len", round(b.XLength, 3), "maxdia", round(2 * max(b.YMax, b.ZMax), 3), "vol", round(s.Volume, 1))
rows = {}
for f in s.Faces:
    su = f.Surface
    if su.__class__.__name__ == "Cylinder" and abs(abs(su.Axis.x) - 1) < 1e-6:
        k = round(2 * su.Radius, 3); x0, x1 = round(f.BoundBox.XMin, 3), round(f.BoundBox.XMax, 3)
        rows.setdefault((x0, x1, k), 0); rows[(x0, x1, k)] += 1
for (x0, x1, d) in sorted(rows): print("CYL dia %7.3f  x %8.3f .. %8.3f  len %7.3f" % (d, x0, x1, x1 - x0))
