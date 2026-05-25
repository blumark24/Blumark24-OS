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

async function resolveOrgId(): Promise<string> {
  const { data, error } = await supabase.rpc("current_org_id");
  if (error || !data) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");
  return data as string;
}

export async function fetchOrgStructure(): Promise<OrgStructureSnapshot> {
  const [deptRes, teamRes, posRes, relRes] = await Promise.all([
    supabase.from("departments").select("*").order("sort_order"),
    supabase.from("teams").select("*").order("sort_order"),
    supabase.from("positions").select("*").order("sort_order"),
    supabase.from("employee_relations").select("*"),
  ]);

  if (deptRes.error) throw new Error(deptRes.error.message);
  if (teamRes.error) throw new Error(teamRes.error.message);
  if (posRes.error) throw new Error(posRes.error.message);
  if (relRes.error) throw new Error(relRes.error.message);

  const departments = ((deptRes.data ?? []) as Record<string, unknown>[]).map((row) => {
    const level = row.structure_level;
    const structure_level: StructureLevel =
      level === "agency" || level === "management" || level === "department"
        ? level
        : "department";
    return { ...(row as unknown as Department), structure_level };
  }) as Department[];

  return {
    departments,
    teams: (teamRes.data ?? []) as Team[],
    positions: (posRes.data ?? []) as Position[],
    relations: (relRes.data ?? []) as EmployeeRelation[],
  };
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
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
  const { data, error } = await supabase
    .from("departments")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Department;
}

export async function deleteDepartment(id: string): Promise<void> {
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
  const { error } = await supabase.from("positions").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

export async function deleteEmployeeRelation(id: string): Promise<void> {
  const { error } = await supabase.from("employee_relations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
