import {
  isProductionReadyForClientTarget,
  resolveProductionReadinessPolicy,
} from "../productionReadinessPolicy";

export function assertProductionReadinessPolicy(): boolean {
  const incomplete = resolveProductionReadinessPolicy({
    tenantIsolationVerified: true,
    scopedDataVerified: true,
    fakeDataBlocked: true,
    rlsRequired: true,
    realtimeDisabled: true,
    mediaDisabled: true,
    packageGovernanceReady: true,
    observabilityReady: false,
    capacityTargetClients: 1000,
  });

  const unsafeMedia = resolveProductionReadinessPolicy({
    tenantIsolationVerified: true,
    scopedDataVerified: true,
    fakeDataBlocked: true,
    rlsRequired: true,
    realtimeDisabled: true,
    mediaDisabled: false,
    packageGovernanceReady: true,
    observabilityReady: true,
    capacityTargetClients: 1000,
  });

  const ready = resolveProductionReadinessPolicy({
    tenantIsolationVerified: true,
    scopedDataVerified: true,
    fakeDataBlocked: true,
    rlsRequired: true,
    realtimeDisabled: true,
    mediaDisabled: true,
    packageGovernanceReady: true,
    observabilityReady: true,
    capacityTargetClients: 1000,
  });

  return (
    incomplete.status === "fail" &&
    incomplete.failedCount === 1 &&
    unsafeMedia.status === "fail" &&
    unsafeMedia.checks.some((entry) => entry.key === "media_disabled" && entry.status === "fail") &&
    ready.status === "pass" &&
    ready.score === 100 &&
    ready.targetClients === 1000 &&
    isProductionReadyForClientTarget({
      tenantIsolationVerified: true,
      scopedDataVerified: true,
      fakeDataBlocked: true,
      rlsRequired: true,
      realtimeDisabled: true,
      mediaDisabled: true,
      packageGovernanceReady: true,
      observabilityReady: true,
      capacityTargetClients: 1000,
    }) === true
  );
}
