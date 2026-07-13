#!/usr/bin/env bash
set -euo pipefail

PROFILE_PATH="${PROFILE_PATH:-.codex/deploy-profile.json}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Deploy project update}"
SYNC_DB="${SYNC_DB:-}"
SKIP_BUILD="${SKIP_BUILD:-}"
REMOTE_DEPLOY="${REMOTE_DEPLOY:-}"
STAGE_PATHS="${STAGE_PATHS:-}"

if [[ ! -f "$PROFILE_PATH" ]]; then
  echo "Missing deploy profile: $PROFILE_PATH" >&2
  exit 1
fi

json_get() {
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const v=process.argv[2].split('.').reduce((o,k)=>o&&o[k],p); if (v !== undefined && v !== null) process.stdout.write(String(v));" "$PROFILE_PATH" "$1"
}

APP_SUBDIR="$(json_get app_subdir)"
GITHUB_REMOTE="$(json_get github_remote)"
HEALTH_PATH="$(json_get health_path)"
DATA_PATH="$(json_get data.sqlite_path || true)"
TRACK_SQLITE="$(json_get data.track_sqlite || true)"
SSH_TARGET="$(json_get server.ssh_target || true)"
SSH_PORT="$(json_get server.ssh_port || true)"
SERVER_PROJECT_DIR="$(json_get server.project_dir || true)"
SERVER_SCRIPT="$(json_get server.deploy_script || true)"

if [[ -z "$APP_SUBDIR" || -z "$GITHUB_REMOTE" ]]; then
  echo "Profile must include app_subdir and github_remote" >&2
  exit 1
fi

if [[ ! -d .git ]]; then
  git init
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$GITHUB_REMOTE"
else
  git remote add origin "$GITHUB_REMOTE"
fi

git branch -M main

if [[ -f "$APP_SUBDIR/package.json" && -z "$SKIP_BUILD" ]]; then
  (cd "$APP_SUBDIR" && npm run build)
fi

if [[ "$TRACK_SQLITE" == "true" && -n "$DATA_PATH" && -f "$DATA_PATH" ]]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DATA_PATH" 'PRAGMA wal_checkpoint(TRUNCATE);' || true
  fi
  git add -f "$DATA_PATH"
fi

if [[ -n "$STAGE_PATHS" ]]; then
  git add $STAGE_PATHS
else
  git add .
fi

if [[ "$TRACK_SQLITE" == "true" && -n "$DATA_PATH" ]]; then
  git reset -- "${DATA_PATH}-wal" "${DATA_PATH}-shm" 2>/dev/null || true
fi

if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "$COMMIT_MESSAGE"
fi

git push -u origin main

if [[ -n "$REMOTE_DEPLOY" ]]; then
  if [[ -z "$SSH_TARGET" || -z "$SERVER_PROJECT_DIR" || -z "$SERVER_SCRIPT" ]]; then
    echo "REMOTE_DEPLOY requires server.ssh_target, server.project_dir, and server.deploy_script" >&2
    exit 1
  fi
  PORT_ARG=()
  [[ -n "$SSH_PORT" ]] && PORT_ARG=(-p "$SSH_PORT")
  ssh "${PORT_ARG[@]}" "$SSH_TARGET" "cd '$SERVER_PROJECT_DIR' && bash '$SERVER_SCRIPT'"
fi

echo "Local deploy phase complete. Health path: ${HEALTH_PATH:-/login}"
