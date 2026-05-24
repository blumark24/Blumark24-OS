import { supabase } from "@/lib/supabase";
import { withOrganizationScope } from "@/lib/tenantScope";
import type { Employee, UserRole } from "@/types";

const WORKFORCE_PROFILE_ROLES = new Set([
  "employee",
  "finance_manager",
  "defense_manager",
  "attack_manager",
]);

function employeeFromRow(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: (row.role as UserRole) || "employee",
    department: row.department as string,
    status: row.status as Employee["status"],
    joinDate: (row.join_date as string) ?? new Date().toISOString().slice(0, 10),
    performance: (row.performance as number) ?? 3,
    phone: row.phone as string | undefined,
    tasks: row.tasks as number | undefined,
    completedTasks: row.completed_tasks as number | undefined,
    avatar: row.avatar as string | undefined,
    salary: row.salary as number | undefined,
  };
}

function profileToEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: (row.name as string) || (row.email as string) || "موظف",
    email: (row.email as string) || "",
    role: ((row.role as UserRole) || "employee") as UserRole,
    department: (row.department as string) || "",
    status: row.is_active === false ? "غير_نشط" : "نشط",
    joinDate: new Date().toISOString().slice(0, 10),
    performance: 3,
    phone: undefined,
    tasks: 0,
    completedTasks: 0,
  };
}

/**
 * Tenant workforce = employees rows + org profiles without duplicate employee row.
 * board_members are NOT included (separate governance layer).
 */
export async function fetchTenantWorkforce(
  organizationId: string | null,
  scopeToOrg: boolean,
): Promise<Employee[]> {
  let empQuery = supabase.from("employees").select("*").order("created_at", { ascending: false });
  if (scopeToOrg) {
    empQuery = withOrganizationScope(empQuery, organizationId);
  }
  const { data: empData, error: empErr } = await empQuery;
  if (empErr) throw new Error(empErr.message);

  const employees = ((empData ?? []) as Record<string, unknown>[]).map(employeeFromRow);
  const byId = new Map(employees.map((e) => [e.id, e]));

  if (!scopeToOrg || !organizationId) {
    return employees;
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, name, email, role, department, is_active, organization_id")
    .eq("organization_id", organizationId);

  if (profErr) {
    return employees;
  }

  for (const row of (profiles ?? []) as Record<string, unknown>[]) {
    const role = String(row.role ?? "");
    if (!WORKFORCE_PROFILE_ROLES.has(role)) continue;
    if (byId.has(row.id as string)) continue;
    const mapped = profileToEmployee(row);
    byId.set(mapped.id, mapped);
    employees.push(mapped);
  }

  return employees;
}

/** IDs that are board governance only — never assign as operational workforce. */
export function isBoardGovernanceOnly(
  personId: string,
  boardMemberIds: Set<string>,
): boolean {
  return boardMemberIds.has(personId);
}
