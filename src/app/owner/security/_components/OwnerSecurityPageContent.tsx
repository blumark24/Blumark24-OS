"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ScrollText,
  RefreshCw,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Trash2,
  PauseCircle,
  XCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  CheckCheck,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchAuditCenterLogs,
  fetchOwnerAuditLogCount,
  type AuditLog,
} from "../../_lib/ownerTruthQueries";

// ─── Severity ──────────────────────────────────────────────────────────────────

type Severity = "low" | "medium" | "high" | "critical";

const CRITICAL_ACTIONS = new Set([
  "subscription_hard_deleted", "organization_deleted", "owner_access_changed",
  "soft_delete_organization",
]);
const HIGH_ACTIONS = new Set([
  "subscription_suspended", "subscription_cancelled", "subscription_canceled",
  "organization_suspended", "suspend_organization",
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

const SEV: Record<Severity, { label: string; badge: string; dot: string }> = {
  low:      { label: "منخفض", badge: "bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20",   dot: "bg-[#22d3ee]" },
  medium:   { label: "متوسط", badge: "bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20",   dot: "bg-[#a855f7]" },
  high:     { label: "عالٍ",  badge: "bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/20",   dot: "bg-[#f59e0b]" },
  critical: { label: "حرج",   badge: "bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/20",   dot: "bg-[#ef4444]" },
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
    const d = new Date(iso);
    return d.toLocaleString("ar-SA", {
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
    const day = Math.floor(h / 24);
    return `منذ ${day} يوم`;
  } catch { return ""; }
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function exportToCsv(logs: AuditLog[]) {
  const headers = ["ID", "المالك", "العملية", "التسمية", "نوع الهدف", "معرف الهدف", "الخطورة", "التوقيت"];
  const rows = logs.map((l) => [
    l.id,
    l.ownerEmail,
    l.action,
    actionLabel(l.action),
    l.targetType ?? "",
    l.targetId ?? "",
    getSeverity(l.action),
    l.createdAt,
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

// ─── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "text-[#22d3ee]",
  iconBg = "bg-[#22d3ee]/10",
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: string;
  iconBg?: string;
  loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon size={16} className={accent} />
      </div>
      <div>
        <p className="text-[11.5px] text-white/45">{label}</p>
        {loading ? (
          <div className="h-6 w-10 rounded bg-white/[0.08] animate-pulse mt-0.5" />
        ) : (
          <p className="text-[20px] font-bold text-white leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Risk card ─────────────────────────────────────────────────────────────────

function RiskCard({
  icon: Icon,
  label,
  count,
  accent,
  iconBg,
  empty,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  accent: string;
  iconBg: string;
  empty?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon size={15} className={accent} />
        </div>
        <p className="text-[12.5px] font-medium text-white/80">{label}</p>
      </div>
      {count === 0 ? (
        <p className="text-[11px] text-white/30">{empty ?? "لا توجد أحداث"}</p>
      ) : (
        <p className={cn("text-[24px] font-bold leading-tight", accent)}>{count}</p>
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-white/[0.04]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 px-2">
          <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-36 rounded bg-white/[0.08]" />
            <div className="h-2.5 w-24 rounded bg-white/[0.05]" />
          </div>
          <div className="hidden md:block h-4 w-20 rounded bg-white/[0.05]" />
          <div className="hidden lg:block h-4 w-16 rounded bg-white/[0.05]" />
          <div className="h-5 w-12 rounded-full bg-white/[0.08]" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const sev = getSeverity(log.action);

  function copyId() {
    void navigator.clipboard.writeText(log.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[#07111f] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.95)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <span className={cn("h-2 w-2 rounded-full flex-shrink-0", SEV[sev].dot)} />
            <div>
              <p className="text-[14px] font-semibold text-white">{actionLabel(log.action)}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{fmtDatetime(log.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Fields */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ["action", log.action],
              ["الخطورة", SEV[sev].label],
              ["المالك", log.ownerEmail],
              ["نوع الهدف", targetTypeLabel(log.targetType)],
              ["معرف الهدف", log.targetId ?? "—"],
              ["منظمة", (log.metadata.organization_id as string | undefined) ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10.5px] text-white/35 mb-0.5">{k}</p>
                <p className="text-[12px] text-white/80 break-all">{v}</p>
              </div>
            ))}
          </div>

          {/* Metadata JSON */}
          {Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-[11px] text-white/35 mb-1.5">Metadata</p>
              <pre className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[11.5px] text-[#22d3ee]/80 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Event ID + copy */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[10.5px] text-white/35 font-mono truncate">{log.id}</p>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 text-[11px] text-[#22d3ee]/70 hover:text-[#22d3ee] transition-colors flex-shrink-0"
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

// ─── Filters ───────────────────────────────────────────────────────────────────

type TimeRange = "today" | "7d" | "30d" | "all";
type TargetFilter = "all" | "subscription" | "organization" | "plan" | "user" | "system";
type SeverityFilter = "all" | Severity;

const TIME_OPTS: { key: TimeRange; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "today", label: "اليوم" },
  { key: "7d", label: "7 أيام" },
  { key: "30d", label: "30 يوم" },
];

const TARGET_OPTS: { key: TargetFilter; label: string }[] = [
  { key: "all",          label: "جميع الأنواع" },
  { key: "subscription", label: "اشتراك" },
  { key: "organization", label: "منشأة" },
  { key: "plan",         label: "باقة" },
  { key: "user",         label: "مستخدم" },
  { key: "system",       label: "النظام" },
];

const SEV_OPTS: { key: SeverityFilter; label: string }[] = [
  { key: "all",      label: "جميع المستويات" },
  { key: "critical", label: "حرج" },
  { key: "high",     label: "عالٍ" },
  { key: "medium",   label: "متوسط" },
  { key: "low",      label: "منخفض" },
];

// ─── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

export default function OwnerSecurityPageContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => { void load(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply client-side filters
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

    if (targetFilter !== "all") {
      result = result.filter((l) => l.targetType === targetFilter);
    }

    if (sevFilter !== "all") {
      result = result.filter((l) => getSeverity(l.action) === sevFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          actionLabel(l.action).includes(q) ||
          l.ownerEmail.toLowerCase().includes(q) ||
          (l.targetType ?? "").includes(q) ||
          (l.targetId ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [logs, timeRange, targetFilter, sevFilter, search]);

  // KPI values
  const todayCount = useMemo(() => logs.filter((l) => isToday(l.createdAt)).length, [logs]);
  const subChanges = useMemo(() => logs.filter((l) => l.targetType === "subscription").length, [logs]);
  const planChanges = useMemo(() => logs.filter((l) =>
    ["create_plan", "change_plan", "plan_created", "plan_updated", "plan_deleted"].includes(l.action)
  ).length, [logs]);
  const deleteOps = useMemo(() => logs.filter((l) =>
    CRITICAL_ACTIONS.has(l.action)
  ).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => getSeverity(l.action) === "critical").length, [logs]);

  // Risk counts
  const hardDeletes = useMemo(() => logs.filter((l) => l.action === "subscription_hard_deleted").length, [logs]);
  const cancelledSubs = useMemo(() => logs.filter((l) => ["subscription_cancelled", "subscription_canceled"].includes(l.action)).length, [logs]);
  const suspendedSubs = useMemo(() => logs.filter((l) => l.action === "subscription_suspended").length, [logs]);
  const planSwaps = useMemo(() => logs.filter((l) =>
    ["change_subscription_plan", "subscription_plan_changed", "change_plan"].includes(l.action)
  ).length, [logs]);

  const filtersActive = timeRange !== "all" || targetFilter !== "all" || sevFilter !== "all" || search.trim() !== "";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-[#10b981]" />
            <h1 className="text-[20px] font-bold text-white">مركز التدقيق والمراقبة</h1>
          </div>
          <p className="text-[12.5px] text-white/45 mt-1 max-w-xl leading-relaxed">
            متابعة جميع عمليات المالك والاشتراكات والباقات والحذف والأمان.
          </p>
          {!loading && (
            <p className="text-[11px] text-white/30 mt-1 flex items-center gap-1">
              <Clock size={11} />
              آخر تحديث: {fmtDatetime(lastRefresh.toISOString())}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => exportToCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/60 text-[12.5px] px-3.5 py-2 hover:bg-white/[0.08] transition-colors disabled:opacity-35"
          >
            <Download size={14} />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>
          <button
            onClick={() => void load(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[12.5px] px-3.5 py-2 hover:bg-[#22d3ee]/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="إجمالي العمليات" value={totalCount ?? logs.length} icon={ScrollText} loading={loading} />
        <KpiCard label="عمليات اليوم" value={todayCount} icon={Clock} accent="text-[#34d399]" iconBg="bg-[#10b981]/10" loading={loading} />
        <KpiCard label="تغييرات الاشتراكات" value={subChanges} icon={Layers} accent="text-[#22d3ee]" iconBg="bg-[#22d3ee]/10" loading={loading} />
        <KpiCard label="تغييرات الباقات" value={planChanges} icon={Layers} accent="text-[#c084fc]" iconBg="bg-[#a855f7]/10" loading={loading} />
        <KpiCard label="عمليات الحذف" value={deleteOps} icon={Trash2} accent="text-[#f87171]" iconBg="bg-[#ef4444]/10" loading={loading} />
        <KpiCard label="أحداث عالية الخطورة" value={criticalCount} icon={AlertTriangle} accent="text-[#f87171]" iconBg="bg-[#ef4444]/10" loading={loading} />
      </div>

      {/* ── Risk center ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-[#fbbf24]" />
          <h2 className="text-[14px] font-semibold text-white">مركز المخاطر</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <RiskCard icon={Trash2}      label="حذف نهائي"            count={hardDeletes}   accent="text-[#f87171]" iconBg="bg-[#ef4444]/10" />
          <RiskCard icon={XCircle}     label="اشتراكات ملغاة"       count={cancelledSubs} accent="text-[#f87171]" iconBg="bg-[#ef4444]/10" />
          <RiskCard icon={PauseCircle} label="اشتراكات معلقة"       count={suspendedSubs} accent="text-[#fbbf24]" iconBg="bg-[#f59e0b]/10" />
          <RiskCard icon={Layers}      label="تغييرات باقات متكررة" count={planSwaps}     accent="text-[#c084fc]" iconBg="bg-[#a855f7]/10" />
          <RiskCard
            icon={AlertTriangle}
            label="عمليات فاشلة"
            count={0}
            accent="text-white/30"
            iconBg="bg-white/[0.05]"
            empty="لا توجد عمليات فاشلة مسجلة حاليًا"
          />
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعملية، المستخدم، الهدف..."
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-[13px] text-white placeholder:text-white/30 pr-9 pl-3 py-2.5 outline-none focus:border-[#22d3ee]/40 transition-colors"
            />
          </div>

          {/* Time tabs */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 flex-shrink-0">
            {TIME_OPTS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                  timeRange === t.key
                    ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/25"
                    : "text-white/45 hover:text-white/65",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] transition-colors flex-shrink-0",
              filtersActive && (timeRange !== "all" || targetFilter !== "all" || sevFilter !== "all")
                ? "border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee]"
                : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06]",
            )}
          >
            <Filter size={13} />
            فلاتر إضافية
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">نوع الهدف</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
                className="rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[12.5px] text-white px-3 py-2 outline-none focus:border-[#22d3ee]/40"
              >
                {TARGET_OPTS.map((o) => (
                  <option key={o.key} value={o.key} className="bg-[#07111f]">{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5">مستوى الخطورة</label>
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value as SeverityFilter)}
                className="rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[12.5px] text-white px-3 py-2 outline-none focus:border-[#22d3ee]/40"
              >
                {SEV_OPTS.map((o) => (
                  <option key={o.key} value={o.key} className="bg-[#07111f]">{o.label}</option>
                ))}
              </select>
            </div>
            {filtersActive && (
              <div className="flex items-end">
                <button
                  onClick={() => { setTargetFilter("all"); setSevFilter("all"); setTimeRange("all"); setSearch(""); }}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 text-[12px] px-3 py-2 hover:bg-white/[0.08] transition-colors"
                >
                  <X size={12} /> مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Activity feed ────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <ScrollText size={15} className="text-[#22d3ee]" />
          <h2 className="text-[13.5px] font-semibold text-white">سجل النشاطات</h2>
          <span className="text-[11px] text-white/35 border border-white/[0.07] rounded-full px-2 py-0.5">
            {loading ? "…" : filtered.length}
          </span>
          {filtersActive && !loading && (
            <span className="text-[11px] text-[#22d3ee]/60 mr-auto">من إجمالي {logs.length}</span>
          )}
        </div>

        {/* Column headers — desktop */}
        <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="w-3" />
          <span className="text-[11px] text-white/35 font-medium">العملية</span>
          <span className="text-[11px] text-white/35 font-medium">المالك</span>
          <span className="text-[11px] text-white/35 font-medium">نوع الهدف</span>
          <span className="text-[11px] text-white/35 font-medium">الخطورة</span>
          <span className="text-[11px] text-white/35 font-medium">الوقت</span>
        </div>

        <div className="px-3 pb-3">
          {loading ? (
            <div className="pt-2"><TableSkeleton /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
              <AlertTriangle size={30} className="text-[#f87171]/50" />
              <p className="text-[13px] text-[#f87171]">{error}</p>
              <button
                onClick={() => void load(true)}
                className="text-[12px] text-[#22d3ee] hover:underline"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Info size={32} className="text-white/15 mb-3" strokeWidth={1.2} />
              <p className="text-[13px] text-white/35">
                {logs.length === 0
                  ? "لا توجد أحداث تدقيق حتى الآن"
                  : "لا توجد نتائج مطابقة للفلاتر الحالية"}
              </p>
              {filtersActive && (
                <button
                  onClick={() => { setSearch(""); setTimeRange("all"); setTargetFilter("all"); setSevFilter("all"); }}
                  className="mt-2 text-[12px] text-[#22d3ee]/70 hover:text-[#22d3ee]"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          ) : (
            <>
              {filtered.map((log) => {
                const sev = getSeverity(log.action);
                const s = SEV[sev];
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-right flex items-center gap-3 py-3 px-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Severity dot */}
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", s.dot)} />

                    {/* Action + detail — mobile stacked, desktop split */}
                    <div className="flex-1 min-w-0 lg:grid lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:gap-4 lg:items-center">
                      {/* Action label */}
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-white truncate">{actionLabel(log.action)}</p>
                        <p className="text-[10.5px] text-white/35 mt-0.5 font-mono truncate lg:hidden">{log.action}</p>
                      </div>

                      {/* Owner email */}
                      <p className="hidden lg:block text-[11.5px] text-white/50 truncate">{log.ownerEmail}</p>

                      {/* Target type */}
                      <p className="hidden lg:block text-[11.5px] text-white/45 whitespace-nowrap">
                        {targetTypeLabel(log.targetType)}
                      </p>

                      {/* Severity badge */}
                      <span className={cn("hidden lg:inline-flex text-[10.5px] rounded-full px-2 py-0.5 font-medium whitespace-nowrap", s.badge)}>
                        {s.label}
                      </span>

                      {/* Time */}
                      <p className="hidden lg:block text-[11px] text-white/35 whitespace-nowrap" title={fmtDatetime(log.createdAt)}>
                        {fmtAgo(log.createdAt)}
                      </p>
                    </div>

                    {/* Mobile: time + badge */}
                    <div className="lg:hidden flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn("inline-flex text-[10px] rounded-full px-1.5 py-0.5", s.badge)}>{s.label}</span>
                      <span className="text-[10px] text-white/30">{fmtAgo(log.createdAt)}</span>
                    </div>
                  </button>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <div className="py-4 flex justify-center">
                  <button
                    onClick={() => void load(false)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] text-white/55 text-[12.5px] px-5 py-2 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? <RefreshCw size={13} className="animate-spin" /> : null}
                    {loadingMore ? "جارٍ التحميل..." : "تحميل المزيد"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && logs.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-2">
            <Info size={12} className="text-white/25" />
            <p className="text-[11px] text-white/30">
              سجلات التدقيق للقراءة فقط — لا يمكن تعديلها أو حذفها
            </p>
          </div>
        )}
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
