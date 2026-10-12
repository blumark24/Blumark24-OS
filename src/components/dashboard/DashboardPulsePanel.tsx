"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WS_INNER_CARD, WS_SURFACE } from "@/components/ui/workspaceVisual";

export type DashboardPulsePanelProps = {
  roleLensLabel: string;
  roleLabel: string;
  scopeLabel: string;
  overdueTasks: number;
  incompleteTasks: number;
  completedTasksPct: number;
  activeClients: number;
  totalClients: number;
  activeEmployees: number;
  totalEmployees: number;
  canManageTasks: boolean;
  canManageClients: boolean;
  canViewEmployees: boolean;
};

type AttentionItem = {
  label: string;
  note: string;
  href?: string;
  tone: "critical" | "attention" | "healthy";
};

const toneClasses: Record<AttentionItem["tone"], string> = {
  critical: "border-rose-400/18 bg-rose-500/[0.055] text-rose-200",
  attention: "border-amber-400/18 bg-amber-500/[0.055] text-amber-100",
  healthy: "border-emerald-400/18 bg-emerald-500/[0.055] text-emerald-100",
};

export default function DashboardPulsePanel({
  roleLensLabel,
  roleLabel,
  scopeLabel,
  overdueTasks,
  incompleteTasks,
  completedTasksPct,
  activeClients,
  totalClients,
  activeEmployees,
  totalEmployees,
  canManageTasks,
  canManageClients,
  canViewEmployees,
}: DashboardPulsePanelProps) {
  const attentionItems: AttentionItem[] = [];

  if (overdueTasks > 0) {
    attentionItems.push({
      label: `${overdueTasks} ${overdueTasks === 1 ? "مهمة متأخرة" : "مهام متأخرة"}`,
      note: "تحتاج مراجعة قبل متابعة الأعمال الجديدة.",
      href: canManageTasks ? "/tasks" : undefined,
      tone: "critical",
    });
  }

  if (incompleteTasks > 0) {
    attentionItems.push({
      label: `${incompleteTasks} ${incompleteTasks === 1 ? "مهمة قيد المتابعة" : "مهام قيد المتابعة"}`,
      note: `نسبة الإنجاز الحالية ${completedTasksPct}%.`,
      href: canManageTasks ? "/tasks" : undefined,
      tone: "attention",
    });
  }

  if (totalClients > 0 && activeClients === 0) {
    attentionItems.push({
      label: "لا يوجد عميل نشط حالياً",
      note: `إجمالي العملاء المسجلين ${totalClients}.`,
      href: canManageClients ? "/clients" : undefined,
      tone: "attention",
    });
  }

  if (totalEmployees > 0 && activeEmployees === 0) {
    attentionItems.push({
      label: "لا يوجد موظف نشط في الملخص الحالي",
      note: `إجمالي الموظفين ${totalEmployees}.`,
      href: canViewEmployees ? "/employees" : undefined,
      tone: "attention",
    });
  }

  if (!attentionItems.length) {
    attentionItems.push({
      label: "لا توجد إشارة تشغيل حرجة",
      note: "المؤشرات الحالية مستقرة وفق البيانات المتاحة.",
      tone: "healthy",
    });
  }

  const pulseLabel =
    overdueTasks > 0 ? "يحتاج تدخل" : incompleteTasks > 0 ? "يحتاج متابعة" : "مستقر";

  const pulseTone =
    overdueTasks > 0
      ? "text-rose-200 border-rose-400/20 bg-rose-500/[0.07]"
      : incompleteTasks > 0
        ? "text-amber-100 border-amber-400/20 bg-amber-500/[0.07]"
        : "text-emerald-100 border-emerald-400/20 bg-emerald-500/[0.07]";

  return (
    <section className={cn(WS_SURFACE, "p-3 sm:p-4")}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(34,211,238,.09),transparent_58%),radial-gradient(80%_120%_at_0%_100%,rgba(124,58,237,.07),transparent_60%)]" />

      <div className="relative z-10 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className={overdueTasks > 0 ? "text-rose-300" : "text-cyan-300"} />
                <h2 className="text-sm font-bold text-white">ما يحتاج انتباهك الآن</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-[#7890b1]">أولوية مختصرة بدل ازدحام الكروت.</p>
            </div>
            <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold", pulseTone)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {pulseLabel}
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {attentionItems.slice(0, 4).map((item) => {
              const body = (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">{item.label}</div>
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-white/48">{item.note}</div>
                  </div>
                  {item.href ? <ArrowLeft size={14} className="shrink-0 text-white/35" /> : null}
                </>
              );

              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex min-h-[58px] items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors hover:bg-white/[0.045]",
                    toneClasses[item.tone],
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className={cn("flex min-h-[58px] items-center gap-2 rounded-xl border px-3 py-2.5", toneClasses[item.tone])}
                >
                  {body}
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn(WS_INNER_CARD, "min-w-0 p-3")}>
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Gauge size={14} className="text-cyan-300" />
                نبض العمل
              </div>
              <div className="mt-1 truncate text-[11px] text-[#7890b1]">{roleLensLabel}</div>
            </div>
            <span className="inline-flex min-h-7 max-w-[48%] items-center gap-1.5 rounded-full border border-cyan-300/14 bg-cyan-400/[0.055] px-2.5 text-[10px] text-cyan-100">
              <ShieldCheck size={11} className="shrink-0" />
              <span className="truncate">{roleLabel}</span>
            </span>
          </div>

          <div className="mb-2 truncate text-[11px] text-white/38">{scopeLabel}</div>

          <div className="grid grid-cols-3 gap-2">
            <PulseMetric icon={CheckCircle2} label="الإنجاز" value={`${completedTasksPct}%`} />
            <PulseMetric icon={Users} label="العملاء" value={`${activeClients}/${totalClients}`} />
            <PulseMetric icon={Clock3} label="المفتوحة" value={String(incompleteTasks)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PulseMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
        <Icon size={11} className="shrink-0 text-cyan-300/80" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate text-sm font-black tabular-nums text-white">{value}</div>
    </div>
  );
}
