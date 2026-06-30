// VIRTUAL-OFFICE-MANUAL-HIERARCHY-MAPPING-1 — acceptance assertions.
//
// Pure-runtime assertions for the manual org-hierarchy mapping contract.
// No Supabase, no Auth/RLS/middleware/migration touch, no auto-linking.
// Throws when any rule drifts:
//   - canonical Arabic level labels (agency = وكالة, management = إدارة, department = قسم)
//   - canonical manager labels per level
//   - parent_id-based path construction order (agency → management → department)
//   - cycle guard in buildDepartmentHierarchyPath
//   - structureLevelLabelAr fallback for unknown / null
//
// These assertions follow the existing virtual-office acceptance
// pattern in this folder (officeScopeAcceptance,
// productionReadinessPolicy.acceptance, …).

import type { Department } from "@/lib/org/types";
import {
  assertOrgHierarchyContract,
  buildDepartmentHierarchyPath,
  formatHierarchyPath,
  managerLabelForLevel,
  structureLevelLabelAr,
} from "../orgHierarchy";

function makeDept(input: {
  id: string;
  parent_id: string | null;
  structure_level: Department["structure_level"];
  name: string;
}): Department {
  return {
    id: input.id,
    organization_id: "acceptance-org",
    parent_id: input.parent_id,
    structure_level: input.structure_level,
    name: input.name,
    description: null,
    manager_id: null,
    color: "",
    icon: "",
    sort_order: 0,
  };
}

export function runOrgHierarchyAcceptance(): { ok: true } {
  // 1. Canonical labels — never drift without a deliberate sprint.
  assertOrgHierarchyContract();

  // 2. parent_id walk produces a top-down ordered path.
  const departments: Department[] = [
    makeDept({ id: "ag-1", parent_id: null, structure_level: "agency", name: "وكالة الشركة" }),
    makeDept({ id: "mg-1", parent_id: "ag-1", structure_level: "management", name: "إدارة العمليات" }),
    makeDept({ id: "dp-1", parent_id: "mg-1", structure_level: "department", name: "قسم العملاء" }),
  ];

  const path = buildDepartmentHierarchyPath(departments, "dp-1");
  if (path.length !== 3) {
    throw new Error("[orgHierarchy.acceptance] expected 3 nodes in path");
  }
  if (path[0].level !== "agency") {
    throw new Error("[orgHierarchy.acceptance] root must be agency");
  }
  if (path[1].level !== "management") {
    throw new Error("[orgHierarchy.acceptance] mid must be management");
  }
  if (path[2].level !== "department") {
    throw new Error("[orgHierarchy.acceptance] tail must be department");
  }
  if (formatHierarchyPath(path) !== "وكالة الشركة > إدارة العمليات > قسم العملاء") {
    throw new Error("[orgHierarchy.acceptance] formatted path drifted");
  }

  // 3. Single-node path (no parent) renders just that node.
  const single = buildDepartmentHierarchyPath(departments, "ag-1");
  if (single.length !== 1 || single[0].level !== "agency") {
    throw new Error("[orgHierarchy.acceptance] single-node walk broken");
  }

  // 4. Cycle guard — must not loop forever.
  const cyclical: Department[] = [
    makeDept({ id: "a", parent_id: "b", structure_level: "department", name: "A" }),
    makeDept({ id: "b", parent_id: "a", structure_level: "department", name: "B" }),
  ];
  const cyclePath = buildDepartmentHierarchyPath(cyclical, "a");
  if (cyclePath.length > 8) {
    throw new Error("[orgHierarchy.acceptance] cycle guard failed");
  }

  // 5. Manager-label-by-level invariants.
  if (managerLabelForLevel("agency") !== "مدير الوكالة") {
    throw new Error("[orgHierarchy.acceptance] agency manager label drifted");
  }
  if (managerLabelForLevel("management") !== "مدير الإدارة") {
    throw new Error("[orgHierarchy.acceptance] management manager label drifted");
  }
  if (managerLabelForLevel("department") !== "مدير القسم") {
    throw new Error("[orgHierarchy.acceptance] department manager label drifted");
  }

  // 6. Safe fallbacks for null / empty / unknown input.
  if (structureLevelLabelAr(null) !== "قسم") {
    throw new Error("[orgHierarchy.acceptance] null level should fall back to department");
  }
  if (buildDepartmentHierarchyPath([], "x").length !== 0) {
    throw new Error("[orgHierarchy.acceptance] empty departments should return empty path");
  }
  if (buildDepartmentHierarchyPath(departments, null).length !== 0) {
    throw new Error("[orgHierarchy.acceptance] null id should return empty path");
  }

  return { ok: true };
}
