"use client";

import { useEffect, useState } from "react";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getTenantWorkspaceSettings } from "@/lib/db";

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
  logoUrl: string | null;
  isFallback: boolean;
  loading: boolean;
} {
  const { organizationId } = useTenantWorkspace();
  const [name, setName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setName(null);
      setLogoUrl(null);
      return;
    }
    setLoading(true);
    getTenantWorkspaceSettings(organizationId)
      .then((row) => {
        if (cancelled) return;
        const info = (row?.company_info ?? {}) as { name?: unknown; logo_url?: unknown };
        const raw = typeof info.name === "string" ? info.name.trim() : "";
        const logo = typeof info.logo_url === "string" ? info.logo_url.trim() : "";
        setName(raw || null);
        setLogoUrl(logo || null);
      })
      .catch(() => {
        if (!cancelled) {
          setName(null);
          setLogoUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { name: name ?? FALLBACK_NAME, logoUrl, isFallback: !name, loading };
}
