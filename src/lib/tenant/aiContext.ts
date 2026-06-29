import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mergePermissionsForRole,
  mapAuthRoleToUserRole,
  type Permission,
} from "@/contexts/PermissionsContext";
import {
  normalizePlanSlug,
  type PlanSlug,
  type WorkspaceFeature,
} from "@/lib/features/packageFeatures";
import { isPlatformAdminEmail } from "@/lib/platformAdmins";

export interface TenantAiContextPayload {
  organization: {
    id: string;
    organization_code: string | null;
    name: string;
    planSlug: PlanSlug;
    subscriptionStatus: string | null;
  };
  user: {
    id: string;
    role: string;
    email: string;
  };
  employees: {
    total: number;
    active: number;
    outsideStructure: number;
  };
  tasks: {
    total: number;
    open: number;
    overdue: number;
    completed: number;
  };
  clients: {
    total: number;
    active: number;
  };
  orgStructure: {
    departments: number;
    teams: number;
    departmentsWithoutManager: number;
    teamsWithoutMembers: number;
  };
  finance:
    | { available: false }
    | {
        available: true;
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
      };
  package: {
    planSlug: PlanSlug;
    enabledFeatures: WorkspaceFeature[];
    planLimits: Record<string, number>;
  };
}

export type TenantAiAccessDeniedReason =
  | "no_session"
  | "no_organization"
  | "platform_role"
  | "org_missing";

// Platform Owner scope is determined ONLY by the email allowlist
// (OWNER_EMAILS / isPlatformAdminEmail). Tenant-side roles such as
// `admin`, `general_manager`, `board_chairman`, or `مدير_عام` are
// legitimate tenant manager roles and must NOT be treated as
// platform owner — they need the tenant AI context. See issue #492.

const EMPLOYEE_SUMMARY_FALLBACK: TenantAiContextPayload["employees"] = {
  total: 0,
  active: 0,
  outsideStructure: 0,
};

const TASK_SUMMARY_FALLBACK: TenantAiContextPayload["tasks"] = {
  total: 0,
  open: 0,
  overdue: 0,
  completed: 0,
};

const CLIENT_SUMMARY_FALLBACK: TenantAiContextPayload["clients"] = {
  total: 0,
  active: 0,
};

const ORG_STRUCTURE_SUMMARY_FALLBACK: TenantAiContextPayload["orgStructure"] = {
  departments: 0,
  teams: 0,
  departmentsWithoutManager: 0,
  teamsWithoutMembers: 0,
};

const FINANCE_SUMMARY_FALLBACK: TenantAiContextPayload["finance"] = {
  available: false,
};

const PACKAGE_CONTEXT_FALLBACK = {
  planSlug: "basic" as PlanSlug,
  enabledFeatures: [] as WorkspaceFeature[],
  planLimits: {} as Record<string, number>,
  subscriptionStatus: null as string | null,
  orgName: "منشأتك",
  organizationCode: null as string | null,
};

export function validateTenantAiAccess(input: {
  email: string;
  role: string;
  organizationId: string | null;
}): { ok: true } | { ok: false; reason: TenantAiAccessDeniedReason } {
  // Platform Owner: ONLY recognized through the email allowlist.
  // Tenant roles (admin, general_manager, board_chairman, مدير_عام,
  // super_admin, …) are valid tenant managers and keep tenant AI
  // access as long as they are bound to an organization.
  if (isPlatformAdminEmail(input.email)) {
    return { ok: false, reason: "platform_role" };
  }

  if (!input.organizationId) {
    return { ok: false, reason: "no_organization" };
  }

  return { ok: true };
}

type QueryLike = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;
type CountResult = { ok: true; count: number } | { ok: false; count: 0 };

function diagnosticCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

function diagnosticStatus(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

function logContextReadFailure(input: {
  summary: string;
  table: string;
  operation: string;
  err?: unknown;
}): void {
  console.info(
    JSON.stringify({
      tag: "[tenant/ai-context]",
      event: "table_read_fail",
      ts: new Date().toISOString(),
      summary: input.summary,
      table: input.table,
      operation: input.operation,
      code: diagnosticCode(input.err),
      status: diagnosticStatus(input.err),
    }),
  );
}

async function safeSummary<T>(
  summary: string,
  fallback: T,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    return await loader();
  } catch (err) {
    logContextReadFailure({ summary, table: "summary", operation: "build", err });
    return fallback;
  }
}

