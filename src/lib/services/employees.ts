import { supabase } from "@/lib/supabase";
import { withOrganizationScope } from "@/lib/tenantScope";
import type { Employee } from "@/types";

export async function fetchEmployees(
  organizationId?: string | null,
): Promise<{ data: Employee[] | null; error: any }>{
  let query = supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  query = withOrganizationScope(query, organizationId);
  const { data, error } = await query;
  return { data: data as Employee[] | null, error };
}

export async function fetchEmployeeById(
  id: string,
  organizationId?: string | null,
): Promise<{ data: Employee | null; error: any }>{
  let query = supabase
    .from("employees")
    .select("*")
    .eq("id", id);
  query = withOrganizationScope(query, organizationId);
  const { data, error } = await query.single();
  return { data: data as Employee | null, error };
}

export async function createEmployee(payload: Partial<Employee>) {
  const { data, error } = await supabase
    .from("employees")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteEmployee(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}
