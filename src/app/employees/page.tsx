"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DEPARTMENTS } from "@/lib/utils";
import { Users, Plus, Search, Star, Edit2, Trash2, X, Eye, EyeOff } from "lucide-react";
import { usePermissions, ROLE_LABELS, UserRole } from "@/contexts/PermissionsContext";
import { useEmployees } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import PageGuard from "@/components/ui/PageGuard";
import { createAuthUser, deleteAuthUser } from "@/lib/db";
import { withSoftTimeout, withTimeout } from "@/lib/asyncHelpers";

const statusBadge = (status: string) =>
  status === "نشط" ? "status-active" : "status-inactive";

const deptColors: Record<string, string> = {
  "الإدارة":        "#22d3ee",
  "الإدارة العليا": "#22d3ee",
  "الهجوم":         "#ef4444",
  "وكالة الهجوم":   "#ef4444",
  "الإبداع":        "#a855f7",
  "التصميم":        "#10b981",
  "الحملات":        "#f59e0b",
  "خدمة العملاء":   "#1e6fd9",
  "المالية":        "#ff7a3d",
  "العمليات":       "#06b6d4",
  "وكالة الدفاع":   "#8b5cf6",
  "تقنية المعلومات":"#8b5cf6",
  "AI Lab":         "#8b5cf6",
};

const SYS_ROLE_LABELS: Record<string, string> = {
  super_admin:     "مدير أعلى",
  board_member:    "عضو مجلس الإدارة",
  defense_manager: "مدير وكالة الدفاع",
  attack_manager:  "مدير وكالة الهجوم",
  finance_manager: "مدير مالي",
  employee:        "موظف",
};

const SYSTEM_ROLES = Object.keys(SYS_ROLE_LABELS) as UserRole[];

type FormState = {
  name:       string;
  email:      string;
  password:   string;
  phone:      string;
  department: string;
  role:       UserRole;
  status:     "نشط" | "غير_نشط";
  salary:     string;
};

