"use client";

import { useState } from "react";
import { Zap, Plus, Trash2 } from "lucide-react";
import type { TaskAutomationEvent, TaskAutomationTrigger } from "@/lib/tasks/types";

const EVENTS: { value: TaskAutomationEvent; label: string }[] = [
  { value: "task_created", label: "إنشاء مهمة" },
  { value: "task_completed", label: "إتمام مهمة" },
  { value: "task_overdue", label: "مهمة متأخرة" },
  { value: "task_assigned", label: "تعيين مهمة" },
  { value: "status_changed", label: "تغيير الحالة" },
  { value: "comment_added", label: "تعليق جديد" },
];

interface Props {
  triggers: TaskAutomationTrigger[];
  canManage: boolean;
  onAdd: (input: {
    name: string;
    event_type: TaskAutomationEvent;
    conditions?: Record<string, unknown>;
    actions?: Record<string, unknown>;
  }) => Promise<void>;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function TaskAutomationsPanel({
  triggers,
  canManage,
  onAdd,
  onToggle,
  onRemove,
}: Props) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<TaskAutomationEvent>("task_created");

  return (
    <div className="space-y-4">
      <p className="text-[#8ba3c7] text-sm">
        محفّزات تلقائية لكل منشأة: إشعارات وتغيير حالة عند أحداث المهام.
      </p>

      {canManage && (
        <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="input-dark text-sm sm:col-span-1"
            placeholder="اسم المحفّز"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="input-dark text-sm"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as TaskAutomationEvent)}
          >
            {EVENTS.map((ev) => (
              <option key={ev.value} value={ev.value}>
                {ev.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary text-sm flex items-center justify-center gap-2"
            onClick={() => {
              if (!name.trim()) return;
              void onAdd({
                name: name.trim(),
                event_type: eventType,
                conditions: {},
                actions: { notify_assignee: true },
              }).then(() => {
                setName("");
              });
            }}
          >
            <Plus size={14} />
            إضافة
          </button>
        </div>
      )}

      <div className="space-y-2">
        {triggers.map((t) => (
          <div key={t.id} className="glass-card p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Zap size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium text-sm">{t.name}</div>
                <div className="text-[#8ba3c7] text-xs mt-0.5">
                  {EVENTS.find((e) => e.value === t.event_type)?.label ?? t.event_type}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1 text-xs text-[#8ba3c7]">
                <input
                  type="checkbox"
                  checked={t.enabled}
                  disabled={!canManage}
                  onChange={(e) => void onToggle(t.id, e.target.checked)}
                />
                مفعّل
              </label>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`حذف "${t.name}"؟`)) void onRemove(t.id);
                  }}
                  className="text-[#8ba3c7] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {triggers.length === 0 && (
          <p className="text-center text-[#8ba3c7] text-sm py-6">لا توجد محفّزات بعد</p>
        )}
      </div>
    </div>
  );
}
