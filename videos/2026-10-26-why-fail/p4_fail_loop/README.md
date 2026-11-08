# p4_fail_loop: point 4, "failure itself isn't the issue"

AI layer style. 1920x1080, 29.97 fps, H.264 CRF 14, bt709, no audio. Last frame held 1 s. Static camera (no drift/push-in). Spiral keeps rotating and tightening, needle settles, green path glows to the end.

## p4_fail_loop_1080p.mp4 (42.5 s = 41.5 s anim + 1 s hold)
- 0.0 title "Failure itself isn't the issue"; 4.6 "Sometimes it's just a lack of knowledge"; exits 8.2
- 8.8 "When you learn from it" + red "Fail" node; 9.3 arrow; 9.8 "Learn"
- 12.9 arrow; 13.5 "Pass" with drawn tick; 14.8 curved "Keep going" arrow up and right (label 15.0)
- 16.9 top path dims; "When you don't" label
- 19.3 "Mistake"; 21.1 "Don't learn"; 22.1 "Repeat"; 22.8 "Fail again"; 23.1–24.5 line drops into a tightening red spiral
- 24.7 red warning glow + warning triangle
- 28.5 velocity gauge appears; 29.0–30.6 needle swings from + into −; 30.8 "Negative velocity"
- 34.1 green "Learn" node brightens and pulses; 34.4–35.4 dashed green exit arrow from the spiral to "Learn"; 35.0 "Learn from it"
- 37.9 spiral's inner end greys and fades; "Drop out" label
- 39.8 green path returns to full brightness with a soft glow

## Re-render
```
cd src
nice -n 10 node render.mjs loop.html 41.5 ../p4_fail_loop_1080p.mp4 ../qa 5.5,15.6,23.4,31.5,36.0,40.8
```
