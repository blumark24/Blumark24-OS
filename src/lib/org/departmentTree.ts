import type { Department } from "./types";

function sortDepartments(a: Department, b: Department): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar");
}

/** Lookup map of departments by id for the current fetch snapshot. */
export function buildDepartmentIndex(departments: Department[]): Map<string, Department> {
  return new Map(departments.map((d) => [d.id, d]));
}

/**
 * Orphan: parent_id is set but the parent row is missing from the snapshot.
 * Rendering only — does not mutate stored parent_id.
 */
export function isOrphanDepartment(d: Department, index: Map<string, Department>): boolean {
  if (d.parent_id === null) return false;
  return !index.has(d.parent_id);
}

/**
 * Children for chart/tree layout.
 * - parentId null: true roots (parent_id null) plus orphans (attached under board visually).
 * - parentId set: departments whose parent_id matches and parent exists in snapshot.
 */
export function departmentChildren(
  departments: Department[],
  parentId: string | null,
  index?: Map<string, Department>,
): Department[] {
  const byId = index ?? buildDepartmentIndex(departments);

  const filtered = departments.filter((d) => {
    if (parentId === null) {
      return d.parent_id === null || isOrphanDepartment(d, byId);
    }
    if (isOrphanDepartment(d, byId)) return false;
    return d.parent_id === parentId;
  });

  return filtered.sort(sortDepartments);
}

/** Development-only hint when orphan rows are promoted to board roots for display. */
export function warnOrphanDepartmentsInDev(departments: Department[]): void {
  if (process.env.NODE_ENV !== "development") return;
  const byId = buildDepartmentIndex(departments);
  const orphans = departments.filter((d) => isOrphanDepartment(d, byId));
  if (orphans.length === 0) return;
  console.warn(
    "[org] orphan departments rendered under board (parent_id not in snapshot):",
    orphans.map((d) => ({ id: d.id, name: d.name, parent_id: d.parent_id })),
  );
}
