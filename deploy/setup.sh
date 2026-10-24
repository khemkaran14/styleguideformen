#!/usr/bin/env bash
# One-time setup for The Ultimate Style Guide for Men on an Ubuntu 22.04/24.04 VPS (e.g. Hostinger KVM).
# Run from inside the cloned project folder:
#   sudo DOMAIN=style.example.com EMAIL=you@example.com ADMIN_EMAIL=you@example.com bash deploy/setup.sh
# Optional, for "Forgot password" emails (Hostinger email shown):
#   SMTP_HOST=smtp.hostinger.com SMTP_PORT=465 SMTP_USER=hello@example.com SMTP_PASS='mailbox password'
# Optional site details: SITE_NAME='Signora Styles' CONTACT_EMAIL=hello@example.com GOOGLE_SITE_VERIFICATION=code
# Safe to run again: it keeps the database and any optional settings already saved.
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=style.livelifetricks.com}"
EMAIL="${EMAIL:?Set EMAIL (used for the free HTTPS certificate notices)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-$EMAIL}"
PORT="${PORT:-3011}"
APP_DIR=/var/www/styleguidemen
DATA_DIR=/var/lib/styleguidemen
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
echo "==> Setting up $DOMAIN"

# Some VPS templates ship Apache or OpenLiteSpeed on port 80, which would block Nginx.
if command -v ss >/dev/null; then
  BUSY="$(ss -ltnp 2>/dev/null | awk '$4 ~ /:80$/' | grep -v nginx || true)"
  if [ -n "$BUSY" ]; then
    echo "Port 80 is already used by another web server:"; echo "$BUSY"
    echo "Stop it first (e.g. 'sudo systemctl disable --now apache2'), or use a plain Ubuntu VPS template."
    exit 1
  fi
fi

echo "==> Installing Node.js 22, Nginx and Certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx rsync
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<13)){console.error("Node 22.13+ needed, found "+process.version);process.exit(1)}'

echo "==> Creating app user and folders"
id styleguidemen >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin styleguidemen
mkdir -p "$APP_DIR" "$DATA_DIR"
rsync -a --delete --exclude node_modules --exclude data --exclude '.git' "$SRC_DIR"/ "$APP_DIR"/
cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund
chown -R styleguidemen:styleguidemen "$APP_DIR" "$DATA_DIR"
chmod 750 "$DATA_DIR"

echo "==> Writing settings to /etc/styleguidemen.env"
OLD_ENV=""
[ -f /etc/styleguidemen.env ] && OLD_ENV="$(cat /etc/styleguidemen.env)"
cat > /etc/styleguidemen.env <<ENV
NODE_ENV=production
PORT=$PORT
DATA_DIR=$DATA_DIR
ADMIN_EMAILS=$ADMIN_EMAIL
COOKIE_SECURE=true
PUBLIC_URL=https://$DOMAIN
ENV
# Optional settings: use the value given now, otherwise keep the one saved last time.
[ -n "${SMTP_HOST:-}" ] && { SMTP_PORT="${SMTP_PORT:-465}"; MAIL_FROM="${MAIL_FROM:-${SMTP_USER:-}}"; }
for KEY in SITE_NAME CONTACT_EMAIL GOOGLE_SITE_VERIFICATION SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS MAIL_FROM; do
  VAL="${!KEY:-}"
  if [ -n "$VAL" ]; then
    printf '%s=%s\n' "$KEY" "$VAL" >> /etc/styleguidemen.env
  else
    printf '%s\n' "$OLD_ENV" | grep -E "^$KEY=" >> /etc/styleguidemen.env || true
  fi
done
chown root:styleguidemen /etc/styleguidemen.env
chmod 640 /etc/styleguidemen.env

echo "==> Creating the background service"
cat > /etc/systemd/system/styleguidemen.service <<UNIT
[Unit]
Description=The Ultimate Style Guide for Men
After=network.target

[Service]
Type=simple
User=styleguidemen
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/styleguidemen.env
ExecStart=/usr/bin/node --disable-warning=ExperimentalWarning server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now styleguidemen
systemctl restart styleguidemen

echo "==> Configuring Nginx for $DOMAIN"
sed -e "s#__DOMAIN__#$DOMAIN#g" -e "s#__PORT__#$PORT#g" -e "s#__APP_DIR__#$APP_DIR#g" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/styleguidemen.conf
ln -sf /etc/nginx/sites-available/styleguidemen.conf /etc/nginx/sites-enabled/styleguidemen.conf
nginx -t
systemctl reload nginx

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then ufw allow 'Nginx Full' || true; fi

echo "==> Checking that $DOMAIN points at this server"
MYIP="$(curl -fsS4 https://api.ipify.org || true)"
DNSIP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
if [ -n "$MYIP" ] && [ "$MYIP" != "$DNSIP" ]; then
  echo "WARNING: $DOMAIN resolves to '${DNSIP:-nothing}', but this server is $MYIP."
  echo "Add an A record for the subdomain pointing at $MYIP, wait a few minutes, then run this script again."
fi

echo "==> Getting a free HTTPS certificate"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "==> Daily database backup at 03:15"
cat > /etc/cron.d/styleguidemen-backup <<CRON
15 3 * * * styleguidemen cd $APP_DIR && DATA_DIR=$DATA_DIR /usr/bin/node --disable-warning=ExperimentalWarning scripts/backup.js >> $DATA_DIR/backup.log 2>&1
CRON

sleep 1
if curl -fsS "http://127.0.0.1:$PORT/api/site" >/dev/null; then
  echo ""
  echo "Done! Open https://$DOMAIN"
  echo "Create your account with $ADMIN_EMAIL and you'll be the admin."
else
  echo "The app didn't respond. Check: journalctl -u styleguidemen -n 50"
fi
