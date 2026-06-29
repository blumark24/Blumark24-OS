import {
  getOfficeInteriorImageSrc,
  getOfficeInteriorProfile,
  hasDistinctOfficeInteriorImages,
  officeInteriorProfiles,
  type OfficeInteriorAssetId,
} from "../officeInteriorProfile";

const EXPECTED_INTERIOR_ASSETS: Record<number, { assetId: OfficeInteriorAssetId; imageSrc: string }> = {
  1: {
    assetId: "office-01-executive-interior",
    imageSrc: "/virtual-office/interiors/office-01-executive-interior.webp",
  },
  2: {
    assetId: "office-02-open-workspace-interior",
    imageSrc: "/virtual-office/interiors/office-02-open-workspace-interior.webp",
  },
  3: {
    assetId: "office-03-analytics-interior",
    imageSrc: "/virtual-office/interiors/office-03-analytics-interior.webp",
  },
  4: {
    assetId: "office-04-design-studio-interior",
    imageSrc: "/virtual-office/interiors/office-04-design-studio-interior.webp",
  },
  5: {
    assetId: "office-05-board-room-interior",
    imageSrc: "/virtual-office/interiors/office-05-board-room-interior.webp",
  },
  6: {
    assetId: "office-06-marketing-interior",
    imageSrc: "/virtual-office/interiors/office-06-marketing-interior.webp",
  },
  7: {
    assetId: "office-07-data-office-interior",
    imageSrc: "/virtual-office/interiors/office-07-data-office-interior.webp",
  },
  8: {
    assetId: "office-08-operations-interior",
    imageSrc: "/virtual-office/interiors/office-08-operations-interior.webp",
  },
  9: {
    assetId: "office-09-command-center-interior",
    imageSrc: "/virtual-office/interiors/office-09-command-center-interior.webp",
  },
};

export function assertOfficeInteriorProfile(): boolean {
  const officeNumbers = Object.keys(EXPECTED_INTERIOR_ASSETS).map(Number);
  const actualImageSources = officeNumbers.map((officeNumber) => getOfficeInteriorImageSrc(officeNumber));

  return (
    officeNumbers.length === 9 &&
    Object.keys(officeInteriorProfiles).length === 9 &&
    hasDistinctOfficeInteriorImages() === true &&
    new Set(actualImageSources).size === 9 &&
    officeNumbers.every((officeNumber) => {
      const expected = EXPECTED_INTERIOR_ASSETS[officeNumber];
      const profile = getOfficeInteriorProfile(officeNumber);

      return (
        profile !== null &&
        profile.officeNumber === officeNumber &&
        profile.assetId === expected.assetId &&
        profile.imageSrc === expected.imageSrc &&
        getOfficeInteriorImageSrc(officeNumber) === expected.imageSrc &&
        expected.imageSrc.startsWith("/virtual-office/interiors/") &&
        expected.imageSrc.endsWith(".webp")
      );
    }) &&
    getOfficeInteriorProfile(5)?.nameEn === "Board Room" &&
    getOfficeInteriorProfile(5)?.assetId === "office-05-board-room-interior" &&
    getOfficeInteriorImageSrc(null) === null
  );
}
