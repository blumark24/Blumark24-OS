// Organization detail — read-only owner panel queries (no mutations).

import { supabase } from "@/lib/supabaseClient";
import { OWNER_AI_TRACKING_DISABLED, OWNER_UNAVAILABLE_HINT } from "../_data";
import type { Accent } from "../_data";
import type {
  DbOrganization,
  DbPlanFull,
  DbSubscription,
  PlanLimitsValues,
} from "./ownerQueries";
import {
  fetchOwnerAuditTimelineForOrg,
  type OwnerAuditEntry,
} from "./ownerTruthQueries";

export interface OrgDetailProfile {
  id: string;
  name: string;
  slug: string | null;
  customerCode: string | null;
  ownerEmail: string | null;
  notes: string | null;
  isInternal: boolean;
  statusRaw: DbOrganization["status"];
  statusAr: string;
  hasClientLogin: boolean;
  createdAt: string;
  isDeleted: boolean;
}

export interface OrgDetailPlan {
  id: string;
  name: string;
  slug: string;
  accent: Accent;
  priceMonthly: number | null;
  priceAnnual: number | null;
  isActive: boolean;
  limits: PlanLimitsValues;
}

export interface OrgDetailSubscription {
  id: string;
  statusRaw: DbSubscription["status"];
  statusAr: string;
  billingCycleAr: string;
  startedAt: string;
  endsAt: string | null;
}

export interface OrgDetailUserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface OrgDetailEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  joinDate: string;
}

export interface OrgDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
}

export interface OrgDetailUsage {
  aiRequests: { display: string; available: boolean };
  whatsappMessages: { display: string; available: boolean };
  employeesUsed: { display: string; available: boolean; count: number | null; limit: number | null };
}

export interface OrganizationDetailData {
  profile: OrgDetailProfile;
  plan: OrgDetailPlan | null;
  subscription: OrgDetailSubscription | null;
  users: OrgDetailUserProfile[];
  usersAvailable: boolean;
  employees: OrgDetailEmployee[];
  employeesAvailable: boolean;
  employeeTotal: number | null;
  tasks: OrgDetailTask[];
  tasksAvailable: boolean;
  taskTotal: number | null;
  usage: OrgDetailUsage;
  auditTimeline: OwnerAuditEntry[];
}

const ORG_STATUS_AR: Record<DbOrganization["status"], string> = {
  active: "نشطة",
  trial: "تجريبية",
  suspended: "معلقة",
  cancelled: "ملغاة",
};

const SUB_STATUS_AR: Record<DbSubscription["status"], string> = {
  active: "نشطة",
  trialing: "تجريبية",
  past_due: "متأخرة",
  cancelled: "ملغاة",
  suspended: "معلقة",
};

const SUB_BILLING_AR: Record<DbSubscription["billing_cycle"], string> = {
  monthly: "شهري",
  annual: "سنوي",
  internal: "داخلي",
};

const SLUG_ACCENT: Record<string, Accent> = {
  basic: "cyan",
  growth: "blue",
  advanced: "purple",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205"
    || error.code === "42P01"
    || msg.includes("does not exist")
    || msg.includes("schema cache")
  );
}

async function probeAiUsageCount(orgId: string): Promise<{ display: string; available: boolean }> {
  const { count, error } = await supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (error) {
    if (isMissingTableError(error)) {
      return { display: OWNER_AI_TRACKING_DISABLED, available: false };
    }
    console.warn("[owner] ai usage probe failed:", error.message);
    return { display: OWNER_UNAVAILABLE_HINT, available: false };
  }

  return { display: String(count ?? 0), available: true };
}

