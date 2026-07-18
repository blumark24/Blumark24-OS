"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useData";
import { useTaskManagement } from "@/hooks/useTaskManagement";
import type { Task } from "@/types";

export const taskWorkflowCapabilities = {
  start: true,
  submitForReview: true,
  pause: false,
  resume: false,
  requestRevision: false,
  approve: false,
  cancel: false,
} as const;

export type TaskWorkflowAction = keyof typeof taskWorkflowCapabilities;

type CompatibilityStatusPatch = Pick<Task, "status">;

export class TaskWorkflowCompatibilityError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "TaskWorkflowCompatibilityError";
  }
}

interface CompatibilityAdapterOptions {
  tasks: readonly Task[];
  actorId: string | undefined;
  updateTask?: (taskId: string, patch: CompatibilityStatusPatch) => Promise<void>;
  executeAction?: (action: Extract<TaskWorkflowAction, "start" | "submitForReview">, task: Task, note?: string) => Promise<void>;
  onActionChange?: (action: TaskWorkflowAction | null) => void;
}

function getCompatibilityStatusPatch(
  action: Extract<TaskWorkflowAction, "start" | "submitForReview">,
  task: Task,
  actorId: string | undefined,
  allowLegacyOverdue = false,
): CompatibilityStatusPatch {
  if (!actorId || task.assigneeId !== actorId) {
    throw new TaskWorkflowCompatibilityError("TASK_NOT_FOUND_OR_FORBIDDEN", "لا تملك صلاحية تنفيذ إجراء على هذه المهمة.");
  }

  if (task.status === "متأخرة" && !allowLegacyOverdue) {
    throw new TaskWorkflowCompatibilityError(
      "LEGACY_OVERDUE_REQUIRES_RPC",
      "تحتاج ترحيل آمن عبر سير العمل الجديد.",
    );
  }

  if (action === "start") {
    if (task.status !== "جديدة" && !(allowLegacyOverdue && task.status === "متأخرة")) {
      throw new TaskWorkflowCompatibilityError("INVALID_TRANSITION", "يمكن بدء المهام الجديدة فقط في وضع التوافق الحالي.");
    }
    return { status: "قيد_التنفيذ" };
  }

  if (task.status !== "قيد_التنفيذ") {
    throw new TaskWorkflowCompatibilityError("INVALID_TRANSITION", "يمكن إرسال المهمة قيد التنفيذ للمراجعة فقط.");
  }
  return { status: "بانتظار_المراجعة" };
}

export function createTaskWorkflowCompatibilityAdapter({
  tasks,
  actorId,
  updateTask,
  executeAction,
  onActionChange,
}: CompatibilityAdapterOptions) {
  let pendingAction: TaskWorkflowAction | null = null;

  const run = async (action: TaskWorkflowAction, taskId: string, note?: string) => {
    if (!taskWorkflowCapabilities[action]) {
      throw new TaskWorkflowCompatibilityError(
        "WORKFLOW_ACTION_UNAVAILABLE",
        "هذا الإجراء سيتاح بعد تفعيل سير العمل الآمن.",
      );
    }

    if (action !== "start" && action !== "submitForReview") {
      throw new TaskWorkflowCompatibilityError(
        "WORKFLOW_ACTION_UNAVAILABLE",
        "هذا الإجراء سيتاح بعد تفعيل سير العمل الآمن.",
      );
    }

    if (pendingAction) {
      throw new TaskWorkflowCompatibilityError("WORKFLOW_ACTION_IN_PROGRESS", "يوجد إجراء قيد التنفيذ بالفعل.");
    }

    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      throw new TaskWorkflowCompatibilityError("TASK_NOT_FOUND_OR_FORBIDDEN", "تعذر الوصول إلى هذه المهمة.");
    }

    pendingAction = action;
    onActionChange?.(action);
    try {
      const patch = getCompatibilityStatusPatch(action, task, actorId, Boolean(executeAction));
      if (executeAction) {
        await executeAction(action, task, note);
      } else if (updateTask) {
        await updateTask(task.id, patch);
      } else {
        throw new TaskWorkflowCompatibilityError("WORKFLOW_ACTION_UNAVAILABLE", "لم يتم تهيئة مسار تنفيذ آمن للمهمة.");
      }
    } finally {
      pendingAction = null;
      onActionChange?.(null);
    }
  };

  return {
    start: (taskId: string) => run("start", taskId),
    pause: (taskId: string) => run("pause", taskId),
    resume: (taskId: string) => run("resume", taskId),
    submitForReview: (taskId: string, note?: string) => run("submitForReview", taskId, note),
    requestRevision: (taskId: string) => run("requestRevision", taskId),
    approve: (taskId: string) => run("approve", taskId),
    cancel: (taskId: string) => run("cancel", taskId),
  };
}

export function useTaskWorkflow() {
  const { data: tasks, refetch } = useTasks();
  const { user } = useAuth();
  const [pendingAction, setPendingAction] = useState<TaskWorkflowAction | null>(null);
  const taskManagement = useTaskManagement(refetch);

  const executeAction = useCallback(async (action: Extract<TaskWorkflowAction, "start" | "submitForReview">, task: Task, note?: string) => {
    if (action === "start") {
      await taskManagement.startTask(task.id);
      return;
    }
    if (!note?.trim()) {
      throw new TaskWorkflowCompatibilityError("REASON_REQUIRED", "ملاحظة الإرسال مطلوبة قبل إرسال المهمة للمراجعة.");
    }
    await taskManagement.submitTaskForReview(task.id, note.trim());
  }, [taskManagement]);

  const adapter = useMemo(
    () => createTaskWorkflowCompatibilityAdapter({
      tasks,
      actorId: user?.id,
      executeAction,
      onActionChange: setPendingAction,
    }),
    [tasks, executeAction, user?.id],
  );

  const isActionPending = useCallback(
    (action: TaskWorkflowAction) => pendingAction === action,
    [pendingAction],
  );

  return {
    capabilities: taskWorkflowCapabilities,
    pendingAction,
    isBusy: pendingAction !== null,
    isActionPending,
    start: adapter.start,
    pause: adapter.pause,
    resume: adapter.resume,
    submitForReview: adapter.submitForReview,
    requestRevision: adapter.requestRevision,
    approve: adapter.approve,
    cancel: adapter.cancel,
  };
}