async function countExactResult(
  client: SupabaseClient,
  table: string,
  apply?: (q: QueryLike) => QueryLike,
  summary = table,
): Promise<CountResult> {
  try {
    let q = client.from(table).select("*", { count: "exact", head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) {
      logContextReadFailure({ summary, table, operation: "count", err: error });
      return { ok: false, count: 0 };
    }
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    logContextReadFailure({ summary, table, operation: "count", err });
    return { ok: false, count: 0 };
  }
}

async function countExact(
  client: SupabaseClient,
  table: string,
  apply?: (q: QueryLike) => QueryLike,
): Promise<number> {
  const result = await countExactResult(client, table, apply);
  return result.count;
}

async function resolvePermissions(
  client: SupabaseClient,
  role: string,
): Promise<Permission[]> {
  try {
    const mapped = mapAuthRoleToUserRole(role);
    const { data, error } = await client
      .from("role_permissions")
      .select("permissions")
      .eq("role", role)
      .maybeSingle();

    if (error) {
      logContextReadFailure({
        summary: "permissions",
        table: "role_permissions",
        operation: "select",
        err: error,
      });
      return mergePermissionsForRole(mapped);
    }

    const fromDb = Array.isArray(data?.permissions)
      ? (data.permissions as Permission[])
      : undefined;

    return mergePermissionsForRole(mapped, fromDb);
  } catch (err) {
    logContextReadFailure({
      summary: "permissions",
      table: "role_permissions",
      operation: "resolve",
      err,
    });
    try {
      return mergePermissionsForRole(mapAuthRoleToUserRole(role));
    } catch {
      return [];
    }
  }
}

function roleHasFinanceAccess(permissions: Permission[]): boolean {
  try {
    return permissions.includes("manage_finance");
  } catch {
    return false;
  }
}

// Statuses considered a "live" subscription. Any of these wins over
// the bare organizations.plan_id pointer.
const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

async function loadPackageContext(
  client: SupabaseClient,
  organizationId: string,
): Promise<{
  planSlug: PlanSlug;
  enabledFeatures: WorkspaceFeature[];
  planLimits: Record<string, number>;
  subscriptionStatus: string | null;
  orgName: string;
  organizationCode: string | null;
}> {
  let orgName = PACKAGE_CONTEXT_FALLBACK.orgName;
  let organizationCode: string | null = null;
  let orgPlanId: string | null = null;

  try {
    const { data: org, error } = await client
      .from("organizations")
      .select("name, organization_code, plan_id")
      .eq("id", organizationId)
      .maybeSingle();
    if (error) {
      logContextReadFailure({
        summary: "package",
        table: "organizations",
        operation: "select",
        err: error,
      });
    } else if (org) {
      const nm = typeof org.name === "string" ? org.name.trim() : "";
      if (nm) orgName = nm;
      organizationCode =
        typeof org.organization_code === "string" ? org.organization_code : null;
      orgPlanId = typeof org.plan_id === "string" ? org.plan_id : null;
    }
  } catch (err) {
    logContextReadFailure({
      summary: "package",
      table: "organizations",
      operation: "select",
      err,
    });
  }

  let livePlanId: string | null = null;
  let subscriptionStatus: string | null = null;
  try {
    const { data: subs, error } = await client
      .from("subscriptions")
      .select("plan_id, status, created_at")
      .eq("organization_id", organizationId)
      .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      logContextReadFailure({
        summary: "package",
        table: "subscriptions",
        operation: "select",
        err: error,
      });
    } else if (subs && subs.length > 0) {
      const sub = subs[0];
      livePlanId = typeof sub.plan_id === "string" ? sub.plan_id : null;
      subscriptionStatus = typeof sub.status === "string" ? sub.status : null;
    }
  } catch (err) {
    logContextReadFailure({
      summary: "package",
      table: "subscriptions",
      operation: "select",
      err,
    });
  }

  const planId = livePlanId ?? orgPlanId;
  if (!planId) {
    return {
      ...PACKAGE_CONTEXT_FALLBACK,
      orgName,
      organizationCode,
      subscriptionStatus,
    };
  }

  let planSlug: PlanSlug = PACKAGE_CONTEXT_FALLBACK.planSlug;
  try {
    const { data: plan, error } = await client
      .from("plans")
      .select("slug")
      .eq("id", planId)
      .maybeSingle();
    if (error) {
      logContextReadFailure({
        summary: "package",
        table: "plans",
        operation: "select",
        err: error,
      });
    } else if (plan) {
      planSlug = normalizePlanSlug(
        typeof plan.slug === "string" ? plan.slug : null,
      );
    }
  } catch (err) {
    logContextReadFailure({
      summary: "package",
      table: "plans",
      operation: "select",
      err,
    });
  }

  let enabledFeatures: WorkspaceFeature[] = [];
  try {
    const { data: features, error } = await client
      .from("plan_features")
      .select("feature_key")
      .eq("plan_id", planId);
    if (error) {
      logContextReadFailure({
        summary: "package",
        table: "plan_features",
        operation: "select",
        err: error,
      });
    } else if (features) {
      enabledFeatures = features
        .map((row) =>
          typeof row.feature_key === "string"
            ? (row.feature_key as WorkspaceFeature)
            : null,
        )
        .filter((v): v is WorkspaceFeature => !!v);
    }
  } catch (err) {
    logContextReadFailure({
      summary: "package",
      table: "plan_features",
      operation: "select",
      err,
    });
  }

  const planLimits: Record<string, number> = {};
  try {
    const { data: limits, error } = await client
      .from("plan_limits")
      .select("limit_key, limit_value")
      .eq("plan_id", planId);
    if (error) {
      logContextReadFailure({
        summary: "package",
        table: "plan_limits",
        operation: "select",
        err: error,
      });
    } else if (limits) {
      for (const row of limits) {
        const key = typeof row.limit_key === "string" ? row.limit_key : null;
        const value = Number(row.limit_value);
        if (key && Number.isFinite(value)) planLimits[key] = value;
      }
    }
  } catch (err) {
    logContextReadFailure({
      summary: "package",
      table: "plan_limits",
      operation: "select",
      err,
    });
  }

  return {
    planSlug,
    enabledFeatures,
    planLimits,
    subscriptionStatus,
    orgName,
    organizationCode,
  };
}

