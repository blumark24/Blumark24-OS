#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Final end-to-end test: create employee via /api/admin/create-user
#
# Usage (production):
#   SUPABASE_URL=https://xxx.supabase.co \
#   ANON_KEY=eyJ... \
#   SERVICE_KEY=eyJ... \
#   ADMIN_EMAIL=blumark24@gmail.com \
#   ADMIN_PASS=YourPass \
#   APP_URL=https://blumrk24.online \
#   bash scripts/test-create-employee.sh
#
# Usage (local dev):
#   source .env.local   # sets NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#   SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY SERVICE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
#   ADMIN_EMAIL=... ADMIN_PASS=... APP_URL=http://localhost:3000 \
#   bash scripts/test-create-employee.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:?set SUPABASE_URL}"
ANON_KEY="${ANON_KEY:?set ANON_KEY}"
SERVICE_KEY="${SERVICE_KEY:?set SERVICE_KEY}"
ADMIN_EMAIL="${ADMIN_EMAIL:?set ADMIN_EMAIL}"
ADMIN_PASS="${ADMIN_PASS:?set ADMIN_PASS}"
APP_URL="${APP_URL:-http://localhost:3000}"

# Test-row data — every field overridable via env so QA can pin a specific case
TEST_EMAIL="${TEST_EMAIL:-j3b.sa.2030+test01@gmail.com}"
TEST_PASS="${TEST_PASS:-Test@123456}"
TEST_NAME="${TEST_NAME:-اختبار حفظ}"
TEST_ROLE="${TEST_ROLE:-super_admin}"
TEST_DEPT="${TEST_DEPT:-الإدارة}"
TEST_PHONE="${TEST_PHONE:-0551673433}"
TEST_SALARY="${TEST_SALARY:-0}"
TEST_STATUS="${TEST_STATUS:-نشط}"

PASS=0; FAIL=0

ok()   { echo "  ✅ PASS — $1"; ((PASS++)); }
fail() { echo "  ❌ FAIL — $1"; ((FAIL++)); }

echo ""
echo "════════════════════════════════════════════"
echo "  Blumark24 Employee Creation — Final Test  "
echo "════════════════════════════════════════════"
echo "  App:   $APP_URL"
echo "  Admin: $ADMIN_EMAIL"
echo "  Test:  $TEST_EMAIL / $TEST_ROLE"
echo ""

# ── STEP 1: Sign in as admin ─────────────────────────────────────────
echo "▶ Step 1: Sign in as admin"
SIGNIN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

ACCESS_TOKEN=$(echo "$SIGNIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")
if [ -z "$ACCESS_TOKEN" ]; then
  fail "Admin login failed"
  echo "  Response: $SIGNIN"
  exit 1
fi
ok "Admin signed in, token obtained"

