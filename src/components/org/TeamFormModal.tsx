"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Department, Team, TeamInput } from "@/lib/org/types";

interface Props {
  team?: Team | null;
  departments: Department[];
  defaultDepartmentId?: string;
  onSave: (input: TeamInput) => Promise<void>;
  onClose: () => void;
}

export default function TeamFormModal({
  team,
  departments,
  defaultDepartmentId,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState(team?.name ?? "");
  const [departmentId, setDepartmentId] = useState(
    team?.department_id ?? defaultDepartmentId ?? departments[0]?.id ?? "",
  );
  const [description, setDescription] = useState(team?.description ?? "");
  const [color, setColor] = useState(team?.color ?? "#1e6fd9");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !departmentId) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        department_id: departmentId,
        description: description.trim() || null,
        leader_id: team?.leader_id ?? null,
        color,
        icon: team?.icon ?? "Users",
        sort_order: team?.sort_order ?? 0,
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
            {team ? "تعديل فريق" : "فريق جديد"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#8ba3c7] hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">اسم الفريق *</label>
          <input className="input-dark w-full text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الإدارة *</label>
          <select
            className="input-dark w-full text-sm"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الوصف</label>
          <input className="input-dark w-full text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving || !name.trim() || !departmentId}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save size={16} />
          حفظ
        </button>
      </div>
    </div>
  );
}
