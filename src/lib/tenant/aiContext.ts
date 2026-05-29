import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  defaultFeaturesForPlan,
  normalizePlanSlug,
  type PlanSlug,
  type WorkspaceFeature,
} from "@/lib/features/packageFeatures";
import { isPlatformAdminEmail } from "@/lib/platformAdmins";

export type TenantAiContextRole =
  | "super_admin"
  | "board_member"
  | "owner"
  | "general_manager"
  | "defense_manager"
  | "attack_manager"
  | "manager"
  | "finance_manager"
  | "sales_manager"
  | "hr_manager"
  | "organization_manager"
  | "employee"
  | string;

export interface TenantAiContext {
  generatedAt: string;
  scope: "tenant";
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
    email: string | null;
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
  finance: {
    available: boolean;
    transactions?: {
      total: number;
    };
  };
  package: {
    planSlug: PlanSlug;
    enabledFeatures: WorkspaceFeature[];
    planLimits: Record<string, number>;
  };
}

interface ProfileRow {
  role: string | null;
  organization_id: string | null;
}

interface OrganizationRow {
  id: string;
  name: string;
  organization_code: string | null;
  plan_id: string | null;
  status: string | null;
  deleted_at: string | null;
}

interface PlanRow {
  id: string;
  slug: string | null;
}

interface PlanFeatureRow {
  feature_key: string;
}

interface PlanLimitRow {
  limit_key: string;
  limit_value: number;
}

interface SubscriptionRow {
  status: string | null;
}

function envValue(name: string): string {
  return process.env[name] ?? "";
}

