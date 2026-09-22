#!/usr/bin/env bash
set -euo pipefail

for port in 3001 8000; do
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" || true)"
    if [ -n "$pids" ]; then
      echo "Stopping $pids on port $port"
      kill $pids || true
    fi
  fi
done

echo "Local services stopped."
