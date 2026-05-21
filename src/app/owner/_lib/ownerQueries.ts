// Owner dashboard data fetching — runs client-side with anon key + RLS.
// RLS is_owner() guards all four tables; non-owners get empty results.

import { supabase } from "@/lib/supabaseClient";
import type { Accent } from "../_data";

// ─── Raw DB row types ────────────────────────────────────────────────────────

export interface DbPlan {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export interface DbPlanLimit {
  plan_id: string;
  limit_key: string;
  limit_value: number;
}

export interface DbOrganization {
  id: string;
  name: string;
  slug: string | null;
  owner_email: string | null;
  plan_id: string | null;
  status: "active" | "suspended" | "trial" | "cancelled";
  notes: string | null;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "suspended";
  billing_cycle: "monthly" | "annual" | "internal";
  started_at: string;
  ends_at: string | null;
}

// ─── Normalized display types ────────────────────────────────────────────────

export interface DisplayOrg {
  id: string;
  name: string;
  planName: string;
  planSlug: string;
  statusAr: "نشطة" | "معلقة";
  isInternal: boolean;
}

export interface DisplayPlan {
  id: string;
  name: string;
  slug: string;
  accent: Accent;
  badge: string;
  featured: boolean;
  audience: string;
  limits: string[];
}

export interface DisplaySubscription {
  id: string;
  statusAr: string;
  isActive: boolean;
  billingCycleAr: string;
  planName: string;
  startedAt: string;
}

export interface DisplayOrgFull {
  id: string;
  name: string;
  slug: string | null;
  ownerEmail: string | null;
  isInternal: boolean;
  statusRaw: DbOrganization["status"];
  statusAr: string;
  planName: string;
  planSlug: string;
  subStatusAr: string;
  subIsActive: boolean;
  subBillingCycleAr: string;
  createdAt: string;
}

export interface OwnerDashboardData {
  organizations: DisplayOrg[];
  plans: DisplayPlan[];
  activeOrgCount: number;
  internalOrg: DisplayOrg | null;
  internalPlanLimits: Record<string, number>;
  internalSubscription: DisplaySubscription | null;
}

// ─── Static metadata maps (plan config, not from DB) ────────────────────────

const SLUG_ACCENT: Record<string, Accent> = {
  basic: "cyan",
  growth: "blue",
  advanced: "purple",
};

const SLUG_BADGE: Record<string, string> = {
  basic: "Starter",
  growth: "Most Popular",
  advanced: "Enterprise",
};

const SLUG_FEATURED: Record<string, boolean> = {
  basic: false,
  growth: true,
  advanced: false,
};

const SLUG_AUDIENCE: Record<string, string> = {
  basic: "للشركات الناشئة والفرق الصغيرة",
  growth: "للشركات المتوسطة في مرحلة التوسع",
  advanced: "للمؤسسات الكبيرة والعمليات المعقّدة",
};

// ─── Normalization helpers ───────────────────────────────────────────────────

function limitsToStrings(limits: Record<string, number>, slug: string): string[] {
  const e = limits["max_employees"] ?? 0;
  const ag = limits["max_agencies"] ?? 0;
  const dep = limits["max_departments"] ?? 0;
  const sec = limits["max_sections"] ?? 0;
  const ai = limits["ai_level"] ?? 0;
  const wa = limits["whatsapp_enabled"] ?? 0;

  const result: string[] = [];

  if (slug === "advanced") {
    result.push(`حتى +${e} موظف`);
    result.push("وكالات متعددة");
    result.push("إدارات متعددة");
    result.push("أقسام متعددة");
  } else {
    result.push(`حتى ${e} موظف`);
    result.push(ag === 0 ? "0 وكالة" : ag === 1 ? "وكالة واحدة كحد أقصى" : `حتى ${ag} وكالات`);
    result.push(dep === 1 ? "إدارة واحدة كحد أقصى" : `حتى ${dep} إدارات`);
    result.push(`حتى ${sec} قسم`);
  }

  if (ai === 1) result.push("ذكاء اصطناعي محدود");
  else if (ai === 2) result.push("ذكاء اصطناعي متوسط");
  else if (ai >= 3) result.push("ذكاء اصطناعي كامل");

  if (wa === 1) result.push("WhatsApp Bot مفعّل");
  if (slug === "advanced") result.push("تقارير متقدمة");

  return result;
}

function normalizeOrg(org: DbOrganization, plans: DbPlan[]): DisplayOrg {
  const plan = plans.find((p) => p.id === org.plan_id);
  const status = org.status === "active" || org.status === "trial" ? "نشطة" : "معلقة";
  return {
    id: org.id,
    name: org.name,
    planName: plan?.name ?? "—",
    planSlug: plan?.slug ?? "",
    statusAr: status,
    isInternal: org.slug === "blumark24-internal",
  };
}

function normalizePlan(plan: DbPlan, allLimits: DbPlanLimit[]): DisplayPlan {
  const limitMap: Record<string, number> = {};
  allLimits
    .filter((l) => l.plan_id === plan.id)
    .forEach((l) => {
      limitMap[l.limit_key] = l.limit_value;
    });

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    accent: SLUG_ACCENT[plan.slug] ?? "cyan",
    badge: SLUG_BADGE[plan.slug] ?? plan.slug,
    featured: SLUG_FEATURED[plan.slug] ?? false,
    audience: SLUG_AUDIENCE[plan.slug] ?? "",
    limits: limitsToStrings(limitMap, plan.slug),
  };
}

