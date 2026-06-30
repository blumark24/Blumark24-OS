// VIRTUAL-OFFICE-MANUAL-HIERARCHY-MAPPING-1
//
// Tiny helpers for displaying the manual office-to-org-unit mapping
// picker inside the Virtual Office. Purely derivative — no Supabase
// writes, no auto-linking, no Auth/RLS/middleware/migration changes.
// Every office stays unassigned until the tenant manager picks a
// unit by hand. These helpers only enrich the picker UI with the
// canonical hierarchy path (وكالة > إدارة > قسم) and the right
// manager label per structure level.
//
// The OFFICE 05 contract is unaffected: the center slot stays
// مجلس الإدارة / مركز القرار regardless of any unit shown here.

import type { Department } from "@/lib/org/types";

export const STRUCTURE_LEVEL_LABEL_AR: Record<Department["structure_level"], string> = {
  agency: "وكالة",
  management: "إدارة",
  department: "قسم",
};

export const MANAGER_LABEL_BY_LEVEL: Record<Department["structure_level"], string> = {
  agency: "مدير الوكالة",
  management: "مدير الإدارة",
  department: "مدير القسم",
};

export interface HierarchyNode {
  id: string;
  name: string;
  level: Department["structure_level"];
}

// Hard cap on path length so a malformed parent_id cycle can never
// produce an infinite walk. The tenant-tested limit of 8 is far
// above any realistic Saudi-org structure.
const MAX_HIERARCHY_DEPTH = 8;

export function buildDepartmentHierarchyPath(
  departments: ReadonlyArray<Department> | null | undefined,
  departmentId: string | null | undefined,
  departmentsById?: Map<string, Department>,
): HierarchyNode[] {
  if (!departmentId) return [];

  // Reuse a caller-built index when provided (avoids O(N) rebuild per
  // department in hot loops like buildPreviewOrgUnits). Falls back to
  // an internal build so the helper stays usable standalone.
  let byId: Map<string, Department>;
  if (departmentsById) {
    byId = departmentsById;
  } else {
    if (!departments) return [];
    byId = new Map<string, Department>();
    for (const dept of departments) {
      if (dept && typeof dept.id === "string") byId.set(dept.id, dept);
    }
  }

  const out: HierarchyNode[] = [];
  const seen = new Set<string>();
  let current: Department | null | undefined = byId.get(departmentId) ?? null;
  let depth = 0;

  while (current && depth < MAX_HIERARCHY_DEPTH) {
    if (seen.has(current.id)) break; // cycle guard
    seen.add(current.id);

    out.unshift({
      id: current.id,
      name: typeof current.name === "string" ? current.name : "",
      level:
        current.structure_level === "agency"
          || current.structure_level === "management"
          || current.structure_level === "department"
          ? current.structure_level
          : "department",
    });

    if (!current.parent_id) break;
    current = byId.get(current.parent_id) ?? null;
    depth++;
  }

  return out;
}

export function formatHierarchyPath(path: ReadonlyArray<HierarchyNode>): string {
  return path
    .map((node) => (typeof node.name === "string" ? node.name.trim() : ""))
    .filter((name): name is string => name.length > 0)
    .join(" > ");
}

export function managerLabelForLevel(
  level?: Department["structure_level"] | null,
): string {
  if (level === "agency") return MANAGER_LABEL_BY_LEVEL.agency;
  if (level === "management") return MANAGER_LABEL_BY_LEVEL.management;
  return MANAGER_LABEL_BY_LEVEL.department;
}

export function structureLevelLabelAr(
  level?: Department["structure_level"] | null,
): string {
  if (level === "agency") return STRUCTURE_LEVEL_LABEL_AR.agency;
  if (level === "management") return STRUCTURE_LEVEL_LABEL_AR.management;
  return STRUCTURE_LEVEL_LABEL_AR.department;
}

// Acceptance contract — throws when any canonical label drifts.
// Callers (acceptance test file, future verify scripts) may invoke
// this without any IO; it is pure-runtime and side-effect free.
export function assertOrgHierarchyContract(): void {
  if (STRUCTURE_LEVEL_LABEL_AR.agency !== "وكالة")
    throw new Error("[orgHierarchy] agency level label drifted");
  if (STRUCTURE_LEVEL_LABEL_AR.management !== "إدارة")
    throw new Error("[orgHierarchy] management level label drifted");
  if (STRUCTURE_LEVEL_LABEL_AR.department !== "قسم")
    throw new Error("[orgHierarchy] department level label drifted");

  if (MANAGER_LABEL_BY_LEVEL.agency !== "مدير الوكالة")
    throw new Error("[orgHierarchy] agency manager label drifted");
  if (MANAGER_LABEL_BY_LEVEL.management !== "مدير الإدارة")
    throw new Error("[orgHierarchy] management manager label drifted");
  if (MANAGER_LABEL_BY_LEVEL.department !== "مدير القسم")
    throw new Error("[orgHierarchy] department manager label drifted");
}
