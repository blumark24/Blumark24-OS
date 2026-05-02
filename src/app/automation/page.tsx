"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { useToast } from "@/contexts/ToastContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks, useClients, useTransactions } from "@/hooks/useData";
import { FUND_DISTRIBUTION, formatCurrency } from "@/lib/utils";
import type { Task, Client, Transaction } from "@/types";
import {
  Zap, CheckCircle2, AlertTriangle, Clock, Users,
  DollarSign, BarChart3, Play, Pause, RefreshCw,
  ArrowUpRight, Shield,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationRule {
  id: string;
  title: string;
  description: string;
  trigger: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
  lastRun?: string;
  runCount: number;
}

interface AutomationLog {
  id: string;
  ruleId: string;
  ruleTitle: string;
  result: string;
  at: string;
  status: "success" | "warning" | "error";
}

// ─── Automation runners (accept live data) ────────────────────────────────────

function runFundDistribution(txs: Transaction[]): AutomationLog[] {
  const income = txs.filter((t) => t.type === "دخل");
  if (!income.length) return [{
    id: "fd-empty", ruleId: "fund-dist", ruleTitle: "توزيع الصناديق",
    result: "لا توجد معاملات دخل للتوزيع", at: new Date().toISOString(), status: "warning",
  }];
  return income.slice(0, 2).map((t) => ({
    id: `fd-${t.id}`,
    ruleId: "fund-dist",
    ruleTitle: "توزيع الصناديق",
    result: `وُزِّع ${formatCurrency(t.amount)} SAR على 5 صناديق (عمليات ${formatCurrency(t.amount * 0.4)})`,
    at: new Date().toISOString(),
    status: "success" as const,
  }));
}

function runLateTaskDetection(tasks: Task[]): AutomationLog[] {
  const now  = new Date();
  const late = tasks.filter((t) => t.status !== "مكتملة" && new Date(t.dueDate) < now);
  if (!late.length) return [{
    id: "lt-none", ruleId: "late-tasks", ruleTitle: "كشف المهام المتأخرة",
    result: "لا توجد مهام متأخرة 🎉", at: new Date().toISOString(), status: "success",
  }];
  return late.map((t) => ({
    id: `lt-${t.id}`,
    ruleId: "late-tasks",
    ruleTitle: "كشف المهام المتأخرة",
    result: `تم تصنيف "${t.title}" كمتأخرة وإنشاء إشعار`,
    at: new Date().toISOString(),
    status: "warning" as const,
  }));
}

function runClientFollowup(clients: Client[]): AutomationLog[] {
  const pending = clients.filter((c) => c.status === "محتمل");
  if (!pending.length) return [{
    id: "cf-none", ruleId: "client-followup", ruleTitle: "متابعة العملاء",
    result: "لا توجد عملاء محتملين تحتاج متابعة", at: new Date().toISOString(), status: "success",
  }];
  return pending.map((c) => ({
    id: `cf-${c.id}`,
    ruleId: "client-followup",
    ruleTitle: "متابعة العملاء",
    result: `تم إنشاء تذكير متابعة للعميل "${c.name}"`,
    at: new Date().toISOString(),
    status: "success" as const,
  }));
}

function runWeeklyReport(clients: Client[], tasks: Task[], txs: Transaction[]): AutomationLog[] {
  const totalIncome = txs.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0);
  const completed   = tasks.filter((t) => t.status === "مكتملة").length;
  return [{
    id: "wr-1", ruleId: "weekly-report", ruleTitle: "التقرير الأسبوعي",
    result: `التقرير جاهز: ${clients.length} عميل، ${completed} مهمة مكتملة، إيراد ${formatCurrency(totalIncome)} SAR`,
    at: new Date().toISOString(), status: "success",
  }];
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "fund-dist",
    title: "توزيع الصناديق التلقائي",
    description: "عند إضافة دخل يوزَّع تلقائياً على 5 صناديق بنسب 40/10/10/20/20",
    trigger: "عند إضافة دخل أو فاتورة مدفوعة",
    icon: DollarSign, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "task-reminder",
    title: "تنبيه مواعيد المهام",
    description: "إنشاء إشعار عند اقتراب موعد مهمة خلال 24 ساعة",
    trigger: "قبل 24 ساعة من موعد استحقاق المهمة",
    icon: Clock, iconColor: "text-amber-400", iconBg: "bg-amber-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "late-tasks",
    title: "كشف المهام المتأخرة",
    description: "تحديث المهام المتجاوز موعدها كـ \"متأخرة\" وإنشاء إشعار",
    trigger: "يومياً عند منتصف الليل",
    icon: AlertTriangle, iconColor: "text-red-400", iconBg: "bg-red-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "client-followup",
    title: "متابعة العملاء المحتملين",
    description: "إنشاء تذكير متابعة للعملاء الذين لم يُتواصل معهم لأكثر من 7 أيام",
    trigger: "يومياً في الساعة 9 صباحاً",
    icon: Users, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "workload",
    title: "حساب عبء العمل",
    description: "حساب وتحديث نسبة عبء العمل لكل موظف تلقائياً",
    trigger: "كل ساعتين",
    icon: BarChart3, iconColor: "text-purple-400", iconBg: "bg-purple-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "kpi-update",
    title: "تحديث مؤشرات الأداء",
    description: "تحديث KPI لوحة التحكم تلقائياً بناءً على أحدث البيانات",
    trigger: "كل 15 دقيقة",
    icon: RefreshCw, iconColor: "text-blue-400", iconBg: "bg-blue-500/20",
    enabled: true, lastRun: undefined, runCount: 0,
  },
  {
    id: "weekly-report",
    title: "التقرير الأسبوعي التلقائي",
    description: "إنشاء تقرير أسبوعي شامل كل صباح إثنين جاهز للذكاء الاصطناعي",
    trigger: "كل إثنين الساعة 8 صباحاً",
    icon: Shield, iconColor: "text-teal-400", iconBg: "bg-teal-500/20",
    enabled: false, lastRun: undefined, runCount: 0,
  },
];

