import { supabase } from "@/lib/supabase";
import type { Employee } from "@/types";
import { ACTIVE_EMPLOYEE_STATUS_VALUES } from "@/lib/tenant/employeeStatus";

export async function fetchEmployees(): Promise<{ data: Employee[] | null; error: any }>{
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .in("status", [...ACTIVE_EMPLOYEE_STATUS_VALUES])
    .order("created_at", { ascending: false });
  return { data: data as Employee[] | null, error };
}

export async function fetchEmployeeById(id: string): Promise<{ data: Employee | null; error: any }>{
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .in("status", [...ACTIVE_EMPLOYEE_STATUS_VALUES])
    .single();
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
