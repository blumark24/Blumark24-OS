import { supabase } from "@/lib/supabase";
import type { Employee } from "@/types";
import type { OrgNodeKind, OrgStructureSnapshot, OrgUnitNode } from "@/lib/org/orgStructure";

export type OrgUnitType = "board" | "agency" | "management" | "department" | "team";

export interface DbOrgUnitRow {
  id: string;
  organization_id: string;
  parent_id: string | null;
  unit_type: OrgUnitType;
  name: string;
  description: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrgUnitMemberRow {
  id: string;
  organization_id: string;
  org_unit_id: string;
  employee_id: string | null;
  profile_id: string | null;
  role_in_unit: string | null;
  is_manager: boolean;
}

const KIND_TO_TYPE: Record<OrgNodeKind, OrgUnitType> = {
  agency: "agency",
  management: "management",
  department: "department",
  team: "team",
};

const TYPE_TO_KIND: Record<Exclude<OrgUnitType, "board">, OrgNodeKind> = {
  agency: "agency",
  management: "management",
  department: "department",
  team: "team",
};

export function rowToOrgNode(row: DbOrgUnitRow): OrgUnitNode {
  const kind = TYPE_TO_KIND[row.unit_type as Exclude<OrgUnitType, "board">];
  if (!kind) {
    throw new Error(`Unsupported unit_type in UI: ${row.unit_type}`);
  }
  return {
    id: row.id,
    kind,
    name: row.name,
    parentId: row.parent_id,
  };
}

async function getCurrentTenantOrgId(): Promise<string | null> {
  const { data: orgId, error } = await supabase.rpc("current_org_id");
  if (error) return null;
  return (orgId as string | null) ?? null;
}

export async function fetchOrgUnits(orgId: string): Promise<DbOrgUnitRow[]> {
  const { data, error } = await supabase
    .from("org_units")
    .select("*")
    .eq("organization_id", orgId)
    .neq("unit_type", "board")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as DbOrgUnitRow[];
}

export async function loadOrgStructureFromDb(orgId: string): Promise<OrgStructureSnapshot> {
  const rows = await fetchOrgUnits(orgId);
  const units = rows
    .filter((r) => r.unit_type !== "board")
    .map(rowToOrgNode);
  const updatedAt =
    rows.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), "") ||
    new Date().toISOString();
  return { units, updatedAt };
}

export async function insertOrgUnit(
  orgId: string,
  kind: OrgNodeKind,
  name: string,
  parentId: string | null,
): Promise<OrgUnitNode> {
  const { data, error } = await supabase
    .from("org_units")
    .insert([
      {
        organization_id: orgId,
        parent_id: parentId,
        unit_type: KIND_TO_TYPE[kind],
        name: name.trim(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToOrgNode(data as DbOrgUnitRow);
}

export async function deleteOrgUnit(unitId: string, orgId: string): Promise<void> {
  const { error } = await supabase
    .from("org_units")
    .delete()
    .eq("id", unitId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);
}

export async function fetchOrgUnitMembers(
  orgId: string,
): Promise<OrgUnitMemberRow[]> {
  const { data, error } = await supabase
    .from("org_unit_members")
    .select("*")
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);
  return (data ?? []) as OrgUnitMemberRow[];
}

export async function fetchEmployeesByOrgUnits(
  orgId: string,
  employees: Employee[],
): Promise<Map<string, Employee[]>> {
  const members = await fetchOrgUnitMembers(orgId);
  const empById = new Map(employees.map((e) => [e.id, e]));
  const map = new Map<string, Employee[]>();

  members.forEach((m) => {
    if (!m.employee_id) return;
    const emp = empById.get(m.employee_id);
    if (!emp) return;
    const list = map.get(m.org_unit_id) ?? [];
    list.push(emp);
    map.set(m.org_unit_id, list);
  });

  return map;
}

export async function assignEmployeeToOrgUnit(
  orgId: string,
  employeeId: string,
  orgUnitId: string,
  roleInUnit = "member",
): Promise<void> {
  const { error: delErr } = await supabase
    .from("org_unit_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("employee_id", employeeId);

  if (delErr) throw new Error(delErr.message);

  const { error: insErr } = await supabase.from("org_unit_members").insert([
    {
      organization_id: orgId,
      org_unit_id: orgUnitId,
      employee_id: employeeId,
      role_in_unit: roleInUnit,
    },
  ]);

  if (insErr) throw new Error(insErr.message);
}

/** Safe apply: insert missing units from suggestion (no deletes). */
export async function applyOrgStructureSuggestion(
  orgId: string,
  snapshot: OrgStructureSnapshot,
): Promise<number> {
  const existing = await fetchOrgUnits(orgId);
  const existingKeys = new Set(
    existing.map((u) => `${u.unit_type}:${u.name}:${u.parent_id ?? "root"}`),
  );

  const idMap = new Map<string, string>();
  existing.forEach((u) => {
    const legacy = (u.metadata as { legacy_id?: string })?.legacy_id;
    if (legacy) idMap.set(legacy, u.id);
  });

  let added = 0;
  const pending = [...snapshot.units];

  for (let pass = 0; pass < 8 && pending.length > 0; pass++) {
    const nextPass: OrgUnitNode[] = [];

    for (const unit of pending) {
      const parentUuid = unit.parentId ? idMap.get(unit.parentId) ?? unit.parentId : null;
      if (unit.parentId && !parentUuid) {
        nextPass.push(unit);
        continue;
      }

      const key = `${KIND_TO_TYPE[unit.kind]}:${unit.name}:${parentUuid ?? "root"}`;
      if (existingKeys.has(key)) {
        const match = existing.find(
          (u) =>
            u.unit_type === KIND_TO_TYPE[unit.kind] &&
            u.name === unit.name &&
            (u.parent_id ?? null) === (parentUuid ?? null),
        );
        if (match) idMap.set(unit.id, match.id);
        continue;
      }

      const inserted = await insertOrgUnit(orgId, unit.kind, unit.name, parentUuid);
      idMap.set(unit.id, inserted.id);
      existingKeys.add(key);
      added++;
    }

    pending.length = 0;
    pending.push(...nextPass);
  }

  return added;
}

export function employeesNotInOrgUnits(
  employees: Employee[],
  members: OrgUnitMemberRow[],
): Employee[] {
  const assigned = new Set(members.map((m) => m.employee_id).filter(Boolean));
  return employees.filter((e) => !assigned.has(e.id));
}

export async function orgUnitsTableAvailable(): Promise<boolean> {
  const { error } = await supabase.from("org_units").select("id").limit(1);
  if (!error) return true;
  return !/relation.*does not exist|schema cache/i.test(error.message);
}
