"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  CircleDot,
  Clock,
  Columns,
  Edit2,
  Filter,
  List,
  LoaderCircle,
  Plus,
  Radar,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import { WS_PAGE, WS_CARD, WS_INNER_CARD } from "@/components/ui/workspaceVisual";
import { WorkspaceEmpty } from "@/components/ui/workspaceUi";
import { WorkspaceCenterModal } from "@/components/ui/WorkspaceCenterModal";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import { useTasks, useClients, useEmployees } from "@/hooks/useData";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { ORG_UNKNOWN_LABEL, createOrgScopeResolver } from "@/lib/org/orgScopeResolver";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "جديدة", label: "جديدة", color: "#22d3ee" },
  { key: "قيد_التنفيذ", label: "قيد التنفيذ", color: "#f59e0b" },
  { key: "بانتظار_المراجعة", label: "بانتظار المراجعة", color: "#a855f7" },
  { key: "مكتملة", label: "مكتملة", color: "#10b981" },
  { key: "متأخرة", label: "متأخرة", color: "#ef4444" },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; class: string }> = {
  عاجلة: { label: "عاجلة", class: "priority-urgent" },
  عالية: { label: "عالية", class: "priority-high" },
  متوسطة: { label: "متوسطة", class: "priority-medium" },
  منخفضة: { label: "منخفضة", class: "priority-low" },
};

type ViewMode = "kanban" | "list";
type TaskFilter = TaskStatus | "الكل";
type PriorityFilter = TaskPriority | "الكل";

const DATE_FORMATTER = new Intl.DateTimeFormat("ar-SA", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDueDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date);
}

