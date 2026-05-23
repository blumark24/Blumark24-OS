export type AutomationTriggerType =
  | "schedule.daily"
  | "schedule.hourly"
  | "crm.client_created"
  | "crm.deal_created"
  | "crm.deal_won"
  | "crm.deal_stage_changed"
  | "crm.contract_signed"
  | "task.created"
  | "task.completed"
  | "task.overdue"
  | "task.assigned"
  | "webhook.incoming";

export type AutomationActionType =
  | "notification.send"
  | "email.send"
  | "whatsapp.send"
  | "ai.generate"
  | "crm.add_note"
  | "crm.log_activity"
  | "task.create"
  | "task.set_status";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "exists";

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value?: string | number | boolean;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
}

export interface AutomationWorkflow {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  created_by_name: string;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  workflow_id: string;
  status: "running" | "success" | "failed" | "skipped";
  trigger_event: string;
  trigger_payload: Record<string, unknown>;
  action_results: Array<{ action_id: string; type: string; ok: boolean; detail?: string }>;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AutomationEventPayload {
  [key: string]: unknown;
}
