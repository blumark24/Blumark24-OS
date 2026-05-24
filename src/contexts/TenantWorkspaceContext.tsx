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
  satisfiesPermission,
  type PlanSlug,
  type WorkspaceRouteDef,
} from "@/lib/features/packageFeatures";

export interface TenantWorkspaceState {
  isInternal: boolean;
  planSlug: PlanSlug;
  isPlatformAdmin: boolean;
  organizationId: string | null;
  organizationStatus: string | null;
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
  organizationId: null,
  organizationStatus: null,
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(null);
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
        organizationId?: string | null;
        organizationStatus?: string | null;
      };

      setIsInternal(body.isInternal === true);
      setPlanSlug(normalizePlanSlug(body.planSlug));
      setIsPlatformAdmin(body.isPlatformAdmin === true);
      setOrganizationId(body.organizationId ?? null);
      setOrganizationStatus(body.organizationStatus ?? null);
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
      setOrganizationId(null);
      setOrganizationStatus(null);
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

  const checkPermission = useCallback(
    (perm: Permission) => {
      if (!userRole) return false;
      if (accessCtx.isPlatformAdmin) return true;
      return satisfiesPermission(perm, hasPermission);
    },
    [userRole, accessCtx.isPlatformAdmin, hasPermission],
  );

  const navRoutes = useMemo(() => {
    if (authLoading || !userRole) return [];
    return filterNavRoutes(accessCtx, checkPermission, userRole);
  }, [authLoading, userRole, accessCtx, checkPermission]);

  const canAccessPath = useCallback(
    (pathname: string) => {
      const route = getRouteByPathname(pathname);
      if (!route) return true;
      if (!userRole && !accessCtx.isPlatformAdmin) return false;
      return canAccessWorkspaceRoute(route, accessCtx, checkPermission, userRole);
    },
    [userRole, accessCtx, checkPermission],
  );

  const value = useMemo<TenantWorkspaceState>(
    () => ({
      isInternal,
      planSlug,
      isPlatformAdmin: accessCtx.isPlatformAdmin,
      organizationId,
      organizationStatus,
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
      organizationId,
      organizationStatus,
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
