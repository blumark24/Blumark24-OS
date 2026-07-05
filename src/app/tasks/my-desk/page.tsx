"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ChevronLeft, Clock, HelpCircle, MonitorDot, Play, Send, Sparkles, UserRound, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { PageHero } from "@/components/ui/workspaceUi";
import { WS_CARD, WS_PAGE } from "@/components/ui/workspaceVisual";
import { useTasks } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  جديدة: "جديدة",
  قيد_التنفيذ: "قيد التنفيذ",
  بانتظار_المراجعة: "بانتظار المراجعة",
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
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function DeskStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
      <div className="text-[11px] text-[#8ba3c7]">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold", tone)}>{value}</div>
    </div>
  );
}

export default function MyTwinDeskPage() {
  const { data: tasks, loading, update } = useTasks();
  const { user } = useAuth();
  const toast = useToast();
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const insight = useMemo(() => {
    const myTasks = tasks.filter((task) => {
      if (!user?.id && !user?.email) return true;
      return task.assigneeId === user?.id || task.assigneeName === user?.email || task.status !== "مكتملة";
    });
    const active = myTasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task.dueDate, task.status));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return diff >= 0 && diff <= 2;
    });
    const focusTask = late[0] ?? active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ?? dueSoon[0] ?? active[0] ?? null;
    return { myTasks, active, late, review, dueSoon, focusTask };
  }, [tasks, user?.email, user?.id]);

  const focus = insight.focusTask;
  const pulse = focus && isOverdue(focus.dueDate, focus.status)
    ? { label: "متأخرة", className: "text-red-200 bg-red-500/10 border-red-400/25" }
    : insight.dueSoon.length > 0
      ? { label: "قريبة من الموعد", className: "text-amber-100 bg-amber-400/10 border-amber-300/25" }
      : { label: "طبيعية", className: "text-cyan-100 bg-cyan-400/10 border-cyan-300/20" };

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
        <div className={WS_PAGE}>
          <PageHero title="مكتبي الذكي" subtitle="تجربة موظف ذكية: المهمة التالية، التنبيهات، والمكتب الرقمي المصغر">
            <Link href="/tasks" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100">
              <ChevronLeft size={15} />
              رجوع للمهام
            </Link>
          </PageHero>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <DeskStat label="مهامي النشطة" value={loading ? "—" : insight.active.length} tone="text-white" />
            <DeskStat label="متأخرة" value={loading ? "—" : insight.late.length} tone="text-red-300" />
            <DeskStat label="بانتظار مراجعة" value={loading ? "—" : insight.review.length} tone="text-violet-200" />
            <DeskStat label="قريبة الموعد" value={loading ? "—" : insight.dueSoon.length} tone="text-amber-200" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
            <div className={cn(WS_CARD, "relative overflow-hidden p-4 sm:p-5")}> 
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(34,211,238,.16),transparent_60%)]" />
              <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white"><MonitorDot size={16} className="text-cyan-200" />مكتب الموظف الرقمي</div>
                  <p className="mt-1 text-xs text-[#8ba3c7]">ابدأ يومك من المهمة الأهم فقط، بدون زحمة.</p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", pulse.className)}>{pulse.label}</span>
              </div>

              {loading ? (
                <div className="relative z-10 py-16 text-center text-sm text-[#8ba3c7]">جارٍ تحميل مكتبك الذكي...</div>
              ) : !focus ? (
                <div className="relative z-10 py-16 text-center text-sm text-[#8ba3c7]">لا توجد مهام نشطة الآن.</div>
              ) : (
                <div className="relative z-10 grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
                  <div className="rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(160deg,rgba(11,28,54,.86),rgba(6,14,30,.92))] p-4 shadow-[0_0_42px_rgba(34,211,238,.08)]">
                    <div className="mx-auto mb-4 grid h-32 w-full max-w-[260px] place-items-center rounded-[24px] border border-cyan-300/18 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,.25),rgba(30,111,217,.08)_40%,rgba(255,255,255,.03)_70%)]">
                      <div className="grid h-20 w-20 place-items-center rounded-3xl border border-cyan-200/25 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,.18)]">
                        <UserRound size={34} className="text-cyan-100" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{user?.email?.split("@")[0] || focus.assigneeName || "الموظف"}</div>
                      <div className="mt-1 text-xs text-[#8ba3c7]">قسم افتراضي · ضغط {insight.active.length >= 5 ? "مرتفع" : insight.active.length >= 3 ? "متوسط" : "منخفض"}</div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Zap size={16} className="text-amber-200" />مهمتك الآن</div>
                    <h2 className="text-xl font-bold leading-relaxed text-white">{focus.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#8ba3c7]">{STATUS_LABEL[focus.status]}</span>
                      <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200">{focus.priority}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#8ba3c7]">{focus.dueDate}</span>
                    </div>
                    {focus.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#8ba3c7]">{focus.description}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button disabled={!!savingAction} onClick={() => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة")} className="btn-primary min-h-11 justify-center gap-2"><Play size={15} />بدأت العمل</button>
                      <button disabled={!!savingAction} onClick={() => toast.info("تم تسجيل طلب المساعدة. سنربطه بالمسؤول في المرحلة التالية.")} className="btn-secondary min-h-11 justify-center gap-2"><HelpCircle size={15} />أحتاج مساعدة</button>
                      <button disabled={!!savingAction} onClick={() => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة")} className="btn-secondary min-h-11 justify-center gap-2"><Send size={15} />للمراجعة</button>
                      <button disabled={!!savingAction} onClick={() => changeStatus("مكتملة", "تم إكمال المهمة")} className="btn-secondary min-h-11 justify-center gap-2"><CheckCircle2 size={15} />تم الإنجاز</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className={cn(WS_CARD, "p-4")}>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Bell size={16} className="text-cyan-200" />تنبيهات مكتبي</div>
                <div className="space-y-2">
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/8 p-3"><div className="flex items-center gap-2 text-sm font-bold text-red-200"><AlertTriangle size={15} />المتأخر</div><p className="mt-1 text-xs text-[#8ba3c7]">{insight.late.length} مهمة تحتاج إجراء.</p></div>
                  <div className="rounded-2xl border border-amber-300/22 bg-amber-400/8 p-3"><div className="flex items-center gap-2 text-sm font-bold text-amber-200"><Clock size={15} />قريبة الموعد</div><p className="mt-1 text-xs text-[#8ba3c7]">{insight.dueSoon.length} مهمة خلال يومين.</p></div>
                  <div className="rounded-2xl border border-cyan-300/18 bg-cyan-400/8 p-3"><div className="flex items-center gap-2 text-sm font-bold text-cyan-100"><Sparkles size={15} />مسار المهمة</div><p className="mt-1 text-xs text-[#8ba3c7]">إدارة التشغيل ← قسم التنفيذ ← الموظف ← المهمة.</p></div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/8 p-4">
                <div className="text-sm font-bold text-emerald-100">MVP آمن</div>
                <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">يقرأ المهام الحالية ويحدث حالتها فقط. الربط بالمكتب الافتراضي والهيكل يتم في PR لاحق.</p>
              </div>
            </aside>
          </section>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
