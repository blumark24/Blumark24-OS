"use client";

import { useMemo, useState, useEffect } from "react";
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
import { useEmployees, useOrgProfileIds, useTasks } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import PageGuard from "@/components/ui/PageGuard";
import { createAuthUser, updateAuthUser } from "@/lib/db";
import { withSoftTimeout, withTimeout } from "@/lib/asyncHelpers";
import { createOrgScopeResolver } from "@/lib/org/orgScopeResolver";

const statusBadge = (status: string) =>
  isEmployeeActive(status) ? "status-active" : "status-inactive";

// Shown when an employee account cannot be safely controlled (incomplete linkage).
const NEEDS_LINK_MSG = "هذا الحساب يحتاج مراجعة قبل التحكم به. يرجى التواصل مع الدعم.";

type PresenceTone = "green" | "cyan" | "amber" | "red" | "violet" | "orange" | "gray";

const PRESENCE_TONE_CLASS: Record<PresenceTone, string> = {
  green: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  red: "border-red-300/20 bg-red-500/10 text-red-100",
  violet: "border-violet-300/20 bg-violet-500/10 text-violet-100",
  orange: "border-orange-300/20 bg-orange-400/10 text-orange-100",
  gray: "border-slate-300/15 bg-white/[0.045] text-slate-200",
};

const PRESENCE_DOT_CLASS: Record<PresenceTone, string> = {
  green: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.45)]",
  cyan: "bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.45)]",
  amber: "bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.45)]",
  red: "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.45)]",
  violet: "bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.45)]",
  orange: "bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.45)]",
  gray: "bg-slate-400",
};

