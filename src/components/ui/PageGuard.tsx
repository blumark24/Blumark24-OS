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
  permission: Permission;
  children: React.ReactNode;
}

function roleHasPermission(
  resolvedRole: ReturnType<typeof mapAuthRoleToUserRole>,
  rolePermissions: Record<string, Permission[]>,
  perm: Permission,
  isPlatformAdmin: boolean,
): boolean {
  if (isPlatformAdmin || resolvedRole === "super_admin") return true;
  const perms = rolePermissions[resolvedRole] ?? [];
  return satisfiesPermission(perm, (p) => perms.includes(p));
}

export default function PageGuard({ permission, children }: PageGuardProps) {
  const pathname = usePathname();
  const { rolePermissions } = usePermissions();
  const { loading, user } = useAuth();
  const { loading: wsLoading, enabledFeatures, planSlug, isPlatformAdmin } =
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

  const hasPerm = roleHasPermission(
    resolvedRole,
    rolePermissions,
    permission,
    platformAdmin,
  );

  const route = getRouteByPathname(pathname ?? "");
  const workspaceOk =
    !route ||
    canAccessWorkspaceRoute(
      route,
      {
        enabledFeatures,
        planSlug,
        isPlatformAdmin: platformAdmin,
      },
      (perm) =>
        roleHasPermission(resolvedRole, rolePermissions, perm, platformAdmin),
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
          هذا القسم غير مفعّل ضمن باقة منشأتك. تواصل مع مدير المنشأة لترقية الباقة.
        </p>
      </div>
    </DashboardLayout>
  );
}
