import { supabase } from "@/lib/supabase";
import { requireTenantOrgId, resolveTenantOrgId } from "@/lib/tenant/tenantScope";
import type { Employee } from "@/types";

// TENANT-LOCKDOWN-1: every read/write here is org-scoped.

export async function fetchEmployees(): Promise<{ data: Employee[] | null; error: any }>{
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data: data as Employee[] | null, error };
}

export async function fetchEmployeeById(id: string): Promise<{ data: Employee | null; error: any }>{
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  return { data: data as Employee | null, error };
}

export async function createEmployee(payload: Partial<Employee>) {
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("employees")
    .insert([{ ...payload, organization_id }])
    .select()
    .single();
  return { data, error };
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select()
    .single();
  return { data, error };
}

export async function deleteEmployee(id: string) {
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select();
  return { data, error };
}
