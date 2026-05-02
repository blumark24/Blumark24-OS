"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Settings, Users, Shield, Building2, Palette, Link2, Bell, Save,
  Check, Zap, ExternalLink, Clock, ToggleLeft, ToggleRight,
  Plus, Pencil, UserX, UserCheck, X, Key,
} from "lucide-react";
import {
  usePermissions,
  ROLE_LABELS,
  PERMISSION_LABELS,
  ALL_ROLES,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  UserRole,
  Permission,
  ManagedUser,
} from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { getSystemSettings, setSystemSetting } from "@/lib/db";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "general",      label: "عام",              icon: Building2 },
  { id: "users",        label: "المستخدمون",        icon: Users     },
  { id: "permissions",  label: "الصلاحيات والأدوار",icon: Shield    },
  { id: "integrations", label: "التكاملات",         icon: Link2     },
  { id: "notifications",label: "الإشعارات",         icon: Bell      },
  { id: "automation",   label: "الأتمتة",           icon: Zap       },
  { id: "appearance",   label: "المظهر",            icon: Palette   },
];

// ─── Automation summary ────────────────────────────────────────────────────────

const AUTOMATION_RULES_SUMMARY = [
  { id: "fund-dist",    label: "توزيع الصندوق التلقائي",    trigger: "يومي",    enabled: true,  lastRun: "اليوم 09:00"    },
  { id: "task-reminder",label: "تذكيرات المهام",           trigger: "يومي",    enabled: true,  lastRun: "اليوم 08:00"    },
  { id: "late-task",    label: "كشف المهام المتأخرة",      trigger: "كل ساعة", enabled: true,  lastRun: "منذ ساعة"       },
  { id: "client-followup",label: "متابعة العملاء",         trigger: "أسبوعي",  enabled: false, lastRun: "منذ 7 أيام"     },
  { id: "kpi-update",   label: "تحديث مؤشرات الأداء",     trigger: "كل ساعة", enabled: true,  lastRun: "منذ 30 دقيقة"   },
  { id: "weekly-report",label: "التقرير الأسبوعي",        trigger: "أسبوعي",  enabled: true,  lastRun: "الإثنين الماضي" },
  { id: "workload",     label: "حساب عبء العمل",           trigger: "يومي",    enabled: false, lastRun: "منذ 3 أيام"     },
];

const DEPARTMENTS = ["الإدارة العليا", "وكالة الدفاع", "وكالة الهجوم", "المالية", "تقنية المعلومات"];

// ─── Add User Modal ────────────────────────────────────────────────────────────

