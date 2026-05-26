"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDepartment,
  createPosition,
  createTeam,
  deleteDepartment,
  deletePosition,
  deleteTeam,
  fetchOrgStructure,
  updateDepartment,
  updatePosition,
  updateTeam,
  upsertEmployeeRelation,
  assignEmployeeToOrgUnit,
} from "@/lib/org/structureDb";
import type {
  DepartmentInput,
  OrgStructureSnapshot,
  PositionInput,
  TeamInput,
  EmployeeRelationInput,
} from "@/lib/org/types";
import { supabase } from "@/lib/supabase";

export function useOrgStructure(enabled: boolean) {
  const [data, setData] = useState<OrgStructureSnapshot | null>(null);
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
      const snap = await fetchOrgStructure();
      setData(snap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الهيكل التنظيمي");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // TENANT-LOCKDOWN-1: clear cached org structure on sign-out so the next
  // tenant that signs in cannot see the previous tenant's chart/tree.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setData(null);
        setError(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" && session) {
        void refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    createDepartment: async (input: DepartmentInput) => {
      await createDepartment(input);
      await refresh();
    },
    updateDepartment: async (id: string, input: Partial<DepartmentInput>) => {
      await updateDepartment(id, input);
      await refresh();
    },
    deleteDepartment: async (id: string) => {
      await deleteDepartment(id);
      await refresh();
    },
    createTeam: async (input: TeamInput) => {
      await createTeam(input);
      await refresh();
    },
    updateTeam: async (id: string, input: Partial<TeamInput>) => {
      await updateTeam(id, input);
      await refresh();
    },
    deleteTeam: async (id: string) => {
      await deleteTeam(id);
      await refresh();
    },
    createPosition: async (input: PositionInput) => {
      await createPosition(input);
      await refresh();
    },
    updatePosition: async (id: string, input: Partial<PositionInput>) => {
      await updatePosition(id, input);
      await refresh();
    },
    deletePosition: async (id: string) => {
      await deletePosition(id);
      await refresh();
    },
    upsertEmployeeRelation: async (input: EmployeeRelationInput) => {
      await upsertEmployeeRelation(input);
      await refresh();
    },
    assignEmployeeToOrgUnit: async (input: EmployeeRelationInput) => {
      await assignEmployeeToOrgUnit(input);
      await refresh();
    },
  };
}
