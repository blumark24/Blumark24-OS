"use client";

import type React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2,
  CheckCircle2,
  Crown,
  GitBranchPlus,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

const packageCards = [
  {
    name: "بسيط",
    structure: "مجلس الإدارة → قسم → موظفون",
    note: "مناسب لمنشأة صغيرة جدًا مثل 3 موظفين",
    badge: "بداية مثالية",
    tone: "border-cyan-300/40 from-cyan-500/20 to-sky-500/5",
  },
  {
    name: "نمو",
    structure: "مجلس الإدارة → إدارة → قسم → موظفون",
    note: "مناسب للفرق المتوسطة عند توسّع التشغيل",
    badge: "موصى به",
    tone: "border-violet-300/40 from-violet-500/20 to-fuchsia-500/5",
  },
  {
    name: "متقدم",
    structure: "مجلس الإدارة → وكالة → إدارة → قسم → موظفون",
    note: "مناسب للمنشآت الكبيرة ومتعددة الأنشطة",
    badge: "الأكثر مرونة",
    tone: "border-emerald-300/40 from-emerald-500/20 to-teal-500/5",
  },
];

const roleChips = [
  "مدير مجلس الإدارة / صاحب المنشأة",
  "عضو مجلس إدارة",
  "مدير وكالة",
  "مدير إدارة",
  "رئيس قسم",
  "موظف",
];

const addChips = ["+ وكالة", "+ إدارة", "+ قسم", "+ موظف"];

