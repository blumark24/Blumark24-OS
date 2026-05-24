"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Sparkles } from "lucide-react";
import {
  canManageTenantOrgStructure,
  mapAuthRoleToUserRole,
  usePermissions,
} from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { PLAN_LABELS_AR } from "@/lib/features/packageFeatures";
import { PageHero } from "@/components/ui/workspaceUi";
import { WS_PAGE } from "@/components/ui/workspaceVisual";
import PageGuard from "@/components/ui/PageGuard";
import TenantOrgWorkspace from "@/components/org/TenantOrgWorkspace";

export default function OrgPage() {
  const { user } = useAuth();
  const { userRole, hasPermission } = usePermissions();
  const { planSlug, organizationId } = useTenantWorkspace();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const canManageStructure = canManageTenantOrgStructure(effectiveRole, hasPermission);

  return (
    <PageGuard permission="view_dashboard">
      <DashboardLayout>
        <div className={WS_PAGE}>
          <PageHero
            title="الهيكل الإداري"
            subtitle={`مخطط تشغيلي ذكي لمنشأتك · باقة ${PLAN_LABELS_AR[planSlug]}${
              organizationId ? "" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-[#22d3ee] text-xs border border-[#22d3ee]/30 rounded-full px-3 py-1.5 bg-[#22d3ee]/10">
              <Sparkles size={14} />
              <span>هيكل رقمي معزول</span>
            </div>
          </PageHero>
          <TenantOrgWorkspace
            canManage={canManageStructure}
            orgLabel="منشأتك"
          />
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
