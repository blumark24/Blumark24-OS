// Blumark24 Owner Command Center — layout metadata only.
// Operational values must come from Supabase or show explicit unavailable states.

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Wallet,
  Sparkles,
  Users,
} from "lucide-react";

export type Accent = "cyan" | "blue" | "purple" | "orange" | "green";

export const OWNER_UNAVAILABLE_HINT = "غير متاح بعد";
export const OWNER_READ_ONLY_ACTION = "عرض فقط — غير متاح";
export const OWNER_AI_TRACKING_DISABLED = "لم يتم تفعيل تتبع الاستخدام بعد";
export const OWNER_ACTIVITY_EMPTY = "لا توجد نشاطات مسجّلة بعد";
export const OWNER_WHATSAPP_DISABLED = "لم يتم تفعيل تكامل واتساب بعد";
export const OWNER_MONITORING_DISABLED = "لم يتم ربط مراقبة النظام بعد";

export interface KpiDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: Accent;
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  { id: "orgs",  label: "المنشآت النشطة",           icon: Building2, accent: "cyan"   },
  { id: "mrr",   label: "الاشتراكات الشهرية",       icon: Wallet,    accent: "blue"   },
  { id: "ai",    label: "استخدام الذكاء الاصطناعي", icon: Sparkles,  accent: "purple" },
  { id: "staff", label: "إجمالي موظفي العملاء",      icon: Users,     accent: "green"  },
];

export interface LimitMetric {
  label: string;
  value: string;
}
