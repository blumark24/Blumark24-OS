"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Network, Plus, Pencil, Trash2, X, Save, UserCheck, Mail, Phone,
  Sparkles, AlertCircle, CheckCircle2, Crown,
  ChevronDown, Loader2, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useBoardMembers, useEmployees } from "@/hooks/useData";
import { assignEmployeeDepartment, type BoardMember } from "@/lib/db";
import { normalizePlanSlug, type PlanSlug } from "@/lib/features/packageFeatures";
import { getOrgLimits } from "@/lib/org/orgPackageLimits";
import {
  countUnits,
  createOrgUnit,
  loadOrgStructure,
  saveOrgStructure,
  type OrgNodeKind,
  type OrgStructureSnapshot,
  type OrgUnitNode,
} from "@/lib/org/orgStructure";
import { ASSIGNMENT_ROLES, ORG_SYSTEM_ROLES } from "@/lib/org/orgRoles";
import { WS_CARD, WS_GLASS_MODAL, WS_PAGE, WS_SURFACE } from "@/components/ui/workspaceVisual";

const MAX_BOARD = 12;
const EMPTY_BOARD = { name: "", role: "", email: "", phone: "", status: "نشط" as BoardMember["status"] };

function BoardMemberModal({
  member, onSave, onClose,
}: {
  member: BoardMember | null;
  onSave: (data: Omit<BoardMember, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(member ? { name: member.name, role: member.role, email: member.email, phone: member.phone, status: member.status } : EMPTY_BOARD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.role.trim()) e.role = "المنصب مطلوب";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className={cn(WS_GLASS_MODAL, "max-w-md space-y-4")}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <UserCheck size={18} className="text-cyan-400" />
            {member ? "تعديل عضو مجلس" : "إضافة عضو مجلس"}
          </h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">الاسم *</label>
          <input className="input-dark text-sm w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">المنصب *</label>
          <select className="input-dark text-sm w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">-- اختر --</option>
            <option>رئيس مجلس الإدارة</option>
            <option>نائب الرئيس</option>
            <option>عضو مجلس الإدارة</option>
            <option>أمين السر</option>
            <option>مستشار</option>
          </select>
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">البريد</label>
          <input type="email" className="input-dark text-sm w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">الجوال</label>
          <input type="tel" className="input-dark text-sm w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="flex gap-2">
          {(["نشط", "غير نشط"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
              className={cn("flex-1 py-2 rounded-xl text-sm border", form.status === s ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-white/50")}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function GlassNode({
  title, subtitle, count, accent, onAdd, onDelete, canManage, addLabel,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  accent: string;
  onAdd?: () => void;
  onDelete?: () => void;
  canManage: boolean;
  addLabel?: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3 min-w-[140px] max-w-[220px] text-center shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]"
      style={{ borderColor: `${accent}40`, boxShadow: `0 0 24px -8px ${accent}33` }}>
      {canManage && onDelete && (
        <button type="button" onClick={onDelete} className="absolute top-1 left-1 p-1 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20" aria-label="حذف">
          <Trash2 size={12} />
        </button>
      )}
      <div className="text-sm font-semibold text-white">{title}</div>
      {subtitle && <div className="text-[10px] text-white/60 mt-0.5">{subtitle}</div>}
      {typeof count === "number" && (
        <div className="mt-1 text-[10px] rounded-full px-2 py-0.5 inline-block" style={{ background: `${accent}22`, color: accent }}>
          {count} موظف
        </div>
      )}
      {canManage && onAdd && addLabel && (
        <button type="button" onClick={onAdd} className="mt-2 text-[10px] flex items-center justify-center gap-1 mx-auto text-cyan-300 hover:text-cyan-100">
          <Plus size={12} /> {addLabel}
        </button>
      )}
    </div>
  );
}

export default function OrgCommandBoard() {
  const toast = useToast();
  const { hasPermission, userRole } = usePermissions();
  const { planSlug, organizationId, loading: wsLoading, isInternal } = useTenantWorkspace();
  const plan = normalizePlanSlug(planSlug) as PlanSlug;
  const limits = getOrgLimits(plan);

  const canManage =
    hasPermission("manage_board") ||
    userRole === "organization_manager" ||
    userRole === "super_admin";

  const boardEnabled = !wsLoading && Boolean(organizationId);
  const { data: boardMembers, insert: insertBoard, update: updateBoard, remove: removeBoard } = useBoardMembers(boardEnabled);
  const { data: employees, refetch: refetchEmployees } = useEmployees();

  const [structure, setStructure] = useState<OrgStructureSnapshot>({ units: [], updatedAt: "" });
  const [structLoading, setStructLoading] = useState(true);
  const [savingStruct, setSavingStruct] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editBoard, setEditBoard] = useState<BoardMember | null>(null);

  const [assignEmpId, setAssignEmpId] = useState("");
  const [assignDeptId, setAssignDeptId] = useState("");
  const [assignRole, setAssignRole] = useState("employee");
  const [assigning, setAssigning] = useState(false);

  const loadStructure = useCallback(async () => {
    if (!organizationId) {
      setStructure({ units: [], updatedAt: "" });
      setStructLoading(false);
      return;
    }
    setStructLoading(true);
    try {
      const snap = await loadOrgStructure(organizationId);
      setStructure(snap);
    } catch {
      toast.error("تعذر تحميل الهيكل المحفوظ");
    } finally {
      setStructLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { void loadStructure(); }, [loadStructure]);

  const persistStructure = useCallback(async (next: OrgStructureSnapshot) => {
    setStructure(next);
    if (!organizationId) return;
    setSavingStruct(true);
    try {
      await saveOrgStructure(organizationId, next);
      toast.success("تم حفظ الهيكل في قاعدة البيانات");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ في Supabase");
    } finally {
      setSavingStruct(false);
    }
  }, [organizationId, toast]);

  const agencies = useMemo(() => structure.units.filter((u) => u.kind === "agency"), [structure.units]);
  const managements = useMemo(() => structure.units.filter((u) => u.kind === "management"), [structure.units]);
  const departments = useMemo(() => structure.units.filter((u) => u.kind === "department"), [structure.units]);

  const employeesByDept = useMemo(() => {
    const map = new Map<string, typeof employees>();
    departments.forEach((d) => map.set(d.id, []));
    employees.forEach((e) => {
      const dept = departments.find((d) => d.name === e.department);
      if (dept) {
        map.get(dept.id)?.push(e);
      }
    });
    return map;
  }, [departments, employees]);

  const unassignedEmployees = useMemo(
    () => employees.filter((e) => !departments.some((d) => d.name === e.department)),
    [employees, departments],
  );

  const tryAddUnit = (kind: OrgNodeKind, parentId: string | null) => {
    const name = window.prompt(
      kind === "agency" ? "اسم الوكالة" : kind === "management" ? "اسم الإدارة" : "اسم القسم",
    );
    if (!name?.trim()) return;

    const cap =
      kind === "agency" ? limits.agencies :
      kind === "management" ? limits.managements :
      limits.departments;
    const current = countUnits(structure.units, kind);
    if (current >= cap) {
      toast.error(`وصلت للحد الأعلى (${cap}) في باقة ${limits.label}`);
      return;
    }

    const unit = createOrgUnit(kind, name, parentId);
    void persistStructure({ ...structure, units: [...structure.units, unit] });
  };

  const removeUnit = (id: string) => {
    const ids = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      structure.units.forEach((u) => {
        if (u.parentId && ids.has(u.parentId) && !ids.has(u.id)) {
          ids.add(u.id);
          changed = true;
        }
      });
    }
    void persistStructure({ ...structure, units: structure.units.filter((u) => !ids.has(u.id)) });
  };

  const smartAlerts = useMemo(() => {
    const msgs: string[] = [];
    if (departments.length === 0) msgs.push("لا توجد أقسام بعد — أضف قسماً لبدء ربط الموظفين.");
    if (employees.length > 0 && unassignedEmployees.length > 0) {
      msgs.push(`${unassignedEmployees.length} موظف غير مربوط بقسم — عيّنهم من لوحة الإرسال.`);
    }
    if (countUnits(structure.units, "department") >= limits.departments) {
      msgs.push(`وصلت لحد الأقسام (${limits.departments}) في باقة ${limits.label}.`);
    }
    if (limits.agencies > 0 && countUnits(structure.units, "agency") === 0) {
      msgs.push("يمكنك إضافة وكالة في الباقة المتقدمة لتنظيم فرق أكبر.");
    }
    msgs.push("كل تغيير على الهيكل أو مجلس الإدارة يُحفظ تلقائياً في Supabase.");
    return msgs;
  }, [departments.length, employees.length, unassignedEmployees.length, structure.units, limits]);

  const handleAssignEmployee = async () => {
    if (!assignEmpId || !assignDeptId) {
      toast.error("اختر الموظف والقسم");
      return;
    }
    const dept = departments.find((d) => d.id === assignDeptId);
    if (!dept) return;
    setAssigning(true);
    try {
      await assignEmployeeDepartment(assignEmpId, dept.name);
      await refetchEmployees();
      toast.success("تم إرسال الموظف لمكانه في الهيكل");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحديث الموظف — قد تتطلب صلاحية أعلى");
    } finally {
      setAssigning(false);
    }
  };

  const handleBoardSave = async (data: Omit<BoardMember, "id">) => {
    if (editBoard) await updateBoard(editBoard.id, data);
    else await insertBoard(data);
    setShowBoardModal(false);
    setEditBoard(null);
  };

  if (wsLoading) {
    return (
      <div className={cn(WS_PAGE, "max-w-6xl mx-auto pb-[calc(10rem+env(safe-area-inset-bottom))] text-center text-white/60 py-16")}>
        جارٍ تحميل سياق المنشأة...
      </div>
    );
  }

  return (
    <div className={cn(WS_PAGE, "max-w-6xl mx-auto space-y-6 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-8 min-w-0 overflow-x-hidden")} dir="rtl">
      {/* Hero */}
      <section className={cn(WS_SURFACE, "relative overflow-hidden p-5 sm:p-8")}>
        <div className="pointer-events-none absolute inset-0 org-hero-aurora" aria-hidden />
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-center">
          <div className="org-hero-cube shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 text-center lg:text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200 mb-3">
              <Sparkles size={12} /> نموذج تفاعلي — مركز القيادة
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">الهيكل الإداري الذكي</h1>
            <p className="text-sm sm:text-base text-white/70 mt-2 max-w-xl">
              صمّم هيكل منشأتك بمرونة حسب حجم فريقك وباقتك
            </p>
            {isInternal && (
              <p className="text-xs text-amber-200/80 mt-2">وضع التشغيل الداخلي — تظهر بيانات منشأتك فقط (معزولة عن عملاء آخرين).</p>
            )}
          </div>
        </div>
      </section>

      {/* Package cards */}
      <section>
        <h2 className="text-white font-semibold mb-3 text-sm">اختر نمط الهيكل المناسب لك</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
          {(["basic", "growth", "advanced"] as PlanSlug[]).map((slug) => {
            const l = getOrgLimits(slug);
            const active = plan === slug;
            return (
              <div key={slug} className={cn(WS_CARD, "p-4 border", active ? "border-cyan-400/50 ring-1 ring-cyan-400/30" : "border-white/10")}>
                <div className="text-white font-bold">{l.label}</div>
                <p className="text-[11px] text-white/55 mt-2 leading-relaxed">{l.flow}</p>
                <p className="text-[10px] text-white/45 mt-2">
                  وكالة {l.agencies} · إدارة {l.managements} · قسم {l.departments}
                </p>
                <span className={cn("inline-block mt-3 text-[10px] rounded-full px-2 py-0.5", active ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5 text-white/50")}>
                  {l.badge}
                </span>
                {active && <CheckCircle2 size={16} className="text-cyan-300 mt-2" />}
              </div>
            );
          })}
        </div>
      </section>

      {/* Board */}
      <section className={cn(WS_SURFACE, "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Crown size={18} className="text-amber-300" />
              مجلس الإدارة
            </h2>
            <p className="text-xs text-white/55">الطبقة العليا — {boardMembers.length} عضو</p>
          </div>
          {canManage && (
            <button type="button" onClick={() => { setEditBoard(null); setShowBoardModal(true); }} className="btn-primary text-sm flex items-center gap-2 min-h-11 touch-manipulation">
              <Plus size={16} /> إضافة عضو مجلس
            </button>
          )}
        </div>
        {boardMembers.length === 0 ? (
          <p className="text-sm text-white/50 text-center py-6">لا يوجد أعضاء مجلس بعد</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {boardMembers.map((m) => (
              <div key={m.id} className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4 min-w-[150px] text-center relative group">
                {canManage && (
                  <div className="absolute top-2 left-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" onClick={() => { setEditBoard(m); setShowBoardModal(true); }} className="p-1 rounded bg-white/10"><Pencil size={11} /></button>
                    <button type="button" onClick={() => void removeBoard(m.id)} className="p-1 rounded bg-red-500/20"><Trash2 size={11} className="text-red-300" /></button>
                  </div>
                )}
                <div className="w-10 h-10 rounded-full mx-auto bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                  {m.name.slice(0, 2)}
                </div>
                <div className="text-white text-sm font-medium mt-2">{m.name}</div>
                <div className="text-cyan-200 text-[11px]">{m.role}</div>
                {m.email && <div className="text-[10px] text-white/45 mt-1 flex items-center justify-center gap-1"><Mail size={9} />{m.email}</div>}
                {m.phone && <div className="text-[10px] text-white/45 flex items-center justify-center gap-1"><Phone size={9} />{m.phone}</div>}
                <span className="badge text-[10px] mt-2">{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Digital tree */}
      <section className={cn(WS_SURFACE, "p-4 sm:p-5 overflow-hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-white">المخطط التنظيمي الرقمي</h2>
          {savingStruct && <span className="text-xs text-cyan-300 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> جارٍ الحفظ...</span>}
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 mb-4">
            {limits.agencies > 0 && (
              <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => tryAddUnit("agency", null)}>+ وكالة</button>
            )}
            {limits.managements > 0 && (
              <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => tryAddUnit("management", agencies[0]?.id ?? null)}>+ إدارة</button>
            )}
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => tryAddUnit("department", managements[0]?.id ?? agencies[0]?.id ?? null)}>+ قسم</button>
          </div>
        )}
        {structLoading ? (
          <p className="text-center text-white/50 py-10">جارٍ تحميل المخطط...</p>
        ) : (
          <div className="org-tree-scroll overflow-x-auto pb-2">
            <div className="min-w-[min(100%,720px)] mx-auto flex flex-col items-center gap-4">
              <GlassNode title="مجلس الإدارة" subtitle="القيادة العليا" accent="#a855f7" canManage={false} />
              <ChevronDown className="text-cyan-400/60" size={20} />
              {limits.agencies > 0 && (
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  {agencies.length === 0 ? (
                    <GlassNode title="وكالة (اختياري)" subtitle="أضف وكالة" accent="#8b5cf6" canManage={canManage} onAdd={() => tryAddUnit("agency", null)} addLabel="إضافة" />
                  ) : agencies.map((a) => (
                    <GlassNode key={a.id} title={a.name} subtitle="وكالة" accent="#8b5cf6" canManage={canManage} onDelete={() => removeUnit(a.id)} />
                  ))}
                </div>
              )}
              {limits.managements > 0 && (
                <>
                  <ChevronDown className="text-emerald-400/50" size={18} />
                  <div className="flex flex-wrap justify-center gap-3">
                    {managements.length === 0 ? (
                      <GlassNode title="إدارة (اختياري)" accent="#10b981" canManage={canManage} onAdd={() => tryAddUnit("management", agencies[0]?.id ?? null)} addLabel="إضافة إدارة" />
                    ) : managements.map((m) => (
                      <GlassNode key={m.id} title={m.name} subtitle="إدارة" accent="#10b981" canManage={canManage} onDelete={() => removeUnit(m.id)} />
                    ))}
                  </div>
                </>
              )}
              <ChevronDown className="text-cyan-400/50" size={18} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                {departments.length === 0 ? (
                  <GlassNode title="قسم" subtitle="أضف أول قسم" accent="#22d3ee" canManage={canManage} onAdd={() => tryAddUnit("department", managements[0]?.id ?? agencies[0]?.id ?? null)} addLabel="قسم جديد" />
                ) : departments.map((d) => (
                  <div key={d.id} className="space-y-2">
                    <GlassNode
                      title={d.name}
                      subtitle="قسم"
                      count={(employeesByDept.get(d.id) ?? []).length}
                      accent="#22d3ee"
                      canManage={canManage}
                      onDelete={() => removeUnit(d.id)}
                    />
                    <div className="flex flex-wrap gap-1 justify-center">
                      {(employeesByDept.get(d.id) ?? []).slice(0, 6).map((e) => (
                        <span key={e.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] flex items-center justify-center text-white" title={e.name}>
                          {e.name.slice(0, 2)}
                        </span>
                      ))}
                      {canManage && (
                        <button type="button" className="w-8 h-8 rounded-full border border-dashed border-white/30 text-white/50 flex items-center justify-center" onClick={() => { setAssignDeptId(d.id); toast.info("اختر الموظف من لوحة الإرسال"); }}>
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <section className={cn(WS_CARD, "p-4 space-y-3")}>
          <h3 className="text-white font-semibold text-sm">تجربة تعيين موظف جديد</h3>
          <p className="text-[11px] text-white/50">١ اختيار المسار · ٢ الدور · ٣ الإرسال</p>
          <select className="input-dark text-sm w-full" value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}>
            <option value="">اختر موظفاً</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="input-dark text-sm w-full" value={assignDeptId} onChange={(e) => setAssignDeptId(e.target.value)}>
            <option value="">اختر القسم</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input-dark text-sm w-full" value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
            {ASSIGNMENT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button type="button" disabled={!canManage || assigning} onClick={() => void handleAssignEmployee()} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {assigning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            إرسال الموظف لمكانه
          </button>
        </section>

        <section className={cn(WS_CARD, "p-4")}>
          <h3 className="text-white font-semibold text-sm mb-3">الأدوار المتاحة في النظام</h3>
          <ul className="space-y-2">
            {ORG_SYSTEM_ROLES.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-xs">
                <r.icon size={14} style={{ color: r.accent }} className="shrink-0 mt-0.5" />
                <div>
                  <div className="text-white/90">{r.title}</div>
                  <div className="text-white/45">{r.subtitle}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(WS_CARD, "p-4 space-y-3")}>
          <h3 className="text-white font-semibold text-sm">قواعد المرونة في الهيكل</h3>
          <ul className="text-[11px] text-white/60 space-y-1.5 list-disc list-inside">
            <li>إضافة/حذف وكالة حسب الباقة ({limits.agencies} max)</li>
            <li>إضافة/حذف إدارة حسب الباقة ({limits.managements} max)</li>
            <li>القسم أقل مستوى إداري ({limits.departments} max)</li>
            <li>الموظفون تحت الأقسام فقط</li>
            <li>نقل الموظف بين الأقسام عبر التعيين</li>
            <li>تغيير الدور دون كسر بيانات CRM/المهام</li>
          </ul>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-[11px] text-amber-100/90">
            <AlertCircle size={14} className="inline ml-1" />
            توصيات ذكية: {smartAlerts[0]}
          </div>
          <ul className="space-y-1">
            {smartAlerts.map((msg, i) => (
              <li key={i} className="text-[11px] text-cyan-100/80 flex gap-1"><Sparkles size={12} className="shrink-0" />{msg}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-center text-[10px] text-white/40 pb-2">تصميم ذكي · هيكل مرن · تحكم كامل · كل حفظ يُسجّل في Supabase</p>

      {showBoardModal && (
        <BoardMemberModal member={editBoard} onSave={handleBoardSave} onClose={() => { setShowBoardModal(false); setEditBoard(null); }} />
      )}
    </div>
  );
}
