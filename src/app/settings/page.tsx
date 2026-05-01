"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, Users, Shield, Building2, Palette, Link2, Bell, Save, Check, Zap, ExternalLink, Play, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

const TABS = [
  { id: "general", label: "عام", icon: Building2 },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "permissions", label: "الصلاحيات", icon: Shield },
  { id: "integrations", label: "التكاملات", icon: Link2 },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "automation", label: "الأتمتة", icon: Zap },
  { id: "appearance", label: "المظهر", icon: Palette },
];

const AUTOMATION_RULES_SUMMARY = [
  { id: "fund-dist", label: "توزيع الصندوق التلقائي", desc: "توزيع الإيرادات على 5 صناديق وفق نسب محددة", enabled: true, lastRun: "اليوم 09:00", nextRun: "غداً 09:00", trigger: "يومي" },
  { id: "task-reminder", label: "تذكيرات المهام", desc: "إرسال تذكير قبل 24 ساعة من موعد تسليم المهمة", enabled: true, lastRun: "اليوم 08:00", nextRun: "غداً 08:00", trigger: "يومي" },
  { id: "late-task", label: "كشف المهام المتأخرة", desc: "رصد المهام المتأخرة وإرسال إنذار للمسؤولين", enabled: true, lastRun: "منذ ساعة", nextRun: "بعد ساعة", trigger: "كل ساعة" },
  { id: "client-followup", label: "متابعة العملاء", desc: "إنشاء مهمة متابعة تلقائية للعملاء الخاملين", enabled: false, lastRun: "منذ 7 أيام", nextRun: "غير مفعّل", trigger: "أسبوعي" },
  { id: "kpi-update", label: "تحديث مؤشرات الأداء", desc: "إعادة حساب مؤشرات الأداء الرئيسية تلقائياً", enabled: true, lastRun: "منذ 30 دقيقة", nextRun: "بعد 30 دقيقة", trigger: "كل ساعة" },
  { id: "weekly-report", label: "التقرير الأسبوعي", desc: "توليد تقرير أسبوعي شامل للإدارة العليا", enabled: true, lastRun: "الإثنين الماضي", nextRun: "الإثنين القادم", trigger: "أسبوعي" },
  { id: "workload", label: "حساب عبء العمل", desc: "تحليل توزيع المهام على الفريق ورفع تقرير", enabled: false, lastRun: "منذ 3 أيام", nextRun: "غير مفعّل", trigger: "يومي" },
];

const ROLES = ["مدير_عام", "مدير_مالي", "مدير_مبيعات", "مدير", "موظف"];
const ROLE_LABELS: Record<string, string> = {
  "مدير_عام": "مدير عام",
  "مدير_مالي": "مدير مالي",
  "مدير_مبيعات": "مدير مبيعات",
  "مدير": "مدير",
  "موظف": "موظف",
};

const MODULES = ["الموظفين", "المهام", "العملاء", "المالية", "الاستراتيجية", "المساعد الذكي", "التقارير"];

