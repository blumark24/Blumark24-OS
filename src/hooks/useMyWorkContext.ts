"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  resolveMyWorkContext,
  EMPTY_WORK_CONTEXT,
  type WorkContext,
} from "@/lib/tenant/workContext";

/**
 * TENANT-WORK-CONTEXT-ENGINE-1
 *
 * React hook that resolves the CURRENT user's own work context (role, job
 * title, org link, direct manager, join date, status) from production tables,
 * scoped to their own organization via RLS. Read-only — the profile flow never
 * mutates work data through this hook.
 *
 * Pass `enabled = false` to defer the queries (e.g. while a modal is closed).
 */
export function useMyWorkContext(enabled = true): {
  context: WorkContext;
  loading: boolean;
} {
  const { user } = useAuth();
  const [context, setContext] = useState<WorkContext>(EMPTY_WORK_CONTEXT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !user?.id) {
      setContext(EMPTY_WORK_CONTEXT);
      return;
    }
    let cancelled = false;
    setLoading(true);
    resolveMyWorkContext(user.id, user.role)
      .then((ctx) => {
        if (!cancelled) setContext(ctx);
      })
      .catch(() => {
        if (!cancelled) setContext(EMPTY_WORK_CONTEXT);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id, user?.role]);

  return { context, loading };
}
