import {
  buildOfficeArtifactSummary,
  firstReadyOfficeArtifact,
} from "../officeArtifactSummary";

export function assertOfficeArtifactSummary(): boolean {
  const unassigned = buildOfficeArtifactSummary({
    officeNumber: 9,
    isUnassigned: true,
  });

  const active = buildOfficeArtifactSummary({
    officeNumber: 1,
    officeName: "المبيعات",
    employeeCount: 3,
    openTaskCount: 4,
    overdueTaskCount: 1,
    linkedFileCount: 2,
    canViewFiles: true,
    canViewReports: true,
  });

  const restricted = buildOfficeArtifactSummary({
    officeNumber: 2,
    employeeCount: 1,
    openTaskCount: 0,
    overdueTaskCount: 0,
    linkedFileCount: 0,
    canViewFiles: false,
    canViewReports: false,
  });

  const firstReady = firstReadyOfficeArtifact({
    officeNumber: 3,
    employeeCount: 2,
    openTaskCount: 1,
    linkedFileCount: 0,
    canViewFiles: true,
    canViewReports: true,
  });

  return (
    unassigned.items.every((entry) => entry.state === "unlinked") &&
    active.readyCount >= 4 &&
    active.items.some((entry) => entry.kind === "files" && entry.state === "ready") &&
    active.items.some((entry) => entry.kind === "report" && entry.state === "ready") &&
    restricted.items.some((entry) => entry.kind === "files" && entry.state === "restricted") &&
    restricted.items.some((entry) => entry.kind === "report" && entry.state === "restricted") &&
    firstReady !== null &&
    firstReady.state === "ready"
  );
}
