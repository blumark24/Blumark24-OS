"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { BarChart3, Download, FileText, Users, CheckSquare, UserCircle, DollarSign, Map, Calendar, Printer } from "lucide-react";
import { useEmployees, useClients, useTasks, useTransactions } from "@/hooks/useData";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const REPORT_TYPES = [
  { id: "employees", label: "الموظفين",   icon: Users,       color: "#22d3ee" },
  { id: "tasks",     label: "المهام",      icon: CheckSquare, color: "#f59e0b" },
  { id: "clients",   label: "العملاء",     icon: UserCircle,  color: "#10b981" },
  { id: "finance",   label: "المالية",     icon: DollarSign,  color: "#ff7a3d" },
  { id: "strategy",  label: "الاستراتيجية",icon: Map,         color: "#a855f7" },
  { id: "monthly",   label: "تقرير شهري", icon: Calendar,    color: "#1e6fd9" },
];

const DEPT_NAMES = ["الإدارة", "الهجوم", "الإبداع", "التصميم", "الحملات", "AI Lab"];

const TOOLTIP_STYLE = {
  background: "#0d1f3c",
  border: "1px solid #1e3a5f",
  borderRadius: "10px",
  color: "#e2e8f0",
};

type ReportId = "employees" | "tasks" | "clients" | "finance" | "strategy" | "monthly";

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["﻿" + content], { type: `${mime};charset=utf-8;` });
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
    { name: "جديدة",       value: tasks.filter((t) => t.status === "جديدة").length,       color: "#22d3ee" },
    { name: "قيد التنفيذ", value: tasks.filter((t) => t.status === "قيد_التنفيذ").length, color: "#f59e0b" },
    { name: "مكتملة",      value: tasks.filter((t) => t.status === "مكتملة").length,       color: "#10b981" },
    { name: "متأخرة",      value: tasks.filter((t) => t.status === "متأخرة").length,       color: "#ef4444" },
  ], [tasks]);

  const clientPkgData = useMemo(() => [
    { name: "صغيرة",  value: clients.filter((c) => c.packageType === "صغيرة").length,  color: "#22d3ee" },
    { name: "متوسطة", value: clients.filter((c) => c.packageType === "متوسطة").length, color: "#a855f7" },
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

  const exportExcel = () => {
    // Excel-compatible CSV (with BOM)
    exportCSV();
  };

  const exportPDF = () => window.print();

  const exportPrint = () => window.print();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <BarChart3 size={24} className="text-[#22d3ee]" />
              التقارير والتحليلات
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">تقارير شاملة قابلة للتصدير</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="input-dark text-sm py-2 w-36" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {["هذا الأسبوع", "هذا الشهر", "آخر 3 أشهر", "هذا العام"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={exportPDF} className="btn-primary flex items-center gap-2">
              <Download size={15} />
              تصدير PDF
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setActiveReport(rt.id as ReportId)}
              className={`glass-card p-3 flex flex-col items-center gap-2 transition-all ${activeReport === rt.id ? "border-opacity-50" : "opacity-70 hover:opacity-100"}`}
              style={{ borderColor: activeReport === rt.id ? rt.color : undefined }}
            >
              <div className="p-2 rounded-xl" style={{ background: `${rt.color}20` }}>
                <rt.icon size={16} style={{ color: rt.color }} />
              </div>
              <span className="text-xs text-[#8ba3c7]">{rt.label}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل البيانات...</div>
        )}

        {/* Monthly Report */}
        {!loading && activeReport === "monthly" && (
          <div className="space-y-6">
            <div className="glass-card p-6 border border-[#22d3ee]/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">التقرير الشهري الشامل</h2>
                  <p className="text-[#8ba3c7] text-sm">{period} – Blumark24 OS</p>
                </div>
                <div className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-3 py-1.5 rounded-xl">
                  تاريخ الإنشاء: {new Date().toLocaleDateString("ar-SA")}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "إجمالي العملاء",     value: clients.length,                                              color: "#22d3ee" },
                  { label: "الموظفون النشطون",   value: employees.filter((e) => e.status === "نشط").length,         color: "#10b981" },
                  { label: "المهام المكتملة",    value: tasks.filter((t) => t.status === "مكتملة").length,          color: "#f59e0b" },
                  { label: "صافي الربح",         value: `${formatCurrency(totalIncome - totalExpense)} SAR`,        color: "#ff7a3d" },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-4 rounded-2xl border border-[#1e3a5f] bg-[#0d1f3c]/60">
                    <div className="text-lg font-heading font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="text-xs text-[#8ba3c7] mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium text-[#8ba3c7] mb-3">الموظفون حسب القسم</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                      <XAxis dataKey="name" tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} name="عدد الموظفين" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#8ba3c7] mb-3">حالة المهام</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {taskStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend formatter={(v) => <span className="text-xs text-[#8ba3c7]">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees Report */}
        {!loading && activeReport === "employees" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">تقرير الموظفين</h3>
              <div className="flex gap-2">
                {[
                  { label: "PDF",   action: exportPDF   },
                  { label: "Excel", action: exportExcel },
                  { label: "CSV",   action: exportCSV   },
                ].map((fmt) => (
                  <button key={fmt.label} onClick={fmt.action} className="px-3 py-1 rounded-lg text-xs text-[#8ba3c7] bg-[#1a3356]/50 hover:text-[#22d3ee] transition-colors flex items-center gap-1">
                    <Download size={11} />{fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["الاسم", "القسم", "الدور", "المهام المكتملة", "الأداء", "الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3 text-white font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{emp.department}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{emp.role.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className="text-white">{emp.completedTasks ?? 0}</span>
                      <span className="text-[#8ba3c7]">/{emp.tasks ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <div key={s} className={`w-2 h-2 rounded-full ${s <= (emp.performance ?? 0) ? "bg-amber-400" : "bg-[#1e3a5f]"}`} />
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
                  <tr><td colSpan={6} className="text-center py-8 text-[#8ba3c7]">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tasks Report */}
        {!loading && activeReport === "tasks" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">تقرير المهام</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3 text-white font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{task.assigneeName}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{task.clientName || "—"}</td>
                    <td className="px-4 py-3"><span className="badge text-xs">{task.priority}</span></td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{task.dueDate}</td>
                    <td className="px-4 py-3"><span className="badge text-xs">{task.status.replace("_", " ")}</span></td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[#8ba3c7]">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Clients Report */}
        {!loading && activeReport === "clients" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h4 className="text-sm font-medium text-[#8ba3c7] mb-3">توزيع العملاء بالحزمة</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={clientPkgData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                      {clientPkgData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend formatter={(v) => <span className="text-xs text-[#8ba3c7]">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-5">
                <h4 className="text-sm font-medium text-[#8ba3c7] mb-4">الإيرادات حسب الحزمة</h4>
                {clientPkgData.map((pkg) => {
                  const revenue = clients.filter((c) => c.packageType === pkg.name).reduce((s, c) => s + c.contractValue, 0);
                  return (
                    <div key={pkg.name} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8ba3c7]">{pkg.name}</span>
                        <span style={{ color: pkg.color }}>{formatCurrency(revenue)} SAR</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: totalContractValue ? `${(revenue / totalContractValue) * 100}%` : "0%", background: pkg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Finance Report */}
        {!loading && activeReport === "finance" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">تقرير المالية</h3>
              <div className="flex gap-3 text-sm">
                <span className="text-emerald-400">دخل: {formatCurrency(totalIncome)} SAR</span>
                <span className="text-red-400">مصروف: {formatCurrency(totalExpense)} SAR</span>
                <span className="text-[#22d3ee] font-bold">صافي: {formatCurrency(totalIncome - totalExpense)} SAR</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["النوع", "الوصف", "الفئة", "التاريخ", "المبلغ"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => (
                  <tr key={tx.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3"><span className={`badge ${tx.type === "دخل" ? "status-active" : "status-inactive"}`}>{tx.type}</span></td>
                    <td className="px-4 py-3 text-white">{tx.description}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{tx.category}</td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{tx.date}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: tx.type === "دخل" ? "#10b981" : "#ef4444" }}>
                      {tx.type === "دخل" ? "+" : "-"}{formatCurrency(tx.amount)} SAR
                    </td>
                  </tr>
                ))}
                {txs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#8ba3c7]">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Export Options */}
        <div className="glass-card p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[#22d3ee]" />
            خيارات التصدير
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "PDF",    icon: <Download size={20} className="text-red-400" />,    desc: "تقرير منسق للطباعة",          action: exportPDF    },
              { label: "Excel",  icon: <Download size={20} className="text-emerald-400" />, desc: "جداول بيانات للتحليل",        action: exportExcel  },
              { label: "CSV",    icon: <Download size={20} className="text-blue-400" />,   desc: "بيانات خام قابلة للاستيراد",  action: exportCSV    },
              { label: "طباعة", icon: <Printer  size={20} className="text-purple-400" />, desc: "طباعة مباشرة",                action: exportPrint  },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="p-4 rounded-2xl bg-[#1a3356]/40 hover:bg-[#1a3356] border border-[#1e3a5f] hover:border-[#22d3ee]/40 transition-all text-right"
              >
                <div className="mb-2">{opt.icon}</div>
                <div className="text-sm font-medium text-white">{opt.label}</div>
                <div className="text-xs text-[#8ba3c7] mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
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
