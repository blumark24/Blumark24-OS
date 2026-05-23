import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runWorkflow } from "./executor";
import type { AutomationEventPayload, AutomationWorkflow } from "./types";

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function dispatchEventForOrg(
  organizationId: string,
  event: string,
  payload: AutomationEventPayload,
  authorName = "الأتمتة",
): Promise<{ runs: number; errors: string[] }> {
  const admin = getServiceClient();
  if (!admin) return { runs: 0, errors: ["SUPABASE_SERVICE_ROLE_KEY missing"] };

  const { data: workflows, error } = await admin
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("enabled", true)
    .eq("trigger_type", event);

  if (error) return { runs: 0, errors: [error.message] };
  if (!workflows?.length) return { runs: 0, errors: [] };

  const errors: string[] = [];
  let runs = 0;

  for (const raw of workflows) {
    const wf = raw as AutomationWorkflow;
    const started = Date.now();
    const { status, results, error: runErr } = await runWorkflow(
      {
        ...wf,
        conditions: (raw.conditions as AutomationWorkflow["conditions"]) ?? [],
        actions: (raw.actions as AutomationWorkflow["actions"]) ?? [],
      },
      event,
      payload,
      admin,
      authorName,
    );

    const duration = Date.now() - started;
    await admin.from("automation_runs").insert({
      organization_id: organizationId,
      workflow_id: wf.id,
      status: status === "skipped" ? "skipped" : status === "success" ? "success" : "failed",
      trigger_event: event,
      trigger_payload: payload,
      action_results: results,
      error_message: runErr ?? null,
      duration_ms: duration,
    });

    if (status !== "skipped") {
      runs += 1;
      await admin
        .from("automation_workflows")
        .update({
          run_count: (wf.run_count ?? 0) + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq("id", wf.id);
    }
    if (runErr) errors.push(runErr);
  }

  return { runs, errors };
}
