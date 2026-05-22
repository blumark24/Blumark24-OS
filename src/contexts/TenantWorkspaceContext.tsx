"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, type Permission } from "@/contexts/PermissionsContext";
import { supabase } from "@/lib/supabase";
import {
  canAccessWorkspaceRoute,
  filterNavRoutes,
  getRouteByPathname,
  normalizePlanSlug,
  type PlanSlug,
  type WorkspaceRouteDef,
} from "@/lib/features/packageFeatures";

export interface TenantWorkspaceState {
  isInternal: boolean;
  planSlug: PlanSlug;
  isPlatformAdmin: boolean;
  loading: boolean;
  error: string | null;
  navRoutes: WorkspaceRouteDef[];
  canAccessPath: (pathname: string) => boolean;
  refresh: () => Promise<void>;
}

const defaultState: TenantWorkspaceState = {
  isInternal: false,
  planSlug: "basic",
  isPlatformAdmin: false,
  loading: true,
  error: null,
  navRoutes: [],
  canAccessPath: () => false,
  refresh: async () => {},
};

const TenantWorkspaceContext = createContext<TenantWorkspaceState>(defaultState);

export function TenantWorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, userRole } = usePermissions();

  const [isInternal, setIsInternal] = useState(false);
  const [planSlug, setPlanSlug] = useState<PlanSlug>("basic");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("لا توجد جلسة نشطة");
        return;
      }

      const res = await fetch("/api/tenant/workspace-context", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "تعذر تحميل سياق مساحة العمل");
        const rpc = await supabase.rpc("current_org_is_internal");
        if (!rpc.error && rpc.data === true) {
          setIsInternal(true);
          setPlanSlug("advanced");
        }
        return;
      }

      const body = (await res.json()) as {
        isInternal?: boolean;
        planSlug?: string;
        isPlatformAdmin?: boolean;
      };

      setIsInternal(body.isInternal === true);
      setPlanSlug(normalizePlanSlug(body.planSlug));
      setIsPlatformAdmin(body.isPlatformAdmin === true);
    } catch {
      setError("تعذر تحميل سياق مساحة العمل");
      const rpc = await supabase.rpc("current_org_is_internal");
      if (!rpc.error && rpc.data === true) {
        setIsInternal(true);
        setPlanSlug("advanced");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setIsInternal(false);
      setPlanSlug("basic");
      setIsPlatformAdmin(false);
      return;
    }
    void load();
  }, [authLoading, user?.id, load]);

  const accessCtx = useMemo(
    () => ({
      isInternal,
      planSlug,
      isPlatformAdmin: isPlatformAdmin || userRole === "super_admin",
    }),
    [isInternal, planSlug, isPlatformAdmin, userRole],
  );

  const hasPermWithExtras = useCallback(
    (perm: Permission) => {
      if (!userRole) return false;
      if (accessCtx.isPlatformAdmin) return true;
      return hasPermission(perm);
    },
    [userRole, accessCtx.isPlatformAdmin, hasPermission],
  );

  const navRoutes = useMemo(() => {
    if (authLoading || !userRole) return [];
    return filterNavRoutes(accessCtx, hasPermission);
  }, [authLoading, userRole, accessCtx, hasPermission]);

  const canAccessPath = useCallback(
    (pathname: string) => {
      const route = getRouteByPathname(pathname);
      if (!route) return true;
      if (!userRole && !accessCtx.isPlatformAdmin) return false;
      return canAccessWorkspaceRoute(route, accessCtx, hasPermission, [
        "view_employees",
      ]);
    },
    [userRole, accessCtx, hasPermission],
  );

  const value = useMemo<TenantWorkspaceState>(
    () => ({
      isInternal,
      planSlug,
      isPlatformAdmin: accessCtx.isPlatformAdmin,
      loading: authLoading || loading,
      error,
      navRoutes,
      canAccessPath,
      refresh: load,
    }),
    [
      isInternal,
      planSlug,
      accessCtx.isPlatformAdmin,
      authLoading,
      loading,
      error,
      navRoutes,
      canAccessPath,
      load,
    ],
  );

  return (
    <TenantWorkspaceContext.Provider value={value}>
      {children}
    </TenantWorkspaceContext.Provider>
  );
}

export function useTenantWorkspace() {
  return useContext(TenantWorkspaceContext);
}
