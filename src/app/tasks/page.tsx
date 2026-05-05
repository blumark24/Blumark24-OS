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
  { key: "جديدة",             label: "جديدة",             color: "#22d3ee" },
  { key: "قيد_التنفيذ",       label: "قيد التنفيذ",       color: "#f59e0b" },
  { key: "بانتظار_المراجعة",  label: "بانتظار المراجعة",  color: "#a855f7" },
  { key: "مكتملة",            label: "مكتملة",            color: "#10b981" },
  { key: "متأخرة",            label: "متأخرة",            color: "#ef4444" },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; class: string }> = {
  "عاجلة":   { label: "عاجلة",   class: "priority-urgent" },
  "عالية":   { label: "عالية",   class: "priority-high"   },
  "متوسطة":  { label: "متوسطة",  class: "priority-medium" },
  "منخفضة":  { label: "منخفضة",  class: "priority-low"    },
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
  const [view,      setView]      = useState<ViewMode>("kanban");
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editTask,  setEditTask]  = useState<typeof tasks[0] | null>(null);
  const [form, setForm] = useState({
    title:        "",
    description:  "",
    status:       "جديدة" as TaskStatus,
    priority:     "متوسطة" as TaskPriority,
    assigneeId:   "",
    assigneeName: "",
    clientId:     "",
    clientName:   "",
    dueDate:      "",
  });

  const resetForm = () => {
    setForm({ title: "", description: "", status: "جديدة", priority: "متوسطة", assigneeId: "", assigneeName: "", clientId: "", clientName: "", dueDate: "" });
    setEditTask(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (task: typeof tasks[0]) => {
    setEditTask(task);
    setForm({
      title:        task.title,
      description:  task.description ?? "",
      status:       task.status,
      priority:     task.priority,
      assigneeId:   task.assigneeId,
      assigneeName: task.assigneeName,
      clientId:     task.clientId ?? "",
      clientName:   task.clientName ?? "",
      dueDate:      task.dueDate,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("عنوان المهمة مطلوب"); return; }
    setSaving(true);
    try {
      const assigneeId   = form.assigneeId   || user?.id || "";
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
      toast.error("حدث خطأ أثناء حفظ المهمة");
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
      toast.error("حدث خطأ أثناء الحذف");
      console.error("[Task Delete Error]", err);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await update(taskId, { status: newStatus });
    } catch (err) {
      toast.error("حدث خطأ أثناء تحديث المهمة");
      console.error("[Task Move Error]", err);
    }
  };

  const isOverdue = (dueDate: string, status: TaskStatus) =>
    status !== "مكتملة" && new Date(dueDate) < new Date();

  const stats = {
    total:      tasks.length,
    completed:  tasks.filter((t) => t.status === "مكتملة").length,
    inProgress: tasks.filter((t) => t.status === "قيد_التنفيذ").length,
    late:       tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && new Date(t.dueDate) < new Date())).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <CheckSquare size={24} className="text-[#22d3ee]" />
              إدارة المهام
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">تتبع وإدارة مهام الفريق</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0d1f3c] rounded-xl p-1 border border-[#1e3a5f]">
              <button
                onClick={() => setView("kanban")}
                className={cn("p-2 rounded-lg transition-all", view === "kanban" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7]")}
              >
                <Columns size={15} />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7]")}
              >
                <List size={15} />
              </button>
            </div>
            {isAdmin && (
              <button onClick={openAdd} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                مهمة جديدة
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "إجمالي المهام",  value: stats.total,      color: "#22d3ee" },
            { label: "مكتملة",         value: stats.completed,  color: "#10b981" },
            { label: "قيد التنفيذ",   value: stats.inProgress, color: "#f59e0b" },
            { label: "متأخرة",         value: stats.late,       color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm text-[#8ba3c7] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل المهام...</div>
        )}

        {/* Kanban View */}
        {!loading && view === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="flex-shrink-0 w-64">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-white">{col.label}</span>
                    <span className="badge text-xs" style={{ background: `${col.color}20`, color: col.color }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div key={task.id} className="glass-card glass-card-hover p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-white text-sm font-medium leading-snug">{task.title}</h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`badge text-xs ${PRIORITY_CONFIG[task.priority].class}`}>
                              {PRIORITY_CONFIG[task.priority].label}
                            </span>
                          </div>
                        </div>
                        {task.clientName && (
                          <div className="text-xs text-[#8ba3c7] mb-2">👤 {task.clientName}</div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-[#8ba3c7]">
                            <Clock size={11} />
                            <span>{task.dueDate}</span>
                            {isOverdue(task.dueDate, task.status) && task.status !== "متأخرة" && (
                              <AlertTriangle size={11} className="text-red-400 mr-1" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <>
                                <button onClick={() => openEdit(task)} className="p-1 rounded text-[#8ba3c7] hover:text-[#22d3ee] transition-colors" title="تعديل">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button onClick={() => handleDeleteTask(task.id, task.title)} className="p-1 rounded text-[#8ba3c7] hover:text-red-400 transition-colors" title="حذف">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                </button>
                              </>
                            )}
                            <div className="w-6 h-6 rounded-full bg-[#1e6fd9] flex items-center justify-center text-xs text-white">
                              {task.assigneeName.slice(0, 1)}
                            </div>
                          </div>
                        </div>
                        <select
                          className="mt-2 w-full bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-xs text-[#8ba3c7] px-2 py-1 outline-none"
                          value={task.status}
                          onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                        >
                          {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="glass-card p-4 text-center text-xs text-[#6b87ab] border-dashed border-[#1e3a5f]">
                        لا توجد مهام
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && view === "list" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["المهمة", "المُكلَّف", "العميل", "الأولوية", "الموعد", "الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{task.title}</div>
                      {task.description && <div className="text-xs text-[#8ba3c7] mt-0.5">{task.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{task.assigneeName}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{task.clientName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${PRIORITY_CONFIG[task.priority].class}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.dueDate, task.status) ? "text-red-400" : "text-[#8ba3c7]")}>
                        {isOverdue(task.dueDate, task.status) && <AlertTriangle size={11} />}
                        {task.dueDate}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg text-xs px-2 py-1 outline-none text-[#8ba3c7]"
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                      >
                        {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">{editTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-[#8ba3c7] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">عنوان المهمة</label>
                <input className="input-dark text-sm" placeholder="أدخل عنوان المهمة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">الوصف</label>
                <textarea className="input-dark text-sm resize-none" rows={3} placeholder="وصف تفصيلي للمهمة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الأولوية</label>
                  <select className="input-dark text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                    <option value="عاجلة">عاجلة</option>
                    <option value="عالية">عالية</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="منخفضة">منخفضة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
                  <select className="input-dark text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                    {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">المُكلَّف</label>
                  <select
                    className="input-dark text-sm"
                    value={form.assigneeId}
                    onChange={(e) => {
                      const emp = employees.find((x) => x.id === e.target.value);
                      setForm({ ...form, assigneeId: e.target.value, assigneeName: emp?.name ?? "" });
                    }}
                  >
                    <option value="">— اختر موظفاً —</option>
                    {employees.filter((e) => e.status === "نشط").map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الموعد النهائي</label>
                  <input className="input-dark text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">العميل (اختياري)</label>
                <select
                  className="input-dark text-sm"
                  value={form.clientId}
                  onChange={(e) => {
                    const cl = clients.find((x) => x.id === e.target.value);
                    setForm({ ...form, clientId: e.target.value, clientName: cl?.name ?? "" });
                  }}
                >
                  <option value="">— بدون عميل —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editTask ? "حفظ التعديلات" : "إضافة المهمة"}
              </button>
              <button onClick={() => { setShowModal(false); resetForm(); }} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
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
