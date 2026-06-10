"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { departmentColor } from "@/lib/services/departments";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import {
  findOrgUnitById,
  formatOrgUnitOption,
  getAssignableOrgUnits,
  resolveOrgUnitIdForEmployee,
} from "@/lib/org/orgUnits";
import { assignEmployeeToOrgUnit } from "@/lib/org/structureDb";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { WS_PAGE, WS_CARD } from "@/components/ui/workspaceVisual";
import { PageHero, KpiStatCard, WorkspaceEmpty } from "@/components/ui/workspaceUi";
import { WorkspaceCenterModal } from "@/components/ui/WorkspaceCenterModal";
import { EmployeeMobileCard } from "@/components/employees/EmployeeMobileCard";
import { EmployeeListRow } from "@/components/employees/EmployeeListRow";
import { EmployeeDetailsSheet } from "@/components/employees/EmployeeDetailsSheet";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import { PremiumRolePicker } from "@/components/ui/PremiumRolePicker";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users, Plus, Search, Star, Edit2, UserMinus, UserCheck, Unlink, X, Eye, EyeOff, List, LayoutGrid } from "lucide-react";
import {
  usePermissions,
  TENANT_ROLES,
  UserRole,
} from "@/contexts/PermissionsContext";
import { TENANT_ASSIGNABLE_ROLES, TENANT_JOB_TITLES, DEFAULT_TENANT_JOB_TITLE } from "@/lib/tenant/tenantDisplay";
import { isEmployeeActive, canonicalEmployeeStatus, employeeStatusLabel } from "@/lib/tenant/employeeStatus";
import { allowedStructureLevels } from "@/lib/org/packageHierarchy";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useEmployees, useOrgProfileIds } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import PageGuard from "@/components/ui/PageGuard";
import { createAuthUser, updateAuthUser } from "@/lib/db";
import { withSoftTimeout, withTimeout } from "@/lib/asyncHelpers";

const statusBadge = (status: string) =>
  isEmployeeActive(status) ? "status-active" : "status-inactive";

// Shown when an employee account cannot be safely controlled (incomplete linkage).
const NEEDS_LINK_MSG = "هذا الحساب يحتاج مراجعة قبل التحكم به. يرجى التواصل مع الدعم.";

function isMissingLoginProfile(message: string): boolean {
  return /المستخدم غير موجود|not found|404/i.test(message);
}


type FormState = {
  name:       string;
  email:      string;
  password:   string;
  phone:      string;
  departmentId: string;
  managerId:  string;
  role:       UserRole;
  jobTitle:   string;
  status:     "نشط" | "غير_نشط";
  salary:     string;
};

