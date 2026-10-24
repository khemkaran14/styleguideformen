#!/usr/bin/env bash
# Deploy a new version. From the cloned project folder on the server run:
#   sudo bash deploy/update.sh
# It pulls the latest code from GitHub (if this is a git checkout), backs up the
# database, copies the files into place and restarts the app.
set -euo pipefail
APP_DIR=/var/www/styleguidemen
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
if [ -d "$SRC_DIR/.git" ]; then
  echo "==> Pulling the latest code"
  OWNER="$(stat -c %U "$SRC_DIR")"
  sudo -u "$OWNER" git -C "$SRC_DIR" pull --ff-only
fi
echo "==> Backing up the database"
sudo -u styleguidemen bash -c "cd $APP_DIR && DATA_DIR=/var/lib/styleguidemen node --disable-warning=ExperimentalWarning scripts/backup.js" || true
echo "==> Installing the new version"
rsync -a --delete --exclude node_modules --exclude data --exclude '.git' "$SRC_DIR"/ "$APP_DIR"/
cd "$APP_DIR" && npm ci --omit=dev --no-audit --no-fund
chown -R styleguidemen:styleguidemen "$APP_DIR"
systemctl restart styleguidemen
sleep 1
PORT="$(grep -E '^PORT=' /etc/styleguidemen.env | cut -d= -f2)"
if curl -fsS "http://127.0.0.1:${PORT:-3011}/api/site" >/dev/null; then
  echo "Updated. Your members and saved looks were kept, and a backup was taken first."
else
  echo "The app didn't come back up. Check: journalctl -u styleguidemen -n 50"; exit 1
fi
