import {
  buildOfficeInteriorProfile,
  canOpenOfficeInterior,
} from "../officeInteriorProfile";

export function assertOfficeInteriorProfile(): boolean {
  const unassigned = buildOfficeInteriorProfile({
    officeNumber: 9,
    isUnassigned: true,
    hasInteriorAsset: true,
  });

  const pendingWorkspace = buildOfficeInteriorProfile({
    officeNumber: 1,
    officeName: "المبيعات",
    linkedEmployeeCount: 3,
  });

  const readyWorkspace = buildOfficeInteriorProfile({
    officeNumber: 2,
    officeName: "التشغيل",
    hasInteriorAsset: true,
    linkedEmployeeCount: 4,
  });

  const boardroom = buildOfficeInteriorProfile({
    officeNumber: 5,
    isBoard: true,
    hasInteriorAsset: true,
  });

  return (
    unassigned.status === "locked" &&
    unassigned.canOpenInterior === false &&
    unassigned.preservesExteriorMapping === true &&
    pendingWorkspace.status === "pending_asset" &&
    pendingWorkspace.assetKey === "office-01-interior" &&
    pendingWorkspace.canOpenInterior === false &&
    readyWorkspace.status === "ready" &&
    readyWorkspace.canOpenInterior === true &&
    readyWorkspace.officeLabel.includes("OFFICE 02") &&
    boardroom.kind === "boardroom" &&
    boardroom.status === "ready" &&
    boardroom.actionLabel === "فتح مجلس الإدارة" &&
    canOpenOfficeInterior({ officeNumber: 3, hasInteriorAsset: true }) === true &&
    canOpenOfficeInterior({ officeNumber: 4, hasInteriorAsset: false }) === false
  );
}
