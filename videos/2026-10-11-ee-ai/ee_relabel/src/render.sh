#!/bin/bash
# usage: ./render.sh  -> renders all 4 variants into ../ ; needs ffmpeg
cd "$(dirname "$0")"
render() { # scene variant outname W H
  local scene=$1 var=$2 name=$3 w=$4 h=$5
  rm -rf media/videos
  VARIANT=$var nice -n 10 .venv/bin/manim -t -r $w,$h --fps 30 --disable_caching -o raw scenes.py $scene >/dev/null 2>&1
  local f; f=$(find media/videos -name 'raw.mov' | head -1)
  nice -n 10 ffmpeg -v error -y -i "$f" -r 30000/1001 -vf "format=yuv420p" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an ../${name}_inter.mp4
}
render Relabel h ee_relabel_1080p 1920 1080
render SideBySide h ee_relabel_sidebyside_1080p 1920 1080


render Relabel v ee_relabel_vertical_1080x1350 1080 1350
render SideBySide v ee_relabel_sidebyside_vertical_1080x1350 1080 1350
