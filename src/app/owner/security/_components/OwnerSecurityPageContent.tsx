"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ScrollText,
  RefreshCw,
  Download,
  Search,
  AlertTriangle,
  Trash2,
  PauseCircle,
  XCircle,
  Layers,
  X,
  Copy,
  CheckCheck,
  Clock,
  Info,
  Activity,
  Building2,
  CreditCard,
  Package,
  Shield,
  Settings2,
  Zap,
  Brain,
  HeadphonesIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Navigation,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  Users,
  FileText,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchAuditCenterLogs,
  fetchOwnerAuditLogCount,
  fetchOrgStatusSummary,
  fetchSubStatusSummary,
  type AuditLog,
  type OrgStatusSummary,
  type SubStatusSummary,
} from "../../_lib/ownerTruthQueries";

// ─── Severity ──────────────────────────────────────────────────────────────────

type Severity = "low" | "medium" | "high" | "critical";

const CRITICAL_ACTIONS = new Set([
  "subscription_hard_deleted", "organization_deleted", "owner_access_changed",
  "security_breach", "failed_owner_auth", "repeated_failed_operations",
]);
const HIGH_ACTIONS = new Set([
  "subscription_suspended", "subscription_cancelled", "subscription_canceled",
  "organization_suspended", "suspend_organization", "soft_delete_organization",
]);
const MEDIUM_ACTIONS = new Set([
  "subscription_created", "create_subscription", "subscription_plan_changed",
  "change_subscription_plan", "plan_created", "create_plan", "change_plan",
  "activate_subscription", "reactivate_organization", "create_organization",
  "reset_client_password", "create_client_login",
]);

function getSeverity(action: string): Severity {
  if (CRITICAL_ACTIONS.has(action)) return "critical";
  if (HIGH_ACTIONS.has(action)) return "high";
  if (MEDIUM_ACTIONS.has(action)) return "medium";
  return "low";
}

const SEV: Record<Severity, {
  label: string; badge: string; dot: string; bar: string; color: string;
}> = {
  low: {
    label: "منخفض",
    badge: "bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20",
    dot: "bg-[#22d3ee]",
    bar: "bg-[#22d3ee]",
    color: "#22d3ee",
  },
  medium: {
    label: "متوسط",
    badge: "bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20",
    dot: "bg-[#a855f7]",
    bar: "bg-[#a855f7]",
    color: "#a855f7",
  },
  high: {
    label: "عالٍ",
    badge: "bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
    bar: "bg-[#f59e0b]",
    color: "#f59e0b",
  },
  critical: {
    label: "حرج",
    badge: "bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
    bar: "bg-[#ef4444]",
    color: "#ef4444",
  },
};

// ─── Action labels ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  subscription_created:       "إنشاء اشتراك",
  create_subscription:        "إنشاء اشتراك",
  subscription_plan_changed:  "تغيير باقة اشتراك",
  change_subscription_plan:   "تغيير باقة اشتراك",
  subscription_suspended:     "تعليق اشتراك",
  subscription_cancelled:     "إلغاء اشتراك",
  subscription_canceled:      "إلغاء اشتراك",
  subscription_hard_deleted:  "حذف نهائي لاشتراك",
  plan_created:               "إنشاء باقة",
  create_plan:                "إنشاء باقة",
  plan_updated:               "تعديل باقة",
  change_plan:                "تغيير الباقة",
  plan_deleted:               "حذف باقة",
  organization_created:       "إنشاء منشأة",
  create_organization:        "إنشاء منشأة",
  organization_suspended:     "تعليق منشأة",
  suspend_organization:       "تعليق منشأة",
  reactivate_organization:    "إعادة تفعيل منشأة",
  update_organization:        "تحديث منشأة",
  soft_delete_organization:   "حذف منشأة",
  activate_subscription:      "تفعيل اشتراك",
  create_client_login:        "إنشاء حساب عميل",
  reset_client_password:      "إعادة تعيين كلمة مرور",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? "عملية غير مصنفة";
}

// ─── Target type labels ────────────────────────────────────────────────────────

const TARGET_TYPE_LABELS: Record<string, string> = {
  subscription: "اشتراك",
  organization: "منشأة",
  plan: "باقة",
  user: "مستخدم",
  system: "النظام",
};

function targetTypeLabel(t: string | null) {
  if (!t) return "—";
  return TARGET_TYPE_LABELS[t] ?? t;
}

// ─── Time helpers ──────────────────────────────────────────────────────────────

function fmtDatetime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return `منذ ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} س`;
    return `منذ ${Math.floor(h / 24)} يوم`;
  } catch { return ""; }
}

