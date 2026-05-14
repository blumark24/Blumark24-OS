import { supabase } from "@/lib/supabaseClient";

export async function fetchInvoices(){
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createInvoice(payload: any){
  const { data, error } = await supabase
    .from("invoices")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateInvoice(id: string, payload: any){
  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteInvoice(id: string){
  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}

export async function fetchExpenses(){
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createExpense(payload: any){
  const { data, error } = await supabase
    .from("expenses")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateExpense(id: string, payload: any){
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteExpense(id: string){
  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}