const ORG_STATUS_AR: Record<DbOrganization["status"], string> = {
  active:    "نشطة",
  trial:     "تجريبية",
  suspended: "معلقة",
  cancelled: "ملغاة",
};

const SUB_STATUS_AR: Record<DbSubscription["status"], string> = {
  active:    "نشطة",
  trialing:  "تجريبية",
  past_due:  "متأخرة",
  cancelled: "ملغاة",
  suspended: "معلقة",
};

const SUB_BILLING_AR: Record<DbSubscription["billing_cycle"], string> = {
  monthly: "شهري",
  annual:  "سنوي",
  internal: "داخلي",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function normalizeSubscription(sub: DbSubscription, plans: DbPlan[]): DisplaySubscription {
  const plan = plans.find((p) => p.id === sub.plan_id);
  return {
    id: sub.id,
    statusAr: SUB_STATUS_AR[sub.status] ?? sub.status,
    isActive: sub.status === "active",
    billingCycleAr: SUB_BILLING_AR[sub.billing_cycle] ?? sub.billing_cycle,
    planName: plan?.name ?? "—",
    startedAt: formatDate(sub.started_at),
  };
}

// ─── Main fetch ──────────────────────────────────────────────────────────────

export async function fetchOwnerDashboardData(): Promise<OwnerDashboardData> {
  const [orgsRes, plansRes, limitsRes, subsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, owner_email, plan_id, status, notes, created_at")
      .order("created_at"),
    supabase
      .from("plans")
      .select("id, name, slug, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("plan_limits").select("plan_id, limit_key, limit_value"),
    supabase
      .from("subscriptions")
      .select("id, organization_id, plan_id, status, billing_cycle, started_at, ends_at"),
  ]);

  if (orgsRes.error)  console.error("[owner] organizations fetch error:", orgsRes.error.message);
  if (plansRes.error) console.error("[owner] plans fetch error:", plansRes.error.message);
  if (limitsRes.error) console.error("[owner] plan_limits fetch error:", limitsRes.error.message);
  if (subsRes.error)  console.error("[owner] subscriptions fetch error:", subsRes.error.message);

  const rawOrgs  = (orgsRes.data  ?? []) as DbOrganization[];
  const rawPlans = (plansRes.data ?? []) as DbPlan[];
  const rawLimits = (limitsRes.data ?? []) as DbPlanLimit[];
  const rawSubs  = (subsRes.data  ?? []) as DbSubscription[];

  const organizations = rawOrgs.map((o) => normalizeOrg(o, rawPlans));
  const plans = rawPlans.map((p) => normalizePlan(p, rawLimits));

  const internalRaw = rawOrgs.find((o) => o.slug === "blumark24-internal") ?? null;
  const internalOrg = internalRaw ? normalizeOrg(internalRaw, rawPlans) : null;

  const internalPlanLimits: Record<string, number> = {};
  if (internalRaw?.plan_id) {
    rawLimits
      .filter((l) => l.plan_id === internalRaw.plan_id)
      .forEach((l) => {
        internalPlanLimits[l.limit_key] = l.limit_value;
      });
  }

  const internalSubRaw = internalRaw
    ? rawSubs.find((s) => s.organization_id === internalRaw.id) ?? null
    : null;
  const internalSubscription = internalSubRaw
    ? normalizeSubscription(internalSubRaw, rawPlans)
    : null;

  const activeOrgCount = rawOrgs.filter((o) => o.status === "active").length;

  return {
    organizations,
    plans,
    activeOrgCount,
    internalOrg,
    internalPlanLimits,
    internalSubscription,
  };
}

// ─── Organizations page fetch ────────────────────────────────────────────────

export async function fetchOrganizationsPage(): Promise<DisplayOrgFull[]> {
  const [orgsRes, plansRes, subsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, owner_email, plan_id, status, notes, created_at")
      .order("created_at"),
    supabase
      .from("plans")
      .select("id, name, slug")
      .eq("is_active", true),
    supabase
      .from("subscriptions")
      .select("organization_id, plan_id, status, billing_cycle"),
  ]);

  if (orgsRes.error)  console.error("[owner] orgs page fetch error:", orgsRes.error.message);
  if (plansRes.error) console.error("[owner] plans page fetch error:", plansRes.error.message);
  if (subsRes.error)  console.error("[owner] subs page fetch error:", subsRes.error.message);

  const rawOrgs  = (orgsRes.data  ?? []) as DbOrganization[];
  const rawPlans = (plansRes.data ?? []) as Pick<DbPlan, "id" | "name" | "slug">[];
  const rawSubs  = (subsRes.data  ?? []) as Pick<DbSubscription, "organization_id" | "plan_id" | "status" | "billing_cycle">[];

  return rawOrgs.map((org) => {
    const plan = rawPlans.find((p) => p.id === org.plan_id);
    const sub  = rawSubs.find((s) => s.organization_id === org.id);
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      ownerEmail: org.owner_email,
      isInternal: org.slug === "blumark24-internal",
      statusRaw: org.status,
      statusAr: ORG_STATUS_AR[org.status] ?? org.status,
      planName: plan?.name ?? "—",
      planSlug: plan?.slug ?? "",
      subStatusAr: sub ? (SUB_STATUS_AR[sub.status] ?? sub.status) : "—",
      subIsActive: sub?.status === "active",
      subBillingCycleAr: sub ? (SUB_BILLING_AR[sub.billing_cycle] ?? sub.billing_cycle) : "—",
      createdAt: formatDate(org.created_at),
    };
  });
}
