"use client";

import { usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getRouteByPathname } from "@/lib/features/packageFeatures";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface WorkspaceRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Blocks deep links to internal-only or package-disabled routes before page content.
 */
export default function WorkspaceRouteGuard({ children }: WorkspaceRouteGuardProps) {
  const pathname = usePathname();
  const { loading: authLoading, user } = useAuth();
  const { loading: wsLoading, canAccessPath } = useTenantWorkspace();

  const route = getRouteByPathname(pathname ?? "");

  if (authLoading || wsLoading || !user) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={4} />
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
