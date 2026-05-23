"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Department, DepartmentInput } from "@/lib/org/types";

const ICONS = ["Building2", "Briefcase", "Layers", "Network", "Users"];
const COLORS = ["#22d3ee", "#1e6fd9", "#10b981", "#f59e0b", "#a855f7", "#ff7a3d"];

interface Props {
  department?: Department | null;
  departments: Department[];
  onSave: (input: DepartmentInput) => Promise<void>;
  onClose: () => void;
}

export default function DepartmentFormModal({
  department,
  departments,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [parentId, setParentId] = useState(department?.parent_id ?? "");
  const [color, setColor] = useState(department?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(department?.icon ?? ICONS[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        parent_id: parentId || null,
        manager_id: department?.manager_id ?? null,
        color,
        icon,
        sort_order: department?.sort_order ?? departments.length,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-heading font-bold">
            {department ? "تعديل إدارة" : "إدارة جديدة"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#8ba3c7] hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">اسم الإدارة *</label>
          <input className="input-dark w-full text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الوصف</label>
          <input className="input-dark w-full text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">تابعة لـ</label>
          <select className="input-dark w-full text-sm" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— بدون —</option>
            {departments
              .filter((d) => d.id !== department?.id)
              .map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-8 h-8 rounded-full border-2"
              style={{
                background: c,
                borderColor: color === c ? "#fff" : "transparent",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving || !name.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save size={16} />
          حفظ
        </button>
      </div>
    </div>
  );
}
