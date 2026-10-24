#!/usr/bin/env bash
# Starts the app on a throwaway database and checks sign-up, login, logout,
# password reset and admin access through the API. Used by CI; run locally with:
#   bash scripts/smoke-test.sh
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"; PORT=3999; B="http://127.0.0.1:$PORT"
DATA_DIR="$TMP" COOKIE_SECURE=false PORT=$PORT ADMIN_EMAILS=boss@example.com \
  node --disable-warning=ExperimentalWarning server.js > "$TMP/log" 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null; rm -rf "$TMP"' EXIT
for i in $(seq 1 30); do curl -fs "$B/api/site" >/dev/null && break; sleep 0.3; done
J='Content-Type: application/json'; M="$TMP/m"; A="$TMP/a"
fail(){ echo "FAIL: $1"; cat "$TMP/log"; exit 1; }
has(){ echo "$1" | grep -q "$2" || fail "$3 (got: $1)"; }

r=$(curl -s -c "$M" -H "$J" -d '{"name":"Maya","email":"maya@example.com","password":"password123"}' "$B/api/auth/signup")
has "$r" '"admin":false' "first non-admin signup must not be admin"
r=$(curl -s -H "$J" -d '{"name":"Maya","email":"maya@example.com","password":"password123"}' "$B/api/auth/signup")
has "$r" 'already exists' "duplicate signup rejected"
r=$(curl -s -b "$M" "$B/api/me"); has "$r" 'maya@example.com' "session cookie works"
r=$(curl -s -b "$M" -X POST "$B/api/auth/logout"); has "$r" '"ok":true' "logout"
r=$(curl -s -b "$M" "$B/api/me"); has "$r" '"user":null' "signed out after logout"
r=$(curl -s -H "$J" -d '{"email":"maya@example.com","password":"wrong-pass"}' "$B/api/auth/login"); has "$r" 'match' "wrong password rejected"
r=$(curl -s -c "$M" -H "$J" -d '{"email":"MAYA@example.com","password":"password123"}' "$B/api/auth/login"); has "$r" 'maya@example.com' "login (case-insensitive email)"
code=$(curl -s -o /dev/null -w '%{http_code}' -b "$M" "$B/api/admin/members"); [ "$code" = 403 ] || fail "member blocked from admin ($code)"
r=$(curl -s -c "$A" -H "$J" -d '{"name":"Boss","email":"boss@example.com","password":"password123"}' "$B/api/auth/signup")
has "$r" '"admin":true' "ADMIN_EMAILS signup is admin"
MID=$(curl -s -b "$A" "$B/api/admin/members" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).members.find(m=>m.email==="maya@example.com").id))')
LINK=$(curl -s -b "$A" -X POST "$B/api/admin/members/$MID/reset" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).link))')
TOKEN="${LINK##*reset=}"; [ -n "$TOKEN" ] || fail "admin reset link"
r=$(curl -s -H "$J" -d "{\"token\":\"$TOKEN\",\"password\":\"brandnew99\"}" "$B/api/auth/reset"); has "$r" 'maya@example.com' "reset with link"
r=$(curl -s -b "$M" "$B/api/me"); has "$r" '"user":null' "old sessions ended after reset"
r=$(curl -s -H "$J" -d "{\"token\":\"$TOKEN\",\"password\":\"again12345\"}" "$B/api/auth/reset"); has "$r" 'expired' "reset link works only once"
r=$(curl -s -H "$J" -d '{"email":"maya@example.com","password":"brandnew99"}' "$B/api/auth/login"); has "$r" 'maya@example.com' "login with new password"
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Origin: https://evil.example' -H "$J" -d '{}' "$B/api/auth/login"); [ "$code" = 403 ] || fail "cross-site post blocked ($code)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$B/"); [ "$code" = 200 ] || fail "home page ($code)"
for u in /looks /looks/navysuit /hairstyles /hairstyles/quiff /occasions /occasions/wedding /about /contact /privacy /terms /robots.txt /sitemap.xml /site.webmanifest /favicon.ico; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$B$u"); [ "$code" = 200 ] || fail "$u should be 200 ($code)"
done
for u in /looks/nope /hairstyles/nope /occasions/__proto__ /no/such/page; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$B$u"); [ "$code" = 404 ] || fail "$u should be 404 ($code)"
done
r=$(curl -s "$B/"); has "$r" 'rel="canonical"' "home has canonical"; has "$r" 'application/ld+json' "home has structured data"; has "$r" 'href="/privacy"' "home links to privacy"
r=$(curl -s "$B/sitemap.xml"); has "$r" '/looks/navysuit</loc>' "sitemap lists looks"
has "$r" '/hairstyles/quiff</loc>' "sitemap lists hairstyles"
r=$(curl -s -b "$A" -X PUT -H "$J" -d '{"vibe":"western","bt":"athletic","face":"square","htype":"wavy","occ":["office"]}' "$B/api/profile"); has "$r" '"face":"square"' "profile saves face shape"; has "$r" '"htype":"wavy"' "profile saves hair type"
r=$(curl -s -d 'name=Priya&email=priya@example.com&topic=General+question&message=Lovely+guide%2C+thank+you!' "$B/contact"); has "$r" 'Thank you' "contact form"
r=$(curl -s -b "$A" "$B/api/admin/messages"); has "$r" 'priya@example.com' "admin sees contact message"
echo "All smoke tests passed."