function TasksContent() {
  const { data: tasks, loading, error, refetch, insert, update, remove } = useTasks();
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  const { data: orgSnapshot } = useOrgStructure(true);
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const canManageTasks = hasPermission("manage_tasks");
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskFilter>("الكل");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("الكل");
  const [assigneeFilter, setAssigneeFilter] = useState("الكل");
  const [clientFilter, setClientFilter] = useState("الكل");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTask, setEditTask] = useState<typeof tasks[0] | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "جديدة" as TaskStatus,
    priority: "متوسطة" as TaskPriority,
    assigneeId: "",
    assigneeName: "",
    clientId: "",
    clientName: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      status: "جديدة",
      priority: "متوسطة",
      assigneeId: "",
      assigneeName: "",
      clientId: "",
      clientName: "",
      dueDate: new Date().toISOString().split("T")[0],
    });
    setEditTask(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (task: typeof tasks[0]) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      clientId: task.clientId ?? "",
      clientName: task.clientName ?? "",
      dueDate: task.dueDate,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان المهمة مطلوب");
      return;
    }
    setSaving(true);
    try {
      const assigneeId = form.assigneeId || user?.id || "";
      const assigneeName = form.assigneeName || user?.email || "";
      if (editTask) {
        await update(editTask.id, { title: form.title, description: form.description, status: form.status, priority: form.priority, assigneeId, assigneeName, clientId: form.clientId || undefined, clientName: form.clientName || undefined, dueDate: form.dueDate });
        toast.success("تم تحديث المهمة بنجاح");
      } else {
        await insert({ title: form.title, description: form.description, status: form.status, priority: form.priority, assigneeId, assigneeName, clientId: form.clientId || undefined, clientName: form.clientName || undefined, dueDate: form.dueDate });
        toast.success("تمت إضافة المهمة بنجاح");
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المهمة");
      console.error("[Task Save Error]", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return;
    try {
      await remove(taskId);
      toast.success("تم حذف المهمة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف");
      console.error("[Task Delete Error]", err);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await update(taskId, { status: newStatus });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء تحديث المهمة");
      console.error("[Task Move Error]", err);
    }
  };

  const isOverdue = (dueDate: string, status: TaskStatus) => status !== "مكتملة" && new Date(dueDate) < new Date();

  const stats = {
    total: tasks.length,
    new: tasks.filter((t) => t.status === "جديدة").length,
    completed: tasks.filter((t) => t.status === "مكتملة").length,
    inProgress: tasks.filter((t) => t.status === "قيد_التنفيذ").length,
    review: tasks.filter((t) => t.status === "بانتظار_المراجعة").length,
    late: tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && new Date(t.dueDate) < new Date())).length,
  };
  const kpiItems = [
    { label: "إجمالي المهام", value: stats.total, icon: CheckSquare, tone: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20" },
    { label: "جديدة", value: stats.new, icon: CircleDot, tone: "text-sky-200 bg-sky-400/10 border-sky-300/20" },
    { label: "قيد التنفيذ", value: stats.inProgress, icon: Clock, tone: "text-amber-200 bg-amber-400/10 border-amber-300/20" },
    { label: "بانتظار المراجعة", value: stats.review, icon: Users, tone: "text-violet-200 bg-violet-400/10 border-violet-300/20" },
    { label: "متأخرة", value: stats.late, icon: AlertTriangle, tone: "text-rose-200 bg-rose-400/10 border-rose-300/20" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle2, tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20" },
  ];

  const statusMeta = (s: TaskStatus) =>
    STATUS_COLUMNS.find((c) => c.key === s) ?? { key: s, label: s, color: "#8ba3c7" };

  const orgResolver = useMemo(
    () => createOrgScopeResolver(orgSnapshot, employees),
    [orgSnapshot, employees],
  );

  const managerCommand = useMemo(() => {
    const completedStatus = STATUS_COLUMNS[3].key;
    const reviewStatus = STATUS_COLUMNS[2].key;
    const lateStatus = STATUS_COLUMNS[4].key;
    const taskIsOverdue = (dueDate: string, status: TaskStatus) => {
      if (status === completedStatus) return false;
      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) return false;
      return due < new Date();
    };
    const departmentMap = new Map<string, { label: string; total: number; late: number; review: number }>();
    const employeeLoad = new Map<string, { name: string; department: string; count: number }>();

    tasks.forEach((task) => {
      const scope = orgResolver.resolveTaskAssignee(task);
      const department = scope.departmentLabel || ORG_UNKNOWN_LABEL;
      const departmentKey = scope.departmentId ?? department;
      const currentDepartment = departmentMap.get(departmentKey) ?? {
        label: department,
        total: 0,
        late: 0,
        review: 0,
      };

      currentDepartment.total += 1;
      if (task.status === lateStatus || taskIsOverdue(task.dueDate, task.status)) currentDepartment.late += 1;
      if (task.status === reviewStatus) currentDepartment.review += 1;
      departmentMap.set(departmentKey, currentDepartment);

      const employeeKey = scope.employeeId ?? task.assigneeName ?? ORG_UNKNOWN_LABEL;
      const currentEmployee = employeeLoad.get(employeeKey) ?? {
        name: scope.employeeName,
        department,
        count: 0,
      };
      if (task.status !== completedStatus) currentEmployee.count += 1;
      employeeLoad.set(employeeKey, currentEmployee);
    });

    return {
      departments: Array.from(departmentMap.values()).sort((a, b) => b.total - a.total).slice(0, 4),
      highLoad: Array.from(employeeLoad.values()).filter((item) => item.count >= 4).sort((a, b) => b.count - a.count).slice(0, 4),
      lateByDepartment: Array.from(departmentMap.values()).filter((item) => item.late > 0).sort((a, b) => b.late - a.late).slice(0, 4),
      reviewQueue: tasks.filter((task) => task.status === reviewStatus),
      clientLinked: tasks.filter((task) => Boolean(task.clientId || task.clientName)),
      unscoped: tasks.filter((task) => !orgResolver.resolveTaskAssignee(task).isLinkedToOrg),
    };
  }, [orgResolver, tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    return tasks.filter((task) => {
      const matchesSearch = !query
        || task.title.toLocaleLowerCase("ar").includes(query)
        || (task.description ?? "").toLocaleLowerCase("ar").includes(query)
        || (task.assigneeName ?? "").toLocaleLowerCase("ar").includes(query)
        || (task.clientName ?? "").toLocaleLowerCase("ar").includes(query)
        || (task.publicCode ?? "").toLocaleLowerCase("ar").includes(query);
      return matchesSearch
        && (statusFilter === "الكل" || task.status === statusFilter)
        && (priorityFilter === "الكل" || task.priority === priorityFilter)
        && (assigneeFilter === "الكل" || task.assigneeId === assigneeFilter)
        && (clientFilter === "الكل" || task.clientId === clientFilter);
    });
  }, [assigneeFilter, clientFilter, priorityFilter, search, statusFilter, tasks]);

  const hasActiveFilters = Boolean(search.trim())
    || statusFilter !== "الكل"
    || priorityFilter !== "الكل"
    || assigneeFilter !== "الكل"
    || clientFilter !== "الكل";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("الكل");
    setPriorityFilter("الكل");
    setAssigneeFilter("الكل");
    setClientFilter("الكل");
  };

  const detailsTask = detailsId ? tasks.find((t) => t.id === detailsId) ?? null : null;

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <header className={cn(WS_CARD, "p-4 sm:p-5 lg:p-6")}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_140%_at_100%_0%,rgba(34,211,238,0.15),transparent_48%),radial-gradient(80%_120%_at_0%_100%,rgba(16,185,129,0.08),transparent_56%)]" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.10)]">
                <CheckSquare size={21} />
              </span>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-bold text-cyan-200/80">مساحة العمل الموحدة</p>
                <h1 className="font-heading text-xl font-bold text-white sm:text-2xl">إدارة المهام</h1>
                <p className="mt-1 text-xs leading-5 text-[#9db1cf] sm:text-sm">
                  متابعة العمل وتوزيعه ضمن نطاق المنشأة المصرح لك به.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-h-11 items-center rounded-xl border border-white/[0.08] bg-black/15 p-1" role="group" aria-label="طريقة عرض المهام">
                <button type="button" onClick={() => setView("kanban")} aria-label="عرض كانبان" aria-pressed={view === "kanban"} className={cn("grid min-h-9 min-w-10 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70", view === "kanban" ? "bg-cyan-300 text-[#071525]" : "text-[#9db1cf] hover:bg-white/[0.06] hover:text-white")}>
                  <Columns size={16} />
                </button>
                <button type="button" onClick={() => setView("list")} aria-label="عرض قائمة" aria-pressed={view === "list"} className={cn("grid min-h-9 min-w-10 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70", view === "list" ? "bg-cyan-300 text-[#071525]" : "text-[#9db1cf] hover:bg-white/[0.06] hover:text-white")}>
                  <List size={16} />
                </button>
              </div>
              <Link href="/tasks/my-desk" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3.5 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <Radar size={16} />
                المكتب الذكي
              </Link>
              {canManageTasks && (
                <button type="button" onClick={openAdd} className="btn-primary inline-flex min-h-11 items-center gap-2 px-4 whitespace-nowrap touch-manipulation">
                  <Plus size={16} />
                  مهمة جديدة
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="مؤشرات المهام">
          {kpiItems.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className={cn(WS_INNER_CARD, "flex min-h-[82px] items-center gap-3 px-3 py-3 sm:px-4")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border", tone)}>
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <strong className="block text-xl font-bold tabular-nums text-white">{value}</strong>
                <span className="block truncate text-[11px] text-[#9db1cf]">{label}</span>
              </div>
            </article>
          ))}
        </section>

        <section className={cn(WS_CARD, "p-3 sm:p-4")} aria-label="أدوات تصفية المهام">
          <div className="relative z-10 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))_auto]">
            <label className="relative block min-w-0">
              <span className="sr-only">بحث في المهام</span>
              <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-dark min-h-11 w-full pr-9 text-sm" placeholder="ابحث بالعنوان أو العميل أو المكلّف..." />
            </label>
            <label className="min-w-0">
              <span className="sr-only">تصفية حسب الحالة</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TaskFilter)} className="input-dark min-h-11 w-full text-sm">
                <option value="الكل">كل الحالات</option>
                {STATUS_COLUMNS.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">تصفية حسب الأولوية</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)} className="input-dark min-h-11 w-full text-sm">
                <option value="الكل">كل الأولويات</option>
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">تصفية حسب المكلّف</span>
              <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="input-dark min-h-11 w-full text-sm">
                <option value="الكل">كل المكلّفين</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">تصفية حسب العميل</span>
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="input-dark min-h-11 w-full text-sm">
                <option value="الكل">كل العملاء</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={resetFilters} disabled={!hasActiveFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-xs font-bold text-[#b7c8df] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
              <RotateCcw size={14} />
              إعادة الضبط
            </button>
          </div>
          <div className="relative z-10 mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs text-[#8ba3c7]">
            <span className="inline-flex items-center gap-1.5"><Filter size={13} />{filteredTasks.length} من {tasks.length} مهمة</span>
            <span className="hidden sm:inline">تعتمد النتائج على البيانات والصلاحيات الحالية.</span>
          </div>
        </section>

        {!loading && tasks.length > 0 && (
          <details className={cn(WS_CARD, "group overflow-hidden p-0")}>
            <summary className="relative flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 border-b border-transparent px-4 py-3 marker:hidden group-open:border-white/[0.06] sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                  <Radar size={17} />
                </span>
                <div>
                  <h2 className="font-heading text-sm font-bold text-white sm:text-base">الرؤى التشغيلية للمدير</h2>
                  <p className="mt-0.5 text-[11px] text-[#8ba3c7]">ملخص ثانوي مبني على المهام والهيكل الحاليين.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-lg border border-violet-300/15 bg-violet-400/10 px-2.5 py-1.5 text-[11px] text-violet-100 sm:inline">{managerCommand.reviewQueue.length} للمراجعة</span>
                <ChevronLeft size={17} className="-rotate-90 text-[#8ba3c7] transition-transform group-open:rotate-90" />
              </div>
            </summary>
            <div className="grid grid-cols-3 gap-2 px-4 pt-4 text-center text-[11px] sm:px-5">
              <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-2 py-2 text-cyan-100"><strong className="block text-base text-white">{managerCommand.clientLinked.length}</strong>مرتبطة بعميل</div>
              <div className="rounded-xl border border-violet-300/15 bg-violet-400/10 px-2 py-2 text-violet-100"><strong className="block text-base text-white">{managerCommand.reviewQueue.length}</strong>للمراجعة</div>
              <div className="rounded-xl border border-amber-300/15 bg-amber-400/10 px-2 py-2 text-amber-100"><strong className="block text-base text-white">{managerCommand.unscoped.length}</strong>خارج الربط</div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-cyan-100">عبء الأقسام</div>
                <div className="space-y-2">
                  {managerCommand.departments.length ? managerCommand.departments.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs">
                      <span className="truncate text-[#d7e7ff]">{item.label}</span>
                      <span className="font-bold text-white">{item.total}</span>
                    </div>
                  )) : <div className="text-xs text-[#8ba3c7]">لا توجد مهام موزعة على أقسام.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-amber-100">حمل مرتفع للموظفين</div>
                <div className="space-y-2">
                  {managerCommand.highLoad.length ? managerCommand.highLoad.map((item) => (
                    <div key={`${item.name}-${item.department}`} className="rounded-xl bg-black/20 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-white">{item.name}</span>
                        <span className="font-bold text-amber-200">{item.count}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">{item.department}</div>
                    </div>
                  )) : <div className="text-xs text-[#8ba3c7]">لا يوجد حمل مرتفع حسب البيانات الحالية.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-red-100">المتأخر حسب القسم</div>
                <div className="space-y-2">
                  {managerCommand.lateByDepartment.length ? managerCommand.lateByDepartment.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs">
                      <span className="truncate text-red-100">{item.label}</span>
                      <span className="font-bold text-white">{item.late}</span>
                    </div>
                  )) : <div className="text-xs text-[#8ba3c7]">لا توجد مهام متأخرة موزعة على أقسام.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="mb-3 text-xs font-bold text-violet-100">طابور المراجعة</div>
                <div className="space-y-2">
                  {managerCommand.reviewQueue.slice(0, 3).map((task) => (
                    <div key={task.id} className="rounded-xl bg-black/20 px-3 py-2 text-xs">
                      <div className="truncate text-white">{task.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">{task.clientName || "المصدر غير محدد"}</div>
                    </div>
                  ))}
                  {!managerCommand.reviewQueue.length && <div className="text-xs text-[#8ba3c7]">لا توجد مهام بانتظار المراجعة.</div>}
                </div>
              </div>
            </div>
          </details>
        )}

        {loading && (
          <div className={cn(WS_CARD, "flex min-h-40 flex-col items-center justify-center gap-3 py-10 text-center text-sm text-[#8ba3c7]")}>
            <LoaderCircle size={24} className="animate-spin text-cyan-300" />
            جارٍ تحميل مساحة المهام...
          </div>
        )}

        {!loading && error && (
          <WorkspaceEmpty
            icon={AlertTriangle}
            title="تعذر تحميل المهام"
            subtitle="تحقق من الاتصال ثم أعد المحاولة."
            accent="rose"
            action={
              <button type="button" onClick={() => void refetch()} className="btn-secondary inline-flex min-h-11 items-center gap-2 px-4">
                <RotateCcw size={15} />
                إعادة المحاولة
              </button>
            }
          />
        )}

        {!loading && !error && tasks.length === 0 && (
          <WorkspaceEmpty
            icon={CheckSquare}
            title="لا توجد مهام بعد"
            subtitle="أنشئ أول مهمة لتتبع عمل فريقك"
            accent="cyan"
            action={
              canManageTasks ? (
                <button onClick={openAdd} className="btn-primary min-h-11 px-4 flex items-center gap-2 touch-manipulation">
                  <Plus size={16} />
                  مهمة جديدة
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
          <WorkspaceEmpty
            icon={Search}
            title="لا توجد نتائج مطابقة"
            subtitle="غيّر كلمات البحث أو أعد ضبط المرشحات لعرض المهام."
            accent="sky"
            action={
              <button type="button" onClick={resetFilters} className="btn-secondary inline-flex min-h-11 items-center gap-2 px-4">
                <RotateCcw size={15} />
                إعادة ضبط المرشحات
              </button>
            }
          />
        )}

        {!loading && !error && filteredTasks.length > 0 && view === "kanban" && (
          <section className="hidden sm:block overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 sm:gap-4 lg:gap-5 px-0.5">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className={cn(WS_CARD, "w-[280px] sm:w-[300px] lg:w-[320px] shrink-0 p-3")}>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                      <span className="text-sm font-medium text-white">{col.label}</span>
                      <span className="badge text-xs" style={{ background: `${col.color}20`, color: col.color }}>{colTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {colTasks.map((task) => (
                        <article key={task.id} className="glass-card glass-card-hover rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:p-4">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <PublicCodeBadge code={task.publicCode} />
                                <span className={`badge shrink-0 text-xs ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                              </div>
                              <h4 className="text-sm font-semibold leading-6 text-white line-clamp-2">{task.title}</h4>
                            </div>
                          </div>
                          {task.description && <p className="mb-2 text-xs leading-5 text-[#8ba3c7] line-clamp-2">{task.description}</p>}
                          {task.clientName && <div className="mb-2 flex items-center gap-1.5 truncate text-xs text-[#8ba3c7]"><Building2 size={12} />{task.clientName}</div>}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>
                              <CalendarDays size={12} />
                              <span className="truncate">{formatDueDate(task.dueDate)}</span>
                              {isOverdue(task.dueDate, task.status) && task.status !== "متأخرة" && <AlertTriangle size={12} className="text-red-400" />}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {canManageTasks && (
                                <>
                                  <button onClick={() => openEdit(task)} aria-label="تعديل المهمة" className="rounded-md p-1.5 text-[#8ba3c7] transition-colors hover:text-[#22d3ee]">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                  </button>
                                  <button onClick={() => handleDeleteTask(task.id, task.title)} aria-label="حذف المهمة" className="rounded-md p-1.5 text-[#8ba3c7] transition-colors hover:text-red-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                  </button>
                                </>
                              )}
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e6fd9] text-xs text-white">
                                {task.assigneeName.slice(0, 1)}
                              </div>
                            </div>
                          </div>
                          <select className="mt-3 w-full rounded-lg border border-[#2f4f82] bg-[#0d1f3c] px-2.5 py-2 text-xs text-[#8ba3c7] outline-none" value={task.status} onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}>
                            {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </article>
                      ))}
                      {colTasks.length === 0 && <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-[#2a4a76] bg-[#0e2242]/60 p-4 text-center text-xs text-[#6b87ab]">لا توجد مهام</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading && !error && filteredTasks.length > 0 && view === "list" && (
          <section className={cn(WS_CARD, "hidden sm:block overflow-hidden p-0")}>
            <div className="block md:hidden space-y-2 p-3">
              {filteredTasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-[#2a4c79] bg-[#0f2344]/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white line-clamp-2">{task.title}</h4>
                      <div className="mt-1">
                        <PublicCodeBadge code={task.publicCode} />
                      </div>
                    </div>
                    <span className={`badge shrink-0 text-xs ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                  </div>
                  {task.description && <p className="mt-1 text-xs text-[#8ba3c7] line-clamp-2">{task.description}</p>}
                  <div className="mt-2 space-y-1 text-xs text-[#8ba3c7]">
                    <p className="truncate">المُكلَّف: {task.assigneeName}</p>
                    <p className="truncate">العميل: {task.clientName || "—"}</p>
                    <p className={cn("flex items-center gap-1", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>{isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />} {formatDueDate(task.dueDate)}</p>
                  </div>
                  <select className="mt-3 w-full rounded-lg border border-[#2f4f82] bg-[#0d1f3c] px-2.5 py-2.5 text-xs text-[#8ba3c7] outline-none" value={task.status} onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}>
                    {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </article>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[#1e3a5f] bg-[#11284d]/70">
                    {["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-medium text-[#8ba3c7]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{task.title}</div>
                        <div className="mt-0.5">
                          <PublicCodeBadge code={task.publicCode} />
                        </div>
                        {task.description && <div className="mt-0.5 line-clamp-2 text-xs text-[#8ba3c7]">{task.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#8ba3c7]">{task.assigneeName}</td>
                      <td className="px-4 py-3 text-[#8ba3c7]">{task.clientName || "—"}</td>
                      <td className="px-4 py-3"><span className={`badge ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span></td>
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>{isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}{formatDueDate(task.dueDate)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select className="rounded-lg border border-[#2f4f82] bg-[#0d1f3c] px-2 py-1.5 text-xs text-[#8ba3c7] outline-none" value={task.status} onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}>
                          {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Mobile smart directory (< sm) ── */}
        {!loading && !error && filteredTasks.length > 0 && (
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-1 rounded-xl border border-[#1e3a5f] bg-[#0d1f3c]/60 p-1">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={cn("flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all", view === "list" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7] hover:bg-white/[0.04] hover:text-white")}
              >
                <List size={14} />
                قائمة
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                aria-pressed={view === "kanban"}
                className={cn("flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all", view === "kanban" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7] hover:bg-white/[0.04] hover:text-white")}
              >
                <Columns size={14} />
                بطاقات
              </button>
            </div>

            {view === "list" ? (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const meta = statusMeta(task.status);
                  const overdue = isOverdue(task.dueDate, task.status);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setDetailsId(task.id)}
                      className="group w-full flex items-center gap-3 rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.55)] px-3 py-2.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-[6px] transition-all hover:border-cyan-400/25 hover:bg-[rgba(11,26,52,0.7)] active:scale-[0.99] min-h-14"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white font-semibold text-[13px] truncate flex-1">{task.title}</span>
                          <span className="badge text-[9px] shrink-0" style={{ background: `${meta.color}20`, color: meta.color }}>{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#8ba3c7] min-w-0">
                          <span className={cn("badge text-[9px] shrink-0", PRIORITY_CONFIG[task.priority].class)}>{PRIORITY_CONFIG[task.priority].label}</span>
                          <span className="text-[#1e3a5f] shrink-0">·</span>
                          <span className={cn("shrink-0 flex items-center gap-0.5", overdue && "text-red-300")}>
                            {overdue && <AlertTriangle size={10} />}{formatDueDate(task.dueDate)}
                          </span>
                          {task.assigneeName && (
                            <>
                              <span className="text-[#1e3a5f] shrink-0">·</span>
                              <span className="truncate">{task.assigneeName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {task.assigneeName && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e6fd9] text-[11px] font-bold text-white">
                          {task.assigneeName.slice(0, 1)}
                        </div>
                      )}
                      <ChevronLeft size={16} className="text-[#8ba3c7] group-hover:text-cyan-300 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <article key={task.id} className={cn(WS_CARD, "p-3.5 space-y-2")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white line-clamp-2">{task.title}</h4>
                        <div className="mt-1"><PublicCodeBadge code={task.publicCode} /></div>
                      </div>
                      <span className={cn("badge shrink-0 text-xs", PRIORITY_CONFIG[task.priority].class)}>{PRIORITY_CONFIG[task.priority].label}</span>
                    </div>
                    {task.description && <p className="text-xs text-[#8ba3c7] line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8ba3c7]">
                      <span className="badge text-[10px]" style={{ background: `${statusMeta(task.status).color}20`, color: statusMeta(task.status).color }}>{statusMeta(task.status).label}</span>
                      {task.assigneeName && <span className="truncate">المُكلَّف: {task.assigneeName}</span>}
                      <span className={cn("flex items-center gap-1", isOverdue(task.dueDate, task.status) ? "text-red-300" : "")}>{isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}{formatDueDate(task.dueDate)}</span>
                    </div>
                    <select className="w-full rounded-lg border border-[#2f4f82] bg-[#0d1f3c] px-2.5 py-2 text-xs text-[#8ba3c7] outline-none" value={task.status} onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}>
                      {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task details — compact centered glass */}
      {detailsTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={() => setDetailsId(null)}>
          <div className="relative w-[min(360px,calc(100vw-48px))] max-[380px]:w-[calc(100vw-36px)] max-h-[72vh] max-[380px]:max-h-[76vh] sm:max-w-[420px] sm:max-h-[80vh] overflow-y-auto rounded-[26px] border border-[rgba(34,211,238,0.18)] bg-[linear-gradient(155deg,rgba(13,25,48,0.97),rgba(7,15,32,0.98))] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7),0_0_28px_rgba(34,211,238,0.05)] backdrop-blur-[20px] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-heading font-bold text-[15px] leading-snug">{detailsTask.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="badge text-[10px]" style={{ background: `${statusMeta(detailsTask.status).color}20`, color: statusMeta(detailsTask.status).color }}>{statusMeta(detailsTask.status).label}</span>
                  <span className={cn("badge text-[10px]", PRIORITY_CONFIG[detailsTask.priority].class)}>{PRIORITY_CONFIG[detailsTask.priority].label}</span>
                  <PublicCodeBadge code={detailsTask.publicCode} />
                </div>
              </div>
              <button onClick={() => setDetailsId(null)} className="text-[#8ba3c7] hover:text-white shrink-0" aria-label="إغلاق"><X size={18} /></button>
            </div>
            {detailsTask.description && <p className="text-[12px] text-[#8ba3c7] leading-relaxed">{detailsTask.description}</p>}
            <div className="grid grid-cols-1 gap-1.5 text-[13px]">
              <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                <span className="text-[#8ba3c7] text-[11px]">المُكلَّف</span>
                <span className="text-white font-medium truncate">{detailsTask.assigneeName || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                <span className="text-[#8ba3c7] text-[11px]">العميل</span>
                <span className="text-white font-medium truncate">{detailsTask.clientName || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
                <span className="text-[#8ba3c7] text-[11px]">الموعد النهائي</span>
                <span className={cn("font-medium flex items-center gap-1", isOverdue(detailsTask.dueDate, detailsTask.status) ? "text-red-300" : "text-white")}>
                  {isOverdue(detailsTask.dueDate, detailsTask.status) && <AlertTriangle size={12} />}{formatDueDate(detailsTask.dueDate)}
                </span>
              </div>
            </div>
            {canManageTasks && (
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => { const t = detailsTask; setDetailsId(null); openEdit(t); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-10"
                >
                  <Edit2 size={14} />
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => { const t = detailsTask; setDetailsId(null); handleDeleteTask(t.id, t.title); }}
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

      {/* Add / edit task — centered glass */}
      <WorkspaceCenterModal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button onClick={() => { setShowModal(false); resetForm(); }} disabled={saving} className="btn-secondary min-h-11 flex-1">إلغاء</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary min-h-11 flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {saving ? "جارٍ الحفظ..." : editTask ? "حفظ التعديلات" : "إضافة المهمة"}
            </button>
          </div>
        }
      >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-[#8ba3c7]">عنوان المهمة</label>
                  <input className="input-dark min-h-10 text-sm" placeholder="أدخل عنوان المهمة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#8ba3c7]">الوصف</label>
                  <textarea className="input-dark min-h-16 resize-none text-sm" rows={2} placeholder="وصف تفصيلي للمهمة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#8ba3c7]">الأولوية</label>
                    <select className="input-dark min-h-10 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                      <option value="عاجلة">عاجلة</option><option value="عالية">عالية</option><option value="متوسطة">متوسطة</option><option value="منخفضة">منخفضة</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#8ba3c7]">الحالة</label>
                    <select className="input-dark min-h-10 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                      {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#8ba3c7]">المُكلَّف</label>
                    <select className="input-dark min-h-11 text-sm" value={form.assigneeId} onChange={(e) => { const emp = employees.find((x) => x.id === e.target.value); setForm({ ...form, assigneeId: e.target.value, assigneeName: emp?.name ?? "" }); }}>
                      <option value="">— اختر موظفاً —</option>
                      {employees.filter((e) => e.status === "نشط").map((e) => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#8ba3c7]">الموعد النهائي</label>
                    <input className="input-dark min-h-10 text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#8ba3c7]">العميل (اختياري)</label>
                  <select className="input-dark min-h-10 text-sm" value={form.clientId} onChange={(e) => { const cl = clients.find((x) => x.id === e.target.value); setForm({ ...form, clientId: e.target.value, clientName: cl?.name ?? "" }); }}>
                    <option value="">— بدون عميل —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                  </select>
                </div>
              </div>
      </WorkspaceCenterModal>
    </DashboardLayout>
  );
}

export default function TasksPage() {
  return (
    <PageGuard permission="manage_tasks">
      <TasksContent />
    </PageGuard>
  );
}
