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
import {
  mapAuthRoleToUserRole,
  usePermissions,
  type Permission,
} from "@/contexts/PermissionsContext";
import { supabase } from "@/lib/supabase";
import {
  canAccessWorkspaceRoute,
  filterNavRoutes,
  getRouteByPathname,
  normalizePlanSlug,
  satisfiesPermission,
  type PlanSlug,
  type WorkspaceFeature,
  type WorkspaceRouteDef,
} from "@/lib/features/packageFeatures";

export interface TenantWorkspaceState {
  planSlug: PlanSlug;
  enabledFeatures: WorkspaceFeature[];
  planLimits: Record<string, number>;
  isPlatformAdmin: boolean;
  organizationId: string | null;
  organizationName: string | null;
  organizationStatus: string | null;
  loading: boolean;
  error: string | null;
  navRoutes: WorkspaceRouteDef[];
  canAccessPath: (pathname: string) => boolean;
  refresh: () => Promise<void>;
}

const defaultState: TenantWorkspaceState = {
  planSlug: "basic",
  enabledFeatures: [],
  planLimits: {},
  isPlatformAdmin: false,
  organizationId: null,
  organizationName: null,
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
  const resolvedRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);

  const [planSlug, setPlanSlug] = useState<PlanSlug>("basic");
  const [enabledFeatures, setEnabledFeatures] = useState<WorkspaceFeature[]>([]);
  const [planLimits, setPlanLimits] = useState<Record<string, number>>({});
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
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
        setEnabledFeatures([]);
        setPlanSlug("basic");
        return;
      }

      const res = await fetch("/api/tenant/workspace-context", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "تعذر تحميل سياق مساحة العمل");
        setPlanSlug("basic");
        setEnabledFeatures([]);
        setPlanLimits({});
        return;
      }

      const body = (await res.json()) as {
        planSlug?: string;
        enabledFeatures?: WorkspaceFeature[];
        planLimits?: Record<string, number>;
        featuresConfigured?: boolean;
        isPlatformAdmin?: boolean;
        organizationId?: string | null;
        organizationName?: string | null;
        organizationStatus?: string | null;
      };

      const slug = normalizePlanSlug(body.planSlug);
      setPlanSlug(slug);
      const features = Array.isArray(body.enabledFeatures)
        ? body.enabledFeatures
        : [];
      setEnabledFeatures(features);
      setPlanLimits(body.planLimits ?? {});
      setIsPlatformAdmin(body.isPlatformAdmin === true);
      setOrganizationId(body.organizationId ?? null);
      setOrganizationName(body.organizationName ?? null);
      setOrganizationStatus(body.organizationStatus ?? null);

      if (body.featuresConfigured !== true && body.isPlatformAdmin !== true) {
        setError("باقة المنشأة غير مكوّنة — طبّق migration 020 أو حدّث الباقة من مركز المالك");
      }
    } catch {
      setError("تعذر تحميل سياق مساحة العمل");
      setPlanSlug("basic");
      setEnabledFeatures([]);
      setPlanLimits({});
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setPlanSlug("basic");
      setEnabledFeatures([]);
      setPlanLimits({});
      setIsPlatformAdmin(false);
      setOrganizationId(null);
      setOrganizationName(null);
      setOrganizationStatus(null);
      return;
    }
    void load();
  }, [authLoading, user?.id, load]);

  const accessCtx = useMemo(
    () => ({
      planSlug,
      enabledFeatures,
      isPlatformAdmin: isPlatformAdmin || resolvedRole === "super_admin",
    }),
    [planSlug, enabledFeatures, isPlatformAdmin, resolvedRole],
  );

  const checkPermission = useCallback(
    (perm: Permission) => {
      if (!resolvedRole) return false;
      if (accessCtx.isPlatformAdmin) return true;
      return satisfiesPermission(perm, hasPermission);
    },
    [resolvedRole, accessCtx.isPlatformAdmin, hasPermission],
  );

  const navRoutes = useMemo(() => {
    if (authLoading || !user?.id || !resolvedRole) return [];
    return filterNavRoutes(accessCtx, checkPermission);
  }, [authLoading, user?.id, resolvedRole, accessCtx, checkPermission]);

  const canAccessPath = useCallback(
    (pathname: string) => {
      const route = getRouteByPathname(pathname);
      if (!route) return true;
      if (!resolvedRole && !accessCtx.isPlatformAdmin) return false;
      return canAccessWorkspaceRoute(route, accessCtx, checkPermission);
    },
    [resolvedRole, accessCtx, checkPermission],
  );

  const value = useMemo<TenantWorkspaceState>(
    () => ({
      planSlug,
      enabledFeatures,
      planLimits,
      isPlatformAdmin: accessCtx.isPlatformAdmin,
      organizationId,
      organizationName,
      organizationStatus,
      loading: authLoading || loading,
      error,
      navRoutes,
      canAccessPath,
      refresh: load,
    }),
    [
      planSlug,
      enabledFeatures,
      planLimits,
      accessCtx.isPlatformAdmin,
      organizationId,
      organizationName,
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
