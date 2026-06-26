import { buildTenantPresencePlan, canPlanTenantPresenceChannel } from "../tenantPresencePlan";

export function assertTenantPresencePlan(): boolean {
  const blocked = buildTenantPresencePlan({
    tenantId: "tenant-a",
    officeNumber: 5,
    userId: "user-1",
  });

  const planned = buildTenantPresencePlan({
    tenantId: "Tenant A",
    officeNumber: 5,
    userId: "User 1",
    displayName: "جبريل",
    roleOrUnit: "الإدارة",
    status: "away",
    consentGranted: true,
    serverValidated: true,
    rlsReady: true,
    timeoutSeconds: 45,
  });

  const invalidScope = buildTenantPresencePlan({
    tenantId: "tenant-a",
    officeNumber: 0,
    userId: "user-1",
    consentGranted: true,
    serverValidated: true,
    rlsReady: true,
  });

  return (
    blocked.status === "blocked" &&
    blocked.canCreateRealtimeChannel === false &&
    blocked.blockedReasons.includes("consent_required") &&
    blocked.blockedReasons.includes("server_validation_required") &&
    blocked.blockedReasons.includes("rls_required") &&
    planned.status === "planned" &&
    planned.canCreateRealtimeChannel === true &&
    planned.channelName === "tenant:tenant-a:office:05:presence" &&
    planned.scopeKey === "tenant-a/office-05" &&
    planned.timeoutSeconds === 60 &&
    planned.payloadShape?.tenantId === "tenant-a" &&
    planned.payloadShape?.officeNumber === 5 &&
    planned.payloadShape?.userId === "user-1" &&
    planned.payloadShape?.manual === true &&
    planned.payloadShape?.consentGranted === true &&
    invalidScope.status === "blocked" &&
    invalidScope.channelName === null &&
    invalidScope.blockedReasons.includes("office_required") &&
    canPlanTenantPresenceChannel({
      tenantId: "tenant-b",
      officeNumber: 1,
      userId: "user-2",
      consentGranted: true,
      serverValidated: true,
      rlsReady: true,
    }) === true &&
    canPlanTenantPresenceChannel({ tenantId: "tenant-b", officeNumber: 1 }) === false
  );
}
