"use client";

import { useCallback, useEffect, useState } from "react";
import { getDashboardMetrics } from "@/services/dashboardMetricsService";
import type { DashboardMetrics } from "@/types/dashboard";

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error("Failed to fetch dashboard metrics", e);
      setError("تعذر تحميل بعض المؤشرات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { metrics, loading, error, refetch };
}
