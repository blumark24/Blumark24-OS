import type { PlanSlug } from "@/lib/features/packageFeatures";
import { getLevelFromDepartment } from "./packageHierarchy";
import type { Department, OrgStructureSnapshot, StructureLevel } from "./types";

export const PLAN_LIMIT_REACHED_MSG = "وصلت للحد الأعلى في باقتك الحالية.";

/** Max nodes per structure_level per subscription plan. */
export const PLAN_STRUCTURE_CAPS: Record<
  PlanSlug,
  Record<StructureLevel, number>
> = {
  basic: { agency: 0, management: 0, department: 3 },
  growth: { agency: 0, management: 5, department: 15 },
  advanced: { agency: 5, management: 20, department: 50 },
};

export interface OrgPlanLimits {
  planSlug: PlanSlug;
  planLabelAr: string;
  tierClass: string;
  accent: string;
  structureCaps: Record<StructureLevel, number>;
  maxTeams: number;
  maxPositions: number;
}

const PLAN_META: Record<
  PlanSlug,
  Omit<OrgPlanLimits, "planSlug" | "structureCaps">
> = {
  basic: {
    planLabelAr: "أساسي",
    tierClass: "org-tier-basic",
    accent: "#22d3ee",
    maxTeams: 20,
    maxPositions: 25,
  },
  growth: {
    planLabelAr: "نمو",
    tierClass: "org-tier-growth",
    accent: "#a855f7",
    maxTeams: 60,
    maxPositions: 80,
  },
  advanced: {
    planLabelAr: "متقدم",
    tierClass: "org-tier-advanced",
    accent: "#f59e0b",
    maxTeams: 400,
    maxPositions: 500,
  },
};

export function getOrgPlanLimits(planSlug: PlanSlug): OrgPlanLimits {
  const meta = PLAN_META[planSlug] ?? PLAN_META.basic;
  return {
    planSlug,
    ...meta,
    structureCaps: PLAN_STRUCTURE_CAPS[planSlug] ?? PLAN_STRUCTURE_CAPS.basic,
  };
}

export function countDepartmentsAtLevel(
  departments: Department[],
  level: StructureLevel,
): number {
  return departments.filter((d) => getLevelFromDepartment(d) === level).length;
}

export function countStructure(snapshot: OrgStructureSnapshot) {
  return {
    agency: countDepartmentsAtLevel(snapshot.departments, "agency"),
    management: countDepartmentsAtLevel(snapshot.departments, "management"),
    department: countDepartmentsAtLevel(snapshot.departments, "department"),
    teams: snapshot.teams.length,
    positions: snapshot.positions.length,
    relations: snapshot.relations.length,
  };
}

export type OrgLimitCheck =
  | { allowed: true }
  | { allowed: false; message: string };

/** Enforce per-level caps (agency / management / department). */
export function checkCanAddStructureLevel(
  plan: PlanSlug,
  level: StructureLevel,
  departments: Department[],
): OrgLimitCheck {
  const cap = PLAN_STRUCTURE_CAPS[plan]?.[level] ?? 0;
  if (cap === 0) {
    return {
      allowed: false,
      message: `مستوى «${level}» غير متاح في باقتك الحالية.`,
    };
  }
  const current = countDepartmentsAtLevel(departments, level);
  if (current >= cap) {
    return { allowed: false, message: PLAN_LIMIT_REACHED_MSG };
  }
  return { allowed: true };
}

export function checkCanAddTeam(
  snapshot: OrgStructureSnapshot,
  limits: OrgPlanLimits,
): OrgLimitCheck {
  if (snapshot.teams.length >= limits.maxTeams) {
    return { allowed: false, message: PLAN_LIMIT_REACHED_MSG };
  }
  return { allowed: true };
}

export function checkCanAddPosition(
  snapshot: OrgStructureSnapshot,
  limits: OrgPlanLimits,
): OrgLimitCheck {
  if (snapshot.positions.length >= limits.maxPositions) {
    return { allowed: false, message: PLAN_LIMIT_REACHED_MSG };
  }
  return { allowed: true };
}
