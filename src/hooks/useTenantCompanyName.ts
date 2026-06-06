"use client";

import { useEffect, useState } from "react";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getOrganizationName, getTenantWorkspaceSettings } from "@/lib/db";

/** Safe fallback shown when the current org has no saved company name. */
const FALLBACK_NAME = "منشأتك";

/**
 * Resolves the current organization's display name for tenant identity in the
 * customer workspace. Source of truth is the SAME tenant-scoped row that the
 * Settings → general "اسم الشركة" field writes:
 *   tenant_workspace_settings.company_info.name  (keyed by organization_id)
 * so a saved company name reflects on the dashboard after refresh.
 *
 * Scoped to the active organization_id from TenantWorkspaceContext — it never
 * reads another tenant's identity. When nothing is saved (or no org is
 * resolved) it returns a neutral fallback, never another customer's name.
 */
export function useTenantCompanyName(): {
  name: string;
  isFallback: boolean;
  loading: boolean;
} {
  const { organizationId } = useTenantWorkspace();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setName(null);
      return;
    }
    setLoading(true);
    (async () => {
      const row = await getTenantWorkspaceSettings(organizationId);
      const info = (row?.company_info ?? {}) as { name?: unknown };
      const savedName = typeof info.name === "string" ? info.name.trim() : "";
      if (savedName) return savedName;
      return getOrganizationName(organizationId);
    })()
      .then((resolvedName) => {
        if (cancelled) return;
        setName(resolvedName || null);
      })
      .catch(() => {
        if (!cancelled) setName(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { name: name ?? FALLBACK_NAME, isFallback: !name, loading };
}
