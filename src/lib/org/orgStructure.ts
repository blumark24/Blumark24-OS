import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { Employee } from "@/types";
import {
  applyOrgStructureSuggestion,
  type ApplyOrgSuggestionResult,
  deleteOrgUnit,
  insertOrgUnit,
  loadOrgStructureFromDb,
  orgUnitsTableAvailable,
} from "@/lib/org/orgUnitsDb";

export type OrgNodeKind = "agency" | "management" | "department" | "team";

export interface OrgUnitNode {
  id: string;
  kind: OrgNodeKind;
  name: string;
  parentId: string | null;
}

export interface OrgStructureSnapshot {
  units: OrgUnitNode[];
  updatedAt: string;
}

/** Production org_units table is the source of truth when available. */
export const ORG_STRUCTURE_IS_PRODUCTION_UNITS = true;

export function createOrgUnit(
  kind: OrgNodeKind,
  name: string,
  parentId: string | null,
): OrgUnitNode {
  return {
    id: `draft-${kind}-${Date.now()}`,
    kind,
    name: name.trim(),
    parentId,
  };
}

export function emptyOrgStructure(): OrgStructureSnapshot {
  return { units: [], updatedAt: new Date().toISOString() };
}

export async function loadOrgStructure(orgId: string | null): Promise<OrgStructureSnapshot> {
  if (!orgId) return emptyOrgStructure();

  const hasTable = await orgUnitsTableAvailable();
  if (!hasTable) {
    return emptyOrgStructure();
  }

  return loadOrgStructureFromDb(orgId);
}

export async function addOrgUnit(
  orgId: string,
  kind: OrgNodeKind,
  name: string,
  parentId: string | null,
  plan?: PlanSlug,
): Promise<OrgUnitNode> {
  return insertOrgUnit(orgId, kind, name, parentId, plan);
}

export async function removeOrgUnit(orgId: string, unitId: string): Promise<void> {
  await deleteOrgUnit(unitId, orgId);
}

export async function applyOrgStructure(
  orgId: string,
  snapshot: OrgStructureSnapshot,
  employees: Employee[] = [],
  plan?: PlanSlug,
): Promise<ApplyOrgSuggestionResult> {
  return applyOrgStructureSuggestion(orgId, snapshot, employees, plan);
}

export function countUnits(units: OrgUnitNode[], kind: OrgNodeKind): number {
  return units.filter((u) => u.kind === kind).length;
}

export function departmentsForParent(units: OrgUnitNode[], parentId: string | null): OrgUnitNode[] {
  return units.filter((u) => u.kind === "department" && u.parentId === parentId);
}

export function childrenOf(units: OrgUnitNode[], parentId: string | null): OrgUnitNode[] {
  return units.filter((u) => u.parentId === parentId);
}
