"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronLeft, Clock3, Folder, HelpCircle, LayoutGrid, Menu, MessageSquare, Play, Radar, Send, Settings } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { useTasks } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { TaskStatus } from "@/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  جديدة: "جديدة",
  قيد_التنفيذ: "قيد التنفيذ",
  بانتظار_المراجعة: "بانتظار اعتماد",
  مكتملة: "مكتملة",
  متأخرة: "متأخرة",
};

function isOverdue(dueDate: string, status: TaskStatus) {
  return status !== "مكتملة" && new Date(dueDate) < new Date();
}

function daysUntil(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
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
  const { user } = useAuth();
  const toast = useToast();
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const insight = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task.dueDate, task.status));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const done = tasks.filter((task) => task.status === "مكتملة");
    const doing = active.filter((task) => task.status === "قيد_التنفيذ");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return diff >= 0 && diff <= 2;
    });
    const focusTask = late[0] ?? active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ?? dueSoon[0] ?? active[0] ?? null;
    return { active, late, review, done, doing, dueSoon, focusTask };
  }, [tasks]);

  const focus = insight.focusTask;
  const employeeName = user?.email?.split("@")[0] || focus?.assigneeName || "الموظف";
  const pressure = insight.active.length >= 6 ? "ضغط مرتفع" : insight.active.length >= 3 ? "ضغط متوسط" : "طبيعي";

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
    <PageGuard permission="manage_tasks">
      <DashboardLayout>
        <div className="rounded-[28px] border border-white/10 bg-[#050b16] p-3 text-white shadow-2xl">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[285px_minmax(0,1fr)_410px]">
            <aside className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black">Blumark24 OS</div>
                    <div className="text-xs text-[#8ba3c7]">Digital Twin Intelligence</div>
                  </div>
                  <Menu size={22} />
                </div>
                <Link href="/tasks" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-sm font-bold text-cyan-100">
                  <ChevronLeft size={15} /> رجوع للمهام
                </Link>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3 text-center text-sm font-bold">رادار التنبيهات الذكي</div>
                <div className="mx-auto mb-5 grid h-32 w-32 place-items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,.22)]">
                  <Radar size={58} className="text-cyan-100" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3"><div className="flex items-center gap-2 text-sm font-bold text-red-200"><AlertTriangle size={15} /> مهمة متأخرة</div><div className="mt-1 text-xs text-[#8ba3c7]">{insight.late.length} تحتاج إجراء</div></div>
                  <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3"><div className="flex items-center gap-2 text-sm font-bold text-amber-200"><Clock3 size={15} /> قريبة من الموعد</div><div className="mt-1 text-xs text-[#8ba3c7]">{insight.dueSoon.length} خلال يومين</div></div>
                  <div className="rounded-2xl border border-violet-300/25 bg-violet-500/10 p-3"><div className="flex items-center gap-2 text-sm font-bold text-violet-200"><HelpCircle size={15} /> طلبات مساعدة</div><div className="mt-1 text-xs text-[#8ba3c7]">جاهزة للربط بالمسؤول</div></div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-center">
                <div className="text-sm font-bold">مؤشر ضغط العمل</div>
                <div className="mx-auto my-3 grid h-24 w-24 place-items-center rounded-full border-[10px] border-amber-400/70 bg-amber-400/10 text-2xl font-black">{Math.min(99, insight.active.length * 13)}%</div>
                <div className="text-xs text-[#8ba3c7]">لديك {insight.active.length} مهام نشطة</div>
              </div>
            </aside>

            <main className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-center">
                <div className="text-2xl font-black">مرحباً {employeeName}</div>
                <div className="text-xs text-[#8ba3c7]">قسم التصميم · إدارة الطباعة والنشر</div>
              </div>

              <div className="relative min-h-[430px] overflow-hidden rounded-[30px] border border-cyan-200/20 bg-[#07101e] shadow-[0_24px_90px_rgba(0,0,0,.48)]">
                <div className="absolute left-10 top-24 h-56 w-36 rounded-3xl border border-amber-200/20 bg-amber-400/10" />
                <div className="absolute right-10 top-24 h-56 w-36 rounded-3xl border border-cyan-200/20 bg-cyan-400/10" />
                <div className="absolute inset-x-0 top-10 text-center"><div className="text-4xl font-black">مكتبي الذكي</div><div className="mt-1 text-sm text-cyan-100/80">My Twin Desk</div></div>
                <div className="absolute left-16 top-32 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right backdrop-blur"><div className="font-bold">إدارة الطباعة والنشر</div><div className="text-xs text-[#8ba3c7]">الطابق 2</div></div>
                <div className="absolute right-16 top-32 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right backdrop-blur"><div className="font-bold">قسم التصميم</div><div className="text-xs text-[#8ba3c7]">مكتب {employeeName}</div></div>
                <div className="absolute left-1/2 top-[45%] h-24 w-72 -translate-x-1/2 rounded-[34px] border border-cyan-200/25 bg-slate-400/10 shadow-[0_0_55px_rgba(34,211,238,.22)]" />
                <div className="absolute left-1/2 top-[36%] grid h-24 w-36 -translate-x-1/2 place-items-center rounded-2xl border border-cyan-300/25 bg-black/50"><div className="text-center"><div className="text-5xl font-black text-cyan-200">B</div><div className="text-[10px] tracking-[.25em] text-cyan-100">BLUMARK24</div></div></div>
                <div className="absolute left-1/2 top-[67%] h-28 w-[70%] -translate-x-1/2 rounded-[50%] border border-cyan-300/35" />
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-2xl border border-white/12 bg-black/35 px-4 py-2 text-xs font-bold backdrop-blur">استكشاف المكتب الافتراضي</div>
                <div className="absolute bottom-5 right-5 rounded-2xl border border-cyan-200/15 bg-cyan-300/8 px-3 py-2 text-right"><div className="text-[10px] text-[#8ba3c7]">حالة المقعد</div><div className="text-sm font-bold text-cyan-100">{employeeName} · {pressure}</div></div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[['ملفاتي', Folder], ['الموافقات', CheckCircle2], ['التقويم', CalendarDays], ['الدردشة', MessageSquare], ['المهام', LayoutGrid], ['الإعدادات', Settings]].map(([label, Icon]) => {
                  const ToolIcon = Icon as typeof Folder;
                  return <div key={label as string} className="grid min-h-[86px] place-items-center rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-center"><ToolIcon size={26} className="mb-2 text-cyan-100" /><div className="text-xs font-bold">{label as string}</div></div>;
                })}
              </div>
            </main>

            <aside className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-2 flex items-center justify-between"><div className="text-sm font-bold">مهامي اليوم</div><div className="text-sm font-bold">{loading ? "—" : insight.active.length} مهام</div></div>
              <div className="grid grid-cols-4 gap-2">
                <StatBox label="عاجلة" value={insight.late.length || 1} tone="border-red-400/25 bg-red-500/12 text-red-200" />
                <StatBox label="قيد التنفيذ" value={insight.doing.length} tone="border-blue-400/25 bg-blue-500/12 text-blue-200" />
                <StatBox label="بانتظار اعتماد" value={insight.review.length} tone="border-violet-400/25 bg-violet-500/12 text-violet-200" />
                <StatBox label="مكتملة" value={insight.done.length} tone="border-emerald-400/25 bg-emerald-500/12 text-emerald-200" />
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 text-xs text-[#8ba3c7]">المهمة القادمة</div>
                <h2 className="text-2xl font-black leading-relaxed">{focus?.title || "لا توجد مهام نشطة"}</h2>
                {focus ? <div className="mt-2 text-xs text-[#8ba3c7]">{STATUS_LABEL[focus.status]} · {focus.priority} · {focus.dueDate}</div> : null}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: focus?.status === "بانتظار_المراجعة" ? "72%" : focus?.status === "قيد_التنفيذ" ? "48%" : "22%" }} /></div>
                <div className="mt-4 grid gap-2">
                  <button disabled={!focus || !!savingAction} onClick={() => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة")} className="btn-primary min-h-12 justify-center gap-2 text-base"><Play size={17} />ابدأ العمل</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={!focus || !!savingAction} onClick={() => toast.info("تم تسجيل طلب المساعدة.")} className="btn-secondary min-h-11 justify-center gap-2"><HelpCircle size={15} />أحتاج مساعدة</button>
                    <button disabled={!focus || !!savingAction} onClick={() => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة")} className="btn-secondary min-h-11 justify-center gap-2"><Send size={15} />للمراجعة</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {insight.active.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-sm font-bold">{task.title}</div>
                    <div className="mt-1 text-xs text-[#8ba3c7]">{STATUS_LABEL[task.status]} · {task.dueDate}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
