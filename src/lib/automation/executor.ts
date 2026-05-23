import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateConditions } from "./conditions";
import { interpolate } from "./template";
import type {
  AutomationAction,
  AutomationEventPayload,
  AutomationWorkflow,
} from "./types";

export interface ActionResult {
  action_id: string;
  type: string;
  ok: boolean;
  detail?: string;
}

async function runEmail(config: Record<string, unknown>, payload: AutomationEventPayload) {
  const to = interpolate(String(config.to ?? ""), payload);
  const subject = interpolate(String(config.subject ?? "إشعار Blumark"), payload);
  const body = interpolate(String(config.body ?? ""), payload);
  if (!to) return { ok: false, detail: "missing to" };

  const resendKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.AUTOMATION_EMAIL_FROM ?? "noreply@blumark.sa";

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html: `<p>${body}</p>` }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, detail: err.slice(0, 200) };
    }
    return { ok: true, detail: "sent via Resend" };
  }

  console.warn("[automation] RESEND_API_KEY not set — email skipped", { to, subject });
  return { ok: true, detail: "logged (no RESEND_API_KEY)" };
}

async function runWhatsApp(config: Record<string, unknown>, payload: AutomationEventPayload) {
  const phone = interpolate(String(config.phone ?? ""), payload);
  const message = interpolate(String(config.message ?? ""), payload);
  if (!phone || !message) return { ok: false, detail: "missing phone or message" };

  const webhook = process.env.AUTOMATION_WHATSAPP_WEBHOOK_URL ?? "";
  const twilioSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM ?? "";

  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, payload }),
    });
    if (!res.ok) return { ok: false, detail: await res.text().then((t) => t.slice(0, 200)) };
    return { ok: true, detail: "webhook ok" };
  }

  if (twilioSid && twilioToken && twilioFrom) {
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: to,
          Body: message,
        }),
      },
    );
    if (!res.ok) return { ok: false, detail: await res.text().then((t) => t.slice(0, 200)) };
    return { ok: true, detail: "twilio ok" };
  }

  console.warn("[automation] WhatsApp not configured — message skipped", { phone });
  return { ok: true, detail: "logged (no WhatsApp config)" };
}

async function runAi(config: Record<string, unknown>, payload: AutomationEventPayload) {
  const prompt = interpolate(String(config.prompt ?? ""), payload);
  if (!prompt) return { ok: false, detail: "empty prompt" };

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return { ok: true, detail: "skipped (no ANTHROPIC_API_KEY)" };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return { ok: false, detail: await res.text().then((t) => t.slice(0, 200)) };
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  const text = data.content?.[0]?.text ?? "";
  const storeAs = config.store_as as string | undefined;
  if (storeAs) (payload as Record<string, unknown>)[storeAs] = text;
  return { ok: true, detail: text.slice(0, 120) };
}

