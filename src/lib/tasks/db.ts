import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/db";
import type { Task, TaskRecurrenceRule, TaskStatus } from "@/types";
import type {
  TaskAttachment,
  TaskAutomationEvent,
  TaskAutomationTrigger,
  TaskComment,
  TaskDepartment,
  TaskEngineSnapshot,
} from "./types";

const BUCKET = "task-attachments";

function row<T>(data: unknown): T {
  return data as T;
}

/** User-facing message when Storage bucket is missing or misconfigured. */
export function formatTaskAttachmentError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("bucket not found") ||
    lower.includes("not found") && lower.includes("bucket") ||
    lower.includes("task-attachments") ||
    lower.includes("storage")
  ) {
    return (
      "حاوية التخزين «task-attachments» غير موجودة أو غير مهيأة في Supabase Storage. " +
      "أنشئ bucket باسم task-attachments (عام للقراءة أو سياسات RLS مناسبة) ثم أعد المحاولة."
    );
  }
  return message;
}

export async function fetchDepartments(): Promise<TaskDepartment[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, color")
    .order("sort_order");
  if (error) return [];
  return (data ?? []) as TaskDepartment[];
}

export async function fetchTaskEngineSnapshot(): Promise<TaskEngineSnapshot> {
  const departments = await fetchDepartments();
  const [commentsRes, attachmentsRes, triggersRes] = await Promise.all([
    supabase.from("task_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("task_attachments").select("*").order("created_at", { ascending: false }),
    supabase.from("task_automation_triggers").select("*").order("created_at", { ascending: false }),
  ]);

  const errs = [commentsRes.error, attachmentsRes.error, triggersRes.error].filter(Boolean);
  if (errs.length > 0) {
    const msg = errs[0]!.message;
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return { comments: [], attachments: [], triggers: [], departments };
    }
    throw new Error(msg);
  }

  return {
    comments: (commentsRes.data ?? []) as TaskComment[],
    attachments: (attachmentsRes.data ?? []) as TaskAttachment[],
    triggers: (triggersRes.data ?? []) as TaskAutomationTrigger[],
    departments,
  };
}

export async function syncOverdueTasks(tasks: Task[]): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(
    (t) =>
      t.status !== "مكتملة" &&
      t.status !== "متأخرة" &&
      t.dueDate &&
      new Date(t.dueDate) < today,
  );
  for (const t of overdue) {
    await supabase.from("tasks").update({ status: "متأخرة" }).eq("id", t.id);
  }
}

function nextDueDate(from: string, rule: TaskRecurrenceRule): string {
  const d = new Date(from);
  const interval = rule.interval ?? 1;
  if (rule.frequency === "daily") d.setDate(d.getDate() + interval);
  else if (rule.frequency === "weekly") d.setDate(d.getDate() + 7 * interval);
  else if (rule.frequency === "monthly") d.setMonth(d.getMonth() + interval);
  return d.toISOString().slice(0, 10);
}

export async function spawnRecurringTask(
  completed: Task,
  createdByName: string,
): Promise<void> {
  const rule = completed.recurrenceRule;
  if (!rule || rule.frequency === "none") return;

  const nextDue = nextDueDate(completed.dueDate, rule);
  const { error } = await supabase.from("tasks").insert({
    title: completed.title,
    description: completed.description,
    status: "جديدة",
    priority: completed.priority,
    assignee_id: completed.assigneeId,
    assignee_name: completed.assigneeName,
    client_id: completed.clientId ?? null,
    client_name: completed.clientName ?? null,
    due_date: nextDue,
    due_at: `${nextDue}T09:00:00Z`,
    department_id: completed.departmentId ?? null,
    team_id: completed.teamId ?? null,
    recurrence_rule: rule,
    recurrence_parent_id: completed.recurrenceParentId ?? completed.id,
    created_by_id: completed.createdById ?? "",
    created_by_name: createdByName,
    notify_assignee: completed.notifyAssignee ?? true,
  });
  if (error) throw new Error(error.message);
}

function matchesConditions(
  task: Task,
  conditions: Record<string, unknown>,
): boolean {
  if (conditions.priority && task.priority !== conditions.priority) return false;
  if (conditions.status && task.status !== conditions.status) return false;
  if (conditions.department_id && task.departmentId !== conditions.department_id) return false;
  return true;
}

export async function runTaskAutomations(
  event: TaskAutomationEvent,
  task: Task,
  triggers: TaskAutomationTrigger[],
): Promise<void> {
  const active = triggers.filter((t) => t.enabled && t.event_type === event);
  for (const trigger of active) {
    if (!matchesConditions(task, trigger.conditions)) continue;
    const actions = trigger.actions;
    if (actions.notify_assignee && task.assigneeId) {
      await createNotification(
        event === "task_overdue" ? "task_late" : "task_due",
        (actions.notification_title as string) || trigger.name,
        (actions.notification_body as string) || task.title,
        "/tasks",
        task.assigneeId,
      );
    }
    if (actions.set_status && typeof actions.set_status === "string") {
      await supabase
        .from("tasks")
        .update({ status: actions.set_status as TaskStatus })
        .eq("id", task.id);
    }
  }
}

export async function createTaskComment(input: {
  task_id: string;
  body: string;
  author_id: string;
  author_name: string;
}): Promise<TaskComment> {
  const { data, error } = await supabase
    .from("task_comments")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return row<TaskComment>(data);
}

export async function deleteTaskComment(id: string): Promise<void> {
  const { error } = await supabase.from("task_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uploadTaskAttachment(input: {
  task_id: string;
  file: File;
  uploaded_by_id: string;
  uploaded_by_name: string;
}): Promise<TaskAttachment> {
  const path = `${input.task_id}/${Date.now()}-${input.file.name}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, { upsert: false });
  if (upErr) throw new Error(formatTaskAttachmentError(upErr.message));

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: input.task_id,
      file_name: input.file.name,
      storage_path: path,
      mime_type: input.file.type || "application/octet-stream",
      size_bytes: input.file.size,
      uploaded_by_id: input.uploaded_by_id,
      uploaded_by_name: input.uploaded_by_name,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return row<TaskAttachment>(data);
}

export async function getAttachmentPublicUrl(storagePath: string): Promise<string | null> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl ?? null;
}

export async function deleteTaskAttachment(att: TaskAttachment): Promise<void> {
  await supabase.storage.from(BUCKET).remove([att.storage_path]);
  const { error } = await supabase.from("task_attachments").delete().eq("id", att.id);
  if (error) throw new Error(error.message);
}

export async function createAutomationTrigger(input: {
  name: string;
  event_type: TaskAutomationEvent;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
}): Promise<TaskAutomationTrigger> {
  const { data, error } = await supabase
    .from("task_automation_triggers")
    .insert({
      name: input.name,
      event_type: input.event_type,
      conditions: input.conditions ?? {},
      actions: input.actions ?? { notify_assignee: true },
      enabled: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return row<TaskAutomationTrigger>(data);
}

export async function updateAutomationTrigger(
  id: string,
  changes: Partial<Pick<TaskAutomationTrigger, "name" | "enabled" | "event_type" | "conditions" | "actions">>,
): Promise<void> {
  const { error } = await supabase.from("task_automation_triggers").update(changes).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAutomationTrigger(id: string): Promise<void> {
  const { error } = await supabase.from("task_automation_triggers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function notifyTaskAssignee(
  task: Task,
  kind: "task_due" | "task_late",
  title: string,
  body: string,
): Promise<void> {
  if (!task.notifyAssignee || !task.assigneeId) return;
  await createNotification(kind, title, body, "/tasks", task.assigneeId);
}
