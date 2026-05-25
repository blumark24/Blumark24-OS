"use client";

import { useMemo, useState } from "react";
import { X, Save, Lock } from "lucide-react";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import {
  inferDefaultParentId,
  STRUCTURE_LEVEL_LABELS,
  validateParentForLevel,
} from "@/lib/org/packageHierarchy";
import { isBoardReservedName } from "@/lib/org/orgUnits";
import type { Department, DepartmentInput, StructureLevel } from "@/lib/org/types";

const COLORS = ["#22d3ee", "#1e6fd9", "#10b981", "#f59e0b", "#a855f7", "#ff7a3d"];

interface Props {
  level: StructureLevel;
  plan: PlanSlug;
  department?: Department | null;
  departments: Department[];
  locked?: boolean;
  onSave: (input: DepartmentInput) => Promise<void>;
  onClose: () => void;
}

export default function StructureLevelFormModal({
  level,
  plan,
  department,
  departments,
  locked = false,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [parentId, setParentId] = useState(
    department?.parent_id ?? inferDefaultParentId(plan, level, departments) ?? "",
  );
  const [color, setColor] = useState(department?.color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parentOptions = useMemo(() => {
    return departments.filter((d) => {
      if (d.id === department?.id) return false;
      const dl = d.structure_level ?? "department";
      if (level === "management") return dl === "agency" || (plan === "growth" && !dl);
      if (level === "department") return dl === "management" || (plan === "basic" && !d.parent_id);
      return false;
    });
  }, [departments, department?.id, level, plan]);

  const handleSubmit = async () => {
    if (locked || !name.trim()) return;
    if (isBoardReservedName(name.trim())) {
      setError(`«${name.trim()}» محجوز لمجلس الإدارة ولا يمكن استخدامه كاسم وحدة.`);
      return;
    }
    const parent = parentId || null;
    const parentErr = validateParentForLevel(level, parent, departments);
    if (parentErr) {
      setError(parentErr);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        parent_id: parent,
        structure_level: level,
        manager_id: department?.manager_id ?? null,
        color,
        icon: department?.icon ?? "Building2",
        sort_order: department?.sort_order ?? departments.length,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md p-6 space-y-4 rounded-2xl border border-[#22d3ee]/20"
        style={{
          background: "linear-gradient(165deg, rgba(10,22,40,0.98), rgba(15,30,55,0.95))",
          boxShadow: "0 0 40px rgba(34,211,238,0.12)",
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-heading font-bold">
            {department ? "تعديل" : "إضافة"} {STRUCTURE_LEVEL_LABELS[level]}
          </h3>
          <button type="button" onClick={onClose} className="text-[#8ba3c7] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {locked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <Lock size={14} />
            هذا المستوى غير متاح في باقتك الحالية.
          </div>
        )}

        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الاسم *</label>
          <input
            className="input-dark w-full text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={locked}
          />
          <p className="text-[#6b87ab] text-[10px] mt-1">
            «مجلس الإدارة» محجوز كجذر الهيكل ولا يُنشأ كوحدة فرعية.
          </p>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الوصف</label>
          <input
            className="input-dark w-full text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={locked}
          />
        </div>
        {level !== "agency" && (
          <div>
            <label className="text-xs text-[#8ba3c7] block mb-1">تابع لـ</label>
            <select
              className="input-dark w-full text-sm"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={locked}
            >
              <option value="">— تحت المجلس مباشرة —</option>
              {parentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({STRUCTURE_LEVEL_LABELS[d.structure_level ?? "department"]})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={locked}
              className="w-8 h-8 rounded-full border-2"
              style={{
                background: c,
                borderColor: color === c ? "#fff" : "transparent",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving || locked || !name.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 min-h-11"
        >
          <Save size={16} />
          حفظ
        </button>
      </div>
    </div>
  );
}
