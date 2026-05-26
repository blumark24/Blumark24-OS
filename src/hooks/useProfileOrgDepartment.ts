"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatTenantDepartment } from "@/lib/tenant/tenantDisplay";
import { resolveTenantOrgId } from "@/lib/tenant/tenantScope";

/**
 * Resolves the department label shown in header/dashboard:
 * 1) profiles.department (HR field)
 * 2) else name from employee_relations → departments (org chart link)
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
      // TENANT-LOCKDOWN-1: scope both reads to caller's organization.
      const orgId = await resolveTenantOrgId();
      if (!orgId) {
        setOrgDeptName(null);
        return;
      }

      const { data: rel } = await supabase
        .from("employee_relations")
        .select("department_id")
        .eq("employee_id", user.id)
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!rel?.department_id) {
        setOrgDeptName(null);
        return;
      }

      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", rel.department_id)
        .eq("organization_id", orgId)
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
    profileDept && profileDept.trim() && profileDept !== "—"
      ? profileDept
      : orgDeptName;

  const display = formatTenantDepartment(effectiveRaw);

  return { display, loading, refresh, orgDeptName, profileDept };
}
