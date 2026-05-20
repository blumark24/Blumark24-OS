"use client";

import PageGuard from "@/components/ui/PageGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useClients, useTasks, useEmployees } from "@/hooks/useData";
import { Activity, AlertTriangle, CheckCircle2, Users, Briefcase } from "lucide-react";

const lifecycleStages = [
  "عميل جديد",
  "تم التواصل",
  "عرض سعر",
  "تفاوض",
  "بانتظار التوقيع",
  "متعاقد",
  "قيد التنفيذ",
  "مراجعة العميل",
  "مكتمل",
  "متوقف",
  "غير محدد",
] as const;

const taskStages = ["لم تبدأ", "قيد التنفيذ", "تحتاج مراجعة", "متأخرة", "مكتملة"] as const;

function mapClientStage(status?: string): (typeof lifecycleStages)[number] {
  const s = String(status ?? "").trim();
  if (!s) return "غير محدد";
  if (["محتمل", "جديد", "new", "lead"].includes(s)) return "عميل جديد";
  if (["تم التواصل", "contacted"].includes(s)) return "تم التواصل";
  if (["عرض سعر", "quotation", "proposal"].includes(s)) return "عرض سعر";
  if (["تفاوض", "negotiation"].includes(s)) return "تفاوض";
  if (["بانتظار التوقيع", "pending_signature"].includes(s)) return "بانتظار التوقيع";
  if (["متعاقد", "contracted"].includes(s)) return "متعاقد";
  if (["نشط", "active", "قيد التنفيذ"].includes(s)) return "قيد التنفيذ";
  if (["مراجعة", "مراجعة العميل", "in_review"].includes(s)) return "مراجعة العميل";
  if (["مكتمل", "completed"].includes(s)) return "مكتمل";
  if (["متوقف", "stopped", "inactive"].includes(s)) return "متوقف";
  return "غير محدد";
}

function isTaskDelayed(status?: string, dueDate?: string): boolean {
  const s = String(status ?? "");
  if (s === "متأخرة") return true;
  if (s === "مكتملة") return false;
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return false;
  return due < Date.now();
}

function mapTaskStage(status?: string, dueDate?: string): (typeof taskStages)[number] {
  if (isTaskDelayed(status, dueDate)) return "متأخرة";
  const s = String(status ?? "").trim();
  if (s === "قيد_التنفيذ") return "قيد التنفيذ";
  if (s === "بانتظار_المراجعة") return "تحتاج مراجعة";
  if (s === "مكتملة") return "مكتملة";
  return "لم تبدأ";
}

