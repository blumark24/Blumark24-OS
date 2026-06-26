import type { OfficeScopeSummary } from "./officeScope";

export interface ScopedOfficeMetricInput {
  employeeCount?: number | null;
  openTaskCount?: number | null;
  overdueTaskCount?: number | null;
}

export interface ScopedOfficeMetricPatch {
  employeeCount: number;
  openTasks: number;
  overdueTasks: number;
  healthPct: number;
}

export function scopedHealthPct(summary: ScopedOfficeMetricInput): number {
  const open = Math.max(0, summary.openTaskCount ?? 0);
  const overdue = Math.max(0, summary.overdueTaskCount ?? 0);
  const employees = Math.max(0, summary.employeeCount ?? 0);

  if (employees === 0 && open === 0 && overdue === 0) return 0;
  if (open === 0 && overdue === 0) return 90;

  return Math.max(45, Math.min(99, 100 - overdue * 10 - Math.max(0, open - overdue) * 3));
}

export function toScopedOfficeMetricPatch(summary: OfficeScopeSummary): ScopedOfficeMetricPatch {
  return {
    employeeCount: Math.max(0, summary.employeeCount),
    openTasks: Math.max(0, summary.openTaskCount),
    overdueTasks: Math.max(0, summary.overdueTaskCount),
    healthPct: scopedHealthPct(summary),
  };
}

export function emptyScopedOfficeMetricPatch(): ScopedOfficeMetricPatch {
  return {
    employeeCount: 0,
    openTasks: 0,
    overdueTasks: 0,
    healthPct: 0,
  };
}
