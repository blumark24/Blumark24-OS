import {
  SHARED_OFFICE_INTERIOR_ASSET_SRC,
  buildOfficeInteriorProfile,
  canOpenOfficeInterior,
  getOfficeInteriorAssetSrc,
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
    hasInteriorAsset: false,
    linkedEmployeeCount: 3,
  });

  const readyWorkspace = buildOfficeInteriorProfile({
    officeNumber: 2,
    officeName: "التشغيل",
    linkedEmployeeCount: 4,
  });

  const boardroom = buildOfficeInteriorProfile({
    officeNumber: 5,
    isBoard: true,
  });

  return (
    unassigned.status === "locked" &&
    unassigned.canOpenInterior === false &&
    unassigned.preservesExteriorMapping === true &&
    pendingWorkspace.status === "pending_asset" &&
    pendingWorkspace.assetKey === "office-01-interior" &&
    pendingWorkspace.assetSrc === null &&
    pendingWorkspace.canOpenInterior === false &&
    readyWorkspace.status === "ready" &&
    readyWorkspace.assetSrc === SHARED_OFFICE_INTERIOR_ASSET_SRC &&
    readyWorkspace.canOpenInterior === true &&
    readyWorkspace.officeLabel.includes("OFFICE 02") &&
    boardroom.kind === "boardroom" &&
    boardroom.status === "ready" &&
    boardroom.assetKey === "office-05-interior" &&
    boardroom.actionLabel === "فتح مجلس الإدارة" &&
    getOfficeInteriorAssetSrc(5) === SHARED_OFFICE_INTERIOR_ASSET_SRC &&
    canOpenOfficeInterior({ officeNumber: 3 }) === true &&
    canOpenOfficeInterior({ officeNumber: 4, hasInteriorAsset: false }) === false
  );
}
