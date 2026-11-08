#!/bin/zsh
# QA stills from a final MP4: qa.sh <turntable|closeup> <t1> <t2> ...  -> ../qa/<shot>/frame_XX.png
set -e
setopt null_glob
cd "${0:A:h}/.."
shot=$1; shift
mkdir -p qa/$shot; rm -f qa/$shot/frame_*.png
i=0
for t in "$@"; do
  i=$((i+1))
  ffmpeg -hide_banner -loglevel error -y -ss $t -i perseverance_${shot}_1080p.mp4 -frames:v 1 qa/$shot/frame_$(printf %02d $i).png
done
ffmpeg -hide_banner -loglevel error -y -framerate 1 -i qa/$shot/frame_%02d.png \
  -vf "scale=960:-1,tile=2x$(( (i + 1) / 2 )):padding=14:margin=14:color=0xFF2BD6" -frames:v 1 -q:v 3 qa/$shot/_sheet.jpg
echo "qa/$shot: $i stills"
