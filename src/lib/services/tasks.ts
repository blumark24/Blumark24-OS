import { supabase } from "@/lib/supabase";
import { requireTenantOrgId, resolveTenantOrgId } from "@/lib/tenant/tenantScope";
import type { Task } from "@/types";

// TENANT-LOCKDOWN-1: every read/write here is org-scoped.

export async function fetchTasks(): Promise<{ data: Task[] | null; error: any }>{
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data: data as Task[] | null, error };
}

export async function fetchTaskById(id: string){
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  return { data, error };
}

export async function createTask(payload: Partial<Task>){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...payload, organization_id }])
    .select()
    .single();
  return { data, error };
}

export async function updateTask(id: string, payload: Partial<Task>){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTask(id: string){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select();
  return { data, error };
}
