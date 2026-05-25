import { BOARD_LABEL_AR } from "./packageHierarchy";
import { getLevelFromDepartment, STRUCTURE_LEVEL_LABELS } from "./packageHierarchy";
import type { Department, OrgStructureSnapshot, StructureLevel } from "./types";

/** Reserved governance root label — never stored as a department row. */
export function isBoardReservedName(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  return n === BOARD_LABEL_AR || n === "مجلس ادارة" || n.toLowerCase() === "board";
}

/** Units where employees may be assigned (all structure nodes except reserved duplicates). */
export function getAssignableOrgUnits(departments: Department[]): Department[] {
  return departments
    .filter((d) => !isBoardReservedName(d.name))
    .sort((a, b) => {
      const levelOrder: Record<StructureLevel, number> = {
        agency: 0,
        management: 1,
        department: 2,
      };
      const la = levelOrder[getLevelFromDepartment(a)] ?? 9;
      const lb = levelOrder[getLevelFromDepartment(b)] ?? 9;
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name, "ar");
    });
}

export function formatOrgUnitOption(dept: Department): string {
  const level = STRUCTURE_LEVEL_LABELS[getLevelFromDepartment(dept)];
  return `${dept.name} (${level})`;
}

export function findOrgUnitById(
  departments: Department[],
  id: string | null | undefined,
): Department | undefined {
  if (!id) return undefined;
  return departments.find((d) => d.id === id);
}

export function resolveOrgUnitIdForEmployee(
  departments: Department[],
  departmentName: string | null | undefined,
  relationDeptId: string | null | undefined,
): string {
  if (relationDeptId) {
    const byId = findOrgUnitById(departments, relationDeptId);
    if (byId) return byId.id;
  }
  const raw = String(departmentName ?? "").trim();
  if (!raw) return "";
  const match = departments.find((d) => d.name === raw);
  return match?.id ?? "";
}

export function countEmployeesInOrg(snapshot: OrgStructureSnapshot): number {
  return new Set(snapshot.relations.map((r) => r.employee_id)).size;
}
