#!/bin/zsh
# Re-render this asset:  ./render.sh        (needs node, Google Chrome, ffmpeg; JOBS=3 parallel Chrome instances)
# 1. capture every frame of index.html at 3840x2160 (deterministic, t = frame/29.97)
# 2. Lanczos downscale to 1920x1080, H.264 CRF 14, bt709, 29.97 fps, no audio
# 3. export 6 QA stills from the final MP4 into ../qa/
set -e
cd "$(dirname "$0")"
NAME=$(basename "$(cd .. && pwd)")
FFMPEG=${FFMPEG:-/opt/homebrew/bin/ffmpeg}
JOBS=${JOBS:-3}
N=$(node capture.mjs --count)
SEQ=../_frames
if [[ -z "$ENCODE_ONLY" ]]; then          # ENCODE_ONLY=1 ./render.sh re-encodes existing ../_frames
  rm -rf $SEQ && mkdir -p $SEQ
  CH=$(( (N + JOBS - 1) / JOBS ))
  for (( a=0; a<N; a+=CH )); do nice -n 10 node capture.mjs --range $a:$((a+CH)) --out $SEQ & done
  wait
fi
COUNT=$(ls $SEQ | wc -l | tr -d ' ')
[[ $COUNT -eq $N ]] || { echo "expected $N frames, got $COUNT"; exit 1; }
nice -n 10 $FFMPEG -y -loglevel error -framerate 30000/1001 -i $SEQ/f_%05d.png \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv" \
  -c:v libx264 -profile:v high -preset slow -crf 14 -tune animation -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -r 30000/1001 -movflags +faststart -an ../${NAME}_1080p.mp4
rm -rf $SEQ
# QA stills (times in seconds, from QA_TIMES in index.html)
TIMES=$(node -e "const s=require('fs').readFileSync('index.html','utf8').match(/QA_TIMES\s*=\s*\[([^\]]*)\]/);console.log(s?s[1].replace(/\s/g,''):'')")
i=1
for t in ${(s:,:)TIMES}; do
  $FFMPEG -y -loglevel error -ss $t -i ../${NAME}_1080p.mp4 -frames:v 1 ../qa/frame_$(printf %02d $i).png
  i=$((i+1))
done
echo "-> ${NAME}_1080p.mp4 ($N frames)"
