import type { Node, Edge } from "@xyflow/react";
import { BOARD_LABEL_AR, getLevelFromDepartment, STRUCTURE_LEVEL_LABELS } from "./packageHierarchy";
import type { Department, EmployeeRelation, OrgStructureSnapshot, Team } from "./types";

export type OrgNodeData = {
  label: string;
  subtitle?: string;
  color: string;
  kind: "org" | "department" | "team" | "employee";
  entityId: string;
  structureLevel?: "agency" | "management" | "department";
  collapsed?: boolean;
  childCount?: number;
};

export const PARENT_SNAP_DISTANCE_PX = 280;

const NODE_W = 200;
const NODE_H = 72;
const GAP_X = 48;
const GAP_Y = 100;

function deptChildren(depts: Department[], parentId: string | null): Department[] {
  return depts
    .filter((d) => d.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));
}

function teamsForDept(teams: Team[], departmentId: string): Team[] {
  return teams
    .filter((t) => t.department_id === departmentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));
}

function layoutSubtree(
  depts: Department[],
  teams: Team[],
  relations: EmployeeRelation[],
  employeeNames: Map<string, string>,
  parentId: string | null,
  depth: number,
  xStart: number,
  collapsedDepts: Set<string>,
): { nodes: Node<OrgNodeData>[]; edges: Edge[]; width: number } {
  const children = deptChildren(depts, parentId);
  if (children.length === 0) return { nodes: [], edges: [], width: 0 };

  const nodes: Node<OrgNodeData>[] = [];
  const edges: Edge[] = [];
  let cursor = xStart;
  let totalWidth = 0;

  for (const dept of children) {
    const collapsed = collapsedDepts.has(dept.id);
    const subtree = collapsed
      ? { nodes: [] as Node<OrgNodeData>[], edges: [] as Edge[], width: 0 }
      : layoutSubtree(depts, teams, relations, employeeNames, dept.id, depth + 1, cursor, collapsedDepts);

    const teamList = collapsed ? [] : teamsForDept(teams, dept.id);
    let localWidth = Math.max(subtree.width, NODE_W);
    if (teamList.length > 0) {
      localWidth = Math.max(localWidth, teamList.length * (NODE_W + GAP_X) - GAP_X);
    }

    const deptX = cursor + localWidth / 2 - NODE_W / 2;
    const deptY = depth * GAP_Y;

    const level = getLevelFromDepartment(dept);
    nodes.push({
      id: `dept-${dept.id}`,
      type: "orgCard",
      position: { x: deptX, y: deptY },
      data: {
        label: dept.name,
        subtitle: dept.description ?? STRUCTURE_LEVEL_LABELS[level],
        color: dept.color,
        kind: "department",
        entityId: dept.id,
        structureLevel: level,
        collapsed,
        childCount: deptChildren(depts, dept.id).length + teamList.length,
      },
    });

    if (parentId) {
      edges.push({
        id: `e-dept-${parentId}-${dept.id}`,
        source: `dept-${parentId}`,
        target: `dept-${dept.id}`,
        type: "smoothstep",
        style: { stroke: dept.color, strokeWidth: 2 },
      });
    }

    subtree.nodes.forEach((n) => nodes.push(n));
    subtree.edges.forEach((e) => edges.push(e));

    if (!collapsed) {
      teamList.forEach((team, ti) => {
        const tx = cursor + ti * (NODE_W + GAP_X);
        const ty = (depth + 1) * GAP_Y;
        nodes.push({
          id: `team-${team.id}`,
          type: "orgCard",
          position: { x: tx, y: ty },
          data: {
            label: team.name,
            subtitle: "فريق",
            color: team.color,
            kind: "team",
            entityId: team.id,
          },
        });
        edges.push({
          id: `e-team-${dept.id}-${team.id}`,
          source: `dept-${dept.id}`,
          target: `team-${team.id}`,
          type: "smoothstep",
          style: { stroke: team.color },
        });

        const teamRels = relations.filter((r) => r.team_id === team.id);
        teamRels.forEach((rel, ri) => {
          const name = employeeNames.get(rel.employee_id) ?? "موظف";
          const ex = tx;
          const ey = (depth + 2) * GAP_Y + ri * (NODE_H + 16);
          nodes.push({
            id: `emp-${rel.employee_id}`,
            type: "orgCard",
            position: { x: ex, y: ey },
            data: {
              label: name,
              subtitle: "موظف",
              color: "#8ba3c7",
              kind: "employee",
              entityId: rel.employee_id,
            },
          });
          edges.push({
            id: `e-emp-${team.id}-${rel.employee_id}`,
            source: `team-${team.id}`,
            target: `emp-${rel.employee_id}`,
            type: "smoothstep",
          });
        });
      });
    }

      const deptOnlyRels = relations.filter(
        (r) => r.department_id === dept.id && !r.team_id,
      );
      deptOnlyRels.forEach((rel, ri) => {
        const name = employeeNames.get(rel.employee_id) ?? "موظف";
        const ey = (depth + 1) * GAP_Y + teamList.length * (NODE_H + 16) + ri * (NODE_H + 16);
        nodes.push({
          id: `emp-${rel.employee_id}`,
          type: "orgCard",
          position: { x: deptX, y: ey },
          data: {
            label: name,
            subtitle: "موظف · القسم",
            color: "#8ba3c7",
            kind: "employee",
            entityId: rel.employee_id,
          },
        });
        edges.push({
          id: `e-emp-dept-${dept.id}-${rel.employee_id}`,
          source: `dept-${dept.id}`,
          target: `emp-${rel.employee_id}`,
          type: "smoothstep",
          style: { stroke: dept.color },
        });
      });

        cursor += localWidth + GAP_X;
    totalWidth += localWidth + GAP_X;
  }

  return { nodes, edges, width: Math.max(0, totalWidth - GAP_X) };
}

export function buildOrgFlowGraph(
  snapshot: OrgStructureSnapshot,
  orgName: string,
  employeeNames: Map<string, string>,
  collapsedDepts: Set<string>,
  boardLabel: string = BOARD_LABEL_AR,
): { nodes: Node<OrgNodeData>[]; edges: Edge[] } {
  const rootLayout = layoutSubtree(
    snapshot.departments,
    snapshot.teams,
    snapshot.relations,
    employeeNames,
    null,
    1,
    0,
    collapsedDepts,
  );

  const rootWidth = Math.max(rootLayout.width, NODE_W);
  const rootNode: Node<OrgNodeData> = {
    id: "org-root",
    type: "orgCard",
    position: { x: rootWidth / 2 - NODE_W / 2, y: 0 },
    data: {
      label: boardLabel,
      subtitle: orgName,
      color: "#22d3ee",
      kind: "org",
      entityId: "root",
    },
  };

  const edges: Edge[] = [...rootLayout.edges];
  deptChildren(snapshot.departments, null).forEach((d) => {
    edges.push({
      id: `e-root-${d.id}`,
      source: "org-root",
      target: `dept-${d.id}`,
      type: "smoothstep",
      style: { stroke: "#22d3ee" },
    });
  });

  return { nodes: [rootNode, ...rootLayout.nodes], edges };
}
