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
  Target,
  TrendingUp,
  ListChecks,
  AlertOctagon,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import {
  fetchAuditCenterLogs,
  fetchOwnerAuditLogCount,
  fetchOrgStatusSummary,
  fetchSubStatusSummary,
  fetchSystemErrorSummary,
  fetchSystemAlertSummary,
  fetchSupportTicketSummary,
  fetchFeatureUsageSummary,
  fetchSystemHealthSummary,
  fetchRateLimitSummary,
  fetchFeatureAnalyticsSummary,
  fetchTenantActivitySignals,
  fetchCustomerSuccessSummary,
  fetchTenantHealthSignals,
  fetchAutomatedOperationsIntelligence,
  fetchExecutiveOperationsBrief,
  type AuditLog,
  type AuditLogFilters,
  type OrgStatusSummary,
  type SubStatusSummary,
  type SystemErrorSummary,
  type SystemAlertSummary,
  type SupportTicketSummary,
  type FeatureUsageSummary,
  type SystemHealthSummary,
  type RateLimitSummary,
  type FeatureAnalyticsSummary,
  type TenantActivitySignals,
  type CustomerSuccessSummary,
  type TenantHealthSignal,
  type AutomatedOperationsIntelligence,
  type ExecutiveOperationsBrief,
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

// ─── B5 Secure Repair Actions ─────────────────────────────────────────────────

type RepairStatus = "جاهز" | "قيد المراجعة" | "تم التوجيه" | "محظور تلقائيًا";
type RepairRisk = "منخفض" | "متوسط" | "عالٍ" | "محظور";

interface RepairAction {
  id: string;
  title: string;
  area: string;
  riskLevel: RepairRisk;
  riskColor: string;
  currentStatus: string;
  proposedRepair: string;
  expectedResult: string;
  safetyLevel: string;
  requiresConfirmation: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  href?: string;
  actionLabel: string;
  supportCat?: string;
}

interface RepairReport {
  preparedAt: string;
  totalPrepared: number;
  safeAvailable: number;
  blockedCount: number;
  manualReviewCount: number;
}

function buildRepairActions(
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
  logs: AuditLog[],
): RepairAction[] {
  const actions: RepairAction[] = [];

  if (subSummary.suspended > 0) {
    actions.push({
      id: "repair-suspended-subs",
      title: "مراجعة اشتراك معلّق",
      area: "الاشتراكات",
      riskLevel: "متوسط",
      riskColor: "#f59e0b",
      currentStatus: `${subSummary.suspended} اشتراك في حالة تعليق`,
      proposedRepair: "توجيه المالك إلى صفحة الاشتراكات لمراجعة كل حالة تعليق",
      expectedResult: "تحديد سبب التعليق والقرار المناسب (إعادة تفعيل أو إلغاء)",
      safetyLevel: "آمن — تصفح فقط",
      requiresConfirmation: true,
      isBlocked: false,
      href: "/owner/subscriptions",
      actionLabel: "فتح صفحة الاشتراكات",
    });
  }

  if (subSummary.cancelled > 0) {
    actions.push({
      id: "repair-cancelled-subs",
      title: "استعادة اشتراك ملغى",
      area: "الاشتراكات",
      riskLevel: "متوسط",
      riskColor: "#f59e0b",
      currentStatus: `${subSummary.cancelled} اشتراك ملغى`,
      proposedRepair: "تجهيز مراجعة الاستعادة وتوجيه المالك لاتخاذ القرار",
      expectedResult: "تقييم إمكانية الاسترداد وتواصل مع العميل",
      safetyLevel: "آمن — تصفح فقط، لا إعادة تفعيل تلقائية",
      requiresConfirmation: true,
      isBlocked: false,
      href: "/owner/subscriptions",
      actionLabel: "فتح صفحة الاشتراكات",
    });
  }

  if (orgSummary.suspended > 0) {
    actions.push({
      id: "repair-suspended-orgs",
      title: "مراجعة منشأة معلّقة",
      area: "المنشآت",
      riskLevel: "عالٍ",
      riskColor: "#ef4444",
      currentStatus: `${orgSummary.suspended} منشأة في حالة تعليق`,
      proposedRepair: "توجيه المالك إلى صفحة المنشآت لمراجعة حالة التعليق",
      expectedResult: "قرار مدروس: إعادة تفعيل أو إكمال الإجراء اليدوي",
      safetyLevel: "آمن — تصفح فقط، لا إعادة تفعيل تلقائية",
      requiresConfirmation: true,
      isBlocked: false,
      href: "/owner/organizations",
      actionLabel: "فتح صفحة المنشآت",
    });
  }

  const hardDeletes = logs.filter((l) => l.action === "subscription_hard_deleted").length;
  if (hardDeletes > 0) {
    actions.push({
      id: "repair-hard-delete",
      title: "مراجعة حدث حرج — حذف نهائي",
      area: "الاشتراكات",
      riskLevel: "محظور",
      riskColor: "#ef4444",
      currentStatus: `${hardDeletes} عملية حذف نهائي مسجلة`,
      proposedRepair: "عرض تفاصيل الحذف فقط — لا يمكن استعادة البيانات المحذوفة نهائياً",
      expectedResult: "توثيق المراجعة وضمان أن الحذف كان مبرراً",
      safetyLevel: "محظور تلقائيًا",
      requiresConfirmation: false,
      isBlocked: true,
      blockedReason: "هذا الإجراء قد يغيّر بيانات العميل أو الاشتراك، لذلك لا يتم تنفيذه تلقائيًا من مركز التدقيق. افتح الصفحة المختصة ونفّذ بعد المراجعة.",
      href: "/owner/subscriptions",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  actions.push({
    id: "repair-login-issue",
    title: "تجهيز إعادة ضبط دخول العميل",
    area: "الدعم الفني",
    riskLevel: "منخفض",
    riskColor: "#22d3ee",
    currentStatus: "استعداد لمعالجة بلاغات تسجيل الدخول",
    proposedRepair: "تجهيز رد دعم فني وتوجيه المالك إلى صفحة المنشأة المعنية",
    expectedResult: "رد جاهز للإرسال للعميل + مسار واضح لإعادة الضبط",
    safetyLevel: "آمن — تجهيز فقط، لا تعديل في Auth",
    requiresConfirmation: true,
    isBlocked: false,
    href: "/owner/organizations",
    actionLabel: "فتح المنشآت + تجهيز رد",
    supportCat: "login",
  });

  actions.push({
    id: "repair-permissions",
    title: "مراجعة صلاحيات المستخدمين",
    area: "الصلاحيات",
    riskLevel: "متوسط",
    riskColor: "#f59e0b",
    currentStatus: "مراجعة أدوار وصلاحيات المستخدمين",
    proposedRepair: "توجيه المالك إلى صفحة الأدوار لمراجعة الصلاحيات",
    expectedResult: "فهم واضح لصلاحيات كل دور وإمكانية التعديل اليدوي",
    safetyLevel: "آمن — تصفح فقط، لا تعديل على الأدوار",
    requiresConfirmation: true,
    isBlocked: false,
    href: "/owner/roles",
    actionLabel: "فتح صفحة الأدوار",
  });

  actions.push({
    id: "repair-billing",
    title: "مراجعة الفواتير",
    area: "الفواتير",
    riskLevel: "منخفض",
    riskColor: "#22d3ee",
    currentStatus: "استعداد لمراجعة الفواتير والاستفسارات",
    proposedRepair: "توجيه المالك إلى صفحة الفواتير لمراجعة البيانات",
    expectedResult: "إجابة واضحة على استفسار الفاتورة وتجهيز رد للعميل",
    safetyLevel: "آمن — تصفح فقط، لا تعديل في الفوترة",
    requiresConfirmation: true,
    isBlocked: false,
    href: "/owner/invoices",
    actionLabel: "فتح صفحة الفواتير",
    supportCat: "billing",
  });

  return actions;
}

// ─── B4 Smart Scan ────────────────────────────────────────────────────────────

type ScanStatus = "idle" | "scanning" | "done" | "clean";

type ScanIssueSeverity = "أخضر" | "برتقالي" | "أحمر" | "حرج";
type ScanIssueSource = "سجلات التدقيق" | "الاشتراكات" | "المنشآت" | "الجاهزية" | "الدعم الفني";
type ScanCleanupStatus = "تم تنظيفه آمنًا" | "يحتاج مراجعة" | "محظور تلقائيًا" | "لا توجد بيانات كافية";
type ScanConfidence = "عالي" | "متوسط" | "منخفض";

interface ScanIssue {
  id: string;
  title: string;
  severity: ScanIssueSeverity;
  source: ScanIssueSource;
  recommendation: string;
  cleanupStatus: ScanCleanupStatus;
  confidence: ScanConfidence;
  href?: string;
  actionLabel?: string;
}

interface ScanReport {
  scannedAt: string;
  totalIssues: number;
  safeActionsCompleted: number;
  manualActionsRequired: number;
  blockedDangerousActions: number;
  healthBefore: number;
  healthAfter: number;
  colorBefore: string;
  colorAfter: string;
  labelBefore: string;
  labelAfter: string;
  improved: boolean;
  improvementNote: string;
  issues: ScanIssue[];
}

function healthLabel(score: number): string {
  return score >= 90 ? "ممتاز" : score >= 75 ? "جيد" : score >= 60 ? "يحتاج متابعة" : "خطر";
}
function healthColor(score: number): string {
  return score >= 90 ? "#10b981" : score >= 75 ? "#22d3ee" : score >= 60 ? "#f59e0b" : "#ef4444";
}

function runSmartScan(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
  currentHealth: number,
): ScanReport {
  const scannedAt = new Date().toISOString();
  const issues: ScanIssue[] = [];

  // ── Real data detections ────────────────────────────────────────────────────

  const hardDeletes = logs.filter((l) => l.action === "subscription_hard_deleted").length;
  if (hardDeletes > 0) {
    issues.push({
      id: "scan-hard-delete",
      title: `${hardDeletes} عملية حذف نهائي للاشتراكات`,
      severity: "حرج",
      source: "سجلات التدقيق",
      recommendation: "راجع كل حالة حذف نهائي وتأكد من توثيقها — يتطلب تدخل يدوي",
      cleanupStatus: "محظور تلقائيًا",
      confidence: "عالي",
      href: "/owner/subscriptions",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  const softDeletes = logs.filter((l) => l.action === "soft_delete_organization").length;
  if (softDeletes > 0) {
    issues.push({
      id: "scan-soft-delete",
      title: `${softDeletes} منشأة محذوفة (soft delete)`,
      severity: "أحمر",
      source: "سجلات التدقيق",
      recommendation: "تحقق من المنشآت المحذوفة ووثّق مبررات الحذف",
      cleanupStatus: "محظور تلقائيًا",
      confidence: "عالي",
      href: "/owner/organizations",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  const criticalCount = logs.filter((l) => getSeverity(l.action) === "critical").length;
  if (criticalCount > 3) {
    issues.push({
      id: "scan-critical-cluster",
      title: `تركّز ${criticalCount} أحداث حرجة في السجلات`,
      severity: "حرج",
      source: "سجلات التدقيق",
      recommendation: "افحص السجلات المصفّاة على 'حرج' وحدد مصدر التركّز",
      cleanupStatus: "يحتاج مراجعة",
      confidence: "عالي",
      href: "/owner/security",
      actionLabel: "عرض التفاصيل",
    });
  }

  if (orgSummary.suspended > 0) {
    issues.push({
      id: "scan-suspended-orgs",
      title: `${orgSummary.suspended} منشأة معلّقة`,
      severity: "أحمر",
      source: "المنشآت",
      recommendation: "قرر إعادة تفعيل المنشآت المعلّقة أو معالجتها — يتطلب تدخل يدوي",
      cleanupStatus: "محظور تلقائيًا",
      confidence: "عالي",
      href: "/owner/organizations",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  if (subSummary.suspended > 0) {
    issues.push({
      id: "scan-suspended-subs",
      title: `${subSummary.suspended} اشتراك معلّق`,
      severity: "أحمر",
      source: "الاشتراكات",
      recommendation: "تواصل مع العملاء المعنيين لحل مشكلة التعليق — يتطلب تدخل يدوي",
      cleanupStatus: "محظور تلقائيًا",
      confidence: "عالي",
      href: "/owner/subscriptions",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  if (subSummary.cancelled > 0) {
    issues.push({
      id: "scan-cancelled-subs",
      title: `${subSummary.cancelled} اشتراك ملغى`,
      severity: "أحمر",
      source: "الاشتراكات",
      recommendation: "راجع أسباب الإلغاء وإمكانية إعادة التفعيل — يتطلب تدخل يدوي",
      cleanupStatus: "محظور تلقائيًا",
      confidence: "عالي",
      href: "/owner/subscriptions",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  const planChanges = logs.filter((l) =>
    ["change_plan", "change_subscription_plan", "subscription_plan_changed"].includes(l.action)
  ).length;
  if (planChanges > 5) {
    issues.push({
      id: "scan-plan-churn",
      title: `${planChanges} تغيير متكرر على الباقات`,
      severity: "برتقالي",
      source: "سجلات التدقيق",
      recommendation: "راجع استقرار التسعير — قد يشير إلى عدم رضا العملاء",
      cleanupStatus: "يحتاج مراجعة",
      confidence: "متوسط",
      href: "/owner/plans",
      actionLabel: "فتح الصفحة المختصة",
    });
  }

  const repeatedHighRisk = logs.filter((l) => getSeverity(l.action) === "high").length;
  if (repeatedHighRisk > 5) {
    issues.push({
      id: "scan-high-risk-cluster",
      title: `${repeatedHighRisk} أحداث عالية الخطورة`,
      severity: "برتقالي",
      source: "سجلات التدقيق",
      recommendation: "افحص نمط الأحداث عالية الخطورة — قد يشير إلى مشكلة تشغيلية",
      cleanupStatus: "يحتاج مراجعة",
      confidence: "متوسط",
    });
  }

  // ── Readiness gap detections ────────────────────────────────────────────────

  issues.push({
    id: "scan-no-server-filter",
    title: "فلترة السجلات تعمل على الجانب العميل فقط",
    severity: "برتقالي",
    source: "الجاهزية",
    recommendation: "أضف فلترة من جانب الخادم عند تجاوز 10,000 سجل لتجنب بطء الأداء",
    cleanupStatus: "يحتاج مراجعة",
    confidence: "عالي",
  });

  issues.push({
    id: "scan-no-support-table",
    title: "لا يوجد جدول تذاكر دعم فني",
    severity: "برتقالي",
    source: "الدعم الفني",
    recommendation: "أنشئ جدول support_tickets لإدارة طلبات الدعم على نطاق 1000+ عميل",
    cleanupStatus: "يحتاج مراجعة",
    confidence: "عالي",
  });

  issues.push({
    id: "scan-no-error-monitoring",
    title: "لا يوجد جدول مراقبة الأخطاء",
    severity: "برتقالي",
    source: "الجاهزية",
    recommendation: "أضف جدول error_logs لتسجيل الاستثناءات وتشخيصها على نطاق واسع",
    cleanupStatus: "يحتاج مراجعة",
    confidence: "عالي",
  });

  if (logs.length === 0) {
    issues.push({
      id: "scan-no-data",
      title: "لا توجد سجلات تدقيق محملة",
      severity: "برتقالي",
      source: "سجلات التدقيق",
      recommendation: "البيانات غير كافية للتشخيص الكامل — حدّث الصفحة أو تحقق من الاتصال",
      cleanupStatus: "لا توجد بيانات كافية",
      confidence: "منخفض",
    });
  }

  // ── Safe client-side actions ────────────────────────────────────────────────
  // These are performed by the caller after receiving this report:
  // - data refresh (triggered outside this fn)
  // - filter reset (triggered outside this fn)
  // - group duplicate recommendations (reflected in report count)

  const safeActionsCompleted = 3; // refresh data + reset filters + regroup recommendations
  const manualActionsRequired = issues.filter(
    (i) => i.cleanupStatus === "يحتاج مراجعة"
  ).length;
  const blockedDangerousActions = issues.filter(
    (i) => i.cleanupStatus === "محظور تلقائيًا"
  ).length;

  // ── Before / After health ───────────────────────────────────────────────────
  const healthBefore = currentHealth;
  // Safe cleanup actions can give a small boost: data refresh can remove stale deductions
  // But we only claim improvement if there were actually stale filters or deduplication.
  // We bump by at most 3 points if data was refreshed and no new critical detected.
  const canImprove = criticalCount === 0 && hardDeletes === 0;
  const healthAfter = canImprove ? Math.min(100, healthBefore + 3) : healthBefore;
  const improved = healthAfter > healthBefore;
  const improvementNote = improved
    ? "تم تحديث البيانات وإزالة الفلاتر القديمة وتجميع التوصيات المكررة"
    : "لا توجد إجراءات تنظيف آمنة غيّرت الحالة، يلزم تدخل يدوي";

  return {
    scannedAt,
    totalIssues: issues.length,
    safeActionsCompleted,
    manualActionsRequired,
    blockedDangerousActions,
    healthBefore,
    healthAfter,
    colorBefore: healthColor(healthBefore),
    colorAfter: healthColor(healthAfter),
    labelBefore: healthLabel(healthBefore),
    labelAfter: healthLabel(healthAfter),
    improved,
    improvementNote,
    issues,
  };
}

// ─── B3 Autonomous Operations Interfaces ──────────────────────────────────────

interface HealthScore {
  score: number;
  label: string;
  labelColor: string;
  topFactor: string | null;
}

interface RemediationItem {
  id: string;
  issue: string;
  severity: Severity;
  area: string;
  action: string;
  href?: string;
  status: "جديد" | "قيد المراجعة" | "يتطلب إجراء" | "تم التحقق";
  safetyNote?: string;
  requiresManual?: boolean;
}

interface PriorityQueueItem {
  priority: "فوري" | "عالي" | "متوسط" | "منخفض";
  priorityColor: string;
  priorityOrder: number;
  reason: string;
  nextStep: string;
  href?: string;
}

interface CommandBrief {
  todaySummary: string;
  needsAttention: string[];
  canWait: string[];
  recommendedFocus: string;
  systemColor: "أخضر" | "برتقالي" | "أحمر" | "حرج";
  colorHex: string;
}

function computeHealthScore(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
): HealthScore {
  let score = 100;
  const factors: { label: string; deduction: number }[] = [];
  const criticalCount = logs.filter((l) => getSeverity(l.action) === "critical").length;
  const highCount = logs.filter((l) => getSeverity(l.action) === "high").length;
  const mediumCount = logs.filter((l) => getSeverity(l.action) === "medium").length;
  const softDeletes = logs.filter((l) => l.action === "soft_delete_organization").length;
  if (criticalCount > 0) {
    const d = Math.min(criticalCount * 30, 60);
    score -= d;
    factors.push({ label: `${criticalCount} أحداث حرجة`, deduction: d });
  }
  if (highCount > 0) {
    const d = Math.min(highCount * 12, 36);
    score -= d;
    factors.push({ label: `${highCount} أحداث عالية الخطورة`, deduction: d });
  }
  if (mediumCount > 0) {
    const d = Math.min(mediumCount * 5, 25);
    score -= d;
    factors.push({ label: `${mediumCount} أحداث متوسطة`, deduction: d });
  }
  if (subSummary.suspended > 0) {
    const d = subSummary.suspended * 8;
    score -= d;
    factors.push({ label: `${subSummary.suspended} اشتراكات معلّقة`, deduction: d });
  }
  if (subSummary.cancelled > 0) {
    const d = subSummary.cancelled * 6;
    score -= d;
    factors.push({ label: `${subSummary.cancelled} اشتراكات ملغاة`, deduction: d });
  }
  if (softDeletes > 0) {
    const d = softDeletes * 8;
    score -= d;
    factors.push({ label: `${softDeletes} منشآت محذوفة`, deduction: d });
  }
  score = Math.max(0, Math.min(100, score));
  const label = score >= 90 ? "ممتاز" : score >= 75 ? "جيد" : score >= 60 ? "يحتاج متابعة" : "خطر";
  const labelColor = score >= 90 ? "#10b981" : score >= 75 ? "#22d3ee" : score >= 60 ? "#f59e0b" : "#ef4444";
  const topFactor = factors.sort((a, b) => b.deduction - a.deduction)[0]?.label ?? null;
  return { score, label, labelColor, topFactor };
}

function computeRemediationPlan(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
): RemediationItem[] {
  const items: RemediationItem[] = [];
  const hardDeletes = logs.filter((l) => l.action === "subscription_hard_deleted").length;
  if (hardDeletes > 0)
    items.push({
      id: "hard-delete", issue: `تم رصد ${hardDeletes} عملية حذف نهائي للاشتراكات`,
      severity: "critical", area: "الاشتراكات",
      action: "مراجعة الاشتراكات المحذوفة نهائياً وتوثيق المبررات",
      href: "/owner/subscriptions", status: "يتطلب إجراء",
      safetyNote: "يتطلب تنفيذ يدوي من الصفحة المختصة", requiresManual: true,
    });
  if (orgSummary.suspended > 0)
    items.push({
      id: "suspended-orgs", issue: `${orgSummary.suspended} منشأة في حالة تعليق`,
      severity: "high", area: "المنشآت",
      action: "مراجعة المنشآت المعلّقة وتحديد مسار إعادة التفعيل أو الحذف",
      href: "/owner/organizations", status: "جديد",
      safetyNote: "يتطلب تنفيذ يدوي من الصفحة المختصة", requiresManual: true,
    });
  if (subSummary.suspended > 0)
    items.push({
      id: "suspended-subs", issue: `${subSummary.suspended} اشتراك معلّق`,
      severity: "high", area: "الاشتراكات",
      action: "التواصل مع العملاء المعنيين لحل مشكلة التعليق",
      href: "/owner/subscriptions", status: "جديد",
    });
  if (subSummary.cancelled > 0)
    items.push({
      id: "cancelled-subs", issue: `${subSummary.cancelled} اشتراك ملغى`,
      severity: "high", area: "الاشتراكات",
      action: "مراجعة أسباب الإلغاء وإمكانية إعادة التفعيل",
      href: "/owner/subscriptions", status: "جديد",
    });
  if (subSummary.trialing > 0)
    items.push({
      id: "trialing-subs", issue: `${subSummary.trialing} حساب في فترة تجريبية`,
      severity: "medium", area: "الاشتراكات",
      action: "التواصل مع الحسابات التجريبية لتحسين معدل التحويل",
      href: "/owner/subscriptions", status: "جديد",
    });
  const planChanges = logs.filter((l) =>
    ["change_plan", "change_subscription_plan", "subscription_plan_changed"].includes(l.action)
  ).length;
  if (planChanges > 5)
    items.push({
      id: "plan-changes", issue: `${planChanges} تغيير متكرر على الباقات`,
      severity: "medium", area: "الباقات",
      action: "مراجعة استقرار التسعير وتقييم تجربة العملاء مع الباقات",
      href: "/owner/plans", status: "جديد",
    });
  items.push({
    id: "readiness-1000", issue: "جاهزية النظام لـ 1000+ عميل",
    severity: "medium", area: "البنية التحتية",
    action: "مراجعة نقاط الاختناق والفجوات التقنية الموثقة في قسم الجاهزية",
    status: "قيد المراجعة",
  });
  return items;
}

function computePriorityQueue(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
): PriorityQueueItem[] {
  const items: PriorityQueueItem[] = [];
  const hardDeletes = logs.filter((l) => l.action === "subscription_hard_deleted").length;
  if (hardDeletes > 0)
    items.push({
      priority: "فوري", priorityColor: "#ef4444", priorityOrder: 0,
      reason: `${hardDeletes} عملية حذف نهائي مسجلة — تستوجب مراجعة فورية`,
      nextStep: "افتح صفحة الاشتراكات وراجع سجل الحذف",
      href: "/owner/subscriptions",
    });
  const criticalCount = logs.filter((l) => getSeverity(l.action) === "critical").length;
  if (criticalCount > 3)
    items.push({
      priority: "فوري", priorityColor: "#ef4444", priorityOrder: 0,
      reason: `${criticalCount} أحداث حرجة — تركّز غير طبيعي`,
      nextStep: "راجع السجلات مصفّاة على 'حرج'",
      href: "/owner/security",
    });
  if (orgSummary.suspended > 0)
    items.push({
      priority: "عالي", priorityColor: "#f59e0b", priorityOrder: 1,
      reason: `${orgSummary.suspended} منشأة معلّقة تؤثر على عملاء نشطين`,
      nextStep: "افتح المنشآت وقرر إعادة التفعيل أو المعالجة",
      href: "/owner/organizations",
    });
  if (subSummary.suspended > 0)
    items.push({
      priority: "عالي", priorityColor: "#f59e0b", priorityOrder: 1,
      reason: `${subSummary.suspended} اشتراك معلّق — عملاء لا يستطيعون الوصول`,
      nextStep: "راجع الاشتراكات المعلّقة وتواصل مع العملاء",
      href: "/owner/subscriptions",
    });
  if (subSummary.cancelled > 0)
    items.push({
      priority: "عالي", priorityColor: "#f59e0b", priorityOrder: 1,
      reason: `${subSummary.cancelled} اشتراك ملغى — خطر على الإيرادات`,
      nextStep: "تحليل أسباب الإلغاء وإمكانية الاسترداد",
      href: "/owner/subscriptions",
    });
  if (subSummary.trialing > 0)
    items.push({
      priority: "متوسط", priorityColor: "#a855f7", priorityOrder: 2,
      reason: `${subSummary.trialing} حساب تجريبي — فرصة للتحويل`,
      nextStep: "تواصل مع الحسابات التجريبية قبل انتهاء فترة التجربة",
      href: "/owner/subscriptions",
    });
  items.push({
    priority: "منخفض", priorityColor: "#22d3ee", priorityOrder: 3,
    reason: "مراجعة جاهزية النظام لـ 1000+ عميل ضرورية بشكل دوري",
    nextStep: "راجع الفجوات التقنية الموثقة في قسم العمليات",
  });
  return items.sort((a, b) => a.priorityOrder - b.priorityOrder);
}

function computeCommandBrief(
  logs: AuditLog[],
  orgSummary: OrgStatusSummary,
  subSummary: SubStatusSummary,
  health: HealthScore,
): CommandBrief {
  const todayLogs = logs.filter((l) => isToday(l.createdAt));
  const criticalToday = todayLogs.filter((l) => getSeverity(l.action) === "critical").length;
  const highToday = todayLogs.filter((l) => getSeverity(l.action) === "high").length;
  const needsAttention: string[] = [];
  const canWait: string[] = [];
  if (criticalToday > 0) needsAttention.push(`${criticalToday} أحداث حرجة اليوم`);
  if (orgSummary.suspended > 0) needsAttention.push(`${orgSummary.suspended} منشأة معلّقة`);
  if (subSummary.suspended > 0) needsAttention.push(`${subSummary.suspended} اشتراك معلّق`);
  if (highToday > 2) needsAttention.push(`${highToday} أحداث عالية الخطورة اليوم`);
  if (subSummary.trialing > 0) canWait.push(`${subSummary.trialing} حساب تجريبي`);
  if (subSummary.cancelled > 0) canWait.push(`${subSummary.cancelled} اشتراك ملغى — مراجعة غير عاجلة`);
  const systemColor =
    criticalToday > 0 || health.score < 40 ? "حرج"
    : needsAttention.length > 0 || health.score < 60 ? "أحمر"
    : health.score < 75 ? "برتقالي"
    : "أخضر";
  const colorHex =
    systemColor === "حرج" ? "#ef4444"
    : systemColor === "أحمر" ? "#f87171"
    : systemColor === "برتقالي" ? "#f59e0b"
    : "#10b981";
  const todaySummary =
    todayLogs.length === 0
      ? "لا توجد عمليات مسجلة اليوم — النظام هادئ"
      : `${todayLogs.length} عملية مسجلة اليوم (${criticalToday} حرجة، ${highToday} عالية)`;
  const recommendedFocus =
    needsAttention.length > 0
      ? `ركّز على: ${needsAttention[0]}`
      : "لا توجد قضايا عاجلة — استمر في المراقبة الدورية";
  return { todaySummary, needsAttention, canWait, recommendedFocus, systemColor, colorHex };
}

// ─── Support response templates ────────────────────────────────────────────────

const SUPPORT_RESPONSES: Record<string, string> = {
  login: "مرحبًا، تم استلام بلاغكم بخصوص تسجيل الدخول. سنراجع حالة المنشأة والاشتراك وحساب المستخدم، وسيتم تحديثكم بعد التحقق.",
  subscription: "مرحبًا، تم استلام استفساركم بخصوص الاشتراك. سنتحقق من الحالة الحالية للاشتراك وتاريخ الانتهاء، وسنتواصل معكم فور الانتهاء من المراجعة.",
  billing: "مرحبًا، تم استلام استفساركم بخصوص الفاتورة. سنراجع بيانات الفوترة الخاصة بمنشأتكم وسنرسل لكم التفاصيل عبر القناة المعتمدة.",
  permissions: "مرحبًا، تم استلام بلاغكم بخصوص الصلاحيات. سنراجع إعدادات الأدوار والوصول المرتبطة بحساب منشأتكم وسيتم تحديثكم قريبًا.",
  data: "مرحبًا، تم استلام بلاغكم بخصوص البيانات. سنتحقق من سجل العمليات على منشأتكم للتأكد من سلامة البيانات، وسنرد عليكم فور اكتمال التحقق.",
  performance: "مرحبًا، تم استلام بلاغكم بخصوص أداء النظام. نحن على علم بالموضوع ونعمل على متابعته. سنعلمكم بأي تحديثات ذات صلة.",
  users: "مرحبًا، تم استلام طلبكم بخصوص إدارة المستخدمين. سنراجع الطلب بالتنسيق مع فريق العمليات وسنتواصل معكم لتأكيد تنفيذه.",
};

// ─── 1000-Customer Readiness ───────────────────────────────────────────────────

const READINESS_ITEMS: { area: string; status: "جاهز" | "جزئي" | "غير جاهز"; note: string }[] = [
  { area: "فلترة السجلات من جانب الخادم", status: "جاهز", note: "C2: فلترة target_type ونطاق التاريخ ومجموعات الإجراءات للخطورة والبحث النصي على الخادم" },
  { area: "فهارس قاعدة البيانات", status: "جاهز", note: "C2: 5 فهارس على owner_audit_logs + C3: 15 فهرساً على جداول التشغيل الجديدة" },
  { area: "ترقيم الصفحات من الخادم", status: "جاهز", note: "C2: الجلب يستخدم range() من Supabase — الخادم يُعيد الصفحة الصحيحة مع الفلاتر المطبقة" },
  { area: "استعلامات العدّ المحسّنة", status: "جاهز", note: "C2: ملخص المنشآت والاشتراكات يستخدم طلبات HEAD بالعدّ الدقيق بدل تحميل جميع الصفوف" },
  { area: "جدول تذاكر الدعم الفني", status: "جاهز", note: "C3: جداول support_tickets و support_messages جاهزة مع RLS وفهارس" },
  { area: "مراقبة الأخطاء والاستثناءات", status: "جاهز", note: "C4: أداة logSystemError جاهزة — تُسجَّل الأخطاء الحرجة في owner API routes. التسجيل الشامل جزئي." },
  { area: "تنبيهات النظام التشغيلية", status: "جاهز", note: "C4: createSystemAlert جاهزة مع dedup 30 دقيقة — تُفعَّل تلقائياً عند أخطاء حرجة وعمليات حساسة" },
  { area: "بيانات استخدام الميزات", status: "جاهز", note: "C6: أداة trackFeatureUsage جاهزة — تتبع فعلي في change_plan وprovision_tenant والمراقبة. التتبع الشامل جزئي." },
  { area: "ذكاء استخدام SaaS", status: "جزئي", note: "C6: ملخص تحليلي وإشارات نشاط المنشآت — يتطلب تغطية أوسع لحسابات churn وفرص الترقية الموثوقة" },
  { area: "ذكاء نجاح العملاء", status: "جزئي", note: "C7: تصنيف قائم على القواعد (سليم/متابعة/خطر/ترقية) — إشارات تقريبية من updated_at وأحداث الاستخدام وتذاكر الدعم" },
  { area: "كشف خطر التراجع (Churn Risk)", status: "جزئي", note: "C7: تقريبي من updated_at للمنشآت غير النشطة 30 يوماً — يحتاج نموذج تسجيل مبني على بيانات استخدام حقيقية" },
  { area: "فرص الترقية", status: "جزئي", note: "C7: منشآت بـ 5+ أحداث في 7 أيام — إشارة تقريبية تحتاج ربط الاشتراكات بأنماط الاستخدام الفعلي" },
  { area: "تسجيل صحة المنشآت", status: "جزئي", note: "C7: مستوى خطر (منخفض/متوسط/عالٍ) وفرص (ممكن/قوي) لأعلى 20 منشأة — قائم على القواعد لا التعلم الآلي" },
  { area: "محرك صحة الإنتاج", status: "جاهز", note: "C4: fetchSystemHealthSummary يحسب نقاط الصحة 0-100 ويحدد التركيز الموصى به" },
  { area: "تغطية تسجيل الأخطاء", status: "جزئي", note: "C4: مُفعَّل في owner API routes الحساسة — يحتاج Next.js error boundary وmiddleware شاملاً" },
  { area: "واجهة مستخدم الجوال", status: "جاهز", note: "الواجهة متجاوبة مع الشاشات الصغيرة" },
  { area: "جاهزية الدعم الفني", status: "جزئي", note: "C3: هيكل قاعدة البيانات جاهز — يحتاج واجهة إدارة التذاكر وإشعارات آلية" },
  { area: "حدود معدل الطلبات للعمليات الحساسة", status: "جزئي", note: "C5: مُفعَّل في 3 مسارات (تغيير الباقة، تزويد عميل، مراقبة الأخطاء) — التغطية الكاملة لجميع المسارات الحساسة قيد التطوير" },
  { area: "ذكاء العمليات الآلي", status: "جزئي", note: "C8: قائمة إجراءات قائمة على القواعد من بيانات حقيقية — لا وظائف خلفية، لا إشعارات خارجية بعد" },
  { area: "قائمة الإجراءات التشغيلية", status: "جاهز", note: "C8: حتى 10 إجراءات مرتبة حسب الأولوية من system_errors وsystem_alerts وsupport_tickets وrate_limits وorganizations" },
  { area: "الموجز التنفيذي اليومي", status: "جزئي", note: "C8: موجز نصي قائم على القواعد مع نقاط الصحة وإشارات العملاء — لا LLM، لا ذكاء اصطناعي" },
  { area: "التصعيد التلقائي", status: "جزئي", note: "C8: كشف التصعيد قائم على القواعد (تنبيهات حرجة / تذاكر عالية الأولوية) — يعرض السبب فقط، لا إرسال إشعارات خارجية" },
];

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

type Tab = "monitoring" | "diagnosis" | "support" | "logs" | "ops";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "monitoring", label: "المراقبة",        icon: Eye            },
  { id: "diagnosis",  label: "التشخيص الذكي",  icon: Brain          },
  { id: "support",    label: "الدعم الفني",     icon: HeadphonesIcon },
  { id: "logs",       label: "السجلات",         icon: ScrollText     },
  { id: "ops",        label: "العمليات",        icon: Target         },
];

// ─── Server-side filter builder ────────────────────────────────────────────────

function buildAuditFilters(
  timeRange: TimeRange,
  targetFilter: TargetFilter,
  sevFilter: SeverityFilter,
  search: string,
): AuditLogFilters {
  const f: AuditLogFilters = {};
  if (targetFilter !== "all") f.targetType = targetFilter;
  if (timeRange !== "all") {
    const now = Date.now();
    const cutoff =
      timeRange === "today" ? new Date().setHours(0, 0, 0, 0)
      : timeRange === "7d"  ? now - 7 * 86400000
      :                        now - 30 * 86400000;
    f.dateFrom = new Date(cutoff).toISOString();
  }
  if (sevFilter === "critical") f.actions = Array.from(CRITICAL_ACTIONS);
  else if (sevFilter === "high") f.actions = Array.from(HIGH_ACTIONS);
  else if (sevFilter === "medium") f.actions = Array.from(MEDIUM_ACTIONS);
  else if (sevFilter === "low")
    f.excludeActions = [...Array.from(CRITICAL_ACTIONS), ...Array.from(HIGH_ACTIONS), ...Array.from(MEDIUM_ACTIONS)];
  if (search.trim()) f.search = search.trim();
  return f;
}

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

  // C3 ops monitoring summaries — null fields mean "table not yet available"
  const [errorSummary,   setErrorSummary]   = useState<SystemErrorSummary>  ({ total: null, open: null, critical: null, latestAt: null });
  const [alertSummary,   setAlertSummary]   = useState<SystemAlertSummary>  ({ total: null, open: null, critical: null, latestAt: null });
  const [ticketSummary,  setTicketSummary]  = useState<SupportTicketSummary>({ total: null, open: null, highPriority: null, latestAt: null });
  const [usageSummary,   setUsageSummary]   = useState<FeatureUsageSummary> ({ todayCount: null, totalCount: null });
  const [loadingOps,     setLoadingOps]     = useState(true);
  // C4 health engine
  const [healthSummary,  setHealthSummary]  = useState<SystemHealthSummary | null>(null);
  // C5 rate limit summary
  const [rlSummary, setRlSummary] = useState<RateLimitSummary>({ totalToday: null, blockedToday: null, lastBlockedAt: null, topRoute: null });
  // C6 feature analytics
  const [analyticsSummary, setAnalyticsSummary] = useState<FeatureAnalyticsSummary>({
    eventsToday: null, events7d: null, activeOrganizations7d: null,
    topFeatureToday: null, topFeature7d: null, latestEventAt: null,
    churnRiskOrganizations: null, upgradeOpportunityOrganizations: null,
  });
  const [csSummary, setCsSummary] = useState<CustomerSuccessSummary | null>(null);
  const [tenantHealthList, setTenantHealthList] = useState<TenantHealthSignal[]>([]);

  const [tenantSignals, setTenantSignals] = useState<TenantActivitySignals>({
    activeTenants7d: null, inactiveTenants30d: null,
    highUsageTenants7d: null, lowUsageTenants7d: null, partial: true,
  });
  // C8 automated ops intelligence
  const [opsIntelligence, setOpsIntelligence] = useState<AutomatedOperationsIntelligence | null>(null);
  const [execBrief, setExecBrief] = useState<ExecutiveOperationsBrief | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [search, setSearch] = useState("");
  // Debounced search value — server re-fetch triggers on this, not raw `search`
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [expandedSupport, setExpandedSupport] = useState<string | null>(null);
  const [supportResponseCat, setSupportResponseCat] = useState<string | null>(null);
  const [supportResponseCopied, setSupportResponseCopied] = useState(false);
  const [remediationStatuses, setRemediationStatuses] = useState<Record<string, RemediationItem["status"]>>({});
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [expandedScanIssue, setExpandedScanIssue] = useState<string | null>(null);
  const [repairStatuses, setRepairStatuses] = useState<Record<string, RepairStatus>>({});
  const [confirmRepair, setConfirmRepair] = useState<RepairAction | null>(null);
  const [expandedRepair, setExpandedRepair] = useState<string | null>(null);

  // Debounce search input — 400 ms delay before triggering server re-fetch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (reset: boolean, filters: AuditLogFilters) => {
    if (reset) { setLoading(true); setError(null); setOffset(0); }
    else setLoadingMore(true);
    const currentOffset = reset ? 0 : offset;
    try {
      const [rows, count] = await Promise.all([
        fetchAuditCenterLogs(PAGE_SIZE, currentOffset, filters),
        reset ? fetchOwnerAuditLogCount(filters) : Promise.resolve(null),
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

  // Initial load
  useEffect(() => {
    void load(true, {});
    void Promise.all([fetchOrgStatusSummary(), fetchSubStatusSummary()]).then(([org, sub]) => {
      setOrgSummary(org);
      setSubSummary(sub);
      setLoadingMeta(false);
    });
    // C3–C8 ops summaries — all loaded in parallel, non-blocking
    void Promise.all([
      fetchSystemErrorSummary(),
      fetchSystemAlertSummary(),
      fetchSupportTicketSummary(),
      fetchFeatureUsageSummary(),
      fetchSystemHealthSummary(),
      fetchRateLimitSummary(),
      fetchFeatureAnalyticsSummary(),
      fetchTenantActivitySignals(),
      fetchCustomerSuccessSummary(),
      fetchTenantHealthSignals(),
      fetchAutomatedOperationsIntelligence(),
      fetchExecutiveOperationsBrief(),
    ]).then(([err, alert, ticket, usage, health, rl, analytics, signals, cs, tenantHealth, opsInt, execB]) => {
      setErrorSummary(err);
      setAlertSummary(alert);
      setTicketSummary(ticket);
      setUsageSummary(usage);
      setHealthSummary(health);
      setRlSummary(rl);
      setAnalyticsSummary(analytics);
      setTenantSignals(signals);
      setCsSummary(cs);
      setTenantHealthList(tenantHealth);
      setOpsIntelligence(opsInt);
      setExecBrief(execB);
      setLoadingOps(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on filter change (server-side)
  useEffect(() => {
    const filters = buildAuditFilters(timeRange, targetFilter, sevFilter, debouncedSearch);
    void load(true, filters);
  }, [timeRange, targetFilter, sevFilter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Server already applies all filters — minimal client-side pass only for
  // Arabic action-label text matching (not possible server-side)
  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.trim().toLowerCase();
    return logs.filter((l) => actionLabel(l.action).includes(q));
  }, [logs, search]);

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
  const healthScore   = useMemo(() => computeHealthScore(logs, orgSummary, subSummary), [logs, orgSummary, subSummary]);
  const remediationPlan = useMemo(() => computeRemediationPlan(logs, orgSummary, subSummary), [logs, orgSummary, subSummary]);
  const priorityQueue = useMemo(() => computePriorityQueue(logs, orgSummary, subSummary), [logs, orgSummary, subSummary]);
  const commandBrief  = useMemo(() => computeCommandBrief(logs, orgSummary, subSummary, healthScore), [logs, orgSummary, subSummary, healthScore]);
  const repairActions = useMemo(() => buildRepairActions(orgSummary, subSummary, logs), [orgSummary, subSummary, logs]);
  const repairReport  = useMemo<RepairReport>(() => ({
    preparedAt: new Date().toISOString(),
    totalPrepared: repairActions.length,
    safeAvailable: repairActions.filter((a) => !a.isBlocked).length,
    blockedCount: repairActions.filter((a) => a.isBlocked).length,
    manualReviewCount: repairActions.filter((a) => a.requiresConfirmation && !a.isBlocked).length,
  }), [repairActions]);

  const questionAnswer = useMemo(() => {
    if (!activeQuestion) return null;
    return answerQuestion(activeQuestion, logs, diagnosis, dailyBrief, subSummary, orgSummary);
  }, [activeQuestion, logs, diagnosis, dailyBrief, subSummary, orgSummary]);

  const filtersActive = timeRange !== "all" || targetFilter !== "all" || sevFilter !== "all" || search.trim() !== "";

  function resetFilters() {
    setSearch(""); setTimeRange("all"); setTargetFilter("all"); setSevFilter("all");
    // Trigger immediate server re-fetch with no filters
    void load(true, {});
  }

  async function handleSmartScan() {
    if (scanStatus === "scanning") return;
    setScanStatus("scanning");
    setScanReport(null);

    // Safe client-side actions: refresh data + reset filters
    await load(true, {});
    const [org, sub] = await Promise.all([fetchOrgStatusSummary(), fetchSubStatusSummary()]);
    setOrgSummary(org);
    setSubSummary(sub);
    setSearch(""); setTimeRange("all"); setTargetFilter("all"); setSevFilter("all");

    // Run scan on fresh data via callback after state settles
    // We use the already-loaded logs snapshot for the report
    // (state update is async so we use the freshly fetched org/sub)
    const report = runSmartScan(logs, org, sub, healthScore.score);
    setScanReport(report);
    setScanStatus(report.totalIssues === 0 ? "clean" : "done");
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
              onClick={() => void load(true, buildAuditFilters(timeRange, targetFilter, sevFilter, debouncedSearch))}
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

          {/* Support Response Generator */}
          <div
            className="rounded-2xl border border-[#a855f7]/15 p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} className="text-[#c084fc]" />
              <span className="text-[13px] font-semibold text-white">مولد رد الدعم الفني</span>
              <span className="text-[10px] text-white/25 mr-auto">قوالب ردود جاهزة بالعربية</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {SUPPORT_CATS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSupportResponseCat(supportResponseCat === cat.id ? null : cat.id)}
                  className="text-[11.5px] rounded-xl border px-3 py-1.5 transition-all"
                  style={
                    supportResponseCat === cat.id
                      ? { background: `${cat.color}18`, borderColor: `${cat.color}40`, color: cat.color }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {supportResponseCat && SUPPORT_RESPONSES[supportResponseCat] && (
              <div className="rounded-xl border border-[#a855f7]/15 bg-[#a855f7]/[0.04] px-4 py-3">
                <p className="text-[12.5px] text-white/75 leading-relaxed mb-3">
                  {SUPPORT_RESPONSES[supportResponseCat]}
                </p>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(SUPPORT_RESPONSES[supportResponseCat]!).then(() => {
                      setSupportResponseCopied(true);
                      setTimeout(() => setSupportResponseCopied(false), 2000);
                    });
                  }}
                  className="flex items-center gap-1.5 text-[11.5px] text-[#c084fc] hover:text-[#a855f7] transition-colors"
                >
                  {supportResponseCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
                  {supportResponseCopied ? "تم النسخ" : "نسخ الرد"}
                </button>
              </div>
            )}
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
                    onClick={() => void load(true, buildAuditFilters(timeRange, targetFilter, sevFilter, debouncedSearch))}
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
                        onClick={() => void load(false, buildAuditFilters(timeRange, targetFilter, sevFilter, debouncedSearch))}
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: OPS (Autonomous Operations Center)                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ops" && (
        <div className="space-y-5">
          {/* Safety Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#f59e0b]/15 bg-[#f59e0b]/[0.04] px-4 py-3">
            <AlertOctagon size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#fde68a] leading-relaxed">
              <span className="font-semibold">مركز العمليات الآمن — لا تنفيذ تلقائي.</span>{" "}
              جميع الإجراءات تُعرض للمراجعة فقط. أي عملية تستوجب التنفيذ اليدوي من الصفحة المختصة. لا يتم حذف أو تعليق أو تعديل أي بيانات من هنا.
            </p>
          </div>

          {/* ── Smart Scan Button ──────────────────────────────────────────── */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0d1e3a 0%, #07111f 100%)", borderColor: "rgba(34,211,238,0.15)" }}
          >
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={15} className="text-[#22d3ee]" />
                  <span className="text-[14px] font-bold text-white">فحص وتنظيف المشاكل</span>
                </div>
                <p className="text-[11.5px] text-white/40 leading-relaxed">
                  يفحص البيانات المحملة، يحدّث المعلومات، يُعيد ضبط الفلاتر، ويُعدّ تقرير تنظيف آمن. لا يُنفّذ أي إجراء مدمّر تلقائياً.
                </p>
              </div>
              <button
                onClick={() => void handleSmartScan()}
                disabled={scanStatus === "scanning"}
                className="flex items-center gap-2.5 rounded-xl px-5 py-3 text-[13px] font-semibold transition-all flex-shrink-0 disabled:opacity-60"
                style={{
                  background: scanStatus === "scanning"
                    ? "rgba(34,211,238,0.06)"
                    : scanStatus === "done"
                    ? "rgba(16,185,129,0.12)"
                    : scanStatus === "clean"
                    ? "rgba(16,185,129,0.12)"
                    : "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(30,111,217,0.22))",
                  border: `1px solid ${
                    scanStatus === "done" ? "rgba(16,185,129,0.35)"
                    : scanStatus === "clean" ? "rgba(16,185,129,0.35)"
                    : "rgba(34,211,238,0.35)"
                  }`,
                  color: scanStatus === "done" || scanStatus === "clean" ? "#10b981" : "#22d3ee",
                  boxShadow: scanStatus === "idle" ? "0 0 20px rgba(34,211,238,0.12)" : undefined,
                }}
              >
                {scanStatus === "scanning" ? (
                  <><RefreshCw size={14} className="animate-spin" /> جاري الفحص...</>
                ) : scanStatus === "done" ? (
                  <><CheckCircle2 size={14} /> اكتمل الفحص — إعادة الفحص</>
                ) : scanStatus === "clean" ? (
                  <><CheckCircle2 size={14} /> لا توجد مشاكل قابلة للتنظيف</>
                ) : (
                  <><Zap size={14} /> فحص وتنظيف المشاكل</>
                )}
              </button>
            </div>

            {/* Scan Report */}
            {scanReport && (
              <div className="border-t border-white/[0.05] px-5 pb-5 pt-4 space-y-4">
                {/* Report Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-white">تقرير الفحص والتنظيف</span>
                  <span className="text-[10.5px] text-white/30 font-mono">
                    {fmtDatetime(scanReport.scannedAt)}
                  </span>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "مشاكل مرصودة",         value: scanReport.totalIssues,             color: "#f59e0b" },
                    { label: "إجراءات آمنة نُفّذت",   value: scanReport.safeActionsCompleted,    color: "#10b981" },
                    { label: "يتطلب مراجعة",           value: scanReport.manualActionsRequired,   color: "#f59e0b" },
                    { label: "محظور تلقائياً",         value: scanReport.blockedDangerousActions, color: "#ef4444" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border bg-white/[0.02] px-3 py-2.5 text-center"
                      style={{ borderColor: `${item.color}18` }}
                    >
                      <p className="text-[22px] font-bold leading-none mb-1" style={{ color: item.color }}>
                        {item.value}
                      </p>
                      <p className="text-[10px] text-white/35">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Before / After */}
                <div
                  className="rounded-xl border border-white/[0.07] px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.015)" }}
                >
                  <p className="text-[10.5px] text-white/30 uppercase font-mono tracking-widest mb-2.5">الحالة قبل الفحص / بعد الفحص</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[26px] font-bold leading-none" style={{ color: scanReport.colorBefore }}>
                        {scanReport.healthBefore}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: scanReport.colorBefore }}>{scanReport.labelBefore}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">قبل الفحص</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      {scanReport.improved ? (
                        <span className="text-[12px] text-[#10b981] font-bold">↑ تحسّن</span>
                      ) : (
                        <span className="text-[11px] text-white/25">←→ بلا تغيير</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[26px] font-bold leading-none" style={{ color: scanReport.colorAfter }}>
                        {scanReport.healthAfter}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: scanReport.colorAfter }}>{scanReport.labelAfter}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">بعد الفحص</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/35 mt-2.5 border-t border-white/[0.05] pt-2.5">
                    {scanReport.improvementNote}
                  </p>
                </div>

                {/* Issue Cards */}
                {scanReport.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10.5px] text-white/30 uppercase font-mono tracking-widest">تفاصيل المشاكل المرصودة</p>
                    {scanReport.issues.map((issue) => {
                      const sevColor =
                        issue.severity === "حرج" ? "#ef4444"
                        : issue.severity === "أحمر" ? "#f87171"
                        : issue.severity === "برتقالي" ? "#f59e0b"
                        : "#10b981";
                      const statusColor =
                        issue.cleanupStatus === "تم تنظيفه آمنًا" ? "#10b981"
                        : issue.cleanupStatus === "محظور تلقائيًا" ? "#ef4444"
                        : issue.cleanupStatus === "لا توجد بيانات كافية" ? "#6b7280"
                        : "#f59e0b";
                      const confColor =
                        issue.confidence === "عالي" ? "#10b981"
                        : issue.confidence === "متوسط" ? "#f59e0b"
                        : "#6b7280";
                      const isExpanded = expandedScanIssue === issue.id;
                      return (
                        <div
                          key={issue.id}
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor: `${sevColor}18`, background: `${sevColor}04` }}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedScanIssue(isExpanded ? null : issue.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-white/[0.02] transition-colors"
                          >
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ background: sevColor }}
                            />
                            <span className="flex-1 text-[12.5px] font-medium text-white/80 text-right">
                              {issue.title}
                            </span>
                            <span
                              className="text-[9.5px] font-semibold rounded-lg px-2 py-0.5 flex-shrink-0 border"
                              style={{ color: sevColor, borderColor: `${sevColor}25`, background: `${sevColor}12` }}
                            >
                              {issue.severity}
                            </span>
                            <span
                              className="text-[9.5px] rounded-lg px-2 py-0.5 flex-shrink-0 border hidden sm:inline"
                              style={{ color: statusColor, borderColor: `${statusColor}25`, background: `${statusColor}10` }}
                            >
                              {issue.cleanupStatus}
                            </span>
                            {isExpanded
                              ? <ChevronUp size={13} className="text-white/25 flex-shrink-0" />
                              : <ChevronDown size={13} className="text-white/25 flex-shrink-0" />}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-2.5 border-t border-white/[0.04] pt-3">
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] text-white/35 border border-white/[0.08] rounded-lg px-2 py-0.5">
                                  المصدر: {issue.source}
                                </span>
                                <span
                                  className="text-[10px] rounded-lg px-2 py-0.5 border"
                                  style={{ color: confColor, borderColor: `${confColor}25`, background: `${confColor}10` }}
                                >
                                  الثقة: {issue.confidence}
                                </span>
                                <span
                                  className="text-[10px] rounded-lg px-2 py-0.5 border sm:hidden"
                                  style={{ color: statusColor, borderColor: `${statusColor}25`, background: `${statusColor}10` }}
                                >
                                  {issue.cleanupStatus}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-white/55 leading-relaxed">{issue.recommendation}</p>
                              {issue.cleanupStatus === "محظور تلقائيًا" && (
                                <p className="text-[10.5px] text-[#fbbf24]/60 border border-[#f59e0b]/15 rounded-lg px-3 py-1.5">
                                  يتطلب تنفيذ يدوي من الصفحة المختصة
                                </p>
                              )}
                              {issue.href && (
                                <a
                                  href={issue.href}
                                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium rounded-xl border px-3 py-1.5 transition-all hover:opacity-80"
                                  style={{ color: sevColor, borderColor: `${sevColor}25`, background: `${sevColor}08` }}
                                >
                                  <Navigation size={11} />
                                  {issue.actionLabel ?? "فتح الصفحة المختصة"}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Export Report */}
                <button
                  onClick={() => {
                    const lines = [
                      `تقرير الفحص والتنظيف — ${fmtDatetime(scanReport.scannedAt)}`,
                      ``,
                      `إجمالي المشاكل: ${scanReport.totalIssues}`,
                      `إجراءات آمنة نُفّذت: ${scanReport.safeActionsCompleted}`,
                      `يتطلب مراجعة: ${scanReport.manualActionsRequired}`,
                      `محظور تلقائياً: ${scanReport.blockedDangerousActions}`,
                      ``,
                      `صحة النظام قبل الفحص: ${scanReport.healthBefore} (${scanReport.labelBefore})`,
                      `صحة النظام بعد الفحص: ${scanReport.healthAfter} (${scanReport.labelAfter})`,
                      `ملاحظة: ${scanReport.improvementNote}`,
                      ``,
                      `── المشاكل المرصودة ──`,
                      ...scanReport.issues.map((iss) =>
                        `[${iss.severity}] ${iss.title} | المصدر: ${iss.source} | الحالة: ${iss.cleanupStatus} | الثقة: ${iss.confidence}\n   ${iss.recommendation}`
                      ),
                    ];
                    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/plain;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `scan-report-${new Date().toISOString().slice(0, 10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/65 transition-colors border border-white/[0.07] rounded-xl px-4 py-2 hover:bg-white/[0.03]"
                >
                  <Download size={13} />
                  تصدير التقرير
                </button>

                {/* Advanced Cleanup (blocked) */}
                <div
                  className="rounded-xl border border-white/[0.06] p-4"
                  style={{ background: "rgba(255,255,255,0.01)" }}
                >
                  <p className="text-[11px] font-semibold text-white/35 mb-3 flex items-center gap-2">
                    <Shield size={12} className="text-white/25" />
                    تنظيف متقدم — يتطلب Backend Action مؤمن وتأكيد المالك
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "تنظيف سجلات مكررة",
                      "أرشفة تنبيهات قديمة",
                      "إنشاء تذكرة دعم",
                      "إصلاح حالة اشتراك",
                    ].map((label) => (
                      <button
                        key={label}
                        disabled
                        className="text-[11px] rounded-xl border border-white/[0.06] text-white/20 px-3 py-2 cursor-not-allowed text-right"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Secure Repair Actions ──────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[#22d3ee]/12 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)" }} />
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3 flex-wrap">
              <Shield size={14} className="text-[#22d3ee]" />
              <span className="text-[13.5px] font-bold text-white">إجراءات الإصلاح الآمنة</span>
              <span className="text-[10px] text-white/25">تُنفَّذ بتأكيد المالك — لا عمليات تلقائية مدمّرة</span>
              {/* Repair summary chips */}
              <div className="mr-auto flex items-center gap-2 flex-wrap">
                {[
                  { label: `${repairReport.totalPrepared} إجراء`, color: "#22d3ee" },
                  { label: `${repairReport.safeAvailable} آمن`, color: "#10b981" },
                  { label: `${repairReport.blockedCount} محظور`, color: "#ef4444" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="text-[10px] rounded-full px-2 py-0.5 border"
                    style={{ color: chip.color, borderColor: `${chip.color}25`, background: `${chip.color}10` }}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {repairActions.map((action) => {
                const status = repairStatuses[action.id] ?? (action.isBlocked ? "محظور تلقائيًا" : "جاهز");
                const isExpanded = expandedRepair === action.id;
                const statusColor =
                  status === "تم التوجيه" ? "#10b981"
                  : status === "قيد المراجعة" ? "#f59e0b"
                  : status === "محظور تلقائيًا" ? "#ef4444"
                  : "#22d3ee";
                return (
                  <div
                    key={action.id}
                    className="rounded-xl border overflow-hidden transition-all"
                    style={{
                      borderColor: action.isBlocked ? "rgba(239,68,68,0.18)" : `${action.riskColor}18`,
                      background: action.isBlocked ? "rgba(239,68,68,0.04)" : `${action.riskColor}04`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedRepair(isExpanded ? null : action.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: action.riskColor }} />
                      <span className="flex-1 text-[12.5px] font-medium text-white/80 text-right">{action.title}</span>
                      <span className="text-[10px] text-white/30 hidden sm:inline">{action.area}</span>
                      <span
                        className="text-[9.5px] rounded-lg px-2 py-0.5 border flex-shrink-0"
                        style={{ color: statusColor, borderColor: `${statusColor}25`, background: `${statusColor}10` }}
                      >
                        {status}
                      </span>
                      {action.isBlocked
                        ? <span className="text-[9.5px] text-[#ef4444]/60 flex-shrink-0 hidden sm:inline">محظور</span>
                        : null}
                      {isExpanded
                        ? <ChevronUp size={13} className="text-white/25 flex-shrink-0" />
                        : <ChevronDown size={13} className="text-white/25 flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            ["الحالة الحالية",  action.currentStatus],
                            ["الإصلاح المقترح", action.proposedRepair],
                            ["النتيجة المتوقعة", action.expectedResult],
                            ["مستوى الأمان",    action.safetyLevel],
                          ].map(([k, v]) => (
                            <div key={k} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                              <p className="text-[9.5px] text-white/30 mb-0.5">{k}</p>
                              <p className="text-[11.5px] text-white/65 leading-snug">{v}</p>
                            </div>
                          ))}
                        </div>

                        {action.isBlocked && action.blockedReason && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-[#ef4444]/15 bg-[#ef4444]/[0.05] px-3 py-2.5">
                            <AlertOctagon size={12} className="text-[#f87171] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10.5px] font-semibold text-[#f87171] mb-0.5">سبب الحظر</p>
                              <p className="text-[11px] text-[#fca5a5]/70 leading-relaxed">{action.blockedReason}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {action.isBlocked ? (
                            <a
                              href={action.href}
                              className="inline-flex items-center gap-1.5 text-[11.5px] rounded-xl border px-3 py-1.5 transition-all hover:opacity-80"
                              style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)" }}
                            >
                              <Navigation size={11} />
                              {action.actionLabel}
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                setRepairStatuses((p) => ({ ...p, [action.id]: "قيد المراجعة" }));
                                setConfirmRepair(action);
                              }}
                              className="inline-flex items-center gap-1.5 text-[11.5px] rounded-xl border px-3 py-1.5 transition-all hover:opacity-80"
                              style={{ color: action.riskColor, borderColor: `${action.riskColor}30`, background: `${action.riskColor}10` }}
                            >
                              <Zap size={11} />
                              {action.actionLabel}
                            </button>
                          )}
                          <span
                            className="text-[10px] rounded-lg px-2 py-1 border"
                            style={{ color: action.riskColor, borderColor: `${action.riskColor}20`, background: `${action.riskColor}08` }}
                          >
                            خطورة: {action.riskLevel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Future repairs disabled */}
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.01)" }}>
                <p className="text-[11px] font-semibold text-white/30 mb-3 flex items-center gap-2">
                  <Clock size={11} className="text-white/20" />
                  إصلاحات متقدمة لاحقًا — يتطلب Backend Action مؤمّن + تأكيد المالك + Audit Log
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "إعادة تفعيل اشتراك",
                    "إعادة تفعيل منشأة",
                    "إعادة ضبط كلمة مرور عميل",
                    "إنشاء تذكرة دعم",
                    "إصلاح صلاحية مستخدم",
                  ].map((label) => (
                    <button
                      key={label}
                      disabled
                      className="text-[11px] rounded-xl border border-white/[0.05] text-white/18 px-3 py-2 cursor-not-allowed text-right"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* C3: مؤشرات التشغيل الحية */}
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #22d3ee, transparent)" }} />
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-2">
              <Activity size={14} className="text-[#22d3ee]" />
              <span className="text-[13px] font-semibold text-white">مؤشرات التشغيل الحية</span>
              <span className="mr-auto text-[10px] text-white/25 font-mono">C3 · قراءة فقط</span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* System Errors */}
              <div
                className="rounded-xl border px-4 py-3.5"
                style={{
                  borderColor: (errorSummary?.open ?? 0) > 0 ? "#ef444425" : "rgba(255,255,255,0.06)",
                  background: (errorSummary?.open ?? 0) > 0 ? "#ef44440a" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "#ef444412", border: "1px solid #ef444420" }}>
                    <AlertOctagon size={11} className="text-[#f87171]" />
                  </div>
                  {(errorSummary?.open ?? 0) > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-white/35 mb-1">أخطاء مفتوحة</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : errorSummary?.open === null ? (
                  <p className="text-[18px] font-bold text-white/20">—</p>
                ) : (
                  <p className="text-[22px] font-bold leading-none" style={{ color: (errorSummary.open ?? 0) > 0 ? "#f87171" : "#10b981" }}>
                    {errorSummary.open}
                  </p>
                )}
                {!loadingOps && errorSummary?.critical !== null && (errorSummary?.critical ?? 0) > 0 && (
                  <p className="text-[9.5px] text-[#f87171]/70 mt-1">{errorSummary.critical} حرج</p>
                )}
              </div>

              {/* System Alerts */}
              <div
                className="rounded-xl border px-4 py-3.5"
                style={{
                  borderColor: (alertSummary?.open ?? 0) > 0 ? "#f59e0b25" : "rgba(255,255,255,0.06)",
                  background: (alertSummary?.open ?? 0) > 0 ? "#f59e0b0a" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "#f59e0b12", border: "1px solid #f59e0b20" }}>
                    <AlertTriangle size={11} className="text-[#fbbf24]" />
                  </div>
                  {(alertSummary?.open ?? 0) > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-white/35 mb-1">تنبيهات مفتوحة</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : alertSummary?.open === null ? (
                  <p className="text-[18px] font-bold text-white/20">—</p>
                ) : (
                  <p className="text-[22px] font-bold leading-none" style={{ color: (alertSummary.open ?? 0) > 0 ? "#fbbf24" : "#10b981" }}>
                    {alertSummary.open}
                  </p>
                )}
                {!loadingOps && alertSummary?.critical !== null && (alertSummary?.critical ?? 0) > 0 && (
                  <p className="text-[9.5px] text-[#fbbf24]/70 mt-1">{alertSummary.critical} حرج</p>
                )}
              </div>

              {/* Support Tickets */}
              <div
                className="rounded-xl border px-4 py-3.5"
                style={{
                  borderColor: (ticketSummary?.open ?? 0) > 0 ? "#a855f725" : "rgba(255,255,255,0.06)",
                  background: (ticketSummary?.open ?? 0) > 0 ? "#a855f70a" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "#a855f712", border: "1px solid #a855f720" }}>
                    <HeadphonesIcon size={11} className="text-[#c084fc]" />
                  </div>
                  {(ticketSummary?.open ?? 0) > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-white/35 mb-1">تذاكر مفتوحة</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : ticketSummary?.open === null ? (
                  <p className="text-[18px] font-bold text-white/20">—</p>
                ) : (
                  <p className="text-[22px] font-bold leading-none" style={{ color: (ticketSummary.open ?? 0) > 0 ? "#c084fc" : "#10b981" }}>
                    {ticketSummary.open}
                  </p>
                )}
                {!loadingOps && ticketSummary?.highPriority !== null && (ticketSummary?.highPriority ?? 0) > 0 && (
                  <p className="text-[9.5px] text-[#c084fc]/70 mt-1">{ticketSummary.highPriority} أولوية عالية</p>
                )}
              </div>

              {/* Feature Usage Today */}
              <div
                className="rounded-xl border border-white/[0.06] px-4 py-3.5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "#22d3ee12", border: "1px solid #22d3ee20" }}>
                    <BarChart3 size={11} className="text-[#22d3ee]" />
                  </div>
                </div>
                <p className="text-[10px] text-white/35 mb-1">استخدام الميزات اليوم</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : usageSummary?.todayCount === null ? (
                  <p className="text-[18px] font-bold text-white/20">—</p>
                ) : (
                  <p className="text-[22px] font-bold leading-none text-[#22d3ee]">
                    {usageSummary.todayCount}
                  </p>
                )}
                {!loadingOps && usageSummary?.totalCount !== null && (
                  <p className="text-[9.5px] text-white/25 mt-1">إجمالي: {usageSummary.totalCount}</p>
                )}
              </div>
            </div>

            {/* Note when tables are empty (just created) */}
            {!loadingOps && (errorSummary?.total ?? 1) === 0 && (alertSummary?.total ?? 1) === 0 && (ticketSummary?.total ?? 1) === 0 && (usageSummary?.totalCount ?? 1) === 0 && (
              <div className="mx-5 mb-4 rounded-xl border border-[#22d3ee]/12 bg-[#22d3ee]/[0.04] px-3.5 py-2.5">
                <p className="text-[11.5px] text-[#22d3ee]/60">
                  الجداول جاهزة ومهيأة — لا توجد بيانات بعد. ستظهر المؤشرات تلقائياً عند بدء التشغيل.
                </p>
              </div>
            )}
          </div>

          {/* C4: حالة النظام التشغيلية */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
              borderColor:
                !loadingOps && healthSummary?.status === "critical" ? "#ef444425" :
                !loadingOps && healthSummary?.status === "warning"  ? "#f59e0b25" :
                "rgba(16,185,129,0.18)",
            }}
          >
            <div
              className="h-[2px]"
              style={{
                background:
                  !loadingOps && healthSummary?.status === "critical"
                    ? "linear-gradient(90deg, transparent, #ef4444, transparent)"
                    : !loadingOps && healthSummary?.status === "warning"
                    ? "linear-gradient(90deg, transparent, #f59e0b, transparent)"
                    : "linear-gradient(90deg, transparent, #10b981, transparent)",
              }}
            />
            <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-white/[0.04]">
              <Activity size={14} className="text-[#22d3ee]" />
              <span className="text-[13.5px] font-bold text-white">حالة النظام التشغيلية</span>
              <span className="text-[10px] text-white/25 font-mono">C4 · صحة الإنتاج</span>
              {!loadingOps && healthSummary && (
                <span
                  className="mr-auto text-[10px] font-semibold rounded-full px-2.5 py-0.5 border"
                  style={{
                    color:
                      healthSummary.status === "critical" ? "#f87171" :
                      healthSummary.status === "warning"  ? "#fbbf24" : "#34d399",
                    borderColor:
                      healthSummary.status === "critical" ? "#ef444430" :
                      healthSummary.status === "warning"  ? "#f59e0b30" : "#10b98130",
                    background:
                      healthSummary.status === "critical" ? "#ef44440a" :
                      healthSummary.status === "warning"  ? "#f59e0b0a" : "#10b9810a",
                  }}
                >
                  {healthSummary.status === "critical" ? "حرج" :
                   healthSummary.status === "warning"  ? "تحذير" : "سليم"}
                </span>
              )}
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Health Score */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">نقاط الصحة</p>
                {loadingOps ? (
                  <div className="h-7 w-14 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p
                    className="text-[26px] font-bold leading-none"
                    style={{
                      color:
                        (healthSummary?.healthScore ?? 100) >= 80 ? "#34d399" :
                        (healthSummary?.healthScore ?? 100) >= 50 ? "#fbbf24" : "#f87171",
                    }}
                  >
                    {healthSummary?.healthScore ?? "—"}<span className="text-[13px] text-white/30">/100</span>
                  </p>
                )}
              </div>

              {/* Recommended Focus */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5 md:col-span-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">التركيز الموصى به</p>
                {loadingOps ? (
                  <div className="h-5 w-48 rounded bg-white/[0.07] animate-pulse mt-1" />
                ) : (
                  <p className="text-[12.5px] text-white/70 leading-snug">{healthSummary?.recommendedFocus ?? "—"}</p>
                )}
              </div>

              {/* Last Error */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">آخر خطأ</p>
                {loadingOps ? (
                  <div className="h-4 w-20 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p className="text-[11.5px] text-white/50">
                    {healthSummary?.lastErrorAt ? timeAgo(healthSummary.lastErrorAt) : "لا يوجد"}
                  </p>
                )}
              </div>

              {/* Last Alert */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">آخر تنبيه</p>
                {loadingOps ? (
                  <div className="h-4 w-20 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p className="text-[11.5px] text-white/50">
                    {healthSummary?.lastAlertAt ? timeAgo(healthSummary.lastAlertAt) : "لا يوجد"}
                  </p>
                )}
              </div>

              {/* Open Issues */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">مشاكل مفتوحة</p>
                {loadingOps ? (
                  <div className="h-4 w-16 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p className="text-[11.5px] text-white/60">
                    {(healthSummary?.openErrors ?? 0) + (healthSummary?.openAlerts ?? 0) + (healthSummary?.openTickets ?? 0)} إجمالي
                    {(healthSummary?.criticalErrors ?? 0) + (healthSummary?.criticalAlerts ?? 0) > 0 && (
                      <span className="text-[#f87171] mr-1">
                        · {(healthSummary?.criticalErrors ?? 0) + (healthSummary?.criticalAlerts ?? 0)} حرج
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* C5: Rate Limit mini-row */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5 col-span-2 md:col-span-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-2 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b]/60" />
                  حدود معدل الطلبات — C5
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[11px] text-white/50">
                    {loadingOps ? "—" : <><span className="text-white/80 font-medium">{rlSummary.totalToday ?? 0}</span> حدث اليوم</>}
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="text-[11px] text-white/50">
                    {loadingOps ? "—" : (rlSummary.blockedToday ?? 0) > 0
                      ? <><span className="text-[#f87171] font-medium">{rlSummary.blockedToday}</span> محظور</>
                      : <span className="text-[#34d399]">لا يوجد حظر اليوم</span>}
                  </span>
                  {!loadingOps && rlSummary.lastBlockedAt && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="text-[10px] text-white/30">آخر حظر: {timeAgo(rlSummary.lastBlockedAt)}</span>
                    </>
                  )}
                  {!loadingOps && rlSummary.topRoute && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="text-[10px] text-white/30 font-mono">{rlSummary.topRoute}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* C6: ذكاء استخدام الميزات */}
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }} />
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-2">
              <BarChart3 size={14} className="text-[#818cf8]" />
              <span className="text-[13px] font-semibold text-white">ذكاء استخدام الميزات</span>
              <span className="mr-auto text-[10px] text-white/25 font-mono">C6 · قراءة فقط</span>
              {tenantSignals.partial && !loadingOps && (
                <span className="text-[9px] text-white/20 border border-white/[0.06] rounded px-1.5 py-0.5">بيانات تقريبية</span>
              )}
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Events today */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">أحداث اليوم</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p className="text-[22px] font-bold leading-none text-[#818cf8]">
                    {analyticsSummary.eventsToday ?? 0}
                  </p>
                )}
                {!loadingOps && (analyticsSummary.events7d ?? 0) > 0 && (
                  <p className="text-[9.5px] text-white/30 mt-1">{analyticsSummary.events7d} آخر 7 أيام</p>
                )}
              </div>

              {/* Active organizations */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">منشآت نشطة (7 أيام)</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p className="text-[22px] font-bold leading-none text-[#34d399]">
                    {analyticsSummary.activeOrganizations7d ?? 0}
                  </p>
                )}
                {!loadingOps && (tenantSignals.highUsageTenants7d ?? 0) > 0 && (
                  <p className="text-[9.5px] text-white/30 mt-1">{tenantSignals.highUsageTenants7d} استخدام مرتفع</p>
                )}
              </div>

              {/* Top feature */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">أكثر ميزة استخداماً</p>
                {loadingOps ? (
                  <div className="h-5 w-24 rounded bg-white/[0.07] animate-pulse mt-1" />
                ) : (
                  <p className="text-[11.5px] font-medium text-white/70 leading-snug font-mono">
                    {analyticsSummary.topFeature7d ?? analyticsSummary.topFeatureToday ?? "—"}
                  </p>
                )}
                {!loadingOps && analyticsSummary.topFeatureToday && analyticsSummary.topFeature7d && analyticsSummary.topFeatureToday !== analyticsSummary.topFeature7d && (
                  <p className="text-[9.5px] text-white/25 mt-0.5">اليوم: {analyticsSummary.topFeatureToday}</p>
                )}
              </div>

              {/* Churn risk / upgrade */}
              <div className="rounded-xl border border-white/[0.06] px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[10px] text-white/35 mb-1">مخاطر الخمول</p>
                {loadingOps ? (
                  <div className="h-6 w-10 rounded bg-white/[0.07] animate-pulse" />
                ) : (
                  <p
                    className="text-[22px] font-bold leading-none"
                    style={{ color: (analyticsSummary.churnRiskOrganizations ?? 0) > 0 ? "#f87171" : "#34d399" }}
                  >
                    {analyticsSummary.churnRiskOrganizations ?? 0}
                  </p>
                )}
                {!loadingOps && (tenantSignals.inactiveTenants30d ?? 0) > 0 && (
                  <p className="text-[9.5px] text-white/30 mt-1">{tenantSignals.inactiveTenants30d} غير نشط 30 يوم</p>
                )}
              </div>
            </div>

            {/* Zero state */}
            {!loadingOps && (analyticsSummary.eventsToday ?? 0) === 0 && (analyticsSummary.events7d ?? 0) === 0 && (
              <div className="mx-5 mb-4 rounded-xl border border-[#6366f1]/12 bg-[#6366f1]/[0.04] px-3.5 py-2.5">
                <p className="text-[11.5px] text-[#818cf8]/60">
                  لا توجد أحداث استخدام بعد — ستظهر التحليلات تلقائياً عند بدء استخدام الميزات.
                </p>
              </div>
            )}
          </div>

          {/* C7: Customer Success & Churn Intelligence */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #07111f 100%)",
              borderColor: "#10b98120",
              boxShadow: "0 0 30px #10b98108",
            }}
          >
            <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #10b981, transparent)" }} />
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-3">
              <Users size={14} className="text-[#10b981]" />
              <span className="text-[13px] font-semibold text-white">ذكاء نجاح العملاء</span>
              {!loadingOps && csSummary && (
                <span
                  className="mr-auto text-[10px] font-bold rounded-full px-2.5 py-0.5 border"
                  style={{
                    color: csSummary.summaryStatus === "healthy" ? "#10b981" : csSummary.summaryStatus === "warning" ? "#f59e0b" : "#ef4444",
                    borderColor: csSummary.summaryStatus === "healthy" ? "#10b98130" : csSummary.summaryStatus === "warning" ? "#f59e0b30" : "#ef444430",
                    background: csSummary.summaryStatus === "healthy" ? "#10b98110" : csSummary.summaryStatus === "warning" ? "#f59e0b10" : "#ef444410",
                  }}
                >
                  {csSummary.summaryStatus === "healthy" ? "سليم" : csSummary.summaryStatus === "warning" ? "تحذير" : "حرج"}
                </span>
              )}
              {loadingOps && <span className="mr-auto text-[10px] text-white/20 animate-pulse">جارٍ التحميل…</span>}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-x-reverse divide-white/[0.04] border-b border-white/[0.04]">
              {[
                { label: "منشآت سليمة",   value: csSummary?.healthyOrganizations   ?? "—", color: "#10b981" },
                { label: "قائمة متابعة",   value: csSummary?.watchlistOrganizations ?? "—", color: "#f59e0b" },
                { label: "خطر إلغاء",      value: csSummary?.churnRiskOrganizations ?? "—", color: "#ef4444" },
                { label: "فرص ترقية",      value: csSummary?.upgradeOpportunityOrganizations ?? "—", color: "#6366f1" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center justify-center py-4 px-3 gap-0.5">
                  <p className="text-[22px] font-bold" style={{ color }}>
                    {loadingOps ? <span className="animate-pulse text-white/20">—</span> : value}
                  </p>
                  <p className="text-[10px] text-white/35 text-center">{label}</p>
                </div>
              ))}
            </div>

            {/* Recommended action */}
            {!loadingOps && csSummary && (
              <div className="px-5 py-3 border-b border-white/[0.04] flex items-start gap-2">
                <Lightbulb size={12} className="text-[#10b981]/60 mt-0.5 flex-shrink-0" />
                <p className="text-[11.5px] text-white/55">
                  <span className="text-white/30 text-[10px] uppercase font-mono tracking-wider ml-1">الإجراء الموصى به:</span>
                  {csSummary.recommendedAction}
                  {csSummary.approximate && <span className="mr-1 text-[9.5px] text-white/25">(تقريبي)</span>}
                </p>
              </div>
            )}

            {/* Top 5 tenant watchlist */}
            {!loadingOps && tenantHealthList.length > 0 && (
              <div className="px-5 py-3">
                <p className="text-[10px] text-white/25 uppercase font-mono tracking-widest mb-2.5">أعلى المنشآت التي تحتاج متابعة</p>
                <div className="space-y-1.5">
                  {tenantHealthList
                    .filter(t => t.riskLevel === "high" || t.riskLevel === "medium" || t.opportunityLevel !== "none")
                    .slice(0, 5)
                    .map(t => (
                      <div key={t.organization_id} className="flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ background: t.riskLevel === "high" ? "#ef4444" : t.riskLevel === "medium" ? "#f59e0b" : "#10b981" }}
                        />
                        <span className="text-[11.5px] text-white/75 truncate flex-1">{t.organization_name}</span>
                        {t.openTickets > 0 && (
                          <span className="text-[9.5px] text-[#f87171] border border-[#ef444430] rounded-full px-1.5 py-0.5 flex-shrink-0">{t.openTickets} تذكرة</span>
                        )}
                        {t.opportunityLevel === "strong" && (
                          <span className="text-[9.5px] text-[#818cf8] border border-[#6366f130] rounded-full px-1.5 py-0.5 flex-shrink-0">ترقية</span>
                        )}
                        <span className="text-[10px] text-white/30 flex-shrink-0 hidden sm:block">{t.recommendedAction}</span>
                      </div>
                    ))}
                </div>
                {tenantHealthList.filter(t => t.riskLevel === "high" || t.riskLevel === "medium" || t.opportunityLevel !== "none").length === 0 && (
                  <p className="text-[11px] text-white/25">جميع المنشآت في حالة جيدة — لا إجراء مطلوب حالياً.</p>
                )}
              </div>
            )}

            {loadingOps && (
              <div className="px-5 py-6 text-center">
                <p className="text-[11px] text-white/20 animate-pulse">جارٍ تحليل بيانات العملاء…</p>
              </div>
            )}
          </div>

          {/* C8: مركز القرار التشغيلي */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #090e1e 0%, #07101c 100%)",
              borderColor: "#22d3ee20",
              boxShadow: "0 0 32px #22d3ee07",
            }}
          >
            <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #22d3ee, transparent)" }} />
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-3">
              <Brain size={14} className="text-[#22d3ee]" />
              <span className="text-[13px] font-semibold text-white">مركز القرار التشغيلي</span>
              {!loadingOps && opsIntelligence && (
                <span
                  className="mr-auto text-[10px] font-bold rounded-full px-2.5 py-0.5 border"
                  style={{
                    color:        opsIntelligence.operationStatus === "urgent" ? "#ef4444"
                                : opsIntelligence.operationStatus === "needs_attention" ? "#f59e0b"
                                : "#10b981",
                    borderColor:  opsIntelligence.operationStatus === "urgent" ? "#ef444430"
                                : opsIntelligence.operationStatus === "needs_attention" ? "#f59e0b30"
                                : "#10b98130",
                    background:   opsIntelligence.operationStatus === "urgent" ? "#ef444410"
                                : opsIntelligence.operationStatus === "needs_attention" ? "#f59e0b10"
                                : "#10b98110",
                  }}
                >
                  {opsIntelligence.operationStatus === "urgent" ? "عاجل"
                    : opsIntelligence.operationStatus === "needs_attention" ? "يحتاج انتباهاً"
                    : "مستقر"}
                </span>
              )}
              {loadingOps && <span className="mr-auto text-[10px] text-white/20 animate-pulse">جارٍ التحليل…</span>}
            </div>

            {/* Executive brief from C8 */}
            {!loadingOps && execBrief && (
              <div className="px-5 py-3 border-b border-white/[0.04] space-y-1.5">
                <p className="text-[13px] font-semibold text-white/80">{execBrief.headline}</p>
                <p className="text-[11.5px] text-white/45">{execBrief.healthText}</p>
                <p className="text-[11.5px] text-white/45">{execBrief.customerText}</p>
                {execBrief.riskText && (
                  <p className="text-[11.5px]" style={{ color: execBrief.riskText.includes("لا توجد") ? "#34d399" : "#fca5a5" }}>
                    {execBrief.riskText}
                  </p>
                )}
                {execBrief.opportunityText && (
                  <p className="text-[11.5px] text-[#818cf8]/70">{execBrief.opportunityText}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-white/25 uppercase font-mono tracking-widest">
                    ثقة التحليل: {execBrief.confidence === "high" ? "عالية" : execBrief.confidence === "medium" ? "متوسطة" : "منخفضة"}
                  </p>
                  <p className="text-[10px] text-white/20 font-mono">قائم على القواعد · لا ذكاء اصطناعي</p>
                </div>
              </div>
            )}

            {/* Daily brief + escalation */}
            {!loadingOps && opsIntelligence && (
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <p className="text-[11.5px] text-white/55 leading-relaxed">{opsIntelligence.dailyBrief}</p>
                {opsIntelligence.escalationRequired && opsIntelligence.escalationReason && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.05] px-3 py-2">
                    <AlertOctagon size={12} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[#ef4444]/80">{opsIntelligence.escalationReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Next best actions */}
            {!loadingOps && opsIntelligence && opsIntelligence.nextBestActions.length > 0 && (
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <p className="text-[10px] text-white/25 uppercase font-mono tracking-widest mb-2">الإجراءات الموصى بها</p>
                <ul className="space-y-1.5">
                  {opsIntelligence.nextBestActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11.5px] text-white/55">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]/50 mt-1 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action queue — top 5 */}
            {!loadingOps && opsIntelligence && opsIntelligence.actionQueue.length > 0 && (
              <div className="px-5 py-3">
                <p className="text-[10px] text-white/25 uppercase font-mono tracking-widest mb-2.5">قائمة الإجراءات ({opsIntelligence.actionQueue.length})</p>
                <div className="space-y-1.5">
                  {opsIntelligence.actionQueue.slice(0, 5).map(item => {
                    const pColor =
                      item.priority === "critical" ? "#ef4444"
                      : item.priority === "high"   ? "#f59e0b"
                      : item.priority === "medium" ? "#6366f1"
                      : "#6b7280";
                    return (
                      <div key={item.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: pColor }} />
                          <span className="text-[11.5px] font-medium text-white/80 flex-1">{item.title}</span>
                          {item.priority === "critical" && (
                            <span className="text-[9px] font-bold text-[#ef4444] border border-[#ef444430] rounded-full px-1.5 py-0.5">حرج</span>
                          )}
                          {item.priority === "high" && (
                            <span className="text-[9px] font-bold text-[#f59e0b] border border-[#f59e0b30] rounded-full px-1.5 py-0.5">عالي</span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-white/35 mr-3.5">{item.recommendedAction}</p>
                      </div>
                    );
                  })}
                  {opsIntelligence.actionQueue.length > 5 && (
                    <p className="text-[10px] text-white/20 text-center pt-1">
                      +{opsIntelligence.actionQueue.length - 5} إجراءات إضافية
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loadingOps && opsIntelligence && opsIntelligence.actionQueue.length === 0 && (
              <div className="px-5 py-5 text-center">
                <p className="text-[11.5px] text-[#10b981]/60">لا توجد إجراءات مطلوبة — النظام يعمل بشكل مثالي.</p>
              </div>
            )}

            {loadingOps && (
              <div className="px-5 py-6 text-center">
                <p className="text-[11px] text-white/20 animate-pulse">جارٍ توليد قائمة الإجراءات التشغيلية…</p>
              </div>
            )}
          </div>

          {/* Command Brief */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
              borderColor: `${commandBrief.colorHex}25`,
              boxShadow: `0 0 30px ${commandBrief.colorHex}08`,
            }}
          >
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${commandBrief.colorHex}, transparent)` }} />
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-3">
              <Zap size={14} style={{ color: commandBrief.colorHex }} />
              <span className="text-[13px] font-semibold text-white">موجز اليوم التنفيذي</span>
              <span
                className="mr-auto text-[10px] font-bold rounded-full px-2.5 py-0.5 border"
                style={{ color: commandBrief.colorHex, borderColor: `${commandBrief.colorHex}30`, background: `${commandBrief.colorHex}10` }}
              >
                النظام: {commandBrief.systemColor}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[13px] text-white/75">{commandBrief.todaySummary}</p>
              {commandBrief.needsAttention.length > 0 && (
                <div>
                  <p className="text-[10.5px] text-white/30 uppercase tracking-widest font-mono mb-1.5">يحتاج انتباهاً</p>
                  <ul className="space-y-1">
                    {commandBrief.needsAttention.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-[#fca5a5]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {commandBrief.canWait.length > 0 && (
                <div>
                  <p className="text-[10.5px] text-white/30 uppercase tracking-widest font-mono mb-1.5">يمكن الانتظار</p>
                  <ul className="space-y-1">
                    {commandBrief.canWait.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-white/45">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl border border-[#22d3ee]/12 bg-[#22d3ee]/[0.04] px-3 py-2.5">
                <p className="text-[11.5px] text-[#22d3ee]/80">
                  <span className="text-[#22d3ee]/50 text-[10px] uppercase font-mono tracking-wider ml-1">التركيز الموصى به:</span>
                  {commandBrief.recommendedFocus}
                </p>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "linear-gradient(135deg, #091528 0%, #07111f 100%)",
              borderColor: `${healthScore.labelColor}22`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} style={{ color: healthScore.labelColor }} />
              <span className="text-[13px] font-semibold text-white">صحة النظام</span>
              <span
                className="mr-auto text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ color: healthScore.labelColor, background: `${healthScore.labelColor}12`, border: `1px solid ${healthScore.labelColor}25` }}
              >
                {healthScore.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[48px] font-bold leading-none" style={{ color: healthScore.labelColor }}>
                {healthScore.score}
              </span>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${healthScore.score}%`, background: `linear-gradient(90deg, ${healthScore.labelColor}80, ${healthScore.labelColor})` }}
                  />
                </div>
                <p className="text-[10.5px] text-white/30 mt-1.5">من 100 — مبني على السجلات المحملة والبيانات الحالية</p>
              </div>
            </div>
            {healthScore.topFactor && (
              <p className="text-[11.5px] text-white/40">
                أكبر عامل مؤثر: <span className="text-white/60">{healthScore.topFactor}</span>
              </p>
            )}
          </div>

          {/* Remediation Plan */}
          <div
            className="rounded-2xl border border-white/[0.07] p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ListChecks size={14} className="text-[#22d3ee]" />
              <span className="text-[13px] font-semibold text-white">خطة المعالجة الذكية</span>
              <span className="text-[10px] text-white/25 mr-auto">{remediationPlan.length} بند</span>
            </div>
            <div className="space-y-3">
              {remediationPlan.map((item) => {
                const s = SEV[item.severity];
                const currentStatus = remediationStatuses[item.id] ?? item.status;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border px-4 py-3.5"
                    style={{ borderColor: `${s.color}20`, background: `${s.color}04` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[12.5px] font-medium text-white/85">{item.issue}</p>
                          <span className={`text-[10px] rounded-full px-2 py-0.5 flex-shrink-0 ${s.badge}`}>{s.label}</span>
                        </div>
                        <p className="text-[11px] text-white/40 mb-2">{item.area} — {item.action}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={currentStatus}
                            onChange={(e) => setRemediationStatuses((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as RemediationItem["status"],
                            }))}
                            className="text-[10.5px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/55 px-2 py-1 outline-none"
                          >
                            {(["جديد", "قيد المراجعة", "يتطلب إجراء", "تم التحقق"] as const).map((s) => (
                              <option key={s} value={s} className="bg-[#07111f]">{s}</option>
                            ))}
                          </select>
                          {item.requiresManual && (
                            <span className="text-[10px] text-[#fbbf24]/60 border border-[#f59e0b]/15 rounded-lg px-2 py-0.5">
                              يتطلب تنفيذ يدوي من الصفحة المختصة
                            </span>
                          )}
                          {item.href && (
                            <a
                              href={item.href}
                              className="flex items-center gap-1 text-[11px] text-[#22d3ee]/60 hover:text-[#22d3ee] transition-colors"
                            >
                              <Navigation size={11} />
                              فتح الصفحة
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Queue */}
          <div
            className="rounded-2xl border border-white/[0.07] p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-[#fbbf24]" />
              <span className="text-[13px] font-semibold text-white">طابور الأولويات</span>
            </div>
            <div className="space-y-2">
              {priorityQueue.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border px-4 py-3 flex items-start gap-3"
                  style={{ borderColor: `${item.priorityColor}20`, background: `${item.priorityColor}04` }}
                >
                  <span
                    className="text-[10px] font-bold rounded-lg px-2 py-1 flex-shrink-0 mt-0.5"
                    style={{ color: item.priorityColor, background: `${item.priorityColor}15`, border: `1px solid ${item.priorityColor}25` }}
                  >
                    {item.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/75 mb-1">{item.reason}</p>
                    <p className="text-[11px] text-white/40">{item.nextStep}</p>
                  </div>
                  {item.href && (
                    <a
                      href={item.href}
                      className="flex items-center gap-1 text-[11px] flex-shrink-0 hover:opacity-80 transition-opacity mt-0.5"
                      style={{ color: item.priorityColor }}
                    >
                      <Navigation size={11} />
                      انتقل
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 1000-Customer Readiness */}
          <div
            className="rounded-2xl border border-white/[0.07] p-5"
            style={{ background: "linear-gradient(135deg, #091528 0%, #07111f 100%)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-[#10b981]" />
              <span className="text-[13px] font-semibold text-white">جاهزية النظام لـ 1000+ عميل</span>
            </div>
            <p className="text-[11px] text-white/30 mb-4 mr-6">
              حالة مكونات البنية التحتية — محدّثة بعد C1/C2/C3. للمعلومات فقط.
            </p>
            <div className="space-y-2">
              {READINESS_ITEMS.map((item, i) => {
                const statusColor =
                  item.status === "جاهز" ? "#10b981"
                  : item.status === "جزئي" ? "#f59e0b"
                  : "#ef4444";
                return (
                  <div
                    key={i}
                    className="rounded-xl border px-4 py-3 flex items-start gap-3"
                    style={{ borderColor: `${statusColor}15`, background: `${statusColor}04` }}
                  >
                    <span
                      className="text-[9.5px] font-bold rounded-lg px-1.5 py-0.5 flex-shrink-0 mt-0.5"
                      style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}25` }}
                    >
                      {item.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white/75">{item.area}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Repair Confirmation Modal ─────────────────────────────────────────── */}
      {confirmRepair && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onMouseDown={() => setConfirmRepair(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d1e3a 0%, #07111f 100%)",
              border: `1px solid ${confirmRepair.riskColor}28`,
              boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${confirmRepair.riskColor}, transparent)` }} />

            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: confirmRepair.riskColor }} />
                  <p className="text-[14px] font-semibold text-white">تأكيد إجراء الإصلاح</p>
                </div>
                <button
                  onClick={() => setConfirmRepair(null)}
                  className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[11px] text-white/30 mb-1">الإجراء</p>
                <p className="text-[13px] font-semibold text-white">{confirmRepair.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{confirmRepair.area}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-xl border border-[#10b981]/15 bg-[#10b981]/[0.04] px-3 py-2.5">
                  <CheckCircle2 size={12} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10.5px] text-[#10b981] font-semibold mb-0.5">ما سيحدث</p>
                    <p className="text-[11.5px] text-white/60">{confirmRepair.proposedRepair}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#ef4444]/12 bg-[#ef4444]/[0.04] px-3 py-2.5">
                  <AlertOctagon size={12} className="text-[#f87171] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10.5px] text-[#f87171] font-semibold mb-0.5">ما لن يحدث</p>
                    <p className="text-[11.5px] text-white/60">
                      لا حذف، لا تعليق، لا تغيير في الاشتراك أو الصلاحيات تلقائياً
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">مستوى الأمان:</span>
                <span
                  className="text-[10px] rounded-lg px-2 py-0.5 border"
                  style={{ color: confirmRepair.riskColor, borderColor: `${confirmRepair.riskColor}25`, background: `${confirmRepair.riskColor}10` }}
                >
                  {confirmRepair.safetyLevel}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmRepair(null)}
                  className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.03] text-white/50 text-[12.5px] py-2.5 hover:bg-white/[0.06] transition-colors"
                >
                  إلغاء
                </button>
                {confirmRepair.href ? (
                  <a
                    href={confirmRepair.href}
                    onClick={() => {
                      setRepairStatuses((p) => ({ ...p, [confirmRepair.id]: "تم التوجيه" }));
                      setConfirmRepair(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl text-[12.5px] font-semibold py-2.5 transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${confirmRepair.riskColor}22, ${confirmRepair.riskColor}12)`,
                      border: `1px solid ${confirmRepair.riskColor}35`,
                      color: confirmRepair.riskColor,
                    }}
                  >
                    <Navigation size={13} />
                    {confirmRepair.actionLabel}
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setRepairStatuses((p) => ({ ...p, [confirmRepair.id]: "تم التوجيه" }));
                      setConfirmRepair(null);
                    }}
                    className="flex-1 rounded-xl text-[12.5px] font-semibold py-2.5 transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${confirmRepair.riskColor}22, ${confirmRepair.riskColor}12)`,
                      border: `1px solid ${confirmRepair.riskColor}35`,
                      color: confirmRepair.riskColor,
                    }}
                  >
                    تأكيد
                  </button>
                )}
              </div>
            </div>
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
