// ─────────────────────────────────────────────────────────────────────────────
// Blumark24 Owner Command Center — layout metadata and placeholder-only sections.
// Operational KPI / AI / activity data must come from ownerTruthQueries + Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Wallet,
  Sparkles,
  Users,
} from "lucide-react";

export type Accent = "cyan" | "blue" | "purple" | "orange" | "green";

// ─── 4. KPI cards ────────────────────────────────────────────────────────────

export interface KpiDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
}

/** KPI card layout metadata — values are loaded from Supabase or show unavailable. */
export const KPI_DEFINITIONS: KpiDefinition[] = [
  { id: "orgs",  label: "المنشآت النشطة",           icon: Building2, accent: "cyan"   },
  { id: "mrr",   label: "الاشتراكات الشهرية",       icon: Wallet,    accent: "blue"   },
  { id: "ai",    label: "استخدام الذكاء الاصطناعي", icon: Sparkles,  accent: "purple" },
  { id: "staff", label: "إجمالي موظفي العملاء",      icon: Users,     accent: "green"  },
];

// ─── 5. Organizations ────────────────────────────────────────────────────────

export type OrgStatus = "نشطة" | "معلقة";
export type PlanName = "بسيط" | "نمو" | "متقدم";
export type InvoiceStatus = "مدفوعة" | "متأخرة" | "معلقة";

export interface Organization {
  id: string;
  name: string;
  plan: PlanName;
  status: OrgStatus;
  employees: number;
  aiUsage: number;
  invoice: InvoiceStatus;
}

export const ORGANIZATIONS: Organization[] = [
  { id: "o1", name: "شركة القمة التقنية", plan: "متقدم", status: "نشطة", employees: 87,  aiUsage: 78, invoice: "مدفوعة" },
  { id: "o2", name: "مؤسسة الريادة",       plan: "نمو",   status: "نشطة", employees: 45,  aiUsage: 62, invoice: "مدفوعة" },
  { id: "o3", name: "شركة البناء الحديث",  plan: "متقدم", status: "نشطة", employees: 120, aiUsage: 93, invoice: "متأخرة" },
  { id: "o4", name: "مؤسسة النور",         plan: "بسيط",  status: "معلقة", employees: 15,  aiUsage: 35, invoice: "معلقة"  },
];

// ─── 6. Plans ────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: PlanName;
  audience: string;
  badge: string;
  accent: Accent;
  featured: boolean;
  limits: string[];
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "بسيط",
    audience: "للشركات الناشئة والفرق الصغيرة",
    badge: "Starter",
    accent: "cyan",
    featured: false,
    limits: [
      "حتى 3 موظفين",
      "0 وكالة",
      "إدارة واحدة كحد أقصى",
      "حتى 3 أقسام",
      "ذكاء اصطناعي محدود",
    ],
  },
  {
    id: "growth",
    name: "نمو",
    audience: "للشركات المتوسطة في مرحلة التوسع",
    badge: "Most Popular",
    accent: "blue",
    featured: true,
    limits: [
      "حتى 25 موظف",
      "وكالة واحدة كحد أقصى",
      "حتى 5 إدارات",
      "حتى 20 قسم",
      "ذكاء اصطناعي متوسط",
      "WhatsApp Bot مفعّل",
    ],
  },
  {
    id: "advanced",
    name: "متقدم",
    audience: "للمؤسسات الكبيرة والعمليات المعقّدة",
    badge: "Enterprise",
    accent: "purple",
    featured: false,
    limits: [
      "حتى +100 موظف",
      "وكالات متعددة",
      "إدارات متعددة",
      "أقسام متعددة",
      "ذكاء اصطناعي كامل",
      "WhatsApp Bot كامل",
      "تقارير متقدمة",
    ],
  },
];

// ─── 7. Plan limits preview (owner controls the client's ceiling) ────────────

export interface LimitMetric {
  label: string;
  value: string;
}

export const LIMIT_PREVIEW = {
  client: "شركة المستقبل",
  plan: "نمو" as PlanName,
  metrics: [
    { label: "الموظفين", value: "25 موظف" },
    { label: "الوكالات", value: "1 وكالة" },
    { label: "الإدارات", value: "5 إدارات" },
    { label: "الأقسام", value: "20 قسم" },
    { label: "الذكاء الاصطناعي", value: "متوسط" },
    { label: "WhatsApp Bot", value: "مفعّل" },
  ] satisfies LimitMetric[],
};

// ─── 8. WhatsApp bot (placeholder — Phase 1+ follow-up) ─────────────────────

export const WHATSAPP = {
  status: "نشط",
  session: "متصلة",
  stats: [
    { label: "المحادثات",       value: "2,458" },
    { label: "الردود الناجحة",  value: "2,156" },
    { label: "معدل النجاح",     value: "87.7%" },
  ] satisfies LimitMetric[],
  successRate: 87.7,
};

// ─── 9. System status footer (placeholder — Phase 1+ follow-up) ──────────────

export const SYSTEM_STATUS = {
  headline: "جميع الأنظمة تعمل بشكل طبيعي",
  uptime: "99.9%",
  storageUsedTb: 2.4,
  storageTotalTb: 10,
  activeUsers: 24,
};
