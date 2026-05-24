import { supabase } from "@/lib/supabase";
import { DEFAULT_CRM_STAGES } from "./defaults";
import type {
  CrmActivity,
  CrmClientNote,
  CrmContract,
  CrmDeal,
  CrmReminder,
  CrmRevenueEvent,
  CrmSnapshot,
  CrmStage,
} from "./types";

function row<T>(data: unknown): T {
  return data as T;
}

export async function ensureDefaultStages(): Promise<CrmStage[]> {
  const { data: existing, error: readErr } = await supabase
    .from("crm_pipeline_stages")
    .select("*")
    .order("sort_order");
  if (readErr) throw new Error(readErr.message);
  if ((existing ?? []).length > 0) return (existing ?? []) as CrmStage[];

  const rows = DEFAULT_CRM_STAGES.map((s) => ({
    slug: s.slug,
    name: s.name,
    sort_order: s.sort_order,
    color: s.color,
    is_closed_won: s.is_closed_won,
    is_closed_lost: s.is_closed_lost,
  }));
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as CrmStage[];
}

export async function fetchCrmSnapshot(): Promise<CrmSnapshot> {
  const stages = await ensureDefaultStages();
  const [dealsRes, notesRes, remRes, conRes, actRes, revRes] = await Promise.all([
    supabase.from("crm_deals").select("*").order("updated_at", { ascending: false }),
    supabase.from("crm_client_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_reminders").select("*").order("due_at"),
    supabase.from("crm_contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_activities").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_revenue_events").select("*").order("recorded_at", { ascending: false }),
  ]);

  for (const res of [dealsRes, notesRes, remRes, conRes, actRes, revRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  return {
    stages,
    deals: (dealsRes.data ?? []) as CrmDeal[],
    notes: (notesRes.data ?? []) as CrmClientNote[],
    reminders: (remRes.data ?? []) as CrmReminder[],
    contracts: (conRes.data ?? []) as CrmContract[],
    activities: (actRes.data ?? []) as CrmActivity[],
    revenue: (revRes.data ?? []) as CrmRevenueEvent[],
  };
}

export async function logCrmActivity(input: {
  client_id: string;
  deal_id?: string | null;
  activity_type: string;
  title: string;
  body?: string;
  author_name: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("crm_activities").insert({
    client_id: input.client_id,
    deal_id: input.deal_id ?? null,
    activity_type: input.activity_type,
    title: input.title,
    body: input.body ?? null,
    author_name: input.author_name,
    meta: input.meta ?? {},
  });
  if (error) throw new Error(error.message);
}

export async function createDeal(input: {
  client_id: string;
  stage_id: string;
  title: string;
  value: number;
  expected_close_date?: string | null;
  assigned_name?: string;
  notes?: string | null;
  author_name: string;
}): Promise<CrmDeal> {
  const { data, error } = await supabase
    .from("crm_deals")
    .insert({
      client_id: input.client_id,
      stage_id: input.stage_id,
      title: input.title,
      value: input.value,
      expected_close_date: input.expected_close_date ?? null,
      assigned_name: input.assigned_name ?? "",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const deal = row<CrmDeal>(data);
  await logCrmActivity({
    client_id: input.client_id,
    deal_id: deal.id,
    activity_type: "deal",
    title: `صفقة جديدة: ${input.title}`,
    body: `القيمة: ${input.value}`,
    author_name: input.author_name,
  });
  return deal;
}

export async function moveDealToStage(
  deal: CrmDeal,
  stage: CrmStage,
  authorName: string,
): Promise<CrmDeal> {
  const { data, error } = await supabase
    .from("crm_deals")
    .update({ stage_id: stage.id })
    .eq("id", deal.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const updated = row<CrmDeal>(data);
  await logCrmActivity({
    client_id: deal.client_id,
    deal_id: deal.id,
    activity_type: "deal",
    title: `نقل الصفقة إلى: ${stage.name}`,
    author_name: authorName,
  });
  if (stage.is_closed_won && deal.value > 0) {
    await supabase.from("crm_revenue_events").insert({
      client_id: deal.client_id,
      deal_id: deal.id,
      amount: deal.value,
      event_type: "deal_won",
      notes: `إيراد من صفقة: ${deal.title}`,
    });
    await supabase
      .from("clients")
      .update({ status: "متعاقد", contract_value: deal.value })
      .eq("id", deal.client_id);
  }
  return updated;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from("crm_deals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createNote(input: {
  client_id: string;
  deal_id?: string | null;
  body: string;
  author_name: string;
}): Promise<CrmClientNote> {
  const { data, error } = await supabase
    .from("crm_client_notes")
    .insert({
      client_id: input.client_id,
      deal_id: input.deal_id ?? null,
      body: input.body,
      author_name: input.author_name,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logCrmActivity({
    client_id: input.client_id,
    deal_id: input.deal_id,
    activity_type: "note",
    title: "ملاحظة جديدة",
    body: input.body,
    author_name: input.author_name,
  });
  return row<CrmClientNote>(data);
}

export async function createReminder(input: {
  client_id: string;
  deal_id?: string | null;
  title: string;
  due_at: string;
}): Promise<CrmReminder> {
  const { data, error } = await supabase
    .from("crm_reminders")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return row<CrmReminder>(data);
}

export async function toggleReminder(id: string, is_done: boolean): Promise<void> {
  const { error } = await supabase.from("crm_reminders").update({ is_done }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createContract(input: {
  client_id: string;
  deal_id?: string | null;
  title: string;
  package_type: string;
  contract_value: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: CrmContract["status"];
  author_name: string;
}): Promise<CrmContract> {
  const { data, error } = await supabase
    .from("crm_contracts")
    .insert({
      client_id: input.client_id,
      deal_id: input.deal_id ?? null,
      title: input.title,
      package_type: input.package_type,
      contract_value: input.contract_value,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      status: input.status ?? "مسودة",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const contract = row<CrmContract>(data);
  if (input.contract_value > 0) {
    await supabase.from("crm_revenue_events").insert({
      client_id: input.client_id,
      deal_id: input.deal_id ?? null,
      contract_id: contract.id,
      amount: input.contract_value,
      event_type: "contract",
      notes: input.title,
    });
  }
  await logCrmActivity({
    client_id: input.client_id,
    deal_id: input.deal_id,
    activity_type: "contract",
    title: `عقد: ${input.title}`,
    author_name: input.author_name,
  });
  return contract;
}

export async function recordRevenue(input: {
  client_id: string;
  amount: number;
  event_type: CrmRevenueEvent["event_type"];
  notes?: string;
  deal_id?: string | null;
  contract_id?: string | null;
  author_name: string;
}): Promise<void> {
  const { error } = await supabase.from("crm_revenue_events").insert({
    client_id: input.client_id,
    deal_id: input.deal_id ?? null,
    contract_id: input.contract_id ?? null,
    amount: input.amount,
    event_type: input.event_type,
    notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);
  await logCrmActivity({
    client_id: input.client_id,
    activity_type: "revenue",
    title: `إيراد: ${input.amount}`,
    body: input.notes,
    author_name: input.author_name,
  });
}