function EmployeesContent() {
  const { data: employees, loading, error, update, refetch, setData } = useEmployees();
  const { data: orgSnapshot, loading: orgLoading } = useOrgStructure(true);
  // Profile-linkage: an employee is "linked" when employees.id matches a
  // profiles.id in THIS organization (RLS scopes the set to the caller's org).
  // While the set is still loading we optimistically treat rows as linked so
  // the action buttons don't flicker disabled on first paint.
  const { ids: linkedProfileIds, loading: linkLoading } = useOrgProfileIds();
  const needsLinkEmployee = (id: string) => !linkLoading && !linkedProfileIds.has(id);
  const orgUnits = getAssignableOrgUnits(orgSnapshot?.departments ?? []);
  const { userRole, hasPermission } = usePermissions();
  const { planSlug } = useTenantWorkspace();
  const assignableRoles: UserRole[] =
    userRole === "super_admin" ? [...TENANT_ASSIGNABLE_ROLES, "super_admin"] : [...TENANT_ASSIGNABLE_ROLES];

  // Job-title tiers gated by the active subscription plan's org-structure levels
  // (موظف always; مدير المنشأة is never offered here — reserved for org_manager).
  const allowedLevels = allowedStructureLevels(planSlug);
  const availableJobTitles = TENANT_JOB_TITLES.filter(
    (t) => t.level === null || allowedLevels.includes(t.level),
  );
  const defaultDeptId = orgUnits[0]?.id ?? "";
  const toast = useToast();
  const canManageEmployees =
    userRole === "super_admin" || hasPermission("manage_users");

  const deptColorFor = (deptName: string) => {
    const unit = orgSnapshot?.departments.find((d) => d.name === deptName);
    return unit?.color ?? departmentColor(deptName);
  };

  const resolveDeptId = (emp: typeof employees[0]) => {
    const relation = orgSnapshot?.relations.find((r) => r.employee_id === emp.id);
    return resolveOrgUnitIdForEmployee(
      orgSnapshot?.departments ?? [],
      emp.department,
      relation?.department_id,
    );
  };

  // Current direct-manager link for an employee (employee_relations.manager_id).
  const resolveManagerId = (employeeId: string) =>
    orgSnapshot?.relations.find((r) => r.employee_id === employeeId)?.manager_id ?? "";

  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("الكل");
  // Status filter — defaults to "active" so soft-removed ("حذف من الفريق")
  // employees behave like an archive and don't clutter the active team list.
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "review" | "all">("active");
  // Mobile-only directory display mode. "list" = premium compact names list
  // (default, fastest to scan); "cards" = compact detail cards. Desktop table is
  // unaffected. Toggling never touches filters or counts.
  const [mobileView, setMobileView] = useState<"list" | "cards">("list");
  // Employee whose details sheet is open (opened from a list row). null = closed.
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  // Per-row busy flag for deactivate/reactivate so only the acted-on row's
  // buttons disable (the modal's `saving` flag is separate).
  const [rowBusyId,  setRowBusyId]  = useState<string | null>(null);
  const [showPass,   setShowPass]   = useState(false);
  const [legacyDeptHint, setLegacyDeptHint] = useState<string | null>(null);
  // Inline modal error — stays visible (toasts auto-dismiss) so the user sees
  // exactly why a create/save failed without the modal closing.
  const [formError, setFormError] = useState<string | null>(null);
  const showFormError = (m: string) => { setFormError(m); toast.error(m); };
  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "", phone: "", departmentId: defaultDeptId,
    managerId: "", role: "employee", jobTitle: DEFAULT_TENANT_JOB_TITLE, status: "نشط", salary: "",
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

  // The single customer-facing state of an employee row. These are mutually
  // exclusive and map 1:1 to the three labels: نشط / غير نشط / يتطلب مراجعة.
  const effectiveState = (emp: typeof employees[0]): "active" | "inactive" | "review" =>
    needsLinkEmployee(emp.id) ? "review" : isEmployeeActive(emp.status) ? "active" : "inactive";

  const statusCounts = {
    all:      employees.length,
    active:   employees.filter((e) => effectiveState(e) === "active").length,
    inactive: employees.filter((e) => effectiveState(e) === "inactive").length,
    review:   employees.filter((e) => effectiveState(e) === "review").length,
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchesStatus = statusFilter === "all" || effectiveState(e) === statusFilter;
    return matchesStatus
      && (deptFilter === "الكل" || e.department === deptFilter)
      && (e.name.toLowerCase().includes(q) || (e.email ?? "").toLowerCase().includes(q));
  });

  const emptyMessage = search.trim()
    ? "لا توجد نتائج مطابقة للبحث"
    : statusFilter === "active"   ? "لا يوجد موظفون نشطون"
    : statusFilter === "inactive" ? "لا يوجد موظفون غير نشطين"
    : statusFilter === "review"   ? "لا توجد حسابات تتطلب مراجعة"
    : "لا توجد نتائج مطابقة";

  const STATUS_FILTERS: { key: typeof statusFilter; label: string; count: number }[] = [
    { key: "active",   label: "النشطون",      count: statusCounts.active },
    { key: "inactive", label: "غير النشطين",  count: statusCounts.inactive },
    { key: "review",   label: "يتطلب مراجعة", count: statusCounts.review },
    { key: "all",      label: "الكل",         count: statusCounts.all },
  ];

  const openAdd = () => {
    setEditId(null);
    setLegacyDeptHint(null);
    setFormError(null);
    setForm({ name: "", email: "", password: "", phone: "", departmentId: defaultDeptId, managerId: "", role: "employee", jobTitle: DEFAULT_TENANT_JOB_TITLE, status: "نشط", salary: "" });
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (emp: typeof employees[0]) => {
    setEditId(emp.id);
    setFormError(null);
    const resolvedId = resolveDeptId(emp);
    setLegacyDeptHint(!resolvedId && emp.department?.trim() ? emp.department.trim() : null);
    setForm({
      name:       emp.name,
      email:      emp.email,
      password:   "",
      phone:      emp.phone || "",
      departmentId: resolvedId,
      managerId:  resolveManagerId(emp.id),
      role:       emp.role as UserRole,
      jobTitle:   emp.jobTitle || DEFAULT_TENANT_JOB_TITLE,
      // Normalize legacy/unknown status to a canonical value for the editor.
      status:     canonicalEmployeeStatus(isEmployeeActive(emp.status)),
      salary:     String(emp.salary ?? ""),
    });
    setShowPass(false);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setLegacyDeptHint(null); setFormError(null); };

  const handleSave = async () => {
    // ── client-side clean + validate ──────────────────────────────────────────
    setFormError(null);
    // eslint-disable-next-line no-control-regex
    const cleanEmail = form.email.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").trim().toLowerCase();

    if (!form.name.trim()) { showFormError("الاسم الكامل مطلوب"); return; }
    if (!form.role) { showFormError("الدور مطلوب"); return; }
    if (!assignableRoles.includes(form.role)) {
      showFormError("الدور المحدد غير مسموح به في واجهة المنشأة");
      return;
    }
    // Organizational unit is OPTIONAL — an employee can be created without it and
    // linked later from the org structure. (When a unit is chosen it is assigned.)
    if (!cleanEmail) { showFormError("البريد الإلكتروني مطلوب"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showFormError("البريد الإلكتروني غير صالح — مثال: user@domain.com");
      return;
    }
    if (!editId) {
      if (!form.password)                       { showFormError("كلمة المرور مطلوبة لإنشاء حساب جديد"); return; }
      if (form.password.length < 8)             { showFormError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
      if (!/[A-Z]/.test(form.password))         { showFormError("كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)"); return; }
      if (!/[a-z]/.test(form.password))         { showFormError("كلمة المرور يجب أن تحتوي على حرف صغير (a-z)"); return; }
      if (!/[0-9]/.test(form.password))         { showFormError("كلمة المرور يجب أن تحتوي على رقم (0-9)"); return; }
      if (!/[^A-Za-z0-9]/.test(form.password)) { showFormError("كلمة المرور يجب أن تحتوي على رمز (!@#$%^&*)"); return; }
    }

    const selectedUnit = findOrgUnitById(orgSnapshot?.departments ?? [], form.departmentId);
    const departmentLabel = selectedUnit?.name ?? "";

    setSaving(true);
    try {
      if (editId) {
        // organization_manager cannot client-write the employees table (RLS
        // allows only owner/super_admin), so this client update() is best-effort.
        // The canonical persistence — including job_title — is the service-role
        // admin API (updateAuthUser) below; never let an RLS-blocked client
        // update abort the edit.
        try {
          await update(editId, {
            name:       form.name.trim(),
            email:      cleanEmail,
            phone:      form.phone,
            department: departmentLabel,
            role:       form.role as never,
            jobTitle:   form.jobTitle,
            status:     form.status,
            salary:     form.salary ? Number(form.salary) : undefined,
          });
        } catch (clientErr) {
          console.warn("[employees] client update skipped (using admin API):", clientErr);
        }
        // Org-unit linking is non-fatal here too: an RLS/structure failure must
        // NOT abort the edit before the canonical service-role sync below runs.
        if (form.departmentId) {
          try {
            await assignEmployeeToOrgUnit({
              employee_id: editId,
              department_id: form.departmentId,
              team_id: null,
              position_id: null,
              manager_id: form.managerId || null,
            });
          } catch (assignErr) {
            console.warn("[employees] org-unit assignment (edit) failed:", assignErr);
          }
        }
        try {
          await withTimeout(
            updateAuthUser(editId, {
              role: form.role,
              department: departmentLabel,
              isActive: form.status === "نشط",
              name: form.name.trim(),
              jobTitle: form.jobTitle,
              // phone/salary persist via the service-role route (client update()
              // above is RLS-blocked for organization_manager).
              phone: form.phone || null,
              salary: form.salary ? Number(form.salary) : null,
            }),
            12_000,
            "انتهت مهلة مزامنة حساب الدخول — تحقق من اتصالك بالإنترنت",
          );
          toast.success("تم تحديث بيانات الموظف ومزامنة صلاحيات الدخول بنجاح");
        } catch (syncErr) {
          const syncMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
          if (isMissingLoginProfile(syncMsg)) {
            toast.warning(
              "تم حفظ بيانات الموظف — لا يوجد حساب دخول مرتبط بهذا السجل، لم تُحدَّث صلاحيات تسجيل الدخول",
            );
          } else {
            toast.warning(
              `تم حفظ بيانات الموظف، لكن فشلت مزامنة حساب الدخول: ${syncMsg.split("\n")[0]}`,
            );
          }
        }

        // Reflect the edit locally even if the client update() was RLS-skipped,
        // then reconcile with the DB (job_title is read back by employeeFromDB).
        setData((prev) =>
          prev.map((e) =>
            e.id === editId
              ? {
                  ...e,
                  name: form.name.trim(),
                  email: cleanEmail,
                  phone: form.phone || undefined,
                  department: departmentLabel,
                  jobTitle: form.jobTitle,
                  status: form.status,
                  salary: form.salary ? Number(form.salary) : undefined,
                }
              : e,
          ),
        );
        await withSoftTimeout(refetch(), 6_000);
      } else {
        // Hard 15-second client timeout — button NEVER hangs beyond this.
        // (Network AbortController in db.ts fires at 12 s; this is the fallback.)
        const created = await withTimeout(
          createAuthUser({
            email:      cleanEmail,
            password:   form.password,
            name:       form.name.trim(),
            // New tenant hires are always auth-role "employee" (constraint-safe,
            // no broad permissions). The organizational tier is the job title.
            role:       "employee",
            jobTitle:   form.jobTitle,
            department: departmentLabel,
            phone:      form.phone || null,
            salary:     form.salary ? Number(form.salary) : null,
            status:     form.status,
          }),
          15_000,
          "انتهت مهلة الحفظ (15 ثانية) — تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
        );
        // The auth user + profile + employee row are already created server-side.
        // Reflect that in the list immediately so the new employee never gets
        // "lost" even if a later step (org-unit link) fails.
        setData((prev) => [{
          id:             created.id,
          name:           form.name.trim(),
          email:          cleanEmail,
          role:           "employee",
          jobTitle:       form.jobTitle,
          department:     departmentLabel,
          status:         form.status,
          joinDate:       new Date().toISOString().split("T")[0],
          performance:    3,
          phone:          form.phone || undefined,
          salary:         form.salary ? Number(form.salary) : undefined,
          tasks:          0,
          completedTasks: 0,
          avatar:         undefined,
        }, ...prev]);

        // Org-unit linking is a separate, non-fatal step: the employee already
        // exists, so an assignment failure must NOT roll back or block — report
        // it clearly instead of leaving an unclear state.
        let assignWarning = "";
        if (form.departmentId) {
          try {
            await assignEmployeeToOrgUnit({
              employee_id: created.id,
              department_id: form.departmentId,
              team_id: null,
              position_id: null,
              manager_id: form.managerId || null,
            });
          } catch (assignErr) {
            assignWarning = assignErr instanceof Error ? assignErr.message : String(assignErr);
            console.warn("[employees] org-unit assignment failed:", assignErr);
          }
        }
        // Background sync with the actual DB state (soft timeout — non-blocking)
        await withSoftTimeout(refetch(), 6_000);
        if (assignWarning) {
          toast.warning(
            `تم إنشاء حساب ${form.name.trim()} بنجاح، لكن تعذّر ربطه بالوحدة التنظيمية: ${assignWarning.split("\n")[0]} — يمكنك ربطه لاحقاً من الهيكل الإداري.`,
          );
        } else {
          toast.success(`تم إنشاء حساب ${form.name.trim()} بنجاح`);
        }
      }
      closeModal();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
      // Map common Supabase / server errors to clear Arabic messages.
      // The modal stays open (closeModal only runs on success) and the message
      // is shown inline via showFormError so it does not auto-dismiss.
      let msg = raw;
      if (/مسجل مسبقاً|already|registered|exists|duplicate/i.test(raw)) {
        msg = "البريد الإلكتروني مستخدم مسبقًا. استخدم بريدًا آخر أو اربطه من لوحة المالك.";
      } else if (/غير مربوط بمنشأة|organization_id/i.test(raw)) {
        msg = "حسابك غير مربوط بمنشأة — تواصل مع الدعم قبل إضافة الموظفين.";
      } else if (/service_role|SERVICE_ROLE_KEY/i.test(raw)) {
        msg = "خطأ في إعداد الخادم — تحقق من إضافة SUPABASE_SERVICE_ROLE_KEY في Vercel";
      } else if (/invalid email/i.test(raw)) {
        msg = "البريد الإلكتروني غير صالح — تأكد من الكتابة بشكل صحيح";
      }
      showFormError(msg);
      console.error("[Employees handleSave] raw error:", raw);
    } finally {
      setSaving(false);
    }
  };

  // Soft remove ("حذف من الفريق"): deactivate/archive — never a hard delete.
  // Sets profiles.is_active=false + employees.status="غير_نشط" via the
  // service-role route (org-scoped). auth.users is preserved; the relation to
  // the org structure is kept so the employee shows as inactive, not orphaned.
  const handleDeactivate = async (emp: typeof employees[0]) => {
    if (rowBusyId) return;
    if (needsLinkEmployee(emp.id)) { toast.error(NEEDS_LINK_MSG); return; }
    if (!isEmployeeActive(emp.status)) return;
    if (!confirm(`هل تريد إزالة ${emp.name} من الفريق؟ سيتم تعطيل الحساب (بدون حذف) ويمكنك إعادة تفعيله لاحقاً.`)) return;
    setRowBusyId(emp.id);
    try {
      await withTimeout(
        updateAuthUser(emp.id, { isActive: false }),
        12_000,
        "انتهت مهلة العملية — تحقق من اتصالك بالإنترنت",
      );
      setData((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: "غير_نشط" } : e)));
      toast.success(`تم إزالة ${emp.name} من الفريق (تعطيل بدون حذف)`);
      await withSoftTimeout(refetch(), 6_000);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "تعذر تنفيذ العملية";
      toast.error(
        isMissingLoginProfile(raw)
          ? "لا يوجد حساب دخول مرتبط بهذا الموظف لتعطيله"
          : raw.split("\n")[0],
      );
      console.error("[Employee Deactivate Error]", err);
    } finally {
      setRowBusyId(null);
    }
  };

  // Reactivate ("تفعيل الموظف"): restore active state (mirror of deactivate).
  const handleReactivate = async (emp: typeof employees[0]) => {
    if (rowBusyId) return;
    if (needsLinkEmployee(emp.id)) { toast.error(NEEDS_LINK_MSG); return; }
    if (isEmployeeActive(emp.status)) return;
    setRowBusyId(emp.id);
    try {
      await withTimeout(
        updateAuthUser(emp.id, { isActive: true }),
        12_000,
        "انتهت مهلة العملية — تحقق من اتصالك بالإنترنت",
      );
      setData((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: "نشط" } : e)));
      toast.success(`تم تفعيل ${emp.name} بنجاح`);
      await withSoftTimeout(refetch(), 6_000);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "تعذر تنفيذ العملية";
      toast.error(
        isMissingLoginProfile(raw)
          ? "لا يوجد حساب دخول مرتبط بهذا الموظف لتفعيله"
          : raw.split("\n")[0],
      );
      console.error("[Employee Reactivate Error]", err);
    } finally {
      setRowBusyId(null);
    }
  };

  const stats = {
    total:  employees.length,
    active: employees.filter((e) => effectiveState(e) === "active").length,
    depts:  orgUnits.length || new Set(employees.map((e) => e.department)).size,
  };

  const filterDepts = ["الكل", ...orgUnits.map((d) => d.name)];

  return (
    <DashboardLayout>
      <div className={cn(WS_PAGE, "min-w-0 max-w-full overflow-x-hidden")}>
        <PageHero title="إدارة الموظفين" subtitle="إدارة بيانات فريق العمل">
          {canManageEmployees && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 min-h-11 touch-manipulation">
              <Plus size={16} />
              إضافة موظف
            </button>
          )}
        </PageHero>

        {/* Mobile: premium compact summary header (< sm) — total / active / review.
            Dark glass with a subtle cyan glow; no tall vertical KPI cards. */}
        <div className="sm:hidden relative overflow-hidden rounded-2xl border border-[#1e3a5f] bg-gradient-to-br from-[#0d1f3c]/80 to-[#0a1628]/80">
          <div className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="relative grid grid-cols-3 divide-x divide-x-reverse divide-[#1e3a5f]/70">
            <div className="flex flex-col items-center justify-center py-3">
              <span className="text-white font-bold text-lg leading-none">{stats.total}</span>
              <span className="text-[#8ba3c7] text-[11px] mt-1">إجمالي</span>
            </div>
            <div className="flex flex-col items-center justify-center py-3">
              <span className="text-emerald-400 font-bold text-lg leading-none">{statusCounts.active}</span>
              <span className="text-[#8ba3c7] text-[11px] mt-1">نشط</span>
            </div>
            <div className="flex flex-col items-center justify-center py-3">
              <span className="text-amber-300 font-bold text-lg leading-none">{statusCounts.review}</span>
              <span className="text-[#8ba3c7] text-[11px] mt-1">مراجعة</span>
            </div>
          </div>
        </div>
        {/* Desktop/tablet: full KPI cards (sm+) */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 min-w-0">
          <KpiStatCard label="إجمالي الموظفين" value={String(stats.total)} icon={Users} accent="cyan" showLive={false} showSparkline={false} />
          <KpiStatCard label="الموظفون النشطون" value={String(stats.active)} icon={Users} accent="emerald" showLive={false} showSparkline={false} />
          <KpiStatCard label="الأقسام" value={String(stats.depts)} icon={Users} accent="sky" showLive={false} showSparkline={false} />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search + status segmented control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative sm:flex-1 sm:max-w-xs">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
              <input
                className="input-dark pr-9 py-2 text-sm w-full"
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] p-1 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-9",
                    statusFilter === f.key
                      ? "bg-[#22d3ee] text-[#0a1628]"
                      : "text-[#8ba3c7] hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-[10px] px-1.5 min-w-5",
                      statusFilter === f.key ? "bg-[#0a1628]/20 text-[#0a1628]" : "bg-white/[0.06] text-[#8ba3c7]",
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Department chips */}
          {filterDepts.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {filterDepts.map((d) => (
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
          )}
        </div>

        {error && (
          <div className={cn(WS_CARD, "p-4 border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3")}>
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

        {!loading && employees.length === 0 && !error && (
          <WorkspaceEmpty
            icon={Users}
            title="لا يوجد موظفون بعد"
            subtitle="ابدأ ببناء فريق عملك بإضافة أول موظف"
            accent="violet"
            action={
              canManageEmployees ? (
                <button onClick={openAdd} className="btn-primary flex items-center gap-2 min-h-11 touch-manipulation">
                  <Plus size={16} />
                  إضافة موظف
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && employees.length > 0 && (
          <>
            {/* Mobile/tablet: smart directory (list ↔ cards). Hidden on desktop. */}
            <div className="lg:hidden space-y-3 min-w-0">
              {/* View toggle — قائمة ذكية / بطاقات */}
              <div className="flex items-center gap-1 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  aria-pressed={mobileView === "list"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-9",
                    mobileView === "list"
                      ? "bg-[#22d3ee] text-[#0a1628]"
                      : "text-[#8ba3c7] hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  <List size={14} />
                  قائمة ذكية
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("cards")}
                  aria-pressed={mobileView === "cards"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-9",
                    mobileView === "cards"
                      ? "bg-[#22d3ee] text-[#0a1628]"
                      : "text-[#8ba3c7] hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  <LayoutGrid size={14} />
                  بطاقات
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className={cn(WS_CARD, "py-10 text-center text-[#8ba3c7] text-sm")}>
                  {emptyMessage}
                </div>
              ) : mobileView === "list" ? (
                <div className="space-y-2 min-w-0">
                  {filtered.map((emp) => (
                    <EmployeeListRow
                      key={emp.id}
                      emp={emp}
                      needsLink={needsLinkEmployee(emp.id)}
                      departmentColorFn={deptColorFor}
                      onDetails={() => setDetailsId(emp.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 min-w-0">
                  {filtered.map((emp) => (
                    <EmployeeMobileCard
                      key={emp.id}
                      emp={emp}
                      canManage={canManageEmployees}
                      busy={rowBusyId === emp.id}
                      needsLink={needsLinkEmployee(emp.id)}
                      departmentColorFn={deptColorFor}
                      onEdit={() => openEdit(emp)}
                      onDeactivate={() => handleDeactivate(emp)}
                      onReactivate={() => handleReactivate(emp)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className={cn(WS_CARD, "overflow-hidden p-0 hidden lg:block")}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f] bg-white/[0.02]">
                  <th className="text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الموظف</th>
                  <th className="hidden xl:table-cell text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">البريد</th>
                  <th className="text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الوحدة التنظيمية</th>
                  <th className="text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الدور الوظيفي</th>
                  <th className="text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الحالة</th>
                  <th className="hidden xl:table-cell text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">المهام</th>
                  <th className="hidden xl:table-cell text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الأداء</th>
                  <th className="hidden 2xl:table-cell text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">تاريخ الانضمام</th>
                  <th className="text-right text-[#8ba3c7] font-medium text-xs px-4 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    {/* الموظف */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${deptColorFor(emp.department)},#0a1628)` }}
                        >
                          {emp.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{emp.name}</div>
                          {/* Email shown here only when the dedicated البريد column is hidden */}
                          <div className="xl:hidden text-xs text-[#8ba3c7] truncate" dir="ltr">{emp.email}</div>
                          <div className="mt-0.5">
                            <PublicCodeBadge code={emp.publicCode} />
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* البريد */}
                    <td className="hidden xl:table-cell px-4 py-3">
                      <span className="text-[#8ba3c7] text-xs truncate inline-block max-w-[200px] align-middle" dir="ltr">{emp.email}</span>
                    </td>
                    {/* الوحدة التنظيمية */}
                    <td className="px-4 py-3">
                      <span className="badge text-xs max-w-[160px] truncate inline-block align-middle" style={{ background: `${deptColorFor(emp.department)}20`, color: deptColorFor(emp.department) }}>
                        {emp.department || "—"}
                      </span>
                    </td>
                    {/* الدور الوظيفي */}
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{emp.jobTitle || getTenantRoleLabel(emp.role)}</td>
                    {/* الحالة */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`badge ${statusBadge(emp.status)}`}>
                          {employeeStatusLabel(emp.status)}
                        </span>
                        {needsLinkEmployee(emp.id) && (
                          <span className="badge bg-amber-500/10 text-amber-300 flex items-center gap-1" title={NEEDS_LINK_MSG}>
                            <Unlink size={11} />
                            يتطلب مراجعة
                          </span>
                        )}
                      </div>
                    </td>
                    {/* المهام */}
                    <td className="hidden xl:table-cell px-4 py-3 whitespace-nowrap">
                      <span className="text-white">{emp.completedTasks ?? 0}</span>
                      <span className="text-[#8ba3c7]">/{emp.tasks ?? 0}</span>
                    </td>
                    {/* الأداء */}
                    <td className="hidden xl:table-cell px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={12} fill={s <= (emp.performance ?? 0) ? "#fbbf24" : "none"} className={s <= (emp.performance ?? 0) ? "text-amber-400" : "text-[#1e3a5f]"} />
                        ))}
                      </div>
                    </td>
                    {/* تاريخ الانضمام */}
                    <td className="hidden 2xl:table-cell px-4 py-3 text-[#8ba3c7] text-xs whitespace-nowrap">{emp.joinDate}</td>
                    {/* الإجراءات */}
                    <td className="px-4 py-3">
                      {canManageEmployees && (() => {
                        const broken = needsLinkEmployee(emp.id);
                        const rowDisabled = rowBusyId === emp.id || broken;
                        return (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(emp)} aria-label="تعديل الموظف" title={broken ? NEEDS_LINK_MSG : "تعديل"} disabled={rowDisabled} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                              <Edit2 size={14} />
                            </button>
                            {isEmployeeActive(emp.status) ? (
                              <button onClick={() => handleDeactivate(emp)} aria-label="حذف من الفريق" title={broken ? NEEDS_LINK_MSG : "حذف من الفريق"} disabled={rowDisabled} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                <UserMinus size={14} />
                              </button>
                            ) : (
                              <button onClick={() => handleReactivate(emp)} aria-label="تفعيل الموظف" title={broken ? NEEDS_LINK_MSG : "تفعيل الموظف"} disabled={rowDisabled} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                <UserCheck size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#8ba3c7]">
                <p className="text-sm">{emptyMessage}</p>
              </div>
            )}
          </div>
          </>
        )}
      </div>

      {/* Mobile details sheet — opened from a "قائمة ذكية" row */}
      {detailsId && (() => {
        const emp = employees.find((e) => e.id === detailsId);
        if (!emp) return null;
        return (
          <EmployeeDetailsSheet
            emp={emp}
            canManage={canManageEmployees}
            needsLink={needsLinkEmployee(emp.id)}
            busy={rowBusyId === emp.id}
            departmentColorFn={deptColorFor}
            onClose={() => setDetailsId(null)}
            onEdit={() => { setDetailsId(null); openEdit(emp); }}
            onDeactivate={() => { setDetailsId(null); handleDeactivate(emp); }}
            onReactivate={() => { setDetailsId(null); handleReactivate(emp); }}
          />
        );
      })()}

      {/* Add / edit modal — centered glass */}
      <WorkspaceCenterModal
        open={showModal}
        onClose={closeModal}
        title={editId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الحفظ..." : editId ? "حفظ التعديلات" : "إضافة الموظف"}
            </button>
            <button onClick={closeModal} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
          </div>
        }
      >
            <div className="space-y-3">
              {editId && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <span className="text-[11px] text-[#8ba3c7]">حالة الحساب</span>
                  {needsLinkEmployee(editId) ? (
                    <span className="badge text-[10px] bg-amber-500/10 text-amber-300 flex items-center gap-1">
                      <Unlink size={10} />
                      يتطلب مراجعة
                    </span>
                  ) : (
                    <span className="badge text-[10px] status-active">مكتمل</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">الاسم الكامل *</label>
                  <input className="input-dark text-sm" placeholder="الاسم" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">البريد الإلكتروني *</label>
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
                  <label className="block text-xs text-[#8ba3c7] mb-1">كلمة المرور *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">رقم الهاتف</label>
                  <input className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">الراتب (SAR)</label>
                  <input className="input-dark text-sm" type="number" placeholder="0" value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1">الوحدة التنظيمية (اختياري)</label>
                  {orgLoading ? (
                    <div className="input-dark text-sm text-[#8ba3c7] px-3 py-2.5 rounded-xl">
                      جارٍ تحميل وحدات الهيكل...
                    </div>
                  ) : orgUnits.length === 0 ? (
                    <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-100/90 leading-relaxed">
                      يمكنك إضافة الموظف الآن وربطه بوحدة تنظيمية لاحقاً من{" "}
                      <Link href="/org" className="text-[#22d3ee] underline underline-offset-2">
                        الهيكل الإداري
                      </Link>
                    </div>
                  ) : (
                    <PremiumRolePicker
                      hideLabel
                      label="الوحدة التنظيمية"
                      value={form.departmentId}
                      placeholder="— اختر الوحدة —"
                      options={orgUnits.map((d) => ({ value: d.id, label: formatOrgUnitOption(d) }))}
                      onChange={(v) => setForm({ ...form, departmentId: v })}
                    />
                  )}
                  {legacyDeptHint && (
                    <p className="text-[10px] text-amber-200/90 mt-1.5 leading-relaxed">
                      القسم الحالي: {legacyDeptHint} — اختر وحدة من الهيكل الإداري للربط
                    </p>
                  )}
                </div>
                <div>
                  <PremiumRolePicker
                    label="الدور الوظيفي"
                    required
                    value={form.jobTitle}
                    options={(() => {
                      const opts = availableJobTitles.map((t) => ({ value: t.value, label: t.label }));
                      // Keep an existing (possibly higher-tier) job title visible when editing,
                      // even if the current plan would otherwise hide it.
                      if (form.jobTitle && !opts.some((o) => o.value === form.jobTitle)) {
                        opts.unshift({ value: form.jobTitle, label: form.jobTitle });
                      }
                      return opts;
                    })()}
                    onChange={(v) => setForm({ ...form, jobTitle: v })}
                  />
                </div>
              </div>

              {/* Direct manager (المدير المباشر) — optional, same org only.
                  Candidates are the org's own employees, excluding this person. */}
              <div>
                <PremiumRolePicker
                  label="المدير المباشر (اختياري)"
                  value={form.managerId}
                  placeholder="— بدون مدير مباشر —"
                  options={[
                    { value: "", label: "— بدون مدير مباشر —" },
                    ...employees
                      .filter((e) => e.id !== editId)
                      .map((e) => ({
                        value: e.id,
                        label: e.jobTitle ? `${e.name} · ${e.jobTitle}` : e.name,
                      })),
                  ]}
                  onChange={(v) => setForm({ ...form, managerId: v })}
                />
              </div>

              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1">الحالة</label>
                <select className="input-dark text-sm" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "نشط" | "غير_نشط" })}>
                  <option value="نشط">نشط</option>
                  <option value="غير_نشط">غير نشط</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 leading-relaxed">
                {formError}
              </div>
            )}
      </WorkspaceCenterModal>
    </DashboardLayout>
  );
}

function EmployeesPageGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission } = usePermissions();
  const allowed =
    hasPermission("view_employees") || hasPermission("manage_users");
  if (allowed) return <>{children}</>;
  return <PageGuard permission="view_employees">{null}</PageGuard>;
}

export default function EmployeesPage() {
  return (
    <EmployeesPageGuard>
      <EmployeesContent />
    </EmployeesPageGuard>
  );
}
