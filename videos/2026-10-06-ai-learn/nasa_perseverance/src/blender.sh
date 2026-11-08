#!/bin/zsh
# Run Blender in the background at low priority, but only when no other Blender is running
# (spec: never run two Blender renders at once). Usage: ./blender.sh script.py -- [args]
B=/Applications/Blender.app/Contents/MacOS/Blender
while pgrep -f "Blender.app/Contents/MacOS/Blender" >/dev/null; do
  echo "[blender.sh] another Blender is running; waiting 30 s..." >&2
  sleep 30
done
exec nice -n 10 "$B" -b --factory-startup -P "$@"
