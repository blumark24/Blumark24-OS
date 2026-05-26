import { supabase } from "@/lib/supabase";
import { requireTenantOrgId, resolveTenantOrgId } from "@/lib/tenant/tenantScope";
import type { Client } from "@/types";

// TENANT-LOCKDOWN-1: every read/write here is org-scoped. Defence-in-depth
// on top of RLS — a super_admin / owner caller (Blumark) in the customer
// workspace must never see another tenant's clients via these helpers.

export async function fetchClients(): Promise<{ data: Client[] | null; error: any }>{
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data: data as Client[] | null, error };
}

export async function fetchClientById(id: string){
  const orgId = await resolveTenantOrgId();
  if (!orgId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  return { data, error };
}

export async function createClient(payload: Partial<Client>){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("clients")
    .insert([{ ...payload, organization_id }])
    .select()
    .single();
  return { data, error };
}

export async function updateClient(id: string, payload: Partial<Client>){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select()
    .single();
  return { data, error };
}

export async function deleteClient(id: string){
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id)
    .select();
  return { data, error };
}
