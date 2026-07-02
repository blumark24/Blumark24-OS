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

const VIRTUAL_OFFICE_SCOPE_FILES = [
  {
    path: "src/lib/virtual-office/officeScope.ts",
    tokens: [
      "resolveOfficeScope",
      "resolveOfficeScopeAccess",
      "filterEmployeesByScope",
      "filterTasksByScope",
      "summarizeOfficeScope",
    ],
  },
  {
    path: "src/lib/virtual-office/officeScopeViewModel.ts",
    tokens: ["buildScopedOfficeData", "scoped", "summary"],
  },
  {
    path: "src/lib/virtual-office/officeScopeAcceptance.ts",
    tokens: [
      "assertScopedOfficeDataAcceptance",
      "assertEmployeesBelongToScope",
      "assertTasksBelongToScope",
    ],
  },
  {
    path: "src/lib/virtual-office/officeScaleContract.ts",
    tokens: ["VIRTUAL_COMMAND_OFFICE_SCALE", "targetOrganizations", "officesPerOrganization"],
  },
  {
    path: "src/lib/owner/organizationScaleContract.ts",
    tokens: ["ORGANIZATION_SCALE_TARGET", "organizationScaleStatus", "ownerPanelControlled"],
  },
  {
    path: "src/lib/owner/scaleReadiness.ts",
    tokens: ["OWNER_PANEL_SCALE_READINESS", "targetOrganizations", "keepOrganizationRecords"],
  },
];

const CORE_WORKSPACE_TABLES = ["clients", "tasks", "transactions", "employees"];

const TENANT_SCOPE_READINESS_FILES = [
  {
    path: "src/lib/tenant/scopedRoleResolver.ts",
    tokens: [
      "resolveScopedRoleFromOrgStructure",
      "resolveCurrentScopedRole",
      "agency_manager",
      "management_manager",
      "department_manager",
      "managedAgencyIds",
      "managedManagementIds",
      "managedDepartmentIds",
      "assignedDepartmentIds",
      "organizationId !== null",
      "structure?.departments ?? []",
      "structure?.relations ?? []",
    ],
  },
  {
    path: "src/lib/tenant/scopedRoleVisibilityContract.ts",
    tokens: [
      "SCOPED_ROLE_VISIBILITY_DEFINITIONS",
      "buildScopedRoleVisibilityContract",
      "listScopedRoleVisibilityDefinitions",
      "organization_manager",
      "agency_manager",
      "management_manager",
      "department_manager",
      "employee",
      "contractOnly: true",
      "enforcementEnabled: false",
      "managedAgencyIds",
      "managedManagementIds",
      "managedDepartmentIds",
      "assignedDepartmentIds",
      "ScopedRoleResolution",
      "TenantScopedRole",
    ],
  },
];

const TENANT_SCOPE_AUDIT_FILES = [
  {
    path: "docs/tenant-scoped-role-enforcement-readiness.md",
    tokens: [
      "Scoped Role Enforcement Readiness",
      "scopedRoleResolver",
      "scopedRoleVisibilityContract",
      "PermissionsContext",
      "PageGuard",
      "useData",
      "dashboard-summary",
      "aiContext",
      "officeScope",
      "Scoped role enforcement is not enabled",
      "no DB/RLS/Auth/UI changes",
    ],
  },
];

const TENANT_AUDIT_WIRING_FILES = [
  "src/lib/db.ts",
  "src/lib/org/structureDb.ts",
  "src/lib/tenant/executiveOfficeRoomMappings.ts",
];

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

async function checkVirtualOfficeScopeLayer() {
  console.log("\n3. Virtual Command Office scoped data layer");
  let ok = true;

  for (const item of VIRTUAL_OFFICE_SCOPE_FILES) {
    try {
      const content = await readFile(join(ROOT, item.path), "utf8");
      pass(`${item.path} exists`);
      for (const token of item.tokens) {
        if (content.includes(token)) pass(`${item.path} includes ${token}`);
        else ok = fail(`${item.path} missing ${token}`);
      }
    } catch {
      ok = fail(`Missing virtual-office scope file: ${item.path}`);
    }
  }

  return ok;
}

