import type { PlanSlug } from "@/lib/features/packageFeatures";
import { checkCanAddStructureLevel, getOrgPlanLimits, type OrgPlanLimits } from "./orgPackageLimits";
import type { Department, StructureLevel } from "./types";

export const BOARD_LABEL_AR = "مجلس الإدارة";

export interface PackageHierarchyCard {
  plan: PlanSlug;
  titleAr: string;
  chainAr: string;
  accent: string;
}

export const PACKAGE_HIERARCHY_CARDS: PackageHierarchyCard[] = [
  {
    plan: "basic",
    titleAr: "بسيط",
    chainAr: "مجلس الإدارة ← قسم ← موظفون",
    accent: "#22d3ee",
  },
  {
    plan: "growth",
    titleAr: "نمو",
    chainAr: "مجلس الإدارة ← إدارة ← قسم ← موظفون",
    accent: "#a855f7",
  },
  {
    plan: "advanced",
    titleAr: "متقدم",
    chainAr: "مجلس الإدارة ← وكالات (حتى 5) ← إدارة ← قسم",
    accent: "#ff7a3d",
  },
];

export const STRUCTURE_LEVEL_LABELS: Record<StructureLevel, string> = {
  agency: "وكالة",
  management: "إدارة",
  department: "قسم",
};

/** Levels enabled per subscription package. */
export function allowedStructureLevels(plan: PlanSlug): StructureLevel[] {
  switch (plan) {
    case "basic":
      return ["department"];
    case "growth":
      return ["management", "department"];
    case "advanced":
      return ["agency", "management", "department"];
    default:
      return ["department"];
  }
}

export function isStructureLevelLocked(plan: PlanSlug, level: StructureLevel): boolean {
  return !allowedStructureLevels(plan).includes(level);
}

export function getLevelFromDepartment(d: Department): StructureLevel {
  const raw = d.structure_level;
  if (raw === "agency" || raw === "management" || raw === "department") return raw;
  return "department";
}

export function validateParentForLevel(
  level: StructureLevel,
  parentId: string | null,
  departments: Department[],
): string | null {
  const parent = parentId ? departments.find((d) => d.id === parentId) : undefined;

  if (level === "agency") {
    if (parentId) return "الوكالة يجب أن تكون تحت مجلس الإدارة مباشرة";
    return null;
  }

  if (level === "management") {
    if (!parentId) return null;
    if (!parent) return "الإدارة الأب غير موجودة";
    const pLevel = getLevelFromDepartment(parent);
    if (pLevel !== "agency") return "الإدارة يجب أن تكون تابعة لوكالة في الباقة المتقدمة، أو بدون أب في باقة النمو";
    return null;
  }

  if (level === "department") {
    if (!parentId) return null;
    if (!parent) return "القسم الأب غير موجود";
    const pLevel = getLevelFromDepartment(parent);
    if (pLevel === "management" || pLevel === "department") return null;
    if (pLevel === "agency") return "القسم يجب أن يكون تحت إدارة وليس وكالة مباشرة";
    return "تبعية غير صالحة للقسم";
  }

  return null;
}

/** Whether a new node of `level` can be added given plan + existing tree. */
export function canCreateStructureLevel(
  plan: PlanSlug,
  level: StructureLevel,
  departments: Department[],
  limits?: OrgPlanLimits,
): { allowed: boolean; reason?: string } {
  if (isStructureLevelLocked(plan, level)) {
    return {
      allowed: false,
      reason: `مستوى «${STRUCTURE_LEVEL_LABELS[level]}» غير متاح في باقة ${plan === "basic" ? "بسيط" : plan === "growth" ? "نمو" : "متقدم"}. قم بالترقية لفتحه.`,
    };
  }

  const capCheck = checkCanAddStructureLevel(
    limits ?? getOrgPlanLimits(plan),
    level,
    departments,
  );
  if (!capCheck.allowed) {
    return { allowed: false, reason: capCheck.message };
  }

  return { allowed: true };
}

