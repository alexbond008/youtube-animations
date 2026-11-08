#!/bin/zsh
# Render both Perseverance shots back to back (never two Blender renders at once), then encode.
#   FRESH=1 ./render_all.sh      # wipe old frames first
#   RENDER_DEVICE=CPU ./render_all.sh   # fallback if Metal hangs
set -e
cd "${0:A:h}"
SAMPLES=${SAMPLES:-128}
if [[ "$FRESH" == "1" ]]; then rm -rf ../frames/turntable ../frames/closeup; fi
[[ -f bg_calib.json ]] || ./blender.sh calib_bg.py
echo "[render_all] turntable start $(date +%T)"
./blender.sh turntable.py -- --samples $SAMPLES
echo "[render_all] closeup start $(date +%T)"
./blender.sh closeup.py -- --samples $SAMPLES
echo "[render_all] renders done $(date +%T)"
./encode.sh
echo "[render_all] all done $(date +%T)"
