"use client";

import { usePermissions, Permission, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface PageGuardProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function PageGuard({ permission, children }: PageGuardProps) {
  const { rolePermissions } = usePermissions();
  const { loading, user } = useAuth();

  // While auth is resolving render the dashboard chrome (sidebar + header)
  // with a per-page skeleton instead of a blank full-viewport spinner.
  // The chrome is cheap to render and shows the user the app is alive.
  // We must NOT render protected children before the real role is known,
  // and we must NOT show the access-denied screen before we know the user
  // lacks access — both would be wrong (security / UX respectively).
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  // Derive role directly from AuthContext.user rather than PermissionsContext
  // state.  PermissionsContext updates userRole in a useEffect that fires one
  // render after user.role becomes available, so using it here would cause a
  // brief access-denied flash for super_admin on hard refresh.
  const resolvedRole = user ? mapAuthRoleToUserRole(user.role) : "employee";
  const hasPerm =
    resolvedRole === "super_admin" ||
    (rolePermissions[resolvedRole] ?? []).includes(permission);

  if (hasPerm) {
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
          هذا القسم محجوز. تواصل مع المدير الأعلى للحصول على الصلاحية.
        </p>
      </div>
    </DashboardLayout>
  );
}
