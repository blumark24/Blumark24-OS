"use client";

import type React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Building2, Crown, GitBranchPlus, Layers3, ShieldCheck, Sparkles, Users } from "lucide-react";

const packageCards = [
  {
    name: "بسيط",
    structure: "مجلس الإدارة → قسم → موظفون",
    note: "مناسب لمنشأة صغيرة جدًا مثل 3 موظفين",
    tone: "from-cyan-500/20 to-sky-500/10 border-cyan-400/40",
  },
  {
    name: "نمو",
    structure: "مجلس الإدارة → إدارة → قسم → موظفون",
    note: "مناسب للفرق المتوسطة",
    tone: "from-violet-500/20 to-fuchsia-500/10 border-violet-400/40",
  },
  {
    name: "متقدم",
    structure: "مجلس الإدارة → وكالة → إدارة → قسم → موظفون",
    note: "مناسب للمنشآت الكبيرة",
    tone: "from-emerald-500/20 to-teal-500/10 border-emerald-400/40",
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
      <div dir="rtl" className="space-y-6 sm:space-y-8 pb-8">
        <section className="glass-card p-5 sm:p-7 bg-gradient-to-br from-[#0f2442] to-[#09152b] border border-[#1e3a5f]">
          <div className="flex items-center gap-2 text-[#22d3ee] text-xs sm:text-sm font-medium mb-3">
            <Sparkles size={14} />
            <span>نموذج تفاعلي — المرحلة الأولى</span>
          </div>
          <h1 className="text-white text-2xl sm:text-4xl font-heading font-bold leading-snug">الهيكل التنظيمي الذكي</h1>
          <p className="text-[#9fb4d8] mt-3 text-sm sm:text-base leading-relaxed max-w-2xl">
            صمّم هيكل منشأتك بحرية من مجلس الإدارة حتى الأقسام والموظفين
          </p>
        </section>

        <section className="glass-card p-5 sm:p-6 border border-[#1e3a5f]">
          <h2 className="text-white font-heading font-bold text-lg sm:text-xl mb-4">اختر الهيكل المناسب حسب حجم منشأتك</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {packageCards.map((item) => (
              <article
                key={item.name}
                className={`rounded-2xl border bg-gradient-to-br ${item.tone} p-4 sm:p-5 hover:-translate-y-0.5 transition-transform`}
              >
                <h3 className="text-white font-bold text-base sm:text-lg">{item.name}</h3>
                <p className="text-[#d3e0f5] text-sm mt-2 leading-relaxed">{item.structure}</p>
                <p className="text-[#9fb4d8] text-xs sm:text-sm mt-3">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 border border-[#1e3a5f]">
          <div className="flex items-center gap-2 mb-4 text-[#d3e0f5]">
            <GitBranchPlus size={17} />
            <h2 className="text-white font-heading font-bold text-lg sm:text-xl">الشجرة الرقمية المرنة</h2>
          </div>

          <div className="rounded-2xl border border-[#274b78] bg-[#0a1830]/80 p-4 sm:p-6 space-y-5">
            <div className="grid gap-3 justify-items-center">
              <Node label="مجلس الإدارة" icon={Crown} type="core" />
              <Connector />
              <Node label="وكالة (اختياري)" icon={Building2} type="optional" />
              <Connector />
              <Node label="إدارة (اختياري)" icon={Layers3} type="optional" />
              <Connector />
              <Node label="قسم (آخر مستوى إداري)" icon={ShieldCheck} type="core" />
              <Connector />
              <Node label="موظفون داخل القسم" icon={Users} type="final" />
            </div>

            <div className="pt-2 border-t border-[#1e3a5f]">
              <p className="text-[#9fb4d8] text-xs sm:text-sm mb-3">أضف المستويات التي تحتاجها أو تجاوزها حسب حجم المنشأة:</p>
              <div className="flex flex-wrap gap-2">
                {addChips.map((chip) => (
                  <span key={chip} className="px-3 py-1.5 rounded-full text-xs sm:text-sm border border-[#2f5d91] text-[#d3e0f5] bg-[#12335a]/40">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 border border-[#1e3a5f]">
          <h2 className="text-white font-heading font-bold text-lg sm:text-xl mb-4">تجربة التعيين</h2>
          <div className="rounded-2xl border border-[#274b78] bg-[#0a1830]/80 p-4 sm:p-5">
            <p className="text-[#d3e0f5] text-sm sm:text-base leading-relaxed">
              اختيار المسار التنظيمي → اختيار الدور → إرسال الموظف لمكانه
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {roleChips.map((role) => (
                <span key={role} className="px-3 py-1.5 rounded-full text-xs sm:text-sm border border-[#2f5d91] text-[#d3e0f5] bg-[#12335a]/40">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 border border-[#1e3a5f]">
          <h2 className="text-white font-heading font-bold text-lg sm:text-xl mb-4">قواعد المرونة</h2>
          <ul className="space-y-2 text-sm sm:text-base text-[#d3e0f5] leading-relaxed">
            <Rule text="العميل الصغير لا يحتاج وكالة أو إدارة" />
            <Rule text="الوكالة اختيارية" />
            <Rule text="الإدارة اختيارية" />
            <Rule text="القسم آخر مستوى إداري" />
            <Rule text="الموظفون داخل القسم" />
          </ul>
          <p className="text-[#8ba3c7] text-xs sm:text-sm mt-4 border-t border-[#1e3a5f] pt-3">
            UI Concept فقط (Read-only) بدون أي تعديل على قاعدة البيانات أو Auth أو Permissions أو Supabase أو CRUD.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Node({ label, icon: Icon, type }: { label: string; icon: React.ElementType; type: "core" | "optional" | "final" }) {
  const styles = {
    core: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
    optional: "border-violet-400/40 bg-violet-500/10 text-violet-200",
    final: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <div className={`w-full max-w-xs rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${styles[type]}`}>
      <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-center">
        <Icon size={16} />
        <span>{label}</span>
      </div>
    </div>
  );
}

function Connector() {
  return <div className="h-4 w-px bg-gradient-to-b from-[#2f5d91] to-[#76a3d8]" />;
}

function Rule({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-[#22d3ee]" />
      <span>{text}</span>
    </li>
  );
}
