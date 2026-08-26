#!/usr/bin/env bash
# HOKAGE — local dev server. Usage: ./serve.sh [port]
PORT="${1:-8000}"
echo "火 HOKAGE running at http://localhost:$PORT  (ctrl-C to stop)"
python3 -m http.server "$PORT"
