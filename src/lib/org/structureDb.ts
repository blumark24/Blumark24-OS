import { supabase } from "@/lib/supabase";
import type {
  Department,
  DepartmentInput,
  EmployeeRelation,
  EmployeeRelationInput,
  OrgStructureSnapshot,
  Position,
  PositionInput,
  StructureLevel,
  Team,
  TeamInput,
} from "./types";
import { isBoardReservedName } from "./orgUnits";
import { ACTIVE_EMPLOYEE_STATUS_VALUES } from "@/lib/tenant/employeeStatus";

async function resolveOrgId(): Promise<string> {
  const { data, error } = await supabase.rpc("current_org_id");
  if (error || !data) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");
  return data as string;
}

export async function fetchOrgStructure(): Promise<OrgStructureSnapshot> {
  const [deptRes, teamRes, posRes, relRes, activeEmpRes, profileRes] = await Promise.all([
    supabase.from("departments").select("*").order("sort_order"),
    supabase.from("teams").select("*").order("sort_order"),
    supabase.from("positions").select("*").order("sort_order"),
    supabase.from("employee_relations").select("*"),
    supabase.from("employees").select("id").in("status", [...ACTIVE_EMPLOYEE_STATUS_VALUES]),
    supabase.from("profiles").select("id").eq("is_active", true),
  ]);

  if (deptRes.error) throw new Error(deptRes.error.message);
  if (teamRes.error) throw new Error(teamRes.error.message);
  if (posRes.error) throw new Error(posRes.error.message);
  if (relRes.error) throw new Error(relRes.error.message);
  if (activeEmpRes.error) throw new Error(activeEmpRes.error.message);
  if (profileRes.error) throw new Error(profileRes.error.message);

  const activeEmployeeIds = new Set(
    ((activeEmpRes.data ?? []) as { id: string }[])
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string"),
  );

  const linkedProfileIds = new Set(
    ((profileRes.data ?? []) as { id: string }[])
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string"),
  );

  const departments = ((deptRes.data ?? []) as Record<string, unknown>[]).map((row) => {
    const level = row.structure_level;
    const structure_level: StructureLevel =
      level === "agency" || level === "management" || level === "department"
        ? level
        : "department";
    const code =
      typeof row.department_code === "string" && row.department_code.trim()
        ? row.department_code.trim()
        : undefined;
    return {
      ...(row as unknown as Department),
      structure_level,
      publicCode: code,
    };
  }) as Department[];

  return {
    departments,
    teams: (teamRes.data ?? []) as Team[],
    positions: (posRes.data ?? []) as Position[],
    relations: ((relRes.data ?? []) as EmployeeRelation[]).filter((rel) =>
      activeEmployeeIds.has(rel.employee_id) && linkedProfileIds.has(rel.employee_id),
    ),
  };
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  if (isBoardReservedName(input.name)) {
    throw new Error(`«${input.name}» محجوز لمجلس الإدارة ولا يمكن إنشاؤه كوحدة فرعية.`);
  }
  const organization_id = await resolveOrgId();
  const { data, error } = await supabase
    .from("departments")
    .insert({
      ...input,
      organization_id,
      structure_level: input.structure_level ?? "department",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Department;
}

export async function updateDepartment(
  id: string,
  input: Partial<DepartmentInput>,
): Promise<Department> {
  if (input.name !== undefined && isBoardReservedName(input.name)) {
    throw new Error(`«${input.name}» محجوز لمجلس الإدارة ولا يمكن استخدامه كاسم وحدة.`);
  }
  const { data, error } = await supabase
    .from("departments")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  if (input.name !== undefined) {
    await propagateDepartmentLabels(id, input.name);
  }
  return data as Department;
}

export async function deleteDepartment(id: string): Promise<void> {
  await assertDepartmentSafeToDelete(id);
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createTeam(input: TeamInput): Promise<Team> {
  const organization_id = await resolveOrgId();
  const { data, error } = await supabase.from("teams").insert({ ...input, organization_id }).select("*").single();
  if (error) throw new Error(error.message);
  return data as Team;
}

export async function updateTeam(id: string, input: Partial<TeamInput>): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Team;
}

export async function deleteTeam(id: string): Promise<void> {
  await assertTeamSafeToDelete(id);
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createPosition(input: PositionInput): Promise<Position> {
  const organization_id = await resolveOrgId();
  const { data, error } = await supabase.from("positions").insert({ ...input, organization_id }).select("*").single();
  if (error) throw new Error(error.message);
  return data as Position;
}

export async function updatePosition(
  id: string,
  input: Partial<PositionInput>,
): Promise<Position> {
  const { data, error } = await supabase
    .from("positions")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Position;
}

export async function deletePosition(id: string): Promise<void> {
  await assertPositionSafeToDelete(id);
  const { error } = await supabase.from("positions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Safe-delete guards (Sprint 1C) ──────────────────────────────────────────
// Pre-flight checks that throw a clear Arabic error instead of cascading
// deletes of related rows. RLS, FKs, and migrations are unchanged; these
// guards make blocked cases visible to the caller in plain language.

async function countActiveEmployeesInRelation(
  field: "department_id" | "team_id" | "position_id",
  id: string,
): Promise<number> {
  const { data: rels, error: relErr } = await supabase
    .from("employee_relations")
    .select("employee_id")
    .eq(field, id);
  if (relErr) throw new Error(relErr.message);
  const employeeIds = Array.from(
    new Set(
      ((rels ?? []) as { employee_id: string | null }[])
        .map((r) => r.employee_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  );
  if (employeeIds.length === 0) return 0;
  const { count, error } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .in("id", employeeIds)
    .in("status", [...ACTIVE_EMPLOYEE_STATUS_VALUES]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countActiveVirtualOfficeMappings(
  mappedUnitTypes: ("agency" | "management" | "department" | "team")[],
  mappedUnitId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("executive_office_room_mappings")
    .select("id", { count: "exact", head: true })
    .in("mapped_unit_type", mappedUnitTypes)
    .eq("mapped_unit_id", mappedUnitId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function assertDepartmentSafeToDelete(id: string): Promise<void> {
  const voCount = await countActiveVirtualOfficeMappings(
    ["agency", "management", "department"],
    id,
  );
  if (voCount > 0) {
    throw new Error("لا يمكن حذف هذا القسم لأنه مرتبط بمكتب افتراضي.");
  }

  const activeEmployees = await countActiveEmployeesInRelation("department_id", id);
  if (activeEmployees > 0) {
    throw new Error("لا يمكن حذف هذا القسم لأنه يحتوي على موظفين.");
  }

  const { count: childCount, error: childErr } = await supabase
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (childErr) throw new Error(childErr.message);

  const { count: teamCount, error: teamErr } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);
  if (teamErr) throw new Error(teamErr.message);

  const { count: positionRelCount, error: posErr } = await supabase
    .from("employee_relations")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id)
    .not("position_id", "is", null);
  if (posErr) throw new Error(posErr.message);

  if ((childCount ?? 0) > 0 || (teamCount ?? 0) > 0 || (positionRelCount ?? 0) > 0) {
    throw new Error("لا يمكن حذف هذا القسم لأنه يحتوي على فرق أو مناصب.");
  }
}

async function assertTeamSafeToDelete(id: string): Promise<void> {
  const voCount = await countActiveVirtualOfficeMappings(["team"], id);
  if (voCount > 0) {
    throw new Error("لا يمكن حذف هذا الفريق لأنه مرتبط بمكتب افتراضي.");
  }

  const activeEmployees = await countActiveEmployeesInRelation("team_id", id);
  if (activeEmployees > 0) {
    throw new Error("لا يمكن حذف هذا الفريق لأنه يحتوي على موظفين.");
  }
}

async function assertPositionSafeToDelete(id: string): Promise<void> {
  const activeEmployees = await countActiveEmployeesInRelation("position_id", id);
  if (activeEmployees > 0) {
    throw new Error("لا يمكن حذف هذا المنصب لأنه يحتوي على موظفين.");
  }

  const { count: childCount, error } = await supabase
    .from("positions")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (error) throw new Error(error.message);
  if ((childCount ?? 0) > 0) {
    throw new Error("لا يمكن حذف هذا المنصب لأنه يحتوي على مناصب فرعية.");
  }
}


async function propagateDepartmentLabels(
  departmentId: string,
  name: string,
): Promise<void> {
  const label = String(name).slice(0, 100);
  const { data: rels, error } = await supabase
    .from("employee_relations")
    .select("employee_id")
    .eq("department_id", departmentId);
  if (error || !rels?.length) return;
  const ids = rels.map((r) => r.employee_id as string);
  await Promise.all([
    supabase.from("employees").update({ department: label }).in("id", ids),
    supabase.from("profiles").update({ department: label }).in("id", ids),
  ]);
}

async function syncEmployeeDepartmentLabel(
  employeeId: string,
  departmentId: string | null,
): Promise<void> {
  if (!departmentId) return;
  const { data: dept, error: deptErr } = await supabase
    .from("departments")
    .select("name")
    .eq("id", departmentId)
    .maybeSingle();
  if (deptErr || !dept?.name) return;
  const label = String(dept.name).slice(0, 100);
  await Promise.all([
    supabase.from("employees").update({ department: label }).eq("id", employeeId),
    supabase.from("profiles").update({ department: label }).eq("id", employeeId),
  ]);
}

export async function upsertEmployeeRelation(
  input: EmployeeRelationInput,
): Promise<EmployeeRelation> {
  const organization_id = await resolveOrgId();
  const { data, error } = await supabase
    .from("employee_relations")
    .upsert({ ...input, organization_id }, { onConflict: "organization_id,employee_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await syncEmployeeDepartmentLabel(input.employee_id, input.department_id);
  return data as EmployeeRelation;
}

/** Assign employee to org unit and sync HR labels (employees + profiles). */
export async function assignEmployeeToOrgUnit(
  input: EmployeeRelationInput,
): Promise<EmployeeRelation> {
  if (!input.department_id) {
    throw new Error("يجب اختيار وحدة تنظيمية من الهيكل الإداري.");
  }
  return upsertEmployeeRelation(input);
}

export async function deleteEmployeeRelation(id: string): Promise<void> {
  const { error } = await supabase.from("employee_relations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
