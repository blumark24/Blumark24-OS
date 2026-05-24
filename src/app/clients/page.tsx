"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { CITIES, formatCurrency, cn } from "@/lib/utils";
import { UserCircle, Plus, Search, Phone, MapPin, Package, Edit2, Trash2, X } from "lucide-react";
import type { ClientStatus, PackageType } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WS_PAGE, WS_CARD, WS_MUTED, WS_SUBTEXT } from "@/components/ui/workspaceVisual";
import { PageHero, KpiStatCard, WorkspaceEmpty, GlassPanel } from "@/components/ui/workspaceUi";

/**
 * Semantic status palette — uses CSS vars so dark + light look right and stay
 * consistent with every other workspace section.
 */
const STATUS_CONFIG: Record<ClientStatus, { label: string; class: string; color: string }> = {
  "محتمل":  { label: "محتمل",  class: "status-pending",  color: "var(--ws-amber)" },
  "متعاقد": { label: "متعاقد", class: "status-active",   color: "var(--ws-cyan)" },
  "نشط":    { label: "نشط",    class: "status-active",   color: "var(--ws-emerald)" },
  "متوقف":  { label: "متوقف",  class: "status-inactive", color: "var(--ws-rose)" },
};

const PKG_CONFIG: Record<PackageType, { label: string; color: string }> = {
  "صغيرة":  { label: "صغيرة",  color: "var(--ws-cyan)" },
  "متوسطة": { label: "متوسطة", color: "var(--ws-violet)" },
  "كبيرة":  { label: "كبيرة",  color: "#ff7a3d" },
};

const PKG_DONUT_COLORS = ["var(--ws-cyan)", "var(--ws-violet)", "#ff7a3d"];

const STATUSES: ClientStatus[] = ["محتمل", "متعاقد", "نشط", "متوقف"];

