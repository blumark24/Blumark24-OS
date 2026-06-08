"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, ShieldOff, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getRouteByPathname } from "@/lib/features/packageFeatures";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  isCustomerWorkspacePath,
  isPlatformSuperAdminRole,
  MISSING_ORGANIZATION_ERROR_MSG,
} from "@/lib/tenant/customerWorkspaceRoutes";

interface WorkspaceRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Blocks deep links to internal-only or package-disabled routes before page content.
 * Also blocks workspace access entirely for users whose profile is deactivated
 * (is_active = false), without affecting their data or auth account.
 */
export default function WorkspaceRouteGuard({ children }: WorkspaceRouteGuardProps) {
  const pathname = usePathname();
  const { loading: authLoading, user, profileLoadError, refreshCurrentUser } = useAuth();
  const { loading: wsLoading, canAccessPath } = useTenantWorkspace();

  const route = getRouteByPathname(pathname ?? "");
  const onCustomerWorkspace = isCustomerWorkspacePath(pathname ?? "");

  // Re-validate is_active on every navigation so deactivation takes effect at
  // the next page transition rather than waiting for the JWT to expire (~1 hr).
  // refreshCurrentUser() does NOT flip authLoading, so no spinner on nav.
  useEffect(() => {
    if (authLoading || !user) return;
    void refreshCurrentUser();
    // Intentionally triggered only on pathname change — not on every dep update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (onCustomerWorkspace && user && isPlatformSuperAdminRole(user.role)) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={3} />
      </div>
    );
  }

  if (
    onCustomerWorkspace &&
    user &&
    !isPlatformSuperAdminRole(user.role) &&
    !user.organizationId
  ) {
    const msg = profileLoadError ?? MISSING_ORGANIZATION_ERROR_MSG;
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-3 px-4">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-red-300 text-sm max-w-md">{msg}</p>
      </div>
    );
  }

  if (authLoading || wsLoading || !user) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={4} />
      </div>
    );
  }

  // Inactive account guard — blocks all customer workspace pages before any
  // tenant data is fetched or rendered. The user's auth account, profile, and
  // employee record are untouched; this is a UI-layer enforcement of
  // profiles.is_active = false set by "حذف من الفريق".
  // Does NOT affect organization_manager viewing other employees (that is the
  // manager's own is_active, not the employee they're looking at).
  if (onCustomerWorkspace && user.is_active === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <UserX size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-heading font-bold">
          الحساب معطّل
        </h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs leading-relaxed">
          تم تعطيل حسابك داخل هذه المنشأة. يرجى التواصل مع مدير المنشأة.
        </p>
      </div>
    );
  }

  if (route && !canAccessPath(pathname ?? "")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-heading font-bold">
          لا تملك صلاحية الوصول
        </h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs">
          هذا القسم غير متاح لمنشأتك أو باقة الاشتراك الحالية.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

