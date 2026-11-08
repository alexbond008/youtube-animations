# p3_fly_home: point 3 intro, flying home

AI layer style. 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s. Planes keep looping along the arcs, rings pulse and the £ tag sways to the end.
Map: dotted land from Natural Earth 110m (world-atlas npm package, public domain), simple equirectangular projection, no country labels. Unlabelled homes are generic (Iberia, West Africa, Gulf, South Asia).

## p3_fly_home_1080p.mp4 (21.0 s = 20.0 s anim + 1 s hold)
- 0.0 dotted map zoomed on Europe; UK dots blue; 0.3 blue "Uni" pin; 0.9 "Lectures" chip
- 4.6–7.0 camera eases out to the wider map (the only camera move; static before and after)
- 5.2 home pins light up (Poland first, then +0.15 s each); 5.4 "Home (PL)" label
- 8.5–9.2 house icons pop at each home; 8.9 "Family" legend chip
- 11.3 dashed flight arcs draw from the Uni pin to each home (staggered to ~12.0) with plane glyphs travelling and looping
- 12.3 Poland arc, plane, house, label and dots turn orange; other arcs dim
- 16.3 "£" price tag on the Poland arc wobbles; 16.5 "Students are broke" chip
- 18.1 "Lectures" chip greys out with a red strike-through

## Re-render
```
cd src
node make_dots.mjs   # regenerates dots.js (needs world-atlas + topojson-client, installed here)
nice -n 10 node render.mjs map.html 20.0 ../p3_fly_home_1080p.mp4 ../qa 1.0,6.0,9.6,12.8,17.0,19.6
```
