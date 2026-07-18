import type { Task } from "@/types";

export type TaskWorkflowStatus =
  | "جديدة"
  | "قيد_التنفيذ"
  | "موقوفة"
  | "بانتظار_المراجعة"
  | "طلب_تعديل"
  | "مكتملة"
  | "ملغاة";
export type TaskStoredStatus = TaskWorkflowStatus | "متأخرة";
type TaskStatusSubject = { dueDate: Task["dueDate"]; status: TaskStoredStatus };

export type TaskDisplayTone = "info" | "warning" | "review" | "success" | "danger" | "muted";

export interface TaskStatusMeta {
  label: string;
  color: string;
  tone: TaskDisplayTone;
}

export interface TaskViewState {
  workflowStatus: TaskWorkflowStatus | null;
  isOverdue: boolean;
  isLegacyOverdue: boolean;
  displayLabel: string;
  displayTone: TaskDisplayTone;
  color: string;
}

export const TASK_WORKFLOW_STATUSES: readonly TaskWorkflowStatus[] = [
  "جديدة",
  "قيد_التنفيذ",
  "موقوفة",
  "بانتظار_المراجعة",
  "طلب_تعديل",
  "مكتملة",
  "ملغاة",
];

export const TASK_WORKFLOW_STATUS_META: Record<TaskWorkflowStatus, TaskStatusMeta> = {
  جديدة: { label: "جديدة", color: "#22d3ee", tone: "info" },
  قيد_التنفيذ: { label: "قيد التنفيذ", color: "#f59e0b", tone: "warning" },
  موقوفة: { label: "موقوفة", color: "#94a3b8", tone: "muted" },
  بانتظار_المراجعة: { label: "بانتظار المراجعة", color: "#a855f7", tone: "review" },
  طلب_تعديل: { label: "طلب تعديل", color: "#fb7185", tone: "danger" },
  مكتملة: { label: "مكتملة", color: "#10b981", tone: "success" },
  ملغاة: { label: "ملغاة", color: "#64748b", tone: "muted" },
};

export const LEGACY_OVERDUE_META: TaskStatusMeta = {
  label: "متأخرة (سجل قديم)",
  color: "#ef4444",
  tone: "danger",
};

function isTerminalStatus(status: TaskStoredStatus) {
  return status === "مكتملة" || status === "ملغاة";
}

export function isLegacyOverdue(task: { status: TaskStoredStatus }): boolean {
  return task.status === "متأخرة";
}

export function isTaskOverdue(task: TaskStatusSubject, now: Date = new Date()): boolean {
  if (!task.dueDate?.trim() || isTerminalStatus(task.status)) return false;

  const dueAt = new Date(task.dueDate);
  const nowAt = now.getTime();
  if (Number.isNaN(dueAt.getTime()) || Number.isNaN(nowAt)) return false;

  return dueAt.getTime() < nowAt;
}

export function getTaskViewState(task: TaskStatusSubject, now?: Date): TaskViewState {
  const overdue = isTaskOverdue(task, now);

  if (task.status === "متأخرة") {
    return {
      workflowStatus: null,
      isOverdue: overdue,
      isLegacyOverdue: true,
      displayLabel: LEGACY_OVERDUE_META.label,
      displayTone: LEGACY_OVERDUE_META.tone,
      color: LEGACY_OVERDUE_META.color,
    };
  }

  const meta = TASK_WORKFLOW_STATUS_META[task.status];
  return {
    workflowStatus: task.status,
    isOverdue: overdue,
    isLegacyOverdue: false,
    displayLabel: meta.label,
    displayTone: meta.tone,
    color: meta.color,
  };
}

export function getTaskOverdueMetrics(tasks: readonly TaskStatusSubject[], now?: Date) {
  let derivedOverdue = 0;
  let legacyOverdue = 0;
  let overdueTotal = 0;

  for (const task of tasks) {
    const derived = isTaskOverdue(task, now);
    const legacy = isLegacyOverdue(task);
    if (derived) derivedOverdue += 1;
    if (legacy) legacyOverdue += 1;
    if (derived || legacy) overdueTotal += 1;
  }

  return { derivedOverdue, legacyOverdue, overdueTotal };
}
