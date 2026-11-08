#!/bin/bash
# usage: ./render.sh [LinReg|MatrixCNN]   (default both, both variants)
cd "$(dirname "$0")"
render() { # scene variant outname W H
  local scene=$1 var=$2 name=$3 w=$4 h=$5
  rm -rf media/videos
  VARIANT=$var nice -n 10 .venv/bin/manim -t -r $w,$h --fps 30 --disable_caching -o raw scenes.py $scene >/dev/null 2>&1
  local f; f=$(find media/videos -name 'raw.mov' | head -1)
  nice -n 10 ffmpeg -v error -y -i "$f" -r 30000/1001 -vf "format=yuv420p" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an ../${name}_inter.mp4
}
for s in ${@:-LinReg MatrixCNN}; do
  if [ $s = LinReg ]; then n=p1_linreg; else n=p1_matrix_cnn; fi
  render $s h ${n}_1080p 1920 1080
  render $s v ${n}_vertical_1080x1350 1080 1350
done