function AddUserModal({ onSave, onClose }: { onSave: (u: Omit<ManagedUser, "userId">) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "employee" as UserRole, department: DEPARTMENTS[0], isActive: true });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { setError("الاسم والبريد الإلكتروني مطلوبان"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <Plus size={16} className="text-[#22d3ee]" />
            إضافة مستخدم جديد
          </h3>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white"><X size={18} /></button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">الاسم الكامل *</label>
            <input className="input-dark text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المستخدم" />
          </div>
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">البريد الإلكتروني *</label>
            <input type="email" className="input-dark text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@blumark24.com" />
          </div>
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">الدور</label>
            <select className="input-dark text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">القسم</label>
            <select className="input-dark text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={handleSave} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
            <Save size={14} />
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────

function PermissionsTab() {
  const { managedUsers, rolePermissions, updateUserRole, toggleUserStatus, addManagedUser, updateRolePermissions, saveAll } = usePermissions();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>("super_admin");
  const [localPerms, setLocalPerms] = useState<Record<UserRole, Permission[]>>({ ...rolePermissions });
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const handleTogglePerm = (perm: Permission) => {
    setLocalPerms((prev) => {
      const curr = prev[selectedRole] ?? [];
      return { ...prev, [selectedRole]: curr.includes(perm) ? curr.filter((p) => p !== perm) : [...curr, perm] };
    });
  };

  const handleResetRole = () => {
    setLocalPerms((prev) => ({ ...prev, [selectedRole]: [...DEFAULT_ROLE_PERMISSIONS[selectedRole]] }));
    toast.info(`تم إعادة ضبط صلاحيات ${ROLE_LABELS[selectedRole]}`);
  };

  const handleSavePerms = () => {
    Object.entries(localPerms).forEach(([role, perms]) => {
      updateRolePermissions(role as UserRole, perms);
    });
    saveAll();
    toast.success("تم حفظ الصلاحيات بنجاح — ستُطبَّق فور تسجيل الدخول التالي");
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateUserRole(userId, role);
    toast.success("تم تحديث الدور بنجاح");
    setEditingUserId(null);
  };

  const handleToggleStatus = (userId: string, name: string, isActive: boolean) => {
    toggleUserStatus(userId);
    toast.success(isActive ? `تم تعطيل ${name}` : `تم تفعيل ${name}`);
  };

  const handleAddUser = (u: Omit<ManagedUser, "userId">) => {
    addManagedUser(u);
    setShowAddUser(false);
    toast.success(`تمت إضافة ${u.name} بنجاح`);
  };

  return (
    <div className="space-y-5">
      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Users size={16} className="text-[#22d3ee]" />
            إدارة المستخدمين والأدوار
          </h3>
          <button onClick={() => setShowAddUser(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
            <Plus size={12} />
            مستخدم جديد
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3a5f]">
                {["المستخدم", "الدور", "القسم", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((u) => (
                <tr key={u.userId} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{u.name}</div>
                    <div className="text-xs text-[#8ba3c7]">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editingUserId === u.userId ? (
                      <select
                        className="input-dark text-xs py-1 px-2"
                        defaultValue={u.role}
                        onChange={(e) => handleRoleChange(u.userId, e.target.value as UserRole)}
                      >
                        {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span className="badge bg-[#22d3ee]/20 text-[#22d3ee] text-xs">{ROLE_LABELS[u.role]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#8ba3c7] text-xs">{u.department}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.isActive ? "status-active" : "status-inactive"}`}>
                      {u.isActive ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUserId(editingUserId === u.userId ? null : u.userId)}
                        className="text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                        title="تعديل الدور"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.userId, u.name, u.isActive)}
                        className={`transition-colors ${u.isActive ? "text-[#8ba3c7] hover:text-red-400" : "text-[#8ba3c7] hover:text-emerald-400"}`}
                        title={u.isActive ? "تعطيل" : "تفعيل"}
                      >
                        {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-[#1e3a5f] flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              <Key size={16} className="text-[#22d3ee]" />
              مصفوفة صلاحيات الأدوار
            </h3>
            <p className="text-[#8ba3c7] text-xs mt-1">اختر دورًا لتعديل صلاحياته، ثم احفظ التغييرات</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetRole} className="btn-secondary py-1.5 px-3 text-xs">إعادة ضبط</button>
            <button onClick={handleSavePerms} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
              <Save size={12} />
              حفظ الصلاحيات
            </button>
          </div>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 flex-wrap p-4 border-b border-[#1e3a5f]">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedRole === role ? "bg-[#22d3ee] text-[#0a1628]" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        {/* Permissions grid */}
        <div className="p-5">
          <div className="text-xs text-[#8ba3c7] mb-4">
            صلاحيات دور: <span className="text-[#22d3ee] font-medium">{ROLE_LABELS[selectedRole]}</span>
            {" "}·{" "}
            <span className="text-white">{(localPerms[selectedRole] ?? []).length}</span> من {ALL_PERMISSIONS.length} صلاحية
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_PERMISSIONS.map((perm) => {
              const enabled = (localPerms[selectedRole] ?? []).includes(perm);
              return (
                <label
                  key={perm}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${enabled ? "border-[#22d3ee]/30 bg-[#22d3ee]/10" : "border-[#1e3a5f] bg-[#0d1f3c]/40 hover:border-[#1e3a5f]/80"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${enabled ? "border-[#22d3ee] bg-[#22d3ee]" : "border-[#1e3a5f]"}`}
                    onClick={() => handleTogglePerm(perm)}
                  >
                    {enabled && <Check size={12} className="text-[#0a1628]" />}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => handleTogglePerm(perm)}>
                    <div className={`text-sm font-medium ${enabled ? "text-white" : "text-[#8ba3c7]"}`}>
                      {PERMISSION_LABELS[perm]}
                    </div>
                    <div className="text-[10px] text-[#4a6a99] font-mono">{perm}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {showAddUser && <AddUserModal onSave={handleAddUser} onClose={() => setShowAddUser(false)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();

  const [activeTab, setActiveTab] = useState("general");
  const [saved,      setSaved]    = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "Blumark24", tagline: "نظام إدارة الأعمال بالذكاء الاصطناعي",
    email: "info@blumark24.com", phone: "0550000000", website: "blumark24.com", city: "جدة",
  });
  const [darkMode, setDarkMode] = useState(true);
  const [notifs,   setNotifs]   = useState({ tasks: true, clients: true, finance: true, weekly: true, email: false });
  const [automationRules, setAutomationRules] = useState(AUTOMATION_RULES_SUMMARY);

  // Load settings from Supabase on mount
  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.company_info) setCompanyForm(s.company_info as typeof companyForm);
      if (s.notifications) setNotifs(s.notifications as typeof notifs);
      if (s.appearance) setDarkMode(Boolean((s.appearance as { darkMode?: boolean }).darkMode ?? true));
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await Promise.all([
        setSystemSetting("company_info", companyForm),
        setSystemSetting("notifications", notifs),
        setSystemSetting("appearance", { darkMode }),
      ]);
      setSaved(true);
      toast.success("تم حفظ الإعدادات بنجاح");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    }
  };

  const toggleRule = (id: string) => {
    setAutomationRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const rule = automationRules.find((r) => r.id === id);
    if (rule) toast.info(rule.enabled ? `تم إيقاف "${rule.label}"` : `تم تفعيل "${rule.label}"`);
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
          {activeTab !== "permissions" && (
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {saved ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
              {saved ? "تم الحفظ!" : "حفظ التغييرات"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="glass-card p-2 h-fit">
            {TABS.filter((t) => t.id !== "permissions" || hasPermission("manage_roles")).map((tab) => (
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

            {/* ── General ── */}
            {activeTab === "general" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">معلومات الشركة</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "اسم الشركة",      key: "name"    },
                    { label: "شعار الشركة",      key: "tagline" },
                    { label: "البريد الإلكتروني",key: "email"   },
                    { label: "رقم الهاتف",       key: "phone"   },
                    { label: "الموقع الإلكتروني",key: "website" },
                    { label: "المدينة",          key: "city"    },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs text-[#8ba3c7] mb-1.5">{label}</label>
                      <input
                        className="input-dark text-sm"
                        value={companyForm[key as keyof typeof companyForm]}
                        onChange={(e) => setCompanyForm({ ...companyForm, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Permissions ── */}
            {activeTab === "permissions" && <PermissionsTab />}

            {/* ── Integrations ── */}
            {activeTab === "integrations" && (
              <div className="space-y-3">
                {[
                  { name: "Google Sheets",      icon: "📊", desc: "مزامنة البيانات مع جداول Google",     connected: false, color: "#10b981" },
                  { name: "WhatsApp Business",  icon: "💬", desc: "إرسال إشعارات وتقارير عبر واتساب",   connected: true,  color: "#25d366" },
                  { name: "Claude AI",          icon: "🤖", desc: "مساعد ذكاء اصطناعي متقدم",           connected: true,  color: "#22d3ee" },
                  { name: "Supabase",           icon: "🗄️", desc: "قاعدة البيانات والمصادقة",          connected: false, color: "#1e6fd9" },
                ].map((int) => (
                  <div key={int.name} className="glass-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${int.color}20` }}>
                        {int.icon}
                      </div>
                      <div>
                        <div className="text-white font-medium">{int.name}</div>
                        <div className="text-xs text-[#8ba3c7]">{int.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge text-xs ${int.connected ? "status-active" : "status-inactive"}`}>
                        {int.connected ? "متصل" : "غير متصل"}
                      </span>
                      <button
                        onClick={() => toast.info(int.connected ? `تم قطع اتصال ${int.name}` : `جارٍ الربط بـ ${int.name}...`)}
                        className={`btn-${int.connected ? "secondary" : "primary"} py-1.5 px-3 text-xs`}
                      >
                        {int.connected ? "قطع الاتصال" : "ربط"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">إعدادات الإشعارات</h3>
                {[
                  { key: "tasks",   label: "إشعارات المهام",             desc: "تنبيه عند إضافة أو تغيير حالة مهمة"   },
                  { key: "clients", label: "إشعارات العملاء",            desc: "تنبيه عند إضافة عميل جديد أو تحديث"  },
                  { key: "finance", label: "إشعارات المالية",            desc: "تنبيه عند إضافة معاملة مالية"         },
                  { key: "weekly",  label: "التقرير الأسبوعي",           desc: "تقرير أسبوعي تلقائي كل صباح إثنين"   },
                  { key: "email",   label: "إشعارات البريد الإلكتروني",  desc: "إرسال الإشعارات عبر البريد الإلكتروني"},
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between p-4 rounded-2xl bg-[#0d1f3c]/60 border border-[#1e3a5f]">
                    <div>
                      <div className="text-white font-medium text-sm">{n.label}</div>
                      <div className="text-xs text-[#8ba3c7] mt-0.5">{n.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key as keyof typeof notifs] })}
                      className={`relative w-12 h-6 rounded-full transition-all ${notifs[n.key as keyof typeof notifs] ? "bg-[#22d3ee]" : "bg-[#1e3a5f]"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifs[n.key as keyof typeof notifs] ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Automation ── */}
            {activeTab === "automation" && (
              <div className="space-y-4">
                <div className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium text-lg">مركز الأتمتة</h3>
                    <p className="text-[#8ba3c7] text-sm mt-1">إدارة قواعد الأتمتة — للتحكم الكامل انتقل للصفحة المخصصة</p>
                  </div>
                  <Link href="/automation" className="btn-primary flex items-center gap-2 text-sm">
                    <ExternalLink size={14} />
                    فتح مركز الأتمتة
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "قواعد مفعّلة",  value: automationRules.filter((r) => r.enabled).length,  color: "#22d3ee" },
                    { label: "قواعد موقوفة",  value: automationRules.filter((r) => !r.enabled).length, color: "#ff7a3d" },
                    { label: "إجمالي القواعد",value: automationRules.length,                            color: "#8ba3c7" },
                  ].map((s) => (
                    <div key={s.label} className="glass-card p-4 text-center">
                      <div className="text-3xl font-bold font-heading mb-1" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs text-[#8ba3c7]">{s.label}</div>
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
                              <Clock size={10} /> {rule.trigger}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#4a6a99] mt-1">آخر تشغيل: {rule.lastRun}</div>
                        </div>
                        <button onClick={() => toggleRule(rule.id)} className="transition-colors">
                          {rule.enabled
                            ? <ToggleRight size={28} className="text-[#22d3ee]" />
                            : <ToggleLeft  size={28} className="text-[#4a6a99]"  />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-white font-medium text-lg mb-4">المظهر والواجهة</h3>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">الوضع</label>
                  <div className="flex gap-3">
                    {[{ label: "داكن", value: true, icon: "🌙" }, { label: "فاتح", value: false, icon: "☀️" }].map((m) => (
                      <button key={String(m.value)} onClick={() => setDarkMode(m.value)}
                        className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${darkMode === m.value ? "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}>
                        <span className="text-2xl">{m.icon}</span>
                        <span className="font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">لون التمييز</label>
                  <div className="flex gap-3">
                    {[["#22d3ee", "فيروزي"], ["#1e6fd9", "أزرق"], ["#ff7a3d", "برتقالي"], ["#a855f7", "بنفسجي"], ["#10b981", "أخضر"]].map(([c, l]) => (
                      <button key={c} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-white transition-all" style={{ background: c }} title={l} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#8ba3c7] mb-3 block">اللغة</label>
                  <div className="flex gap-3">
                    {["العربية", "English"].map((lang) => (
                      <button key={lang} className={`px-4 py-2 rounded-xl text-sm border transition-all ${lang === "العربية" ? "border-[#22d3ee] text-[#22d3ee] bg-[#22d3ee]/10" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Users (legacy tab hidden — users now in permissions) ── */}
            {activeTab === "users" && (
              <div className="glass-card p-6 text-center space-y-3">
                <Users size={32} className="text-[#22d3ee] mx-auto" />
                <h3 className="text-white font-medium">إدارة المستخدمين</h3>
                <p className="text-[#8ba3c7] text-sm">تم دمج إدارة المستخدمين في تبويب الصلاحيات والأدوار</p>
                <button onClick={() => setActiveTab("permissions")} className="btn-primary mx-auto flex items-center gap-2 text-sm">
                  <Shield size={14} />
                  الانتقال إلى الصلاحيات
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
