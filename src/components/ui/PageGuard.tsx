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
  planIncludesFeature,
  satisfiesPermission,
} from "@/lib/features/packageFeatures";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff, ArrowUpCircle } from "lucide-react";
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
        isInternal,
        planSlug,
        isPlatformAdmin: platformAdmin,
      },
      (perm) =>
        roleHasPermission(resolvedRole, rolePermissions, perm, platformAdmin),
    );

  if (hasPerm && workspaceOk) {
    return <>{children}</>;
  }

  // Distinguish WHY access is blocked so the copy is actionable (P0-7):
  //   • Package lock  → the customer's plan does not include this module.
  //   • Permission lock → the role lacks the permission inside the same tenant.
  const packageLocked =
    !platformAdmin &&
    !isInternal &&
    !!route?.feature &&
    !planIncludesFeature(planSlug, route.feature);

  if (packageLocked) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <ArrowUpCircle size={28} className="text-amber-400" />
          </div>
          <h2 className="text-white text-xl font-heading font-bold">غير متاح في باقتك الحالية</h2>
          <p className="text-[#8ba3c7] text-sm max-w-xs">
            هذا القسم غير متاح ضمن باقتك الحالية.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium">
            <ArrowUpCircle size={16} />
            ترقية الباقة — تواصل مع Blumark24
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-heading font-bold">لا تملك صلاحية الوصول</h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs">
          تواصل مع مدير المنشأة للحصول على الصلاحية.
        </p>
      </div>
    </DashboardLayout>
  );
}
