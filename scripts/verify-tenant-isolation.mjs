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

const AI_CHAT_RATE_LIMIT_FILE = "src/app/api/ai/chat/route.ts";

// Phase 4C-1 — owner tenant lifecycle guard.
const TENANT_LIFECYCLE_GUARD_FILE = "src/lib/owner/tenantLifecycleGuard.ts";
const OWNER_ORG_QUERIES_FILE = "src/app/owner/_lib/ownerQueries.ts";
// Phase 4C-2 — owner organizations/subscriptions reconciliation.
const OWNER_SUB_RECONCILIATION_FILE = "src/app/owner/_lib/ownerSubscriptionReconciliation.ts";
const OWNER_SUBSCRIPTIONS_PAGE_FILE =
  "src/app/owner/subscriptions/_components/SubscriptionsPageContent.tsx";
// Owner flow directories scanned for organization hard deletes and
// organization_code / customer_code mutation.
const OWNER_FLOW_DIRS = ["src/app/owner", "src/app/api/owner", "src/lib/owner"];

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

async function checkAiChatDurableRateLimit() {
  console.log("\n8. AI chat durable rate limit");
  let ok = true;

  try {
    const content = await readFile(join(ROOT, AI_CHAT_RATE_LIMIT_FILE), "utf8");
    pass(`${AI_CHAT_RATE_LIMIT_FILE} exists`);

    if (content.includes('"@/lib/rateLimit"') || content.includes("'@/lib/rateLimit'")) {
      ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} imports the legacy in-memory rate limiter`);
    } else {
      pass(`${AI_CHAT_RATE_LIMIT_FILE} does not import the legacy in-memory rate limiter`);
    }

    if (
      content.includes('"@/lib/security/rateLimit"') ||
      content.includes("'@/lib/security/rateLimit'")
    ) {
      pass(`${AI_CHAT_RATE_LIMIT_FILE} imports the durable server-side rate limiter`);
    } else {
      ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} missing durable rate limiter import`);
    }

    for (const token of ["buildRateLimitKey", "getClientIp"]) {
      if (content.includes(token)) pass(`${AI_CHAT_RATE_LIMIT_FILE} uses ${token}`);
      else ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} missing ${token}`);
    }

    const keyBuilderMatch = content.match(/buildRateLimitKey\(\{\s*([\s\S]*?)\s*\}\);/);
    if (!keyBuilderMatch) {
      ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} missing buildRateLimitKey object`);
    } else if (/\bip\b/.test(keyBuilderMatch[1])) {
      ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} includes ip in buildRateLimitKey`);
    } else {
      pass(`${AI_CHAT_RATE_LIMIT_FILE} excludes ip from buildRateLimitKey`);
    }

    if (/await\s+checkRateLimit\s*\(/.test(content)) {
      pass(`${AI_CHAT_RATE_LIMIT_FILE} awaits checkRateLimit`);
    } else {
      ok = fail(`${AI_CHAT_RATE_LIMIT_FILE} does not await checkRateLimit`);
    }
  } catch {
    ok = fail(`Missing AI chat route file: ${AI_CHAT_RATE_LIMIT_FILE}`);
  }

  return ok;
}

async function listFilesRecursive(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFilesRecursive(full)));
    else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function checkOwnerTenantLifecycleGuard() {
  console.log("\n9. Owner tenant lifecycle guard");
  let ok = true;

  // 9a. Guard helper exists with the required policy surface.
  try {
    const guard = await readFile(join(ROOT, TENANT_LIFECYCLE_GUARD_FILE), "utf8");
    pass(`${TENANT_LIFECYCLE_GUARD_FILE} exists`);

    const guardTokens = [
      "assessTenantLifecycle",
      "evaluateTenantLifecycleAction",
      "summarizeTenantLifecycleAssessment",
      "ORGANIZATION_HARD_DELETE_ALLOWED = false",
      '"subscriptions"',
      '"invoices"',
      '"employees"',
      '"tenant_audit_logs"',
      '"executive_office_room_mappings"',
      '"soft_delete_only"',
      "mustArchiveOrSuspendInstead",
      "customer/organization codes are immutable and must never be reused",
    ];
    for (const token of guardTokens) {
      if (guard.includes(token)) pass(`${TENANT_LIFECYCLE_GUARD_FILE} includes ${token}`);
      else ok = fail(`${TENANT_LIFECYCLE_GUARD_FILE} missing ${token}`);
    }

    const guardIsReadOnly =
      !guard.includes(".insert(") &&
      !guard.includes(".update(") &&
      !guard.includes(".delete(") &&
      !guard.includes(".upsert(");
    if (guardIsReadOnly) pass(`${TENANT_LIFECYCLE_GUARD_FILE} is read-only (assessment never mutates)`);
    else ok = fail(`${TENANT_LIFECYCLE_GUARD_FILE} contains writes`);
  } catch {
    ok = fail(`Missing tenant lifecycle guard file: ${TENANT_LIFECYCLE_GUARD_FILE}`);
  }

  // 9b. Owner soft delete stays soft and runs the guard first.
  try {
    const queries = await readFile(join(ROOT, OWNER_ORG_QUERIES_FILE), "utf8");
    const softDeleteBody = queries.match(
      /export async function softDeleteOrganization[\s\S]{0,2200}?\n\}/,
    )?.[0];
    if (!softDeleteBody) {
      ok = fail(`${OWNER_ORG_QUERIES_FILE} missing softDeleteOrganization`);
    } else {
      if (softDeleteBody.includes("deleted_at: now") && softDeleteBody.includes('status: "cancelled"')) {
        pass("softDeleteOrganization marks deleted_at + status='cancelled' (soft delete only)");
      } else {
        ok = fail("softDeleteOrganization missing deleted_at/status cancelled soft-delete markers");
      }
      if (softDeleteBody.includes(".delete(")) {
        ok = fail("softDeleteOrganization performs a hard delete");
      } else {
        pass("softDeleteOrganization never calls .delete()");
      }
      if (
        softDeleteBody.includes("assessTenantLifecycle") &&
        softDeleteBody.includes("evaluateTenantLifecycleAction")
      ) {
        pass("softDeleteOrganization runs the tenant lifecycle guard before archiving");
      } else {
        ok = fail("softDeleteOrganization does not run the tenant lifecycle guard");
      }
      if (softDeleteBody.includes("deleted_by")) {
        pass("softDeleteOrganization records deleted_by in the audit metadata");
      } else {
        ok = fail("softDeleteOrganization missing deleted_by audit metadata");
      }
    }
  } catch {
    ok = fail(`Missing owner queries file: ${OWNER_ORG_QUERIES_FILE}`);
  }

  // 9c. No owner flow hard-deletes organizations, and organization_code /
  // customer_code are never mutated (immutable, never reused).
  const orgHardDelete = /from\(\s*["']organizations["']\s*\)[\s\S]{0,300}?\.delete\(/;
  const codeMutation = /\.update\(\s*\{[\s\S]{0,300}?(organization_code|customer_code)\s*:/;

  for (const dir of OWNER_FLOW_DIRS) {
    const files = await listFilesRecursive(join(ROOT, dir));
    let dirOk = true;
    for (const file of files) {
      const content = await readFile(file, "utf8");
      const rel = file.slice(ROOT.length + 1);
      if (orgHardDelete.test(content)) {
        dirOk = false;
        ok = fail(`${rel} hard-deletes organizations`);
      }
      if (codeMutation.test(content)) {
        dirOk = false;
        ok = fail(`${rel} mutates organization_code/customer_code (codes are immutable, never reused)`);
      }
    }
    if (dirOk) pass(`${dir} has no organization hard delete and no org-code mutation`);
  }

  return ok;
}

// Phase 4C-2 — owner organizations/subscriptions reconciliation.
// Static checks that the owner subscription read model carries organization
// lifecycle data, archived subscriptions never count as active visible
// customer subscriptions, and the Phase 4C-1 guarantees still hold.
async function checkOwnerSubscriptionReconciliation() {
  console.log("\n10. Owner subscriptions reconciliation (Phase 4C-2)");
  let ok = true;

  // 10a. Reconciliation model exists, is pure/read-only, and names all classes.
  try {
    const recon = await readFile(join(ROOT, OWNER_SUB_RECONCILIATION_FILE), "utf8");
    pass(`${OWNER_SUB_RECONCILIATION_FILE} exists`);

    const reconTokens = [
      "classifySubscriptionLifecycle",
      "isActiveVisibleCustomerSubscription",
      "summarizeSubscriptionLifecycle",
      "SUBSCRIPTION_LIFECYCLE_LABEL_AR",
      '"visible"',
      '"archived"',
      '"needs_review"',
      '"internal"',
      '"orphaned"',
    ];
    for (const token of reconTokens) {
      if (recon.includes(token)) pass(`${OWNER_SUB_RECONCILIATION_FILE} includes ${token}`);
      else ok = fail(`${OWNER_SUB_RECONCILIATION_FILE} missing ${token}`);
    }

    const reconIsReadOnly =
      !recon.includes(".insert(") &&
      !recon.includes(".update(") &&
      !recon.includes(".delete(") &&
      !recon.includes(".upsert(") &&
      !recon.includes("supabase.from(");
    if (reconIsReadOnly) pass(`${OWNER_SUB_RECONCILIATION_FILE} is a pure read-only classifier (no queries, no writes)`);
    else ok = fail(`${OWNER_SUB_RECONCILIATION_FILE} contains queries or writes`);
  } catch {
    ok = fail(`Missing reconciliation model file: ${OWNER_SUB_RECONCILIATION_FILE}`);
  }

  // 10b. Owner subscription read model includes organization.deleted_at
  // and classifies every row.
  try {
    const queries = await readFile(join(ROOT, OWNER_ORG_QUERIES_FILE), "utf8");
    const subsPageBody = queries.match(
      /export async function fetchSubscriptionsPage[\s\S]{0,3000}?\n\}/,
    )?.[0];
    if (!subsPageBody) {
      ok = fail(`${OWNER_ORG_QUERIES_FILE} missing fetchSubscriptionsPage`);
    } else {
      if (/organizations"\)\.select\("[^"]*deleted_at/.test(subsPageBody)) {
        pass("fetchSubscriptionsPage reads organizations.deleted_at (lifecycle data on the read model)");
      } else {
        ok = fail("fetchSubscriptionsPage does not read organizations.deleted_at");
      }
      if (subsPageBody.includes("classifySubscriptionLifecycle")) {
        pass("fetchSubscriptionsPage classifies each subscription against org lifecycle");
      } else {
        ok = fail("fetchSubscriptionsPage does not classify subscriptions");
      }
    }
  } catch {
    ok = fail(`Missing owner queries file: ${OWNER_ORG_QUERIES_FILE}`);
  }

  // 10c. Archived subscriptions are never counted as active visible
  // customer subscriptions on the owner subscriptions page.
  try {
    const page = await readFile(join(ROOT, OWNER_SUBSCRIPTIONS_PAGE_FILE), "utf8");
    if (
      page.includes("isActiveVisibleCustomerSubscription") &&
      page.includes("lifecycleSummary.activeVisible")
    ) {
      pass("subscriptions page active count uses the lifecycle-aware visible-customer rule");
    } else {
      ok = fail("subscriptions page active count is not lifecycle-aware (archived subs may count as active)");
    }
    if (page.includes("lifecycleLabelAr")) {
      pass("subscriptions page renders lifecycle badges");
    } else {
      ok = fail("subscriptions page missing lifecycle badges");
    }
  } catch {
    ok = fail(`Missing subscriptions page file: ${OWNER_SUBSCRIPTIONS_PAGE_FILE}`);
  }

  // 10d. Phase 4C-1 guarantees still hold: hard delete of organizations
  // stays forbidden and organization codes stay immutable.
  try {
    const guard = await readFile(join(ROOT, TENANT_LIFECYCLE_GUARD_FILE), "utf8");
    if (guard.includes("ORGANIZATION_HARD_DELETE_ALLOWED = false")) {
      pass("organization hard delete remains forbidden (ORGANIZATION_HARD_DELETE_ALLOWED = false)");
    } else {
      ok = fail("ORGANIZATION_HARD_DELETE_ALLOWED is no longer pinned to false");
    }
    if (guard.includes("customer/organization codes are immutable and must never be reused")) {
      pass("organization_code/customer_code immutability contract is still documented in the guard");
    } else {
      ok = fail("organization code immutability contract missing from the guard");
    }
  } catch {
    ok = fail(`Missing tenant lifecycle guard file: ${TENANT_LIFECYCLE_GUARD_FILE}`);
  }

  // 10e. No client component ("use client") reads the service-role key.
  const srcFiles = await listFilesRecursive(join(ROOT, "src"));
  let serviceRoleLeaks = 0;
  for (const file of srcFiles) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const content = await readFile(file, "utf8");
    const isClientComponent = /^\s*["']use client["']/.test(content);
    if (isClientComponent && content.includes("process.env.SUPABASE_SERVICE_ROLE_KEY")) {
      serviceRoleLeaks += 1;
      ok = fail(`${file.slice(ROOT.length + 1)} is a client component reading SUPABASE_SERVICE_ROLE_KEY`);
    }
  }
  if (serviceRoleLeaks === 0) {
    pass("no client component reads process.env.SUPABASE_SERVICE_ROLE_KEY");
  }

  return ok;
}

async function checkLiveDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    console.log("\n11. Live Supabase checks (skipped — set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)");
    console.log("   Manual QA: sign in as two different org users and confirm each sees only own data.");
    return true;
  }

  console.log("\n11. Live Supabase checks");
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
    checkAiChatDurableRateLimit(),
    checkOwnerTenantLifecycleGuard(),
    checkOwnerSubscriptionReconciliation(),
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
