"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/contexts/ToastContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import AccessDenied from "@/components/ui/AccessDenied";
import { mockTasks, mockClients, mockTransactions } from "@/lib/mockData";
import { FUND_DISTRIBUTION, formatCurrency } from "@/lib/utils";
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
  action: string;
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

// ─── Run automation logic ─────────────────────────────────────────────────────

function runFundDistribution(): AutomationLog[] {
  const income = mockTransactions.filter((t) => t.type === "دخل");
  return income.slice(0, 2).map((t) => ({
    id: `fd-${t.id}`,
    ruleId: "fund-dist",
    ruleTitle: "توزيع الصناديق",
    result: `وُزِّع ${formatCurrency(t.amount)} SAR على 5 صناديق (عمليات ${formatCurrency(t.amount * 0.4)})`,
    at: new Date().toISOString(),
    status: "success" as const,
  }));
}

function runLateTaskDetection(): AutomationLog[] {
  const now = new Date();
  const late = mockTasks.filter(
    (t) => t.status !== "مكتملة" && new Date(t.dueDate) < now
  );
  return late.map((t) => ({
    id: `lt-${t.id}`,
    ruleId: "late-tasks",
    ruleTitle: "كشف المهام المتأخرة",
    result: `تم تصنيف "${t.title}" كمتأخرة وإنشاء إشعار`,
    at: new Date().toISOString(),
    status: "warning" as const,
  }));
}

function runClientFollowup(): AutomationLog[] {
  const pending = mockClients.filter((c) => c.status === "محتمل");
  return pending.map((c) => ({
    id: `cf-${c.id}`,
    ruleId: "client-followup",
    ruleTitle: "متابعة العملاء",
    result: `تم إنشاء تذكير متابعة للعميل "${c.name}"`,
    at: new Date().toISOString(),
    status: "success" as const,
  }));
}

function runWorkloadCalc(): AutomationLog[] {
  return [
    {
      id: "wl-1",
      ruleId: "workload",
      ruleTitle: "عبء العمل",
      result: "محمد علي: 80% · سارة أحمد: 65% · عمر حسن: 90% (مرتفع)",
      at: new Date().toISOString(),
      status: "warning" as const,
    },
  ];
}

function runWeeklyReport(): AutomationLog[] {
  const total = mockClients.length;
  const tasks  = mockTasks.filter((t) => t.status === "مكتملة").length;
  return [
    {
      id: "wr-1",
      ruleId: "weekly-report",
      ruleTitle: "التقرير الأسبوعي",
      result: `التقرير جاهز: ${total} عميل، ${tasks} مهمة مكتملة، نمو +18%`,
      at: new Date().toISOString(),
      status: "success" as const,
    },
  ];
}

