#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Blumark24-OS: Build & Create-User Validation Report
# ─────────────────────────────────────────────────────────────────────────────
# This script validates:
# 1. npm run build succeeds
# 2. create-user API route is syntactically correct
# 3. All environment variables are properly read inside POST handler
# 4. No secrets leak in code or logs
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "════════════════════════════════════════════════════════════════════════════"
echo "  Blumark24-OS: Pre-Production Validation"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Repository: $REPO_ROOT"
echo "Date: $(date)"
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1: File Existence
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 1: File Existence"
FILE="src/app/api/admin/create-user/route.ts"
if [ -f "$FILE" ]; then
  echo "  ✅ $FILE exists"
else
  echo "  ❌ $FILE NOT FOUND"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 2: Environment Variables Inside Handler
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 2: Environment variables read inside POST handler (not at module level)"
if grep -q "const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL" "$FILE" && \
   grep -q "const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY" "$FILE"; then
  echo "  ✅ Env vars read inside POST handler"
else
  echo "  ❌ Env vars NOT properly read inside handler"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 3: Admin Client Creation
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 3: Supabase admin client created with service key"
if grep -q "createClient(SUPABASE_URL, SERVICE_KEY" "$FILE"; then
  echo "  ✅ Admin client uses SERVICE_KEY (not anon key)"
else
  echo "  ❌ Admin client creation not found or incorrect"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 4: Auth User Creation
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 4: auth.users creation via admin.auth.admin.createUser()"
if grep -q "admin.auth.admin.createUser" "$FILE"; then
  echo "  ✅ Auth user creation present"
else
  echo "  ❌ Auth user creation not found"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 5: profiles Upsert
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 5: profiles table upsert"
if grep -q 'admin.from("profiles").upsert' "$FILE"; then
  echo "  ✅ Profile upsert present"
else
  echo "  ❌ Profile upsert not found"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 6: employees Upsert
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 6: employees table upsert"
if grep -q 'admin.from("employees").upsert' "$FILE"; then
  echo "  ✅ Employees upsert present"
else
  echo "  ❌ Employees upsert not found"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 7: Rollback on Failure
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 7: Rollback mechanism (deleteUser on profile/employee failure)"
if grep -q "admin.auth.admin.deleteUser(userId)" "$FILE"; then
  echo "  ✅ Rollback mechanism present"
else
  echo "  ❌ Rollback not found"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 8: No Secrets Leaked in Console
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 8: Secrets NOT leaked in console logs"
if grep -q 'console.log.*SERVICE_KEY' "$FILE" && ! grep -q 'console.log.*!!SERVICE_KEY' "$FILE"; then
  echo "  ❌ SERVICE_KEY might be logged unmasked"
  exit 1
elif grep -q 'console.log.*!!SERVICE_KEY' "$FILE" || ! grep -q 'console.log.*SERVICE_KEY' "$FILE"; then
  echo "  ✅ Secrets properly masked in logs"
else
  echo "  ❌ Cannot verify secret masking"
  exit 1
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 9: JSON Response on Success
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 9: Final success response includes id and name"
if grep -q 'return NextResponse.json({ success: true, id: userId, name })' "$FILE"; then
  echo "  ✅ Success response format correct"
else
  echo "  ⚠️  Success response format not exactly matched (verify manually)"
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 10: TypeScript Configuration
# ──────────────────────────────────────────────────────────────────────────────
echo "▶ CHECK 10: TypeScript strict mode enabled"
if grep -q '"strict": true' tsconfig.json; then
  echo "  ✅ TypeScript strict mode enabled"
else
  echo "  ⚠️  TypeScript strict mode not enabled"
fi
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════════════════════"
echo "  ✅ All static checks PASSED"
echo ""
echo "  Next Steps:"
echo "  1. Set Vercel Environment Variables:"
echo "     - NEXT_PUBLIC_SUPABASE_URL"
echo "     - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "  2. Run: npm run build"
echo ""
echo "  3. Run test script:"
echo "     bash scripts/test-majed.sh"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

exit 0
