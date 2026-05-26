import { getLevelFromDepartment } from "./packageHierarchy";
import type { Department, StructureLevel } from "./types";

function sortDepartments(a: Department, b: Department): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar");
}

const LEVEL_RANK: Record<StructureLevel, number> = {
  agency: 0,
  management: 1,
  department: 2,
};

/** Lookup map of departments by id for the current fetch snapshot. */
export function buildDepartmentIndex(departments: Department[]): Map<string, Department> {
  return new Map(departments.map((d) => [d.id, d]));
}

export type ParentChainIssue = "missing_parent" | "cycle" | "no_root";

export type DepartmentTreeContext = {
  index: Map<string, Department>;
  /** Departments rendered directly under مجلس الإدارة (render-only). */
  boardRootIds: Set<string>;
  missingParentIds: Set<string>;
  detachedIds: Set<string>;
  cycleIds: Set<string>;
};

/**
 * Orphan: parent_id is set but the parent row is missing from the snapshot.
 * Rendering only — does not mutate stored parent_id.
 */
export function isOrphanDepartment(d: Department, index: Map<string, Department>): boolean {
  if (d.parent_id === null) return false;
  return !index.has(d.parent_id);
}

function walkParentChain(
  d: Department,
  index: Map<string, Department>,
): { attached: boolean; issue?: ParentChainIssue } {
  if (d.parent_id === null) return { attached: true };
  if (!index.has(d.parent_id)) return { attached: false, issue: "missing_parent" };

  const visited = new Set<string>();
  let currentId: string | null = d.parent_id;
  while (currentId) {
    if (visited.has(currentId)) return { attached: false, issue: "cycle" };
    visited.add(currentId);
    const node = index.get(currentId);
    if (!node) return { attached: false, issue: "missing_parent" };
    if (node.parent_id === null) return { attached: true };
    currentId = node.parent_id;
  }
  return { attached: false, issue: "no_root" };
}

function compareRepresentative(a: Department, b: Department): number {
  const ra = LEVEL_RANK[getLevelFromDepartment(a)];
  const rb = LEVEL_RANK[getLevelFromDepartment(b)];
  if (ra !== rb) return ra - rb;
  return sortDepartments(a, b);
}

function pickRepresentative(members: Department[]): Department {
  return members.reduce((best, d) => (compareRepresentative(d, best) < 0 ? d : best));
}

function collectDetachedComponent(
  startId: string,
  detachedIds: Set<string>,
  index: Map<string, Department>,
  departments: Department[],
): Department[] {
  const component: Department[] = [];
  const stack = [startId];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id) || !detachedIds.has(id)) continue;
    seen.add(id);
    const dept = index.get(id);
    if (!dept) continue;
    component.push(dept);
    if (dept.parent_id && detachedIds.has(dept.parent_id)) stack.push(dept.parent_id);
    for (const other of departments) {
      if (other.parent_id === id && detachedIds.has(other.id)) stack.push(other.id);
    }
  }
  return component;
}

/**
 * Computes which departments attach under the board for render-only normalization.
 */
export function buildDepartmentTreeContext(departments: Department[]): DepartmentTreeContext {
  const index = buildDepartmentIndex(departments);
  const boardRootIds = new Set<string>();
  const missingParentIds = new Set<string>();
  const detachedIds = new Set<string>();
  const cycleIds = new Set<string>();

  for (const d of departments) {
    if (d.parent_id === null) {
      boardRootIds.add(d.id);
      continue;
    }
    if (isOrphanDepartment(d, index)) {
      boardRootIds.add(d.id);
      missingParentIds.add(d.id);
      continue;
    }
    const chain = walkParentChain(d, index);
    if (chain.attached) continue;

    detachedIds.add(d.id);
    if (chain.issue === "cycle") cycleIds.add(d.id);
    if (chain.issue === "missing_parent") missingParentIds.add(d.id);
  }

  const visitedComponents = new Set<string>();
  for (const id of Array.from(detachedIds)) {
    if (visitedComponents.has(id)) continue;
    const component = collectDetachedComponent(id, detachedIds, index, departments);
    for (const member of component) visitedComponents.add(member.id);
    if (component.length > 0) {
      boardRootIds.add(pickRepresentative(component).id);
    }
  }

  if (departments.length > 0 && boardRootIds.size === 0) {
    boardRootIds.add(pickRepresentative(departments).id);
    for (const d of departments) detachedIds.add(d.id);
  }

  return { index, boardRootIds, missingParentIds, detachedIds, cycleIds };
}

function isBoardRoot(d: Department, ctx: DepartmentTreeContext): boolean {
  return ctx.boardRootIds.has(d.id);
}

/**
 * Children for chart/tree layout (shared by المخطط and الشجرة).
 * - Board: true roots, missing-parent orphans, detached/cycle representatives.
 * - Nested: parent_id match when not promoted to board (no duplicates).
 */
export function departmentChildren(
  departments: Department[],
  parentId: string | null,
  ctx?: DepartmentTreeContext,
): Department[] {
  const context = ctx ?? buildDepartmentTreeContext(departments);

  const filtered = departments.filter((d) => {
    if (parentId === null) return isBoardRoot(d, context);
    if (isBoardRoot(d, context)) return false;
    return d.parent_id === parentId;
  });

  return filtered.sort(sortDepartments);
}

/** Development-only hints for render normalization (no customer UI). */
export function warnDepartmentTreeIssuesInDev(departments: Department[]): void {
  if (process.env.NODE_ENV !== "development") return;
  const ctx = buildDepartmentTreeContext(departments);

  if (ctx.missingParentIds.size > 0) {
    console.warn(
      "[org] missing-parent departments rendered under board:",
      Array.from(ctx.missingParentIds).map((id) => {
        const d = ctx.index.get(id);
        return { id, name: d?.name, parent_id: d?.parent_id };
      }),
    );
  }

  const detachedNoCycle = Array.from(ctx.detachedIds).filter((id) => !ctx.cycleIds.has(id));
  if (detachedNoCycle.length > 0) {
    console.warn(
      "[org] detached/no-root chain rendered under board:",
      detachedNoCycle.map((id) => {
        const d = ctx.index.get(id);
        return { id, name: d?.name, parent_id: d?.parent_id };
      }),
    );
  }

  if (ctx.cycleIds.size > 0) {
    console.warn(
      "[org] cycle in parent chain; representative rendered under board:",
      Array.from(ctx.cycleIds).map((id) => {
        const d = ctx.index.get(id);
        return { id, name: d?.name, parent_id: d?.parent_id, boardRoot: ctx.boardRootIds.has(id) };
      }),
    );
  }
}

/** @deprecated Use warnDepartmentTreeIssuesInDev */
export function warnOrphanDepartmentsInDev(departments: Department[]): void {
  warnDepartmentTreeIssuesInDev(departments);
}