async function checkCoreWorkspaceCrudGuards() {
  console.log("\n4. Core workspace CRUD tenant guards");
  let ok = true;
  const source = await readFile(join(ROOT, "src/hooks/useData.ts"), "utf8");

  if (source.includes("function subscribeToTenantTable")) {
    pass("useData has tenant-scoped realtime subscription helper");
  } else {
    ok = fail("useData missing tenant-scoped realtime subscription helper");
  }

  if (source.includes("cachedOrgId") && source.includes("cachedOrgIdPromise")) {
    pass("useData caches current organization_id between tenant operations");
  } else {
    ok = fail("useData missing organization_id cache");
  }

  if (source.includes("supabase.auth.onAuthStateChange") && source.includes('event === "SIGNED_IN"')) {
    pass("tenant realtime subscriptions retry when auth session becomes ready");
  } else {
    ok = fail("tenant realtime subscriptions may not retry on auth readiness");
  }

  if (source.includes('event === "SIGNED_OUT"') && source.includes("clearTenantOrgCache()")) {
    pass("tenant org cache is cleared on sign-out");
  } else {
    ok = fail("tenant org cache may survive sign-out");
  }

  if (source.includes("subscription.unsubscribe()")) {
    pass("tenant realtime auth listener is cleaned up on unmount");
  } else {
    ok = fail("tenant realtime auth listener may leak after unmount");
  }

  for (const table of CORE_WORKSPACE_TABLES) {
    const readGuard = new RegExp(
      `from\\("${table}"\\)[\\s\\S]{0,240}select\\([\\s\\S]{0,240}\\.eq\\("organization_id", organization_id\\)`,
    );
    const updateGuard = new RegExp(
      `from\\("${table}"\\)[\\s\\S]{0,280}update\\([\\s\\S]{0,280}\\.eq\\("id", id\\)[\\s\\S]{0,180}\\.eq\\("organization_id", organization_id\\)`,
    );
    const deleteGuard = new RegExp(
      `from\\("${table}"\\)[\\s\\S]{0,240}delete\\([\\s\\S]{0,240}\\.eq\\("id", id\\)[\\s\\S]{0,180}\\.eq\\("organization_id", organization_id\\)`,
    );
    const realtimeGuard = source.includes(`return subscribeToTenantTable("${table}", refetch);`);

    if (readGuard.test(source)) pass(`${table} reads include organization_id guard`);
    else ok = fail(`${table} reads may rely on RLS only`);

    if (updateGuard.test(source)) pass(`${table} updates include id + organization_id guard`);
    else ok = fail(`${table} updates may be id-only`);

    if (deleteGuard.test(source)) pass(`${table} deletes include id + organization_id guard`);
    else ok = fail(`${table} deletes may be id-only`);

    if (realtimeGuard) pass(`${table} realtime subscription is tenant-scoped`);
    else ok = fail(`${table} realtime subscription may be table-wide`);
  }

  if (source.includes("insert([{ ...employeeToDB(item), organization_id }]")) {
    pass("employees inserts stamp organization_id");
  } else {
    ok = fail("employees inserts may not stamp organization_id");
  }

  return ok;
}