export function inferDefaultParentId(
  plan: PlanSlug,
  level: StructureLevel,
  departments: Department[],
): string | null {
  if (level === "agency") return null;
  if (level === "management") {
    if (plan === "advanced") {
      const agency = departments.find((d) => getLevelFromDepartment(d) === "agency");
      return agency?.id ?? null;
    }
    return null;
  }
  if (level === "department") {
    const mgmt = departments
      .filter((d) => getLevelFromDepartment(d) === "management")
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    if (mgmt) return mgmt.id;
    if (plan === "basic") return null;
    const agency = departments.find((d) => getLevelFromDepartment(d) === "agency");
    return agency?.id ?? null;
  }
  return null;
}

export const ORG_ROLE_DEFINITIONS = [
  {
    title: "مدير مجلس الإدارة / صاحب المنشأة",
    desc: "اعتماد الهيكل والسياسات العليا",
    color: "#22d3ee",
  },
  {
    title: "عضو مجلس إدارة",
    desc: "إشراف استراتيجي ومتابعة مؤشرات الأداء",
    color: "#1e6fd9",
  },
  {
    title: "مدير وكالة",
    desc: "قيادة الوكالة وأهدافها التشغيلية",
    color: "#ff7a3d",
  },
  {
    title: "مدير إدارة",
    desc: "إدارة الأقسام والفرق ضمن الإدارة",
    color: "#a855f7",
  },
  {
    title: "رئيس قسم",
    desc: "تشغيل القسم وتوزيع المهام",
    color: "#10b981",
  },
  {
    title: "موظف",
    desc: "تنفيذ المهام ضمن القسم أو الفريق",
    color: "#8ba3c7",
  },
] as const;


export const TENANT_ORG_ROLE_DEFINITIONS = [
  {
    title: "مدير المنشأة",
    desc: "اعتماد الهيكل وإدارة المنشأة والصلاحيات",
    color: "#22d3ee",
  },
  {
    title: "مدير مالي",
    desc: "متابعة المالية والتقارير ضمن المنشأة",
    color: "#f59e0b",
  },
  {
    title: "رئيس قسم",
    desc: "قيادة القسم والفرق التابعة له",
    color: "#a855f7",
  },
  {
    title: "موظف",
    desc: "تنفيذ المهام ضمن القسم أو الفريق",
    color: "#8ba3c7",
  },
] as const;

export function getOrgRoleDefinitions(isInternal: boolean) {
  return isInternal ? ORG_ROLE_DEFINITIONS : TENANT_ORG_ROLE_DEFINITIONS;
}

export function rulesForPlan(plan: PlanSlug): string[] {
  const levels = allowedStructureLevels(plan);
  const lines = [
    `باقتك الحالية: ${plan === "basic" ? "بسيط" : plan === "growth" ? "نمو" : "متقدم"}`,
    `المستويات المتاحة: ${levels.map((l) => STRUCTURE_LEVEL_LABELS[l]).join(" · ")}`,
    "مجلس الإدارة ثابت ويمثل قمة الهيكل لمنشأتك.",
    "الموظفون يُربطون بالأقسام والفرق ويُحفظون في قاعدة البيانات.",
  ];
  if (plan === "basic") {
    lines.push("باقة بسيط: أضف أقساماً مباشرة تحت المجلس ثم عيّن الموظفين.");
  }
  if (plan === "growth") {
    lines.push("باقة نمو: أنشئ إدارات ثم أقساماً تحتها.");
  }
  if (plan === "advanced") {
    lines.push("باقة متقدم: حتى 5 وكالات، 20 إدارة، 50 قسم.");
    lines.push("يمكنك إضافة أكثر من وكالة تحت مجلس الإدارة.");
  }
  if (plan === "growth") {
    lines.push("حدود باقة نمو: 5 إدارات، 15 قسمًا.");
  }
  if (plan === "basic") {
    lines.push("حدود الباقة البسيطة: 3 أقسام تحت المجلس مباشرة.");
  }
  if (plan !== "advanced") {
    lines.push("مستوى «وكالة» مقفل — ترقية للباقة المتقدمة.");
  }
  if (plan === "basic") {
    lines.push("مستوى «إدارة» مقفل — ترقية لباقة نمو أو أعلى.");
  }
  return lines;
}
