"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Network } from "lucide-react";
import {
  canManageTenantOrgStructure,
  mapAuthRoleToUserRole,
  usePermissions,
} from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import TenantOrgWorkspace from "@/components/org/TenantOrgWorkspace";
import InternalBlumarkOrgView from "@/components/org/InternalBlumarkOrgView";

function CustomerOrgPage() {
  const { user } = useAuth();
  const { userRole, hasPermission } = usePermissions();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const canManageStructure = canManageTenantOrgStructure(effectiveRole, hasPermission);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Network size={24} className="text-[#22d3ee]" />
            الهيكل الإداري
          </h1>
          <p className="text-[#8ba3c7] text-sm mt-1">المخطط التنظيمي للمنشأة</p>
        </div>
        <TenantOrgWorkspace canManage={canManageStructure} orgLabel="منشأتك" />
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
        <div className="glass-card p-10 text-center text-[#8ba3c7] text-sm max-w-lg mx-auto">
          جارٍ تحميل الهيكل الإداري...
        </div>
      </DashboardLayout>
    );
  }

  if (!isInternalOrg) return <CustomerOrgPage />;
  return <InternalBlumarkOrgView />;
}
