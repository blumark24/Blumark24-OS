import {
  canUseOwnerGovernance,
  resolveOwnerGovernancePolicy,
} from "../ownerGovernancePolicy";

export function assertOwnerGovernancePolicy(): boolean {
  const startOwner = resolveOwnerGovernancePolicy({
    packageTier: "start",
    role: "owner",
    officeCount: 9,
    linkedOfficeCount: 2,
  });

  const advancedOwner = resolveOwnerGovernancePolicy({
    packageTier: "advanced",
    role: "owner",
    officeCount: 9,
    linkedOfficeCount: 7,
  });

  const enterpriseOwner = resolveOwnerGovernancePolicy({
    packageTier: "enterprise",
    role: "owner",
    officeCount: 9,
    linkedOfficeCount: 9,
  });

  const employee = resolveOwnerGovernancePolicy({
    packageTier: "enterprise",
    role: "employee",
  });

  return (
    startOwner.capabilities.some((entry) => entry.key === "meeting_rooms" && entry.status === "locked") &&
    startOwner.capabilities.some((entry) => entry.key === "owner_controls" && entry.status === "enabled") &&
    advancedOwner.capabilities.some((entry) => entry.key === "meeting_rooms" && entry.status === "enabled") &&
    advancedOwner.capabilities.some((entry) => entry.key === "reports" && entry.status === "enabled") &&
    enterpriseOwner.capabilities.some((entry) => entry.key === "tenant_branding" && entry.status === "enabled") &&
    employee.capabilities.some((entry) => entry.key === "owner_controls" && entry.status === "locked") &&
    canUseOwnerGovernance({ packageTier: "advanced", role: "owner" }) === true &&
    canUseOwnerGovernance({ packageTier: "advanced", role: "manager" }) === false
  );
}
