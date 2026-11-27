# Simple Arduino Uno Rev3 stand-in built from the official Eagle board file numbers
# (A000066 UNO-TH_Rev3e.brd: outline layer 20, 4 x drill 3.2 holes, X1 jack, X2 USB-B, headers, ATmega DIP).
# Board frame: origin = board corner (0,0), PCB bottom at z = 0, units mm.
# freecadcmd uno_board.py <outdir>
import sys, os, FreeCAD as App, Part, Mesh
out = sys.argv[-1]; os.makedirs(out, exist_ok=True)
V = App.Vector
T = 1.6
pts = [(0,1),(0,52.34),(1,53.34),(64.516,53.34),(66.04,51.816),(66.04,40.386),(68.58,37.846),(68.58,5.08),(66.04,2.54),(66.04,1),(65.04,0),(1,0),(0,1)]
w = Part.makePolygon([V(x,y,0) for x,y in pts]); pcb = Part.Face(w).extrude(V(0,0,T))
HOLES = [(66.04,35.56),(66.04,7.62),(15.24,50.8),(13.97,2.54)]
for x,y in HOLES: pcb = pcb.cut(Part.makeCylinder(1.6, 5, V(x,y,-1)))
def box(x0,x1,y0,y1,z0,z1): return Part.makeBox(x1-x0, y1-y0, z1-z0, V(x0,y0,z0))
usb  = box(-6.34, 9.41, 32.2, 44.0, T, T+10.9)          # X2 PN61729 footprint, overhangs the edge 6.3 mm
jack = box(-1.80, 11.68, 3.30, 12.29, T, T+11.0)        # X1 2.1 mm DC jack
hdr = [box(30.226-12.7, 30.226+12.7, 50.8-1.27, 50.8+1.27, T, T+8.5),   # IOH 10-pin
       box(54.61-10.16, 54.61+10.16, 50.8-1.27, 50.8+1.27, T, T+8.5),   # IOL 8-pin
       box(36.83-10.16, 36.83+10.16, 2.54-1.27, 2.54+1.27, T, T+8.5),   # POWER 8-pin
       box(57.15-7.62, 57.15+7.62, 2.54-1.27, 2.54+1.27, T, T+8.5)]     # AD 6-pin
chip = box(46.355-18.0, 46.355+18.0, 16.383-3.6, 16.383+3.6, T, T+4.2) # ATmega328P DIP-28
icsp = box(64.897-2.54, 64.897+2.54, 27.94-3.81, 27.94+3.81, T, T+8.5)
parts = {"pcb": pcb, "usb": usb, "jack": jack, "headers": Part.makeCompound(hdr + [icsp]), "chip": chip}
for k, s in parts.items():
    m = Mesh.Mesh(); m.addFacets(s.tessellate(0.05)); m.write(os.path.join(out, "uno_%s.stl" % k))
    s.exportBrep(os.path.join(out, "uno_%s.brep" % k))
print("ok", {k: (round(v.BoundBox.XMin,2), round(v.BoundBox.XMax,2)) for k, v in parts.items()})
