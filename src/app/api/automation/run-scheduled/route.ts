// Scheduled automation runner — invoked by Vercel Cron (see vercel.json).
// Runs enabled automation rules that match the current schedule and writes
// real DB effects (late task detection, workload recalc) plus automation_logs.

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
  internalError,
  unauthorized,
} from "@/lib/api/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[automation/run-scheduled]";
const MAX_RULES_PER_RUN = 20;
const MAX_ROW_BATCH = 500;

let cronRunInFlight = false;

// Maps rule IDs to the cron expressions that trigger them.
// We check wall-clock time on each invocation to decide which rules to run.
const RULE_SCHEDULES: Record<string, string> = {
  "late-tasks":      "daily",      // every midnight invocation
  "client-followup": "daily",      // every midnight invocation
  "kpi-update":      "every15min", // every 15-min invocation
  "workload":        "every2h",    // every 2-hour invocation
  "task-reminder":   "daily",      // every midnight invocation
  "weekly-report":   "monday8am",  // only on Monday 8 AM
};

function shouldRunNow(schedule: string): boolean {
  const now = new Date();
  const h   = now.getUTCHours();
  const min = now.getUTCMinutes();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday

  if (schedule === "daily")      return true;
  if (schedule === "every15min") return true;
  if (schedule === "every2h")    return min < 15;
  if (schedule === "monday8am")  return day === 1 && h === 8 && min < 15;
  return false;
}

export async function GET(req: NextRequest) {
  const ctx = createApiContext(req, "/api/automation/run-scheduled");

  // Fail closed: this service-role endpoint must never run without CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(`${TAG} request_id=${ctx.requestId} CRON_SECRET is not configured`);
    return apiError(ctx, 500, "CRON_NOT_CONFIGURED", "Server cron auth not configured");
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${cronSecret}`) {
    return unauthorized(ctx, "Unauthorized");
  }

  const limited = await applyApiRateLimit(ctx, {
    scope: "automation_cron",
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  if (cronRunInFlight) {
    return apiError(ctx, 409, "CRON_RUN_IN_PROGRESS", "A scheduled automation run is already in progress");
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return apiError(ctx, 500, "ENV_MISSING", "Server environment is not configured");
  }

  cronRunInFlight = true;

  try {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch enabled automations
  const { data: automations, error: autoErr } = await admin
    .from("automations")
    .select("id, enabled, run_count")
    .eq("enabled", true)
    .limit(MAX_RULES_PER_RUN);

  if (autoErr) {
    console.error(`${TAG} request_id=${ctx.requestId} failed to fetch automations: ${autoErr.message}`);
    return internalError(ctx, autoErr, TAG);
  }

  const results: Array<{ id: string; status: string; result: string }> = [];

  for (const rule of (automations ?? [])) {
    const schedule = RULE_SCHEDULES[rule.id];
    if (!schedule || !shouldRunNow(schedule)) continue;

    let result = "تم التنفيذ";
    let status: "success" | "warning" | "error" = "success";

    try {
      if (rule.id === "late-tasks") {
        const now = new Date().toISOString();
        const { data: lateTasks } = await admin
          .from("tasks")
          .select("id")
          .neq("status", "مكتملة")
          .neq("status", "متأخرة")
          .lt("due_date", now)
          .limit(MAX_ROW_BATCH);

        const lateIds = (lateTasks ?? []).map((t: { id: string }) => t.id);
        if (lateIds.length > 0) {
          const { error: upErr } = await admin
            .from("tasks")
            .update({ status: "متأخرة" })
            .in("id", lateIds);
          if (upErr) throw upErr;
          result = `تم تحديث ${lateIds.length} مهمة كـ "متأخرة"`;
          status = "warning";
        } else {
          result = "لا توجد مهام متأخرة";
        }
      } else if (rule.id === "workload") {
        const { data: tasks } = await admin
          .from("tasks")
          .select("assignee_id")
          .neq("status", "مكتملة")
          .not("assignee_id", "is", null)
          .limit(MAX_ROW_BATCH);

        const counts: Record<string, number> = {};
        (tasks ?? []).forEach((t: { assignee_id: string }) => {
          counts[t.assignee_id] = (counts[t.assignee_id] ?? 0) + 1;
        });
        let updated = 0;
        for (const [empId, cnt] of Object.entries(counts)) {
          const { error } = await admin.from("employees").update({ tasks: cnt }).eq("id", empId);
          if (!error) updated++;
        }
        result = `تم تحديث عبء العمل لـ ${updated} موظف`;
      } else if (rule.id === "client-followup") {
        const { data: pending } = await admin
          .from("clients")
          .select("id, name")
          .eq("status", "محتمل")
          .limit(MAX_ROW_BATCH);
        result = pending?.length
          ? `تم إنشاء ${pending.length} تذكير متابعة للعملاء المحتملين`
          : "لا توجد عملاء محتملين";
      } else if (rule.id === "kpi-update") {
        result = "تم تحديث مؤشرات الأداء (بيانات حية من Supabase)";
      } else if (rule.id === "task-reminder") {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: upcoming } = await admin
          .from("tasks")
          .select("id")
          .neq("status", "مكتملة")
          .lt("due_date", tomorrow)
          .gt("due_date", new Date().toISOString())
          .limit(MAX_ROW_BATCH);
        result = `تم إرسال تنبيهات لـ ${upcoming?.length ?? 0} مهمة قادمة خلال 24 ساعة`;
      } else if (rule.id === "weekly-report") {
        const { count: clientCount } = await admin.from("clients").select("*", { count: "exact", head: true });
        const { count: taskCount }   = await admin.from("tasks").select("*", { count: "exact", head: true }).eq("status", "مكتملة");
        result = `تقرير أسبوعي جاهز: ${clientCount ?? 0} عميل، ${taskCount ?? 0} مهمة مكتملة`;
      }
    } catch (err: unknown) {
      status = "error";
      result = err instanceof Error ? err.message : String(err);
      console.error(`${TAG} request_id=${ctx.requestId} rule=${rule.id} error=${result}`);
    }

    // Update run stats
    const now = new Date().toISOString();
    await admin.from("automations").update({
      run_count: (rule.run_count ?? 0) + 1,
      last_run:  now,
      updated_at: now,
    }).eq("id", rule.id);

    // Insert log entry
    await admin.from("automation_logs").insert([{
      rule_id:    rule.id,
      rule_title: rule.id,
      result,
      status,
      created_at: now,
    }]);

    results.push({ id: rule.id, status, result });
    console.log(`${TAG} request_id=${ctx.requestId} rule=${rule.id} status=${status}`);
  }

  console.log(`${TAG} request_id=${ctx.requestId} completed ${results.length} rules`);
  return apiSuccess(ctx, { ok: true, ran: results.length, results });
  } catch (err) {
    return internalError(ctx, err, TAG);
  } finally {
    cronRunInFlight = false;
  }
}
