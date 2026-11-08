#!/bin/zsh
# Encode the Blender PNG sequences -> final MP4s: credit baked in (src/credit_overlay.png),
# 1 s clean hold (last frame cloned x30), H.264 CRF 14, 29.97 fps, BT.709 tags.
#   ./encode.sh [turntable] [closeup]      (default: both)
set -e
cd "${0:A:h}/.."
[[ -f src/credit_overlay.png ]] || node src/make_credit.mjs src/credit_overlay.png
shots=("$@"); (( $#shots )) || shots=(turntable closeup)
for shot in $shots; do
  dir=frames/$shot
  n=$(ls $dir/f_*.png 2>/dev/null | wc -l | tr -d ' ')
  [[ $n -gt 0 ]] || { echo "no frames in $dir"; exit 1; }
  out=perseverance_${shot}_1080p.mp4
  ffmpeg -hide_banner -loglevel error -y -framerate 30000/1001 -start_number 1 -i $dir/f_%04d.png \
    -i src/credit_overlay.png \
    -filter_complex "[0:v][1:v]overlay=0:0:format=rgb,tpad=stop_mode=clone:stop=30,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv[v]" \
    -map "[v]" -c:v libx264 -preset slow -crf 14 -profile:v high \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
    -r 30000/1001 -movflags +faststart -an $out
  echo "$out: $n rendered frames + 30 hold -> $(ffprobe -v error -show_entries format=duration -of csv=p=0 $out) s"
done
