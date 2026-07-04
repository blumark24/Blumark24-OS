"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, Bell, Building2, ChevronLeft, GitBranch, Layers, Shield, User, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { PageHero } from "@/components/ui/workspaceUi";
import { WS_CARD, WS_PAGE } from "@/components/ui/workspaceVisual";
import { useTasks } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  جديدة: { label: "جديدة", color: "#22d3ee" },
  قيد_التنفيذ: { label: "قيد التنفيذ", color: "#f59e0b" },
  بانتظار_المراجعة: { label: "بانتظار المراجعة", color: "#a855f7" },
  مكتملة: { label: "مكتملة", color: "#10b981" },
  متأخرة: { label: "متأخرة", color: "#ef4444" },
};

function isOverdue(dueDate: string, status: TaskStatus) {
  return status !== "مكتملة" && new Date(dueDate) < new Date();
}

function NodeCard({ icon: Icon, title, subtitle, accent = "#22d3ee", active = false }: {
  icon: typeof Shield;
  title: string;
  subtitle: string;
  accent?: string;
  active?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.035] p-3", active ? "border-cyan-300/45 shadow-[0_0_24px_rgba(34,211,238,.14)]" : "border-white/[0.08]")}> 
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10" style={{ background: `${accent}22`, color: accent }}>
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{title}</div>
          <div className="truncate text-[11px] text-[#8ba3c7]">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function Connector() {
  return <div className="mx-auto h-5 w-px bg-gradient-to-b from-cyan-300/70 to-cyan-300/10" aria-hidden />;
}

export default function TwinFlowTasksPage() {
  const { data: tasks, loading } = useTasks();

  const insight = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task.dueDate, task.status));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const urgent = active.filter((task) => task.priority === "عاجلة" || task.priority === "عالية");
    const focusTask = late[0] ?? urgent[0] ?? review[0] ?? active[0] ?? tasks[0] ?? null;
    const loads = new Map<string, number>();
    for (const task of active) {
      const key = task.assigneeName || "غير محدد";
      loads.set(key, (loads.get(key) ?? 0) + 1);
    }
    const load = [...loads.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["غير محدد", 0];
    return { active, late, review, urgent, focusTask, load };
  }, [tasks]);

  const focus = insight.focusTask;
  const meta = focus ? STATUS_META[focus.status] : STATUS_META.جديدة;

  return (
    <PageGuard permission="manage_tasks">
      <DashboardLayout>
        <div className={WS_PAGE}>
          <PageHero title="TwinFlow" subtitle="شجرة متابعة ذكية للمهام حسب الهيكل الإداري">
            <Link href="/tasks" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100">
              <ChevronLeft size={15} />
              رجوع للمهام
            </Link>
          </PageHero>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className={cn(WS_CARD, "p-3")}><div className="text-[11px] text-[#8ba3c7]">نشطة</div><div className="mt-1 text-2xl font-bold text-white">{loading ? "—" : insight.active.length}</div></div>
            <div className={cn(WS_CARD, "p-3")}><div className="text-[11px] text-[#8ba3c7]">متأخرة</div><div className="mt-1 text-2xl font-bold text-red-300">{loading ? "—" : insight.late.length}</div></div>
            <div className={cn(WS_CARD, "p-3")}><div className="text-[11px] text-[#8ba3c7]">تحتاج اعتماد</div><div className="mt-1 text-2xl font-bold text-violet-200">{loading ? "—" : insight.review.length}</div></div>
            <div className={cn(WS_CARD, "p-3")}><div className="text-[11px] text-[#8ba3c7]">عاجلة</div><div className="mt-1 text-2xl font-bold text-amber-200">{loading ? "—" : insight.urgent.length}</div></div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
            <div className={cn(WS_CARD, "relative overflow-hidden p-4 sm:p-5")}> 
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(34,211,238,.12),transparent_58%)]" />
              <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white"><GitBranch size={16} className="text-cyan-200" />شجرة التشغيل الرقمية</div>
                  <p className="mt-1 text-xs text-[#8ba3c7]">تعرض المهمة الأهم حسب التأخير أو الأولوية.</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] text-cyan-100">MVP</span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm text-[#8ba3c7]">جارٍ تحميل TwinFlow...</div>
              ) : !focus ? (
                <div className="py-16 text-center text-sm text-[#8ba3c7]">لا توجد مهام لبناء الشجرة.</div>
              ) : (
                <div className="relative z-10 mx-auto max-w-xl">
                  <NodeCard icon={Shield} title="مجلس الإدارة" subtitle="الصورة الكاملة" accent="#a855f7" />
                  <Connector />
                  <NodeCard icon={Building2} title="وكالة التشغيل" subtitle="المسار التنفيذي" accent="#1e6fd9" />
                  <Connector />
                  <NodeCard icon={Layers} title={focus.clientName || "إدارة التشغيل"} subtitle="نطاق المهمة" accent="#22d3ee" active />
                  <Connector />
                  <NodeCard icon={User} title={focus.assigneeName || "الموظف المسؤول"} subtitle="مسؤول التنفيذ" accent="#10b981" />
                  <Connector />
                  <div className="rounded-[22px] border bg-white/[0.045] p-4 backdrop-blur-md" style={{ borderColor: `${meta.color}70` }}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10" style={{ background: `${meta.color}22`, color: meta.color }}><Zap size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold leading-relaxed text-white">{focus.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-semibold text-red-200">{focus.priority}</span>
                          <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: `${meta.color}20`, color: meta.color }}>{meta.label}</span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-[#8ba3c7]">{focus.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className={cn(WS_CARD, "p-4")}>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Bell size={16} className="text-cyan-200" />تنبيهات TwinFlow</div>
                <div className="space-y-2">
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/8 p-3"><div className="flex items-center gap-2 text-sm font-bold text-red-200"><AlertTriangle size={15} />المتأخر</div><p className="mt-1 text-xs text-[#8ba3c7]">{insight.late.length} مهمة تحتاج متابعة.</p></div>
                  <div className="rounded-2xl border border-amber-300/22 bg-amber-400/8 p-3"><div className="text-sm font-bold text-amber-200">ضغط الموظف</div><p className="mt-1 text-xs text-[#8ba3c7]">{insight.load[0]} لديه {insight.load[1]} مهام نشطة.</p></div>
                  <div className="rounded-2xl border border-cyan-300/18 bg-cyan-400/8 p-3"><div className="text-sm font-bold text-cyan-100">المتابعة الذكية</div><p className="mt-1 text-xs text-[#8ba3c7]">الموظف يرى مهامه، والمسؤول يرى المتأخر والاعتماد.</p></div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/8 p-4">
                <div className="text-sm font-bold text-emerald-100">نسخة آمنة بدون تغيير قاعدة البيانات</div>
                <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">المرحلة التالية تربط المهمة فعليًا بالوكالة والإدارة والقسم والمكتب الافتراضي.</p>
              </div>
            </aside>
          </section>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
