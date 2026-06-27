export type OfficeInteriorAssetId =
  | "office-01-executive-interior"
  | "office-02-open-workspace-interior"
  | "office-03-analytics-interior"
  | "office-04-design-studio-interior"
  | "office-05-board-room-interior"
  | "office-06-marketing-interior"
  | "office-07-data-office-interior"
  | "office-08-operations-interior"
  | "office-09-command-center-interior";

export interface OfficeInteriorProfile {
  officeNumber: number;
  assetId: OfficeInteriorAssetId;
  nameAr: string;
  nameEn: string;
  functionAr: string;
  accent: string;
  imageSrc: string | null;
  fallbackMapCrop: {
    objectPosition: string;
    scale: number;
  };
}

const OFFICE_INTERIOR_PROFILES: Record<number, OfficeInteriorProfile> = {
  1: {
    officeNumber: 1,
    assetId: "office-01-executive-interior",
    nameAr: "المكتب التنفيذي",
    nameEn: "Executive Office",
    functionAr: "إدارة عليا",
    accent: "#22d3ee",
    imageSrc: "/virtual-office/interiors/office-01-executive-interior.webp",
    fallbackMapCrop: { objectPosition: "86% 14%", scale: 1.7 },
  },
  2: {
    officeNumber: 2,
    assetId: "office-02-open-workspace-interior",
    nameAr: "مساحة العمل المفتوحة",
    nameEn: "Open Workspace",
    functionAr: "تشغيل فرق",
    accent: "#38bdf8",
    imageSrc: "/virtual-office/interiors/office-02-open-workspace-interior.webp",
    fallbackMapCrop: { objectPosition: "50% 13%", scale: 1.65 },
  },
  3: {
    officeNumber: 3,
    assetId: "office-03-analytics-interior",
    nameAr: "مكتب التحليلات",
    nameEn: "Analytics Office",
    functionAr: "قراءة الأداء",
    accent: "#67e8f9",
    imageSrc: "/virtual-office/interiors/office-03-analytics-interior.webp",
    fallbackMapCrop: { objectPosition: "15% 16%", scale: 1.65 },
  },
  4: {
    officeNumber: 4,
    assetId: "office-04-design-studio-interior",
    nameAr: "استوديو التصميم",
    nameEn: "Design Studio",
    functionAr: "تجربة وهوية",
    accent: "#60a5fa",
    imageSrc: "/virtual-office/interiors/office-04-design-studio-interior.webp",
    fallbackMapCrop: { objectPosition: "84% 49%", scale: 1.7 },
  },
  5: {
    officeNumber: 5,
    assetId: "office-05-board-room-interior",
    nameAr: "مجلس الإدارة",
    nameEn: "Board Room",
    functionAr: "مركز قرار",
    accent: "#a855f7",
    imageSrc: "/virtual-office/interiors/office-05-board-room-interior.webp",
    fallbackMapCrop: { objectPosition: "50% 50%", scale: 1.55 },
  },
  6: {
    officeNumber: 6,
    assetId: "office-06-marketing-interior",
    nameAr: "مكتب التسويق",
    nameEn: "Marketing Office",
    functionAr: "نمو وتسويق",
    accent: "#f472b6",
    imageSrc: "/virtual-office/interiors/office-06-marketing-interior.webp",
    fallbackMapCrop: { objectPosition: "16% 50%", scale: 1.7 },
  },
  7: {
    officeNumber: 7,
    assetId: "office-07-data-office-interior",
    nameAr: "مكتب البيانات",
    nameEn: "Data Office",
    functionAr: "بيانات وتقارير",
    accent: "#10b981",
    imageSrc: "/virtual-office/interiors/office-07-data-office-interior.webp",
    fallbackMapCrop: { objectPosition: "84% 84%", scale: 1.75 },
  },
  8: {
    officeNumber: 8,
    assetId: "office-08-operations-interior",
    nameAr: "مكتب العمليات",
    nameEn: "Operations Office",
    functionAr: "تنفيذ يومي",
    accent: "#f59e0b",
    imageSrc: "/virtual-office/interiors/office-08-operations-interior.webp",
    fallbackMapCrop: { objectPosition: "50% 84%", scale: 1.65 },
  },
  9: {
    officeNumber: 9,
    assetId: "office-09-command-center-interior",
    nameAr: "مركز القيادة",
    nameEn: "Command Center",
    functionAr: "قيادة وتحكم",
    accent: "#22d3ee",
    imageSrc: "/virtual-office/interiors/office-09-command-center-interior.webp",
    fallbackMapCrop: { objectPosition: "16% 84%", scale: 1.75 },
  },
};

export function getOfficeInteriorProfile(officeNumber?: number | null) {
  if (!officeNumber) return null;
  return OFFICE_INTERIOR_PROFILES[officeNumber] ?? null;
}

export const officeInteriorProfiles = OFFICE_INTERIOR_PROFILES;
