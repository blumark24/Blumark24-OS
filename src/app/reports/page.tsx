"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import {
  Download, FileText, Users, CheckSquare, UserCircle,
  DollarSign, Map, Calendar, Printer,
} from "lucide-react";
import { useEmployees, useClients, useTasks, useTransactions } from "@/hooks/useData";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  WS_PAGE, WS_CARD, WS_HERO, WS_MUTED, WS_SECTION_TITLE,
  kpiTheme, type KpiAccent,
} from "@/components/ui/workspaceVisual";
import {
  PageHero, KpiStatCard, WorkspaceEmptyInline, GlassPanel,
} from "@/components/ui/workspaceUi";
import { cn } from "@/lib/utils";

/**
 * Report selector buttons — every report has a semantic accent that drives
 * the active state and matches the workspace-wide palette.
 */
const REPORT_TYPES: { id: ReportId; label: string; icon: React.ElementType; accent: KpiAccent }[] = [
  { id: "employees", label: "الموظفين",      icon: Users,       accent: "cyan"    },
  { id: "tasks",     label: "المهام",         icon: CheckSquare, accent: "amber"   },
  { id: "clients",   label: "العملاء",        icon: UserCircle,  accent: "emerald" },
  { id: "finance",   label: "المالية",        icon: DollarSign,  accent: "rose"    },
  { id: "strategy",  label: "الاستراتيجية",   icon: Map,         accent: "violet"  },
  { id: "monthly",   label: "تقرير شهري",    icon: Calendar,    accent: "sky"     },
];

const DEPT_NAMES = ["الإدارة", "الهجوم", "الإبداع", "التصميم", "الحملات", "AI Lab"];

const TOOLTIP_STYLE = {
  background: "var(--ws-surface-modal)",
  border: "1px solid var(--ws-border-strong)",
  borderRadius: "12px",
  color: "var(--ws-text-primary)",
};

