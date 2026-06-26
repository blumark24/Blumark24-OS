export type OfficeArtifactKind = "files" | "report" | "tasks" | "team" | "export";
export type OfficeArtifactState = "ready" | "empty" | "restricted" | "unlinked" | "pending";

export interface OfficeArtifactSummaryInput {
  officeNumber: number;
  officeName?: string | null;
  isBoard?: boolean;
  isUnassigned?: boolean;
  canViewFiles?: boolean;
  canViewReports?: boolean;
  employeeCount?: number | null;
  openTaskCount?: number | null;
  overdueTaskCount?: number | null;
  linkedFileCount?: number | null;
}

export interface OfficeArtifactSummaryItem {
  kind: OfficeArtifactKind;
  state: OfficeArtifactState;
  title: string;
  detail: string;
  actionLabel: string;
}

export interface OfficeArtifactSummary {
  officeLabel: string;
  items: OfficeArtifactSummaryItem[];
  readyCount: number;
  unavailableCount: number;
}

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function officeLabel(officeNumber: number, officeName?: string | null): string {
  const numberLabel = `OFFICE ${String(Math.max(0, officeNumber)).padStart(2, "0")}`;
  const name = officeName?.trim();
  return name ? `${numberLabel} · ${name}` : numberLabel;
}

function summaryItem(
  kind: OfficeArtifactKind,
  state: OfficeArtifactState,
  title: string,
  detail: string,
  actionLabel: string,
): OfficeArtifactSummaryItem {
  return { kind, state, title, detail, actionLabel };
}

export function buildOfficeArtifactSummary(input: OfficeArtifactSummaryInput): OfficeArtifactSummary {
  const label = officeLabel(input.officeNumber, input.officeName);
  const employees = safeNumber(input.employeeCount);
  const openTasks = safeNumber(input.openTaskCount);
  const overdueTasks = safeNumber(input.overdueTaskCount);
  const linkedFiles = safeNumber(input.linkedFileCount);

  if (input.isUnassigned) {
    return summarize(label, [
      summaryItem("files", "unlinked", "مساحة ملفات غير مفعلة", `${label} يحتاج الربط قبل عرض الملفات.`, "ربط المكتب"),
      summaryItem("report", "unlinked", "تقرير غير متاح", `${label} يحتاج الربط قبل عرض التقرير.`, "ربط المكتب"),
    ]);
  }

  const items: OfficeArtifactSummaryItem[] = [
    summaryItem(
      "files",
      input.canViewFiles === false ? "restricted" : linkedFiles > 0 ? "ready" : "empty",
      linkedFiles > 0 ? "ملفات مرتبطة" : "مساحة ملفات جاهزة",
      linkedFiles > 0 ? `${label} يحتوي على ${linkedFiles} ملفات مرتبطة.` : `${label} جاهز لربط الملفات بدون بيانات وهمية.`,
      linkedFiles > 0 ? "فتح الملفات" : "ربط ملف",
    ),
    summaryItem(
      "tasks",
      openTasks > 0 || overdueTasks > 0 ? "ready" : "empty",
      "لقطة المهام",
      overdueTasks > 0 ? `${label} لديه ${overdueTasks} مهام متأخرة.` : openTasks > 0 ? `${label} لديه ${openTasks} مهام مفتوحة.` : `${label} لا يحتوي على مهام مفتوحة حالياً.`,
      "عرض المهام",
    ),
    summaryItem(
      "team",
      employees > 0 ? "ready" : "empty",
      "لقطة الفريق",
      employees > 0 ? `${label} يحتوي على ${employees} موظفين ضمن النطاق الحالي.` : `${label} لا يحتوي على موظفين ظاهرين ضمن النطاق الحالي.`,
      "عرض الفريق",
    ),
    summaryItem(
      "report",
      input.canViewReports === false ? "restricted" : "ready",
      input.isBoard ? "تقرير مجلس الإدارة" : "تقرير المكتب",
      input.canViewReports === false ? `${label} يتطلب صلاحية أعلى لعرض التقرير.` : `${label} جاهز لتقرير مختصر.`,
      "فتح التقرير",
    ),
    summaryItem("export", "pending", "تصدير التقرير", "التصدير سيضاف بعد اعتماد نموذج التقارير.", "قريباً"),
  ];

  return summarize(label, items);
}

function summarize(officeLabelValue: string, items: OfficeArtifactSummaryItem[]): OfficeArtifactSummary {
  return {
    officeLabel: officeLabelValue,
    items,
    readyCount: items.filter((entry) => entry.state === "ready").length,
    unavailableCount: items.filter((entry) => entry.state === "restricted" || entry.state === "unlinked" || entry.state === "pending").length,
  };
}

export function firstReadyOfficeArtifact(input: OfficeArtifactSummaryInput): OfficeArtifactSummaryItem | null {
  return buildOfficeArtifactSummary(input).items.find((entry) => entry.state === "ready") ?? null;
}