async function buildEmployeeSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["employees"]> {
  const total = await countExactResult(client, "employees", (q) =>
    q.eq("organization_id", orgId),
    "employees",
  );
  const active = await countExactResult(client, "employees", (q) =>
    q.eq("organization_id", orgId).eq("status", "نشط"),
    "employees",
  );

  if (!total.ok || !active.ok) return EMPLOYEE_SUMMARY_FALLBACK;

  try {
    const { data: rels, error } = await client
      .from("employee_relations")
      .select("employee_id")
      .eq("organization_id", orgId);
    if (error) {
      logContextReadFailure({
        summary: "employees",
        table: "employee_relations",
        operation: "select",
        err: error,
      });
      return EMPLOYEE_SUMMARY_FALLBACK;
    }

    const linked = new Set(
      (rels ?? []).map((r) => r.employee_id as string).filter(Boolean),
    ).size;

    return {
      total: total.count,
      active: active.count,
      outsideStructure: Math.max(0, total.count - linked),
    };
  } catch (err) {
    logContextReadFailure({
      summary: "employees",
      table: "employee_relations",
      operation: "select",
      err,
    });
    return EMPLOYEE_SUMMARY_FALLBACK;
  }
}

async function buildTaskSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["tasks"]> {
  const total = await countExactResult(client, "tasks", (q) =>
    q.eq("organization_id", orgId),
    "tasks",
  );
  const completed = await countExactResult(client, "tasks", (q) =>
    q.eq("organization_id", orgId).eq("status", "مكتملة"),
    "tasks",
  );
  const open = await countExactResult(client, "tasks", (q) =>
    q.eq("organization_id", orgId).neq("status", "مكتملة"),
    "tasks",
  );
  const overdue = await countExactResult(client, "tasks", (q) =>
    q.eq("organization_id", orgId).eq("status", "متأخرة"),
    "tasks",
  );

  if (!total.ok || !completed.ok || !open.ok || !overdue.ok) {
    return TASK_SUMMARY_FALLBACK;
  }

  return {
    total: total.count,
    open: open.count,
    completed: completed.count,
    overdue: overdue.count,
  };
}

async function buildClientSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["clients"]> {
  const total = await countExactResult(client, "clients", (q) =>
    q.eq("organization_id", orgId),
    "clients",
  );
  const active = await countExactResult(client, "clients", (q) =>
    q.eq("organization_id", orgId).eq("status", "نشط"),
    "clients",
  );

  if (!total.ok || !active.ok) return CLIENT_SUMMARY_FALLBACK;

  return { total: total.count, active: active.count };
}

