import type { PlanSlug } from "@/lib/features/packageFeatures";
import { getOrgLimits } from "@/lib/org/orgPackageLimits";
import type { OrgNodeKind, OrgUnitNode } from "@/lib/org/orgStructure";

/** Resolves parent_id for new units per package hierarchy rules. */
export function resolveParentForKind(
  plan: PlanSlug,
  kind: OrgNodeKind,
  explicitParentId: string | null,
  units: OrgUnitNode[],
  boardRootId: string,
): string | null {
  if (kind === "team") {
    return explicitParentId;
  }
  if (explicitParentId) {
    return explicitParentId;
  }

  const limits = getOrgLimits(plan);
  const agencies = units.filter((u) => u.kind === "agency");
  const managements = units.filter((u) => u.kind === "management");

  if (kind === "agency") {
    return boardRootId;
  }
  if (kind === "management") {
    return agencies[0]?.id ?? boardRootId;
  }
  if (kind === "department") {
    if (limits.managements > 0 && managements[0]) {
      return managements[0].id;
    }
    if (limits.agencies > 0 && agencies[0]) {
      return agencies[0].id;
    }
    return boardRootId;
  }
  return boardRootId;
}