const PERMISSIONS: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {
  "مدير_عام": Object.fromEntries(MODULES.map((m) => [m, { read: true, write: true, delete: true }])),
  "مدير_مالي": Object.fromEntries(MODULES.map((m) => [m, { read: true, write: m === "المالية" || m === "التقارير", delete: false }])),
  "مدير_مبيعات": Object.fromEntries(MODULES.map((m) => [m, { read: true, write: ["المهام", "العملاء"].includes(m), delete: false }])),
  "مدير": Object.fromEntries(MODULES.map((m) => [m, { read: true, write: ["المهام", "التقارير"].includes(m), delete: false }])),
  "موظف": Object.fromEntries(MODULES.map((m) => [m, { read: ["المهام"].includes(m), write: ["المهام"].includes(m), delete: false }])),
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "Blumark24", tagline: "نظام إدارة الأعمال بالذكاء الاصطناعي", email: "info@blumark24.com", phone: "0550000000", website: "blumark24.com", city: "جدة" });
  const [selectedRole, setSelectedRole] = useState("مدير_عام");
  const [darkMode, setDarkMode] = useState(true);
  const [notifs, setNotifs] = useState({ tasks: true, clients: true, finance: true, weekly: true, email: false });
  const [automationRules, setAutomationRules] = useState(AUTOMATION_RULES_SUMMARY);

  const toggleRule = (id: string) => {
    setAutomationRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Settings size={24} className="text-[#22d3ee]" />
              الإعدادات
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">إدارة إعدادات النظام والتفضيلات</p>
          </div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            {saved ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
            {saved ? "تم الحفظ!" : "حفظ التغييرات"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="glass-card p-2 h-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 last:mb-0 ${activeTab === tab.id ? "sidebar-active" : "text-[#8ba3c7] hover:text-white hover:bg-[#1a3356]/50"}`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "text-[#22d3ee]" : ""} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* General */}
            {activeTab === "general" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">معلومات الشركة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">اسم الشركة</label>
                    <input className="input-dark text-sm" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">شعار الشركة</label>
                    <input className="input-dark text-sm" value={companyForm.tagline} onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
                    <input className="input-dark text-sm" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الهاتف</label>
                    <input className="input-dark text-sm" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">الموقع الإلكتروني</label>
                    <input className="input-dark text-sm" value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8ba3c7] mb-1.5">المدينة</label>
                    <input className="input-dark text-sm" value={companyForm.city} onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Matrix */}
            {activeTab === "permissions" && (
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-[#1e3a5f]">
                  <h3 className="text-white font-medium mb-3">مصفوفة الصلاحيات</h3>
                  <div className="flex gap-2 flex-wrap">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedRole === role ? "bg-[#22d3ee] text-[#0a1628]" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      <th className="text-right text-[#8ba3c7] font-medium px-4 py-3">الوحدة</th>
                      <th className="text-center text-[#8ba3c7] font-medium px-4 py-3">قراءة</th>
                      <th className="text-center text-[#8ba3c7] font-medium px-4 py-3">كتابة</th>
                      <th className="text-center text-[#8ba3c7] font-medium px-4 py-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module) => {
                      const perms = PERMISSIONS[selectedRole][module];
                      return (
                        <tr key={module} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                          <td className="px-4 py-3 text-white font-medium">{module}</td>
                          {["read", "write", "delete"].map((perm) => (
                            <td key={perm} className="px-4 py-3 text-center">
                              <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${perms[perm as keyof typeof perms] ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/10 text-red-500/50"}`}>
                                {perms[perm as keyof typeof perms] ? "✓" : "✗"}
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div className="space-y-3">
                {[
                  { name: "Google Sheets", icon: "📊", desc: "مزامنة البيانات مع جداول Google", connected: false, color: "#10b981" },
                  { name: "WhatsApp Business", icon: "💬", desc: "إرسال إشعارات وتقارير عبر واتساب", connected: true, color: "#25d366" },
                  { name: "Claude AI", icon: "🤖", desc: "مساعد ذكاء اصطناعي متقدم", connected: true, color: "#22d3ee" },
                  { name: "Supabase", icon: "🗄️", desc: "قاعدة البيانات والمصادقة", connected: false, color: "#1e6fd9" },
                ].map((integration) => (
                  <div key={integration.name} className="glass-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${integration.color}20` }}>
                        {integration.icon}
                      </div>
                      <div>
                        <div className="text-white font-medium">{integration.name}</div>
                        <div className="text-xs text-[#8ba3c7]">{integration.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge text-xs ${integration.connected ? "status-active" : "status-inactive"}`}>
                        {integration.connected ? "متصل" : "غير متصل"}
                      </span>
                      <button className={`btn-${integration.connected ? "secondary" : "primary"} py-1.5 px-3 text-xs`}>
                        {integration.connected ? "قطع الاتصال" : "ربط"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">إعدادات الإشعارات</h3>
                {[
                  { key: "tasks", label: "إشعارات المهام", desc: "تنبيه عند إضافة أو تغيير حالة مهمة" },
                  { key: "clients", label: "إشعارات العملاء", desc: "تنبيه عند إضافة عميل جديد أو تحديث" },
                  { key: "finance", label: "إشعارات المالية", desc: "تنبيه عند إضافة معاملة مالية" },
                  { key: "weekly", label: "التقرير الأسبوعي", desc: "تقرير أسبوعي تلقائي كل صباح إثنين" },
                  { key: "email", label: "إشعارات البريد الإلكتروني", desc: "إرسال الإشعارات عبر البريد الإلكتروني" },
                ].map((notif) => (
                  <div key={notif.key} className="flex items-center justify-between p-4 rounded-2xl bg-[#0d1f3c]/60 border border-[#1e3a5f]">
                    <div>
                      <div className="text-white font-medium text-sm">{notif.label}</div>
                      <div className="text-xs text-[#8ba3c7] mt-0.5">{notif.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifs({ ...notifs, [notif.key]: !notifs[notif.key as keyof typeof notifs] })}
                      className={`relative w-12 h-6 rounded-full transition-all ${notifs[notif.key as keyof typeof notifs] ? "bg-[#22d3ee]" : "bg-[#1e3a5f]"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifs[notif.key as keyof typeof notifs] ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">المظهر والواجهة</h3>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">الوضع</label>
                  <div className="flex gap-3">
                    {[
                      { label: "داكن", value: true, icon: "🌙" },
                      { label: "فاتح", value: false, icon: "☀️" },
                    ].map((mode) => (
                      <button
                        key={String(mode.value)}
                        onClick={() => setDarkMode(mode.value)}
                        className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${darkMode === mode.value ? "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}
                      >
                        <span className="text-2xl">{mode.icon}</span>
                        <span className="font-medium">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">لون التمييز</label>
                  <div className="flex gap-3">
                    {[
                      { color: "#22d3ee", label: "فيروزي" },
                      { color: "#1e6fd9", label: "أزرق" },
                      { color: "#ff7a3d", label: "برتقالي" },
                      { color: "#a855f7", label: "بنفسجي" },
                      { color: "#10b981", label: "أخضر" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        className="w-10 h-10 rounded-full border-2 border-transparent hover:border-white transition-all"
                        style={{ background: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">اللغة</label>
                  <div className="flex gap-3">
                    {["العربية", "English"].map((lang) => (
                      <button
                        key={lang}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all ${lang === "العربية" ? "border-[#22d3ee] text-[#22d3ee] bg-[#22d3ee]/10" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Automation */}
            {activeTab === "automation" && (
              <div className="space-y-4">
                <div className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium text-lg">مركز الأتمتة</h3>
                    <p className="text-[#8ba3c7] text-sm mt-1">إدارة قواعد الأتمتة والمهام المجدولة — للتحكم الكامل انتقل إلى الصفحة المخصصة</p>
                  </div>
                  <Link href="/automation" className="btn-primary flex items-center gap-2 text-sm">
                    <ExternalLink size={14} />
                    فتح مركز الأتمتة
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "قواعد مفعّلة", value: automationRules.filter((r) => r.enabled).length, color: "#22d3ee" },
                    { label: "قواعد موقوفة", value: automationRules.filter((r) => !r.enabled).length, color: "#ff7a3d" },
                    { label: "إجمالي القواعد", value: automationRules.length, color: "#8ba3c7" },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card p-4 text-center">
                      <div className="text-3xl font-bold font-heading mb-1" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-[#8ba3c7]">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1e3a5f] flex items-center gap-2">
                    <Zap size={16} className="text-[#22d3ee]" />
                    <h3 className="text-white font-medium">قواعد الأتمتة</h3>
                  </div>
                  <div className="divide-y divide-[#1e3a5f]/40">
                    {automationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#1a3356]/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{rule.label}</span>
                            <span className="badge bg-[#1e3a5f] text-[#8ba3c7] text-xs flex items-center gap-1">
                              <Clock size={10} />
                              {rule.trigger}
                            </span>
                          </div>
                          <div className="text-xs text-[#8ba3c7] mt-0.5 truncate">{rule.desc}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-[#4a6a99]">آخر تشغيل: {rule.lastRun}</span>
                            {rule.enabled && (
                              <span className="text-[10px] text-emerald-400/70">التالي: {rule.nextRun}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mr-4">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className="transition-colors"
                            title={rule.enabled ? "إيقاف" : "تفعيل"}
                          >
                            {rule.enabled
                              ? <ToggleRight size={28} className="text-[#22d3ee]" />
                              : <ToggleLeft size={28} className="text-[#4a6a99]" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Play size={15} className="text-[#22d3ee]" />
                    <h3 className="text-white font-medium">إجراءات سريعة</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/automation" className="p-4 rounded-2xl bg-[#0d1f3c]/60 border border-[#1e3a5f] hover:border-[#22d3ee]/30 transition-all text-center group">
                      <Zap size={20} className="text-[#22d3ee] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm text-white font-medium">تشغيل الكل</div>
                      <div className="text-xs text-[#8ba3c7] mt-0.5">تنفيذ جميع القواعد المفعّلة</div>
                    </Link>
                    <Link href="/automation" className="p-4 rounded-2xl bg-[#0d1f3c]/60 border border-[#1e3a5f] hover:border-[#22d3ee]/30 transition-all text-center group">
                      <Clock size={20} className="text-[#22d3ee] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm text-white font-medium">سجل التنفيذ</div>
                      <div className="text-xs text-[#8ba3c7] mt-0.5">عرض آخر عمليات الأتمتة</div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management */}
            {activeTab === "users" && (
              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
                  <h3 className="text-white font-medium">إدارة المستخدمين</h3>
                  <button className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                    + إضافة مستخدم
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      {["المستخدم", "الدور", "آخر دخول", "الحالة", ""].map((h) => (
                        <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "أحمد محمد", email: "admin@blumark24.com", role: "مدير_عام", lastLogin: "اليوم", status: "نشط" },
                      { name: "فاطمة خالد", email: "finance@blumark24.com", role: "مدير_مالي", lastLogin: "أمس", status: "نشط" },
                      { name: "سارة أحمد", email: "sales@blumark24.com", role: "مدير_مبيعات", lastLogin: "منذ 3 أيام", status: "نشط" },
                    ].map((user, i) => (
                      <tr key={i} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-xs text-[#8ba3c7]">{user.email}</div>
                        </td>
                        <td className="px-4 py-3"><span className="badge bg-[#22d3ee]/20 text-[#22d3ee] text-xs">{ROLE_LABELS[user.role]}</span></td>
                        <td className="px-4 py-3 text-[#8ba3c7] text-xs">{user.lastLogin}</td>
                        <td className="px-4 py-3"><span className="badge status-active">نشط</span></td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-[#8ba3c7] hover:text-[#22d3ee] transition-colors">تعديل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
