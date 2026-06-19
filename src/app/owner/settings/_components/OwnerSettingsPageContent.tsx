"use client";

import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";

const SETTING_SECTIONS = [
  {
    id: "platform",
    title: "إعدادات المنصة",
    icon: Globe,
    accent: "cyan" as const,
    items: [
      { label: "اسم المنصة",             value: "Blumark24 OS",       editable: false },
      { label: "اللغة الرئيسية",          value: "العربية (ar-SA)",    editable: false },
      { label: "المنطقة الزمنية",         value: "Asia/Riyadh (UTC+3)", editable: false },
      { label: "عملة الفوترة",            value: "SAR — ريال سعودي",  editable: false },
    ],
  },
  {
    id: "notifications",
    title: "الإشعارات",
    icon: Bell,
    accent: "blue" as const,
    items: [
      { label: "إشعارات البريد الإلكتروني", value: "غير مفعّلة", editable: false },
      { label: "تنبيهات تجاوز الحدود",      value: "غير مفعّلة", editable: false },
      { label: "تقارير أسبوعية",            value: "غير مفعّلة", editable: false },
    ],
  },
  {
    id: "security",
    title: "الأمان",
    icon: Shield,
    accent: "purple" as const,
    items: [
      { label: "مصادقة المالك",   value: "Email Gate",            editable: false },
      { label: "انتهاء الجلسة",   value: "Supabase Auth (1 أسبوع)", editable: false },
      { label: "سجل التدقيق",    value: "مفعّل — owner_audit_logs", editable: false },
    ],
  },
  {
    id: "database",
    title: "قاعدة البيانات",
    icon: Database,
    accent: "green" as const,
    items: [
      { label: "مزوّد قاعدة البيانات", value: "Supabase (PostgreSQL 17)", editable: false },
      { label: "حماية RLS",           value: "مفعّلة على جميع الجداول",   editable: false },
      { label: "النسخ الاحتياطي",     value: "Supabase — تلقائي",          editable: false },
    ],
  },
];

export default function OwnerSettingsPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <Settings size={28} className="text-[#22d3ee]" />
          الإعدادات
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          إعدادات مركز القيادة لمالك المنصة — معظم الإعدادات ثابتة في المرحلة الحالية
          ويمكن تفعيل التحرير في مرحلة لاحقة.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="إعدادات المنصة"
          description="اللغة، المنطقة الزمنية، العملة."
          icon={Globe}
          accent="cyan"
          value="ثابتة"
          hint="تتطلب تعديل الكود للتغيير"
        />
        <OwnerPlaceholderCard
          title="الإشعارات"
          description="تنبيهات الفوترة والتجاوزات."
          icon={Bell}
          accent="blue"
          value="غير مفعّلة"
          hint="تتطلب إعداد خدمة البريد"
        />
        <OwnerPlaceholderCard
          title="حالة الأمان"
          description="RLS، سجل التدقيق، انتهاء الجلسة."
          icon={Shield}
          accent="green"
          value="محمي"
          hint="Supabase RLS مفعّل"
        />
        <OwnerPlaceholderCard
          title="المظهر"
          description="ثيم لوحة القيادة وإعدادات العرض."
          icon={Palette}
          accent="purple"
          value="داكن"
          hint="ثيم ثابت — لا يمكن تغييره بعد"
        />
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {SETTING_SECTIONS.map((section) => {
          const a = ACCENT[section.accent];
          const Icon = section.icon;
          return (
            <section key={section.id} className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
                <Icon size={17} className={a.text} />
                <h2 className="font-heading text-[15px] font-bold text-white">{section.title}</h2>
              </div>
              <div className="p-4 sm:p-5 space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-[13px] text-[#8ba3c7]">{item.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[12px] text-white font-medium">{item.value}</span>
                      {!item.editable && (
                        <span className="text-[10px] text-[#5f7798] border border-white/[0.08] px-1.5 py-0.5 rounded">
                          ثابت
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Info banner + disabled save */}
      <section className="glass-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22d3ee]/12 border border-[#22d3ee]/25 flex-shrink-0">
            <Info size={18} className="text-[#22d3ee]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-[15px] font-bold text-white mb-1">تعديل الإعدادات</h3>
            <p className="text-[13px] text-[#8ba3c7] leading-relaxed">
              الإعدادات القابلة للتغيير ستُتاح في لوحة التحكم بعد ربط جدول
              <span className="text-[#22d3ee] font-mono"> system_settings </span>
              مع واجهة التعديل.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              disabled
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/40 cursor-not-allowed"
            >
              <Save size={14} />
              حفظ
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] transition-colors",
                ACCENT.cyan.chip,
                "hover:opacity-80",
              )}
            >
              <ExternalLink size={14} />
              Supabase
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
