"use client";

import { useEffect, useState } from "react";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getOrganizationName, getTenantWorkspaceSettings } from "@/lib/db";

/** Safe fallback shown when the current org has no saved company name. */
const FALLBACK_NAME = "منشأتك";

/**
 * Resolves the current organization's display name for tenant identity in the
 * customer workspace. Source of truth is the SAME tenant-scoped row that the
 * Settings → general "اسم المنشأة" field writes:
 *   tenant_workspace_settings.company_info.name/logo_url (keyed by organization_id)
 * so a saved company name reflects on the dashboard after refresh.
 *
 * Scoped to the active organization_id from TenantWorkspaceContext — it never
 * reads another tenant's identity. When nothing is saved (or no org is
 * resolved) it returns a neutral fallback, never another customer's name.
 */
export function useTenantCompanyName(): {
  name: string;
  logoUrl: string | null;
  isFallback: boolean;
  loading: boolean;
} {
  const { organizationId } = useTenantWorkspace();
  const [company, setCompany] = useState<{ name: string | null; logoUrl: string | null }>({
    name: null,
    logoUrl: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setCompany({ name: null, logoUrl: null });
      return;
    }
    setLoading(true);
    (async () => {
      const row = await getTenantWorkspaceSettings(organizationId);
      const info = (row?.company_info ?? {}) as { name?: unknown; logo_url?: unknown };
      const savedName = typeof info.name === "string" ? info.name.trim() : "";
      const savedLogoUrl = typeof info.logo_url === "string" ? info.logo_url.trim() : "";
      const resolvedName = savedName || (await getOrganizationName(organizationId));
      return {
        name: resolvedName || null,
        logoUrl: savedLogoUrl || null,
      };
    })()
      .then((resolvedCompany) => {
        if (cancelled) return;
        setCompany(resolvedCompany);
      })
      .catch(() => {
        if (!cancelled) setCompany({ name: null, logoUrl: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return {
    name: company.name ?? FALLBACK_NAME,
    logoUrl: company.logoUrl,
    isFallback: !company.name,
    loading,
  };
}
