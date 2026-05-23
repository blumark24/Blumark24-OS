"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createWorkflow,
  deleteWorkflow,
  fetchAutomationRuns,
  fetchWorkflows,
  updateWorkflow,
} from "@/lib/automation/db";
import type { AutomationRun, AutomationWorkflow } from "@/lib/automation/types";
import type { AutomationAction, AutomationCondition, AutomationTriggerType } from "@/lib/automation/types";

export function useAutomationEngine(enabled = true) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
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
      const [w, r] = await Promise.all([fetchWorkflows(), fetchAutomationRuns(80)]);
      setWorkflows(w);
      setRuns(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر تحميل الأتمتة";
      setError(msg);
      setWorkflows([]);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    workflows,
    runs,
    loading,
    error,
    refresh,
    create: async (input: {
      name: string;
      description?: string;
      trigger_type: AutomationTriggerType;
      trigger_config?: Record<string, unknown>;
      conditions?: AutomationCondition[];
      actions?: AutomationAction[];
      created_by_name: string;
    }) => {
      await createWorkflow(input);
      await refresh();
    },
    save: async (
      id: string,
      changes: Parameters<typeof updateWorkflow>[1],
    ) => {
      await updateWorkflow(id, changes);
      await refresh();
    },
    remove: async (id: string) => {
      await deleteWorkflow(id);
      await refresh();
    },
    toggle: async (id: string, enabledFlag: boolean) => {
      await updateWorkflow(id, { enabled: enabledFlag });
      await refresh();
    },
  };
}
