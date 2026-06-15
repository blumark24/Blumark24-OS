"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatTenantDepartment } from "@/lib/tenant/tenantDisplay";

/**
 * Resolves the department label shown in header/dashboard:
 * 1) name from employee_relations → departments (live org-structure, source of truth)
 * 2) else profiles.department (legacy HR field, fallback only)
 */
export function useProfileOrgDepartment() {
  const { user } = useAuth();
  const [orgDeptName, setOrgDeptName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setOrgDeptName(null);
      return;
    }
    setLoading(true);
    try {
      const { data: rel } = await supabase
        .from("employee_relations")
        .select("department_id")
        .eq("employee_id", user.id)
        .maybeSingle();

      if (!rel?.department_id) {
        setOrgDeptName(null);
        return;
      }

      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", rel.department_id)
        .maybeSingle();

      setOrgDeptName(dept?.name ?? null);
    } catch {
      setOrgDeptName(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const profileDept = user?.department;
  const effectiveRaw =
    orgDeptName
      ? orgDeptName
      : (profileDept && profileDept.trim() && profileDept !== "—" ? profileDept : null);

  const display = formatTenantDepartment(effectiveRaw);

  return { display, loading, refresh, orgDeptName, profileDept };
}
