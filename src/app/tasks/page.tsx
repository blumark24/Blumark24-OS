"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { CheckSquare, Plus, List, Columns, Clock, AlertTriangle, X } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import { useTasks, useClients, useEmployees } from "@/hooks/useData";
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

function TasksContent() {
  const { data: tasks, loading, insert, update, remove } = useTasks();
  const { data: clients } = useClients();
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
    completed: tasks.filter((t) => t.status === "مكتملة").length,
    inProgress: tasks.filter((t) => t.status === "قيد_التنفيذ").length,
    late: tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && new Date(t.dueDate) < new Date())).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <section className="relative overflow-hidden rounded-2xl border border-[#294e8a]/60 bg-gradient-to-br from-[#0d1d3a]/95 via-[#10264a]/90 to-[#0a1730]/95 p-4 sm:p-6 shadow-[0_20px_60px_-35px_rgba(34,211,238,0.55)]">
          <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-heading font-bold text-white">
                <CheckSquare size={24} className="shrink-0 text-[#22d3ee]" />
                <span className="truncate">إدارة المهام</span>
              </h1>
              <p className="mt-1 text-sm text-[#8ba3c7]">تتبع وإدارة مهام الفريق</p>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 lg:justify-end">
              <div className="flex items-center rounded-xl border border-[#2f4f82] bg-[#0b1b36]/90 p-1 backdrop-blur-md">
                <button onClick={() => setView("kanban")} aria-label="عرض كانبان" className={cn("rounded-lg p-2.5 transition-all", view === "kanban" ? "bg-[#22d3ee] text-[#0a1628] shadow-[0_0_24px_rgba(34,211,238,0.45)]" : "text-[#8ba3c7] hover:text-white")}>
                  <Columns size={16} />
                </button>
                <button onClick={() => setView("list")} aria-label="عرض قائمة" className={cn("rounded-lg p-2.5 transition-all", view === "list" ? "bg-[#22d3ee] text-[#0a1628] shadow-[0_0_24px_rgba(34,211,238,0.45)]" : "text-[#8ba3c7] hover:text-white")}>
                  <List size={16} />
                </button>
              </div>
              {isAdmin && (
                <button onClick={openAdd} className="btn-primary min-h-11 px-4 flex items-center gap-2 whitespace-nowrap">
                  <Plus size={16} />
                  مهمة جديدة
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[
            { label: "إجمالي المهام", value: stats.total, color: "#22d3ee", glow: "shadow-cyan-400/30" },
            { label: "مكتملة", value: stats.completed, color: "#10b981", glow: "shadow-emerald-400/30" },
            { label: "قيد التنفيذ", value: stats.inProgress, color: "#f59e0b", glow: "shadow-amber-400/30" },
            { label: "متأخرة", value: stats.late, color: "#ef4444", glow: "shadow-rose-400/30" },
          ].map((s) => (
            <div key={s.label} className={cn("glass-card relative overflow-hidden border border-[#244978] bg-[#0d1f3c]/85 p-4 text-center backdrop-blur-md", `shadow-lg ${s.glow}`)}>
              <div className="absolute inset-x-8 top-0 h-px bg-white/20" />
              <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-[#8ba3c7]">{s.label}</div>
            </div>
          ))}
        </section>

        {loading && <div className="rounded-2xl border border-[#1e3a5f] bg-[#0a1932]/70 py-10 text-center text-sm text-[#8ba3c7]">جارٍ تحميل المهام...</div>}

        {!loading && view === "kanban" && (
          <section className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 sm:gap-4 lg:gap-5 px-0.5">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="w-[280px] sm:w-[300px] lg:w-[320px] shrink-0 rounded-2xl border border-[#264a7a] bg-[#0a1a33]/80 p-3 backdrop-blur-md">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                      <span className="text-sm font-medium text-white">{col.label}</span>
                      <span className="badge text-xs" style={{ background: `${col.color}20`, color: col.color }}>{colTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {colTasks.map((task) => (
                        <article key={task.id} className="glass-card glass-card-hover rounded-xl border border-[#2c4e7d] bg-[#11274b]/70 p-3 sm:p-4">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h4 className="min-w-0 text-sm font-semibold leading-6 text-white line-clamp-2">{task.title}</h4>
                            <span className={`badge shrink-0 text-xs ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                          </div>
                          {task.description && <p className="mb-2 text-xs leading-5 text-[#8ba3c7] line-clamp-2">{task.description}</p>}
                          {task.clientName && <div className="mb-2 truncate text-xs text-[#8ba3c7]">👤 {task.clientName}</div>}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>
                              <Clock size={12} />
                              <span className="truncate">{task.dueDate}</span>
                              {isOverdue(task.dueDate, task.status) && task.status !== "متأخرة" && <AlertTriangle size={12} className="text-red-400" />}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAdmin && (
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

        {!loading && view === "list" && (
          <section className="glass-card overflow-hidden rounded-2xl border border-[#264a79] bg-[#0b1c38]/80">
            <div className="block md:hidden space-y-2 p-3">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-[#2a4c79] bg-[#0f2344]/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="min-w-0 text-sm font-semibold text-white line-clamp-2">{task.title}</h4>
                    <span className={`badge shrink-0 text-xs ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                  </div>
                  {task.description && <p className="mt-1 text-xs text-[#8ba3c7] line-clamp-2">{task.description}</p>}
                  <div className="mt-2 space-y-1 text-xs text-[#8ba3c7]">
                    <p className="truncate">المُكلَّف: {task.assigneeName}</p>
                    <p className="truncate">العميل: {task.clientName || "—"}</p>
                    <p className={cn("flex items-center gap-1", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>{isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />} {task.dueDate}</p>
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
                  {tasks.map((task) => (
                    <tr key={task.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{task.title}</div>
                        {task.description && <div className="mt-0.5 line-clamp-2 text-xs text-[#8ba3c7]">{task.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#8ba3c7]">{task.assigneeName}</td>
                      <td className="px-4 py-3 text-[#8ba3c7]">{task.clientName || "—"}</td>
                      <td className="px-4 py-3"><span className={`badge ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span></td>
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-red-300" : "text-[#8ba3c7]")}>{isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}{task.dueDate}</div>
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
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm">
          <div className="flex min-h-[100dvh] items-end justify-center p-2 sm:items-center sm:p-4">
            <div className="glass-card max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-[#2b4f83] bg-[#0b1e3a]/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_30px_80px_-45px_rgba(34,211,238,0.55)] sm:max-h-[85dvh] sm:rounded-2xl sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-white">{editTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="rounded-md p-1 text-[#8ba3c7] transition-colors hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-[#8ba3c7]">عنوان المهمة</label>
                  <input className="input-dark min-h-11 text-sm" placeholder="أدخل عنوان المهمة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#8ba3c7]">الوصف</label>
                  <textarea className="input-dark min-h-24 resize-none text-sm" rows={3} placeholder="وصف تفصيلي للمهمة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-[#8ba3c7]">الأولوية</label>
                    <select className="input-dark min-h-11 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                      <option value="عاجلة">عاجلة</option><option value="عالية">عالية</option><option value="متوسطة">متوسطة</option><option value="منخفضة">منخفضة</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-[#8ba3c7]">الحالة</label>
                    <select className="input-dark min-h-11 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                      {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-[#8ba3c7]">المُكلَّف</label>
                    <select className="input-dark min-h-11 text-sm" value={form.assigneeId} onChange={(e) => { const emp = employees.find((x) => x.id === e.target.value); setForm({ ...form, assigneeId: e.target.value, assigneeName: emp?.name ?? "" }); }}>
                      <option value="">— اختر موظفاً —</option>
                      {employees.filter((e) => e.status === "نشط").map((e) => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-[#8ba3c7]">الموعد النهائي</label>
                    <input className="input-dark min-h-11 text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#8ba3c7]">العميل (اختياري)</label>
                  <select className="input-dark min-h-11 text-sm" value={form.clientId} onChange={(e) => { const cl = clients.find((x) => x.id === e.target.value); setForm({ ...form, clientId: e.target.value, clientName: cl?.name ?? "" }); }}>
                    <option value="">— بدون عميل —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button onClick={() => { setShowModal(false); resetForm(); }} disabled={saving} className="btn-secondary min-h-11 flex-1">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary min-h-11 flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
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
