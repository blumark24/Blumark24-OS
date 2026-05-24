"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { CheckSquare, Plus, List, Columns, Clock, AlertTriangle, X } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import {
  WS_PAGE, WS_CARD, WS_GLASS_MODAL, WS_MUTED,
  kpiTheme, type KpiAccent,
} from "@/components/ui/workspaceVisual";

/** Static dot color per accent — Tailwind needs the full class name at build time. */
const COL_DOT: Record<KpiAccent, string> = {
  cyan:    "bg-cyan-400",
  amber:   "bg-amber-400",
  violet:  "bg-violet-400",
  emerald: "bg-emerald-400",
  rose:    "bg-rose-400",
  sky:     "bg-sky-400",
};
import {
  PageHero, KpiStatCard, WorkspaceEmptyInline,
} from "@/components/ui/workspaceUi";
import { useTasks, useClients, useEmployees } from "@/hooks/useData";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

/**
 * Status columns — each column is mapped to a semantic accent that matches
 * the workspace-wide color system (cyan/system, amber/attention, violet/AI
 * review, emerald/success, rose/risk).
 */
const STATUS_COLUMNS: { key: TaskStatus; label: string; accent: KpiAccent }[] = [
  { key: "جديدة",              label: "جديدة",              accent: "cyan"    },
  { key: "قيد_التنفيذ",        label: "قيد التنفيذ",        accent: "amber"   },
  { key: "بانتظار_المراجعة",   label: "بانتظار المراجعة",   accent: "violet"  },
  { key: "مكتملة",             label: "مكتملة",             accent: "emerald" },
  { key: "متأخرة",             label: "متأخرة",             accent: "rose"    },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; class: string }> = {
  عاجلة:   { label: "عاجلة",   class: "priority-urgent" },
  عالية:   { label: "عالية",   class: "priority-high" },
  متوسطة:  { label: "متوسطة",  class: "priority-medium" },
  منخفضة:  { label: "منخفضة",  class: "priority-low" },
};

type ViewMode = "kanban" | "list";

