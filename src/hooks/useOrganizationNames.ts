"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function stableIdsKey(ids: (string | null | undefined)[]): string {
  const unique = Array.from(
    new Set(ids.filter((id): id is string => Boolean(id?.trim()))),
  );
  unique.sort();
  return unique.join(",");
}

/**
 * Read-only lookup: organization_id → organizations.name (via server route).
 */
export function useOrganizationNames(organizationIds: (string | null | undefined)[]) {
  const [namesById, setNamesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const idsKey = useMemo(() => stableIdsKey(organizationIds), [organizationIds]);

  const load = useCallback(async () => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) {
      setNamesById({});
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setNamesById({});
        return;
      }

      const params = new URLSearchParams({ ids: ids.join(",") });
      const res = await fetch(`/api/tenant/organization-names?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        setNamesById({});
        return;
      }

      const body = (await res.json()) as { names?: Record<string, string> };
      setNamesById(body.names ?? {});
    } catch {
      setNamesById({});
    } finally {
      setLoading(false);
    }
  }, [idsKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { namesById, loading, refresh: load };
}
