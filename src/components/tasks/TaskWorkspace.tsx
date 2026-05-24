"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  CheckSquare,
  Plus,
  List,
  Columns,
  AlertCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useClients, useEmployees } from "@/hooks/useData";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { useToast } from "@/contexts/ToastContext";
import TaskKanban from "@/components/tasks/TaskKanban";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import TaskAutomationsPanel from "@/components/tasks/TaskAutomationsPanel";
import type { Task, TaskStatus } from "@/types";

type ViewMode = "kanban" | "list" | "automations";

const PRIORITY_CLASS: Record<Task["priority"], string> = {
  عاجلة: "priority-urgent",
  عالية: "priority-high",
  متوسطة: "priority-medium",
  منخفضة: "priority-low",
};

export default function TaskWorkspace() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = hasPermission("manage_tasks");

  const authorName = user?.name?.trim() || user?.email?.split("@")[0] || "مستخدم";
  const authorId = user?.id ?? "";

  const { data: tasks, loading, insert, update, remove } = useTasks();
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  const engine = useTaskEngine(tasks, true);

  const [view, setView] = useState<ViewMode>("kanban");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const deptMap = useMemo(() => {
    const m = new Map<string, string>();
    engine.snapshot?.departments.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [engine.snapshot?.departments]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "مكتملة").length,
      inProgress: tasks.filter((t) => t.status === "قيد_التنفيذ").length,
      late: tasks.filter((t) => t.status === "متأخرة").length,
    }),
    [tasks],
  );

  const handleMove = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const changes: Partial<Task> = { status };
      if (status === "مكتملة") {
        changes.completedAt = new Date().toISOString();
      }
      await update(taskId, changes);
      const updated = { ...task, ...changes };
      await engine.runAutomations("status_changed", updated);
      if (status === "مكتملة") {
        await engine.runAutomations("task_completed", updated);
        await engine.spawnRecurring(updated, authorName);
      }
      await engine.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر نقل المهمة");
    }
  };

  const handleSave = async (payload: Omit<Task, "id" | "createdAt">) => {
    setSaving(true);
    try {
      if (editTask) {
        await update(editTask.id, payload);
        const updated = { ...editTask, ...payload };
        await engine.runAutomations("status_changed", updated);
        toast.success("تم تحديث المهمة");
      } else {
        await insert({
          ...payload,
          createdById: authorId,
          createdByName: authorName,
        });
        toast.success("تمت إضافة المهمة");
      }
      setShowModal(false);
      setEditTask(null);
      await engine.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر حفظ المهمة");
    } finally {
      setSaving(false);
    }
  };

  const migrationHint =
    engine.error &&
    (engine.error.includes("does not exist") ||
      engine.error.includes("relation") ||
      engine.error.includes("task_"));
  const bucketHint =
    engine.error?.includes("task-attachments") ||
    engine.error?.includes("حاوية التخزين");

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
              <CheckSquare size={22} className="text-[#22d3ee]" />
              محرك المهام
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">
              كانبان، أولويات، مواعيد، تكرار، تعيينات، تعليقات ومرفقات
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[#2f4f82] bg-[#0b1b36]/90 p-1">
              {(
                [
                  { id: "kanban" as const, icon: Columns },
                  { id: "list" as const, icon: List },
                  { id: "automations" as const, icon: Zap },
                ] as const
              ).map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={cn(
                    "rounded-lg p-2 transition-all",
                    view === id ? "bg-[#22d3ee] text-[#0a1628]" : "text-[#8ba3c7]",
                  )}
                  aria-label={id}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
            {canManage && (
              <button
                type="button"
                className="btn-primary text-sm flex items-center gap-2"
                onClick={() => {
                  setEditTask(null);
                  setShowModal(true);
                }}
              >
                <Plus size={14} />
                مهمة جديدة
              </button>
            )}
          </div>
        </div>

        {engine.error && (
          <div className="glass-card p-4 flex gap-3 border border-amber-500/30">
            <AlertCircle className="text-amber-400 shrink-0" size={20} />
            <div>
              <p className="text-white text-sm">{engine.error}</p>
              {migrationHint && !bucketHint && (
                <p className="text-[#22d3ee] text-xs mt-2">
                  طبّق migration 025_tenant_task_engine.sql (بعد 019 و023/024) وأنشئ bucket
                  «task-attachments» في Supabase Storage.
                </p>
              )}
              {bucketHint && (
                <p className="text-amber-300 text-xs mt-2">
                  أنشئ bucket «task-attachments» في Supabase Storage مع سياسات رفع/قراءة مناسبة
                  للمستأجر الحالي.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "الإجمالي", value: stats.total, color: "#22d3ee" },
            { label: "مكتملة", value: stats.completed, color: "#10b981" },
            { label: "قيد التنفيذ", value: stats.inProgress, color: "#f59e0b" },
            { label: "متأخرة", value: stats.late, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs text-[#8ba3c7] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {loading && (
          <p className="text-center text-[#8ba3c7] text-sm py-8">جارٍ تحميل المهام...</p>
        )}

        {!loading && view === "kanban" && (
          <TaskKanban
            tasks={tasks}
            canManage={canManage}
            departmentNames={deptMap}
            onMove={handleMove}
            onSelect={setSelected}
          />
        )}

        {!loading && view === "list" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["المهمة", "المُكلَّف", "القسم", "الأولوية", "الموعد", "الحالة"].map(
                    (h) => (
                      <th key={h} className="text-right text-[#8ba3c7] px-4 py-3">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#1e3a5f]/40 cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => setSelected(t)}
                  >
                    <td className="px-4 py-3 text-white">{t.title}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{t.assigneeName}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">
                      {t.departmentId ? deptMap.get(t.departmentId) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${PRIORITY_CLASS[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{t.dueDate}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{t.status.replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && view === "automations" && engine.snapshot && (
          <TaskAutomationsPanel
            triggers={engine.snapshot.triggers}
            canManage={canManage}
            onAdd={(input) => engine.addTrigger(input)}
            onToggle={(id, enabled) => engine.updateTrigger(id, { enabled })}
            onRemove={(id) => engine.removeTrigger(id)}
          />
        )}
      </div>

      <TaskFormModal
        open={showModal}
        editTask={editTask}
        departments={engine.snapshot?.departments ?? []}
        employees={employees}
        clients={clients}
        saving={saving}
        onClose={() => {
          setShowModal(false);
          setEditTask(null);
        }}
        onSave={handleSave}
      />

      {selected && engine.snapshot && (
        <TaskDetailPanel
          task={selected}
          snapshot={engine.snapshot}
          departmentName={
            selected.departmentId ? deptMap.get(selected.departmentId) : undefined
          }
          canManage={canManage}
          authorId={authorId}
          authorName={authorName}
          onClose={() => setSelected(null)}
          onAddComment={async (body) => {
            await engine.addComment({
              task_id: selected.id,
              body,
              author_id: authorId,
              author_name: authorName,
            });
            await engine.runAutomations("comment_added", selected);
            toast.success("تم إضافة التعليق");
          }}
          onUploadFile={async (file) => {
            try {
              await engine.uploadAttachment({
                task_id: selected.id,
                file,
                uploaded_by_id: authorId,
                uploaded_by_name: authorName,
              });
              toast.success("تم رفع المرفق");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "تعذر رفع المرفق");
            }
          }}
          onDeleteAttachment={(att) => engine.removeAttachment(att)}
        />
      )}
    </DashboardLayout>
  );
}
