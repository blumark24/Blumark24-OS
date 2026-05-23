"use client";

import SmartOrgBuilder from "./SmartOrgBuilder";

/** Tenant package-aware org builder (PR #159 premium spec). */
export default function TenantOrgWorkspace({
  canManage,
  orgLabel = "منشأتك",
}: {
  canManage: boolean;
  orgLabel?: string;
}) {
  return <SmartOrgBuilder canManage={canManage} orgLabel={orgLabel} />;
}