export async function executeAction(
  action: AutomationAction,
  payload: AutomationEventPayload,
  admin: SupabaseClient,
  authorName: string,
): Promise<ActionResult> {
  const cfg = action.config ?? {};
  try {
    switch (action.type) {
      case "notification.send": {
        const title = interpolate(String(cfg.title ?? "أتمتة"), payload);
        const body = interpolate(String(cfg.body ?? ""), payload);
        const href = interpolate(String(cfg.href ?? "/"), payload);
        const userId = cfg.user_id ? interpolate(String(cfg.user_id), payload) : null;
        const { error } = await admin.from("notifications").insert({
          type: "task_due",
          title,
          body,
          href,
          user_id: userId || null,
        });
        if (error) return { action_id: action.id, type: action.type, ok: false, detail: error.message };
        return { action_id: action.id, type: action.type, ok: true };
      }
      case "email.send": {
        const r = await runEmail(cfg, payload);
        return { action_id: action.id, type: action.type, ...r };
      }
      case "whatsapp.send": {
        const r = await runWhatsApp(cfg, payload);
        return { action_id: action.id, type: action.type, ...r };
      }
      case "ai.generate": {
        const r = await runAi(cfg, payload);
        return { action_id: action.id, type: action.type, ...r };
      }
      case "crm.add_note": {
        const clientId = String(payload.client_id ?? payload.clientId ?? "");
        if (!clientId) return { action_id: action.id, type: action.type, ok: false, detail: "no client_id" };
        const { error } = await admin.from("crm_client_notes").insert({
          client_id: clientId,
          body: interpolate(String(cfg.body ?? ""), payload),
          author_name: String(cfg.author_name ?? authorName),
        });
        if (error) return { action_id: action.id, type: action.type, ok: false, detail: error.message };
        return { action_id: action.id, type: action.type, ok: true };
      }
      case "crm.log_activity": {
        const clientId = String(payload.client_id ?? payload.clientId ?? "");
        if (!clientId) return { action_id: action.id, type: action.type, ok: false, detail: "no client_id" };
        const { error } = await admin.from("crm_activities").insert({
          client_id: clientId,
          deal_id: payload.deal_id ?? null,
          activity_type: "automation",
          title: interpolate(String(cfg.title ?? "أتمتة"), payload),
          body: interpolate(String(cfg.body ?? ""), payload),
          author_name: authorName,
        });
        if (error) return { action_id: action.id, type: action.type, ok: false, detail: error.message };
        return { action_id: action.id, type: action.type, ok: true };
      }
      case "task.create": {
        const dueDays = Number(cfg.due_days ?? 3);
        const due = new Date();
        due.setDate(due.getDate() + dueDays);
        const dueStr = due.toISOString().slice(0, 10);
        const { error } = await admin.from("tasks").insert({
          title: interpolate(String(cfg.title ?? "مهمة تلقائية"), payload),
          priority: String(cfg.priority ?? "متوسطة"),
          status: "جديدة",
          assignee_id: String(payload.assignee_id ?? payload.assigneeId ?? ""),
          assignee_name: String(payload.assignee_name ?? payload.assigneeName ?? ""),
          due_date: dueStr,
          due_at: `${dueStr}T09:00:00Z`,
          client_id: payload.client_id ?? null,
          client_name: payload.client_name ?? null,
          created_by_name: authorName,
        });
        if (error) return { action_id: action.id, type: action.type, ok: false, detail: error.message };
        return { action_id: action.id, type: action.type, ok: true };
      }
      case "task.set_status": {
        const taskId = String(payload.task_id ?? payload.taskId ?? "");
        if (!taskId) return { action_id: action.id, type: action.type, ok: false, detail: "no task_id" };
        const { error } = await admin
          .from("tasks")
          .update({ status: String(cfg.status ?? "قيد_التنفيذ") })
          .eq("id", taskId);
        if (error) return { action_id: action.id, type: action.type, ok: false, detail: error.message };
        return { action_id: action.id, type: action.type, ok: true };
      }
      default:
        return { action_id: action.id, type: action.type, ok: false, detail: "unknown action" };
    }
  } catch (e) {
    return {
      action_id: action.id,
      type: action.type,
      ok: false,
      detail: e instanceof Error ? e.message : "error",
    };
  }
}

export async function runWorkflow(
  workflow: AutomationWorkflow,
  event: string,
  payload: AutomationEventPayload,
  admin: SupabaseClient,
  authorName: string,
): Promise<{ status: "success" | "failed" | "skipped"; results: ActionResult[]; error?: string }> {
  if (!workflow.enabled) {
    return { status: "skipped", results: [] };
  }
  if (!evaluateConditions(workflow.conditions ?? [], payload)) {
    return { status: "skipped", results: [] };
  }

  const results: ActionResult[] = [];
  for (const action of workflow.actions ?? []) {
    const r = await executeAction(action, { ...payload }, admin, authorName);
    results.push(r);
    if (!r.ok) {
      return { status: "failed", results, error: r.detail };
    }
  }
  return { status: "success", results };
}
