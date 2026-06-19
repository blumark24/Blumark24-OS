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
import { usePathname } from "next/navigation";
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
import {
  isCustomerWorkspacePath,
  isPlatformSuperAdminRole,
} from "@/lib/tenant/customerWorkspaceRoutes";

export interface TenantWorkspaceState {
  planSlug: PlanSlug;
  enabledFeatures: WorkspaceFeature[];
  planLimits: Record<string, number>;
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
  planSlug: "basic",
  enabledFeatures: [],
  planLimits: {},
  isPlatformAdmin: false,
  organizationId: null,
  organizationStatus: null,
  loading: true,
  error: null,
  navRoutes: [],
  canAccessPath: () => false,
  refresh: async () => {},
};

const WORKSPACE_CONTEXT_REFRESH_KEY = "blumark_workspace_context_refresh";
const WORKSPACE_CONTEXT_REFRESH_EVENT = "blumark:workspace-context-refresh";
const WORKSPACE_CONTEXT_REFRESH_CHANNEL = "blumark:workspace-plan-events";

const TenantWorkspaceContext = createContext<TenantWorkspaceState>(defaultState);

export function TenantWorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, userRole } = usePermissions();
  const resolvedRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);

  const [planSlug, setPlanSlug] = useState<PlanSlug>("basic");
  const [enabledFeatures, setEnabledFeatures] = useState<WorkspaceFeature[]>([]);
  const [planLimits, setPlanLimits] = useState<Record<string, number>>({});
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (isPlatformSuperAdminRole(user.role)) {
      setLoading(false);
      setError(null);
      setIsPlatformAdmin(true);
      setOrganizationId(user.organizationId ?? null);
      setEnabledFeatures([]);
      setPlanSlug("basic");
      return;
    }

    if (!user.organizationId) {
      setLoading(false);
      setError(null);
      setIsPlatformAdmin(false);
      setOrganizationId(null);
      setEnabledFeatures([]);
      setPlanSlug("basic");
      return;
    }

    if (!silent) setLoading(true);
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

      const res = await fetch(`/api/tenant/workspace-context?ts=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
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
      if (!silent) setLoading(false);
    }
  }, [user?.id, user?.role, user?.organizationId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setPlanSlug("basic");
      setEnabledFeatures([]);
      setPlanLimits({});
      setIsPlatformAdmin(false);
      setOrganizationId(null);
      setOrganizationStatus(null);
      return;
    }
    if (
      isPlatformSuperAdminRole(user.role) &&
      isCustomerWorkspacePath(pathname ?? "")
    ) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user?.id, user?.role, user?.organizationId, pathname, load]);

  // Refresh package context for every open customer tab after owner-side plan changes.
  // No interval: storage + BroadcastChannel + focus/pageshow/visibility fallbacks.
  useEffect(() => {
    if (authLoading || !user?.id || !user.organizationId || isPlatformSuperAdminRole(user.role)) {
      return;
    }
    if (typeof window === "undefined") return;

    const refreshWorkspace = () => {
      void load({ silent: true });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WORKSPACE_CONTEXT_REFRESH_KEY) refreshWorkspace();
    };

    const handleBroadcast = () => refreshWorkspace();

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(WORKSPACE_CONTEXT_REFRESH_CHANNEL);
      channel.addEventListener("message", handleBroadcast);
    } catch {
      channel = null;
    }

    window.addEventListener("focus", refreshWorkspace);
    window.addEventListener("pageshow", refreshWorkspace);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(WORKSPACE_CONTEXT_REFRESH_EVENT, refreshWorkspace);
    document.addEventListener("visibilitychange", refreshWorkspace);

    return () => {
      window.removeEventListener("focus", refreshWorkspace);
      window.removeEventListener("pageshow", refreshWorkspace);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(WORKSPACE_CONTEXT_REFRESH_EVENT, refreshWorkspace);
      document.removeEventListener("visibilitychange", refreshWorkspace);
      if (channel) {
        channel.removeEventListener("message", handleBroadcast);
        channel.close();
      }
    };
  }, [authLoading, user?.id, user?.organizationId, user?.role, load]);

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
    if (isPlatformSuperAdminRole(user.role)) return [];
    return filterNavRoutes(accessCtx, checkPermission);
  }, [authLoading, user?.id, user?.role, resolvedRole, accessCtx, checkPermission]);

  const canAccessPath = useCallback(
    (pathname: string) => {
      if (user && isPlatformSuperAdminRole(user.role)) return false;
      const route = getRouteByPathname(pathname);
      if (!route) return true;
      if (!resolvedRole && !accessCtx.isPlatformAdmin) return false;
      return canAccessWorkspaceRoute(route, accessCtx, checkPermission);
    },
    [user, resolvedRole, accessCtx, checkPermission],
  );

  const value = useMemo<TenantWorkspaceState>(
    () => ({
      planSlug,
      enabledFeatures,
      planLimits,
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
      planSlug,
      enabledFeatures,
      planLimits,
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
