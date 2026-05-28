import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { LeadershipMapRow, LeadershipStudioPreview } from "./buildLeadershipStudio";
import { RISK_LABEL_AR, type OrgRolesIntelligence, type RiskLevel } from "./buildRolesIntelligence";
import type { EmployeeHealthPreview } from "./buildLeadershipStudio";

export const EXECUTIVE_PLAN_TITLE_AR = "خطة ضبط القيادة";

export const EXECUTIVE_PLAN_HELPER_AR =
  "قراءة تشغيلية تحوّل فجوات الهيكل إلى أولويات واضحة وإجراءات مقترحة للمدير.";

export const EXECUTIVE_TOOLS_CTA_AR = "ابدأ من أدوات القيادة";

export type PriorityLevel = "عالية" | "متوسطة" | "منخفضة";

export type ExecutiveNowAction = {
  body: string;
};

export type HealingPriorityCard = {
  id: "link_employees" | "assign_owners" | "balance_load";
  title: string;
  priority: PriorityLevel;
  reason: string;
  benefit: string;
  suggestedTool: string;
};

export type StructureGapCard = {
  id: string;
  label: string;
  count: number;
  impact: string;
  suggestedTool: string;
};

export type LeadershipMapGroup = {
  id: "login_roles" | "leadership_units" | "org_labels";
  title: string;
  items: { label: string; detail: string }[];
};

export type LeadershipStatusSnapshot = {
  readinessPct: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  unlinkedEmployees: number;
  unitsWithoutManager: number;
};

export type LeadershipIndicatorSnapshot = {
  averageScore: number | null;
  riskLevel: RiskLevel;
  riskLabel: string;
  businessMeaning: string;
  topEmployees: { name: string; score: number; riskLabel: string }[];
};

export type ExecutiveReadingModel = {
  status: LeadershipStatusSnapshot;
  nowAction: ExecutiveNowAction;
  healingPriorities: HealingPriorityCard[];
  gapCards: StructureGapCard[];
  mapGroups: LeadershipMapGroup[];
  indicator: LeadershipIndicatorSnapshot;
};

const ORG_LABELS_BY_PLAN: Record<PlanSlug, string[]> = {
  basic: ["مجلس الإدارة", "رئيس قسم"],
  growth: ["مجلس الإدارة", "مدير إدارة", "رئيس قسم"],
  advanced: ["مجلس الإدارة", "مدير وكالة", "مدير إدارة", "رئيس قسم"],
};

export function buildExecutiveNowAction(
  summary: OrgRolesIntelligence["summary"],
): ExecutiveNowAction {
  if (summary.unlinkedEmployees > 0) {
    return {
      body: `اربط ${summary.unlinkedEmployees} موظفاً خارج الهيكل أولاً — بدون الربط لا تُقاس المساءلة ولا توزيع المهام بدقة.`,
    };
  }
  if (summary.departmentsWithoutManager > 0) {
    return {
      body: `عيّن مسؤولاً تنظيمياً لـ ${summary.departmentsWithoutManager} وحدة بلا مسؤول — يوضح من يتابع التنفيذ اليومي.`,
    };
  }
  if (summary.teamsWithoutMembers > 0) {
    return {
      body: `راجع تعيينات ${summary.teamsWithoutMembers} فريقاً بلا أعضاء — الفرق الفارغة لا تنتج قيمة تشغيلية.`,
    };
  }
  if (
    summary.tasksAvailable &&
    summary.overdueTasksOrgWide !== null &&
    summary.overdueTasksOrgWide > 0
  ) {
    return {
      body: `أعد توزيع ضغط ${summary.overdueTasksOrgWide} مهمة متأخرة — يخفف التأخير ويحسّن الالتزام أمام العملاء.`,
    };
  }
  return {
    body: "حافظ على الهيكل الحالي — ربط الموظفين الجدد عند الانضمام يحافظ على وضوح القيادة.",
  };
}

function priorityForLink(summary: OrgRolesIntelligence["summary"]): PriorityLevel {
  if (summary.unlinkedEmployees >= 3) return "عالية";
  if (summary.unlinkedEmployees > 0) return "متوسطة";
  if (summary.withoutDepartmentLabel > 0) return "منخفضة";
  return "منخفضة";
}