const PRESENCE_LEGEND: { label: string; description: string; tone: PresenceTone }[] = [
  { label: "نشط", description: "نشط ومستقر", tone: "green" },
  { label: "يعمل الآن", description: "لديه مهمة قيد التنفيذ", tone: "cyan" },
  { label: "ضغط عالي", description: "حمل مهام نشط مرتفع", tone: "amber" },
  { label: "خطر تأخير", description: "لديه مهمة متأخرة", tone: "red" },
  { label: "ينتظر مراجعة", description: "لديه مهام بانتظار مراجعة", tone: "violet" },
  { label: "خارج الهيكل", description: "يحتاج ربط إداري", tone: "orange" },
  { label: "غير نشط", description: "حسابه غير نشط", tone: "gray" },
];

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
  const { data: tasks } = useTasks();
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
  const [showPresenceDock, setShowPresenceDock] = useState(false);
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

  const orgResolver = useMemo(
    () => createOrgScopeResolver(orgSnapshot, employees),
    [orgSnapshot, employees],
  );

  const presencePreview = useMemo(() => {
    const taskStatsByEmployee = new Map<string, { active: number; running: number; late: number; review: number }>();
    const ensureStats = (key: string) => {
      const current = taskStatsByEmployee.get(key) ?? { active: 0, running: 0, late: 0, review: 0 };
      taskStatsByEmployee.set(key, current);
      return current;
    };
    const taskIsLate = (dueDate: string, status: string) => {
      if (status === "مكتملة") return false;
      if (status === "متأخرة") return true;
      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) return false;
      return due < new Date();
    };

    tasks.forEach((task) => {
      if (task.status === "مكتملة") return;
      const scope = orgResolver.resolveTaskAssignee(task);
      const key = scope.employeeId ?? task.assigneeId ?? task.assigneeName;
      if (!key) return;
      const stats = ensureStats(key);
      stats.active += 1;
      if (task.status === "قيد_التنفيذ") stats.running += 1;
      if (task.status === "بانتظار_المراجعة") stats.review += 1;
      if (taskIsLate(task.dueDate, task.status)) stats.late += 1;
    });

    const rows = employees.map((employee) => {
      const scope = orgResolver.resolveEmployee(employee);
      const taskStats = taskStatsByEmployee.get(employee.id) ?? taskStatsByEmployee.get(employee.name) ?? { active: 0, running: 0, late: 0, review: 0 };
      const state = !linkLoading && !linkedProfileIds.has(employee.id)
        ? "review"
        : isEmployeeActive(employee.status)
          ? "active"
          : "inactive";
      const outsideStructure = !scope.isLinkedToOrg;
      const highWorkload = taskStats.active >= 4;
      const inactive = state === "inactive";
      const signal = inactive
        ? { label: "غير نشط", tone: "gray" as PresenceTone }
        : outsideStructure
          ? { label: "خارج الهيكل", tone: "orange" as PresenceTone }
          : state === "review"
            ? { label: "يحتاج مراجعة", tone: "orange" as PresenceTone }
            : taskStats.late > 0
              ? { label: "خطر تأخير", tone: "red" as PresenceTone }
              : taskStats.review > 0
                ? { label: "ينتظر مراجعة", tone: "violet" as PresenceTone }
                : highWorkload
                  ? { label: "ضغط عالي", tone: "amber" as PresenceTone }
                  : taskStats.running > 0
                    ? { label: "يعمل الآن", tone: "cyan" as PresenceTone }
                    : { label: "مستقر", tone: "green" as PresenceTone };
      return {
        id: employee.id,
        name: employee.name,
        department: scope.departmentLabel,
        manager: scope.managerName,
        state,
        activeTasks: taskStats.active,
        runningTasks: taskStats.running,
        lateTasks: taskStats.late,
        reviewTasks: taskStats.review,
        outsideStructure,
        highWorkload,
        signal,
      };
    });

    const priorityWeight = (row: typeof rows[number]) =>
      (row.lateTasks > 0 ? 50 : 0) +
      (row.outsideStructure ? 40 : 0) +
      (row.highWorkload ? 30 : 0) +
      (row.reviewTasks > 0 ? 20 : 0) +
      row.activeTasks;
    const priorityRows = rows
      .filter((row) => row.lateTasks > 0 || row.outsideStructure || row.highWorkload || row.reviewTasks > 0)
      .sort((a, b) => priorityWeight(b) - priorityWeight(a))
      .slice(0, 8);
    const departmentMap = rows.reduce((acc, row) => {
      const department = row.department || "غير محدد";
      const current = acc.get(department) ?? { department, total: 0, late: 0, outside: 0, review: 0 };
      current.total += 1;
      if (row.lateTasks > 0) current.late += 1;
      if (row.outsideStructure) current.outside += 1;
      if (row.reviewTasks > 0) current.review += 1;
      acc.set(department, current);
      return acc;
    }, new Map<string, { department: string; total: number; late: number; outside: number; review: number }>());
    const departmentDistribution = Array.from(departmentMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    return {
      rows,
      byId: new Map(rows.map((row) => [row.id, row])),
      priorityRows,
      departmentDistribution,
      outsideStructure: rows.filter((row) => row.outsideStructure).length,
      highWorkload: rows.filter((row) => row.highWorkload).length,
      active: rows.filter((row) => row.state === "active").length,
      inactive: rows.filter((row) => row.state === "inactive").length,
      workingNow: rows.filter((row) => row.runningTasks > 0 && row.state !== "inactive").length,
      delayRisk: rows.filter((row) => row.lateTasks > 0 && row.state !== "inactive").length,
      needsReview: rows.filter((row) => row.state === "review" || row.outsideStructure).length,
    };
  }, [employees, linkLoading, linkedProfileIds, orgResolver, tasks]);

  const presenceChip = (presence?: typeof presencePreview.rows[number]) => {
    if (!presence) return null;
    const showText = presence.signal.tone !== "green";
    return (
      <span
        className={cn(
          "pointer-events-none inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] leading-none shadow-[0_8px_20px_rgba(0,0,0,0.18)]",
          PRESENCE_TONE_CLASS[presence.signal.tone],
        )}
        title={presence.signal.label}
        aria-label={`الحضور الذكي: ${presence.signal.label}`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", PRESENCE_DOT_CLASS[presence.signal.tone])} />
        {showText && <span>{presence.signal.label}</span>}
      </span>
    );
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
      setData((prev) => prev.filter((e) => e.id !== emp.id));
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

        {!loading && employees.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#1e3a5f]/80 bg-[#0d1f3c]/45 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] sm:flex sm:items-center sm:gap-2 sm:text-xs">
              <div className="rounded-xl bg-emerald-400/10 px-2 py-1.5 text-emerald-100"><strong className="block text-sm text-white sm:inline sm:text-xs">{presencePreview.active}</strong> النشطون</div>
              <div className="rounded-xl bg-cyan-400/10 px-2 py-1.5 text-cyan-100"><strong className="block text-sm text-white sm:inline sm:text-xs">{presencePreview.workingNow}</strong> يعملون الآن</div>
              <div className="rounded-xl bg-red-500/10 px-2 py-1.5 text-red-100"><strong className="block text-sm text-white sm:inline sm:text-xs">{presencePreview.delayRisk}</strong> خطر تأخير</div>
              <div className="rounded-xl bg-orange-400/10 px-2 py-1.5 text-orange-100"><strong className="block text-sm text-white sm:inline sm:text-xs">{presencePreview.needsReview}</strong> خارج الهيكل</div>
            </div>
            <button
              type="button"
              onClick={() => setShowPresenceDock(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400/15"
            >
              عرض الحضور الذكي
            </button>
          </div>
        )}

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
            <div className="lg:hidden space-y-3 min-w-0 pb-28">
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
                  {filtered.map((emp) => {
                    const presence = presencePreview.byId.get(emp.id);
                    return (
                      <div key={emp.id} className="relative">
                        <span className="absolute left-9 top-2 z-10">{presenceChip(presence)}</span>
                        <EmployeeListRow
                          emp={emp}
                          needsLink={needsLinkEmployee(emp.id)}
                          departmentColorFn={deptColorFor}
                          onDetails={() => setDetailsId(emp.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 min-w-0">
                  {filtered.map((emp) => {
                    const presence = presencePreview.byId.get(emp.id);
                    return (
                      <div key={emp.id} className="relative">
                        <span className="absolute left-3 top-3 z-10">{presenceChip(presence)}</span>
                        <EmployeeMobileCard
                          emp={emp}
                          canManage={canManageEmployees}
                          busy={rowBusyId === emp.id}
                          needsLink={needsLinkEmployee(emp.id)}
                          departmentColorFn={deptColorFor}
                          onEdit={() => openEdit(emp)}
                          onDeactivate={() => handleDeactivate(emp)}
                          onReactivate={() => handleReactivate(emp)}
                        />
                      </div>
                    );
                  })}
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
                {filtered.map((emp) => {
                  const presence = presencePreview.byId.get(emp.id);
                  return (
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
                          {presence && (
                            <div className={cn("mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]", PRESENCE_TONE_CLASS[presence.signal.tone])}>
                              <span className={cn("h-2 w-2 rounded-full", PRESENCE_DOT_CLASS[presence.signal.tone])} />
                              {presence.signal.label}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* البريد */}
                    <td className="hidden xl:table-cell px-4 py-3">
                      <span className="text-[#8ba3c7] text-xs truncate inline-block max-w-[200px] align-middle" dir="ltr">{emp.email}</span>
                    </td>
                    {/* الوحدة التنظيمية */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="badge text-xs max-w-[160px] truncate inline-block align-middle" style={{ background: `${deptColorFor(emp.department)}20`, color: deptColorFor(emp.department) }}>
                          {presence?.department || emp.department || "غير محدد"}
                        </span>
                      </div>
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
                          <span className="badge bg-orange-500/10 text-orange-300 flex items-center gap-1" title={NEEDS_LINK_MSG}>
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
                  );
                })}
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
      {showPresenceDock && (
        <div className="fixed inset-0 z-50 bg-[#020817]/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="إغلاق الحضور الذكي"
            className="absolute inset-0 cursor-default"
            onClick={() => setShowPresenceDock(false)}
          />
          <aside className="absolute inset-y-0 right-0 h-full w-full overflow-y-auto border-l border-cyan-300/15 bg-[#071527] shadow-[-24px_0_80px_rgba(0,0,0,0.42)] sm:max-w-xl">
            <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#071527]/92 px-4 py-4 backdrop-blur-xl sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">الحضور الذكي — معاينة تشغيلية</h2>
                  <p className="mt-1 text-xs leading-5 text-[#8ba3c7]">
                    هذه قراءة تشغيلية من حالة الموظف والمهام والهيكل فقط. لا يوجد حضور وانصراف فعلي في هذه المرحلة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPresenceDock(false)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-[#8ba3c7] transition-colors hover:text-white"
                  aria-label="إغلاق"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <section className="rounded-2xl border border-cyan-300/12 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_40%),rgba(255,255,255,0.035)] p-3">
                <div className="mb-3 text-xs font-bold text-cyan-100">ملخص الحضور الذكي</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"><strong className="block text-lg text-white">{presencePreview.active}</strong>نشط</div>
                  <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100"><strong className="block text-lg text-white">{presencePreview.workingNow}</strong>يعمل الآن</div>
                  <div className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-100"><strong className="block text-lg text-white">{presencePreview.highWorkload}</strong>ضغط عالي</div>
                  <div className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-100"><strong className="block text-lg text-white">{presencePreview.delayRisk}</strong>خطر تأخير</div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-white">دليل الألوان</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRESENCE_LEGEND.map((item) => (
                    <div key={item.label} className={cn("rounded-xl border px-3 py-2 text-xs", PRESENCE_TONE_CLASS[item.tone])}>
                      <div className="flex items-center gap-2 font-bold">
                        <span className={cn("h-2.5 w-2.5 rounded-full", PRESENCE_DOT_CLASS[item.tone])} />
                        {item.label}
                      </div>
                      <div className="mt-1 text-[11px] opacity-75">{item.description}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-white">أولويات المتابعة</div>
                  <span className="text-[11px] text-[#8ba3c7]">{presencePreview.priorityRows.length} موظف</span>
                </div>
                {presencePreview.priorityRows.length > 0 ? (
                  <div className="space-y-2">
                    {presencePreview.priorityRows.map((row) => (
                      <div key={row.id} className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-white">{row.name}</div>
                            <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">{row.department || "غير محدد"} · المدير: {row.manager || "غير محدد"}</div>
                          </div>
                          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px]", PRESENCE_TONE_CLASS[row.signal.tone])}>
                            <span className={cn("h-2 w-2 rounded-full", PRESENCE_DOT_CLASS[row.signal.tone])} />
                            {row.signal.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#8ba3c7]">
                          <span className="rounded-lg bg-white/[0.05] px-2 py-1">نشطة: {row.activeTasks}</span>
                          <span className="rounded-lg bg-red-500/10 px-2 py-1 text-red-100">متأخرة: {row.lateTasks}</span>
                          <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-violet-100">مراجعة: {row.reviewTasks}</span>
                          {row.outsideStructure && <span className="rounded-lg bg-orange-400/10 px-2 py-1 text-orange-100">خارج الهيكل</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-5 text-center text-xs text-[#8ba3c7]">
                    لا توجد أولويات متابعة واضحة من البيانات الحالية.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-white">توزيع الأقسام</div>
                {presencePreview.departmentDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {presencePreview.departmentDistribution.map((dept) => (
                      <div key={dept.department} className="rounded-xl bg-black/15 px-3 py-2">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-bold text-white">{dept.department || "غير محدد"}</span>
                          <span className="text-[#8ba3c7]">{dept.total} موظف</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                          <span className="rounded-lg bg-red-500/10 px-2 py-1 text-red-100">متأخر: {dept.late}</span>
                          <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-violet-100">مراجعة: {dept.review}</span>
                          <span className="rounded-lg bg-orange-400/10 px-2 py-1 text-orange-100">خارج: {dept.outside}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-5 text-center text-xs text-[#8ba3c7]">
                    لا توجد بيانات أقسام كافية.
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}

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
