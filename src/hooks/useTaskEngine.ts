"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAutomationTrigger,
  createTaskComment,
  deleteAutomationTrigger,
  deleteTaskAttachment,
  deleteTaskComment,
  fetchTaskEngineSnapshot,
  runTaskAutomations,
  spawnRecurringTask,
  syncOverdueTasks,
  updateAutomationTrigger,
  uploadTaskAttachment,
} from "@/lib/tasks/db";
import type { TaskEngineSnapshot } from "@/lib/tasks/types";
import type { Task, TaskRecurrenceRule } from "@/types";
import type { TaskAutomationEvent } from "@/lib/tasks/types";

export function useTaskEngine(tasks: Task[], enabled = true) {
  const [snapshot, setSnapshot] = useState<TaskEngineSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tasks.length > 0) await syncOverdueTasks(tasks);
      const data = await fetchTaskEngineSnapshot();
      setSnapshot(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل محرك المهام");
      setSnapshot({ comments: [], attachments: [], triggers: [], departments: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled, tasks]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    loading,
    error,
    refresh,
    addComment: async (input: Parameters<typeof createTaskComment>[0]) => {
      await createTaskComment(input);
      await refresh();
    },
    removeComment: async (id: string) => {
      await deleteTaskComment(id);
      await refresh();
    },
    uploadAttachment: async (input: Parameters<typeof uploadTaskAttachment>[0]) => {
      const att = await uploadTaskAttachment(input);
      await refresh();
      return att;
    },
    removeAttachment: async (att: Parameters<typeof deleteTaskAttachment>[0]) => {
      await deleteTaskAttachment(att);
      await refresh();
    },
    addTrigger: async (input: Parameters<typeof createAutomationTrigger>[0]) => {
      await createAutomationTrigger(input);
      await refresh();
    },
    updateTrigger: async (
      id: string,
      changes: Parameters<typeof updateAutomationTrigger>[1],
    ) => {
      await updateAutomationTrigger(id, changes);
      await refresh();
    },
    removeTrigger: async (id: string) => {
      await deleteAutomationTrigger(id);
      await refresh();
    },
    runAutomations: (
      event: TaskAutomationEvent,
      task: Task,
    ) => {
      if (!snapshot?.triggers.length) return Promise.resolve();
      return runTaskAutomations(event, task, snapshot.triggers);
    },
    spawnRecurring: (task: Task, authorName: string) =>
      spawnRecurringTask(task, authorName),
  };
}

export type { TaskRecurrenceRule };
