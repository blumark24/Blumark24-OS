#!/usr/bin/env node
/**
 * Verify tenant isolation prerequisites (read-only checks).
 * Run: npm run verify:isolation
 */

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

const REQUIRED_MIGRATIONS = [
  "009_owner_command_center_tables.sql",
  "010_client_login_link.sql",
  "011_tenant_isolation_phase_a.sql",
  "012_tenant_isolation_phase_b1.sql",
  "013_client_tenant_normalization.sql",
  "014_organization_customer_code.sql",
  "015_tenant_isolation_phase_b2.sql",
  "016_current_org_is_internal.sql",
  "018_organization_manager_rbac.sql",
  "019_tenant_org_structure.sql",
  "023_notifications_tenant_isolation.sql",
  "024_tenant_workspace_settings_and_manager_rbac.sql",
  "026_org_structure_levels.sql",
  "027_profiles_update_hardening.sql",
];

const REQUIRED_FUNCTIONS = ["current_org_id", "is_owner", "get_my_role"];

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  return false;
}

async function checkMigrationFiles() {
  console.log("\n1. Migration files (009–027)");
  let ok = true;
  const files = await readdir(MIGRATIONS_DIR);
  for (const name of REQUIRED_MIGRATIONS) {
    if (files.includes(name)) pass(name);
    else ok = fail(`Missing migration: ${name}`);
  }
  return ok;
}

async function checkRlsPatterns() {
  console.log("\n2. RLS patterns in migration SQL");
  let ok = true;
  const b2 = await readFile(join(MIGRATIONS_DIR, "015_tenant_isolation_phase_b2.sql"), "utf8");
  const b1 = await readFile(join(MIGRATIONS_DIR, "012_tenant_isolation_phase_b1.sql"), "utf8");
  const orgStruct = await readFile(join(MIGRATIONS_DIR, "019_tenant_org_structure.sql"), "utf8");

  if (b2.includes("current_org_id()")) pass("015 references current_org_id()");
  else ok = fail("015 missing current_org_id() policies");

  for (const fn of REQUIRED_FUNCTIONS) {
    if (b2.includes(fn) || (await readFile(join(MIGRATIONS_DIR, "011_tenant_isolation_phase_a.sql"), "utf8")).includes(fn)) {
      pass(`Function ${fn} referenced in migrations`);
    } else {
      ok = fail(`Function ${fn} not found in key migrations`);
    }
  }

  const tableSources = [
    { table: "clients", sql: b2 },
    { table: "tasks", sql: b2 },
    { table: "employees", sql: b1 + b2 },
    { table: "transactions", sql: b2 },
    { table: "departments", sql: orgStruct },
    { table: "teams", sql: orgStruct },
    { table: "positions", sql: orgStruct },
    { table: "automations", sql: b2 },
    { table: "notifications", sql: b2 },
  ];

  for (const { table, sql } of tableSources) {
    if (sql.includes(`'${table}'`) || sql.includes(`"${table}"`) || sql.includes(`public.${table}`)) {
      pass(`Table ${table} covered in tenant isolation migrations`);
    } else {
      ok = fail(`Table ${table} may not be isolated`);
    }
  }
  return ok;
}

async function checkLiveDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    console.log("\n3. Live Supabase checks (skipped — set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)");
    console.log("   Manual QA: sign in as two different org users and confirm each sees only own data.");
    return true;
  }

  console.log("\n3. Live Supabase checks");
  let ok = true;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    for (const table of ["organizations", "profiles", "subscriptions", "plan_limits"]) {
      const { error } = await admin.from(table).select("id").limit(1);
      if (error) ok = fail(`Table ${table}: ${error.message}`);
      else pass(`Table ${table} readable`);
    }
  } catch (e) {
    ok = fail(String(e));
  }

  console.log("\n   Manual QA checklist:");
  console.log("   - Org A tenant sees only Org A dashboard rows");
  console.log("   - Org B tenant sees only Org B dashboard rows");
  console.log("   - Owner login sees all orgs at /owner/organizations");
  return ok;
}

async function main() {
  console.log("Blumark24 OS — Tenant Isolation Verification");
  const results = await Promise.all([checkMigrationFiles(), checkRlsPatterns(), checkLiveDatabase()]);
  const allOk = results.every(Boolean);
  console.log(allOk ? "\n✓ Verification passed (codebase checks)." : "\n✗ Some checks failed.");
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
