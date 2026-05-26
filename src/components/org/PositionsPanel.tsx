"use client";

import { useState } from "react";
import { Plus, Trash2, Briefcase } from "lucide-react";
import type { Position } from "@/lib/org/types";
import type { PositionInput } from "@/lib/org/types";

interface Props {
  positions: Position[];
  canManage: boolean;
  onCreate: (input: PositionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PositionsPanel({
  positions,
  canManage,
  onCreate,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onCreate({
        title: title.trim(),
        title_ar: title.trim(),
        parent_id: null,
        level: 0,
        permissions: [],
        sort_order: positions.length,
      });
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر حفظ المسمى الوظيفي");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-white font-medium text-sm">
        <Briefcase size={16} className="text-[#22d3ee]" />
        المسميات الوظيفية
      </div>
      {positions.length === 0 ? (
        <p className="text-[#8ba3c7] text-xs">لا توجد مسميات بعد</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {positions.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between text-sm text-white/90 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <span>{p.title_ar || p.title}</span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`حذف "${p.title}"؟`)) void onDelete(p.id);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="input-dark flex-1 text-sm"
              placeholder="مسمى جديد"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !title.trim()}
              className="btn-primary px-3 min-h-11 touch-manipulation disabled:opacity-50"
            >
              <Plus size={14} />
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}
