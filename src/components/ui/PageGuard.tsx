"use client";

import { usePermissions, Permission } from "@/contexts/PermissionsContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff } from "lucide-react";

interface PageGuardProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function PageGuard({ permission, children }: PageGuardProps) {
  const { hasPermission, userRole } = usePermissions();

  if (userRole === "super_admin" || hasPermission(permission)) {
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
