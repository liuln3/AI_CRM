#!/usr/bin/env bash
set -euo pipefail

PROFILE_PATH="${PROFILE_PATH:-.codex/deploy-profile.json}"
if [[ ! -f "$PROFILE_PATH" ]]; then
  echo "Missing deploy profile: $PROFILE_PATH" >&2
  exit 1
fi

json_get() {
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const v=process.argv[2].split('.').reduce((o,k)=>o&&o[k],p); if (v !== undefined && v !== null) process.stdout.write(String(v));" "$PROFILE_PATH" "$1"
}

APP_SUBDIR="$(json_get app_subdir)"
APP_PORT="$(json_get app_port)"
APP_NAME="$(json_get process.name)"
HEALTH_PATH="$(json_get health_path)"
DATA_PATH="$(json_get data.sqlite_path || true)"
SYNC_DB="${SYNC_DB:-}"

: "${APP_SUBDIR:?app_subdir required}"
: "${APP_PORT:?app_port required}"
: "${APP_NAME:?process.name required}"
HEALTH_PATH="${HEALTH_PATH:-/login}"

if [[ ! -d .git ]]; then
  echo "Run this script from the cloned repository root." >&2
  exit 1
fi

if [[ -n "$SYNC_DB" && -n "$DATA_PATH" && -f "$DATA_PATH" ]]; then
  mkdir -p "$(dirname "$DATA_PATH")/backups"
  cp "$DATA_PATH" "$(dirname "$DATA_PATH")/backups/$(basename "$DATA_PATH").$(date +%Y%m%d%H%M%S).bak"
fi

git pull --ff-only

cd "$APP_SUBDIR"

if command -v dnf >/dev/null 2>&1; then
  dnf install -y python3 make gcc gcc-c++ sqlite-devel >/dev/null 2>&1 || true
fi

if [[ -f package-lock.json ]]; then
  npm ci --no-audit || npm install --no-audit --registry=https://registry.npmmirror.com
else
  npm install --no-audit --registry=https://registry.npmmirror.com
fi

npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start npm --name "$APP_NAME" -- run start -- -H 0.0.0.0 -p "$APP_PORT"
pm2 save

sleep 2
curl -I "http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"
pm2 status "$APP_NAME"