# ── STEP 2: Clean up previous test user ──────────────────────────────
echo ""
echo "▶ Step 2: Remove existing test user (clean slate)"
EXISTING=$(curl -s \
  "$SUPABASE_URL/rest/v1/employees?email=eq.$TEST_EMAIL&select=id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
EXIST_ID=$(echo "$EXISTING" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['id'] if rows else '')" 2>/dev/null || echo "")
if [ -n "$EXIST_ID" ]; then
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/employees?id=eq.$EXIST_ID" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: return=minimal" > /dev/null
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/profiles?id=eq.$EXIST_ID" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Prefer: return=minimal" > /dev/null
  curl -s -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$EXIST_ID" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" > /dev/null
  echo "  ℹ️  Removed existing user $EXIST_ID"
else
  echo "  ℹ️  No existing test user found — clean"
fi

# ── STEP 3: Create employee via Next.js API ───────────────────────────
echo ""
echo "▶ Step 3: POST $APP_URL/api/admin/create-user"
CREATE_RESP=$(curl -s -w "\n__STATUS__%{http_code}" -X POST \
  "$APP_URL/api/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"email\":      \"$TEST_EMAIL\",
    \"password\":   \"$TEST_PASS\",
    \"name\":       \"$TEST_NAME\",
    \"role\":       \"$TEST_ROLE\",
    \"department\": \"$TEST_DEPT\",
    \"phone\":      \"$TEST_PHONE\",
    \"salary\":     $TEST_SALARY,
    \"status\":     \"$TEST_STATUS\"
  }")

HTTP_STATUS=$(echo "$CREATE_RESP" | grep __STATUS__ | sed 's/__STATUS__//')
BODY=$(echo "$CREATE_RESP" | grep -v __STATUS__)
NEW_USER_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

echo "  HTTP $HTTP_STATUS"
echo "  Body: $BODY"

[ "$HTTP_STATUS" = "200" ] && ok "POST /api/admin/create-user returned HTTP 200 — no 400" \
                            || fail "POST returned HTTP $HTTP_STATUS (expected 200)"
[ -n "$NEW_USER_ID" ]      && ok "Response contains new userId: $NEW_USER_ID" \
                            || fail "No userId in response body"

if [ -z "$NEW_USER_ID" ]; then
  echo ""
  echo "Cannot continue without a valid user ID."
  echo "════════════════════════════════════════════"
  echo "  Results: $PASS passed / $FAIL failed"
  echo "  ⚠️  BLOCKED — fix the 400 first"
  echo "════════════════════════════════════════════"
  exit 1
fi

# ── STEP 4: Verify in auth.users ─────────────────────────────────────
echo ""
echo "▶ Step 4: Verify user in Supabase auth.users"
AUTH_ROW=$(curl -s \
  "$SUPABASE_URL/auth/v1/admin/users/$NEW_USER_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
AUTH_EMAIL=$(echo "$AUTH_ROW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('email',''))" 2>/dev/null || echo "")
[ "$AUTH_EMAIL" = "$TEST_EMAIL" ] && ok "User in auth.users with email=$AUTH_EMAIL" \
                                   || fail "User not found in auth.users (got: $AUTH_EMAIL)"

# ── STEP 5: Verify in employees table ────────────────────────────────
echo ""
echo "▶ Step 5: Verify row in employees table"
EMP_ROW=$(curl -s \
  "$SUPABASE_URL/rest/v1/employees?id=eq.$NEW_USER_ID&select=id,name,email,role,status" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
EMP_EMAIL=$(echo "$EMP_ROW" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['email'] if rows else '')" 2>/dev/null || echo "")
[ "$EMP_EMAIL" = "$TEST_EMAIL" ] && ok "Employee row exists in employees table" \
                                  || fail "Not found in employees table (got: $EMP_ROW)"

# ── STEP 6: Verify in profiles table ─────────────────────────────────
echo ""
echo "▶ Step 6: Verify row in profiles table"
PROF_ROW=$(curl -s \
  "$SUPABASE_URL/rest/v1/profiles?id=eq.$NEW_USER_ID&select=id,role,is_active" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
PROF_ROLE=$(echo "$PROF_ROW" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['role'] if rows else '')" 2>/dev/null || echo "")
[ "$PROF_ROLE" = "$TEST_ROLE" ] && ok "Profile row exists with role=$PROF_ROLE" \
                                 || fail "Profile missing or wrong role (got: $PROF_ROW)"

# ── STEP 7: Login as new employee ────────────────────────────────────
echo ""
echo "▶ Step 7: Login as the new employee ($TEST_EMAIL)"
LOGIN_RESP=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
EMP_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")
[ -n "$EMP_TOKEN" ] && ok "New employee can log in (Supabase Auth returns a session token)" \
                     || fail "Login failed for new employee: $(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description', d))" 2>/dev/null)"

# ── SUMMARY ──────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "  Results: $PASS / $TOTAL tests passed"
if [ $FAIL -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED"
else
  echo "  ⚠️  $FAIL TEST(S) FAILED"
fi
echo "════════════════════════════════════════════"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1
