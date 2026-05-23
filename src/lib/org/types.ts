export type StructureLevel = "agency" | "management" | "department";

export interface Department {
  id: string;
  organization_id: string;
  parent_id: string | null;
  structure_level: StructureLevel;
  name: string;
  description: string | null;
  manager_id: string | null;
  color: string;
  icon: string;
  sort_order: number;
}

export interface Team {
  id: string;
  organization_id: string;
  department_id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  color: string;
  icon: string;
  sort_order: number;
}

export interface Position {
  id: string;
  organization_id: string;
  parent_id: string | null;
  title: string;
  title_ar: string | null;
  level: number;
  permissions: string[];
  sort_order: number;
}

export interface EmployeeRelation {
  id: string;
  organization_id: string;
  employee_id: string;
  department_id: string | null;
  team_id: string | null;
  position_id: string | null;
  manager_id: string | null;
}

export interface OrgStructureSnapshot {
  departments: Department[];
  teams: Team[];
  positions: Position[];
  relations: EmployeeRelation[];
}

export type DepartmentInput = Pick<
  Department,
  | "name"
  | "description"
  | "manager_id"
  | "parent_id"
  | "structure_level"
  | "color"
  | "icon"
  | "sort_order"
>;

export type TeamInput = Pick<
  Team,
  "name" | "description" | "department_id" | "leader_id" | "color" | "icon" | "sort_order"
>;

export type PositionInput = Pick<
  Position,
  "title" | "title_ar" | "parent_id" | "level" | "permissions" | "sort_order"
>;

export type EmployeeRelationInput = Pick<
  EmployeeRelation,
  "employee_id" | "department_id" | "team_id" | "position_id" | "manager_id"
>;
