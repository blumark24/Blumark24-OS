"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  canManageTenantOrgStructure,
  mapAuthRoleToUserRole,
  usePermissions,
} from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { supabase } from "@/lib/supabase";
import SmartOrgBuilder from "@/components/org/SmartOrgBuilder";
import InternalBlumarkOrgView from "@/components/org/InternalBlumarkOrgView";

function CustomerOrgPage() {
  const { user } = useAuth();
  const { userRole, hasPermission } = usePermissions();
  const { organizationId } = useTenantWorkspace();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const canManageStructure = canManageTenantOrgStructure(effectiveRole, hasPermission);
  const orgLabel = organizationId ? "منشأتك" : "منشأتك";

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto w-full px-1 sm:px-0">
        <SmartOrgBuilder canManage={canManageStructure} orgLabel={orgLabel} />
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
