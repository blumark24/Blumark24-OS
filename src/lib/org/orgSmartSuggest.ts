import type { BoardMember } from "@/lib/db";
import type { Employee } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import { getOrgLimits, type OrgPackageLimits } from "@/lib/org/orgPackageLimits";
import {
  countUnits,
  createOrgUnit,
  type OrgStructureSnapshot,
  type OrgUnitNode,
} from "@/lib/org/orgStructure";

export interface SmartOrgInput {
  plan: PlanSlug;
  employees: Employee[];
  boardMembers: BoardMember[];
  current: OrgStructureSnapshot;
}

export interface SmartOrgSuggestion {
  snapshot: OrgStructureSnapshot;
  summary: string[];
  warnings: string[];
  blockedLevels: string[];
}

function uniqueDepartments(employees: Employee[]): string[] {
  const names = new Set<string>();
  employees.forEach((e) => {
    const d = String(e.department ?? "").trim();
    if (d) names.add(d);
  });
  return Array.from(names);
}

/** Builds a package-compliant structure proposal from existing tenant data. */
export function buildSmartOrgSuggestion(input: SmartOrgInput): SmartOrgSuggestion {
  const limits = getOrgLimits(input.plan);
  const units: OrgUnitNode[] = [];
  const warnings: string[] = [];
  const blockedLevels: string[] = [];
  const summary: string[] = [];

  if (limits.agencies <= 0) {
    blockedLevels.push("وكالة");
  } else if (countUnits(input.current.units, "agency") === 0) {
    const agencyName = input.plan === "advanced" ? "الوكالة الرئيسية" : "وكالة التشغيل";
    units.push(createOrgUnit("agency", agencyName, null));
    summary.push(`اقتراح وكالة واحدة: ${agencyName}`);
  } else {
    units.push(...input.current.units.filter((u) => u.kind === "agency"));
  }

  const agencyId = units.find((u) => u.kind === "agency")?.id ?? null;

  if (limits.managements <= 0) {
    blockedLevels.push("إدارة");
  } else {
    const existingMgmt = input.current.units.filter((u) => u.kind === "management");
    if (existingMgmt.length === 0 && units.length < limits.managements) {
      const m = createOrgUnit("management", "الإدارة العامة", agencyId);
      units.push(m);
      summary.push("اقتراح إدارة عامة لتجميع الأقسام");
    } else {
      units.push(...existingMgmt);
    }
  }

  const mgmtId = units.find((u) => u.kind === "management")?.id ?? agencyId;

  units.push(
    ...input.current.units.filter(
      (u) => u.kind === "department" && !units.some((x) => x.id === u.id),
    ),
  );
  units.push(
    ...input.current.units.filter(
      (u) => u.kind === "team" && !units.some((x) => x.id === u.id),
    ),
  );

  const deptNames = uniqueDepartments(input.employees);
  const existingDeptNames = new Set(
    units.filter((u) => u.kind === "department").map((u) => u.name),
  );

  let deptAdded = 0;
  for (const name of deptNames) {
    if (countUnits(units, "department") >= limits.departments) break;
    if (existingDeptNames.has(name)) continue;
    units.push(createOrgUnit("department", name, mgmtId));
    deptAdded++;
  }

  if (deptNames.length === 0) {
    warnings.push("لا توجد أقسام — أضف موظفين بأقسام محددة أو أنشئ أقساماً يدوياً.");
  } else if (deptAdded > 0) {
    summary.push(`اقتراح ${deptAdded} قسم من بيانات الموظفين الحالية`);
  }

  for (const d of units.filter((u) => u.kind === "department")) {
    const teamEmployees = input.employees.filter((e) => e.department === d.name);
    if (teamEmployees.length >= 4) {
      const teamName = `فريق ${d.name}`;
      if (!units.some((u) => u.kind === "team" && u.name === teamName)) {
        units.push(createOrgUnit("team", teamName, d.id));
        summary.push(`فريق مقترح تحت ${d.name} (${teamEmployees.length} موظفين)`);
      }
    }
  }

  if (input.boardMembers.length === 0) {
    warnings.push("لا يوجد أعضاء مجلس إدارة — أضفهم من الوضع اليدوي.");
  } else {
    summary.push(`${input.boardMembers.length} عضو مجلس مرتبط بالهيكل`);
  }

  const unassigned = input.employees.filter(
    (e) => !deptNames.includes(String(e.department ?? "").trim()),
  );
  if (unassigned.length > 0) {
    warnings.push(`يوجد ${unassigned.length} موظف غير مرتبط بقسم.`);
  }

  if (countUnits(units, "department") >= limits.departments) {
    warnings.push(`وصلت للحد الأعلى للأقسام (${limits.departments}) في باقة ${limits.label}.`);
  }

  if (blockedLevels.length > 0) {
    warnings.push(`باقتك لا تدعم: ${blockedLevels.join("، ")}`);
  }

  return {
    snapshot: { units, updatedAt: new Date().toISOString() },
    summary,
    warnings,
    blockedLevels,
  };
}

export function buildSmartAlerts(
  limits: OrgPackageLimits,
  employees: Employee[],
  departments: OrgUnitNode[],
  unassignedCount: number,
): string[] {
  const msgs: string[] = [];
  if (departments.length === 0) msgs.push("لا توجد أقسام");
  if (unassignedCount > 0) msgs.push(`يوجد ${unassignedCount} موظفون غير مرتبطين`);
  if (departments.length >= limits.departments) {
    msgs.push("وصلت للحد الأعلى");
  }
  if (limits.agencies === 0) msgs.push("باقتك لا تدعم مستوى الوكالة");
  if (limits.managements === 0 && limits.agencies === 0) msgs.push("باقتك تدعم الأقسام والموظفين مباشرة");
  return msgs;
}