function TasksContent() {
  const { data: tasks, loading, insert, update, remove } = useTasks();
  const { data: clients }   = useClients();
  const { data: employees } = useEmployees();
  const { userRole } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";
  const [view, setView] = useState<ViewMode>("kanban");
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
    dueDate: "",
  });

  const resetForm = () => {
    setForm({ title: "", description: "", status: "جديدة", priority: "متوسطة", assigneeId: "", assigneeName: "", clientId: "", clientName: "", dueDate: "" });
    setEditTask(null);
  };

  const openAdd  = () => { resetForm(); setShowModal(true); };
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
    if (!form.title.trim()) { toast.error("عنوان المهمة مطلوب"); return; }
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

  const isOverdue = (dueDate: string, status: TaskStatus) =>
    status !== "مكتملة" && new Date(dueDate) < new Date();

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "مكتملة").length,
    inProgress: tasks.filter((t) => t.status === "قيد_التنفيذ").length,
    late: tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && new Date(t.dueDate) < new Date())).length,
  };

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <PageHero title="إدارة المهام" subtitle="تتبع وإدارة مهام الفريق">
          <div
            className="flex items-center rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] p-1"
            role="tablist"
            aria-label="عرض المهام"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "kanban"}
              onClick={() => setView("kanban")}
              aria-label="عرض كانبان"
              className={cn(
                "rounded-lg p-2.5 min-h-[44px] min-w-[44px] transition-all touch-manipulation",
                view === "kanban"
                  ? "bg-cyan-400 text-[#0a1628] shadow-[0_0_24px_var(--ws-cyan-ring)]"
                  : "text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
              )}
            >
              <Columns size={16} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              aria-label="عرض قائمة"
              className={cn(
                "rounded-lg p-2.5 min-h-[44px] min-w-[44px] transition-all touch-manipulation",
                view === "list"
                  ? "bg-cyan-400 text-[#0a1628] shadow-[0_0_24px_var(--ws-cyan-ring)]"
                  : "text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
              )}
            >
              <List size={16} />
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="btn-primary min-h-11 px-4 flex items-center gap-2 whitespace-nowrap touch-manipulation"
            >
              <Plus size={16} />
              مهمة جديدة
            </button>
          )}
        </PageHero>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 min-w-0">
          <KpiStatCard label="إجمالي المهام" value={String(stats.total)}       icon={CheckSquare}    accent="cyan"    showLive={false} showSparkline={false} />
          <KpiStatCard label="مكتملة"        value={String(stats.completed)}   icon={CheckSquare}    accent="emerald" showLive={false} showSparkline={false} />
          <KpiStatCard label="قيد التنفيذ"   value={String(stats.inProgress)}  icon={Clock}          accent="amber"   showLive={false} showSparkline={false} />
          <KpiStatCard label="متأخرة"        value={String(stats.late)}        icon={AlertTriangle}  accent="rose"    showLive={false} showSparkline={false} />
        </section>

        {loading && (
          <div className={cn(WS_CARD, "py-10 text-center text-sm", WS_MUTED)}>
            جارٍ تحميل المهام...
          </div>
        )}

        {!loading && view === "kanban" && (
          <section className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex min-w-max gap-3 sm:gap-4 lg:gap-5">
              {STATUS_COLUMNS.map((col) => {
                const theme = kpiTheme(col.accent);
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div
                    key={col.key}
                    className={cn(WS_CARD, theme.card, "w-[280px] sm:w-[300px] lg:w-[320px] shrink-0 p-3")}
                  >
                    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", theme.wash)} />
                    <div className="relative z-10">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={cn("h-3 w-3 rounded-full", COL_DOT[col.accent])} />
                        <span className="text-sm font-medium text-[color:var(--ws-text-primary)]">{col.label}</span>
                        <span className={cn("badge text-xs", theme.livePill)}>{colTasks.length}</span>
                      </div>
                      <div className="space-y-3">
                        {colTasks.map((task) => (
                          <article
                            key={task.id}
                            className="crystal crystal-l2 rounded-xl border border-[var(--ws-border-subtle)] p-3 sm:p-4 min-h-[48px]"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <h4 className="min-w-0 text-sm font-semibold leading-6 text-[color:var(--ws-text-primary)] line-clamp-2">{task.title}</h4>
                              <span className={cn("badge shrink-0 text-xs", PRIORITY_CONFIG[task.priority].class)}>{PRIORITY_CONFIG[task.priority].label}</span>
                            </div>
                            {task.description && <p className={cn("mb-2 text-xs leading-5 line-clamp-2", WS_MUTED)}>{task.description}</p>}
                            {task.clientName && <div className={cn("mb-2 truncate text-xs", WS_MUTED)}>👤 {task.clientName}</div>}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-rose-300" : WS_MUTED)}>
                                <Clock size={12} />
                                <span className="truncate">{task.dueDate}</span>
                                {isOverdue(task.dueDate, task.status) && task.status !== "متأخرة" && <AlertTriangle size={12} className="text-rose-400" />}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isAdmin && (
                                  <>
                                    <button onClick={() => openEdit(task)} aria-label="تعديل المهمة" className="rounded-md p-1.5 min-h-[44px] min-w-[44px] text-[color:var(--ws-text-secondary)] transition-colors hover:text-cyan-300 touch-manipulation">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button onClick={() => handleDeleteTask(task.id, task.title)} aria-label="حذف المهمة" className="rounded-md p-1.5 min-h-[44px] min-w-[44px] text-[color:var(--ws-text-secondary)] transition-colors hover:text-rose-400 touch-manipulation">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                    </button>
                                  </>
                                )}
                                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-white ws-brand-prism">
                                  {task.assigneeName.slice(0, 1)}
                                </div>
                              </div>
                            </div>
                            <select
                              className="mt-3 w-full rounded-lg border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] px-2.5 py-2 text-xs text-[color:var(--ws-text-primary)] outline-none focus:border-[var(--ws-border-focus)]"
                              value={task.status}
                              onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                              aria-label="تغيير حالة المهمة"
                            >
                              {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </article>
                        ))}
                        {colTasks.length === 0 && (
                          <WorkspaceEmptyInline
                            icon={CheckSquare}
                            title="لا توجد مهام"
                            accent={col.accent}
                            className="min-h-[120px] py-4"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading && view === "list" && (
          <section className={cn(WS_CARD, "overflow-hidden p-0")}>
            {/* Mobile cards */}
            <div className="block md:hidden space-y-2 p-3">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="min-w-0 text-sm font-semibold text-[color:var(--ws-text-primary)] line-clamp-2">{task.title}</h4>
                    <span className={cn("badge shrink-0 text-xs", PRIORITY_CONFIG[task.priority].class)}>{PRIORITY_CONFIG[task.priority].label}</span>
                  </div>
                  {task.description && <p className={cn("mt-1 text-xs line-clamp-2", WS_MUTED)}>{task.description}</p>}
                  <div className={cn(WS_MUTED, "mt-2 space-y-1 text-xs")}>
                    <p className="truncate">المُكلَّف: {task.assigneeName}</p>
                    <p className="truncate">العميل: {task.clientName || "—"}</p>
                    <p className={cn("flex items-center gap-1", isOverdue(task.dueDate, task.status) && "text-rose-300")}>
                      {isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}
                      {task.dueDate}
                    </p>
                  </div>
                  <select
                    className="mt-3 w-full rounded-lg border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] px-2.5 py-2.5 text-xs text-[color:var(--ws-text-primary)] outline-none focus:border-[var(--ws-border-focus)]"
                    value={task.status}
                    onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                    aria-label="تغيير حالة المهمة"
                  >
                    {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </article>
              ))}
              {tasks.length === 0 && (
                <WorkspaceEmptyInline icon={CheckSquare} title="لا توجد مهام بعد" accent="cyan" className="py-8" />
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]">
                    {["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"].map((h) => (
                      <th key={h} className="px-4 py-3 text-start font-medium text-[color:var(--ws-text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[color:var(--ws-text-primary)]">{task.title}</div>
                        {task.description && <div className={cn("mt-0.5 line-clamp-2 text-xs", WS_MUTED)}>{task.description}</div>}
                      </td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{task.assigneeName}</td>
                      <td className={cn("px-4 py-3", WS_MUTED)}>{task.clientName || "—"}</td>
                      <td className="px-4 py-3"><span className={cn("badge", PRIORITY_CONFIG[task.priority].class)}>{PRIORITY_CONFIG[task.priority].label}</span></td>
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-rose-300" : WS_MUTED)}>
                          {isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}
                          {task.dueDate}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-lg border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] px-2 py-1.5 text-xs text-[color:var(--ws-text-primary)] outline-none focus:border-[var(--ws-border-focus)]"
                          value={task.status}
                          onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                          aria-label="تغيير حالة المهمة"
                        >
                          {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={6}>
                      <WorkspaceEmptyInline icon={CheckSquare} title="لا توجد مهام بعد" accent="cyan" className="py-10" />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "var(--ws-scrim)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        >
          <div className="flex min-h-[100dvh] items-end justify-center p-2 sm:items-center sm:p-4">
            <div className={cn(WS_GLASS_MODAL, "max-w-2xl rounded-t-2xl sm:rounded-2xl pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_30px_80px_-45px_rgba(34,211,238,0.55)]")}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-[color:var(--ws-text-primary)]">{editTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}</h3>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="rounded-md p-1 text-[color:var(--ws-text-secondary)] transition-colors hover:text-[color:var(--ws-text-primary)] touch-manipulation"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>عنوان المهمة</label>
                  <input className="input-dark min-h-11 text-sm" placeholder="أدخل عنوان المهمة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>الوصف</label>
                  <textarea className="input-dark min-h-24 resize-none text-sm" rows={3} placeholder="وصف تفصيلي للمهمة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>الأولوية</label>
                    <select className="input-dark min-h-11 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                      <option value="عاجلة">عاجلة</option><option value="عالية">عالية</option><option value="متوسطة">متوسطة</option><option value="منخفضة">منخفضة</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>الحالة</label>
                    <select className="input-dark min-h-11 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                      {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>المُكلَّف</label>
                    <select
                      className="input-dark min-h-11 text-sm"
                      value={form.assigneeId}
                      onChange={(e) => {
                        const emp = employees.find((x) => x.id === e.target.value);
                        setForm({ ...form, assigneeId: e.target.value, assigneeName: emp?.name ?? "" });
                      }}
                    >
                      <option value="">— اختر موظفاً —</option>
                      {employees.filter((e) => e.status === "نشط").map((e) => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>الموعد النهائي</label>
                    <input className="input-dark min-h-11 text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={cn(WS_MUTED, "mb-1.5 block text-xs")}>العميل (اختياري)</label>
                  <select
                    className="input-dark min-h-11 text-sm"
                    value={form.clientId}
                    onChange={(e) => {
                      const cl = clients.find((x) => x.id === e.target.value);
                      setForm({ ...form, clientId: e.target.value, clientName: cl?.name ?? "" });
                    }}
                  >
                    <option value="">— بدون عميل —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button onClick={() => { setShowModal(false); resetForm(); }} disabled={saving} className="btn-secondary min-h-11 flex-1 touch-manipulation">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary min-h-11 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation">
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {saving ? "جارٍ الحفظ..." : editTask ? "حفظ التعديلات" : "إضافة المهمة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
