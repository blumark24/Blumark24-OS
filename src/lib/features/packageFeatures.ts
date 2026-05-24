import type { Permission } from "@/contexts/PermissionsContext";

/** Subscription plan slugs (matches `plans.slug` in owner center). */
export type PlanSlug = "basic" | "growth" | "advanced";

/** Logical workspace modules gated by plan. */
export type WorkspaceFeature =
  | "dashboard"
  | "tasks"
  | "clients"
  | "org"
  | "ai"
  | "reports"
  | "employees"
  | "strategy"
  | "finance"
  | "automation";

export type WorkspaceRouteId =
  | "dashboard"
  | "employees"
  | "tasks"
  | "clients"
  | "finance"
  | "strategy"
  | "org"
  | "automation"
  | "ai"
  | "reports"
  | "settings";

export type RouteAudience = "client" | "owner" | "shared";

export interface WorkspaceRouteDef {
  id: WorkspaceRouteId;
  href: string;
  feature: WorkspaceFeature | null;
  permission: Permission;
  audience: RouteAudience;
  iconName: string;
}

/** Seed defaults for migration 020 / owner UI — not used at tenant runtime. */
export const PLAN_FEATURES: Record<PlanSlug, WorkspaceFeature[]> = {
  basic: ["dashboard", "tasks", "clients", "org", "ai", "reports"],
  growth: [
    "dashboard",
    "tasks",
    "clients",
    "org",
    "ai",
    "reports",
    "employees",
    "strategy",
  ],
  advanced: [
    "dashboard",
    "tasks",
    "clients",
    "org",
    "ai",
    "reports",
    "employees",
    "strategy",
    "finance",
    "automation",
  ],
};

export const ALL_WORKSPACE_FEATURES: WorkspaceFeature[] = [
  "dashboard",
  "tasks",
  "clients",
  "org",
  "ai",
  "reports",
  "employees",
  "strategy",
  "finance",
  "automation",
];

export const PLAN_LABELS_AR: Record<PlanSlug, string> = {
  basic: "بسيط",
  growth: "نمو",
  advanced: "متقدم",
};

/** Tenant sidebar order */
export const TENANT_NAV_ORDER: WorkspaceRouteId[] = [
  "dashboard",
  "tasks",
  "clients",
  "employees",
  "org",
  "strategy",
  "finance",
  "automation",
  "reports",
  "ai",
  "settings",
];

export const WORKSPACE_ROUTES: WorkspaceRouteDef[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    feature: "dashboard",
    permission: "view_dashboard",
    audience: "shared",
    iconName: "LayoutDashboard",
  },
  {
    id: "tasks",
    href: "/tasks",
    feature: "tasks",
    permission: "manage_tasks",
    audience: "shared",
    iconName: "CheckSquare",
  },
  {
    id: "clients",
    href: "/clients",
    feature: "clients",
    permission: "manage_clients",
    audience: "shared",
    iconName: "UserCircle",
  },
  {
    id: "employees",
    href: "/employees",
    feature: "employees",
    permission: "view_employees",
    audience: "client",
    iconName: "Users",
  },
  {
    id: "org",
    href: "/org",
    feature: "org",
    permission: "view_dashboard",
    audience: "shared",
    iconName: "Network",
  },
  {
    id: "strategy",
    href: "/strategy",
    feature: "strategy",
    permission: "manage_reports",
    audience: "shared",
    iconName: "Map",
  },
  {
    id: "finance",
    href: "/finance",
    feature: "finance",
    permission: "manage_finance",
    audience: "shared",
    iconName: "DollarSign",
  },
  {
    id: "automation",
    href: "/automation",
    feature: "automation",
    permission: "manage_automations",
    audience: "shared",
    iconName: "Zap",
  },
  {
    id: "reports",
    href: "/reports",
    feature: "reports",
    permission: "manage_reports",
    audience: "shared",
    iconName: "BarChart3",
  },
  {
    id: "ai",
    href: "/ai",
    feature: "ai",
    permission: "view_dashboard",
    audience: "shared",
    iconName: "Bot",
  },
  {
    id: "settings",
    href: "/settings",
    feature: null,
    permission: "manage_settings",
    audience: "shared",
    iconName: "Settings",
  },
];

const ROUTE_BY_HREF = new Map(
  WORKSPACE_ROUTES.map((r) => [r.href, r] as const),
);