async function checkTenantScopeReadiness() {
  console.log("\n5. Tenant scoped role readiness");
  let ok = true;

  for (const item of TENANT_SCOPE_READINESS_FILES) {
    try {
      const content = await readFile(join(ROOT, item.path), "utf8");
      pass(`${item.path} exists`);

      for (const token of item.tokens) {
        if (content.includes(token)) pass(`${item.path} includes ${token}`);
        else ok = fail(`${item.path} missing ${token}`);
      }

      const isReadOnly =
        !content.includes(".insert(") &&
        !content.includes(".update(") &&
        !content.includes(".delete(") &&
        !content.includes(".upsert(");

      if (isReadOnly) pass(`${item.path} is read-only`);
      else ok = fail(`${item.path} may include writes or miss the read source`);

      const hasNoUiOrRouteCoupling =
        !content.includes("PermissionsContext") &&
        !content.includes("PageGuard") &&
        !content.includes("@/app/") &&
        !content.includes("@/components/") &&
        !content.includes("next/router") &&
        !content.includes("next/navigation");

      if (hasNoUiOrRouteCoupling) pass(`${item.path} has no UI, route, PageGuard, or PermissionsContext coupling`);
      else ok = fail(`${item.path} may be coupled to UI, routes, PageGuard, or PermissionsContext`);
    } catch {
      ok = fail(`Missing tenant scoped role readiness file: ${item.path}`);
    }
  }

  return ok;
}

async function checkTenantScopeAuditDocs() {
  console.log("\n6. Tenant scoped role audit docs");
  let ok = true;

  for (const item of TENANT_SCOPE_AUDIT_FILES) {
    try {
      const content = await readFile(join(ROOT, item.path), "utf8");
      pass(`${item.path} exists`);

      for (const token of item.tokens) {
        if (content.includes(token)) pass(`${item.path} includes ${token}`);
        else ok = fail(`${item.path} missing ${token}`);
      }
    } catch {
      ok = fail(`Missing tenant scoped role audit doc: ${item.path}`);
    }
  }

  return ok;
}

async function checkTenantAuditLogWiring() {
  console.log("\n7. Tenant audit log wiring");
  let ok = true;
  let externalAuditUsage = false;

  for (const relativePath of TENANT_AUDIT_WIRING_FILES) {
    if (relativePath.startsWith("src/components/") || relativePath.startsWith("src/app/")) {
      ok = fail(`${relativePath} is a UI or route file, outside audit wiring scope`);
      continue;
    }
    if (relativePath.startsWith("supabase/migrations/")) {
      ok = fail(`${relativePath} is a migration file, outside audit wiring scope`);
      continue;
    }

    try {
      const content = await readFile(join(ROOT, relativePath), "utf8");
      pass(`${relativePath} exists`);
      if (content.includes("logTenantAuditEvent")) {
        externalAuditUsage = true;
        pass(`${relativePath} uses logTenantAuditEvent`);
      } else {
        ok = fail(`${relativePath} missing logTenantAuditEvent usage`);
      }
      if (content.includes("try {") && content.includes("console.warn")) {
        pass(`${relativePath} has best-effort try/catch warning path`);
      } else {
        ok = fail(`${relativePath} missing best-effort try/catch warning path`);
      }
    } catch {
      ok = fail(`Missing tenant audit wiring file: ${relativePath}`);
    }
  }

  if (externalAuditUsage) {
    pass("logTenantAuditEvent is used outside src/lib/tenant/tenantAuditLogs.ts");
  } else {
    ok = fail("logTenantAuditEvent is not wired outside its helper file");
  }

  return ok;
}

async function checkLiveDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    console.log("\n8. Live Supabase checks (skipped — set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)");
    console.log("   Manual QA: sign in as two different org users and confirm each sees only own data.");
    return true;
  }

  console.log("\n8. Live Supabase checks");
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
  console.log("   - Virtual Office 01 shows only its linked office data");
  console.log("   - Virtual Office 05 remains owner/board summary");
  console.log("   - Virtual Office 09 does not show another office data");
  return ok;
}

async function main() {
  console.log("Blumark24 OS — Tenant Isolation Verification");
  const results = await Promise.all([
    checkMigrationFiles(),
    checkRlsPatterns(),
    checkVirtualOfficeScopeLayer(),
    checkCoreWorkspaceCrudGuards(),
    checkTenantScopeReadiness(),
    checkTenantScopeAuditDocs(),
    checkTenantAuditLogWiring(),
    checkLiveDatabase(),
  ]);
  const allOk = results.every(Boolean);
  console.log(allOk ? "\n✓ Verification passed (codebase checks)." : "\n✗ Some checks failed.");
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