async function buildOrgStructureSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["orgStructure"]> {
  const departments = await countExactResult(client, "departments", (q) =>
    q.eq("organization_id", orgId),
    "orgStructure",
  );
  const teams = await countExactResult(client, "teams", (q) =>
    q.eq("organization_id", orgId),
    "orgStructure",
  );
  const departmentsWithoutManager = await countExactResult(client, "departments", (q) =>
    q.eq("organization_id", orgId).is("manager_id", null),
    "orgStructure",
  );

  if (!departments.ok || !teams.ok || !departmentsWithoutManager.ok) {
    return ORG_STRUCTURE_SUMMARY_FALLBACK;
  }

  try {
    const { data: teamRows, error: teamRowsError } = await client
      .from("teams")
      .select("id")
      .eq("organization_id", orgId);
    if (teamRowsError) {
      logContextReadFailure({
        summary: "orgStructure",
        table: "teams",
        operation: "select_ids",
        err: teamRowsError,
      });
      return ORG_STRUCTURE_SUMMARY_FALLBACK;
    }

    const teamIds = (teamRows ?? []).map((t) => t.id as string);
    if (teamIds.length === 0) {
      return {
        departments: departments.count,
        teams: teams.count,
        departmentsWithoutManager: departmentsWithoutManager.count,
        teamsWithoutMembers: 0,
      };
    }

    const { data: rels, error: relsError } = await client
      .from("employee_relations")
      .select("team_id")
      .eq("organization_id", orgId)
      .not("team_id", "is", null);
    if (relsError) {
      logContextReadFailure({
        summary: "orgStructure",
        table: "employee_relations",
        operation: "select_team_ids",
        err: relsError,
      });
      return ORG_STRUCTURE_SUMMARY_FALLBACK;
    }

    const staffed = new Set(
      (rels ?? []).map((r) => r.team_id as string).filter((id) => teamIds.includes(id)),
    );

    return {
      departments: departments.count,
      teams: teams.count,
      departmentsWithoutManager: departmentsWithoutManager.count,
      teamsWithoutMembers: Math.max(0, teamIds.length - staffed.size),
    };
  } catch (err) {
    logContextReadFailure({
      summary: "orgStructure",
      table: "org_structure_related",
      operation: "select",
      err,
    });
    return ORG_STRUCTURE_SUMMARY_FALLBACK;
  }
}

async function buildFinanceSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["finance"]> {
  try {
    const { data: rows, error } = await client
      .from("transactions")
      .select("type, amount")
      .eq("organization_id", orgId);

    if (error) {
      logContextReadFailure({
        summary: "finance",
        table: "transactions",
        operation: "select",
        err: error,
      });
      return FINANCE_SUMMARY_FALLBACK;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of rows ?? []) {
      const amount = Number(row.amount) || 0;
      if (row.type === "دخل") totalIncome += amount;
      else if (row.type === "مصروف") totalExpense += amount;
    }

    return {
      available: true,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  } catch (err) {
    logContextReadFailure({
      summary: "finance",
      table: "transactions",
      operation: "select",
      err,
    });
    return FINANCE_SUMMARY_FALLBACK;
  }
}

export async function buildTenantAiContext(
  client: SupabaseClient,
  input: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
  },
): Promise<TenantAiContextPayload> {
  const pkg = await safeSummary("package", PACKAGE_CONTEXT_FALLBACK, () =>
    loadPackageContext(client, input.organizationId),
  );
  const permissions = await safeSummary("permissions", [] as Permission[], () =>
    resolvePermissions(client, input.role),
  );
  const financeAccess = roleHasFinanceAccess(permissions);

  const [employees, tasks, clients, orgStructure, finance] = await Promise.all([
    safeSummary("employees", EMPLOYEE_SUMMARY_FALLBACK, () =>
      buildEmployeeSummary(client, input.organizationId),
    ),
    safeSummary("tasks", TASK_SUMMARY_FALLBACK, () =>
      buildTaskSummary(client, input.organizationId),
    ),
    safeSummary("clients", CLIENT_SUMMARY_FALLBACK, () =>
      buildClientSummary(client, input.organizationId),
    ),
    safeSummary("orgStructure", ORG_STRUCTURE_SUMMARY_FALLBACK, () =>
      buildOrgStructureSummary(client, input.organizationId),
    ),
    financeAccess
      ? safeSummary("finance", FINANCE_SUMMARY_FALLBACK, () =>
          buildFinanceSummary(client, input.organizationId),
        )
      : Promise.resolve(FINANCE_SUMMARY_FALLBACK),
  ]);

  return {
    organization: {
      id: input.organizationId,
      organization_code: pkg.organizationCode,
      name: pkg.orgName,
      planSlug: pkg.planSlug,
      subscriptionStatus: pkg.subscriptionStatus,
    },
    user: {
      id: input.userId,
      role: input.role,
      email: input.email,
    },
    employees,
    tasks,
    clients,
    orgStructure,
    finance,
    package: {
      planSlug: pkg.planSlug,
      enabledFeatures: pkg.enabledFeatures,
      planLimits: pkg.planLimits,
    },
  };
}

export function tenantAiAccessErrorMessage(
  reason: TenantAiAccessDeniedReason,
): string {
  switch (reason) {
    case "no_session":
      return "جلسة غير صالحة — سجّل الدخول مجدداً";
    case "no_organization":
      return "حسابك غير مربوط بمنشأة — لا يتوفر سياق مساعد ذكي";
    case "platform_role":
      return "سياق المساعد الذكي متاح لمساحة عمل المنشأة فقط — استخدم لوحة المالك للحسابات الداخلية";
    case "org_missing":
      return "المنشأة غير موجودة أو غير متاحة";
    default:
      return "غير مصرح";
  }
}
