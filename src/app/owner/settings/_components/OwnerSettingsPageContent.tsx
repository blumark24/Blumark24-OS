"use client";

import { Globe, Bell, Shield, Database, Palette, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";

interface SettingItem {
  label: string;
  value: string;
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  accent: string;
  items: SettingItem[];
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    id: "platform",
    title: "إعدادات المنصة",
    icon: Globe,
    accent: "text-[#22d3ee]",
    items: [
      { label: "اسم المنصة",        value: "Blumark24 OS" },
      { label: "اللغة الافتراضية",  value: "العربية (ar-SA)" },
      { label: "المنطقة الزمنية",   value: "Asia/Riyadh (UTC+3)" },
      { label: "عنوان URL الرئيسي", value: "blumark24.com" },
    ],
  },
  {
    id: "notifications",
    title: "الإشعارات",
    icon: Bell,
    accent: "text-[#60a5fa]",
    items: [
      { label: "إشعارات البريد الإلكتروني", value: "مفعّلة" },
      { label: "إشعارات الاشتراكات الجديدة", value: "مفعّلة" },
      { label: "تنبيهات النظام",              value: "مفعّلة" },
      { label: "تقارير أسبوعية",              value: "غير مفعّلة بعد" },
    ],
  },
  {
    id: "security",
    title: "الأمان",
    icon: Shield,
    accent: "text-[#c084fc]",
    items: [
      { label: "المصادقة الثنائية",        value: "Supabase Auth" },
      { label: "مزوّد المصادقة",           value: "Supabase Auth" },
      { label: "حماية CSRF",               value: "مفعّلة" },
      { label: "سياسات RLS",               value: "مفعّلة — Supabase" },
    ],
  },
  {
    id: "database",
    title: "قاعدة البيانات",
    icon: Database,
    accent: "text-[#34d399]",
    items: [
      { label: "مزوّد قاعدة البيانات", value: "Supabase (PostgreSQL)" },
      { label: "المشروع",               value: "Blumark24-osa" },
      { label: "المنطقة",               value: "AWS ap-southeast-1" },
      { label: "النسخ الاحتياطي",       value: "يومي — Supabase Pro" },
    ],
  },
];

export default function OwnerSettingsPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <Globe size={28} className="text-[#22d3ee]" />
            الإعدادات
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            إعدادات المنصة العامة والتكاملات الخارجية — معظم القيم مضبوطة في Supabase أو متغيرات البيئة.
          </p>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.07] transition-colors flex-shrink-0"
        >
          <ExternalLink size={14} />
          لوحة Supabase
        </a>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="المنصة"
          description="إعدادات عامة لاسم المنصة واللغة والمنطقة الزمنية."
          icon={Globe}
          accent="cyan"
          value="ثابت"
          hint="يتطلب تعديل الكود"
        />
        <OwnerPlaceholderCard
          title="الإشعارات"
          description="إشعارات البريد الإلكتروني وتنبيهات النظام."
          icon={Bell}
          accent="blue"
          value="جزئي"
          hint="بريد مفعّل — تقارير قريباً"
        />
        <OwnerPlaceholderCard
          title="الأمان"
          description="مزوّد المصادقة وسياسات RLS وحماية CSRF."
          icon={Shield}
          accent="purple"
          value="مفعّل"
          hint="Supabase Auth + RLS"
        />
        <OwnerPlaceholderCard
          title="المظهر"
          description="ألوان المنصة والشعار والتخصيص البصري."
          icon={Palette}
          accent="orange"
          value="ثابت"
          hint="يتطلب إعداداً في الكود"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {SETTING_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
                <Icon size={17} className={section.accent} />
                <h2 className="font-heading text-[15px] font-bold text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5">
                    <span className="text-[13px] text-[#8ba3c7]">{item.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[13px] text-white font-medium text-left">{item.value}</span>
                      <span className="text-[10px] border border-white/[0.10] bg-white/[0.04] text-white/40 rounded-md px-1.5 py-0.5">
                        ثابت
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06]">
                <button
                  disabled
                  className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
                  title="التعديل يتطلب تغييرات في الكود المصدري"
                >
                  حفظ
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
