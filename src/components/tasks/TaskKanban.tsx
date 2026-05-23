"use client";

import { useMemo, useState } from "react";
import { GripVertical, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "جديدة", label: "جديدة", color: "#22d3ee" },
  { key: "قيد_التنفيذ", label: "قيد التنفيذ", color: "#f59e0b" },
  { key: "بانتظار_المراجعة", label: "بانتظار المراجعة", color: "#a855f7" },
  { key: "مكتملة", label: "مكتملة", color: "#10b981" },
  { key: "متأخرة", label: "متأخرة", color: "#ef4444" },
];

const PRIORITY_CLASS: Record<Task["priority"], string> = {
  عاجلة: "priority-urgent",
  عالية: "priority-high",
  متوسطة: "priority-medium",
  منخفضة: "priority-low",
};

interface Props {
  tasks: Task[];
  canManage: boolean;
  departmentNames: Map<string, string>;
  onMove: (taskId: string, status: TaskStatus) => Promise<void>;
  onSelect: (task: Task) => void;
}

export default function TaskKanban({
  tasks,
  canManage,
  departmentNames,
  onMove,
  onSelect,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const m = new Map<TaskStatus, Task[]>();
    COLUMNS.forEach((c) => m.set(c.key, []));
    tasks.forEach((t) => {
      const list = m.get(t.status) ?? [];
      list.push(t);
      m.set(t.status, list.sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0)));
    });
    return m;
  }, [tasks]);

  const isOverdue = (t: Task) =>
    t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < new Date();

  const handleDrop = async (status: TaskStatus) => {
    if (!dragId || !canManage) return;
    const task = tasks.find((x) => x.id === dragId);
    if (!task || task.status === status) {
      setDragId(null);
      return;
    }
    await onMove(dragId, status);
    setDragId(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
      {COLUMNS.map((col) => {
        const colTasks = byStatus.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            className="flex-shrink-0 w-[min(85vw,300px)] snap-start"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => void handleDrop(col.key)}
          >
            <div
              className="rounded-t-xl px-3 py-2 border border-b-0 border-[#1e3a5f]"
              style={{ background: `${col.color}18` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-semibold">{col.label}</span>
                <span className="text-[#8ba3c7] text-xs">{colTasks.length}</span>
              </div>
            </div>
            <div className="min-h-[280px] rounded-b-xl border border-[#1e3a5f] bg-[#0d1f3c]/50 p-2 space-y-2">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onSelect(task)}
                  className="glass-card p-3 cursor-pointer hover:border-[#22d3ee]/40"
                >
                  <div className="flex gap-2">
                    {canManage && (
                      <GripVertical size={14} className="text-[#6b87ab] mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <h4 className="text-white text-sm font-medium line-clamp-2">{task.title}</h4>
                        <span className={`badge text-xs shrink-0 ${PRIORITY_CLASS[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.departmentId && (
                        <p className="text-[10px] text-[#6b87ab] mt-1 truncate">
                          {departmentNames.get(task.departmentId) ?? "قسم"}
                        </p>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-2",
                          isOverdue(task) ? "text-red-300" : "text-[#8ba3c7]",
                        )}
                      >
                        <Clock size={11} />
                        {task.dueDate}
                        {isOverdue(task) && <AlertTriangle size={11} />}
                      </div>
                      <p className="text-[10px] text-[#8ba3c7] mt-1 truncate">{task.assigneeName}</p>
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="text-center text-[#6b87ab] text-xs py-6">لا مهام</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