export async function fetchOrganizationDetail(
  orgId: string,
): Promise<OrganizationDetailData | null> {
  const orgRes = await supabase
    .from("organizations")
    .select("id, name, slug, customer_code, owner_email, plan_id, status, notes, is_internal, deleted_at, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (orgRes.error) {
    console.error("[owner] org detail fetch error:", orgRes.error.message);
    throw new Error(orgRes.error.message);
  }

  const org = orgRes.data as DbOrganization | null;
  if (!org) return null;

  const [
    plansRes,
    limitsRes,
    subsRes,
    profilesRes,
    employeesRes,
    employeeCountRes,
    tasksRes,
    taskCountRes,
    linksRes,
    aiUsage,
    auditTimeline,
  ] = await Promise.all([
    org.plan_id
      ? supabase
          .from("plans")
          .select("id, name, slug, price_monthly, price_annual, is_active, sort_order, created_at")
          .eq("id", org.plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    org.plan_id
      ? supabase.from("plan_limits").select("plan_id, limit_key, limit_value").eq("plan_id", org.plan_id)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("subscriptions")
      .select("id, organization_id, plan_id, status, billing_cycle, started_at, ends_at")
      .eq("organization_id", orgId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, email, name, role, is_active")
      .eq("organization_id", orgId)
      .order("email")
      .limit(50),
    supabase
      .from("employees")
      .select("id, name, email, role, department, status, join_date")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("tasks")
      .select("id, title, status, priority, assignee_name, due_date, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("profiles")
      .select("organization_id")
      .eq("organization_id", orgId)
      .limit(1),
    probeAiUsageCount(orgId),
    fetchOwnerAuditTimelineForOrg(orgId, 12),
  ]);

  if (plansRes.error) console.warn("[owner] org detail plan fetch:", plansRes.error.message);
  if (limitsRes.error) console.warn("[owner] org detail limits fetch:", limitsRes.error.message);
  if (subsRes.error) console.warn("[owner] org detail sub fetch:", subsRes.error.message);

  const rawPlan = plansRes.data as DbPlanFull | null;
  const rawLimits = (limitsRes.data ?? []) as { plan_id: string; limit_key: string; limit_value: number }[];
  const rawSub = subsRes.data as DbSubscription | null;

  let plan: OrgDetailPlan | null = null;
  if (rawPlan) {
    const map: Record<string, number> = {};
    rawLimits.forEach((l) => {
      map[l.limit_key] = l.limit_value;
    });
    const pick = (key: string): number | null => (key in map ? map[key] : null);
    plan = {
      id: rawPlan.id,
      name: rawPlan.name,
      slug: rawPlan.slug,
      accent: SLUG_ACCENT[rawPlan.slug] ?? "cyan",
      priceMonthly: rawPlan.price_monthly,
      priceAnnual: rawPlan.price_annual,
      isActive: rawPlan.is_active,
      limits: {
        maxEmployees: pick("max_employees"),
        maxAgencies: pick("max_agencies"),
        maxDepartments: pick("max_departments"),
        maxSections: pick("max_sections"),
        aiLevel: pick("ai_level"),
        whatsappEnabled: pick("whatsapp_enabled"),
      },
    };
  }

  let subscription: OrgDetailSubscription | null = null;
  if (rawSub) {
    subscription = {
      id: rawSub.id,
      statusRaw: rawSub.status,
      statusAr: SUB_STATUS_AR[rawSub.status] ?? rawSub.status,
      billingCycleAr: SUB_BILLING_AR[rawSub.billing_cycle] ?? rawSub.billing_cycle,
      startedAt: formatDate(rawSub.started_at),
      endsAt: rawSub.ends_at ? formatDate(rawSub.ends_at) : null,
    };
  }

  const profilesAvailable = !profilesRes.error || !isMissingTableError(profilesRes.error);
  if (profilesRes.error && !isMissingTableError(profilesRes.error)) {
    console.warn("[owner] org detail profiles fetch:", profilesRes.error.message);
  }

  const employeesAvailable = !employeesRes.error && !employeeCountRes.error;
  if (employeesRes.error) {
    if (!isMissingTableError(employeesRes.error)) {
      console.warn("[owner] org detail employees fetch:", employeesRes.error.message);
    }
  }

  const tasksAvailable = !tasksRes.error && !taskCountRes.error;
  if (tasksRes.error) {
    if (!isMissingTableError(tasksRes.error)) {
      console.warn("[owner] org detail tasks fetch:", tasksRes.error.message);
    }
  }

  const employeeTotal = employeesAvailable ? (employeeCountRes.count ?? 0) : null;
  const taskTotal = tasksAvailable ? (taskCountRes.count ?? 0) : null;
  const maxEmployees = plan?.limits.maxEmployees ?? null;

  const usage: OrgDetailUsage = {
    aiRequests: aiUsage,
    whatsappMessages: { display: OWNER_UNAVAILABLE_HINT, available: false },
    employeesUsed: employeesAvailable
      ? {
          display: maxEmployees != null ? `${employeeTotal} / ${maxEmployees}` : String(employeeTotal ?? 0),
          available: true,
          count: employeeTotal,
          limit: maxEmployees,
        }
      : { display: OWNER_UNAVAILABLE_HINT, available: false, count: null, limit: null },
  };

  const hasClientLogin =
    !linksRes.error
    && Array.isArray(linksRes.data)
    && linksRes.data.length > 0;

  return {
    profile: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      customerCode: org.customer_code,
      ownerEmail: org.owner_email,
      notes: org.notes,
      isInternal: org.is_internal === true,
      statusRaw: org.status,
      statusAr: ORG_STATUS_AR[org.status] ?? org.status,
      hasClientLogin,
      createdAt: formatDate(org.created_at),
      isDeleted: !!org.deleted_at,
    },
    plan,
    subscription,
    users: profilesAvailable
      ? ((profilesRes.data ?? []) as { id: string; email: string; name: string; role: string; is_active: boolean }[]).map(
          (p) => ({
            id: p.id,
            email: p.email,
            name: p.name,
            role: p.role,
            isActive: p.is_active,
          }),
        )
      : [],
    usersAvailable: profilesAvailable,
    employees: employeesAvailable
      ? ((employeesRes.data ?? []) as {
          id: string;
          name: string;
          email: string;
          role: string;
          department: string;
          status: string;
          join_date: string;
        }[]).map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
          department: e.department,
          status: e.status,
          joinDate: formatDate(e.join_date),
        }))
      : [],
    employeesAvailable,
    employeeTotal,
    tasks: tasksAvailable
      ? ((tasksRes.data ?? []) as {
          id: string;
          title: string;
          status: string;
          priority: string;
          assignee_name: string;
          due_date: string;
          created_at: string;
        }[]).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigneeName: t.assignee_name,
          dueDate: formatDate(t.due_date),
          createdAt: formatDate(t.created_at),
        }))
      : [],
    tasksAvailable,
    taskTotal,
    usage,
    auditTimeline,
  };
}
