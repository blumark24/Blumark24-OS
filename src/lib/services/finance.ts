import { supabase } from "@/lib/supabase";

const DEFAULT_FINANCE_LIST_LIMIT = 50;
const FINANCE_MAX_LIST_LIMIT = 500;
const INVOICE_COLUMNS = "id, invoice_number, client_id, amount, status, issue_date, due_date, notes, created_by, created_at, updated_at";
const EXPENSE_COLUMNS = "id, category, vendor, description, amount, expense_date, incurred_at, notes, created_by, created_at, updated_at";

export interface FinancePageOptions {
  limit?: number;
  page?: number;
}

function getRange(options: FinancePageOptions = {}) {
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_FINANCE_LIST_LIMIT, FINANCE_MAX_LIST_LIMIT));
  const page = Math.max(0, options.page ?? 0);
  const from = page * limit;
  return { from, to: from + limit - 1 };
}

export async function fetchInvoices(options?: FinancePageOptions){
  const { from, to } = getRange(options);
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_COLUMNS)
    .order("created_at", { ascending: false })
    .range(from, to);
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

export async function fetchExpenses(options?: FinancePageOptions){
  const { from, to } = getRange(options);
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_COLUMNS)
    .order("created_at", { ascending: false })
    .range(from, to);
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
