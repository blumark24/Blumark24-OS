import type { PlanSlug } from "@/lib/features/packageFeatures";

export interface OrgPackageLimits {
  agencies: number;
  managements: number;
  departments: number;
  label: string;
  flow: string;
  badge: string;
}

/** PR #153 product limits (UI enforcement). */
export const ORG_PACKAGE_LIMITS: Record<PlanSlug, OrgPackageLimits> = {
  basic: {
    agencies: 0,
    managements: 0,
    departments: 3,
    label: "بسيط",
    flow: "مجلس الإدارة ← قسم ← موظفون",
    badge: "بداية مثالية",
  },
  growth: {
    agencies: 0,
    managements: 5,
    departments: 15,
    label: "نمو",
    flow: "مجلس الإدارة ← إدارة ← قسم ← موظفون",
    badge: "موصى به",
  },
  advanced: {
    agencies: 5,
    managements: 20,
    departments: 50,
    label: "متقدم",
    flow: "مجلس الإدارة ← وكالة ← إدارة ← قسم ← موظفون",
    badge: "الأكثر مرونة",
  },
};

export function getOrgLimits(plan: PlanSlug): OrgPackageLimits {
  return ORG_PACKAGE_LIMITS[plan] ?? ORG_PACKAGE_LIMITS.basic;
}
