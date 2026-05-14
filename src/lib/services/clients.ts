import { supabase } from "@/lib/supabaseClient";
import type { Client } from "@/types";

export async function fetchClients(): Promise<{ data: Client[] | null; error: any }>{
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data as Client[] | null, error };
}

export async function fetchClientById(id: string){
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createClient(payload: Partial<Client>){
  const { data, error } = await supabase
    .from("clients")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateClient(id: string, payload: Partial<Client>){
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteClient(id: string){
  const { data, error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}
