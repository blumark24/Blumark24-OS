export interface CrmStage {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  sort_order: number;
  color: string;
  is_closed_won: boolean;
  is_closed_lost: boolean;
}

export interface CrmDeal {
  id: string;
  organization_id: string;
  client_id: string;
  stage_id: string;
  title: string;
  value: number;
  expected_close_date: string | null;
  assigned_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmClientNote {
  id: string;
  client_id: string;
  deal_id: string | null;
  body: string;
  author_name: string;
  created_at: string;
}

export interface CrmReminder {
  id: string;
  client_id: string;
  deal_id: string | null;
  title: string;
  due_at: string;
  is_done: boolean;
  created_at: string;
}

export interface CrmContract {
  id: string;
  client_id: string;
  deal_id: string | null;
  title: string;
  package_type: string;
  contract_value: number;
  start_date: string | null;
  end_date: string | null;
  status: "مسودة" | "نشط" | "منتهي" | "ملغي";
  created_at: string;
}

export interface CrmActivity {
  id: string;
  client_id: string;
  deal_id: string | null;
  activity_type: string;
  title: string;
  body: string | null;
  meta: Record<string, unknown>;
  author_name: string;
  created_at: string;
}

export interface CrmRevenueEvent {
  id: string;
  client_id: string;
  deal_id: string | null;
  contract_id: string | null;
  amount: number;
  event_type: "deal_won" | "contract" | "payment" | "adjustment";
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface CrmSnapshot {
  stages: CrmStage[];
  deals: CrmDeal[];
  notes: CrmClientNote[];
  reminders: CrmReminder[];
  contracts: CrmContract[];
  activities: CrmActivity[];
  revenue: CrmRevenueEvent[];
}