const RULE_RUNNERS: Record<string, () => AutomationLog[]> = {
  "fund-dist":      runFundDistribution,
  "late-tasks":     runLateTaskDetection,
  "task-reminder":  () => [{ id: "tr-1", ruleId: "task-reminder", ruleTitle: "تنبيه المواعيد", result: "تم إرسال 2 تنبيه لمهام تستحق خلال 24 ساعة", at: new Date().toISOString(), status: "success" }],
  "client-followup":runClientFollowup,
  "workload":       runWorkloadCalc,
  "kpi-update":     () => [{ id: "ku-1", ruleId: "kpi-update", ruleTitle: "تحديث KPI", result: "تم تحديث 4 مؤشرات أداء رئيسية بناءً على أحدث البيانات", at: new Date().toISOString(), status: "success" }],
  "weekly-report":  runWeeklyReport,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

function AutomationContent() {
  const toast = useToast();

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "fund-dist",
      title: "توزيع الصناديق التلقائي",
      description: "عند إضافة دخل يوزَّع تلقائياً على 5 صناديق بنسب 40/10/10/20/20",
      trigger: "عند إضافة دخل أو فاتورة مدفوعة",
      action: "توزيع المبلغ على صناديق العمليات والادخار والضرائب والرواتب والتسويق",
      icon: DollarSign, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20",
      enabled: true, lastRun: "2024-05-28T08:00:00", runCount: 45,
    },
    {
      id: "task-reminder",
      title: "تنبيه مواعيد المهام",
      description: "إنشاء إشعار عند اقتراب موعد مهمة خلال 24 ساعة",
      trigger: "قبل 24 ساعة من موعد استحقاق المهمة",
      action: "إنشاء إشعار وإرسال تذكير للموظف المكلَّف",
      icon: Clock, iconColor: "text-amber-400", iconBg: "bg-amber-500/20",
      enabled: true, lastRun: "2024-05-28T07:00:00", runCount: 128,
    },
    {
      id: "late-tasks",
      title: "كشف المهام المتأخرة",
      description: "تحديث المهام المتجاوز موعدها كـ \"متأخرة\" وإنشاء إشعار",
      trigger: "يومياً عند منتصف الليل",
      action: "تغيير حالة المهمة إلى متأخرة وإشعار المدير",
      icon: AlertTriangle, iconColor: "text-red-400", iconBg: "bg-red-500/20",
      enabled: true, lastRun: "2024-05-28T00:00:00", runCount: 30,
    },
    {
      id: "client-followup",
      title: "متابعة العملاء المحتملين",
      description: "إنشاء تذكير متابعة للعملاء الذين لم يُتواصل معهم لأكثر من 7 أيام",
      trigger: "يومياً في الساعة 9 صباحاً",
      action: "إنشاء مهمة متابعة وإشعار مدير المبيعات",
      icon: Users, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20",
      enabled: true, lastRun: "2024-05-28T09:00:00", runCount: 22,
    },
    {
      id: "workload",
      title: "حساب عبء العمل",
      description: "حساب وتحديث نسبة عبء العمل لكل موظف تلقائياً",
      trigger: "كل ساعتين",
      action: "تحديث مؤشر عبء العمل وتنبيه المدير عند تجاوز 85%",
      icon: BarChart3, iconColor: "text-purple-400", iconBg: "bg-purple-500/20",
      enabled: true, lastRun: "2024-05-28T10:00:00", runCount: 96,
    },
    {
      id: "kpi-update",
      title: "تحديث مؤشرات الأداء",
      description: "تحديث KPI لوحة التحكم تلقائياً بناءً على أحدث البيانات",
      trigger: "كل 15 دقيقة",
      action: "إعادة حساب وتحديث 4 مؤشرات رئيسية في الداشبورد",
      icon: RefreshCw, iconColor: "text-blue-400", iconBg: "bg-blue-500/20",
      enabled: true, lastRun: "2024-05-28T10:45:00", runCount: 288,
    },
    {
      id: "weekly-report",
      title: "التقرير الأسبوعي التلقائي",
      description: "إنشاء تقرير أسبوعي شامل كل صباح إثنين جاهز للذكاء الاصطناعي",
      trigger: "كل إثنين الساعة 8 صباحاً",
      action: "تجميع بيانات الأسبوع وإنشاء تقرير PDF + ملخص للمساعد الذكي",
      icon: Shield, iconColor: "text-teal-400", iconBg: "bg-teal-500/20",
      enabled: false, runCount: 12,
    },
  ]);

  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Build initial logs
  useEffect(() => {
    const initial: AutomationLog[] = [
      { id: "l1", ruleId: "fund-dist",   ruleTitle: "توزيع الصناديق",    result: "وُزِّع 250,000 SAR على 5 صناديق بنجاح",         at: "2024-05-28T08:01:00", status: "success" },
      { id: "l2", ruleId: "late-tasks",  ruleTitle: "كشف المهام المتأخرة",result: "1 مهمة متأخرة — تم إنشاء إشعار",              at: "2024-05-28T00:01:00", status: "warning" },
      { id: "l3", ruleId: "kpi-update",  ruleTitle: "تحديث KPI",          result: "تم تحديث جميع المؤشرات بنجاح",                at: "2024-05-28T10:45:00", status: "success" },
      { id: "l4", ruleId: "task-reminder",ruleTitle: "تنبيه المواعيد",    result: "2 تنبيه أُرسلا بنجاح",                       at: "2024-05-28T07:00:00", status: "success" },
      { id: "l5", ruleId: "workload",    ruleTitle: "عبء العمل",          result: "عمر حسن 90% — تنبيه مرتفع أُرسل للمدير",    at: "2024-05-28T10:00:00", status: "warning" },
    ];
    setLogs(initial);
  }, []);

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
    const runner = RULE_RUNNERS[rule.id];
    const newLogs = runner ? runner() : [];
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

  const logColors = {
    success: { badge: "status-active", dot: "bg-emerald-400" },
    warning: { badge: "status-pending", dot: "bg-amber-400"  },
    error:   { badge: "status-inactive", dot: "bg-red-400"   },
  };

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
            { label: "القواعد النشطة",   value: activeCount,   color: "#22d3ee"  },
            { label: "إجمالي التنفيذات", value: totalRuns,     color: "#10b981"  },
            { label: "نجاح اليوم",       value: successLogs,   color: "#a855f7"  },
            { label: "القواعد الكلية",   value: rules.length,  color: "#ff7a3d"  },
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
                        {rule.lastRun && <span>🕐 آخر تشغيل: {new Date(rule.lastRun).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>}
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
                const cfg = logColors[log.status];
                return (
                  <div key={log.id} className="flex items-start gap-2.5 pb-2.5 border-b border-[#1e3a5f]/40 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-white">{log.ruleTitle}</span>
                        <span className={`badge text-[10px] ${cfg.badge}`}>{log.status === "success" ? "نجاح" : log.status === "warning" ? "تحذير" : "خطأ"}</span>
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
              <span>+18% مقارنة بالأسبوع الماضي</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "العملاء النشطون",  value: mockClients.filter((c) => c.status === "نشط").length,       color: "#22d3ee" },
              { label: "المهام المكتملة",  value: mockTasks.filter((t) => t.status === "مكتملة").length,      color: "#10b981" },
              { label: "المهام المتأخرة",  value: mockTasks.filter((t) => t.status === "متأخرة").length,      color: "#ef4444" },
              { label: "صافي الإيرادات",  value: `${formatCurrency(mockTransactions.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0))} SAR`, color: "#ff7a3d" },
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
  const { hasPermission } = usePermissions();
  if (!hasPermission("manage_automations")) {
    return <DashboardLayout><AccessDenied /></DashboardLayout>;
  }
  return <AutomationContent />;
}