function ClientsContent() {
  const { data: clients, loading, insert, update, remove } = useClients();
  const { userRole } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "الكل">("الكل");
  const [cityFilter,   setCityFilter]   = useState("الكل");
  const [showModal,    setShowModal]    = useState(false);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
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
    const matchCity   = cityFilter === "الكل" || c.city === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  const pkgData = [
    { name: "صغيرة",  value: clients.filter((c) => c.packageType === "صغيرة").length },
    { name: "متوسطة", value: clients.filter((c) => c.packageType === "متوسطة").length },
    { name: "كبيرة",  value: clients.filter((c) => c.packageType === "كبيرة").length },
  ];

  const totalRevenue = clients
    .filter((c) => c.status === "نشط")
    .reduce((s, c) => s + c.contractValue, 0);

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
    if (!form.name.trim()) { toast.error("اسم العميل مطلوب"); return; }
    setSaving(true);
    try {
      const payload = { ...form, contractValue: Number(form.contractValue) };
      if (editId) {
        await update(editId, payload);
        toast.success("تم تحديث بيانات العميل بنجاح");
      } else {
        await insert({ ...payload, accountManagerId: user?.id ?? "" });
        toast.success("تمت إضافة العميل بنجاح");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ العميل");
      console.error("[Client Save Error]", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await remove(id);
      toast.success("تم حذف العميل بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء حذف العميل");
      console.error("[Client Delete Error]", err);
    }
  };

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <PageHero title="إدارة العملاء (CRM)" subtitle="إدارة علاقات العملاء والعقود">
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-11 touch-manipulation">
              <Plus size={16} />
              عميل جديد
            </button>
          )}
        </PageHero>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
            <KpiStatCard label="إجمالي العملاء"   value={String(clients.length)}                                   icon={UserCircle} accent="cyan"    showLive={false} showSparkline={false} />
            <KpiStatCard label="العملاء النشطون" value={String(clients.filter((c) => c.status === "نشط").length)} icon={UserCircle} accent="emerald" showLive={false} showSparkline={false} />
            <KpiStatCard label="العملاء المحتملون" value={String(clients.filter((c) => c.status === "محتمل").length)} icon={UserCircle} accent="amber" showLive={false} showSparkline={false} />
            <KpiStatCard label="إجمالي العقود"   value={formatCurrency(totalRevenue)} subtitle="SAR"               icon={Package}    accent="sky"     showLive={false} showSparkline={false} />
          </div>

          <GlassPanel title="توزيع الحزم">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pkgData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {pkgData.map((_, i) => <Cell key={i} fill={PKG_DONUT_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--ws-surface-modal)", border: "1px solid var(--ws-border-strong)", borderRadius: "10px", color: "var(--ws-text-primary)" }} />
                <Legend formatter={(v) => <span className={cn(WS_MUTED, "text-xs")}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </GlassPanel>

          <GlassPanel title="خط الأنابيب">
            <div className="space-y-3">
              {STATUSES.map((status) => {
                const count = clients.filter((c) => c.status === status).length;
                const pct = clients.length ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={WS_MUTED}>{STATUS_CONFIG[status].label}</span>
                      <span style={{ color: STATUS_CONFIG[status].color }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: STATUS_CONFIG[status].color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-[color:var(--ws-text-secondary)]" />
            <input
              className="input-dark pe-9 py-2 text-sm w-full sm:w-64"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="بحث في العملاء"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["الكل", ...STATUSES] as (ClientStatus | "الكل")[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[36px] touch-manipulation",
                  statusFilter === s
                    ? "bg-cyan-400 text-[#0a1628]"
                    : "bg-[var(--ws-surface-2)] text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
                )}
              >
                {s === "الكل" ? "الكل" : STATUS_CONFIG[s as ClientStatus].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["الكل", ...CITIES].map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-h-[36px] touch-manipulation",
                  cityFilter === city
                    ? "bg-[var(--ws-cyan-soft)] text-cyan-200 ring-1 ring-[var(--ws-cyan-ring)]"
                    : "bg-[var(--ws-surface-2)] text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className={cn("text-center py-8 text-sm", WS_MUTED)}>جارٍ تحميل العملاء...</div>
        )}

        {!loading && filtered.length === 0 && (
          <WorkspaceEmpty
            icon={UserCircle}
            title={clients.length === 0 ? "لا يوجد عملاء بعد" : "لا يوجد عملاء مطابقون للبحث"}
            subtitle={clients.length === 0
              ? "ابدأ بإضافة أول عميل لظهور بيانات CRM هنا."
              : "جرّب تغيير معايير البحث أو الفلاتر"}
            accent="cyan"
          />
        )}

        {/* Mobile cards */}
        {!loading && filtered.length > 0 && (
          <div className="lg:hidden space-y-3">
            {filtered.map((client) => (
              <div key={client.id} className={cn(WS_CARD, "p-4")}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[color:var(--ws-text-primary)] font-medium truncate">{client.name}</div>
                    <div className={cn("flex items-center gap-1 text-xs mt-1", WS_MUTED)}>
                      <Phone size={11} />
                      <span dir="ltr">{client.phone}</span>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_CONFIG[client.status].class} flex-shrink-0`}>{STATUS_CONFIG[client.status].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                  <div className={cn("flex items-center gap-1 min-w-0", WS_MUTED)}>
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{client.city}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="badge text-xs"
                      style={{ background: `color-mix(in srgb, ${PKG_CONFIG[client.packageType].color} 20%, transparent)`, color: PKG_CONFIG[client.packageType].color }}
                    >
                      <Package size={10} className="inline ms-1" />
                      {PKG_CONFIG[client.packageType].label}
                    </span>
                  </div>
                  <div className={cn("truncate", WS_MUTED)}>{client.businessType}</div>
                  <div className="text-[color:var(--ws-text-primary)] font-medium truncate">{formatCurrency(client.contractValue)} SAR</div>
                </div>
                {client.accountManagerName && (
                  <div className={cn(WS_SUBTEXT, "text-[11px] mt-2 truncate")}>المسؤول: {client.accountManagerName}</div>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--ws-border-subtle)]">
                    <button onClick={() => openEdit(client)} aria-label="تعديل العميل" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[color:var(--ws-text-secondary)] hover:text-cyan-300 hover:bg-[var(--ws-cyan-soft)] transition-all min-h-[44px] touch-manipulation">
                      <Edit2 size={13} />
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(client.id)} aria-label="حذف العميل" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[color:var(--ws-text-secondary)] hover:text-rose-400 hover:bg-[var(--ws-rose-soft)] transition-all min-h-[44px] touch-manipulation">
                      <Trash2 size={13} />
                      حذف
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!loading && filtered.length > 0 && (
          <div className={cn("hidden lg:block", WS_CARD, "overflow-hidden p-0")}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)]">
                    {["العميل", "نوع النشاط", "المدينة", "الحزمة", "قيمة العقد", "المسؤول", "الحالة", ""].map((h) => (
                      <th key={h} className="text-start text-[color:var(--ws-text-secondary)] font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="text-[color:var(--ws-text-primary)] font-medium">{client.name}</div>
                        <div className={cn("flex items-center gap-1 text-xs mt-0.5", WS_MUTED)}>
                          <Phone size={10} />
                          <span>{client.phone}</span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{client.businessType}</td>
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1 text-xs", WS_MUTED)}>
                          <MapPin size={11} />
                          <span>{client.city}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge text-xs" style={{ background: `color-mix(in srgb, ${PKG_CONFIG[client.packageType].color} 20%, transparent)`, color: PKG_CONFIG[client.packageType].color }}>
                          <Package size={10} className="inline ms-1" />
                          {PKG_CONFIG[client.packageType].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--ws-text-primary)] font-medium">{formatCurrency(client.contractValue)} SAR</td>
                      <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{client.accountManagerName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_CONFIG[client.status].class}`}>{STATUS_CONFIG[client.status].label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(client)} aria-label="تعديل العميل" className="p-1.5 rounded-lg text-[color:var(--ws-text-secondary)] hover:text-cyan-300 hover:bg-[var(--ws-cyan-soft)] transition-all">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(client.id)} aria-label="حذف العميل" className="p-1.5 rounded-lg text-[color:var(--ws-text-secondary)] hover:text-rose-400 hover:bg-[var(--ws-rose-soft)] transition-all">
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
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "var(--ws-scrim)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        >
          <div className={cn(WS_CARD, "w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto")}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[color:var(--ws-text-primary)] font-heading font-bold text-lg">{editId ? "تعديل عميل" : "عميل جديد"}</h3>
              <button onClick={() => setShowModal(false)} className="text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)] touch-manipulation" aria-label="إغلاق"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>اسم العميل</label>
                  <input className="input-dark text-sm" placeholder="اسم الشركة أو العميل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>نوع النشاط</label>
                  <input className="input-dark text-sm" placeholder="مطعم، تقنية، ..." value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                </div>
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>المدينة</label>
                  <select className="input-dark text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>نوع الحزمة</label>
                  <select className="input-dark text-sm" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as PackageType })}>
                    <option value="صغيرة">صغيرة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="كبيرة">كبيرة</option>
                  </select>
                </div>
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>قيمة العقد (SAR)</label>
                  <input className="input-dark text-sm" type="number" placeholder="0" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>الحالة</label>
                  <select className="input-dark text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>مدير الحساب</label>
                  <input className="input-dark text-sm" placeholder="اسم المسؤول" value={form.accountManagerName} onChange={(e) => setForm({ ...form, accountManagerName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>ملاحظات</label>
                <textarea className="input-dark text-sm resize-none" rows={3} placeholder="ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editId ? "حفظ" : "إضافة"}
              </button>
              <button onClick={() => setShowModal(false)} disabled={saving} className="btn-secondary flex-1 touch-manipulation">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ClientsPage() {
  return (
    <PageGuard permission="manage_clients">
      <ClientsContent />
    </PageGuard>
  );
}
