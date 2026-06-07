"use client";

import { useEffect, useState } from "react";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getOrganizationName, getTenantWorkspaceSettings } from "@/lib/db";

/** Safe fallback shown when the current org has no saved company name. */
const FALLBACK_NAME = "منشأتك";
export const TENANT_COMPANY_CHANGED_EVENT = "blumark24:tenant-company-changed";

export function notifyTenantCompanyChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TENANT_COMPANY_CHANGED_EVENT));
}

/**
 * Resolves the current organization's display identity for the customer
 * workspace. Source of truth is the tenant-scoped settings row:
 * tenant_workspace_settings.company_info.name/logo_url keyed by organization_id.
 */
export function useTenantCompanyName(): {
  name: string;
  companyName: string | null;
  organizationName: string | null;
  logoUrl: string | null;
  isFallback: boolean;
  loading: boolean;
} {
  const { organizationId } = useTenantWorkspace();
  const [company, setCompany] = useState<{
    companyName: string | null;
    organizationName: string | null;
    logoUrl: string | null;
  }>({
    companyName: null,
    organizationName: null,
    logoUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener(TENANT_COMPANY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TENANT_COMPANY_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setCompany({ companyName: null, organizationName: null, logoUrl: null });
      return;
    }

    setLoading(true);
    (async () => {
      const row = await getTenantWorkspaceSettings(organizationId);
      const info = (row?.company_info ?? {}) as { name?: unknown; logo_url?: unknown };
      const savedName = typeof info.name === "string" ? info.name.trim() : "";
      const savedLogoUrl = typeof info.logo_url === "string" ? info.logo_url.trim() : "";
      const orgName = await getOrganizationName(organizationId);

      return {
        companyName: savedName || null,
        organizationName: orgName || null,
        logoUrl: savedLogoUrl || null,
      };
    })()
      .then((resolvedCompany) => {
        if (cancelled) return;
        setCompany(resolvedCompany);
      })
      .catch(() => {
        if (!cancelled) {
          setCompany({ companyName: null, organizationName: null, logoUrl: null });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey]);

  const resolvedName = company.companyName ?? company.organizationName;

  return {
    name: resolvedName ?? FALLBACK_NAME,
    companyName: company.companyName,
    organizationName: company.organizationName,
    logoUrl: company.logoUrl,
    isFallback: !resolvedName,
    loading,
  };
}
