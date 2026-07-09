"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { CITIES, formatCurrency, cn } from "@/lib/utils";
import { UserCircle, Plus, Search, Phone, MapPin, Package, Edit2, Trash2, X, Building2, ChevronLeft, List, LayoutGrid } from "lucide-react";
import type { ClientStatus, PackageType } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClients, useEmployees, useTasks } from "@/hooks/useData";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useToast } from "@/contexts/ToastContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WS_PAGE, WS_CARD } from "@/components/ui/workspaceVisual";
import { PageHero, KpiStatCard, WorkspaceEmpty, GlassPanel } from "@/components/ui/workspaceUi";
import { MobileHeroCard } from "@/components/ui/MobileHeroCard";
import { WorkspaceCenterModal } from "@/components/ui/WorkspaceCenterModal";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import { createOrgScopeResolver } from "@/lib/org/orgScopeResolver";

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
  const { data: tasks } = useTasks();
  const { data: employees } = useEmployees();
  const { data: orgSnapshot } = useOrgStructure(true);
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

  const orgResolver = useMemo(
    () => createOrgScopeResolver(orgSnapshot, employees),
    [orgSnapshot, employees],
  );

  const clientIntelligence = useMemo(() => {
    const completedStatus = "مكتملة";
    const lateStatus = "متأخرة";
    const isTaskOverdue = (dueDate: string, status: string) => {
      if (status === completedStatus) return false;
      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) return false;
      return due < new Date();
    };

    return clients.map((client) => {
      const relatedTasks = tasks.filter((task) =>
        (client.id && task.clientId === client.id) ||
        (client.name && task.clientName === client.name),
      );
      const activeTasks = relatedTasks.filter((task) => task.status !== completedStatus);
      const lateTasks = activeTasks.filter((task) => task.status === lateStatus || isTaskOverdue(task.dueDate, task.status));
      const managerScope = orgResolver.resolveClientManager(client);
      const nextAction =
        lateTasks.length > 0 ? "معالجة مهمة متأخرة" :
        activeTasks.some((task) => task.status === "بانتظار_المراجعة") ? "مراجعة تسليم مرتبط" :
        client.status === "محتمل" ? "تحديد خطوة التأهيل التالية" :
        client.status === "متعاقد" && activeTasks.length === 0 ? "فتح مهمة انطلاق للعميل" :
        client.status === "نشط" && activeTasks.length === 0 ? "تحديد متابعة دورية" :
        client.status === "متوقف" ? "مراجعة سبب التوقف" :
        activeTasks.length > 0 ? "متابعة التنفيذ المفتوح" :
        "لا يوجد إجراء واضح من البيانات الحالية";

      return {
        id: client.id,
        name: client.name,
        status: client.status,
        managerName: client.accountManagerName || managerScope.employeeName,
        managerScope: managerScope.departmentLabel,
        activeTasks: activeTasks.length,
        lateTasks: lateTasks.length,
        nextAction,
      };
    });
  }, [clients, orgResolver, tasks]);

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

        {!loading && clients.length > 0 && (
          <section className={cn(WS_CARD, "overflow-hidden p-0")}>
            <div className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_38%),rgba(255,255,255,0.025)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-base font-bold text-white">رادار العملاء المرتبط بالهيكل</h2>
                  <p className="mt-1 text-xs leading-5 text-[#8ba3c7]">
                    يعرض مدير الحساب ونطاقه والمهام المرتبطة فقط، بدون صحة عميل أو إيرادات غير موجودة.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-cyan-100"><strong className="block text-lg text-white">{clientIntelligence.filter((item) => item.activeTasks > 0).length}</strong>لديه مهام</div>
                  <div className="rounded-xl border border-red-300/15 bg-red-500/10 px-3 py-2 text-red-100"><strong className="block text-lg text-white">{clientIntelligence.filter((item) => item.lateTasks > 0).length}</strong>متأخر</div>
                  <div className="rounded-xl border border-amber-300/15 bg-amber-400/10 px-3 py-2 text-amber-100"><strong className="block text-lg text-white">{clientIntelligence.filter((item) => item.managerScope === "غير محدد").length}</strong>نطاق غير محدد</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-3">
              {clientIntelligence.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{item.name}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">مدير الحساب: {item.managerName || "غير محدد"}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">النطاق: {item.managerScope}</div>
                    </div>
                    <span className={cn("badge shrink-0 text-[10px]", STATUS_CONFIG[item.status].class)}>{STATUS_CONFIG[item.status].label}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-black/20 px-3 py-2 text-[#d7e7ff]">مهام مفتوحة: <strong className="text-white">{item.activeTasks}</strong></div>
                    <div className="rounded-xl bg-red-500/10 px-3 py-2 text-red-100">متأخرة: <strong className="text-white">{item.lateTasks}</strong></div>
                  </div>
                  <div className="mt-3 rounded-xl border border-cyan-300/10 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100">
                    الإجراء التالي: {item.nextAction}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

      {/* Client details — compact centered glass */}
      {detailsClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={() => setDetailsId(null)}>
          <div className="relative w-[min(360px,calc(100vw-48px))] max-[380px]:w-[calc(100vw-36px)] max-h-[72vh] max-[380px]:max-h-[76vh] sm:max-w-[420px] sm:max-h-[80vh] overflow-y-auto rounded-[26px] border border-[rgba(34,211,238,0.18)] bg-[linear-gradient(155deg,rgba(13,25,48,0.97),rgba(7,15,32,0.98))] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7),0_0_28px_rgba(34,211,238,0.05)] backdrop-blur-[20px] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                style={{ background: `linear-gradient(135deg,${STATUS_CONFIG[detailsClient.status].color},#0a1628)` }}
              >
                {detailsClient.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-heading font-bold text-[15px] truncate">{detailsClient.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={cn("badge text-[10px]", STATUS_CONFIG[detailsClient.status].class)}>{STATUS_CONFIG[detailsClient.status].label}</span>
                  <span className="badge text-[10px]" style={{ background: `${PKG_CONFIG[detailsClient.packageType].color}20`, color: PKG_CONFIG[detailsClient.packageType].color }}>{PKG_CONFIG[detailsClient.packageType].label}</span>
                  <PublicCodeBadge code={detailsClient.publicCode} />
                </div>
              </div>
              <button onClick={() => setDetailsId(null)} className="text-[#8ba3c7] hover:text-white shrink-0" aria-label="إغلاق"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[13px]">
              <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                <span className="text-[#8ba3c7] text-[11px] flex items-center gap-1.5"><Phone size={12} />الهاتف</span>
                <span className="text-white font-medium truncate" dir="ltr">{detailsClient.phone || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                  <span className="text-[#8ba3c7] text-[11px]">المدينة</span>
                  <span className="text-white font-medium truncate">{detailsClient.city || "—"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                  <span className="text-[#8ba3c7] text-[11px]">النشاط</span>
                  <span className="text-white font-medium truncate">{detailsClient.businessType || "—"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                <span className="text-[#8ba3c7] text-[11px]">قيمة العقد</span>
                <span className="text-white font-medium truncate">{formatCurrency(detailsClient.contractValue)} SAR</span>
              </div>
              {detailsClient.accountManagerName && (
                <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                  <span className="text-[#8ba3c7] text-[11px]">مدير الحساب</span>
                  <span className="text-white font-medium truncate">{detailsClient.accountManagerName}</span>
                </div>
              )}
            </div>

            {canManageClients && (
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => { const c = detailsClient; setDetailsId(null); openEdit(c); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-10"
                >
                  <Edit2 size={14} />
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => { const c = detailsClient; setDetailsId(null); handleDelete(c.id); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors min-h-10"
                >
                  <Trash2 size={14} />
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / edit client — centered glass */}
      <WorkspaceCenterModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "تعديل عميل" : "عميل جديد"}
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الحفظ..." : editId ? "حفظ" : "إضافة"}
            </button>
            <button onClick={() => setShowModal(false)} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
          </div>
        }
      >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">اسم العميل</label>
                  <input className="input-dark text-sm" placeholder="اسم الشركة أو العميل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">نوع النشاط</label>
                  <input className="input-dark text-sm" placeholder="مطعم، تقنية، ..." value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">المدينة</label>
                  <select className="input-dark text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">نوع الحزمة</label>
                  <select className="input-dark text-sm" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as PackageType })}>
                    <option value="صغيرة">صغيرة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="كبيرة">كبيرة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">قيمة العقد (SAR)</label>
                  <input className="input-dark text-sm" type="number" placeholder="0" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">الحالة</label>
                  <select className="input-dark text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">مدير الحساب</label>
                  <input className="input-dark text-sm" placeholder="اسم المسؤول" value={form.accountManagerName} onChange={(e) => setForm({ ...form, accountManagerName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1">ملاحظات</label>
                <textarea className="input-dark text-sm resize-none" rows={2} placeholder="ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
      </WorkspaceCenterModal>
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