const ROUTE_BY_ID = new Map(
  WORKSPACE_ROUTES.map((r) => [r.id, r] as const),
);

const NAV_ORDER_INDEX = new Map(
  TENANT_NAV_ORDER.map((id, i) => [id, i] as const),
);

const ROUTE_LABELS_AR: Record<WorkspaceRouteId, string> = {
  dashboard: "الرئيسية",
  employees: "الموظفون",
  tasks: "المهام",
  clients: "العملاء",
  finance: "مالية المنشأة",
  strategy: "استراتيجية المنشأة",
  org: "الهيكل الإداري",
  automation: "مركز الأتمتة",
  ai: "المساعد الذكي",
  reports: "التقارير",
  settings: "الإعدادات",
};

export function normalizePlanSlug(slug: string | null | undefined): PlanSlug {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s === "growth" || s === "advanced") return s;
  return "basic";
}

/** Runtime check — pass enabledFeatures from workspace-context API. */
export function featureEnabled(
  enabledFeatures: WorkspaceFeature[],
  feature: WorkspaceFeature,
): boolean {
  return enabledFeatures.includes(feature);
}

/** Fallback when DB plan_features unavailable (dev / pre-migration). */
export function defaultFeaturesForPlan(planSlug: PlanSlug): WorkspaceFeature[] {
  return [...PLAN_FEATURES[planSlug]];
}

export function getRouteByPathname(pathname: string): WorkspaceRouteDef | null {
  if (!pathname) return null;
  const exact = ROUTE_BY_HREF.get(pathname);
  if (exact) return exact;
  for (const route of WORKSPACE_ROUTES) {
    if (route.href !== "/dashboard" && pathname.startsWith(route.href)) {
      return route;
    }
  }
  return null;
}

export function getRouteById(id: WorkspaceRouteId): WorkspaceRouteDef | null {
  return ROUTE_BY_ID.get(id) ?? null;
}

export function satisfiesPermission(
  required: Permission,
  hasPermission: (perm: Permission) => boolean,
): boolean {
  if (hasPermission(required)) return true;
  if (required === "view_employees" && hasPermission("manage_users")) return true;
  if (required === "manage_settings" && hasPermission("manage_tenant_settings")) return true;
  if (required === "manage_tenant_settings" && hasPermission("manage_settings")) return true;
  return false;
}

export function getRouteLabel(routeId: WorkspaceRouteId): string {
  return ROUTE_LABELS_AR[routeId] ?? routeId;
}

export const TENANT_EMPTY_STATE_MSG =
  "لم يتم إعداد الهيكل التنظيمي بعد";

export const TENANT_EMPTY_STATE_HINT =
  "ابدأ بإضافة قسم رئيسي من زر «قسم جديد» — الأقسام والفرق والمسميات تُحفظ لمنشأتك فقط.";

export interface WorkspaceAccessContext {
  planSlug: PlanSlug;
  enabledFeatures: WorkspaceFeature[];
  isPlatformAdmin: boolean;
}

export function canAccessWorkspaceRoute(
  route: WorkspaceRouteDef,
  ctx: WorkspaceAccessContext,
  hasPermission: (perm: Permission) => boolean,
): boolean {
  if (ctx.isPlatformAdmin) return true;

  if (!satisfiesPermission(route.permission, hasPermission)) return false;

  if (!route.feature) return true;
  return featureEnabled(ctx.enabledFeatures, route.feature);
}

function sortRoutesForNav(routes: WorkspaceRouteDef[]): WorkspaceRouteDef[] {
  return [...routes].sort((a, b) => {
    const ai = NAV_ORDER_INDEX.get(a.id) ?? 999;
    const bi = NAV_ORDER_INDEX.get(b.id) ?? 999;
    return ai - bi;
  });
}

export function filterNavRoutes(
  ctx: WorkspaceAccessContext,
  hasPermission: (perm: Permission) => boolean,
): WorkspaceRouteDef[] {
  const filtered = WORKSPACE_ROUTES.filter((route) =>
    canAccessWorkspaceRoute(route, ctx, hasPermission),
  );
  return sortRoutesForNav(filtered);
}

export function getRouteClassificationTable(): {
  href: string;
  class: "B-client" | "C-owner";
  packageGated: boolean;
}[] {
  return WORKSPACE_ROUTES.map((r) => ({
    href: r.href,
    class: r.audience === "owner" ? "C-owner" : "B-client",
    packageGated: r.feature !== null,
  }));
}
