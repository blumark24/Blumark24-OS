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
  /** Render guard fallbacks without the dashboard shell for immersive pages. */
  immersive?: boolean;
  children: React.ReactNode;
}

export default function PageGuard({ permission, anyPermission, immersive = false, children }: PageGuardProps) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const { loading, user } = useAuth();
  const { loading: wsLoading, enabledFeatures, planSlug, isPlatformAdmin } =
    useTenantWorkspace();

  if (loading || wsLoading || !user) {
    if (immersive) {
      return (
        <div className="min-h-screen bg-[#03050a] text-white flex items-center justify-center p-6" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-xl font-black text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,.25)]">
              B
            </div>
            <div className="space-y-3">
              <CardSkeleton rows={3} />
              <CardSkeleton rows={3} />
            </div>
          </div>
        </div>
      );
    }

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
        enabledFeatures,
        planSlug,
        isPlatformAdmin: platformAdmin,
      },
      checkPerm,
    );

  if (hasPerm && workspaceOk) {
    return <>{children}</>;
  }

  if (immersive) {
    return (
      <div className="min-h-screen bg-[#03050a] text-white flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <ShieldOff size={28} className="text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-white">لا تملك صلاحية الوصول</h2>
          <p className="mt-3 text-sm leading-6 text-red-100/80">
            هذا القسم غير مفعل ضمن باقة منشأتك. تواصل مع مدير المنشأة لترقية الباقة.
          </p>
        </div>
      </div>
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
          هذا القسم غير مفعّل ضمن باقة منشأتك. تواصل مع مدير المنشأة لترقية الباقة.
        </p>
      </div>
    </DashboardLayout>
  );
}