export default function OrgPage() {
  return (
    <DashboardLayout>
      <div dir="rtl" className="space-y-6 pb-8 sm:space-y-8 overflow-x-hidden">
        <section className="glass-card relative overflow-hidden rounded-3xl border border-[#2b4f79]/70 bg-gradient-to-br from-[#0f2442] via-[#0b1b34] to-[#081326] p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.18),transparent_34%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200 sm:text-sm">
                <Sparkles size={14} />
                <span>نموذج تفاعلي — المرحلة الأولى</span>
              </div>
              <h1 className="text-2xl font-heading font-bold leading-snug text-white sm:text-4xl">
                الهيكل الإداري الذكي
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#bed0ec] sm:text-base">
                صمّم هيكل منشأتك بمرونة حسب حجم فريقك وباقتك، من مجلس الإدارة حتى الأقسام والموظفين.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-[#071628]/55 p-4 shadow-[0_24px_80px_-42px_rgba(34,211,238,0.7)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#8ba3c7]">الطبقة العليا</p>
                  <h2 className="mt-1 text-lg font-bold text-white">مجلس الإدارة</h2>
                  <p className="mt-1 text-xs text-cyan-200">مدير مجلس الإدارة / صاحب المنشأة</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
                  <Crown size={22} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-[#bed0ec]">
                <div className="rounded-2xl border border-[#284b72] bg-[#102744]/70 px-3 py-2">أعضاء مجلس الإدارة</div>
                <div className="rounded-2xl border border-[#284b72] bg-[#102744]/70 px-3 py-2">مصدر الصلاحيات</div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-3xl border border-[#26486f] bg-[#0b1b32]/70 p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-white sm:text-xl">اختر الهيكل المناسب حسب حجم منشأتك</h2>
              <p className="mt-1 text-xs text-[#9fb4d8] sm:text-sm">لا نجبر العميل على كل الطبقات؛ الوكالة والإدارة اختيارية.</p>
            </div>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              3 باقات تشغيلية
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {packageCards.map((item) => (
              <article key={item.name} className={`rounded-2xl border bg-gradient-to-br ${item.tone} p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white sm:text-lg">{item.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#deebff]">{item.structure}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#dce9ff]">{item.badge}</span>
                </div>
                <p className="mt-3 text-xs text-[#b0c5e3] sm:text-sm">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl border border-[#26486f] bg-[#0b1b32]/70 p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[#deebff]">
            <div className="flex items-center gap-2">
              <GitBranchPlus size={18} />
              <h2 className="text-lg font-heading font-bold text-white sm:text-xl">المخطط التنظيمي الرقمي</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {addChips.map((chip) => (
                <span key={chip} className="rounded-full border border-[#3a679c] bg-[#12335a]/50 px-3 py-1.5 text-xs text-[#dce9ff] sm:text-sm">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#315f92]/80 bg-[linear-gradient(180deg,#0a1830_0%,#0b1f3d_100%)] p-4 sm:p-6">
            <div className="mx-auto grid max-w-md justify-items-center gap-3">
              <Node label="مجلس الإدارة" note="القيادة العليا ومصدر القرار" icon={Crown} type="core" />
              <Connector />
              <Node label="وكالة (اختياري)" note="تستخدم للمنشآت المتقدمة فقط" icon={Building2} type="optional" />
              <Connector />
              <Node label="إدارة (اختياري)" note="حسب حجم وتشعب العمل" icon={Layers3} type="optional" />
              <Connector />
              <Node label="قسم" note="آخر مستوى إداري" icon={ShieldCheck} type="core" />
              <Connector />
              <Node label="موظفون داخل القسم" note="التنفيذ اليومي داخل القسم" icon={Users} type="final" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <article className="glass-card rounded-3xl border border-[#26486f] bg-[#0b1b32]/70 p-5 backdrop-blur-xl sm:p-6">
            <h2 className="mb-4 text-lg font-heading font-bold text-white sm:text-xl">تجربة التعيين</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {['اختيار المسار التنظيمي', 'اختيار الدور', 'إرسال الموظف لمكانه'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-[#315f92] bg-[#0a1830]/80 p-4">
                  <p className="text-xs text-cyan-200">0{index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {roleChips.map((role) => (
                <span key={role} className="rounded-full border border-[#3a679c] bg-[#12335a]/50 px-3 py-1.5 text-xs text-[#dce9ff] sm:text-sm">
                  {role}
                </span>
              ))}
            </div>
          </article>

          <article className="glass-card rounded-3xl border border-[#26486f] bg-[#0b1b32]/70 p-5 backdrop-blur-xl sm:p-6">
            <h2 className="mb-4 text-lg font-heading font-bold text-white sm:text-xl">قواعد المرونة</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-[#deebff] sm:text-base">
              <Rule text="العميل الصغير لا يحتاج وكالة أو إدارة" />
              <Rule text="الوكالة اختيارية" />
              <Rule text="الإدارة اختيارية" />
              <Rule text="القسم آخر مستوى إداري" />
              <Rule text="الموظفون داخل القسم" />
            </ul>
            <p className="mt-4 border-t border-[#26486f] pt-3 text-xs text-[#9ab1d1] sm:text-sm">
              Read-only UI concept فقط بدون أي تعديل على قاعدة البيانات أو Auth أو Permissions أو hooks أو CRUD.
            </p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Node({
  label,
  note,
  icon: Icon,
  type,
}: {
  label: string;
  note: string;
  icon: React.ElementType;
  type: "core" | "optional" | "final";
}) {
  const styles = {
    core: "border-cyan-300/45 bg-cyan-500/10 text-cyan-100",
    optional: "border-violet-300/45 bg-violet-500/10 text-violet-100",
    final: "border-emerald-300/45 bg-emerald-500/10 text-emerald-100",
  };

  return (
    <div className={`w-full max-w-sm rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${styles[type]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold sm:text-base">{label}</p>
          <p className="mt-1 text-xs opacity-75">{note}</p>
        </div>
        <Icon size={18} className="shrink-0" />
      </div>
    </div>
  );
}

function Connector() {
  return <div className="h-4 w-px bg-gradient-to-b from-[#3b6a9f] to-[#9dc4ef]" />;
}

function Rule({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-cyan-300" />
      <span>{text}</span>
    </li>
  );
}
