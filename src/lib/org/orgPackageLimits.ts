import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { OrgStructureSnapshot } from "./types";

export interface OrgPlanLimits {
  planSlug: PlanSlug;
  planLabelAr: string;
  tierClass: string;
  accent: string;
  maxDepartments: number;
  maxTeams: number;
  maxPositions: number;
  maxDepth: number;
}

const LIMITS: Record<PlanSlug, Omit<OrgPlanLimits, "planSlug">> = {
  basic: {
    planLabelAr: "أساسي",
    tierClass: "org-tier-basic",
    accent: "#22d3ee",
    maxDepartments: 10,
    maxTeams: 20,
    maxPositions: 25,
    maxDepth: 2,
  },
  growth: {
    planLabelAr: "نمو",
    tierClass: "org-tier-growth",
    accent: "#a855f7",
    maxDepartments: 30,
    maxTeams: 60,
    maxPositions: 80,
    maxDepth: 4,
  },
  advanced: {
    planLabelAr: "متقدم",
    tierClass: "org-tier-advanced",
    accent: "#f59e0b",
    maxDepartments: 200,
    maxTeams: 400,
    maxPositions: 500,
    maxDepth: 8,
  },
};

export function getOrgPlanLimits(planSlug: PlanSlug): OrgPlanLimits {
  const base = LIMITS[planSlug] ?? LIMITS.basic;
  return { planSlug, ...base };
}

function departmentDepth(
  departments: OrgStructureSnapshot["departments"],
  deptId: string,
): number {
  let depth = 1;
  let current = departments.find((d) => d.id === deptId);
  while (current?.parent_id) {
    depth += 1;
    current = departments.find((d) => d.id === current!.parent_id);
  }
  return depth;
}

export function countStructure(snapshot: OrgStructureSnapshot) {
  return {
    departments: snapshot.departments.length,
    teams: snapshot.teams.length,
    positions: snapshot.positions.length,
    relations: snapshot.relations.length,
  };
}

export type OrgLimitCheck =
  | { allowed: true }
  | { allowed: false; message: string };

export function checkCanAddDepartment(
  snapshot: OrgStructureSnapshot,
  limits: OrgPlanLimits,
  parentId: string | null,
): OrgLimitCheck {
  if (snapshot.departments.length >= limits.maxDepartments) {
    return {
      allowed: false,
      message: `بلغت الحد الأقصى للإدارات (${limits.maxDepartments}) في باقة ${limits.planLabelAr}`,
    };
  }
  if (parentId) {
    const depth = departmentDepth(snapshot.departments, parentId) + 1;
    if (depth > limits.maxDepth) {
      return {
        allowed: false,
        message: `عمق الهيكل في باقة ${limits.planLabelAr} محدود بـ ${limits.maxDepth} مستويات`,
      };
    }
  }
  return { allowed: true };
}

export function checkCanAddTeam(
  snapshot: OrgStructureSnapshot,
  limits: OrgPlanLimits,
): OrgLimitCheck {
  if (snapshot.teams.length >= limits.maxTeams) {
    return {
      allowed: false,
      message: `بلغت الحد الأقصى للفرق (${limits.maxTeams}) في باقة ${limits.planLabelAr}`,
    };
  }
  return { allowed: true };
}

export function checkCanAddPosition(
  snapshot: OrgStructureSnapshot,
  limits: OrgPlanLimits,
): OrgLimitCheck {
  if (snapshot.positions.length >= limits.maxPositions) {
    return {
      allowed: false,
      message: `بلغت الحد الأقصى للمسميات (${limits.maxPositions}) في باقة ${limits.planLabelAr}`,
    };
  }
  return { allowed: true };
}