export function createTenantSessionClient(accessToken: string): SupabaseClient {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anon) {
    throw new Error("missing_public_supabase_env");
  }

  return createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export function createServerAdminClient(): SupabaseClient {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("missing_server_supabase_env");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function countRows<T>(rows: T[] | null | undefined): number {
  return Array.isArray(rows) ? rows.length : 0;
}

function isCompletedTask(status: unknown): boolean {
  return String(status ?? "") === "مكتملة";
}

function isOpenTask(status: unknown): boolean {
  return !isCompletedTask(status);
}

function isOverdueTask(row: { status?: unknown; due_date?: unknown }): boolean {
  if (isCompletedTask(row.status)) return false;
  const due = String(row.due_date ?? "").trim();
  if (!due) return false;
  const dueTime = new Date(due).getTime();
  if (Number.isNaN(dueTime)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueTime < today.getTime();
}

function isActiveEmployee(status: unknown): boolean {
  return String(status ?? "") === "نشط";
}

function isActiveClient(status: unknown): boolean {
  const s = String(status ?? "");
  return s === "نشط" || s === "متعاقد";
}

export function canReadFinanceSummary(role: string, enabledFeatures: WorkspaceFeature[]): boolean {
  if (!enabledFeatures.includes("finance")) return false;
  return [
    "organization_manager",
    "finance_manager",
    "general_manager",
    "owner",
    "board_member",
  ].includes(role);
}

export function isPlatformRoleMismatch(email: string | null | undefined, role: string): boolean {
  return isPlatformAdminEmail(email ?? "") || role === "super_admin";
}

async function safeSelect<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  organizationId: string,
): Promise<T[]> {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .eq("organization_id", organizationId);

  if (error) {
    console.warn(`[tenant-ai-context] ${table} read skipped:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export async function buildTenantAiContext(accessToken: string): Promise<TenantAiContext> {
  const tenant = createTenantSessionClient(accessToken);
  const admin = createServerAdminClient();

  const { data: authData, error: authErr } = await tenant.auth.getUser(accessToken);
  const authUser = authData?.user;
  if (authErr || !authUser) {
    throw Object.assign(new Error("invalid_session"), { status: 401 });
  }

  const userId = authUser.id;
  const email = authUser.email ?? null;

  const { data: profile, error: profileErr } = await tenant
    .from("profiles")
    .select("role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    console.error("[tenant-ai-context] profile error:", profileErr.message);
    throw Object.assign(new Error("profile_read_failed"), { status: 500 });
  }

  const role = String((profile as ProfileRow | null)?.role ?? "");
  const organizationId = (profile as ProfileRow | null)?.organization_id ?? null;

  if (!role || !organizationId) {
    throw Object.assign(new Error("missing_tenant_profile"), { status: 403 });
  }

  if (isPlatformRoleMismatch(email, role)) {
    throw Object.assign(new Error("platform_workspace_mismatch"), { status: 403 });
  }

  // organizations/plans are owner/platform metadata in current RLS, so this
  // server-only read is scoped manually to the caller profile's organization_id.
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, organization_code, plan_id, status, deleted_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgErr) {
    console.error("[tenant-ai-context] organization error:", orgErr.message);
    throw Object.assign(new Error("organization_read_failed"), { status: 500 });
  }

  const organization = org as OrganizationRow | null;
  if (!organization || organization.deleted_at) {
    throw Object.assign(new Error("organization_not_available"), { status: 403 });
  }

  let planSlug: PlanSlug = "basic";
  let enabledFeatures: WorkspaceFeature[] = defaultFeaturesForPlan(planSlug);
  const planLimits: Record<string, number> = {};

  if (organization.plan_id) {
    const { data: plan } = await admin
      .from("plans")
      .select("id, slug")
      .eq("id", organization.plan_id)
      .maybeSingle();

    planSlug = normalizePlanSlug((plan as PlanRow | null)?.slug);
    enabledFeatures = defaultFeaturesForPlan(planSlug);

    const { data: featureRows } = await admin
      .from("plan_features")
      .select("feature_key")
      .eq("plan_id", organization.plan_id);

    if (featureRows && featureRows.length > 0) {
      enabledFeatures = (featureRows as PlanFeatureRow[]).map(
        (feature) => feature.feature_key as WorkspaceFeature,
      );
    }

    const { data: limitRows } = await admin
      .from("plan_limits")
      .select("limit_key, limit_value")
      .eq("plan_id", organization.plan_id);

    for (const row of (limitRows ?? []) as PlanLimitRow[]) {
      planLimits[row.limit_key] = Number(row.limit_value ?? 0);
    }
  }

  const { data: subscriptionRows } = await admin
    .from("subscriptions")
    .select("status")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const subscriptionStatus = ((subscriptionRows ?? []) as SubscriptionRow[])[0]?.status ?? null;

  const [employees, tasks, clients, departments, teams, relations] = await Promise.all([
    safeSelect<{ id: string; status: string | null }>(tenant, "employees", "id, status", organization.id),
    safeSelect<{ id: string; status: string | null; due_date: string | null }>(tenant, "tasks", "id, status, due_date", organization.id),
    safeSelect<{ id: string; status: string | null }>(tenant, "clients", "id, status", organization.id),
    safeSelect<{ id: string }>(tenant, "departments", "id", organization.id),
    safeSelect<{ id: string }>(tenant, "teams", "id", organization.id),
    safeSelect<{
      employee_id: string | null;
      department_id: string | null;
      team_id: string | null;
      manager_id: string | null;
    }>(tenant, "employee_relations", "employee_id, department_id, team_id, manager_id", organization.id),
  ]);

  const linkedEmployeeIds = new Set(
    relations.map((rel) => rel.employee_id).filter((id): id is string => !!id),
  );
  const managedDepartmentIds = new Set(
    relations
      .filter((rel) => !!rel.department_id && !!rel.manager_id)
      .map((rel) => rel.department_id as string),
  );
  const memberTeamIds = new Set(
    relations
      .filter((rel) => !!rel.team_id && !!rel.employee_id)
      .map((rel) => rel.team_id as string),
  );

  const financeAllowed = canReadFinanceSummary(role, enabledFeatures);
  let finance: TenantAiContext["finance"] = { available: false };
  if (financeAllowed) {
    const transactions = await safeSelect<{ id: string }>(tenant, "transactions", "id", organization.id);
    finance = {
      available: true,
      transactions: { total: countRows(transactions) },
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: "tenant",
    organization: {
      id: organization.id,
      organization_code: organization.organization_code ?? null,
      name: organization.name,
      planSlug,
      subscriptionStatus,
    },
    user: {
      id: userId,
      role,
      email,
    },
    employees: {
      total: employees.length,
      active: employees.filter((employee) => isActiveEmployee(employee.status)).length,
      outsideStructure: employees.filter((employee) => !linkedEmployeeIds.has(employee.id)).length,
    },
    tasks: {
      total: tasks.length,
      open: tasks.filter((task) => isOpenTask(task.status)).length,
      overdue: tasks.filter((task) => isOverdueTask(task)).length,
      completed: tasks.filter((task) => isCompletedTask(task.status)).length,
    },
    clients: {
      total: clients.length,
      active: clients.filter((client) => isActiveClient(client.status)).length,
    },
    orgStructure: {
      departments: departments.length,
      teams: teams.length,
      departmentsWithoutManager: departments.filter((department) => !managedDepartmentIds.has(department.id)).length,
      teamsWithoutMembers: teams.filter((team) => !memberTeamIds.has(team.id)).length,
    },
    finance,
    package: {
      planSlug,
      enabledFeatures,
      planLimits,
    },
  };
}
