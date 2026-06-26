export type OwnerGovernancePackage = "start" | "growth" | "advanced" | "enterprise";
export type OwnerGovernanceRole = "owner" | "manager" | "employee";
export type OwnerGovernanceStatus = "enabled" | "limited" | "locked";

export interface OwnerGovernancePolicyInput {
  packageTier?: OwnerGovernancePackage;
  role?: OwnerGovernanceRole;
  officeCount?: number | null;
  linkedOfficeCount?: number | null;
  enabledVirtualOffice?: boolean;
  enabledMeetingRooms?: boolean;
  enabledReports?: boolean;
  enabledTenantBranding?: boolean;
}

export interface OwnerGovernanceCapability {
  key: "virtual_office" | "meeting_rooms" | "reports" | "tenant_branding" | "owner_controls";
  status: OwnerGovernanceStatus;
  title: string;
  detail: string;
  actionLabel: string;
}

export interface OwnerGovernancePolicyResult {
  packageTier: OwnerGovernancePackage;
  role: OwnerGovernanceRole;
  status: OwnerGovernanceStatus;
  capabilities: OwnerGovernanceCapability[];
  readyCount: number;
  lockedCount: number;
}

function safeCount(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function capability(
  key: OwnerGovernanceCapability["key"],
  status: OwnerGovernanceStatus,
  title: string,
  detail: string,
  actionLabel: string,
): OwnerGovernanceCapability {
  return { key, status, title, detail, actionLabel };
}

export function resolveOwnerGovernancePolicy(
  input: OwnerGovernancePolicyInput = {},
): OwnerGovernancePolicyResult {
  const packageTier = input.packageTier ?? "advanced";
  const role = input.role ?? "owner";
  const officeCount = safeCount(input.officeCount);
  const linkedOfficeCount = safeCount(input.linkedOfficeCount);
  const isOwner = role === "owner";
  const isAdvanced = packageTier === "advanced" || packageTier === "enterprise";
  const isEnterprise = packageTier === "enterprise";

  const virtualOfficeEnabled = input.enabledVirtualOffice ?? true;
  const meetingRoomsEnabled = input.enabledMeetingRooms ?? isAdvanced;
  const reportsEnabled = input.enabledReports ?? isAdvanced;
  const brandingEnabled = input.enabledTenantBranding ?? isEnterprise;

  const capabilities: OwnerGovernanceCapability[] = [
    capability(
      "virtual_office",
      virtualOfficeEnabled ? "enabled" : "locked",
      "المقر الافتراضي",
      virtualOfficeEnabled
        ? `مفعل على ${linkedOfficeCount}/${officeCount} مكاتب مرتبطة.`
        : "المقر الافتراضي غير مفعل لهذه المنشأة.",
      virtualOfficeEnabled ? "إدارة المقر" : "ترقية الباقة",
    ),
    capability(
      "meeting_rooms",
      meetingRoomsEnabled ? "enabled" : "locked",
      "غرف الاجتماع النصية",
      meetingRoomsEnabled
        ? "متاحة كحوكمة نصية فقط دون بث مباشر."
        : "غرف الاجتماع النصية متاحة في الباقات الأعلى.",
      meetingRoomsEnabled ? "إدارة الغرف" : "ترقية الباقة",
    ),
    capability(
      "reports",
      reportsEnabled ? "enabled" : "limited",
      "تقارير المكاتب",
      reportsEnabled
        ? "تقارير المكاتب متاحة من بيانات النطاق الحالي."
        : "التقارير التفصيلية محدودة في هذه الباقة.",
      reportsEnabled ? "فتح التقارير" : "مراجعة الباقة",
    ),
    capability(
      "tenant_branding",
      brandingEnabled ? "enabled" : "limited",
      "تخصيص المنشأة",
      brandingEnabled
        ? "تخصيص المنشأة متاح للمالك."
        : "التخصيص المتقدم محجوز للباقة المؤسسية.",
      brandingEnabled ? "إدارة التخصيص" : "ترقية مؤسسية",
    ),
    capability(
      "owner_controls",
      isOwner ? "enabled" : "locked",
      "حوكمة المالك",
      isOwner
        ? "صلاحيات المالك متاحة كطبقة تحكم عليا."
        : "صلاحيات المالك غير متاحة لهذا الدور.",
      isOwner ? "فتح الحوكمة" : "طلب صلاحية",
    ),
  ];

  const lockedCount = capabilities.filter((entry) => entry.status === "locked").length;
  const readyCount = capabilities.filter((entry) => entry.status === "enabled").length;
  const status: OwnerGovernanceStatus = lockedCount > 0 ? "limited" : "enabled";

  return {
    packageTier,
    role,
    status,
    capabilities,
    readyCount,
    lockedCount,
  };
}

export function canUseOwnerGovernance(input: OwnerGovernancePolicyInput = {}): boolean {
  const result = resolveOwnerGovernancePolicy(input);
  return result.role === "owner" && result.capabilities.some((entry) => entry.key === "owner_controls" && entry.status === "enabled");
}
