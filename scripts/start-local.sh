#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  . "$ROOT_DIR/.env"
  set +a
fi

if [ -f "$ROOT_DIR/app/.env" ]; then
  set -a
  . "$ROOT_DIR/app/.env"
  set +a
fi

for port in 3000 3001 8000; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  fi

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" || true)"
    if [ -n "$pids" ]; then
      echo "Stopping stale listener on port $port: $pids"
      kill $pids || true
    fi
  fi
done

pkill -f "next dev --hostname 127.0.0.1 --port 3001" >/dev/null 2>&1 || true
pkill -f "next-server.*3001" >/dev/null 2>&1 || true
pkill -f "uvicorn app.main:app --host 127.0.0.1 --port 8000" >/dev/null 2>&1 || true

if [ -f "$ROOT_DIR/spp-frontend/.env.local" ]; then
  set -a
  . "$ROOT_DIR/spp-frontend/.env.local"
  set +a
fi

if [ ! -d "$ROOT_DIR/venv" ]; then
  echo "Virtual environment not found at $ROOT_DIR/venv"
  exit 1
fi

echo "Starting backend on http://127.0.0.1:8000"
(
  cd "$ROOT_DIR"
  source "$ROOT_DIR/venv/bin/activate"
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/ >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if [ ! -f "$ROOT_DIR/spp-frontend/.env.local" ] && [ -f "$ROOT_DIR/spp-frontend/.env.local.example" ]; then
  cp "$ROOT_DIR/spp-frontend/.env.local.example" "$ROOT_DIR/spp-frontend/.env.local"
fi

echo "Starting frontend on http://127.0.0.1:3001"
(
  cd "$ROOT_DIR/spp-frontend"
  npm run dev -- --hostname 127.0.0.1 --port 3001
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
