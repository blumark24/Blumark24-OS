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

const PLATFORM_AI_DENY_ROLES = new Set([
  "super_admin",
  "admin",
  "general_manager",
  "board_chairman",
  "مدير_عام",
]);

export function validateTenantAiAccess(input: {
  email: string;
  role: string;
  organizationId: string | null;
}): { ok: true } | { ok: false; reason: TenantAiAccessDeniedReason } {
  if (isPlatformAdminEmail(input.email)) {
    return { ok: false, reason: "platform_role" };
  }

  const role = String(input.role ?? "").trim();
  if (PLATFORM_AI_DENY_ROLES.has(role)) {
    return { ok: false, reason: "platform_role" };
  }

  if (!input.organizationId) {
    return { ok: false, reason: "no_organization" };
  }

  return { ok: true };
}

async function countExact(
  client: SupabaseClient,
  table: string,
  apply?: (q: ReturnType<ReturnType<SupabaseClient["from"]>["select"]>) => ReturnType<
    ReturnType<SupabaseClient["from"]>["select"]
  >,
): Promise<number> {
  let q = client.from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) {
    if (/does not exist|relation.*not found/i.test(error.message)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function resolvePermissions(
  client: SupabaseClient,
  role: string,
): Promise<Permission[]> {
  const mapped = mapAuthRoleToUserRole(role);
  const { data } = await client
    .from("role_permissions")
    .select("permissions")
    .eq("role", role)
    .maybeSingle();

  const fromDb = Array.isArray(data?.permissions)
    ? (data.permissions as Permission[])
    : undefined;

  return mergePermissionsForRole(mapped, fromDb);
}

function roleHasFinanceAccess(permissions: Permission[]): boolean {
  return permissions.includes("manage_finance");
}

async function loadPackageContext(
  client: SupabaseClient,
  orgId: string,
): Promise<{
  planSlug: PlanSlug;
  enabledFeatures: WorkspaceFeature[];
  planLimits: Record<string, number>;
  subscriptionStatus: string | null;
  orgName: string;
  organizationCode: string | null;
}> {
  const { data: org, error: orgErr } = await client
    .from("organizations")
    .select("id, name, plan_id, status, organization_code, customer_code, deleted_at")
    .eq("id", orgId)
    .maybeSingle();

  if (orgErr) throw orgErr;
  if (!org || org.deleted_at) {
    return {
      planSlug: "basic",
      enabledFeatures: [],
      planLimits: {},
      subscriptionStatus: null,
      orgName: "",
      organizationCode: null,
    };
  }

  const organizationCode =
    (typeof org.organization_code === "string" && org.organization_code.trim()
      ? org.organization_code.trim()
      : null)
    ?? (typeof org.customer_code === "string" && org.customer_code.trim()
      ? org.customer_code.trim()
      : null);

  let planSlug: PlanSlug = "basic";
  let planId: string | null = (org.plan_id as string | null) ?? null;

  if (planId) {
    const { data: plan } = await client.from("plans").select("slug").eq("id", planId).maybeSingle();
    planSlug = normalizePlanSlug(plan?.slug);
  }

  let enabledFeatures: WorkspaceFeature[] = [];
  if (planId) {
    const { data: features } = await client
      .from("plan_features")
      .select("feature_key")
      .eq("plan_id", planId);
    enabledFeatures = (features ?? []).map((f) => f.feature_key as WorkspaceFeature);
  }

  const planLimits: Record<string, number> = {};
  if (planId) {
    const { data: limits } = await client
      .from("plan_limits")
      .select("limit_key, limit_value")
      .eq("plan_id", planId);
    for (const row of limits ?? []) {
      planLimits[row.limit_key] = row.limit_value;
    }
  }

  let subscriptionStatus: string | null = null;
  const { data: sub } = await client
    .from("subscriptions")
    .select("status")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sub?.status) subscriptionStatus = String(sub.status);

  return {
    planSlug,
    enabledFeatures,
    planLimits,
    subscriptionStatus,
    orgName: String(org.name ?? ""),
    organizationCode,
  };
}

async function buildEmployeeSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["employees"]> {
  const total = await countExact(client, "employees", (q) =>
    q.eq("organization_id", orgId),
  );
  const active = await countExact(client, "employees", (q) =>
    q.eq("organization_id", orgId).eq("status", "نشط"),
  );

  let linked = 0;
  try {
    const { data: rels, error } = await client
      .from("employee_relations")
      .select("employee_id")
      .eq("organization_id", orgId);
    if (!error && rels) {
      linked = new Set(rels.map((r) => r.employee_id as string)).size;
    }
  } catch {
    linked = total;
  }

  return {
    total,
    active,
    outsideStructure: Math.max(0, total - linked),
  };
}

async function buildTaskSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["tasks"]> {
  const total = await countExact(client, "tasks", (q) => q.eq("organization_id", orgId));
  const completed = await countExact(client, "tasks", (q) =>
    q.eq("organization_id", orgId).eq("status", "مكتملة"),
  );
  const open = await countExact(client, "tasks", (q) =>
    q.eq("organization_id", orgId).neq("status", "مكتملة"),
  );

  const today = new Date().toISOString().split("T")[0];
  const overdue = await countExact(client, "tasks", (q) =>
    q
      .eq("organization_id", orgId)
      .or(`status.eq.متأخرة,and(status.neq.مكتملة,due_date.lt.${today})`),
  );

  return {
    total,
    open,
    completed,
    overdue,
  };
}

async function buildClientSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["clients"]> {
  const total = await countExact(client, "clients", (q) => q.eq("organization_id", orgId));
  const active = await countExact(client, "clients", (q) =>
    q.eq("organization_id", orgId).eq("status", "نشط"),
  );
  return { total, active };
}

async function buildOrgStructureSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["orgStructure"]> {
  const departments = await countExact(client, "departments", (q) =>
    q.eq("organization_id", orgId),
  );
  const teams = await countExact(client, "teams", (q) => q.eq("organization_id", orgId));

  let departmentsWithoutManager = 0;
  try {
    departmentsWithoutManager = await countExact(client, "departments", (q) =>
      q.eq("organization_id", orgId).is("manager_id", null),
    );
  } catch {
    departmentsWithoutManager = 0;
  }

  let teamsWithoutMembers = 0;
  try {
    const { data: teamRows } = await client
      .from("teams")
      .select("id")
      .eq("organization_id", orgId);
    const teamIds = (teamRows ?? []).map((t) => t.id as string);
    if (teamIds.length === 0) {
      teamsWithoutMembers = 0;
    } else {
      const { data: rels } = await client
        .from("employee_relations")
        .select("team_id")
        .eq("organization_id", orgId)
        .not("team_id", "is", null);
      const staffed = new Set(
        (rels ?? []).map((r) => r.team_id as string).filter((id) => teamIds.includes(id)),
      );
      teamsWithoutMembers = teamIds.length - staffed.size;
    }
  } catch {
    teamsWithoutMembers = 0;
  }

  return {
    departments,
    teams,
    departmentsWithoutManager,
    teamsWithoutMembers: Math.max(0, teamsWithoutMembers),
  };
}

async function buildFinanceSummary(
  client: SupabaseClient,
  orgId: string,
): Promise<TenantAiContextPayload["finance"]> {
  const { data: rows, error } = await client
    .from("transactions")
    .select("type, amount")
    .eq("organization_id", orgId);

  if (error) {
    if (/does not exist|relation.*not found/i.test(error.message)) {
      return { available: false };
    }
    throw error;
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
  const pkg = await loadPackageContext(client, input.organizationId);
  const permissions = await resolvePermissions(client, input.role);
  const financeAccess = roleHasFinanceAccess(permissions);

  const [employees, tasks, clients, orgStructure, finance] = await Promise.all([
    buildEmployeeSummary(client, input.organizationId),
    buildTaskSummary(client, input.organizationId),
    buildClientSummary(client, input.organizationId),
    buildOrgStructureSummary(client, input.organizationId),
    financeAccess
      ? buildFinanceSummary(client, input.organizationId)
      : Promise.resolve({ available: false } as const),
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
