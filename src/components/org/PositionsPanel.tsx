"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Briefcase, ShieldCheck, UserCog, Layers, WalletCards } from "lucide-react";
import type { Position, PositionInput } from "@/lib/org/types";

interface Props {
  positions: Position[];
  canManage: boolean;
  onCreate: (input: PositionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ROLE_TEMPLATES: Array<{
  title: string;
  hint: string;
  level: number;
  permissions: string[];
  icon: typeof Briefcase;
}> = [
  {
    title: "مدير المنشأة",
    hint: "إدارة عامة وصلاحيات تشغيلية عليا",
    level: 0,
    permissions: ["manage_tenant_settings", "manage_users", "manage_reports"],
    icon: ShieldCheck,
  },
  {
    title: "مدير وكالة",
    hint: "قيادة وكالة أو مسار تشغيلي كبير",
    level: 1,
    permissions: ["view_dashboard", "manage_reports", "manage_tasks"],
    icon: Layers,
  },
  {
    title: "مدير إدارة",
    hint: "إشراف على الإدارات والأقسام والفرق",
    level: 2,
    permissions: ["view_dashboard", "manage_tasks", "view_employees"],
    icon: UserCog,
  },
  {
    title: "رئيس قسم",
    hint: "تشغيل يومي ومتابعة أداء الفريق",
    level: 3,
    permissions: ["view_dashboard", "manage_tasks"],
    icon: Briefcase,
  },
  {
    title: "مدير مالي",
    hint: "متابعة مالية المنشأة والتقارير",
    level: 2,
    permissions: ["manage_finance", "manage_reports"],
    icon: WalletCards,
  },
];

function normalizeRoleTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
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

  const existingTitles = useMemo(() => {
    return new Set(
      positions.map((position) =>
        normalizeRoleTitle(position.title_ar || position.title || ""),
      ),
    );
  }, [positions]);

  const createPosition = async (input: PositionInput) => {
    setSaving(true);
    setError("");
    try {
      await onCreate(input);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر حفظ الدور الوظيفي");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    await createPosition({
      title: trimmed,
      title_ar: trimmed,
      parent_id: null,
      level: 0,
      permissions: [],
      sort_order: positions.length,
    });
  };

  const handleTemplateAdd = async (template: (typeof ROLE_TEMPLATES)[number]) => {
    if (saving || existingTitles.has(normalizeRoleTitle(template.title))) return;
    await createPosition({
      title: template.title,
      title_ar: template.title,
      parent_id: null,
      level: template.level,
      permissions: template.permissions,
      sort_order: positions.length,
    });
  };

  return (
    <div className="glass-card p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Briefcase size={16} className="text-[#22d3ee]" />
            مكتبة الأدوار الوظيفية
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-[#6b87ab]">
            جهّز أدوار المنشأة ثم اربطها بالموظفين داخل الهيكل الإداري.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8ba3c7]">
          {positions.length} دور
        </span>
      </div>

      {canManage && (
        <div className="grid grid-cols-1 gap-1.5">
          {ROLE_TEMPLATES.map((template) => {
            const exists = existingTitles.has(normalizeRoleTitle(template.title));
            const Icon = template.icon;
            return (
              <button
                key={template.title}
                type="button"
                onClick={() => void handleTemplateAdd(template)}
                disabled={saving || exists}
                className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2 text-right transition hover:border-cyan-300/20 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-50"
                title={exists ? "مضاف مسبقًا" : "إضافة الدور"}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-white">{template.title}</span>
                  <span className="block truncate text-[10px] text-[#6b87ab]">{template.hint}</span>
                </span>
                <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-white/45">
                  {exists ? "مضاف" : "+"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {positions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#22d3ee]/20 bg-[#22d3ee]/5 px-3 py-2 text-xs text-[#8ba3c7]">
          لا توجد أدوار بعد. ابدأ بإضافة مدير المنشأة ثم رؤساء الأقسام.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
          {positions.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-sm text-white/90"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{p.title_ar || p.title}</span>
                <span className="block text-[10px] text-[#6b87ab]">
                  مستوى {p.level ?? 0} · {p.permissions?.length ?? 0} صلاحية
                </span>
              </span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`حذف "${p.title_ar || p.title}"؟`)) void onDelete(p.id);
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  aria-label="حذف الدور"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex gap-2">
            <input
              className="input-dark flex-1 text-sm"
              placeholder="دور مخصص مثل: مسؤول جودة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !title.trim()}
              className="btn-primary px-3 min-h-10 touch-manipulation disabled:opacity-50"
              aria-label="إضافة دور مخصص"
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
