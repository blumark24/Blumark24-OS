import type { UserRole } from "@/contexts/PermissionsContext";
import type { WorkspaceRouteId } from "@/lib/features/packageFeatures";

/** Departments shown in tenant HR forms (no Blumark internal names). */
export const TENANT_DEPARTMENTS = [
  "الإدارة",
  "العمليات",
  "المبيعات",
  "التسويق",
  "خدمة العملاء",
  "المالية",
  "الموارد البشرية",
  "تقنية المعلومات",
] as const;

export const TENANT_DEPT_COLORS: Record<string, string> = {
  الإدارة: "#22d3ee",
  العمليات: "#06b6d4",
  المبيعات: "#10b981",
  التسويق: "#a855f7",
  "خدمة العملاء": "#3b82f6",
  المالية: "#f59e0b",
  "الموارد البشرية": "#8b5cf6",
  "تقنية المعلومات": "#6366f1",
};

/** Roles assignable inside a customer organization (no internal agency managers). */
export const TENANT_ASSIGNABLE_ROLES: UserRole[] = [
  "organization_manager",
  "finance_manager",
  "employee",
];

/**
 * Organizational JOB-TITLE tiers selectable in the Add/Edit Employee modal.
 * These are DISPLAY labels stored in employees.job_title — NOT auth roles, so
 * no DB role-constraint change is required. "مدير المنشأة" is intentionally
 * excluded: it is reserved for the organization_manager (tenant subscriber).
 * The auth role for these hires stays "employee" (no broad permissions).
 */
export const TENANT_JOB_TITLES = [
  { value: "موظف", label: "موظف" },
  { value: "مدير قسم", label: "مدير قسم" },
  { value: "مدير إدارة", label: "مدير إدارة" },
  { value: "مدير وكالة", label: "مدير وكالة" },
] as const;

export const DEFAULT_TENANT_JOB_TITLE = "موظف";

/** Safe labels for tenant-facing UI — legacy internal roles are rewritten. */
const TENANT_ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير أعلى",
  board_member: "عضو إدارة",
  attack_manager: "مدير تشغيل",
  defense_manager: "مدير تشغيل",
  organization_manager: "مدير المنشأة",
  // Organizational tiers (display labels; not stored as auth roles).
  agency_manager: "مدير وكالة",
  department_manager: "مدير إدارة",
  section_manager: "مدير قسم",
  employee: "موظف",
  admin: "مدير المنشأة",
  // Backward-compatible display fallbacks for legacy stored roles (no DB rewrite).
  manager: "مدير إدارة",
  finance_manager: "مدير إدارة",
  marketing_manager: "مدير إدارة",
  hr_manager: "مدير إدارة",
};

const INTERNAL_ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير أعلى",
  board_member: "عضو مجلس الإدارة",
  defense_manager: "مدير وكالة الدفاع",
  attack_manager: "مدير وكالة الهجوم",
  finance_manager: "مدير مالي",
  organization_manager: "مدير المنشأة",
  employee: "موظف",
};

/** Short labels for mobile bottom navigation (no truncation). */
export const MOBILE_ROUTE_LABELS: Partial<Record<WorkspaceRouteId, string>> = {
  dashboard: "الرئيسية",
  tasks: "المهام",
  clients: "العملاء",
  org: "الهيكل",
  employees: "الفريق",
  finance: "المالية",
  strategy: "الاستراتيجية",
  reports: "التقارير",
  settings: "الإعدادات",
  ai: "المساعد",
};

export function getTenantRoleLabel(
  role: UserRole | string | null | undefined,
  isInternal = false,
): string {
  if (!role) return "";
  const map = isInternal ? INTERNAL_ROLE_LABELS : TENANT_ROLE_LABELS;
  // Unknown roles fall back to "موظف" (safe tenant default).
  return map[role] ?? map[String(role)] ?? "موظف";
}

export function formatTenantDepartment(
  department: string | null | undefined,
): { text: string; isEmpty: boolean } {
  const raw = String(department ?? "").trim();
  if (!raw || raw === "—") {
    return { text: "لم يُحدد القسم بعد", isEmpty: true };
  }
  const internalPatterns = /هجوم|دفاع|AI Lab|وكالة/i;
  if (internalPatterns.test(raw)) {
    return { text: "قسم المنشأة", isEmpty: false };
  }
  return { text: raw, isEmpty: false };
}

export function getDepartmentsForContext(isInternal: boolean): readonly string[] {
  if (isInternal) {
    return [
      "الإدارة",
      "العمليات",
      "المالية",
      "الإبداع",
      "التصميم",
      "المبيعات",
      "خدمة العملاء",
    ];
  }
  return TENANT_DEPARTMENTS;
}

export function getChartDepartmentFallback(isInternal: boolean): string[] {
  if (isInternal) {
    return ["الإدارة", "العمليات", "المبيعات", "المالية", "خدمة العملاء"];
  }
  return [...TENANT_DEPARTMENTS.slice(0, 5)];
}
