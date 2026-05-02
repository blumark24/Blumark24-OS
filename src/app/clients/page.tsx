"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CITIES, formatCurrency } from "@/lib/utils";
import { UserCircle, Plus, Search, Phone, MapPin, Package, Edit2, Trash2, X } from "lucide-react";
import type { ClientStatus, PackageType } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import AccessDenied from "@/components/ui/AccessDenied";
import { useClients } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_CONFIG: Record<ClientStatus, { label: string; class: string; color: string }> = {
  "محتمل":  { label: "محتمل",  class: "status-pending",  color: "#f59e0b" },
  "متعاقد": { label: "متعاقد", class: "status-active",   color: "#22d3ee" },
  "نشط":    { label: "نشط",    class: "status-active",   color: "#10b981" },
  "متوقف":  { label: "متوقف",  class: "status-inactive", color: "#ef4444" },
};

const PKG_CONFIG: Record<PackageType, { label: string; color: string }> = {
  "صغيرة":  { label: "صغيرة",  color: "#22d3ee" },
  "متوسطة": { label: "متوسطة", color: "#a855f7" },
  "كبيرة":  { label: "كبيرة",  color: "#ff7a3d" },
};

const STATUSES: ClientStatus[] = ["محتمل", "متعاقد", "نشط", "متوقف"];

function ClientsContent() {
  const { data: clients, loading, insert, update, remove } = useClients();
  const { userRole } = usePermissions();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "الكل">("الكل");
  const [cityFilter, setCityFilter] = useState("الكل");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    businessType: "",
    city: "جدة",
    packageType: "صغيرة" as PackageType,
    contractValue: "",
    status: "محتمل" as ClientStatus,
    accountManagerName: "",
    notes: "",
  });

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.includes(search) || c.phone.includes(search);
    const matchStatus = statusFilter === "الكل" || c.status === statusFilter;
    const matchCity = cityFilter === "الكل" || c.city === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  const pkgData = [
    { name: "صغيرة",  value: clients.filter((c) => c.packageType === "صغيرة").length },
    { name: "متوسطة", value: clients.filter((c) => c.packageType === "متوسطة").length },
    { name: "كبيرة",  value: clients.filter((c) => c.packageType === "كبيرة").length },
  ];
  const PKG_COLORS = ["#22d3ee", "#a855f7", "#ff7a3d"];

  const totalRevenue = clients.filter((c) => c.status === "نشط").reduce((s, c) => s + c.contractValue, 0);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", phone: "", businessType: "", city: "جدة", packageType: "صغيرة", contractValue: "", status: "محتمل", accountManagerName: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (c: typeof clients[0]) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      businessType: c.businessType,
      city: c.city,
      packageType: c.packageType,
      contractValue: String(c.contractValue),
      status: c.status,
      accountManagerName: c.accountManagerName,
      notes: c.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    try {
      const payload = { ...form, contractValue: Number(form.contractValue) };
      if (editId) {
        await update(editId, payload);
        toast.success("تم تحديث بيانات العميل بنجاح");
      } else {
        await insert({ ...payload, accountManagerId: "1" });
        toast.success("تمت إضافة العميل بنجاح");
      }
      setShowModal(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ العميل");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    try {
      await remove(id);
      toast.success("تم حذف العميل بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حذف العميل");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <UserCircle size={24} className="text-[#22d3ee]" />
              إدارة العملاء (CRM)
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">إدارة علاقات العملاء والعقود</p>
          </div>
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              عميل جديد
            </button>
          )}
        </div>

        {/* Stats + Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "إجمالي العملاء",     value: clients.length,                                              color: "#22d3ee" },
              { label: "العملاء النشطون",    value: clients.filter((c) => c.status === "نشط").length,           color: "#10b981" },
              { label: "العملاء المحتملون",  value: clients.filter((c) => c.status === "محتمل").length,         color: "#f59e0b" },
              { label: "إجمالي العقود",      value: `${formatCurrency(totalRevenue)} SAR`,                      color: "#ff7a3d" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4">
                <div className="text-xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-[#8ba3c7] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-white mb-3">توزيع الحزم</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pkgData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {pkgData.map((_, i) => <Cell key={i} fill={PKG_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" }} />
                <Legend formatter={(v) => <span className="text-xs text-[#8ba3c7]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-white mb-4">خط الأنابيب</h3>
            <div className="space-y-3">
              {STATUSES.map((status) => {
                const count = clients.filter((c) => c.status === status).length;
                const pct = clients.length ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8ba3c7]">{STATUS_CONFIG[status].label}</span>
                      <span style={{ color: STATUS_CONFIG[status].color }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: STATUS_CONFIG[status].color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
            <input className="input-dark pr-9 py-2 text-sm w-64" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["الكل", ...STATUSES] as (ClientStatus | "الكل")[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? "bg-[#22d3ee] text-[#0a1628]" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}>
                {s === "الكل" ? "الكل" : STATUS_CONFIG[s as ClientStatus].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["الكل", ...CITIES].map((city) => (
              <button key={city} onClick={() => setCityFilter(city)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${cityFilter === city ? "bg-[#1e6fd9] text-white" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}>
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل العملاء...</div>
        )}

        {/* Table */}
        {!loading && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["العميل", "نوع النشاط", "المدينة", "الحزمة", "قيمة العقد", "المسؤول", "الحالة", ""].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{client.name}</div>
                      <div className="flex items-center gap-1 text-xs text-[#8ba3c7] mt-0.5">
                        <Phone size={10} />
                        <span>{client.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{client.businessType}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[#8ba3c7] text-xs">
                        <MapPin size={11} />
                        <span>{client.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-xs" style={{ background: `${PKG_CONFIG[client.packageType].color}20`, color: PKG_CONFIG[client.packageType].color }}>
                        <Package size={10} className="inline ml-1" />
                        {PKG_CONFIG[client.packageType].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(client.contractValue)} SAR</td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{client.accountManagerName}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_CONFIG[client.status].class}`}>{STATUS_CONFIG[client.status].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">{editId ? "تعديل عميل" : "عميل جديد"}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8ba3c7] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">اسم العميل</label>
                  <input className="input-dark text-sm" placeholder="اسم الشركة أو العميل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">نوع النشاط</label>
                  <input className="input-dark text-sm" placeholder="مطعم، تقنية، ..." value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">المدينة</label>
                  <select className="input-dark text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">نوع الحزمة</label>
                  <select className="input-dark text-sm" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as PackageType })}>
                    <option value="صغيرة">صغيرة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="كبيرة">كبيرة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">قيمة العقد (SAR)</label>
                  <input className="input-dark text-sm" type="number" placeholder="0" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
                  <select className="input-dark text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">مدير الحساب</label>
                  <input className="input-dark text-sm" placeholder="اسم المسؤول" value={form.accountManagerName} onChange={(e) => setForm({ ...form, accountManagerName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">ملاحظات</label>
                <textarea className="input-dark text-sm resize-none" rows={3} placeholder="ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">{editId ? "حفظ" : "إضافة"}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ClientsPage() {
  const { hasPermission } = usePermissions();
  if (!hasPermission("manage_clients")) {
    return <DashboardLayout><AccessDenied /></DashboardLayout>;
  }
  return <ClientsContent />;
}