type ReportId = "employees" | "tasks" | "clients" | "finance" | "strategy" | "monthly";

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8;` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function ReportsContent() {
  const [activeReport, setActiveReport] = useState<ReportId>("monthly");
  const [period, setPeriod]             = useState("هذا الشهر");

  const { data: employees, loading: loadingEmp }  = useEmployees();
  const { data: clients,   loading: loadingCli }  = useClients();
  const { data: tasks,     loading: loadingTsk }  = useTasks();
  const { data: txs,       loading: loadingTx }   = useTransactions();

  const loading = loadingEmp || loadingCli || loadingTsk || loadingTx;

  const totalIncome  = useMemo(() => txs.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0),  [txs]);
  const totalExpense = useMemo(() => txs.filter((t) => t.type === "مصروف").reduce((s, t) => s + t.amount, 0), [txs]);

  const deptData = useMemo(() =>
    DEPT_NAMES.map((dept) => ({ name: dept, count: employees.filter((e) => e.department === dept).length })),
  [employees]);

  const taskStatusData = useMemo(() => [
    { name: "جديدة",       value: tasks.filter((t) => t.status === "جديدة").length,       color: "var(--ws-cyan)" },
    { name: "قيد التنفيذ", value: tasks.filter((t) => t.status === "قيد_التنفيذ").length, color: "var(--ws-amber)" },
    { name: "مكتملة",      value: tasks.filter((t) => t.status === "مكتملة").length,       color: "var(--ws-emerald)" },
    { name: "متأخرة",      value: tasks.filter((t) => t.status === "متأخرة").length,       color: "var(--ws-rose)" },
  ], [tasks]);

  const clientPkgData = useMemo(() => [
    { name: "صغيرة",  value: clients.filter((c) => c.packageType === "صغيرة").length,  color: "var(--ws-cyan)" },
    { name: "متوسطة", value: clients.filter((c) => c.packageType === "متوسطة").length, color: "var(--ws-violet)" },
    { name: "كبيرة",  value: clients.filter((c) => c.packageType === "كبيرة").length,  color: "#ff7a3d" },
  ], [clients]);

  const totalContractValue = useMemo(() => clients.reduce((s, c) => s + c.contractValue, 0), [clients]);

  // ─── Export functions ───────────────────────────────────────────────────────

  const exportCSV = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    if (activeReport === "employees") {
      const rows = [
        ["الاسم", "القسم", "الدور", "المهام المكتملة", "الأداء", "الحالة"],
        ...employees.map((e) => [e.name, e.department, e.role, String(e.completedTasks ?? 0), String(e.performance ?? 0), e.status]),
      ];
      downloadBlob(toCSV(rows), `تقرير-الموظفين-${dateStr}.csv`, "text/csv");
    } else if (activeReport === "clients") {
      const rows = [
        ["الاسم", "نوع النشاط", "المدينة", "الحزمة", "قيمة العقد", "الحالة"],
        ...clients.map((c) => [c.name, c.businessType, c.city, c.packageType, String(c.contractValue), c.status]),
      ];
      downloadBlob(toCSV(rows), `تقرير-العملاء-${dateStr}.csv`, "text/csv");
    } else if (activeReport === "tasks") {
      const rows = [
        ["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"],
        ...tasks.map((t) => [t.title, t.assigneeName, t.clientName ?? "", t.priority, t.dueDate, t.status]),
      ];
      downloadBlob(toCSV(rows), `تقرير-المهام-${dateStr}.csv`, "text/csv");
    } else if (activeReport === "finance") {
      const rows = [
        ["النوع", "الوصف", "الفئة", "التاريخ", "المبلغ"],
        ...txs.map((t) => [t.type, t.description, t.category, t.date, String(t.amount)]),
      ];
      downloadBlob(toCSV(rows), `تقرير-المالية-${dateStr}.csv`, "text/csv");
    } else {
      const rows = [
        ["الموظفون", "العملاء", "المهام المكتملة", "صافي الربح"],
        [String(employees.length), String(clients.length), String(tasks.filter((t) => t.status === "مكتملة").length), `${formatCurrency(totalIncome - totalExpense)} SAR`],
      ];
      downloadBlob(toCSV(rows), `تقرير-شهري-${dateStr}.csv`, "text/csv");
    }
  };

  const exportExcel = () => exportCSV();
  const exportPDF   = () => window.print();
  const exportPrint = () => window.print();

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <PageHero title="التقارير والتحليلات" subtitle="تقارير شاملة قابلة للتصدير">
          <select className="input-dark text-sm py-2 w-full sm:w-36 min-h-11" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="فترة التقرير">
            {["هذا الأسبوع", "هذا الشهر", "آخر 3 أشهر", "هذا العام"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={exportPDF} className="btn-primary flex items-center gap-2 min-h-11 touch-manipulation">
            <Download size={15} />
            تصدير PDF
          </button>
        </PageHero>

        {/* Report selector — accent active state per report. */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 min-w-0">
          {REPORT_TYPES.map((rt) => {
            const theme = kpiTheme(rt.accent);
            const isActive = activeReport === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setActiveReport(rt.id)}
                className={cn(
                  WS_CARD,
                  isActive ? theme.card : "",
                  "p-3 flex flex-col items-center gap-2 transition-all min-h-[80px] touch-manipulation",
                  isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                )}
                aria-pressed={isActive}
              >
                {isActive && <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", theme.wash)} />}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <span className={cn("grid place-items-center w-9 h-9 rounded-xl backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]", theme.orb)}>
                    <rt.icon size={16} className={theme.iconColor} />
                  </span>
                  <span className="text-xs text-[color:var(--ws-text-primary)]/85">{rt.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className={cn("text-center py-8 text-sm", WS_MUTED)}>جارٍ تحميل البيانات...</div>
        )}

        {/* Monthly Report */}
        {!loading && activeReport === "monthly" && (
          <div className="space-y-6">
            <div className={cn(WS_HERO, "p-6")}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,var(--ws-cyan-soft),transparent_55%),radial-gradient(110%_120%_at_8%_125%,var(--ws-violet-soft),transparent_55%)]" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className={cn(WS_SECTION_TITLE, "text-xl")}>التقرير الشهري الشامل</h2>
                    <p className={cn(WS_MUTED, "text-sm")}>{period}</p>
                  </div>
                  <div className={cn(WS_MUTED, "text-xs bg-[var(--ws-surface-2)] px-3 py-1.5 rounded-xl")}>
                    تاريخ الإنشاء: {new Date().toLocaleDateString("ar-SA")}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  <KpiStatCard label="إجمالي العملاء"   value={String(clients.length)}                                       icon={UserCircle}  accent="cyan"    showLive={false} showSparkline={false} />
                  <KpiStatCard label="الموظفون النشطون" value={String(employees.filter((e) => e.status === "نشط").length)}  icon={Users}       accent="emerald" showLive={false} showSparkline={false} />
                  <KpiStatCard label="المهام المكتملة" value={String(tasks.filter((t) => t.status === "مكتملة").length)}    icon={CheckSquare} accent="amber"   showLive={false} showSparkline={false} />
                  <KpiStatCard label="صافي الربح"      value={formatCurrency(totalIncome - totalExpense)} subtitle="SAR"   icon={DollarSign}  accent="sky"     showLive={false} showSparkline={false} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <GlassPanel title="الموظفون حسب القسم" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={deptData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ws-border-subtle)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--ws-text-secondary)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "var(--ws-text-secondary)", fontSize: 11 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill="var(--ws-cyan)" radius={[4, 4, 0, 0]} name="عدد الموظفين" />
                      </BarChart>
                    </ResponsiveContainer>
                  </GlassPanel>
                  <GlassPanel title="حالة المهام">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                          {taskStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend formatter={(v) => <span className={cn(WS_MUTED, "text-xs")}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </GlassPanel>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees Report */}
        {!loading && activeReport === "employees" && (
          <div className={cn(WS_CARD, "overflow-hidden p-0")}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ws-border-subtle)] gap-3 flex-wrap">
              <h3 className={cn(WS_SECTION_TITLE, "text-base")}>تقرير الموظفين</h3>
              <div className="flex gap-2">
                {[
                  { label: "PDF",   action: exportPDF   },
                  { label: "Excel", action: exportExcel },
                  { label: "CSV",   action: exportCSV   },
                ].map((fmt) => (
                  <button
                    key={fmt.label}
                    onClick={fmt.action}
                    className="px-3 py-1.5 rounded-lg text-xs text-[color:var(--ws-text-secondary)] bg-[var(--ws-surface-2)] hover:text-cyan-300 transition-colors flex items-center gap-1 touch-manipulation"
                  >
                    <Download size={11} />{fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]">
                    {["الاسم", "القسم", "الدور", "المهام المكتملة", "الأداء", "الحالة"].map((h) => (
                      <th key={h} className="text-start text-[color:var(--ws-text-secondary)] font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                      <td className="px-4 py-3 text-[color:var(--ws-text-primary)] font-medium">{emp.name}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{emp.department}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{emp.role.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <span className="text-[color:var(--ws-text-primary)]">{emp.completedTasks ?? 0}</span>
                        <span className={WS_MUTED}>/{emp.tasks ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className={`w-2 h-2 rounded-full ${s <= (emp.performance ?? 0) ? "bg-amber-400" : "bg-[var(--ws-border-strong)]"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${emp.status === "نشط" ? "status-active" : "status-inactive"}`}>
                          {emp.status === "نشط" ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={6}>
                      <WorkspaceEmptyInline icon={Users} title="لا توجد بيانات" accent="cyan" className="py-10" />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Report */}
        {!loading && activeReport === "tasks" && (
          <div className={cn(WS_CARD, "overflow-hidden p-0")}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ws-border-subtle)]">
              <h3 className={cn(WS_SECTION_TITLE, "text-base")}>تقرير المهام</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]">
                    {["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"].map((h) => (
                      <th key={h} className="text-start text-[color:var(--ws-text-secondary)] font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                      <td className="px-4 py-3 text-[color:var(--ws-text-primary)] font-medium">{task.title}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{task.assigneeName}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{task.clientName || "—"}</td>
                      <td className="px-4 py-3"><span className="badge text-xs">{task.priority}</span></td>
                      <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{task.dueDate}</td>
                      <td className="px-4 py-3"><span className="badge text-xs">{task.status.replace("_", " ")}</span></td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={6}>
                      <WorkspaceEmptyInline icon={CheckSquare} title="لا توجد بيانات" accent="amber" className="py-10" />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Report */}
        {!loading && activeReport === "clients" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassPanel title="توزيع العملاء بالحزمة">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={clientPkgData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                    {clientPkgData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span className={cn(WS_MUTED, "text-xs")}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </GlassPanel>
            <GlassPanel title="الإيرادات حسب الحزمة">
              {clientPkgData.map((pkg) => {
                const revenue = clients.filter((c) => c.packageType === pkg.name).reduce((s, c) => s + c.contractValue, 0);
                return (
                  <div key={pkg.name} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={WS_MUTED}>{pkg.name}</span>
                      <span style={{ color: pkg.color }}>{formatCurrency(revenue)} SAR</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: totalContractValue ? `${(revenue / totalContractValue) * 100}%` : "0%", background: pkg.color }} />
                    </div>
                  </div>
                );
              })}
            </GlassPanel>
          </div>
        )}

        {/* Finance Report */}
        {!loading && activeReport === "finance" && (
          <div className={cn(WS_CARD, "overflow-hidden p-0")}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ws-border-subtle)] gap-3 flex-wrap">
              <h3 className={cn(WS_SECTION_TITLE, "text-base")}>تقرير المالية</h3>
              <div className="flex gap-3 text-sm flex-wrap">
                <span className="text-emerald-400">دخل: {formatCurrency(totalIncome)} SAR</span>
                <span className="text-rose-400">مصروف: {formatCurrency(totalExpense)} SAR</span>
                <span className="text-cyan-300 font-bold">صافي: {formatCurrency(totalIncome - totalExpense)} SAR</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]">
                    {["النوع", "الوصف", "الفئة", "التاريخ", "المبلغ"].map((h) => (
                      <th key={h} className="text-start text-[color:var(--ws-text-secondary)] font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => (
                    <tr key={tx.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                      <td className="px-4 py-3"><span className={`badge ${tx.type === "دخل" ? "status-active" : "status-inactive"}`}>{tx.type}</span></td>
                      <td className="px-4 py-3 text-[color:var(--ws-text-primary)]">{tx.description}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{tx.category}</td>
                      <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{tx.date}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: tx.type === "دخل" ? "var(--ws-emerald)" : "var(--ws-rose)" }}>
                        {tx.type === "دخل" ? "+" : "-"}{formatCurrency(tx.amount)} SAR
                      </td>
                    </tr>
                  ))}
                  {txs.length === 0 && (
                    <tr><td colSpan={5}>
                      <WorkspaceEmptyInline icon={DollarSign} title="لا توجد بيانات" accent="rose" className="py-10" />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Strategy Report — minimal panel using existing real datasets only. */}
        {!loading && activeReport === "strategy" && (
          <GlassPanel title="ملخص استراتيجي">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={cn(WS_CARD, "p-4")}>
                <div className={cn(WS_MUTED, "text-xs")}>إجمالي العملاء</div>
                <div className="text-2xl font-heading font-bold text-[color:var(--ws-text-primary)] tabular-nums">{clients.length}</div>
              </div>
              <div className={cn(WS_CARD, "p-4")}>
                <div className={cn(WS_MUTED, "text-xs")}>المهام النشطة</div>
                <div className="text-2xl font-heading font-bold text-[color:var(--ws-text-primary)] tabular-nums">{tasks.filter((t) => t.status !== "مكتملة").length}</div>
              </div>
              <div className={cn(WS_CARD, "p-4")}>
                <div className={cn(WS_MUTED, "text-xs")}>الموظفون النشطون</div>
                <div className="text-2xl font-heading font-bold text-[color:var(--ws-text-primary)] tabular-nums">{employees.filter((e) => e.status === "نشط").length}</div>
              </div>
              <div className={cn(WS_CARD, "p-4")}>
                <div className={cn(WS_MUTED, "text-xs")}>صافي الربح</div>
                <div className="text-2xl font-heading font-bold tabular-nums" style={{ color: totalIncome - totalExpense >= 0 ? "var(--ws-emerald)" : "var(--ws-rose)" }}>
                  {formatCurrency(totalIncome - totalExpense)} SAR
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Export Options */}
        <GlassPanel title="خيارات التصدير"
          action={<FileText size={16} className="text-cyan-300" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "PDF",    icon: Download, accent: "rose" as KpiAccent,    desc: "تقرير منسق للطباعة",         action: exportPDF   },
              { label: "Excel",  icon: Download, accent: "emerald" as KpiAccent, desc: "جداول بيانات للتحليل",       action: exportExcel },
              { label: "CSV",    icon: Download, accent: "cyan" as KpiAccent,    desc: "بيانات خام قابلة للاستيراد", action: exportCSV   },
              { label: "طباعة", icon: Printer,  accent: "violet" as KpiAccent,  desc: "طباعة مباشرة",               action: exportPrint },
            ].map((opt) => {
              const theme = kpiTheme(opt.accent);
              return (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className="p-4 rounded-2xl bg-[var(--ws-surface-2)] hover:bg-[var(--ws-surface-3)] border border-[var(--ws-border-subtle)] hover:border-[var(--ws-border-strong)] transition-all text-start touch-manipulation"
                >
                  <span className={cn("grid place-items-center w-9 h-9 rounded-xl mb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]", theme.orb)}>
                    <opt.icon size={18} className={theme.iconColor} />
                  </span>
                  <div className="text-sm font-medium text-[color:var(--ws-text-primary)]">{opt.label}</div>
                  <div className={cn(WS_MUTED, "text-xs mt-0.5")}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </DashboardLayout>
  );
}

export default function ReportsPage() {
  return (
    <PageGuard permission="manage_reports">
      <ReportsContent />
    </PageGuard>
  );
}
