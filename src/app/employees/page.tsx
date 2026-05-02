"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DEPARTMENTS } from "@/lib/utils";
import { Users, Plus, Search, Star, Edit2, Trash2, X } from "lucide-react";
import type { UserRole } from "@/types";
import { usePermissions, ROLE_LABELS } from "@/contexts/PermissionsContext";
import AccessDenied from "@/components/ui/AccessDenied";
import { useEmployees } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";

const statusBadge = (status: string) =>
  status === "نشط" ? "status-active" : "status-inactive";

const deptColors: Record<string, string> = {
  "الإدارة":      "#22d3ee",
  "الهجوم":       "#ef4444",
  "الإبداع":      "#a855f7",
  "التصميم":      "#10b981",
  "الحملات":      "#f59e0b",
  "خدمة العملاء": "#1e6fd9",
  "المالي":       "#ff7a3d",
  "العمليات":     "#06b6d4",
  "AI Lab":       "#8b5cf6",
};

const EMP_ROLE_LABELS: Record<string, string> = {
  "مدير_عام":     "مدير عام",
  "مدير_مالي":   "مدير مالي",
  "مدير_مبيعات": "مدير مبيعات",
  "مدير":         "مدير",
  "موظف":         "موظف",
  ...Object.fromEntries(
    Object.entries(ROLE_LABELS).map(([k, v]) => [k, v])
  ),
};

function EmployeesContent() {
  const { data: employees, loading, insert, update, remove } = useEmployees();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("الكل");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "الإدارة",
    role: "موظف" as UserRole,
    status: "نشط" as "نشط" | "غير_نشط",
  });

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.includes(search) || e.email.includes(search);
    const matchDept = deptFilter === "الكل" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", email: "", phone: "", department: "الإدارة", role: "موظف", status: "نشط" });
    setShowModal(true);
  };

  const openEdit = (emp: typeof employees[0]) => {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      department: emp.department,
      role: emp.role as UserRole,
      status: emp.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    try {
      if (editId) {
        await update(editId, form);
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        await insert({
          joinDate: new Date().toISOString().split("T")[0],
          performance: 3,
          tasks: 0,
          completedTasks: 0,
          avatar: "",
          ...form,
        });
        toast.success("تمت إضافة الموظف بنجاح");
      }
      setShowModal(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ الموظف");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
    try {
      await remove(id);
      toast.success("تم حذف الموظف بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حذف الموظف");
    }
  };

  const stats = {
    total:  employees.length,
    active: employees.filter((e) => e.status === "نشط").length,
    depts:  new Set(employees.map((e) => e.department)).size,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Users size={24} className="text-[#22d3ee]" />
              إدارة الموظفين
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">إدارة وتتبع فريق العمل</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            إضافة موظف
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الموظفين",    value: stats.total,  color: "#22d3ee" },
            { label: "الموظفون النشطون",   value: stats.active, color: "#10b981" },
            { label: "الأقسام",             value: stats.depts,  color: "#ff7a3d" },
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
            {["الكل", ...DEPARTMENTS].map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  deptFilter === d
                    ? "bg-[#22d3ee] text-[#0a1628]"
                    : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل الموظفين...</div>
        )}

        {/* Table */}
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
                          style={{ background: `linear-gradient(135deg,${deptColors[emp.department] || "#22d3ee"},#0a1628)` }}
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
                      <span className="badge text-xs" style={{ background: `${deptColors[emp.department]}20`, color: deptColors[emp.department] || "#22d3ee" }}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{EMP_ROLE_LABELS[emp.role] ?? emp.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">
                {editId ? "تعديل موظف" : "إضافة موظف جديد"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#8ba3c7] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الاسم</label>
                  <input className="input-dark text-sm" placeholder="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
                  <input className="input-dark text-sm" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">القسم</label>
                  <select className="input-dark text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الدور</label>
                  <select className="input-dark text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                    {Object.entries(EMP_ROLE_LABELS).slice(0, 5).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
                  <select className="input-dark text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "نشط" | "غير_نشط" })}>
                    <option value="نشط">نشط</option>
                    <option value="غير_نشط">غير نشط</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">
                {editId ? "حفظ التعديلات" : "إضافة الموظف"}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EmployeesPage() {
  const { hasPermission } = usePermissions();
  if (!hasPermission("manage_users")) {
    return <DashboardLayout><AccessDenied /></DashboardLayout>;
  }
  return <EmployeesContent />;
}
