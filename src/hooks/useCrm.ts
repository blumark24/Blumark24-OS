"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createContract,
  createDeal,
  createNote,
  createReminder,
  deleteDeal,
  fetchCrmSnapshot,
  moveDealToStage,
  recordRevenue,
  toggleReminder,
} from "@/lib/crm/db";
import type { CrmSnapshot, CrmDeal, CrmStage } from "@/lib/crm/types";

export function useCrm(enabled = true) {
  const [snapshot, setSnapshot] = useState<CrmSnapshot | null>(null);
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
      const data = await fetchCrmSnapshot();
      setSnapshot(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر تحميل CRM";
      setError(msg);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    loading,
    error,
    refresh,
    createDeal: async (
      input: Parameters<typeof createDeal>[0],
    ) => {
      await createDeal(input);
      await refresh();
    },
    moveDeal: async (deal: CrmDeal, stage: CrmStage, authorName: string) => {
      await moveDealToStage(deal, stage, authorName);
      await refresh();
    },
    deleteDeal: async (id: string) => {
      await deleteDeal(id);
      await refresh();
    },
    addNote: async (input: Parameters<typeof createNote>[0]) => {
      await createNote(input);
      await refresh();
    },
    addReminder: async (input: Parameters<typeof createReminder>[0]) => {
      await createReminder(input);
      await refresh();
    },
    setReminderDone: async (id: string, done: boolean) => {
      await toggleReminder(id, done);
      await refresh();
    },
    addContract: async (input: Parameters<typeof createContract>[0]) => {
      await createContract(input);
      await refresh();
    },
    addRevenue: async (input: Parameters<typeof recordRevenue>[0]) => {
      await recordRevenue(input);
      await refresh();
    },
  };
}
