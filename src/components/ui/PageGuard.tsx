"use client";

import { usePathname } from "next/navigation";
import {
  usePermissions,
  Permission,
  mapAuthRoleToUserRole,
} from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  canAccessWorkspaceRoute,
  getRouteByPathname,
  satisfiesPermission,
} from "@/lib/features/packageFeatures";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface PageGuardProps {
  /** Single required permission (ignored if anyPermission is set). */
  permission?: Permission;
  /** Grant access when the user has any of these permissions. */
  anyPermission?: Permission[];
  children: React.ReactNode;
}

export default function PageGuard({ permission, anyPermission, children }: PageGuardProps) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const { loading, user } = useAuth();
  const { loading: wsLoading, isInternal, planSlug, isPlatformAdmin } =
    useTenantWorkspace();

  if (loading || wsLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  const resolvedRole = mapAuthRoleToUserRole(user.role);
  const platformAdmin =
    isPlatformAdmin || resolvedRole === "super_admin";

  const requiredPerms = anyPermission?.length
    ? anyPermission
    : permission
      ? [permission]
      : [];

  const checkPerm = (perm: Permission) =>
    platformAdmin || satisfiesPermission(perm, hasPermission);

  const hasPerm =
    platformAdmin ||
    requiredPerms.some((perm) => checkPerm(perm));

  const route = getRouteByPathname(pathname ?? "");
  const workspaceOk =
    !route ||
    canAccessWorkspaceRoute(
      route,
      {
        isInternal,
        planSlug,
        isPlatformAdmin: platformAdmin,
      },
      checkPerm,
    );

  if (hasPerm && workspaceOk) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-heading font-bold">لا تملك صلاحية الوصول</h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs">
          هذا القسم محجوز أو غير مفعّل ضمن باقة منشأتك. تواصل مع مدير المنشأة أو Blumark24.
        </p>
      </div>
    </DashboardLayout>
  );
}
