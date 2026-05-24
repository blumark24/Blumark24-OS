"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Network, Sparkles } from "lucide-react";
import {
  canManageTenantOrgStructure,
  mapAuthRoleToUserRole,
  usePermissions,
} from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { supabase } from "@/lib/supabase";
import { PLAN_LABELS_AR } from "@/lib/features/packageFeatures";
import { PageHero } from "@/components/ui/workspaceUi";
import { WS_PAGE } from "@/components/ui/workspaceVisual";
import PageGuard from "@/components/ui/PageGuard";
import TenantOrgWorkspace from "@/components/org/TenantOrgWorkspace";
import InternalBlumarkOrgView from "@/components/org/InternalBlumarkOrgView";

function CustomerOrgPage() {
  const { user } = useAuth();
  const { userRole, hasPermission } = usePermissions();
  const { planSlug, organizationId } = useTenantWorkspace();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const canManageStructure = canManageTenantOrgStructure(effectiveRole, hasPermission);

  return (
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
  );
}

export default function OrgPage() {
  const [isInternalOrg, setIsInternalOrg] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .rpc("current_org_is_internal")
      .then(({ data, error }) => {
        if (!active) return;
        setIsInternalOrg(error ? false : data === true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isInternalOrg === null) {
    return (
      <DashboardLayout>
        <div className="glass-card p-10 text-center text-[#8ba3c7] text-sm max-w-lg mx-auto flex flex-col items-center gap-3">
          <Network size={28} className="text-[#22d3ee] animate-pulse" />
          جارٍ تحميل الهيكل الإداري...
        </div>
      </DashboardLayout>
    );
  }

  if (!isInternalOrg) {
    return (
      <PageGuard permission="view_dashboard">
        <CustomerOrgPage />
      </PageGuard>
    );
  }
  return <InternalBlumarkOrgView />;
}
