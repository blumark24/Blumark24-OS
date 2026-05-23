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

/** Customer tenant sidebar order (product spec). */
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

/** Canonical route registry — array order is default internal nav order. */
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
    id: "employees",
    href: "/employees",
    feature: "employees",
    permission: "view_employees",
    internalOnly: false,
    audience: "client",
    iconName: "Users",
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
    id: "strategy",
    href: "/strategy",
    feature: "strategy",
    permission: "manage_reports",
    internalOnly: false,
    audience: "shared",
    iconName: "Map",
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
    id: "automation",
    href: "/automation",
    feature: "automation",
    permission: "manage_automations",
    internalOnly: false,
    audience: "shared",
    iconName: "Zap",
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
    id: "ai",
    href: "/ai",
    feature: "ai",
    permission: "view_dashboard",
    internalOnly: false,
    audience: "shared",
    iconName: "Bot",
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
  {
    id: "attack",
    href: "/attack",
    feature: null,
    permission: "manage_clients",
    internalOnly: true,
    audience: "internal",
    iconName: "Activity",
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

export function getRouteById(id: WorkspaceRouteId): WorkspaceRouteDef | null {
  return ROUTE_BY_ID.get(id) ?? null;
}

/** True when `required` is granted directly or via permission hierarchy. */
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
    employees: "الموظفون",
    tasks: "المهام",
    clients: "العملاء CRM",
    finance: "مالية المنشأة",
    strategy: "استراتيجية المنشأة",
    org: "الهيكل الإداري للمنشأة",
    automation: "مركز الأتمتة",
    attack: "وكالة الهجوم",
    ai: "المساعد الذكي",
    reports: "التقارير والتحليلات",
    settings: "الإعدادات",
  };
  return tenantLabels[routeId];
}

export const TENANT_EMPTY_STATE_MSG =
  "لم يتم إعداد الهيكل التنظيمي بعد";

export const TENANT_EMPTY_STATE_HINT =
  "ابدأ بإضافة قسم رئيسي من زر «قسم جديد» — الأقسام والفرق والمسميات تُحفظ لمنشأتك فقط.";

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
): boolean {
  if (ctx.isPlatformAdmin) return true;

  if (route.internalOnly && !ctx.isInternal) return false;

  if (!satisfiesPermission(route.permission, hasPermission)) return false;

  if (ctx.isInternal) return true;

  if (!route.feature) return true;
  return planIncludesFeature(ctx.planSlug, route.feature);
}

function sortRoutesForNav(
  routes: WorkspaceRouteDef[],
  isInternal: boolean,
): WorkspaceRouteDef[] {
  if (isInternal) return routes;
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
  return sortRoutesForNav(filtered, ctx.isInternal);
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
