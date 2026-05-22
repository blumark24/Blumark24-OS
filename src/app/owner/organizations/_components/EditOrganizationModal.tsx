"use client";

import { useEffect, useState } from "react";
import { X, Building2, AlertCircle } from "lucide-react";
import { updateOrganization, type DisplayOrgFull } from "../../_lib/ownerQueries";

interface Props {
  org: DisplayOrgFull | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditOrganizationModal({ org, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setName(org.name ?? "");
    setOwnerEmail(org.ownerEmail ?? "");
    setNotes("");
    setError(null);
    setSaving(false);
  }, [org]);

  if (!org) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError("اسم المنشأة مطلوب");
      return;
    }
    setError(null);
    setSaving(true);
    const res = await updateOrganization({
      id: org.id,
      name,
      ownerEmail: ownerEmail || null,
      notes: notes || null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "تعذّر تحديث المنشأة");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-[#22d3ee]/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22d3ee]/12 border border-[#22d3ee]/25">
              <Building2 size={16} className="text-[#22d3ee]" />
            </span>
            تعديل المنشأة
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#8ba3c7] hover:text-white transition-colors disabled:opacity-50"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">اسم المنشأة *</label>
            <input
              className="input-dark text-sm"
              placeholder="مثال: شركة القمة التقنية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Owner email */}
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">بريد المالك</label>
            <input
              className="input-dark text-sm"
              type="email"
              dir="ltr"
              style={{ textAlign: "left" }}
              placeholder="owner@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              spellCheck={false}
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
            <p className="text-[10px] text-[#8ba3c7]/70 mt-1">المعرّف (slug) ثابت ولا يمكن تعديله بعد الإنشاء.</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">ملاحظات</label>
            <textarea
              className="input-dark text-sm min-h-[80px] resize-y"
              placeholder="ملاحظات داخلية (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
