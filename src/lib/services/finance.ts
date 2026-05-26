import { supabase } from "@/lib/supabase";
import { requireTenantOrgId, resolveTenantOrgId } from "@/lib/tenant/tenantScope";

// TENANT-LOCKDOWN-1: every read/write here is org-scoped.

export async function fetchInvoices(){
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createInvoice(payload: any){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("invoices")
    .insert([{ ...payload, organization_id }])
    .select()
    .single();
  return { data, error };
}

export async function updateInvoice(id: string, payload: any){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select()
    .single();
  return { data, error };
}

export async function deleteInvoice(id: string){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select();
  return { data, error };
}

export async function fetchExpenses(){
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createExpense(payload: any){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("expenses")
    .insert([{ ...payload, organization_id }])
    .select()
    .single();
  return { data, error };
}

export async function updateExpense(id: string, payload: any){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select()
    .single();
  return { data, error };
}

export async function deleteExpense(id: string){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select();
  return { data, error };
}
