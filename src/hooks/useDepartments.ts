"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
} from "@/lib/services/departments";

export function useDepartments() {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listDepartments();
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الأقسام");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const insert = useCallback(
    async (input: { name: string; description?: string; icon?: string }) => {
      const row = await createDepartment(input);
      await refetch();
      return row;
    },
    [refetch],
  );

  const update = useCallback(
    async (id: string, changes: Parameters<typeof updateDepartment>[1]) => {
      await updateDepartment(id, changes);
      await refetch();
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDepartment(id);
      await refetch();
    },
    [refetch],
  );

  return { data, loading, error, refetch, insert, update, remove, setData };
}
