import type { Permission } from "@/contexts/PermissionsContext";

/** Subscription plan slugs (matches `plans.slug` in owner center). */
export type PlanSlug = "basic" | "growth" | "advanced";

/** Logical workspace modules gated by plan + org type. */
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
  | "attack"
  | "ai"
  | "reports"
  | "settings";

export type RouteAudience = "internal" | "client" | "owner" | "shared";

export interface WorkspaceRouteDef {
  id: WorkspaceRouteId;
  href: string;
  feature: WorkspaceFeature | null;
  permission: Permission;
  /** Blumark24 platform operations — never shown to customer tenants. */
  internalOnly: boolean;
  audience: RouteAudience;
  iconName: string;
}

/** Features included per customer package (owner plan slugs). */
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

export const PLAN_LABELS_AR: Record<PlanSlug, string> = {
  basic: "بسيط",
  growth: "نمو",
  advanced: "متقدم",
};

/** Canonical route registry (single source of truth for nav + guards). */
export const WORKSPACE_ROUTES: WorkspaceRouteDef[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    feature: "dashboard",
    permission: "view_dashboard",
    internalOnly: false,
    audience: "shared",
    iconName: "LayoutDashboard",
  },
  {
    id: "employees",
    href: "/employees",
    feature: "employees",
    permission: "view_employees",
    internalOnly: false,
    audience: "client",
    iconName: "Users",
  },
  {
    id: "tasks",
    href: "/tasks",
    feature: "tasks",
    permission: "manage_tasks",
    internalOnly: false,
    audience: "shared",
    iconName: "CheckSquare",
  },
  {
    id: "clients",
    href: "/clients",
    feature: "clients",
    permission: "manage_clients",
    internalOnly: false,
    audience: "shared",
    iconName: "UserCircle",
  },
  {
    id: "finance",
    href: "/finance",
    feature: "finance",
    permission: "manage_finance",
    internalOnly: false,
    audience: "shared",
    iconName: "DollarSign",
  },
  {
    id: "strategy",
    href: "/strategy",
    feature: "strategy",
    permission: "manage_reports",
    internalOnly: false,
    audience: "shared",
    iconName: "Map",
  },
  {
    id: "org",
    href: "/org",
    feature: "org",
    permission: "view_dashboard",
    internalOnly: false,
    audience: "shared",
    iconName: "Network",
  },
  {
    id: "automation",
    href: "/automation",
    feature: "automation",
    permission: "manage_automations",
    internalOnly: false,
    audience: "shared",
    iconName: "Zap",
  },
  {
    id: "attack",
    href: "/attack",
    feature: null,
    permission: "manage_clients",
    internalOnly: true,
    audience: "internal",
    iconName: "Activity",
  },
  {
    id: "ai",
    href: "/ai",
    feature: "ai",
    permission: "view_dashboard",
    internalOnly: false,
    audience: "shared",
    iconName: "Bot",
  },
  {
    id: "reports",
    href: "/reports",
    feature: "reports",
    permission: "manage_reports",
    internalOnly: false,
    audience: "shared",
    iconName: "BarChart3",
  },
  {
    id: "settings",
    href: "/settings",
    feature: null,
    permission: "manage_settings",
    internalOnly: false,
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

export function normalizePlanSlug(slug: string | null | undefined): PlanSlug {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s === "growth" || s === "advanced") return s;
  return "basic";
}

export function planIncludesFeature(
  planSlug: PlanSlug,
  feature: WorkspaceFeature,
): boolean {
  return PLAN_FEATURES[planSlug].includes(feature);
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

export function getRouteById(id: WorkspaceRouteId): WorkspaceRouteDef {
  return ROUTE_BY_ID.get(id)!;
}

/** Nav labels: tenant-facing vs internal Blumark24 operations. */
export function getRouteLabel(routeId: WorkspaceRouteId, isInternal: boolean): string {
  if (isInternal) {
    const internalLabels: Partial<Record<WorkspaceRouteId, string>> = {
      employees: "الموظفين",
      clients: "العملاء (CRM)",
      finance: "المالية",
      strategy: "الاستراتيجية",
      org: "الهيكل الإداري",
      automation: "مركز الأتمتة",
      attack: "وكالة الهجوم",
      ai: "المساعد الذكي",
      reports: "التقارير",
      dashboard: "الرئيسية",
      tasks: "المهام",
      settings: "الإعدادات",
    };
    return internalLabels[routeId] ?? routeId;
  }

  const tenantLabels: Record<WorkspaceRouteId, string> = {
    dashboard: "الرئيسية",
    employees: "الموظفين",
    tasks: "المهام",
    clients: "العملاء CRM",
    finance: "مالية المنشأة",
    strategy: "استراتيجية المنشأة",
    org: "الهيكل الإداري",
    automation: "مركز الأتمتة",
    attack: "وكالة الهجوم",
    ai: "المساعد الذكي",
    reports: "التقارير والتحليلات",
    settings: "الإعدادات",
  };
  return tenantLabels[routeId];
}

export const TENANT_EMPTY_STATE_MSG =
  "لم يتم إعداد بيانات هذه المنشأة بعد";

export interface WorkspaceAccessContext {
  isInternal: boolean;
  planSlug: PlanSlug;
  /** Platform super_admin — full internal + bypass package limits when org unknown. */
  isPlatformAdmin: boolean;
}

export function canAccessWorkspaceRoute(
  route: WorkspaceRouteDef,
  ctx: WorkspaceAccessContext,
  hasPermission: (perm: Permission) => boolean,
  extraPerms: Permission[] = [],
): boolean {
  if (ctx.isPlatformAdmin) return true;

  if (route.internalOnly && !ctx.isInternal) return false;

  const permOk =
    hasPermission(route.permission) ||
    extraPerms.some((p) => hasPermission(p));
  if (!permOk) return false;

  if (ctx.isInternal) return true;

  if (!route.feature) return true;
  return planIncludesFeature(ctx.planSlug, route.feature);
}

export function filterNavRoutes(
  ctx: WorkspaceAccessContext,
  hasPermission: (perm: Permission) => boolean,
): WorkspaceRouteDef[] {
  const extra: Permission[] = ["view_employees"];
  return WORKSPACE_ROUTES.filter((route) =>
    canAccessWorkspaceRoute(route, ctx, hasPermission, extra),
  );
}

/** Route classification for docs / PR (audience column). */
export function getRouteClassificationTable(): {
  href: string;
  class: "A-internal" | "B-client" | "C-owner";
  internalOnly: boolean;
  packageGated: boolean;
}[] {
  return WORKSPACE_ROUTES.map((r) => ({
    href: r.href,
    class:
      r.audience === "internal"
        ? "A-internal"
        : r.audience === "owner"
          ? "C-owner"
          : "B-client",
    internalOnly: r.internalOnly,
    packageGated: r.feature !== null && !r.internalOnly,
  }));
}
