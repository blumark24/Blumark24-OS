"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Task, TaskPriority, TaskRecurrenceRule, TaskStatus } from "@/types";
import type { TaskDepartment } from "@/lib/tasks/types";
import type { Client, Employee } from "@/types";

const STATUSES: TaskStatus[] = [
  "جديدة",
  "قيد_التنفيذ",
  "بانتظار_المراجعة",
  "مكتملة",
  "متأخرة",
];

interface FormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assigneeName: string;
  clientId: string;
  clientName: string;
  dueDate: string;
  departmentId: string;
  recurrence: TaskRecurrenceRule;
  notifyAssignee: boolean;
}

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  status: "جديدة",
  priority: "متوسطة",
  assigneeId: "",
  assigneeName: "",
  clientId: "",
  clientName: "",
  dueDate: new Date().toISOString().slice(0, 10),
  departmentId: "",
  recurrence: { frequency: "none" },
  notifyAssignee: true,
});

interface Props {
  open: boolean;
  editTask: Task | null;
  departments: TaskDepartment[];
  employees: Employee[];
  clients: Client[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Task, "id" | "createdAt">) => Promise<void>;
}

export default function TaskFormModal({
  open,
  editTask,
  departments,
  employees,
  clients,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description ?? "",
        status: editTask.status,
        priority: editTask.priority,
        assigneeId: editTask.assigneeId,
        assigneeName: editTask.assigneeName,
        clientId: editTask.clientId ?? "",
        clientName: editTask.clientName ?? "",
        dueDate: editTask.dueDate,
        departmentId: editTask.departmentId ?? "",
        recurrence: editTask.recurrenceRule ?? { frequency: "none" },
        notifyAssignee: editTask.notifyAssignee ?? true,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, editTask]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await onSave({
      title: form.title.trim(),
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId,
      assigneeName: form.assigneeName,
      clientId: form.clientId || undefined,
      clientName: form.clientName || undefined,
      dueDate: form.dueDate,
      dueAt: `${form.dueDate}T12:00:00Z`,
      departmentId: form.departmentId || undefined,
      recurrenceRule:
        form.recurrence.frequency === "none" ? null : form.recurrence,
      notifyAssignee: form.notifyAssignee,
      createdById: editTask?.createdById,
      createdByName: editTask?.createdByName,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-white font-bold">{editTask ? "تعديل مهمة" : "مهمة جديدة"}</h3>
          <button type="button" onClick={onClose}>
            <X size={18} className="text-[#8ba3c7]" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            className="input-dark w-full text-sm"
            placeholder="العنوان *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="input-dark w-full text-sm resize-none"
            rows={3}
            placeholder="الوصف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input-dark text-sm"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as TaskPriority })
              }
            >
              <option value="عاجلة">عاجلة</option>
              <option value="عالية">عالية</option>
              <option value="متوسطة">متوسطة</option>
              <option value="منخفضة">منخفضة</option>
            </select>
            <select
              className="input-dark text-sm"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as TaskStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input-dark text-sm"
              value={form.assigneeId}
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  assigneeId: e.target.value,
                  assigneeName: emp?.name ?? "",
                });
              }}
            >
              <option value="">المُكلَّف</option>
              {employees
                .filter((e) => e.status === "نشط")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
            <input
              className="input-dark text-sm"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <select
            className="input-dark w-full text-sm"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            <option value="">القسم (اختياري)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="input-dark w-full text-sm"
            value={form.clientId}
            onChange={(e) => {
              const cl = clients.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                clientId: e.target.value,
                clientName: cl?.name ?? "",
              });
            }}
          >
            <option value="">عميل (اختياري)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input-dark text-sm"
              value={form.recurrence.frequency}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurrence: {
                    frequency: e.target.value as TaskRecurrenceRule["frequency"],
                    interval: 1,
                  },
                })
              }
            >
              <option value="none">بدون تكرار</option>
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-[#8ba3c7]">
              <input
                type="checkbox"
                checked={form.notifyAssignee}
                onChange={(e) =>
                  setForm({ ...form, notifyAssignee: e.target.checked })
                }
              />
              إشعار المُكلَّف
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