function EmployeesContent() {
  const { data: employees, loading, error, update, remove, refetch, setData } = useEmployees();
  const { userRole } = usePermissions();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";

  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("الكل");
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "", phone: "", department: "الإدارة",
    role: "employee", status: "نشط", salary: "",
  });

  // Safety net: if saving is stuck (network issue, unhandled error, etc.)
  // force-reset the spinner after 20 s so the button never hangs forever.
  useEffect(() => {
    if (!saving) return;
    const timer = setTimeout(() => {
      setSaving(false);
      toast.error("انتهت مهلة الحفظ (20 ثانية) — تحقق من اتصالك بالإنترنت وحاول مرة أخرى");
    }, 20_000);
    return () => clearTimeout(timer);
  }, [saving]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (deptFilter === "الكل" || e.department === deptFilter)
      && (e.name.toLowerCase().includes(q) || (e.email ?? "").toLowerCase().includes(q));
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", email: "", password: "", phone: "", department: "الإدارة", role: "employee", status: "نشط", salary: "" });
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (emp: typeof employees[0]) => {
    setEditId(emp.id);
    setForm({
      name:       emp.name,
      email:      emp.email,
      password:   "",
      phone:      emp.phone || "",
      department: emp.department,
      role:       emp.role as UserRole,
      status:     emp.status,
      salary:     String(emp.salary ?? ""),
    });
    setShowPass(false);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); };

  const handleSave = async () => {
    // ── client-side clean + validate ──────────────────────────────────────────
    // eslint-disable-next-line no-control-regex
    const cleanEmail = form.email.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").trim().toLowerCase();

    if (!form.name.trim()) { toast.error("الاسم الكامل مطلوب"); return; }
    if (!cleanEmail) { toast.error("البريد الإلكتروني مطلوب"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("البريد الإلكتروني غير صالح — مثال: user@domain.com");
      return;
    }
    if (!editId) {
      if (!form.password)                       { toast.error("كلمة المرور مطلوبة لإنشاء حساب جديد"); return; }
      if (form.password.length < 8)             { toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
      if (!/[A-Z]/.test(form.password))         { toast.error("كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)"); return; }
      if (!/[a-z]/.test(form.password))         { toast.error("كلمة المرور يجب أن تحتوي على حرف صغير (a-z)"); return; }
      if (!/[0-9]/.test(form.password))         { toast.error("كلمة المرور يجب أن تحتوي على رقم (0-9)"); return; }
      if (!/[^A-Za-z0-9]/.test(form.password)) { toast.error("كلمة المرور يجب أن تحتوي على رمز (!@#$%^&*)"); return; }
    }

    setSaving(true);
    try {
      if (editId) {
        await update(editId, {
          name:       form.name.trim(),
          email:      cleanEmail,
          phone:      form.phone,
          department: form.department,
          role:       form.role as never,
          status:     form.status,
          salary:     form.salary ? Number(form.salary) : undefined,
        });
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        // Hard 15-second client timeout — button NEVER hangs beyond this.
        // (Network AbortController in db.ts fires at 12 s; this is the fallback.)
        const created = await withTimeout(
          createAuthUser({
            email:      cleanEmail,
            password:   form.password,
            name:       form.name.trim(),
            role:       form.role,
            department: form.department,
            phone:      form.phone || null,
            salary:     form.salary ? Number(form.salary) : null,
            status:     form.status,
          }),
          15_000,
          "انتهت مهلة الحفظ (15 ثانية) — تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
        );
        // Optimistically prepend to the list so the new employee appears immediately
        // even if the background refetch times out or is delayed.
        setData((prev) => [{
          id:             created.id,
          name:           form.name.trim(),
          email:          cleanEmail,
          role:           form.role,
          department:     form.department,
          status:         form.status,
          joinDate:       new Date().toISOString().split("T")[0],
          performance:    3,
          phone:          form.phone || undefined,
          salary:         form.salary ? Number(form.salary) : undefined,
          tasks:          0,
          completedTasks: 0,
          avatar:         undefined,
        }, ...prev]);
        // Background sync with the actual DB state (soft timeout — non-blocking)
        await withSoftTimeout(refetch(), 6_000);
        toast.success(`تم إنشاء حساب ${form.name.trim()} بنجاح`);
      }
      closeModal();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
      // Map common Supabase / server errors to clear Arabic messages
      let msg = raw;
      if (/مسجل مسبقاً|already|registered|exists/i.test(raw)) {
        msg = `البريد الإلكتروني (${cleanEmail}) مستخدم مسبقاً — جرّب بريداً آخر أو احذف الحساب القديم من Supabase Auth`;
      } else if (/service_role|SERVICE_ROLE_KEY/i.test(raw)) {
        msg = "خطأ في إعداد الخادم — تحقق من إضافة SUPABASE_SERVICE_ROLE_KEY في Vercel";
      } else if (/invalid email/i.test(raw)) {
        msg = "البريد الإلكتروني غير صالح — تأكد من الكتابة بشكل صحيح";
      }
      toast.error(msg);
      console.error("[Employees handleSave] raw error:", raw);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp: typeof employees[0]) => {
    if (!confirm(`هل أنت متأكد من حذف ${emp.name}؟ سيُحذف حسابه من نظام المصادقة أيضاً.`)) return;
    try {
      // Delete from Supabase Auth via Edge Function (non-blocking for legacy records with no auth account)
      try {
        await deleteAuthUser(emp.id);
      } catch (authErr) {
        const msg = authErr instanceof Error ? authErr.message : "";
        // Legacy employees may not have an auth account — treat as non-fatal
        if (!msg.includes("غير موجود") && !msg.toLowerCase().includes("not found")) {
          throw authErr;
        }
      }
      // Delete employee row (useData remove handles profile cleanup)
      await remove(emp.id);
      toast.success(`تم حذف ${emp.name} بنجاح`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف");
      console.error("[Employee Delete Error]", err);
    }
  };

  const stats = {
    total:  employees.length,
    active: employees.filter((e) => e.status === "نشط").length,
    depts:  new Set(employees.map((e) => e.department)).size,
  };

  const uniqueDepts = Array.from(new Set(employees.map((e) => e.department)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Users size={24} className="text-[#22d3ee]" />
              إدارة الموظفين
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">إدارة بيانات فريق العمل</p>
          </div>
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              إضافة موظف
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الموظفين",  value: stats.total,  color: "#22d3ee" },
            { label: "الموظفون النشطون", value: stats.active, color: "#10b981" },
            { label: "الأقسام",           value: stats.depts,  color: "#ff7a3d" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm text-[#8ba3c7] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
            <input
              className="input-dark pr-9 py-2 text-sm"
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["الكل", ...DEPARTMENTS, ...uniqueDepts.filter((d) => !DEPARTMENTS.includes(d))].map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  deptFilter === d ? "bg-[#22d3ee] text-[#0a1628]" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs whitespace-nowrap"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {loading && <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ التحميل...</div>}

        {!loading && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["الموظف", "القسم", "الدور", "الأداء", "المهام", "تاريخ الانضمام", "الحالة", ""].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${deptColors[emp.department] ?? "#22d3ee"},#0a1628)` }}
                        >
                          {emp.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{emp.name}</div>
                          <div className="text-xs text-[#8ba3c7]">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-xs" style={{ background: `${deptColors[emp.department] ?? "#22d3ee"}20`, color: deptColors[emp.department] ?? "#22d3ee" }}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{SYS_ROLE_LABELS[emp.role] ?? ROLE_LABELS[emp.role as UserRole] ?? emp.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={12} fill={s <= (emp.performance ?? 0) ? "#fbbf24" : "none"} className={s <= (emp.performance ?? 0) ? "text-amber-400" : "text-[#1e3a5f]"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white">{emp.completedTasks ?? 0}</span>
                      <span className="text-[#8ba3c7]">/{emp.tasks ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{emp.joinDate}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusBadge(emp.status)}`}>
                        {emp.status === "نشط" ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(emp)} aria-label="تعديل الموظف" className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(emp)} aria-label="حذف الموظف" className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#8ba3c7]">لا توجد نتائج</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">
                {editId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </h3>
              <button onClick={closeModal} className="text-[#8ba3c7] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الاسم الكامل *</label>
                  <input className="input-dark text-sm" placeholder="الاسم" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">البريد الإلكتروني *</label>
                  <input
                    className="input-dark text-sm"
                    type="email"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                    placeholder="user@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode="email"
                    spellCheck={false}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!!editId}
                  />
                </div>
              </div>

              {!editId && (
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">كلمة المرور *</label>
                  <div className="relative">
                    <input
                      className="input-dark text-sm pl-10"
                      type={showPass ? "text" : "password"}
                      placeholder="مثال: Test@123456"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-white"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6b87ab] mt-1">8 أحرف على الأقل · حرف كبير · حرف صغير · رقم · رمز (!@#$...)</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الراتب (SAR)</label>
                  <input className="input-dark text-sm" type="number" placeholder="0" value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">القسم</label>
                  <select className="input-dark text-sm" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الدور</label>
                  <select className="input-dark text-sm" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                    {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{SYS_ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
                <select className="input-dark text-sm" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "نشط" | "غير_نشط" })}>
                  <option value="نشط">نشط</option>
                  <option value="غير_نشط">غير نشط</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editId ? "حفظ التعديلات" : "إضافة الموظف"}
              </button>
              <button onClick={closeModal} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EmployeesPage() {
  return (
    <PageGuard permission="manage_users">
      <EmployeesContent />
    </PageGuard>
  );
}