function isToday(iso: string): boolean {
  const d = new Date(iso), now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function exportToCsv(logs: AuditLog[]) {
  const headers = ["ID", "المالك", "العملية", "التسمية", "نوع الهدف", "معرف الهدف", "الخطورة", "التوقيت"];
  const rows = logs.map((l) => [
    l.id, l.ownerEmail, l.action, actionLabel(l.action),
    l.targetType ?? "", l.targetId ?? "", getSeverity(l.action), l.createdAt,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Intelligence Engine ───────────────────────────────────────────────────────

interface DiagnosisResult {
  riskLevel: Severity;
  summary: string;
  flags: { label: string; severity: Severity; detail: string }[];
}

interface Recommendation {
  title: string;
  detail: string;
  priority: "urgent" | "normal" | "low";
  href?: string;
}

interface DailyBrief {
  totalToday: number;
  criticalToday: number;
  highToday: number;
  topAction: string | null;
  hasAnomaly: boolean;
  anomalyNote: string | null;
}

function computeDiagnosis(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
): DiagnosisResult {
  const flags: DiagnosisResult["flags"] = [];

  const hardDeletes = logs.filter((l) => l.action === "subscription_hard_deleted").length;
  if (hardDeletes > 0) {
    flags.push({
      label: "حذف نهائي للاشتراكات",
      severity: "critical",
      detail: `تم تسجيل ${hardDeletes} عملية حذف نهائي — يُنصح بمراجعة السجل الكامل`,
    });
  }

  const criticalCount = logs.filter((l) => getSeverity(l.action) === "critical").length;
  if (criticalCount > 3) {
    flags.push({
      label: "تركّز عالٍ من الأحداث الحرجة",
      severity: "critical",
      detail: `${criticalCount} حدث حرج مسجل — يستوجب مراجعة فورية`,
    });
  }

  if (orgSummary.suspended > 0) {
    flags.push({
      label: "منشآت معلّقة",
      severity: "high",
      detail: `${orgSummary.suspended} منشأة في حالة تعليق حالياً`,
    });
  }

  if (subSummary.cancelled > 0) {
    flags.push({
      label: "اشتراكات ملغاة",
      severity: "high",
      detail: `${subSummary.cancelled} اشتراك ملغى — يمكن مراجعة سبب الإلغاء`,
    });
  }

  const planChanges = logs.filter((l) =>
    ["change_plan", "change_subscription_plan", "subscription_plan_changed"].includes(l.action)
  ).length;
  if (planChanges > 5) {
    flags.push({
      label: "تغييرات متكررة على الباقات",
      severity: "medium",
      detail: `${planChanges} تغيير باقة — قد يشير إلى عدم استقرار في التسعير`,
    });
  }

  if (orgSummary.deleted > 0) {
    flags.push({
      label: "منشآت محذوفة",
      severity: "high",
      detail: `${orgSummary.deleted} منشأة محذوفة من قاعدة البيانات`,
    });
  }

  const highCount = logs.filter((l) => getSeverity(l.action) === "high").length;
  const riskLevel: Severity =
    flags.some((f) => f.severity === "critical") ? "critical"
    : flags.some((f) => f.severity === "high") ? "high"
    : highCount > 2 ? "medium"
    : "low";

  const summaryMap: Record<Severity, string> = {
    critical: "يوجد مؤشرات خطرة تستوجب تدخلاً فورياً",
    high: "يوجد أحداث عالية الخطورة تحتاج مراجعة",
    medium: "الوضع يحتاج متابعة — لا يوجد خطر فوري",
    low: "الوضع مستقر — لا توجد مؤشرات مثيرة للقلق",
  };

  return { riskLevel, summary: summaryMap[riskLevel], flags };
}

function generateRecommendations(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (logs.filter((l) => l.action === "subscription_hard_deleted").length > 0) {
    recs.push({
      title: "مراجعة الحذف النهائي",
      detail: "تأكد من أن عمليات الحذف النهائي تمت بموافقة وتوثيق رسمي",
      priority: "urgent",
      href: "/owner/subscriptions",
    });
  }

  if (orgSummary.suspended > 0) {
    recs.push({
      title: "متابعة المنشآت المعلّقة",
      detail: `راجع ${orgSummary.suspended} منشأة معلّقة وقرر إعادة التفعيل أو الحذف`,
      priority: "urgent",
      href: "/owner/organizations",
    });
  }

  if (subSummary.suspended > 0) {
    recs.push({
      title: "مراجعة الاشتراكات المعلّقة",
      detail: `${subSummary.suspended} اشتراك معلّق — تواصل مع العملاء لحل المشكلة`,
      priority: "normal",
      href: "/owner/subscriptions",
    });
  }

  if (subSummary.trialing > 0) {
    recs.push({
      title: "تحويل حسابات التجربة",
      detail: `${subSummary.trialing} حساب في فترة تجريبية — الاتصال بهم يرفع معدل التحويل`,
      priority: "normal",
      href: "/owner/subscriptions",
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: "الوضع مستقر",
      detail: "لا توجد توصيات طارئة — استمر في المراقبة الدورية",
      priority: "low",
    });
  }

  return recs;
}

function computeDailyBrief(logs: AuditLog[]): DailyBrief {
  const todayLogs = logs.filter((l) => isToday(l.createdAt));
  const criticalToday = todayLogs.filter((l) => getSeverity(l.action) === "critical").length;
  const highToday = todayLogs.filter((l) => getSeverity(l.action) === "high").length;

  const actionCounts: Record<string, number> = {};
  for (const l of todayLogs) {
    actionCounts[l.action] = (actionCounts[l.action] ?? 0) + 1;
  }
  const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const hasAnomaly = criticalToday > 0 || highToday > 3;
  const anomalyNote =
    criticalToday > 0 ? `تم تسجيل ${criticalToday} أحداث حرجة اليوم — يستوجب المراجعة الفورية`
    : highToday > 3   ? `${highToday} أحداث عالية الخطورة اليوم — غير طبيعي`
    : null;

  return { totalToday: todayLogs.length, criticalToday, highToday, topAction, hasAnomaly, anomalyNote };
}

function answerQuestion(
  id: string,
  logs: AuditLog[],
  diag: DiagnosisResult,
  brief: DailyBrief,
  sub: SubStatusSummary,
  org: OrgStatusSummary,
): string {
  if (logs.length === 0) return "البيانات غير كافية للتشخيص الكامل — لا توجد سجلات تدقيق محملة.";

  switch (id) {
    case "risk":
      return diag.flags.length > 0
        ? `مستوى الخطر الحالي: ${SEV[diag.riskLevel].label}. ${diag.summary}. المؤشرات: ${diag.flags.map((f) => f.label).join("، ")}.`
        : "الوضع مستقر — لا توجد مؤشرات خطر فعّالة في السجلات المحملة.";
    case "today":
      return brief.totalToday === 0
        ? "لم تُسجَّل أي عملية اليوم حتى الآن."
        : `اليوم: ${brief.totalToday} عملية — ${brief.criticalToday} حرجة، ${brief.highToday} عالية الخطورة.${brief.anomalyNote ? " ⚠️ " + brief.anomalyNote : ""}`;
    case "customers":
      return `المنشآت: ${org.total} (نشطة ${org.active}، معلّقة ${org.suspended}، محذوفة ${org.deleted}). الاشتراكات: ${sub.total} (نشطة ${sub.active}، ملغاة ${sub.cancelled}، تجريبية ${sub.trialing}).`;
    case "priority":
      return diag.flags.length > 0
        ? `أعلى أولوية: ${diag.flags[0].label} — ${diag.flags[0].detail}`
        : "لا توجد أولويات طارئة حالياً.";
    case "harddelete":
      {
        const hdCount = logs.filter((l) => l.action === "subscription_hard_deleted").length;
        return hdCount === 0
          ? "لا توجد أي عمليات حذف نهائي في السجلات المحملة."
          : `تم تسجيل ${hdCount} عملية حذف نهائي. يُنصح بمراجعة كل حالة وتوثيق مبرراتها.`;
      }
    case "brief":
      return brief.totalToday === 0
        ? "لا توجد عمليات اليوم. النظام هادئ."
        : `ملخص اليوم: ${brief.totalToday} عملية، أكثر إجراء: "${brief.topAction ? actionLabel(brief.topAction) : "—"}". ${brief.hasAnomaly ? "⚠️ يوجد نشاط غير طبيعي." : "الوضع طبيعي."}`;
    default:
      return "غير معروف.";
  }
}

// ─── Preset questions ──────────────────────────────────────────────────────────

const PRESET_QUESTIONS = [
  { id: "risk",       label: "ما مستوى الخطر الحالي؟" },
  { id: "today",      label: "ماذا حدث اليوم؟" },
  { id: "customers",  label: "ما حالة المنشآت والاشتراكات؟" },
  { id: "priority",   label: "ما أعلى أولوية الآن؟" },
  { id: "harddelete", label: "هل يوجد حذف نهائي؟" },
  { id: "brief",      label: "أعطني ملخصاً سريعاً لليوم" },
];

// ─── Support categories ────────────────────────────────────────────────────────

interface SupportCategory {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  symptoms: string[];
  checks: string[];
  action: string;
  href?: string;
}

const SUPPORT_CATS: SupportCategory[] = [
  {
    id: "login",
    icon: Shield,
    label: "مشكلة تسجيل الدخول",
    color: "#22d3ee",
    symptoms: ["العميل لا يستطيع الدخول", "كلمة المرور لا تعمل", "الحساب مقفل"],
    checks: ["تحقق من وجود الحساب في قسم المنشآت", "تحقق من حالة الاشتراك (نشط/معلق)", "تحقق من سجل إعادة تعيين كلمة المرور"],
    action: "إعادة تعيين كلمة مرور العميل",
    href: "/owner/organizations",
  },
  {
    id: "subscription",
    icon: CreditCard,
    label: "مشكلة الاشتراك",
    color: "#0ea5e9",
    symptoms: ["الاشتراك معلق", "انتهى الاشتراك", "لا يستطيع الوصول للمميزات"],
    checks: ["افتح قسم الاشتراكات وابحث عن المنشأة", "تحقق من تاريخ الانتهاء والحالة", "تحقق من الباقة المرتبطة بالاشتراك"],
    action: "تفعيل أو تجديد الاشتراك",
    href: "/owner/subscriptions",
  },
  {
    id: "billing",
    icon: FileText,
    label: "استفسار فاتورة",
    color: "#a855f7",
    symptoms: ["العميل لا يرى فاتورته", "خطأ في مبلغ الفاتورة", "طلب إيصال"],
    checks: ["افتح قسم الفواتير وابحث بمعرف المنشأة", "تحقق من دورة الفوترة (شهرية/سنوية)", "تحقق من سعر الباقة المفعّلة"],
    action: "مراجعة الفواتير",
    href: "/owner/invoices",
  },
  {
    id: "permissions",
    icon: Shield,
    label: "مشكلة الصلاحيات",
    color: "#f59e0b",
    symptoms: ["العميل لا يرى بعض الأقسام", "تظهر رسالة 'غير مصرح'", "ميزات مقفلة"],
    checks: ["تحقق من الباقة المفعّلة وحدودها", "تحقق من أدوار المستخدمين في المنشأة", "تحقق من إعدادات الصلاحيات في قسم الأدوار"],
    action: "مراجعة الصلاحيات والأدوار",
    href: "/owner/roles",
  },
  {
    id: "data",
    icon: Activity,
    label: "مشكلة البيانات",
    color: "#10b981",
    symptoms: ["بيانات مفقودة", "أرقام غير صحيحة", "تقارير فارغة"],
    checks: ["تحقق من السجل الزمني للعمليات على المنشأة", "تحقق من آخر عملية تعديل في سجل التدقيق", "البيانات غير كافية للتشخيص الكامل دون معرف المنشأة"],
    action: "مراجعة سجل التدقيق للمنشأة",
  },
  {
    id: "performance",
    icon: Wifi,
    label: "بطء أو انقطاع",
    color: "#ef4444",
    symptoms: ["النظام بطيء", "الصفحات لا تُحمَّل", "انتهاء مهلة الاتصال"],
    checks: ["تحقق من حالة Supabase في لوحة التحكم", "تحقق من سجلات الأخطاء في مركز التدقيق", "تحقق من نشاط غير طبيعي في وقت المشكلة"],
    action: "فحص سجلات النظام",
  },
  {
    id: "users",
    icon: Users,
    label: "إدارة المستخدمين",
    color: "#c084fc",
    symptoms: ["إضافة موظف جديد", "حذف حساب موظف", "تغيير بيانات مستخدم"],
    checks: ["افتح المنشأة المعنية في قسم المنشآت", "تحقق من عدد المستخدمين مقابل حد الباقة", "سجّل العملية في سجل التدقيق بعد التنفيذ"],
    action: "إدارة المنشآت",
    href: "/owner/organizations",
  },
];

// ─── Digital Twin Orbit Map ────────────────────────────────────────────────────

type TargetFilter = "all" | "subscription" | "organization" | "plan" | "user" | "system";

function OrbitMap({
  subChanges, planChanges, deleteOps, criticalCount, todayCount, orgOps,
  onNodeClick,
}: {
  subChanges: number; planChanges: number; deleteOps: number;
  criticalCount: number; todayCount: number; orgOps: number;
  onNodeClick?: (filter: TargetFilter) => void;
}) {
  const nodes: {
    label: string; icon: React.ElementType; color: string;
    count: number; left: number; top: number; filter: TargetFilter;
  }[] = [
    { label: "الاشتراكات", icon: CreditCard, color: "#22d3ee", count: subChanges,    left: 50, top: 8,  filter: "subscription" },
    { label: "الباقات",    icon: Package,    color: "#a855f7", count: planChanges,   left: 83, top: 27, filter: "plan" },
    { label: "المنشآت",   icon: Building2,  color: "#10b981", count: orgOps,        left: 83, top: 66, filter: "organization" },
    { label: "الحذف",     icon: Trash2,     color: "#ef4444", count: deleteOps,     left: 50, top: 84, filter: "all" },
    { label: "الصلاحيات", icon: Shield,     color: "#f59e0b", count: criticalCount, left: 17, top: 66, filter: "system" },
    { label: "النظام",    icon: Settings2,  color: "#0ea5e9", count: todayCount,    left: 17, top: 27, filter: "all" },
  ];

  return (
    <div className="relative w-full" style={{ height: 280 }}>
      <div className="absolute rounded-full border border-dashed border-[#22d3ee]/10" style={{ inset: "8%" }} />
      <div className="absolute rounded-full border border-[#22d3ee]/06" style={{ inset: "30%" }} />

      {nodes.map((n, i) => {
        const cx = 50, cy = 46;
        const dx = n.left - cx, dy = n.top - cy;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${cx}%`, top: `${cy}%`,
              width: `${len * 0.78}%`, height: 1,
              background: `linear-gradient(90deg, rgba(34,211,238,0.25), rgba(34,211,238,0.04))`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "0 50%",
            }}
          />
        );
      })}

      <div
        className="absolute flex flex-col items-center justify-center rounded-full border border-[#22d3ee]/25 bg-gradient-to-br from-[#0d1e3a] to-[#07111f]"
        style={{
          left: "50%", top: "46%",
          transform: "translate(-50%, -50%)",
          width: 76, height: 76,
          boxShadow: "0 0 0 8px rgba(34,211,238,0.04), 0 0 30px rgba(34,211,238,0.12)",
        }}
      >
        <ShieldCheck size={20} className="text-[#22d3ee]" />
        <span className="text-[8.5px] font-bold text-[#22d3ee]/70 mt-0.5 tracking-wide">BLUMARK</span>
      </div>

      {nodes.map((n, i) => {
        const Icon = n.icon;
        const isAlert = n.count > 0 && (n.color === "#ef4444" || n.color === "#f59e0b");
        return (
          <button
            key={i}
            type="button"
            onClick={() => onNodeClick?.(n.filter)}
            className="absolute flex flex-col items-center gap-1 hover:scale-110 transition-transform cursor-pointer"
            style={{ left: `${n.left}%`, top: `${n.top}%`, transform: "translate(-50%, -50%)" }}
          >
            <div
              className="rounded-xl flex items-center justify-center"
              style={{
                width: 38, height: 38,
                background: `${n.color}10`,
                border: `1px solid ${n.color}30`,
                boxShadow: isAlert ? `0 0 12px ${n.color}30` : undefined,
              }}
            >
              <Icon size={15} style={{ color: n.color }} />
            </div>
            <span className="text-[9px] font-medium text-white/50 whitespace-nowrap">{n.label}</span>
            {n.count > 0 && (
              <span className="text-[9px] font-bold" style={{ color: n.color }}>{n.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color = "#22d3ee", loading,
}: {
  label: string; value: number | string;
  icon: React.ElementType; color?: string; loading?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:from-white/[0.06] transition-all duration-200"
      style={{ borderColor: `${color}22`, boxShadow: `0 0 0 1px ${color}18, 0 4px 24px rgba(0,0,0,0.3)` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <Activity size={11} style={{ color: `${color}40` }} />
        </div>
        {loading ? (
          <div className="h-7 w-12 rounded-lg bg-white/[0.08] animate-pulse mb-1" />
        ) : (
          <p className="text-[24px] font-bold text-white leading-none mb-1">{value}</p>
        )}
        <p className="text-[11px] text-white/40 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── Overall Risk Badge ────────────────────────────────────────────────────────

function OverallRiskBadge({ logs }: { logs: AuditLog[] }) {
  const crit = logs.filter((l) => getSeverity(l.action) === "critical").length;
  const high = logs.filter((l) => getSeverity(l.action) === "high").length;
  const level: Severity = crit > 0 ? "critical" : high > 2 ? "high" : high > 0 ? "medium" : "low";
  const s = SEV[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold", s.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", s.dot)} />
      مستوى المخاطر: {s.label}
    </span>
  );
}

// ─── Risk Card ────────────────────────────────────────────────────────────────

function RiskCard({
  icon: Icon, label, count, color, empty,
}: {
  icon: React.ElementType; label: string;
  count: number; color: string; empty?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 border bg-gradient-to-br from-white/[0.03] to-transparent"
      style={{ borderColor: count > 0 ? `${color}25` : "rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon size={14} style={{ color }} />
        </div>
        {count > 0 && <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: color }} />}
      </div>
      <p className="text-[11.5px] font-medium text-white/60 mb-2">{label}</p>
      {count === 0 ? (
        <p className="text-[10.5px] text-white/25">{empty ?? "لا توجد أحداث"}</p>
      ) : (
        <p className="text-[26px] font-bold leading-none" style={{ color }}>{count}</p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-white/[0.03]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-5">
          <div className="h-6 w-[3px] rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-40 rounded bg-white/[0.06]" />
            <div className="h-2.5 w-28 rounded bg-white/[0.04]" />
          </div>
          <div className="hidden md:block h-3 w-24 rounded bg-white/[0.04]" />
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="hidden lg:block h-3 w-16 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const sev = getSeverity(log.action);
  const s = SEV[sev];

  function copyId() {
    void navigator.clipboard.writeText(log.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const accentColor = s.color;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d1e3a 0%, #07111f 100%)",
          border: `1px solid ${accentColor}28`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0 animate-pulse", s.dot)} />
            <div>
              <p className="text-[14.5px] font-semibold text-white">{actionLabel(log.action)}</p>
              <p className="text-[11px] text-white/40 mt-0.5 font-mono">{fmtDatetime(log.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[11px] rounded-full px-2.5 py-0.5 font-medium", s.badge)}>{s.label}</span>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[68vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {([
              ["العملية (action)", log.action],
              ["الخطورة", s.label],
              ["المالك", log.ownerEmail],
              ["نوع الهدف", targetTypeLabel(log.targetType)],
              ["معرف الهدف", log.targetId ?? "—"],
              ["المنشأة", (log.metadata.organization_id as string | undefined) ?? "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] text-white/30 mb-0.5">{k}</p>
                <p className="text-[12px] text-white/75 break-all">{v}</p>
              </div>
            ))}
          </div>

          {Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-[10.5px] text-white/30 mb-1.5 font-mono uppercase tracking-widest">Metadata</p>
              <pre className="rounded-xl border border-[#22d3ee]/10 bg-[#22d3ee]/[0.03] px-3.5 py-3 text-[11.5px] text-[#22d3ee]/70 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[10px] text-white/30 font-mono truncate">{log.id}</p>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 text-[11px] text-[#22d3ee]/60 hover:text-[#22d3ee] transition-colors flex-shrink-0"
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? "تم النسخ" : "نسخ ID"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

type TimeRange = "today" | "7d" | "30d" | "all";
type SeverityFilter = "all" | Severity;

const TIME_OPTS: { key: TimeRange; label: string }[] = [
  { key: "all",   label: "الكل"   },
  { key: "today", label: "اليوم"  },
  { key: "7d",    label: "٧ أيام" },
  { key: "30d",   label: "٣٠ يوم" },
];

const TARGET_OPTS: { key: TargetFilter; label: string }[] = [
  { key: "all",          label: "جميع الأنواع" },
  { key: "subscription", label: "اشتراك"       },
  { key: "organization", label: "منشأة"        },
  { key: "plan",         label: "باقة"         },
  { key: "user",         label: "مستخدم"       },
  { key: "system",       label: "النظام"       },
];

const SEV_OPTS: { key: SeverityFilter; label: string }[] = [
  { key: "all",      label: "جميع المستويات" },
  { key: "critical", label: "حرج"            },
  { key: "high",     label: "عالٍ"           },
  { key: "medium",   label: "متوسط"          },
  { key: "low",      label: "منخفض"          },
];

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "monitoring" | "diagnosis" | "support" | "logs";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "monitoring", label: "المراقبة",        icon: Eye       },
  { id: "diagnosis",  label: "التشخيص الذكي",  icon: Brain     },
  { id: "support",    label: "الدعم الفني",     icon: HeadphonesIcon },
  { id: "logs",       label: "السجلات",         icon: ScrollText },
];

// ─── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

export default function OwnerSecurityPageContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [orgSummary, setOrgSummary] = useState<OrgStatusSummary>({ total: 0, active: 0, suspended: 0, deleted: 0 });
  const [subSummary, setSubSummary] = useState<SubStatusSummary>({ total: 0, active: 0, cancelled: 0, suspended: 0, trialing: 0 });

  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [expandedSupport, setExpandedSupport] = useState<string | null>(null);

  const load = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setError(null); setOffset(0); }
    else setLoadingMore(true);
    const currentOffset = reset ? 0 : offset;
    try {
      const [rows, count] = await Promise.all([
        fetchAuditCenterLogs(PAGE_SIZE, currentOffset),
        reset ? fetchOwnerAuditLogCount() : Promise.resolve(null),
      ]);
      if (reset) {
        setLogs(rows);
        if (count !== null) setTotalCount(count);
      } else {
        setLogs((prev) => [...prev, ...rows]);
        setOffset(currentOffset + rows.length);
      }
      setHasMore(rows.length === PAGE_SIZE);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    void load(true);
    void Promise.all([fetchOrgStatusSummary(), fetchSubStatusSummary()]).then(([org, sub]) => {
      setOrgSummary(org);
      setSubSummary(sub);
      setLoadingMeta(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filters
  const filtered = useMemo(() => {
    let result = logs;
    if (timeRange !== "all") {
      const now = Date.now();
      const cutoff =
        timeRange === "today" ? new Date().setHours(0, 0, 0, 0)
        : timeRange === "7d"  ? now - 7 * 86400000
        :                        now - 30 * 86400000;
      result = result.filter((l) => new Date(l.createdAt).getTime() >= cutoff);
    }
    if (targetFilter !== "all") result = result.filter((l) => l.targetType === targetFilter);
    if (sevFilter !== "all") result = result.filter((l) => getSeverity(l.action) === sevFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((l) =>
        l.action.toLowerCase().includes(q) ||
        actionLabel(l.action).includes(q) ||
        l.ownerEmail.toLowerCase().includes(q) ||
        (l.targetType ?? "").includes(q) ||
        (l.targetId ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, timeRange, targetFilter, sevFilter, search]);

  // KPI counts
  const todayCount    = useMemo(() => logs.filter((l) => isToday(l.createdAt)).length, [logs]);
  const subChanges    = useMemo(() => logs.filter((l) => l.targetType === "subscription").length, [logs]);
  const planChanges   = useMemo(() => logs.filter((l) =>
    ["create_plan", "change_plan", "plan_created", "plan_updated", "plan_deleted"].includes(l.action)
  ).length, [logs]);
  const deleteOps     = useMemo(() => logs.filter((l) => CRITICAL_ACTIONS.has(l.action)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => getSeverity(l.action) === "critical").length, [logs]);
  const orgOps        = useMemo(() => logs.filter((l) => l.targetType === "organization").length, [logs]);

  // Risk counts
  const hardDeletes   = useMemo(() => logs.filter((l) => l.action === "subscription_hard_deleted").length, [logs]);
  const cancelledSubs = useMemo(() => logs.filter((l) =>
    ["subscription_cancelled", "subscription_canceled"].includes(l.action)
  ).length, [logs]);
  const suspendedSubs = useMemo(() => logs.filter((l) => l.action === "subscription_suspended").length, [logs]);
  const planSwaps     = useMemo(() => logs.filter((l) =>
    ["change_subscription_plan", "subscription_plan_changed", "change_plan"].includes(l.action)
  ).length, [logs]);

  // Intelligence
  const diagnosis     = useMemo(() => computeDiagnosis(logs, orgSummary, subSummary), [logs, orgSummary, subSummary]);
  const recommendations = useMemo(() => generateRecommendations(logs, orgSummary, subSummary), [logs, orgSummary, subSummary]);
  const dailyBrief    = useMemo(() => computeDailyBrief(logs), [logs]);

  const questionAnswer = useMemo(() => {
    if (!activeQuestion) return null;
    return answerQuestion(activeQuestion, logs, diagnosis, dailyBrief, subSummary, orgSummary);
  }, [activeQuestion, logs, diagnosis, dailyBrief, subSummary, orgSummary]);

  const filtersActive = timeRange !== "all" || targetFilter !== "all" || sevFilter !== "all" || search.trim() !== "";

  function resetFilters() {
    setSearch(""); setTimeRange("all"); setTargetFilter("all"); setSevFilter("all");
  }

  function handleNodeClick(filter: TargetFilter) {
    setTargetFilter(filter);
    setActiveTab("logs");
  }

  return (
    <div className="relative max-w-6xl mx-auto space-y-5">
      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          zIndex: 0,
        }}
      />

      {/* ── Hero Command Header ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/15 bg-gradient-to-br from-[#0d1f3c] via-[#091528] to-[#07111f]"
        style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.07), 0 8px 40px rgba(0,0,0,0.6)" }}
      >
        <div
          className="absolute -top-16 -left-8 w-64 h-64 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)" }}
        />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/08 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
              <span className="text-[11px] font-medium text-[#22d3ee]/80 tracking-wide">النظام تحت المراقبة</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  boxShadow: "0 0 20px rgba(34,211,238,0.1)",
                }}
              >
                <ShieldCheck size={20} className="text-[#22d3ee]" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-white tracking-tight">مركز التدقيق والمراقبة</h1>
                <p className="text-[12px] text-white/40 mt-0.5">
                  غرفة تحكم رقمية — مراقبة، تشخيص ذكي، دعم فني، وسجلات التدقيق
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {!loading && <OverallRiskBadge logs={logs} />}
              {!loading && (
                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <Clock size={11} />
                  {fmtDatetime(lastRefresh.toISOString())}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => exportToCsv(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/55 text-[12.5px] px-3.5 py-2.5 hover:bg-white/[0.07] transition-colors disabled:opacity-30"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
            <button
              onClick={() => void load(true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee] text-[12.5px] px-3.5 py-2.5 hover:bg-[#22d3ee]/15 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all",
                isActive
                  ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#22d3ee]/12 to-transparent border border-[rgba(34,211,238,0.22)] text-white shadow-[0_2px_10px_-4px_rgba(34,211,238,0.30)]"
                  : "text-white/40 hover:text-white/60 border border-transparent",
              )}
            >
              <Icon size={13} className={isActive ? "text-[#22d3ee]" : "text-white/30"} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MONITORING                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "monitoring" && (
        <div className="space-y-5">
          {/* Digital Twin + Risk Center */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <div
              className="rounded-2xl border border-[#22d3ee]/10 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
                boxShadow: "inset 0 0 60px rgba(34,211,238,0.03)",
              }}
            >
              <div className="px-5 pt-4 pb-1 flex items-center gap-2 border-b border-white/[0.04]">
                <Zap size={14} className="text-[#22d3ee]" />
                <span className="text-[13px] font-semibold text-white">خريطة المخاطر الرقمية</span>
                <span className="text-[10.5px] text-white/25 mr-auto">انقر على عقدة لتصفية السجلات</span>
              </div>
              <OrbitMap
                subChanges={subChanges}
                planChanges={planChanges}
                deleteOps={deleteOps}
                criticalCount={criticalCount}
                todayCount={todayCount}
                orgOps={orgOps}
                onNodeClick={handleNodeClick}
              />
            </div>

            <div
              className="rounded-2xl border border-white/[0.07] overflow-hidden"
              style={{ background: "linear-gradient(180deg, #091528 0%, #07111f 100%)" }}
            >
              <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#fbbf24]" />
                <span className="text-[13px] font-semibold text-white">مركز المخاطر</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <RiskCard icon={Trash2}      label="حذف نهائي"       count={hardDeletes}   color="#ef4444" />
                <RiskCard icon={XCircle}     label="اشتراكات ملغاة"  count={cancelledSubs} color="#f87171" />
                <RiskCard icon={PauseCircle} label="اشتراكات معلقة"  count={suspendedSubs} color="#f59e0b" />
                <RiskCard icon={Layers}      label="تغييرات الباقات" count={planSwaps}     color="#a855f7" />
                <div className="col-span-2">
                  <RiskCard
                    icon={AlertTriangle}
                    label="عمليات فاشلة"
                    count={0}
                    color="#22d3ee"
                    empty="لا توجد عمليات فاشلة مسجلة"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiCard label="إجمالي العمليات"     value={totalCount ?? logs.length} icon={ScrollText}    color="#22d3ee" loading={loading} />
            <KpiCard label="عمليات اليوم"        value={todayCount}                icon={Clock}         color="#10b981" loading={loading} />
            <KpiCard label="تغييرات الاشتراكات" value={subChanges}                icon={CreditCard}    color="#0ea5e9" loading={loading} />
            <KpiCard label="تغييرات الباقات"     value={planChanges}               icon={Package}       color="#a855f7" loading={loading} />
            <KpiCard label="عمليات الحذف"        value={deleteOps}                 icon={Trash2}        color="#ef4444" loading={loading} />
            <KpiCard label="أحداث عالية الخطورة" value={criticalCount}            icon={AlertTriangle} color="#f59e0b" loading={loading} />
          </div>

          {/* Org/Sub summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Org summary */}
            <div
              className="rounded-2xl border border-[#10b981]/15 p-5"
              style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#10b981]/10 border border-[#10b981]/20">
                  <Building2 size={14} className="text-[#10b981]" />
                </div>
                <span className="text-[13px] font-semibold text-white">ملخص المنشآت</span>
                {loadingMeta && <RefreshCw size={11} className="text-white/20 animate-spin mr-auto" />}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "الإجمالي", value: orgSummary.total,     color: "#22d3ee" },
                  { label: "نشطة",     value: orgSummary.active,    color: "#10b981" },
                  { label: "معلّقة",   value: orgSummary.suspended, color: "#f59e0b" },
                  { label: "محذوفة",   value: orgSummary.deleted,   color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-[20px] font-bold leading-none mb-1" style={{ color: item.color }}>
                      {loadingMeta ? "—" : item.value}
                    </p>
                    <p className="text-[10px] text-white/35">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub summary */}
            <div
              className="rounded-2xl border border-[#0ea5e9]/15 p-5"
              style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#0ea5e9]/10 border border-[#0ea5e9]/20">
                  <CreditCard size={14} className="text-[#0ea5e9]" />
                </div>
                <span className="text-[13px] font-semibold text-white">ملخص الاشتراكات</span>
                {loadingMeta && <RefreshCw size={11} className="text-white/20 animate-spin mr-auto" />}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "الإجمالي",  value: subSummary.total,     color: "#22d3ee" },
                  { label: "نشطة",      value: subSummary.active,    color: "#10b981" },
                  { label: "ملغاة",     value: subSummary.cancelled, color: "#ef4444" },
                  { label: "معلّقة",    value: subSummary.suspended, color: "#f59e0b" },
                  { label: "تجريبية",   value: subSummary.trialing,  color: "#a855f7" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-[20px] font-bold leading-none mb-1" style={{ color: item.color }}>
                      {loadingMeta ? "—" : item.value}
                    </p>
                    <p className="text-[10px] text-white/35">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DIAGNOSIS                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "diagnosis" && (
        <div className="space-y-5">
          {/* Disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#a855f7]/15 bg-[#a855f7]/[0.04] px-4 py-3">
            <Brain size={14} className="text-[#c084fc] flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#c8b6e8] leading-relaxed">
              <span className="font-semibold">تحليل ذكي مبدئي — بدون تنفيذ تلقائي.</span>{" "}
              جميع النتائج مستخرجة من البيانات المرئية فقط. لا يتم تنفيذ أي عملية تلقائياً. التشخيص محلي ومحدود بالبيانات المحملة.
            </p>
          </div>

          {/* Daily Brief */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
              borderColor: dailyBrief.hasAnomaly ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className={dailyBrief.hasAnomaly ? "text-[#f87171]" : "text-[#22d3ee]"} />
              <span className="text-[13px] font-semibold text-white">الموجز اليومي</span>
              {dailyBrief.hasAnomaly && (
                <span className="text-[10px] text-[#f87171] border border-[#ef4444]/20 rounded-full px-2 py-0.5 mr-auto">
                  ⚠️ نشاط غير طبيعي
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-center">
                    <p className="text-[22px] font-bold text-white leading-none">{dailyBrief.totalToday}</p>
                    <p className="text-[10px] text-white/35 mt-1">عمليات اليوم</p>
                  </div>
                  <div className="rounded-xl border border-[#ef4444]/15 bg-[#ef4444]/[0.04] px-3 py-2.5 text-center">
                    <p className="text-[22px] font-bold text-[#f87171] leading-none">{dailyBrief.criticalToday}</p>
                    <p className="text-[10px] text-white/35 mt-1">حرجة</p>
                  </div>
                  <div className="rounded-xl border border-[#f59e0b]/15 bg-[#f59e0b]/[0.04] px-3 py-2.5 text-center">
                    <p className="text-[22px] font-bold text-[#fbbf24] leading-none">{dailyBrief.highToday}</p>
                    <p className="text-[10px] text-white/35 mt-1">عالية</p>
                  </div>
                </div>
                {dailyBrief.anomalyNote && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#ef4444]/15 bg-[#ef4444]/[0.05] px-3 py-2.5">
                    <AlertTriangle size={12} className="text-[#f87171] flex-shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-[#fca5a5]">{dailyBrief.anomalyNote}</p>
                  </div>
                )}
                {dailyBrief.topAction && (
                  <p className="text-[11.5px] text-white/35">
                    أكثر إجراء اليوم: <span className="text-white/60">{actionLabel(dailyBrief.topAction)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Diagnosis Flags */}
          <div
            className="rounded-2xl border border-white/[0.07] p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-[#fbbf24]" />
              <span className="text-[13px] font-semibold text-white">مؤشرات التشخيص</span>
              <span
                className={cn("text-[10px] rounded-full px-2 py-0.5 mr-auto", SEV[diagnosis.riskLevel].badge)}
              >
                {SEV[diagnosis.riskLevel].label}
              </span>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />)}
              </div>
            ) : diagnosis.flags.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#10b981]/15 bg-[#10b981]/[0.04] px-4 py-3">
                <CheckCircle2 size={14} className="text-[#10b981]" />
                <p className="text-[12.5px] text-[#6ee7b7]">الوضع مستقر — لا توجد مؤشرات خطر فعّالة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diagnosis.flags.map((flag, i) => {
                  const s = SEV[flag.severity];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3"
                      style={{ borderColor: `${s.color}20`, background: `${s.color}06` }}
                    >
                      <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5 animate-pulse", s.dot)} />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-white/85">{flag.label}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{flag.detail}</p>
                      </div>
                      <span className={cn("text-[10px] rounded-full px-2 py-0.5 flex-shrink-0", s.badge)}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div
            className="rounded-2xl border border-white/[0.07] p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={14} className="text-[#fbbf24]" />
              <span className="text-[13px] font-semibold text-white">التوصيات</span>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => {
                const priorityColor =
                  rec.priority === "urgent" ? "#ef4444"
                  : rec.priority === "normal" ? "#f59e0b"
                  : "#22d3ee";
                return (
                  <div
                    key={i}
                    className="rounded-xl border px-4 py-3 flex items-start gap-3"
                    style={{ borderColor: `${priorityColor}18`, background: `${priorityColor}05` }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: priorityColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-white/85">{rec.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{rec.detail}</p>
                    </div>
                    {rec.href && (
                      <a
                        href={rec.href}
                        className="flex items-center gap-1 text-[11px] flex-shrink-0 hover:opacity-80 transition-opacity"
                        style={{ color: priorityColor }}
                      >
                        <Navigation size={11} />
                        انتقل
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q&A Assistant */}
          <div
            className="rounded-2xl border border-[#22d3ee]/10 p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} className="text-[#22d3ee]" />
              <span className="text-[13px] font-semibold text-white">مساعد التشخيص السريع</span>
              <span className="text-[10px] text-white/25 mr-auto">يعمل على البيانات المحملة فقط</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(activeQuestion === q.id ? null : q.id)}
                  className={cn(
                    "text-[11.5px] rounded-xl border px-3 py-1.5 transition-all",
                    activeQuestion === q.id
                      ? "bg-[#22d3ee]/12 border-[#22d3ee]/25 text-[#22d3ee]"
                      : "border-white/[0.08] text-white/45 hover:border-white/[0.14] hover:text-white/60",
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {activeQuestion && questionAnswer && (
              <div className="rounded-xl border border-[#22d3ee]/12 bg-[#22d3ee]/[0.04] px-4 py-3">
                <p className="text-[12.5px] text-white/75 leading-relaxed">{questionAnswer}</p>
              </div>
            )}
          </div>

          {/* Remediation nav buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "إدارة المنشآت",   href: "/owner/organizations", color: "#10b981" },
              { label: "إدارة الاشتراكات", href: "/owner/subscriptions",  color: "#0ea5e9" },
              { label: "إدارة الباقات",    href: "/owner/plans",          color: "#a855f7" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-center gap-2 rounded-xl border text-[12.5px] font-medium py-3 transition-all hover:opacity-80"
                style={{ borderColor: `${item.color}25`, color: item.color, background: `${item.color}06` }}
              >
                <Navigation size={13} />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SUPPORT                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "support" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-[#0ea5e9]/12 bg-[#0ea5e9]/[0.04] px-4 py-3">
            <HeadphonesIcon size={14} className="text-[#38bdf8] flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#bae6fd] leading-relaxed">
              دليل استكشاف الأخطاء للدعم الفني — اختر التصنيف المناسب لمشكلة العميل لعرض خطوات التشخيص والحل.
            </p>
          </div>

          {SUPPORT_CATS.map((cat) => {
            const Icon = cat.icon;
            const isOpen = expandedSupport === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-2xl border overflow-hidden transition-all"
                style={{
                  borderColor: isOpen ? `${cat.color}25` : "rgba(255,255,255,0.07)",
                  background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedSupport(isOpen ? null : cat.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-right hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}20` }}
                  >
                    <Icon size={14} style={{ color: cat.color }} />
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-white/85 text-right">{cat.label}</span>
                  {isOpen
                    ? <ChevronUp size={14} className="text-white/30 flex-shrink-0" />
                    : <ChevronDown size={14} className="text-white/30 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
                    <div>
                      <p className="text-[10.5px] text-white/30 uppercase tracking-widest font-mono mb-2">الأعراض الشائعة</p>
                      <ul className="space-y-1">
                        {cat.symptoms.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-white/55">
                            <span className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: cat.color }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-white/30 uppercase tracking-widest font-mono mb-2">خطوات التحقق</p>
                      <ol className="space-y-1.5">
                        {cat.checks.map((c, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/55">
                            <span className="text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ color: cat.color }}>{i + 1}.</span>
                            {c}
                          </li>
                        ))}
                      </ol>
                    </div>
                    {cat.href && (
                      <a
                        href={cat.href}
                        className="inline-flex items-center gap-2 text-[12px] font-medium rounded-xl border px-4 py-2 transition-all hover:opacity-80"
                        style={{ borderColor: `${cat.color}25`, color: cat.color, background: `${cat.color}06` }}
                      >
                        <Navigation size={12} />
                        {cat.action}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: LOGS                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className="rounded-2xl border border-white/[0.07] p-4"
            style={{ background: "linear-gradient(90deg, rgba(9,21,40,0.8), rgba(7,17,31,0.8))" }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالعملية، المستخدم، الهدف..."
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-[13px] text-white placeholder:text-white/25 pr-9 pl-3 py-2.5 outline-none focus:border-[#22d3ee]/35 transition-colors"
                />
              </div>
              <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 flex-shrink-0">
                {TIME_OPTS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTimeRange(t.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
                      timeRange === t.key
                        ? "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/22"
                        : "text-white/40 hover:text-white/60",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
                className="rounded-xl bg-[#0d1e3a] border border-white/[0.09] text-[12.5px] text-white/70 px-3 py-2.5 outline-none focus:border-[#22d3ee]/35 transition-colors flex-shrink-0"
              >
                {TARGET_OPTS.map((o) => (
                  <option key={o.key} value={o.key} className="bg-[#07111f]">{o.label}</option>
                ))}
              </select>
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value as SeverityFilter)}
                className="rounded-xl bg-[#0d1e3a] border border-white/[0.09] text-[12.5px] text-white/70 px-3 py-2.5 outline-none focus:border-[#22d3ee]/35 transition-colors flex-shrink-0"
              >
                {SEV_OPTS.map((o) => (
                  <option key={o.key} value={o.key} className="bg-[#07111f]">{o.label}</option>
                ))}
              </select>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/45 text-[12px] px-3 py-2.5 hover:bg-white/[0.06] transition-colors flex-shrink-0"
                >
                  <X size={12} />
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "linear-gradient(180deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
              >
                <ScrollText size={13} className="text-[#22d3ee]" />
              </div>
              <h2 className="text-[13.5px] font-semibold text-white">سجل النشاطات</h2>
              <span className="text-[11px] text-white/30 border border-white/[0.06] rounded-full px-2 py-0.5">
                {loading ? "…" : filtered.length}
              </span>
              {filtersActive && !loading && (
                <span className="text-[11px] text-[#22d3ee]/50 mr-auto">من {logs.length} إجمالي</span>
              )}
            </div>

            <div className="hidden lg:grid grid-cols-[6px_1fr_1fr_120px_90px_100px_32px] gap-4 items-center px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div />
              <span className="text-[10.5px] text-white/30 font-medium uppercase tracking-wider">العملية</span>
              <span className="text-[10.5px] text-white/30 font-medium uppercase tracking-wider">المالك</span>
              <span className="text-[10.5px] text-white/30 font-medium uppercase tracking-wider">نوع الهدف</span>
              <span className="text-[10.5px] text-white/30 font-medium uppercase tracking-wider">الخطورة</span>
              <span className="text-[10.5px] text-white/30 font-medium uppercase tracking-wider">الوقت</span>
              <div />
            </div>

            <div>
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <AlertTriangle size={24} className="text-[#f87171]/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13.5px] font-medium text-[#f87171]">حدث خطأ في تحميل البيانات</p>
                    <p className="text-[12px] text-white/30 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => void load(true)}
                    className="text-[12.5px] text-[#22d3ee] border border-[#22d3ee]/25 bg-[#22d3ee]/08 rounded-xl px-4 py-2 hover:bg-[#22d3ee]/12 transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Info size={22} className="text-white/20" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] text-white/30">
                    {logs.length === 0
                      ? "لا توجد أحداث تدقيق حتى الآن"
                      : "لا توجد نتائج مطابقة للفلاتر الحالية"}
                  </p>
                  {filtersActive && (
                    <button
                      onClick={resetFilters}
                      className="text-[12px] text-[#22d3ee]/70 hover:text-[#22d3ee] transition-colors"
                    >
                      مسح الفلاتر
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/[0.03]">
                    {filtered.map((log) => {
                      const sev = getSeverity(log.action);
                      const s = SEV[sev];
                      return (
                        <button
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="w-full text-right flex items-center gap-4 py-3.5 px-5 hover:bg-white/[0.025] transition-colors group"
                        >
                          <div className={cn("w-[3px] self-stretch rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity", s.bar)} />
                          <div className="flex-1 min-w-0 lg:grid lg:grid-cols-[1fr_1fr_120px_90px_100px_32px] lg:gap-4 lg:items-center">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-white/85 truncate group-hover:text-white transition-colors">
                                {actionLabel(log.action)}
                              </p>
                              <p className="text-[10.5px] text-white/30 mt-0.5 font-mono truncate lg:hidden">
                                {log.ownerEmail}
                              </p>
                            </div>
                            <p className="hidden lg:block text-[11.5px] text-white/45 truncate">{log.ownerEmail}</p>
                            <p className="hidden lg:block text-[11.5px] text-white/40 whitespace-nowrap">{targetTypeLabel(log.targetType)}</p>
                            <span className={cn("hidden lg:inline-flex text-[10.5px] rounded-full px-2 py-0.5 font-medium whitespace-nowrap", s.badge)}>
                              {s.label}
                            </span>
                            <p className="hidden lg:block text-[11px] text-white/30 whitespace-nowrap" title={fmtDatetime(log.createdAt)}>
                              {fmtAgo(log.createdAt)}
                            </p>
                            <span className="hidden lg:flex items-center justify-center text-[#22d3ee]/0 group-hover:text-[#22d3ee]/40 transition-colors text-[12px]">
                              ›
                            </span>
                          </div>
                          <div className="lg:hidden flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", s.badge)}>{s.label}</span>
                            <span className="text-[10px] text-white/25">{fmtAgo(log.createdAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="py-5 flex justify-center border-t border-white/[0.04]">
                      <button
                        onClick={() => void load(false)}
                        disabled={loadingMore}
                        className="flex items-center gap-2 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/06 text-[#22d3ee]/70 text-[12.5px] px-6 py-2.5 hover:bg-[#22d3ee]/10 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? <RefreshCw size={13} className="animate-spin" /> : null}
                        {loadingMore ? "جارٍ التحميل..." : "تحميل المزيد"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {!loading && logs.length > 0 && (
              <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]/30" />
                <p className="text-[11px] text-white/25">
                  سجلات التدقيق للقراءة فقط — لا يمكن تعديلها أو حذفها
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
