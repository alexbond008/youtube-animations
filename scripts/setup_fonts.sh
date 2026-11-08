#!/usr/bin/env bash
# Fonts aren't duplicated in every animation folder; this copies the shared OFL set into each src/fonts.
set -euo pipefail
cd "$(dirname "$0")/.."
for src in videos/*/*/src; do mkdir -p "$src/fonts" && cp fonts/* "$src/fonts/"; done
echo "fonts copied into $(ls -d videos/*/*/src | wc -l | tr -d ' ') animations"
