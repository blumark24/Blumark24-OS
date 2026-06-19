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

const SEV: Record<Severity, {
  label: string;
  badge: string;
  dot: string;
  ring: string;
  glow: string;
  bar: string;
}> = {
  low: {
    label: "منخفض",
    badge: "bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20",
    dot: "bg-[#22d3ee]",
    ring: "ring-[#22d3ee]/20",
    glow: "shadow-[0_0_18px_rgba(34,211,238,0.12)]",
    bar: "bg-[#22d3ee]",
  },
  medium: {
    label: "متوسط",
    badge: "bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20",
    dot: "bg-[#a855f7]",
    ring: "ring-[#a855f7]/20",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.12)]",
    bar: "bg-[#a855f7]",
  },
  high: {
    label: "عالٍ",
    badge: "bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
    ring: "ring-[#f59e0b]/20",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.12)]",
    bar: "bg-[#f59e0b]",
  },
  critical: {
    label: "حرج",
    badge: "bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
    ring: "ring-[#ef4444]/20",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.15)]",
    bar: "bg-[#ef4444]",
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

// ─── Digital Twin Orbit Map ────────────────────────────────────────────────────
// 6 nodes orbiting a central Blumark24 OS node. Pure CSS positioning.

function OrbitMap({
  subChanges, planChanges, deleteOps, criticalCount, todayCount, orgOps,
}: {
  subChanges: number; planChanges: number; deleteOps: number;
  criticalCount: number; todayCount: number; orgOps: number;
}) {
  const nodes = [
    { label: "الاشتراكات", icon: CreditCard, color: "#22d3ee", count: subChanges,    left: 50, top: 8  },
    { label: "الباقات",    icon: Package,    color: "#a855f7", count: planChanges,   left: 83, top: 27 },
    { label: "المنشآت",   icon: Building2,  color: "#10b981", count: orgOps,        left: 83, top: 66 },
    { label: "الحذف",     icon: Trash2,     color: "#ef4444", count: deleteOps,     left: 50, top: 84 },
    { label: "الصلاحيات", icon: Shield,     color: "#f59e0b", count: criticalCount, left: 17, top: 66 },
    { label: "النظام",    icon: Settings2,  color: "#0ea5e9", count: todayCount,    left: 17, top: 27 },
  ];

  return (
    <div className="relative w-full" style={{ height: 280 }}>
      {/* Outer ring */}
      <div
        className="absolute rounded-full border border-dashed border-[#22d3ee]/10"
        style={{ inset: "8%" }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full border border-[#22d3ee]/06"
        style={{ inset: "30%" }}
      />

      {/* Connecting lines — rendered as thin absolutely-positioned divs */}
      {nodes.map((n, i) => {
        const cx = 50, cy = 46;
        const dx = n.left - cx, dy = n.top - cy;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <div
            key={i}
            className="absolute origin-left"
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
              width: `${len * 0.78}%`,
              height: 1,
              background: `linear-gradient(90deg, rgba(34,211,238,0.25), rgba(34,211,238,0.04))`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "0 50%",
            }}
          />
        );
      })}

      {/* Central node */}
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

      {/* Orbital nodes */}
      {nodes.map((n, i) => {
        const Icon = n.icon;
        const isAlert = n.count > 0 && (n.color === "#ef4444" || n.color === "#f59e0b");
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${n.left}%`, top: `${n.top}%`,
              transform: "translate(-50%, -50%)",
            }}
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
              <span
                className="text-[9px] font-bold"
                style={{ color: n.color }}
              >
                {n.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color = "#22d3ee", loading,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color?: string; loading?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border bg-gradient-to-br from-white/[0.04] to-white/[0.01] transition-all duration-200 hover:from-white/[0.06]"
      style={{
        borderColor: `${color}22`,
        boxShadow: `0 0 0 1px ${color}18, 0 4px 24px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}12`, border: `1px solid ${color}20` }}
          >
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

// ─── Risk Level Badge ─────────────────────────────────────────────────────────

function OverallRiskBadge({ logs }: { logs: AuditLog[] }) {
  const critCount = logs.filter((l) => getSeverity(l.action) === "critical").length;
  const highCount = logs.filter((l) => getSeverity(l.action) === "high").length;
  const level: Severity = critCount > 0 ? "critical" : highCount > 2 ? "high" : highCount > 0 ? "medium" : "low";
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
  icon: React.ElementType; label: string; count: number;
  color: string; empty?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 border bg-gradient-to-br from-white/[0.03] to-transparent"
      style={{ borderColor: count > 0 ? `${color}25` : "rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        {count > 0 && (
          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: color }} />
        )}
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

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-white/[0.03]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-4">
          <div className="h-6 w-1 rounded-full bg-white/[0.06] flex-shrink-0" />
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d1e3a 0%, #07111f 100%)",
          border: `1px solid ${sev === "critical" ? "#ef444430" : sev === "high" ? "#f59e0b25" : "rgba(255,255,255,0.10)"}`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent 0%, ${sev === "critical" ? "#ef4444" : sev === "high" ? "#f59e0b" : sev === "medium" ? "#a855f7" : "#22d3ee"} 50%, transparent 100%)` }} />

        {/* Header */}
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
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[68vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["العملية (action)", log.action],
              ["الخطورة", s.label],
              ["المالك", log.ownerEmail],
              ["نوع الهدف", targetTypeLabel(log.targetType)],
              ["معرف الهدف", log.targetId ?? "—"],
              ["المنشأة", (log.metadata.organization_id as string | undefined) ?? "—"],
            ].map(([k, v]) => (
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
type TargetFilter = "all" | "subscription" | "organization" | "plan" | "user" | "system";
type SeverityFilter = "all" | Severity;

const TIME_OPTS: { key: TimeRange; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "today", label: "اليوم" },
  { key: "7d", label: "٧ أيام" },
  { key: "30d", label: "٣٠ يوم" },
];

const TARGET_OPTS: { key: TargetFilter; label: string }[] = [
  { key: "all", label: "جميع الأنواع" },
  { key: "subscription", label: "اشتراك" },
  { key: "organization", label: "منشأة" },
  { key: "plan", label: "باقة" },
  { key: "user", label: "مستخدم" },
  { key: "system", label: "النظام" },
];

const SEV_OPTS: { key: SeverityFilter; label: string }[] = [
  { key: "all", label: "جميع المستويات" },
  { key: "critical", label: "حرج" },
  { key: "high", label: "عالٍ" },
  { key: "medium", label: "متوسط" },
  { key: "low", label: "منخفض" },
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

  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");

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

  // KPI values
  const todayCount  = useMemo(() => logs.filter((l) => isToday(l.createdAt)).length, [logs]);
  const subChanges  = useMemo(() => logs.filter((l) => l.targetType === "subscription").length, [logs]);
  const planChanges = useMemo(() => logs.filter((l) =>
    ["create_plan", "change_plan", "plan_created", "plan_updated", "plan_deleted"].includes(l.action)
  ).length, [logs]);
  const deleteOps   = useMemo(() => logs.filter((l) => CRITICAL_ACTIONS.has(l.action)).length, [logs]);
  const criticalCount = useMemo(() => logs.filter((l) => getSeverity(l.action) === "critical").length, [logs]);
  const orgOps      = useMemo(() => logs.filter((l) => l.targetType === "organization").length, [logs]);

  // Risk counts
  const hardDeletes   = useMemo(() => logs.filter((l) => l.action === "subscription_hard_deleted").length, [logs]);
  const cancelledSubs = useMemo(() => logs.filter((l) => ["subscription_cancelled", "subscription_canceled"].includes(l.action)).length, [logs]);
  const suspendedSubs = useMemo(() => logs.filter((l) => l.action === "subscription_suspended").length, [logs]);
  const planSwaps     = useMemo(() => logs.filter((l) =>
    ["change_subscription_plan", "subscription_plan_changed", "change_plan"].includes(l.action)
  ).length, [logs]);

  const filtersActive = timeRange !== "all" || targetFilter !== "all" || sevFilter !== "all" || search.trim() !== "";

  function resetFilters() {
    setSearch(""); setTimeRange("all"); setTargetFilter("all"); setSevFilter("all");
  }

  return (
    <div className="relative max-w-6xl mx-auto space-y-7">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          zIndex: 0,
        }}
      />

      {/* ── Hero Command Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/15 bg-gradient-to-br from-[#0d1f3c] via-[#091528] to-[#07111f]"
        style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.08), 0 8px 40px rgba(0,0,0,0.6)" }}
      >
        {/* Radial glow top-right */}
        <div className="absolute -top-16 -left-8 w-64 h-64 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)" }} />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/08 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
              <span className="text-[11px] font-medium text-[#22d3ee]/80 tracking-wide">النظام تحت المراقبة</span>
            </div>

            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)", boxShadow: "0 0 20px rgba(34,211,238,0.1)" }}>
                <ShieldCheck size={20} className="text-[#22d3ee]" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-white tracking-tight">مركز التدقيق والمراقبة</h1>
                <p className="text-[12px] text-white/40 mt-0.5">
                  غرفة تحكم رقمية لمراقبة عمليات المالك، الاشتراكات، الباقات، المخاطر، والحذف
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
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

      {/* ── Digital Twin Risk Map ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Orbit diagram */}
        <div className="relative rounded-2xl border border-[#22d3ee]/10 bg-gradient-to-br from-[#091528] to-[#07111f] overflow-hidden"
          style={{ boxShadow: "inset 0 0 60px rgba(34,211,238,0.03)" }}>
          <div className="px-5 pt-4 pb-1 flex items-center gap-2 border-b border-white/[0.04]">
            <Zap size={14} className="text-[#22d3ee]" />
            <span className="text-[13px] font-semibold text-white">خريطة المخاطر الرقمية</span>
            <span className="text-[10.5px] text-white/30 mr-auto">Digital Twin Risk Map</span>
          </div>
          <OrbitMap
            subChanges={subChanges}
            planChanges={planChanges}
            deleteOps={deleteOps}
            criticalCount={criticalCount}
            todayCount={todayCount}
            orgOps={orgOps}
          />
        </div>

        {/* Risk center panel */}
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#091528] to-[#07111f] overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#fbbf24]" />
            <span className="text-[13px] font-semibold text-white">مركز المخاطر</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <RiskCard icon={Trash2}      label="حذف نهائي"            count={hardDeletes}   color="#ef4444" />
            <RiskCard icon={XCircle}     label="اشتراكات ملغاة"       count={cancelledSubs} color="#f87171" />
            <RiskCard icon={PauseCircle} label="اشتراكات معلقة"       count={suspendedSubs} color="#f59e0b" />
            <RiskCard icon={Layers}      label="تغييرات الباقات"       count={planSwaps}     color="#a855f7" />
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

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="إجمالي العمليات"      value={totalCount ?? logs.length} icon={ScrollText} color="#22d3ee" loading={loading} />
        <KpiCard label="عمليات اليوم"         value={todayCount}   icon={Clock}          color="#10b981" loading={loading} />
        <KpiCard label="تغييرات الاشتراكات"   value={subChanges}   icon={CreditCard}     color="#0ea5e9" loading={loading} />
        <KpiCard label="تغييرات الباقات"      value={planChanges}  icon={Package}        color="#a855f7" loading={loading} />
        <KpiCard label="عمليات الحذف"         value={deleteOps}    icon={Trash2}         color="#ef4444" loading={loading} />
        <KpiCard label="أحداث عالية الخطورة"  value={criticalCount} icon={AlertTriangle} color="#f59e0b" loading={loading} />
      </div>

      {/* ── Command Filter Bar ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-r from-[#091528]/80 to-[#07111f]/80 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
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

          {/* Time range tabs */}
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

          {/* Target type */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
            className="rounded-xl bg-[#0d1e3a] border border-white/[0.09] text-[12.5px] text-white/70 px-3 py-2.5 outline-none focus:border-[#22d3ee]/35 transition-colors flex-shrink-0"
          >
            {TARGET_OPTS.map((o) => (
              <option key={o.key} value={o.key} className="bg-[#07111f]">{o.label}</option>
            ))}
          </select>

          {/* Severity */}
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

      {/* ── Activity Feed ────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: "linear-gradient(180deg, #091528 0%, #07111f 100%)" }}
      >
        {/* Table header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
          <div className="h-7 w-7 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center">
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

        {/* Desktop column headers */}
        <div className="hidden lg:grid grid-cols-[6px_1fr_1fr_120px_90px_100px_56px] gap-4 items-center px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
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
              <div className="h-14 w-14 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/08 flex items-center justify-center">
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
              <div className="h-14 w-14 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
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
                      {/* Severity bar */}
                      <div className={cn("w-[3px] self-stretch rounded-full flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity", s.bar)} />

                      {/* Content */}
                      <div className="flex-1 min-w-0 lg:grid lg:grid-cols-[1fr_1fr_120px_90px_100px_40px] lg:gap-4 lg:items-center">
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
                        <span className="hidden lg:flex items-center justify-center text-[10.5px] text-[#22d3ee]/0 group-hover:text-[#22d3ee]/50 transition-colors">›</span>
                      </div>

                      {/* Mobile: badge + time */}
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

        {/* Footer */}
        {!loading && logs.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]/30" />
            <p className="text-[11px] text-white/25">
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