export default function AttackPage() {
  const { data: clients, loading: clientsLoading } = useClients();
  const { data: tasks, loading: tasksLoading } = useTasks();
  const { data: employees, loading: employeesLoading } = useEmployees();

  const clientBuckets = lifecycleStages.reduce<Record<string, typeof clients>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {});

  clients.forEach((client) => {
    const stage = mapClientStage(client.status);
    clientBuckets[stage].push(client);
  });

  const taskBuckets = taskStages.reduce<Record<string, typeof tasks>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {});

  tasks.forEach((task) => {
    const stage = mapTaskStage(task.status, task.dueDate);
    taskBuckets[stage].push(task);
  });

  const delayedTasks = tasks.filter((t) => isTaskDelayed(t.status, t.dueDate));
  const completedTasks = tasks.filter((t) => t.status === "مكتملة");
  const inExecutionClients = clientBuckets["قيد التنفيذ"]?.length ?? 0;
  const activeEmployees = employees.filter((e) => e.status === "نشط").length;

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const mostLoadedEmployee = employees.reduce<{ name: string; tasks: number } | null>((best, e) => {
    const currentTasks = e.tasks ?? 0;
    if (!best || currentTasks > best.tasks) return { name: e.name || "غير محدد", tasks: currentTasks };
    return best;
  }, null);

  const insights = [
    `يوجد ${delayedTasks.length} مهام متأخرة تحتاج متابعة.`,
    `يوجد ${inExecutionClients} عميل قيد التنفيذ.`,
    mostLoadedEmployee
      ? `الموظف ${mostLoadedEmployee.name} لديه أعلى ضغط مهام (${mostLoadedEmployee.tasks}).`
      : "لا توجد بيانات كافية لتحديد ضغط المهام.",
    `يوجد ${completedTasks.length} مهمة مكتملة.`,
  ];

  const isLoading = clientsLoading || tasksLoading || employeesLoading;

  return (
    <PageGuard permission="manage_reports">
      <DashboardLayout>
        <div className="space-y-5 text-white" dir="rtl">
          <section className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(14,28,52,0.95),rgba(22,49,93,0.85))] p-4 sm:p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
            <h1 className="text-2xl sm:text-3xl font-bold">لوحة وكالة الهجوم</h1>
            <p className="mt-2 text-sm sm:text-base text-cyan-100/80">متابعة العملاء والمهام والتنفيذ اليومي</p>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "العملاء قيد التنفيذ", value: inExecutionClients, icon: Briefcase },
                { label: "المهام المتأخرة", value: delayedTasks.length, icon: AlertTriangle },
                { label: "معدل الإنجاز", value: `${completionRate}%`, icon: CheckCircle2 },
                { label: "الموظفون النشطون", value: activeEmployees, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md min-h-[96px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-cyan-100/80">{label}</span>
                    <Icon size={16} className="text-cyan-300" />
                  </div>
                  <div className="text-xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f223f]/70 p-4 sm:p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-3">لوحة دورة حياة العملاء</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {lifecycleStages.map((stage) => (
                <div key={stage} className="rounded-xl border border-cyan-500/20 bg-[#122a4b]/70 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-cyan-100">{stage}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20">{clientBuckets[stage]?.length ?? 0}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {(clientBuckets[stage] ?? []).length === 0 ? (
                      <div className="text-xs text-white/60">لا توجد بيانات كافية</div>
                    ) : (
                      clientBuckets[stage].map((c) => (
                        <article key={c.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs space-y-1">
                          <div className="font-semibold text-sm">{c.name || "غير محدد"}</div>
                          <div className="text-white/70">المرحلة: {stage}</div>
                          <div className="text-white/70">المسؤول: {c.accountManagerName || "غير محدد"}</div>
                          <div className="text-white/70">{c.city || "غير محدد"} • {c.packageType || "غير محدد"}</div>
                          <div className="text-white/80">{typeof c.contractValue === "number" ? `${c.contractValue.toLocaleString()} SAR` : "غير محدد"}</div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f223f]/70 p-4 sm:p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-3">لوحة التنفيذ اليومي للمهام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
              {taskStages.map((stage) => (
                <div key={stage} className="rounded-xl border border-indigo-400/20 bg-[#132d52]/70 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-indigo-100">{stage}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20">{taskBuckets[stage]?.length ?? 0}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {(taskBuckets[stage] ?? []).length === 0 ? (
                      <div className="text-xs text-white/60">لا توجد بيانات كافية</div>
                    ) : (
                      taskBuckets[stage].map((t) => {
                        const delayed = isTaskDelayed(t.status, t.dueDate);
                        return (
                          <article key={t.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs space-y-1">
                            <div className="font-semibold text-sm">{t.title || "غير محدد"}</div>
                            <div className="text-white/70">المسؤول: {t.assigneeName || "غير محدد"}</div>
                            <div className="text-white/70">العميل: {t.clientName || "غير محدد"}</div>
                            <div className="text-white/70">الأولوية: {t.priority || "غير محدد"}</div>
                            <div className="text-white/70">تاريخ الاستحقاق: {t.dueDate || "غير محدد"}</div>
                            {delayed && <div className="text-red-300 font-medium">متأخرة</div>}
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f223f]/70 p-4 sm:p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-3">لوحة تنفيذ الموظفين</h2>
            {employees.length === 0 ? (
              <div className="text-sm text-white/70">لا توجد بيانات كافية</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {employees.map((e) => (
                  <article key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5 text-sm">
                    <div className="font-semibold">{e.name || "غير محدد"}</div>
                    <div className="text-white/70">القسم: {e.department || "غير محدد"}</div>
                    <div className="text-white/70">الدور: {e.role || "غير محدد"}</div>
                    <div className="text-white/70">الحالة: {e.status || "غير محدد"}</div>
                    <div className="text-white/80">المهام النشطة: {e.tasks ?? 0}</div>
                    <div className="text-white/80">المهام المكتملة: {e.completedTasks ?? 0}</div>
                    <div className="text-cyan-200">الأداء: {typeof e.performance === "number" ? `${e.performance}%` : "غير محدد"}</div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#0f223f]/70 p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 text-cyan-100">
              <Activity size={18} />
              <h2 className="text-lg font-semibold">رؤى تشغيلية ذكية</h2>
            </div>
            {isLoading ? (
              <div className="text-sm text-white/70">جاري التحميل...</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {insights.map((line, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">{line}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