function priorityForOwners(summary: OrgRolesIntelligence["summary"]): PriorityLevel {
  if (summary.departmentsWithoutManager >= 2) return "عالية";
  if (summary.departmentsWithoutManager > 0) return "عالية";
  if (summary.teamsWithoutMembers > 0) return "متوسطة";
  return "منخفضة";
}

function priorityForLoad(summary: OrgRolesIntelligence["summary"]): PriorityLevel {
  const overdue = summary.overdueTasksOrgWide ?? 0;
  const open = summary.openTasksOrgWide ?? 0;
  if (!summary.tasksAvailable) return "منخفضة";
  if (overdue >= 3) return "عالية";
  if (overdue > 0) return "متوسطة";
  if (open >= 10) return "متوسطة";
  return "منخفضة";
}

export function buildHealingPriorities(
  summary: OrgRolesIntelligence["summary"],
): HealingPriorityCard[] {
  const linkPriority = priorityForLink(summary);
  const ownerPriority = priorityForOwners(summary);
  const loadPriority = priorityForLoad(summary);

  return [
    {
      id: "link_employees",
      title: "ربط الموظفين",
      priority: linkPriority,
      reason:
        summary.unlinkedEmployees > 0
          ? `${summary.unlinkedEmployees} موظفاً غير مرتبطين بالهيكل.`
          : "الهيكل مرتبط حالياً — استمر بربط المنضمين الجدد.",
      benefit: "قياس أداء أوضح وتوزيع مهام أدق عبر الوحدات.",
      suggestedTool: "نقل موظف",
    },
    {
      id: "assign_owners",
      title: "تعيين المسؤولين",
      priority: ownerPriority,
      reason:
        summary.departmentsWithoutManager > 0
          ? `${summary.departmentsWithoutManager} وحدة بلا مسؤول مسجّل.`
          : "المسؤوليات التنظيمية واضحة نسبياً في السجل.",
      benefit: "تسريع القرارات اليومية وتقليل التعطل بين الأقسام.",
      suggestedTool: "تعيين مسؤول",
    },
    {
      id: "balance_load",
      title: "توزيع الضغط التشغيلي",
      priority: loadPriority,
      reason: summary.tasksAvailable
        ? summary.overdueTasksOrgWide && summary.overdueTasksOrgWide > 0
          ? `${summary.overdueTasksOrgWide} مهمة متأخرة تضغط على الفريق.`
          : `${summary.openTasksOrgWide ?? 0} مهمة مفتوحة قيد المتابعة.`
        : "بيانات المهام غير متاحة للقراءة حالياً.",
      benefit: "تحسين الالتزام بالمواعيد وتوازن الحمل بين الموظفين.",
      suggestedTool:
        summary.overdueTasksOrgWide && summary.overdueTasksOrgWide > 0
          ? "توزيع مهام"
          : "تقييم أداء",
    },
  ];
}

export function buildStructureGapCards(
  summary: OrgRolesIntelligence["summary"],
): StructureGapCard[] {
  const cards: StructureGapCard[] = [];

  if (summary.unlinkedEmployees > 0) {
    cards.push({
      id: "unlinked",
      label: "موظفون خارج الهيكل",
      count: summary.unlinkedEmployees,
      impact: "لا يمكن قياس الأداء بدقة قبل ربطهم.",
      suggestedTool: "نقل موظف / ربط موظف",
    });
  }
  if (summary.departmentsWithoutManager > 0) {
    cards.push({
      id: "no-mgr",
      label: "وحدات بدون مسؤول",
      count: summary.departmentsWithoutManager,
      impact: "تقل وضوحية المساءلة والمتابعة.",
      suggestedTool: "تعيين مسؤول",
    });
  }
  if (summary.teamsWithoutMembers > 0) {
    cards.push({
      id: "empty-team",
      label: "فرق بدون أعضاء",
      count: summary.teamsWithoutMembers,
      impact: "الفريق لا ينتج قيمة تشغيلية بدون أعضاء.",
      suggestedTool: "نقل موظف أو تعيين مسؤول",
    });
  }
  if (
    summary.tasksAvailable &&
    summary.overdueTasksOrgWide !== null &&
    summary.overdueTasksOrgWide > 0
  ) {
    cards.push({
      id: "overdue",
      label: "مهام متأخرة",
      count: summary.overdueTasksOrgWide,
      impact: "تؤثر على الالتزام وجودة التنفيذ.",
      suggestedTool: "توزيع مهام",
    });
  }

  return cards;
}

