export type OfficeInteriorKind = "workspace" | "boardroom" | "unassigned";
export type OfficeInteriorStatus = "ready" | "pending_asset" | "locked";

export const SHARED_OFFICE_INTERIOR_ASSET_SRC = "/virtual-office/interiors/blumark-office-portal-interior.svg";

export const OFFICE_INTERIOR_ASSET_BY_KEY: Readonly<Record<string, string>> = {
  "office-01-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-02-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-03-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-04-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-05-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-06-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-07-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-08-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
  "office-09-interior": SHARED_OFFICE_INTERIOR_ASSET_SRC,
};

export interface OfficeInteriorProfileInput {
  officeNumber: number;
  officeName?: string | null;
  isBoard?: boolean;
  isUnassigned?: boolean;
  hasInteriorAsset?: boolean;
  linkedEmployeeCount?: number | null;
}

export interface OfficeInteriorProfile {
  officeNumber: number;
  officeLabel: string;
  kind: OfficeInteriorKind;
  status: OfficeInteriorStatus;
  title: string;
  detail: string;
  actionLabel: string;
  assetKey: string;
  assetSrc: string | null;
  preservesExteriorMapping: boolean;
  canOpenInterior: boolean;
}

function safeOfficeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(99, Math.trunc(value))) : 0;
}

function officeLabel(officeNumber: number, officeName?: string | null): string {
  const number = safeOfficeNumber(officeNumber);
  const base = `OFFICE ${String(number).padStart(2, "0")}`;
  const cleanName = officeName?.trim();
  return cleanName ? `${base} · ${cleanName}` : base;
}

function officeAssetKey(officeNumber: number): string {
  return `office-${String(safeOfficeNumber(officeNumber)).padStart(2, "0")}-interior`;
}

export function getOfficeInteriorAssetSrc(officeNumber: number): string | null {
  const assetKey = officeAssetKey(officeNumber);
  return OFFICE_INTERIOR_ASSET_BY_KEY[assetKey] ?? null;
}

export function buildOfficeInteriorProfile(input: OfficeInteriorProfileInput): OfficeInteriorProfile {
  const officeNumber = safeOfficeNumber(input.officeNumber);
  const label = officeLabel(officeNumber, input.officeName);
  const kind: OfficeInteriorKind = input.isUnassigned ? "unassigned" : input.isBoard ? "boardroom" : "workspace";
  const assetKey = officeAssetKey(officeNumber);
  const registeredAssetSrc = getOfficeInteriorAssetSrc(officeNumber);
  const hasApprovedAsset = input.hasInteriorAsset ?? Boolean(registeredAssetSrc);
  const assetSrc = hasApprovedAsset ? registeredAssetSrc : null;

  if (input.isUnassigned) {
    return {
      officeNumber,
      officeLabel: label,
      kind,
      status: "locked",
      title: "المكتب الداخلي غير مخصص",
      detail: "لا يتم فتح مكتب داخلي قبل ربطه من الهيكل الإداري.",
      actionLabel: "ربط المكتب أولاً",
      assetKey,
      assetSrc,
      preservesExteriorMapping: true,
      canOpenInterior: false,
    };
  }

  if (!assetSrc) {
    return {
      officeNumber,
      officeLabel: label,
      kind,
      status: "pending_asset",
      title: input.isBoard ? "غرفة مجلس الإدارة الداخلية تحتاج أصل بصري" : "المكتب الداخلي يحتاج أصل بصري",
      detail: "يجب أن يكون المشهد الداخلي مطابقاً لترتيب المكتب الخارجي ونفس رقم المكتب.",
      actionLabel: "تجهيز الصورة الداخلية",
      assetKey,
      assetSrc: null,
      preservesExteriorMapping: true,
      canOpenInterior: false,
    };
  }

  return {
    officeNumber,
    officeLabel: label,
    kind,
    status: "ready",
    title: input.isBoard ? "غرفة مجلس الإدارة الداخلية جاهزة" : "المكتب الداخلي جاهز",
    detail: "المشهد الداخلي مرتبط بنفس رقم المكتب الخارجي ومحفوظ داخل مسار المكتب الافتراضي.",
    actionLabel: input.isBoard ? "فتح مجلس الإدارة" : "فتح المكتب الداخلي",
    assetKey,
    assetSrc,
    preservesExteriorMapping: true,
    canOpenInterior: true,
  };
}

export function canOpenOfficeInterior(input: OfficeInteriorProfileInput): boolean {
  return buildOfficeInteriorProfile(input).canOpenInterior;
}
