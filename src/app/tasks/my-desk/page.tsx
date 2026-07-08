"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ChevronLeft, Folder, HelpCircle, LayoutGrid, MessageSquare, Play, Radar, Send, Settings } from "lucide-react";
import PageGuard from "@/components/ui/PageGuard";
import { useEmployees, useTasks } from "@/hooks/useData";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ORG_UNKNOWN_LABEL, createOrgScopeResolver } from "@/lib/org/orgScopeResolver";
import type { TaskStatus } from "@/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  جديدة: "جديدة",
  قيد_التنفيذ: "قيد التنفيذ",
  بانتظار_المراجعة: "بانتظار اعتماد",
  مكتملة: "مكتملة",
  متأخرة: "متأخرة",
};

function isOverdue(dueDate: string, status: TaskStatus) {
  if (status === "مكتملة") return false;
  const target = new Date(dueDate);
  if (Number.isNaN(target.getTime())) return false;
  return target < new Date();
}

function daysUntil(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function StatBox({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${tone}`}>
      <div className="text-[11px] font-bold">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export default function MyTwinDeskPage() {
  const { data: tasks, loading, update } = useTasks();
  const { data: employees } = useEmployees();
  const { data: orgSnapshot } = useOrgStructure(true);
  const { user } = useAuth();
  const toast = useToast();
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const orgResolver = useMemo(
    () => createOrgScopeResolver(orgSnapshot, employees),
    [orgSnapshot, employees],
  );

  const currentEmployee = useMemo(() => {
    const userId = user?.id;
    const userEmail = user?.email?.toLowerCase();
    return employees.find((employee) =>
      (userId && employee.id === userId) ||
      (userEmail && employee.email?.toLowerCase() === userEmail),
    ) ?? null;
  }, [employees, user?.email, user?.id]);

  const employeeName = currentEmployee?.name || user?.email?.split("@")[0] || "الموظف";
  const employeeScope = useMemo(
    () => orgResolver.resolveEmployee(currentEmployee ?? {
      id: user?.id ?? "",
      name: employeeName,
      email: user?.email ?? "",
      department: user?.department ?? "",
    }),
    [currentEmployee, employeeName, orgResolver, user?.department, user?.email, user?.id],
  );

  const assignedTasks = useMemo(() => {
    const ids = new Set([user?.id, currentEmployee?.id].filter(Boolean));
    const names = new Set([currentEmployee?.name, user?.email, employeeName].filter(Boolean));
    return tasks.filter((task) => ids.has(task.assigneeId) || names.has(task.assigneeName));
  }, [currentEmployee?.id, currentEmployee?.name, employeeName, tasks, user?.email, user?.id]);

  const insight = useMemo(() => {
    const active = assignedTasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task.dueDate, task.status));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const done = assignedTasks.filter((task) => task.status === "مكتملة");
    const doing = active.filter((task) => task.status === "قيد_التنفيذ");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return diff >= 0 && diff <= 2;
    });
    const focusTask = late[0] ?? active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ?? dueSoon[0] ?? active[0] ?? null;
    return { active, late, review, done, doing, dueSoon, focusTask };
  }, [assignedTasks]);

  const focus = insight.focusTask;
  const pressure = insight.active.length >= 6 ? "ضغط مرتفع" : insight.active.length >= 3 ? "ضغط متوسط" : "طبيعي";

  const radarGroups = useMemo(() => {
    const sameManager = insight.active.filter((task) => {
      const scope = orgResolver.resolveTaskAssignee(task);
      return Boolean(employeeScope.managerId && scope.managerId === employeeScope.managerId);
    });
    const sameDepartment = insight.active.filter((task) => {
      const scope = orgResolver.resolveTaskAssignee(task);
      return Boolean(
        (employeeScope.departmentId && scope.departmentId === employeeScope.departmentId) ||
        (employeeScope.departmentLabel !== ORG_UNKNOWN_LABEL && scope.departmentLabel === employeeScope.departmentLabel),
      );
    });
    const otherDepartments = insight.active.filter((task) => {
      const scope = orgResolver.resolveTaskAssignee(task);
      return scope.departmentLabel !== ORG_UNKNOWN_LABEL && scope.departmentLabel !== employeeScope.departmentLabel;
    });

    return [
      { label: "مديري المباشر", count: sameManager.length, tone: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" },
      { label: "قسمي", count: sameDepartment.length, tone: "border-blue-300/25 bg-blue-400/10 text-blue-100" },
      { label: "أقسام أخرى", count: otherDepartments.length, tone: "border-white/10 bg-white/[0.045] text-[#d7e7ff]" },
      { label: "مرتبطة بعميل", count: insight.active.filter((task) => task.clientId || task.clientName).length, tone: "border-amber-300/25 bg-amber-400/10 text-amber-100" },
      { label: "متأخرة", count: insight.late.length, tone: "border-red-400/25 bg-red-500/10 text-red-100" },
      { label: "للمراجعة", count: insight.review.length, tone: "border-violet-300/25 bg-violet-500/10 text-violet-100" },
    ];
  }, [employeeScope.departmentId, employeeScope.departmentLabel, employeeScope.managerId, insight.active, insight.late.length, insight.review.length, orgResolver]);

  const changeStatus = async (status: TaskStatus, message: string) => {
    if (!focus) return;
    setSavingAction(status);
    try {
      await update(focus.id, { status });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المهمة");
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <PageGuard permission="manage_tasks" immersive>
      <main dir="rtl" className="min-h-screen bg-[#020711] p-3 text-white sm:p-4">
        <div className="mx-auto max-w-[1800px] rounded-[34px] border border-white/10 bg-[#06101f] p-3 shadow-[0_30px_120px_rgba(0,0,0,.62)]">
          <header className="mb-3 grid grid-cols-1 gap-3 rounded-[26px] border border-white/10 bg-black/25 p-4 lg:grid-cols-[300px_1fr_330px] lg:items-center">
            <div className="text-right">
              <div className="text-2xl font-black">Blumark24 OS</div>
              <div className="text-xs text-[#8ba3c7]">Digital Twin Intelligence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">مرحباً {employeeName}</div>
              <div className="text-xs text-[#8ba3c7]">{employeeScope.departmentLabel} · المدير المباشر: {employeeScope.managerName}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {[Bell, MessageSquare, Settings].map((Icon, index) => <button key={index} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-100"><Icon size={18} /></button>)}
              <Link href="/tasks" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-100"><ChevronLeft size={15} />رجوع للمهام</Link>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 xl:grid-cols-[310px_minmax(0,1fr)_430px]">
            <aside className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3 text-center text-sm font-bold">رادار التنبيهات الذكي</div>
                <div className="mx-auto mb-5 grid h-36 w-36 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_44px_rgba(34,211,238,.26)]"><Radar size={62} className="text-cyan-100" /></div>
                <div className="space-y-2">
                  {radarGroups.some((group) => group.count > 0) ? radarGroups.map((group) => (
                    <div key={group.label} className={`rounded-2xl border p-3 ${group.tone}`}>
                      <div className="flex items-center justify-between gap-2 text-sm font-bold">
                        <span>{group.label}</span>
                        <span className="text-white">{group.count}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center text-xs text-[#8ba3c7]">
                      لا توجد تنبيهات تشغيلية حالياً.
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-center">
                <div className="text-sm font-bold">مؤشر ضغط العمل</div>
                <div className="mx-auto my-3 grid h-28 w-28 place-items-center rounded-full border-[12px] border-amber-400/70 bg-amber-400/10 text-3xl font-black">{Math.min(99, insight.active.length * 13)}%</div>
                <div className="text-xs text-[#8ba3c7]">لديك {insight.active.length} مهام نشطة</div>
              </div>
            </aside>

            <main className="space-y-3">
              <div className="relative min-h-[520px] overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#07101e] shadow-[0_24px_100px_rgba(0,0,0,.55)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_62%,rgba(34,211,238,.28),transparent_25%),radial-gradient(circle_at_18%_25%,rgba(245,158,11,.18),transparent_22%),radial-gradient(circle_at_84%_24%,rgba(34,211,238,.16),transparent_21%),linear-gradient(180deg,rgba(14,30,55,.3),rgba(0,0,0,.75))]" />
                <div className="absolute left-12 top-28 h-64 w-40 rounded-3xl border border-amber-200/20 bg-amber-400/10 shadow-[0_0_44px_rgba(245,158,11,.12)]" />
                <div className="absolute right-12 top-28 h-64 w-40 rounded-3xl border border-cyan-200/20 bg-cyan-400/10 shadow-[0_0_44px_rgba(34,211,238,.12)]" />
                <div className="absolute inset-x-0 top-10 text-center"><div className="text-5xl font-black">مكتبي الذكي</div><div className="mt-2 text-base text-cyan-100/80">My Twin Desk</div></div>
                <div className="absolute left-20 top-40 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 text-right backdrop-blur"><div className="font-bold">{employeeScope.managerScopeLabel}</div><div className="text-xs text-[#8ba3c7]">نطاق المدير</div></div>
                <div className="absolute right-20 top-40 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 text-right backdrop-blur"><div className="font-bold">{employeeScope.departmentLabel}</div><div className="text-xs text-[#8ba3c7]">مكتب {employeeName}</div></div>
                <div className="absolute left-1/2 top-[45%] h-28 w-80 -translate-x-1/2 rounded-[38px] border border-cyan-200/25 bg-slate-400/10 shadow-[0_0_60px_rgba(34,211,238,.24)]" />
                <div className="absolute left-1/2 top-[35%] grid h-28 w-44 -translate-x-1/2 place-items-center rounded-2xl border border-cyan-300/25 bg-black/55"><div className="text-center"><div className="text-6xl font-black text-cyan-200">B</div><div className="text-[10px] tracking-[.3em] text-cyan-100">BLUMARK24</div></div></div>
                <div className="absolute left-1/2 top-[67%] h-32 w-[76%] -translate-x-1/2 rounded-[50%] border border-cyan-300/35" />
                <div className="absolute left-1/2 top-[72%] h-24 w-[54%] -translate-x-1/2 rounded-[50%] border border-amber-200/25" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-white/12 bg-black/35 px-5 py-2 text-xs font-bold backdrop-blur">استكشاف المكتب الافتراضي</div>
                <div className="absolute bottom-6 right-6 rounded-2xl border border-cyan-200/15 bg-cyan-300/8 px-4 py-3 text-right"><div className="text-[10px] text-[#8ba3c7]">حالة المقعد</div><div className="text-sm font-bold text-cyan-100">{employeeName} · {pressure}</div></div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[['ملفاتي', Folder], ['الموافقات', CheckCircle2], ['التقويم', CalendarDays], ['الدردشة', MessageSquare], ['المهام', LayoutGrid], ['الإعدادات', Settings]].map(([label, Icon]) => { const ToolIcon = Icon as typeof Folder; return <div key={label as string} className="grid min-h-[92px] place-items-center rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-center"><ToolIcon size={26} className="mb-2 text-cyan-100" /><div className="text-xs font-bold">{label as string}</div></div>; })}
              </div>
            </main>

            <aside className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-2 flex items-center justify-between"><div className="text-sm font-bold">مهامي اليوم</div><div className="text-sm font-bold">{loading ? "—" : insight.active.length} مهام</div></div>
              <div className="grid grid-cols-4 gap-2">
                <StatBox label="عاجلة" value={insight.late.length} tone="border-red-400/25 bg-red-500/12 text-red-200" />
                <StatBox label="قيد التنفيذ" value={insight.doing.length} tone="border-blue-400/25 bg-blue-500/12 text-blue-200" />
                <StatBox label="بانتظار اعتماد" value={insight.review.length} tone="border-violet-400/25 bg-violet-500/12 text-violet-200" />
                <StatBox label="مكتملة" value={insight.done.length} tone="border-emerald-400/25 bg-emerald-500/12 text-emerald-200" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 text-xs text-[#8ba3c7]">المهمة القادمة</div>
                <h2 className="text-2xl font-black leading-relaxed">{focus?.title || "لا توجد مهام نشطة"}</h2>
                {focus ? <div className="mt-2 text-xs text-[#8ba3c7]">{STATUS_LABEL[focus.status]} · {focus.priority} · {focus.dueDate} · {orgResolver.taskSourceLabel(focus)}</div> : null}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: focus?.status === "بانتظار_المراجعة" ? "72%" : focus?.status === "قيد_التنفيذ" ? "48%" : "22%" }} /></div>
                <div className="mt-4 grid gap-2">
                  <button disabled={!focus || !!savingAction} onClick={() => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة")} className="btn-primary min-h-12 justify-center gap-2 text-base"><Play size={17} />ابدأ العمل</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={!focus || !!savingAction} onClick={() => toast.info("تم تسجيل طلب المساعدة.")} className="btn-secondary min-h-11 justify-center gap-2"><HelpCircle size={15} />أحتاج مساعدة</button>
                    <button disabled={!focus || !!savingAction} onClick={() => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة")} className="btn-secondary min-h-11 justify-center gap-2"><Send size={15} />للمراجعة</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">{insight.active.slice(0, 3).map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="text-sm font-bold">{task.title}</div><div className="mt-1 text-xs text-[#8ba3c7]">{STATUS_LABEL[task.status]} · {task.dueDate} · {orgResolver.taskSourceLabel(task)}</div></div>)}</div>
            </aside>
          </section>
        </div>
      </main>
    </PageGuard>
  );
}
