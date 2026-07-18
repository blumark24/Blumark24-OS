"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { TaskPriority } from "@/types";

type RpcPayload = Record<string, unknown>;
type RefreshTasks = () => Promise<unknown>;

const TASK_ERROR_MESSAGES: Record<string, string> = {
  TASK_NOT_FOUND_OR_FORBIDDEN: "تعذر الوصول إلى المهمة أو لا تملك صلاحية هذا الإجراء.",
  INVALID_TRANSITION: "لا يمكن تنفيذ هذا الانتقال من حالة المهمة الحالية.",
  REVIEWER_NOT_ALLOWED: "المراجع غير نشط أو لا ينتمي إلى المنشأة نفسها.",
  REVIEW_NOT_ASSIGNED: "هذه المراجعة غير معينة لك أو لم تعد نشطة.",
  REVIEW_PENDING_REASSIGNMENT_BLOCKED: "لا يمكن إعادة التعيين أثناء وجود مراجعة معلقة.",
  PENDING_REVIEW_EXISTS: "توجد مراجعة معلقة لهذه المهمة بالفعل.",
  REASON_REQUIRED: "السبب أو الملاحظة مطلوبة لإتمام هذا الإجراء.",
  PAST_DUE_REASON_REQUIRED: "سبب الموعد السابق مطلوب.",
  FILE_NOT_READY: "الملف غير جاهز أو غير مرتبط بالمهمة بشكل صحيح.",
  TASK_FINALIZED: "المهمة مغلقة ولا يمكن تعديلها.",
  TASK_EDIT_LOCKED: "لا يمكن تعديل تفاصيل المهمة أثناء المراجعة.",
  CONCURRENT_CHANGE: "تغيرت المهمة أثناء العملية. حدّث الصفحة وحاول مجددًا.",
  INVALID_TASK_INPUT: "بيانات المهمة غير صالحة.",
};

export class TaskManagementError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "TaskManagementError";
  }
}

function getRpcErrorCode(error: { code?: string; message?: string } | null): string {
  const message = String(error?.message ?? "");
  const knownCode = Object.keys(TASK_ERROR_MESSAGES).find((code) => message.includes(code));
  return knownCode ?? error?.code ?? "TASK_ACTION_FAILED";
}

function messageForRpcError(error: { code?: string; message?: string } | null): TaskManagementError {
  const code = getRpcErrorCode(error);
  return new TaskManagementError(code, TASK_ERROR_MESSAGES[code] ?? "تعذر تنفيذ إجراء المهمة.");
}

export function useTaskManagement(onRefresh?: RefreshTasks) {
  const call = useCallback(async <T,>(name: string, payload: RpcPayload): Promise<T> => {
    const { data, error } = await supabase.rpc(name, payload);
    if (error) throw messageForRpcError(error);
    if (onRefresh) await onRefresh();
    return data as T;
  }, [onRefresh]);

  const createTask = useCallback((input: {
    title: string;
    description?: string;
    dueDate: string;
    priority: TaskPriority;
    assigneeId: string;
    tags?: string[];
    pastDueReason?: string;
  }) => call("create_task", {
    p_title: input.title,
    p_description: input.description ?? "",
    p_due_date: input.dueDate,
    p_priority: input.priority,
    p_assignee_id: input.assigneeId,
    p_tags: input.tags ?? [],
    p_past_due_reason: input.pastDueReason ?? null,
  }), [call]);

  const updateTaskDetails = useCallback((taskId: string, input: {
    title: string;
    description?: string;
    dueDate: string;
    priority: TaskPriority;
    tags?: string[];
  }) => call("update_task_details", {
    p_task_id: taskId,
    p_title: input.title,
    p_description: input.description ?? "",
    p_due_date: input.dueDate,
    p_priority: input.priority,
    p_tags: input.tags ?? [],
  }), [call]);

  const reassignTask = useCallback((taskId: string, assigneeId: string) => call("reassign_task", {
    p_task_id: taskId,
    p_assignee_id: assigneeId,
  }), [call]);

  const assignReviewer = useCallback((taskId: string, reviewerId: string) => call("assign_task_reviewer", {
    p_task_id: taskId,
    p_reviewer_id: reviewerId,
  }), [call]);

  const cancelTask = useCallback((taskId: string, reason: string) => call("cancel_task", {
    p_task_id: taskId,
    p_reason: reason,
  }), [call]);

  const startTask = useCallback((taskId: string) => call("start_task", { p_task_id: taskId }), [call]);
  const pauseTask = useCallback((taskId: string, reason: string) => call("pause_task", { p_task_id: taskId, p_reason: reason }), [call]);
  const resumeTask = useCallback((taskId: string) => call("resume_task", { p_task_id: taskId }), [call]);
  const submitTaskForReview = useCallback((taskId: string, note: string, fileIds: string[] = []) => call("submit_task_for_review", {
    p_task_id: taskId,
    p_submission_note: note,
    p_file_ids: fileIds,
  }), [call]);
  const requestTaskRevision = useCallback((taskId: string, reviewId: string, note: string) => call("request_task_revision", {
    p_task_id: taskId,
    p_review_id: reviewId,
    p_reviewer_note: note,
  }), [call]);
  const approveTask = useCallback((taskId: string, reviewId: string, note?: string) => call("approve_task", {
    p_task_id: taskId,
    p_review_id: reviewId,
    p_reviewer_note: note ?? null,
  }), [call]);

  return {
    createTask,
    updateTaskDetails,
    reassignTask,
    assignReviewer,
    cancelTask,
    startTask,
    pauseTask,
    resumeTask,
    submitTaskForReview,
    requestTaskRevision,
    approveTask,
  };
}
