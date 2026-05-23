import { supabase } from "@/lib/supabase";
import type {
  AutomationAction,
  AutomationCondition,
  AutomationRun,
  AutomationTriggerType,
  AutomationWorkflow,
} from "./types";

function row<T>(data: unknown): T {
  return data as T;
}

function workflowFromDb(r: Record<string, unknown>): AutomationWorkflow {
  return {
    id: r.id as string,
    organization_id: r.organization_id as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    enabled: r.enabled as boolean,
    trigger_type: r.trigger_type as AutomationTriggerType,
    trigger_config: (r.trigger_config as Record<string, unknown>) ?? {},
    conditions: (r.conditions as AutomationCondition[]) ?? [],
    actions: (r.actions as AutomationAction[]) ?? [],
    created_by_name: (r.created_by_name as string) ?? "",
    run_count: (r.run_count as number) ?? 0,
    last_run_at: (r.last_run_at as string) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function fetchWorkflows(): Promise<AutomationWorkflow[]> {
  const { data, error } = await supabase
    .from("automation_workflows")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(workflowFromDb);
}

export async function fetchAutomationRuns(limit = 50): Promise<AutomationRun[]> {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AutomationRun[];
}

export async function createWorkflow(input: {
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  trigger_config?: Record<string, unknown>;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
  created_by_name: string;
}): Promise<AutomationWorkflow> {
  const { data, error } = await supabase
    .from("automation_workflows")
    .insert({
      name: input.name,
      description: input.description ?? "",
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config ?? {},
      conditions: input.conditions ?? [],
      actions: input.actions ?? [],
      created_by_name: input.created_by_name,
      enabled: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return workflowFromDb(row<Record<string, unknown>>(data));
}

export async function updateWorkflow(
  id: string,
  changes: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    trigger_type: AutomationTriggerType;
    trigger_config: Record<string, unknown>;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
  }>,
): Promise<void> {
  const { error } = await supabase.from("automation_workflows").update(changes).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from("automation_workflows").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Client-side: dispatch event to server runner */
export async function dispatchAutomationEvent(
  event: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; runs?: number; error?: string }> {
  const res = await fetch("/api/automation/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  });
  const json = (await res.json()) as { ok?: boolean; runs?: number; error?: string };
  if (!res.ok) return { ok: false, error: json.error ?? res.statusText };
  return { ok: true, runs: json.runs };
}
