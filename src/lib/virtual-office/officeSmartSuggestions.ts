export type OfficeSmartSuggestionKind =
  | "link_required"
  | "restricted"
  | "board_summary"
  | "overdue_tasks"
  | "open_tasks"
  | "empty_team"
  | "healthy"
  | "ready";

export type OfficeSmartSuggestionSeverity = "info" | "success" | "warning" | "critical";

export interface OfficeSmartSuggestionInput {
  officeNumber: number;
  isBoard?: boolean;
  isUnassigned?: boolean;
  canViewOperationalData?: boolean;
  employeeCount?: number | null;
  openTaskCount?: number | null;
  overdueTaskCount?: number | null;
  healthPct?: number | null;
}

export interface OfficeSmartSuggestion {
  kind: OfficeSmartSuggestionKind;
  severity: OfficeSmartSuggestionSeverity;
  title: string;
  detail: string;
  actionLabel: string;
  blocked: boolean;
}

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function officeLabel(officeNumber: number): string {
  return `OFFICE ${String(Math.max(0, officeNumber)).padStart(2, "0")}`;
}

export function buildOfficeSmartSuggestions(input: OfficeSmartSuggestionInput): OfficeSmartSuggestion[] {
  const office = officeLabel(input.officeNumber);
  const employees = safeNumber(input.employeeCount);
  const openTasks = safeNumber(input.openTaskCount);
  const overdueTasks = safeNumber(input.overdueTaskCount);
  const healthPct = safeNumber(input.healthPct);

  if (input.isUnassigned) {
    return [
      {
        kind: "link_required",
        severity: "warning",
        title: "جاهز بعد الربط",
        detail: `${office} يحتاج ربطه بإدارة أو فريق قبل عرض بيانات تشغيلية.`,
        actionLabel: "ربط المكتب",
        blocked: false,
      },
    ];
  }

  if (input.canViewOperationalData === false) {
    return [
      {
        kind: "restricted",
        severity: "info",
        title: "عرض محدود",
        detail: `${office} يعرض معلومات عامة فقط حسب صلاحيات المستخدم.`,
        actionLabel: "مراجعة الصلاحيات",
        blocked: true,
      },
    ];
  }

  if (input.isBoard) {
    return [
      {
        kind: "board_summary",
        severity: "info",
        title: "ملخص مجلس الإدارة",
        detail: "هذا المكتب مخصص للقراءة القيادية ولا يعرض تفاصيل تشغيلية إلا للمالك.",
        actionLabel: "فتح الملخص",
        blocked: false,
      },
    ];
  }

  if (overdueTasks > 0) {
    return [
      {
        kind: "overdue_tasks",
        severity: overdueTasks >= 3 ? "critical" : "warning",
        title: "مهام متأخرة",
        detail: `${office} لديه ${overdueTasks} مهام متأخرة وتحتاج متابعة قبل نهاية اليوم.`,
        actionLabel: "مراجعة المهام",
        blocked: false,
      },
    ];
  }

  if (openTasks > 0) {
    return [
      {
        kind: "open_tasks",
        severity: "info",
        title: "مهام مفتوحة",
        detail: `${office} لديه ${openTasks} مهام مفتوحة بدون تأخير حالي.`,
        actionLabel: "تنظيم الأولويات",
        blocked: false,
      },
    ];
  }

  if (employees === 0) {
    return [
      {
        kind: "empty_team",
        severity: "warning",
        title: "لا يوجد موظفون",
        detail: `${office} مربوط لكنه لا يحتوي على موظفين ظاهرين ضمن النطاق الحالي.`,
        actionLabel: "مراجعة الهيكل",
        blocked: false,
      },
    ];
  }

  if (healthPct >= 85) {
    return [
      {
        kind: "healthy",
        severity: "success",
        title: "الوضع مستقر",
        detail: `${office} يعمل بدون مؤشرات تشغيلية حرجة.`,
        actionLabel: "عرض التقرير",
        blocked: false,
      },
    ];
  }

  return [
    {
      kind: "ready",
      severity: "info",
      title: "جاهز للمتابعة",
      detail: `${office} جاهز للمتابعة التشغيلية ضمن النطاق المصرح.`,
      actionLabel: "فتح المكتب",
      blocked: false,
    },
  ];
}

export function firstOfficeSmartSuggestion(input: OfficeSmartSuggestionInput): OfficeSmartSuggestion {
  return buildOfficeSmartSuggestions(input)[0];
}
