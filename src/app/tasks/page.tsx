"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckSquare, Plus, List, Columns, Clock, AlertTriangle, X } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useData";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import AccessDenied from "@/components/ui/AccessDenied";

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
  const { data: tasks, loading, insert, update } = useTasks();
  const { userRole } = usePermissions();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";
  const [view, setView] = useState<ViewMode>("kanban");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "جديدة" as TaskStatus,
    priority: "متوسطة" as TaskPriority,
    assigneeName: "",
    clientName: "",
    dueDate: "",
  });

  const handleAdd = async () => {
    if (!form.title) return;
    try {
      await insert({
        assigneeId: "1",
        ...form,
      });
      toast.success("تمت إضافة المهمة بنجاح");
      setShowModal(false);
      setForm({ title: "", description: "", status: "جديدة", priority: "متوسطة", assigneeName: "", clientName: "", dueDate: "" });
    } catch {
      toast.error("حدث خطأ أثناء إضافة المهمة");
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await update(taskId, { status: newStatus });
    } catch {
      toast.error("حدث خطأ أثناء تحديث المهمة");
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
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
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
                          <span className={`badge text-xs flex-shrink-0 ${PRIORITY_CONFIG[task.priority].class}`}>
                            {PRIORITY_CONFIG[task.priority].label}
                          </span>
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
                          <div className="w-6 h-6 rounded-full bg-[#1e6fd9] flex items-center justify-center text-xs text-white">
                            {task.assigneeName.slice(0, 1)}
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

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">إضافة مهمة جديدة</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8ba3c7] hover:text-white"><X size={20} /></button>
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
                  <input className="input-dark text-sm" placeholder="اسم الموظف" value={form.assigneeName} onChange={(e) => setForm({ ...form, assigneeName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الموعد النهائي</label>
                  <input className="input-dark text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">العميل (اختياري)</label>
                <input className="input-dark text-sm" placeholder="اسم العميل" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAdd} className="btn-primary flex-1">إضافة المهمة</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function TasksPage() {
  const { hasPermission } = usePermissions();
  if (!hasPermission("manage_tasks")) {
    return <DashboardLayout><AccessDenied /></DashboardLayout>;
  }
  return <TasksContent />;
}
