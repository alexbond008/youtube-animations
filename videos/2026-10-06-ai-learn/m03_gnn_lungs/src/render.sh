#!/usr/bin/env bash
# Re-render every variant of this asset to ../<name>[_variant]_1080p.mp4
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  ~/.local/bin/uv venv --python 3.12 .venv -q
  ~/.local/bin/uv pip install --python .venv/bin/python -q manim==0.21.0
fi
nice -n 10 .venv/bin/python render.py video --workers "${WORKERS:-3}" "$@"