function mapRowToItem(row: LeadershipMapRow): { label: string; detail: string } {
  return {
    label: row.title,
    detail: `${row.subtitle}${row.meta ? ` · ${row.meta}` : ""}`,
  };
}

export function buildGroupedLeadershipMap(
  mapRows: LeadershipMapRow[],
  intel: OrgRolesIntelligence,
  plan: PlanSlug,
): LeadershipMapGroup[] {
  const loginItems = mapRows
    .filter((r) => r.id.startsWith("rbac-"))
    .slice(0, 4)
    .map(mapRowToItem);

  const unitItems = mapRows
    .filter((r) => r.id.startsWith("dept-") || r.id.startsWith("team-"))
    .slice(0, 5)
    .map(mapRowToItem);

  const allowed = new Set(ORG_LABELS_BY_PLAN[plan] ?? ORG_LABELS_BY_PLAN.basic);
  const labelItems = intel.organizationalInsights
    .filter((o) => allowed.has(o.title))
    .slice(0, 4)
    .map((o) => ({
      label: o.title,
      detail:
        o.structureCount > 0
          ? `${o.structureCount} وحدة · ${o.linkedEmployees} مرتبط`
          : `${o.linkedEmployees} مرتبط`,
    }));

  const groups: LeadershipMapGroup[] = [];

  if (loginItems.length > 0) {
    groups.push({ id: "login_roles", title: "أدوار الدخول", items: loginItems });
  }
  if (unitItems.length > 0) {
    groups.push({ id: "leadership_units", title: "الوحدات القيادية", items: unitItems });
  }
  if (labelItems.length > 0) {
    groups.push({ id: "org_labels", title: "المسميات التنظيمية", items: labelItems });
  }

  return groups;
}

function leadershipHealthMeaning(
  averageScore: number | null,
  risk: RiskLevel,
  pulse: OrgRolesIntelligence["leadershipPulse"],
): string {
  if (averageScore === null) {
    return "أضف موظفين نشطين لقراءة مؤشر القيادة.";
  }
  if (risk === "high") {
    return "الضغط التشغيلي أو الفجوات الهيكلية ترفع المخاطر — ركّز على الربط والمسؤوليات أولاً.";
  }
  if (risk === "medium") {
    return `جاهزية الهيكل ${pulse.structureReadinessPct}% — تحسين متوسط المتابعة يخفف المخاطر خلال أسابيع.`;
  }
  return `توازن مقبول — جاهزية ${pulse.structureReadinessPct}% مع ضغط مهام ${pulse.taskPressureLabel}.`;
}

export function buildLeadershipIndicator(
  healthByEmployee: EmployeeHealthPreview[],
  intel: OrgRolesIntelligence,
): LeadershipIndicatorSnapshot {
  const sorted = [...healthByEmployee].sort((a, b) => a.score - b.score);
  const averageScore =
    healthByEmployee.length > 0
      ? Math.round(
          healthByEmployee.reduce((a, r) => a + r.score, 0) / healthByEmployee.length,
        )
      : null;

  const risk = intel.leadershipPulse.orgRiskLevel;

  return {
    averageScore,
    riskLevel: risk,
    riskLabel: RISK_LABEL_AR[risk],
    businessMeaning: leadershipHealthMeaning(averageScore, risk, intel.leadershipPulse),
    topEmployees: sorted.slice(0, 2).map((e) => ({
      name: e.name,
      score: e.score,
      riskLabel: RISK_LABEL_AR[e.riskLevel],
    })),
  };
}

export function buildExecutiveReading(
  studio: LeadershipStudioPreview,
  plan: PlanSlug,
): ExecutiveReadingModel {
  const { intel } = studio;
  const { summary, leadershipPulse } = intel;

  return {
    status: {
      readinessPct: leadershipPulse.structureReadinessPct,
      riskLevel: leadershipPulse.orgRiskLevel,
      riskLabel: RISK_LABEL_AR[leadershipPulse.orgRiskLevel],
      unlinkedEmployees: summary.unlinkedEmployees,
      unitsWithoutManager: summary.departmentsWithoutManager,
    },
    nowAction: buildExecutiveNowAction(summary),
    healingPriorities: buildHealingPriorities(summary),
    gapCards: buildStructureGapCards(summary),
    mapGroups: buildGroupedLeadershipMap(studio.mapRows, intel, plan),
    indicator: buildLeadershipIndicator(studio.healthByEmployee, intel),
  };
}
