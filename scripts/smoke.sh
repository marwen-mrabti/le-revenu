#!/bin/sh
# Smoke test of a deployed stack: ./scripts/smoke.sh https://web.example https://cms.example
# Checks what a reviewer meets first: health, the list with its demo data, login, forgot-password,
# and that the revalidation webhook refuses a call without its secret. Exit 1 on the first failure.
set -eu

WEB=${1:?web url}
CMS=${2:?cms url}
WEB=${WEB%/}
CMS=${CMS%/}

fail() { echo "FAIL: $1"; exit 1; }
status() { curl -s -o "${3:-/dev/null}" -w '%{http_code}' "$@"; }

printf 'cms health        '
[ "$(status "$CMS/_health")" = 204 ] || fail "$CMS/_health is not 204"
echo ok

printf 'cms categories    '
curl -sf "$CMS/api/categories" | grep -q '"documentId"' || fail "categories answer no JSON"
echo ok

printf 'web list          '
out=$(mktemp)
[ "$(status "$WEB/discussions" -o "$out")" = 200 ] || fail "$WEB/discussions is not 200"
links=$(grep -o 'href="/discussions/[^"?]*"' "$out" | sort -u | wc -l | tr -d ' ')
[ "$links" -ge 10 ] || fail "only $links discussion links on the first page"
echo "ok ($links links)"

printf 'web login alice   '
code=$(status -X POST "$WEB/api/auth/login" -H "Origin: $WEB" -H 'Content-Type: application/json' \
  -d '{"identifier":"alice","password":"Password123!"}')
[ "$code" = 200 ] || fail "login answered $code"
echo ok

printf 'web forgot-pass   '
code=$(status -X POST "$WEB/api/auth/forgot-password" -H "Origin: $WEB" -H 'Content-Type: application/json' \
  -d '{"email":"nobody@nowhere.test"}')
[ "$code" = 200 ] || fail "forgot-password answered $code"
echo ok

printf 'webhook guarded   '
code=$(status -X POST "$WEB/api/revalidate" -H 'Content-Type: application/json' -d '{}')
[ "$code" = 401 ] || fail "revalidate without secret answered $code"
echo ok

rm -f "$out"
echo "all good"