const LOG_COLORS = {
  success: { badge: "status-active",   dot: "bg-emerald-400" },
  warning: { badge: "status-pending",  dot: "bg-amber-400"   },
  error:   { badge: "status-inactive", dot: "bg-red-400"     },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

function AutomationContent() {
  const toast = useToast();

  const { data: tasks }  = useTasks();
  const { data: clients } = useClients();
  const { data: txs }    = useTransactions();

  const [rules,     setRules]     = useState<AutomationRule[]>(INITIAL_RULES);
  const [logs,      setLogs]      = useState<AutomationLog[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const weeklyStats = useMemo(() => ({
    activeClients:  clients.filter((c) => c.status === "نشط").length,
    completedTasks: tasks.filter((t) => t.status === "مكتملة").length,
    lateTasks:      tasks.filter((t) => t.status === "متأخرة").length,
    totalIncome:    txs.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0),
  }), [clients, tasks, txs]);

  // Seed initial logs once data is available
  useEffect(() => {
    if (!tasks.length && !clients.length && !txs.length) return;
    const seeds: AutomationLog[] = runLateTaskDetection(tasks).slice(0, 3);
    if (seeds.length) setLogs(seeds);
  }, [tasks, clients, txs]); // eslint-disable-line react-hooks/exhaustive-deps

  const getRuleRunner = (ruleId: string): (() => AutomationLog[]) => {
    switch (ruleId) {
      case "fund-dist":       return () => runFundDistribution(txs);
      case "late-tasks":      return () => runLateTaskDetection(tasks);
      case "client-followup": return () => runClientFollowup(clients);
      case "weekly-report":   return () => runWeeklyReport(clients, tasks, txs);
      case "task-reminder":   return () => [{ id: `tr-${Date.now()}`, ruleId: "task-reminder", ruleTitle: "تنبيه المواعيد", result: `تم إرسال ${tasks.filter((t) => t.status !== "مكتملة").length > 0 ? "تنبيهات" : "0 تنبيه"} للمهام القادمة`, at: new Date().toISOString(), status: "success" as const }];
      case "kpi-update":      return () => [{ id: `ku-${Date.now()}`, ruleId: "kpi-update", ruleTitle: "تحديث KPI", result: `تم تحديث مؤشرات الأداء: ${clients.length} عميل، ${tasks.filter((t) => t.status === "مكتملة").length} مهمة مكتملة`, at: new Date().toISOString(), status: "success" as const }];
      case "workload":        return () => [{ id: `wl-${Date.now()}`, ruleId: "workload", ruleTitle: "عبء العمل", result: `تم حساب عبء العمل: ${tasks.filter((t) => t.status === "قيد_التنفيذ").length} مهمة نشطة`, at: new Date().toISOString(), status: "warning" as const }];
      default:                return () => [];
    }
  };

  const toggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, enabled: !r.enabled };
        toast.info(`${next.title}: ${next.enabled ? "تم التفعيل" : "تم الإيقاف"}`);
        return next;
      })
    );
  };

  const runNow = async (rule: AutomationRule) => {
    if (runningId) return;
    setRunningId(rule.id);
    await new Promise((r) => setTimeout(r, 900));
    const runner  = getRuleRunner(rule.id);
    const newLogs = runner();
    setLogs((prev) => [...newLogs, ...prev].slice(0, 20));
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? { ...r, lastRun: new Date().toISOString(), runCount: r.runCount + 1 }
          : r
      )
    );
    setRunningId(null);
    toast.success(`${rule.title}: تم التنفيذ بنجاح`);
  };

  const runAll = async () => {
    toast.info("جاري تشغيل جميع القواعد النشطة...");
    for (const rule of rules.filter((r) => r.enabled)) {
      await runNow(rule);
    }
    toast.success("تم تشغيل جميع القواعد النشطة");
  };

  const totalRuns   = rules.reduce((s, r) => s + r.runCount, 0);
  const activeCount = rules.filter((r) => r.enabled).length;
  const successLogs = logs.filter((l) => l.status === "success").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Zap size={24} className="text-[#22d3ee]" />
              مركز الأتمتة
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">تشغيل القواعد الآلية وإدارة سير العمل</p>
          </div>
          <button onClick={runAll} className="btn-primary flex items-center gap-2">
            <Play size={15} />
            تشغيل الكل
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "القواعد النشطة",   value: activeCount,  color: "#22d3ee" },
            { label: "إجمالي التنفيذات", value: totalRuns,    color: "#10b981" },
            { label: "نجاح اليوم",       value: successLogs,  color: "#a855f7" },
            { label: "القواعد الكلية",   value: rules.length, color: "#ff7a3d" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8ba3c7] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Fund distribution preview */}
        <div className="glass-card p-5 border border-[#22d3ee]/20">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-[#22d3ee]" />
            <h3 className="text-white font-medium text-sm">معاينة توزيع الصناديق التلقائي</h3>
            <span className="badge bg-[#22d3ee]/20 text-[#22d3ee] text-xs mr-auto">نشط</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(FUND_DISTRIBUTION).map(([, cfg]) => (
              <div key={cfg.label} className="text-center p-3 rounded-xl border border-[#1e3a5f] bg-[#0d1f3c]/60">
                <div className="text-lg font-bold" style={{ color: cfg.color }}>{cfg.pct * 100}%</div>
                <div className="text-xs text-[#8ba3c7] mt-1">{cfg.label}</div>
                <div className="text-[10px] text-[#6b87ab] mt-0.5">من كل دخل</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rules list */}
          <div className="lg:col-span-2 space-y-3">
            {rules.map((rule) => {
              const isRunning = runningId === rule.id;
              return (
                <div key={rule.id} className={`glass-card p-4 transition-all ${!rule.enabled ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${rule.iconBg}`}>
                      <rule.icon size={18} className={rule.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium text-sm">{rule.title}</span>
                        <span className={`badge text-xs ${rule.enabled ? "status-active" : "status-inactive"}`}>
                          {rule.enabled ? "نشط" : "موقوف"}
                        </span>
                      </div>
                      <p className="text-xs text-[#8ba3c7] mb-2 leading-relaxed">{rule.description}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#6b87ab]">
                        <span>⚡ {rule.trigger}</span>
                        <span>✅ {rule.runCount} تنفيذ</span>
                        {rule.lastRun && (
                          <span>🕐 آخر تشغيل: {new Date(rule.lastRun).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => runNow(rule)}
                        disabled={!!runningId || !rule.enabled}
                        className="p-2 rounded-xl bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-all disabled:opacity-40"
                        title="تشغيل الآن"
                      >
                        {isRunning
                          ? <div className="w-4 h-4 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin" />
                          : <Play size={14} />
                        }
                      </button>
                      <button
                        onClick={() => toggle(rule.id)}
                        className={`p-2 rounded-xl transition-all ${rule.enabled ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400" : "bg-[#1a3356] text-[#8ba3c7] hover:text-emerald-400"}`}
                        title={rule.enabled ? "إيقاف" : "تفعيل"}
                      >
                        {rule.enabled ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Execution log */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#22d3ee]" />
                سجل التنفيذ
              </h3>
              <span className="text-xs text-[#8ba3c7]">{logs.length} سجل</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[480px]">
              {logs.map((log) => {
                const cfg = LOG_COLORS[log.status];
                return (
                  <div key={log.id} className="flex items-start gap-2.5 pb-2.5 border-b border-[#1e3a5f]/40 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-white">{log.ruleTitle}</span>
                        <span className={`badge text-[10px] ${cfg.badge}`}>
                          {log.status === "success" ? "نجاح" : log.status === "warning" ? "تحذير" : "خطأ"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8ba3c7] leading-snug">{log.result}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#6b87ab]">
                        <Clock size={9} />
                        <span>{new Date(log.at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-center py-8 text-[#8ba3c7] text-sm">لا توجد سجلات بعد</div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly report preview */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <BarChart3 size={16} className="text-[#22d3ee]" />
              ملخص التقرير الأسبوعي
              <span className="badge bg-[#1a3356] text-[#8ba3c7] text-xs">جاهز للذكاء الاصطناعي</span>
            </h3>
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight size={12} />
              <span>بيانات حية من النظام</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "العملاء النشطون",  value: weeklyStats.activeClients,                            color: "#22d3ee" },
              { label: "المهام المكتملة",  value: weeklyStats.completedTasks,                           color: "#10b981" },
              { label: "المهام المتأخرة",  value: weeklyStats.lateTasks,                                color: "#ef4444" },
              { label: "إجمالي الإيرادات", value: `${formatCurrency(weeklyStats.totalIncome)} SAR`,    color: "#ff7a3d" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f]">
                <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-[#8ba3c7] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AutomationPage() {
  return (
    <PageGuard permission="manage_automations">
      <AutomationContent />
    </PageGuard>
  );
}
