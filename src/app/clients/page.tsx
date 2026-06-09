"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { CITIES, formatCurrency, cn } from "@/lib/utils";
import { UserCircle, Plus, Search, Phone, MapPin, Package, Edit2, Trash2, X, Building2, ChevronLeft, List, LayoutGrid } from "lucide-react";
import type { ClientStatus, PackageType } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WS_PAGE, WS_CARD } from "@/components/ui/workspaceVisual";
import { PageHero, KpiStatCard, WorkspaceEmpty, GlassPanel } from "@/components/ui/workspaceUi";
import { MobileHeroCard } from "@/components/ui/MobileHeroCard";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";

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
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const canManageClients = hasPermission("manage_clients");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "الكل">("الكل");
  const [cityFilter, setCityFilter] = useState("الكل");
  // Mobile-only (< lg) directory display mode — desktop table is untouched.
  const [mobileView, setMobileView] = useState<"list" | "cards">("list");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
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
  const detailsClient = detailsId ? clients.find((c) => c.id === detailsId) ?? null : null;

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
        {/* Mobile premium hero (< sm) — matches Employees reference */}
        <MobileHeroCard
          icon={Building2}
          title="إدارة العملاء (CRM)"
          subtitle="إدارة علاقات العملاء والعقود"
          metrics={[
            { label: "إجمالي العملاء", value: clients.length, accent: "white" },
            { label: "النشطون", value: clients.filter((c) => c.status === "نشط").length, accent: "emerald" },
            { label: "المحتملون", value: clients.filter((c) => c.status === "محتمل").length, accent: "amber" },
            { label: "العقود", value: formatCurrency(totalRevenue), accent: "sky" },
          ]}
          ctaLabel="عميل جديد"
          onCta={openAdd}
          showCta={canManageClients}
        />

        {/* Desktop/tablet hero (sm+) — unchanged */}
        <div className="hidden sm:block">
          <PageHero title="إدارة العملاء (CRM)" subtitle="إدارة علاقات العملاء والعقود">
            {canManageClients && (
              <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-11 touch-manipulation">
                <Plus size={16} />
                عميل جديد
              </button>
            )}
          </PageHero>
        </div>

        {/* Desktop/tablet KPIs + analytics (sm+) — no bulky KPI/charts on mobile */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
            <KpiStatCard label="إجمالي العملاء" value={String(clients.length)} icon={UserCircle} accent="cyan" showLive={false} showSparkline={false} />
            <KpiStatCard label="العملاء النشطون" value={String(clients.filter((c) => c.status === "نشط").length)} icon={UserCircle} accent="emerald" showLive={false} showSparkline={false} />
            <KpiStatCard label="العملاء المحتملون" value={String(clients.filter((c) => c.status === "محتمل").length)} icon={UserCircle} accent="amber" showLive={false} showSparkline={false} />
            <KpiStatCard label="إجمالي العقود" value={`${formatCurrency(totalRevenue)}`} subtitle="SAR" icon={Package} accent="sky" showLive={false} showSparkline={false} />
          </div>

          <GlassPanel className="p-4 sm:p-5">
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
          </GlassPanel>

          <GlassPanel className="p-4 sm:p-5">
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
          </GlassPanel>
        </div>

        {/* Filters — search row is full width on mobile; chip rows scroll horizontally to
            prevent body overflow while keeping every filter reachable by swipe. */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
            <input
              className="input-dark pr-9 py-2 text-sm w-full sm:w-64"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["الكل", ...STATUSES] as (ClientStatus | "الكل")[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? "bg-[#22d3ee] text-[#0a1628]" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}
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
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${cityFilter === city ? "bg-[#1e6fd9] text-white" : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل العملاء...</div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <WorkspaceEmpty icon={UserCircle} title="لا يوجد عملاء مطابقون للبحث" subtitle="جرّب تغيير معايير البحث أو الفلاتر" accent="cyan" />
        )}

        {/* Mobile directory (<lg). Smart list (default) ↔ cards toggle. Same data +
            same handlers as the desktop table — presentation only. */}
        {!loading && filtered.length > 0 && (
          <div className="lg:hidden space-y-3">
            {/* View toggle — قائمة ذكية / بطاقات */}
            <div className="flex items-center gap-1 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] p-1 w-fit">
              <button
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-9", mobileView === "list" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7] hover:text-white hover:bg-white/[0.04]")}
              >
                <List size={14} />
                قائمة ذكية
              </button>
              <button
                onClick={() => setMobileView("cards")}
                aria-pressed={mobileView === "cards"}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-9", mobileView === "cards" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7] hover:text-white hover:bg-white/[0.04]")}
              >
                <LayoutGrid size={14} />
                بطاقات
              </button>
            </div>

            {mobileView === "list" ? (
              <div className="space-y-2">
                {filtered.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setDetailsId(client.id)}
                    className="group w-full flex items-center gap-3 rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.55)] px-3 py-2.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-[6px] transition-all hover:border-cyan-400/25 hover:bg-[rgba(11,26,52,0.7)] active:scale-[0.99] min-h-14"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                      style={{ background: `linear-gradient(135deg,${STATUS_CONFIG[client.status].color},#0a1628)` }}
                    >
                      {client.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white font-semibold text-[13px] truncate flex-1">{client.name}</span>
                        <span className={cn("badge text-[9px] shrink-0", STATUS_CONFIG[client.status].class)}>{STATUS_CONFIG[client.status].label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#8ba3c7] min-w-0">
                        <span className="shrink-0" style={{ color: PKG_CONFIG[client.packageType].color }}>{PKG_CONFIG[client.packageType].label}</span>
                        <span className="text-[#1e3a5f] shrink-0">·</span>
                        <span className="truncate text-white/90 font-medium">{formatCurrency(client.contractValue)} SAR</span>
                        {client.publicCode && (
                          <>
                            <span className="text-[#1e3a5f] shrink-0">·</span>
                            <span className="font-mono text-[10px] text-[#6b87ab] shrink-0" dir="ltr">{client.publicCode}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-[#8ba3c7] group-hover:text-cyan-300 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
            <div className="space-y-3">
            {filtered.map((client) => (
              <div key={client.id} className={cn(WS_CARD, "p-4")}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <div className="text-white font-medium truncate">{client.name}</div>
                      <PublicCodeBadge code={client.publicCode} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#8ba3c7] mt-1">
                      <Phone size={11} />
                      <span dir="ltr">{client.phone}</span>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_CONFIG[client.status].class} flex-shrink-0`}>{STATUS_CONFIG[client.status].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                  <div className="flex items-center gap-1 text-[#8ba3c7] min-w-0">
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{client.city}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="badge text-xs"
                      style={{ background: `${PKG_CONFIG[client.packageType].color}20`, color: PKG_CONFIG[client.packageType].color }}
                    >
                      <Package size={10} className="inline ml-1" />
                      {PKG_CONFIG[client.packageType].label}
                    </span>
                  </div>
                  <div className="text-[#8ba3c7] truncate">{client.businessType}</div>
                  <div className="text-white font-medium truncate">{formatCurrency(client.contractValue)} SAR</div>
                </div>
                {client.accountManagerName && (
                  <div className="text-[11px] text-[#6b87ab] mt-2 truncate">المسؤول: {client.accountManagerName}</div>
                )}
                {canManageClients && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1e3a5f]/40">
                    <button onClick={() => openEdit(client)} aria-label="تعديل العميل" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all">
                      <Edit2 size={13} />
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(client.id)} aria-label="حذف العميل" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                      حذف
                    </button>
                  </div>
                )}
              </div>
            ))}
            </div>
            )}
          </div>
        )}

        {/* Desktop table (≥lg). Wrapped in overflow-x-auto so even on narrow
            desktop windows the layout never breaks the page width. */}
        {!loading && filtered.length > 0 && (
          <div className={cn("hidden lg:block", WS_CARD, "overflow-hidden p-0")}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
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
                        <div className="mt-0.5">
                          <PublicCodeBadge code={client.publicCode} />
                        </div>
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
                        {canManageClients && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(client)} aria-label="تعديل العميل" className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(client.id)} aria-label="حذف العميل" className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all">
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

      {/* Mobile client details sheet */}
      {detailsClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetailsId(null)}>
          <div className="glass-card w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                style={{ background: `linear-gradient(135deg,${STATUS_CONFIG[detailsClient.status].color},#0a1628)` }}
              >
                {detailsClient.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-heading font-bold text-base truncate">{detailsClient.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={cn("badge text-[10px]", STATUS_CONFIG[detailsClient.status].class)}>{STATUS_CONFIG[detailsClient.status].label}</span>
                  <PublicCodeBadge code={detailsClient.publicCode} />
                </div>
              </div>
              <button onClick={() => setDetailsId(null)} className="text-[#8ba3c7] hover:text-white shrink-0" aria-label="إغلاق"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 gap-2 text-[13px]">
              <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                <span className="text-[#8ba3c7] text-[11px] flex items-center gap-1.5"><Phone size={12} />الهاتف</span>
                <span className="text-white font-medium truncate" dir="ltr">{detailsClient.phone || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                  <span className="text-[#8ba3c7] text-[11px]">المدينة</span>
                  <span className="text-white font-medium truncate">{detailsClient.city || "—"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                  <span className="text-[#8ba3c7] text-[11px]">الحزمة</span>
                  <span className="font-medium truncate" style={{ color: PKG_CONFIG[detailsClient.packageType].color }}>{PKG_CONFIG[detailsClient.packageType].label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                <span className="text-[#8ba3c7] text-[11px]">نوع النشاط</span>
                <span className="text-white font-medium truncate">{detailsClient.businessType || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                <span className="text-[#8ba3c7] text-[11px]">قيمة العقد</span>
                <span className="text-white font-medium truncate">{formatCurrency(detailsClient.contractValue)} SAR</span>
              </div>
              {detailsClient.accountManagerName && (
                <div className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2.5">
                  <span className="text-[#8ba3c7] text-[11px]">مدير الحساب</span>
                  <span className="text-white font-medium truncate">{detailsClient.accountManagerName}</span>
                </div>
              )}
            </div>

            {canManageClients && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { const c = detailsClient; setDetailsId(null); openEdit(c); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-11"
                >
                  <Edit2 size={14} />
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => { const c = detailsClient; setDetailsId(null); handleDelete(c.id); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors min-h-11"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={cn(WS_CARD, "w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto")}>
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
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editId ? "حفظ" : "إضافة"}
              </button>
              <button onClick={() => setShowModal(false)} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
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
