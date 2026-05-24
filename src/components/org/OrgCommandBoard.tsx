"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, X, Save, UserCheck, Mail, Phone,
  Sparkles, AlertCircle,
  Loader2, Send,
} from "lucide-react";
import OrgDigitalChartSection from "@/components/org/OrgDigitalChartSection";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useBoardMembers, useEmployees } from "@/hooks/useData";
import { type BoardMember } from "@/lib/db";
import {
  assignEmployeeToOrgUnit,
  employeesNotInOrgUnits,
  fetchEmployeesByOrgUnits,
  fetchOrgUnitMembers,
} from "@/lib/org/orgUnitsDb";
import { normalizePlanSlug, type PlanSlug } from "@/lib/features/packageFeatures";
import OrgPackageCards from "@/components/org/OrgPackageCards";
import { getOrgLimits } from "@/lib/org/orgPackageLimits";
import { loadOrgStructure, type OrgStructureSnapshot, type OrgUnitNode } from "@/lib/org/orgStructure";
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
  const [employeesByDept, setEmployeesByDept] = useState<Map<string, typeof employees>>(new Map());
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editBoard, setEditBoard] = useState<BoardMember | null>(null);

  const [assignEmpId, setAssignEmpId] = useState("");
  const [assignDeptId, setAssignDeptId] = useState("");
  const [assignRole, setAssignRole] = useState("employee");
  const [assigning, setAssigning] = useState(false);

  const loadStructure = useCallback(async () => {
    if (!organizationId) {
      setStructure({ units: [], updatedAt: "" });
      setEmployeesByDept(new Map());
      setStructLoading(false);
      return;
    }
    setStructLoading(true);
    try {
      const snap = await loadOrgStructure(organizationId);
      setStructure(snap);
      const byUnit = await fetchEmployeesByOrgUnits(organizationId, employees);
      setEmployeesByDept(byUnit);
    } catch {
      toast.error("تعذر تحميل الهيكل من org_units");
    } finally {
      setStructLoading(false);
    }
  }, [organizationId, employees, toast]);

  useEffect(() => { void loadStructure(); }, [loadStructure]);

  const reloadStructure = useCallback(async () => {
    if (!organizationId) return;
    setSavingStruct(true);
    try {
      await loadStructure();
    } finally {
      setSavingStruct(false);
    }
  }, [organizationId, loadStructure]);

  const agencies = useMemo(() => structure.units.filter((u) => u.kind === "agency"), [structure.units]);
  const managements = useMemo(() => structure.units.filter((u) => u.kind === "management"), [structure.units]);
  const departments = useMemo(() => structure.units.filter((u) => u.kind === "department"), [structure.units]);

  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    if (!organizationId) {
      setUnassignedCount(0);
      return;
    }
    void fetchOrgUnitMembers(organizationId).then((members) => {
      setUnassignedCount(employeesNotInOrgUnits(employees, members).length);
    });
  }, [organizationId, employees]);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ id: d.id, name: d.name })),
    [departments],
  );

  const assignPanelRef = React.useRef<HTMLElement | null>(null);

  const handleAssignEmployee = async () => {
    if (!assignEmpId || !assignDeptId) {
      toast.error("اختر الموظف والقسم");
      return;
    }
    if (!organizationId) return;
    const dept = departmentOptions.find((d) => d.id === assignDeptId);
    if (!dept) return;
    setAssigning(true);
    try {
      await assignEmployeeToOrgUnit(organizationId, assignEmpId, assignDeptId, assignRole);
      await refetchEmployees();
      await reloadStructure();
      toast.success("تم ربط الموظف بالقسم في org_unit_members");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر ربط الموظف");
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">الهيكل الإداري التشغيلي</h1>
            <p className="text-sm sm:text-base text-white/70 mt-2 max-w-xl">
              مركز بناء المنشأة — مجلس الإدارة والموظفون من قاعدة البيانات؛ الوحدات التنظيمية مسودة حتى جدول org_units
            </p>
            {isInternal && (
              <p className="text-xs text-amber-200/80 mt-2">وضع التشغيل الداخلي — تظهر بيانات منشأتك فقط (معزولة عن عملاء آخرين).</p>
            )}
          </div>
        </div>
      </section>

      <OrgPackageCards
        activePlan={plan}
        usage={{
          agencies: agencies.length,
          managements: managements.length,
          departments: departments.length,
        }}
      />

      {organizationId && (
      <OrgDigitalChartSection
        organizationId={organizationId}
        plan={plan}
        limits={limits}
        canManage={canManage}
        structure={structure}
        structLoading={structLoading}
        savingStruct={savingStruct}
        employees={employees}
        boardMembers={boardMembers}
        employeesByDept={employeesByDept}
        departments={departments}
        unassignedCount={unassignedCount}
        onReloadStructure={reloadStructure}
        onAddBoardMember={() => {
          setEditBoard(null);
          setShowBoardModal(true);
        }}
        onEditBoardMember={(m) => {
          setEditBoard(m);
          setShowBoardModal(true);
        }}
        onDeleteBoardMember={(id) => void removeBoard(id)}
        onRequestAssignEmployee={() => {
          assignPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          toast.info("اختر الموظف والقسم من لوحة الإرسال أدناه");
        }}
        onAssignToDept={(deptId) => {
          setAssignDeptId(deptId);
          assignPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          toast.info("اختر الموظف من لوحة الإرسال");
        }}
      />
      )}

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <section ref={assignPanelRef} className={cn(WS_CARD, "p-4 space-y-3 scroll-mt-24")}>
          <h3 className="text-white font-semibold text-sm">تعيين موظف لقسم</h3>
          <p className="text-[11px] text-white/50">يحفظ في org_unit_members (مصدر الهيكل التشغيلي)</p>
          <select className="input-dark text-sm w-full" value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}>
            <option value="">اختر موظفاً</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="input-dark text-sm w-full" value={assignDeptId} onChange={(e) => setAssignDeptId(e.target.value)}>
            <option value="">اختر القسم</option>
            {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            التوصيات الذكية والتنبيهات تظهر داخل قسم «المخطط التنظيمي الرقمي» أعلاه.
          </div>
        </section>
      </div>

      <p className="text-center text-[10px] text-white/40 pb-2">
        مجلس الإدارة: board_members · الهيكل: org_units · الموظفون: org_unit_members
      </p>

      {showBoardModal && (
        <BoardMemberModal member={editBoard} onSave={handleBoardSave} onClose={() => { setShowBoardModal(false); setEditBoard(null); }} />
      )}
    </div>
  );
}
