"use client";

import { useEffect, useState } from "react";
import { X, KeyRound, AlertCircle, Building2, Mail, ShieldCheck } from "lucide-react";
import { resetClientPassword, type DisplayOrgFull } from "../../_lib/ownerQueries";

interface Props {
  org: DisplayOrgFull | null;
  onClose: () => void;
  onDone: () => void;
}

// Confirmation-only modal. It never shows, generates, or sends a password — it
// triggers a secure recovery link to the tenant manager's email via the
// owner-gated server route.
export default function ResetClientPasswordModal({ org, onClose, onDone }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setSaving(false);
    setError(null);
  }, [org]);

  if (!org) return null;

  const handleConfirm = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    const res = await resetClientPassword(org.id);
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "تعذّر إرسال رابط إعادة التعيين، حاول مرة أخرى");
      return;
    }
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-[#f59e0b]/25">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b]/12 border border-[#f59e0b]/30">
              <KeyRound size={16} className="text-[#fbbf24]" />
            </span>
            إعادة تعيين كلمة مرور مدير المنشأة
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

        {/* Body */}
        <p className="mb-4 text-[13px] leading-relaxed text-[#9fb3cf]">
          سيتم إرسال رابط آمن لإعادة تعيين كلمة المرور إلى بريد مدير هذه المنشأة.
        </p>

        {/* Summary */}
        <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#8ba3c7] flex items-center gap-1.5">
              <Building2 size={14} /> المنشأة
            </span>
            <span className="font-semibold text-white">{org.name}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#8ba3c7] flex items-center gap-1.5">
              <Mail size={14} /> بريد المدير
            </span>
            <span className="font-semibold text-white" dir="ltr">{org.ownerEmail ?? "—"}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-[#10b981]/15 bg-[#10b981]/[0.05] p-3 text-[12px] text-[#9fb3cf] leading-relaxed">
          <ShieldCheck size={14} className="text-[#34d399] flex-shrink-0 mt-0.5" />
          لا يتم عرض أو إرسال كلمة المرور الحالية. يقوم المدير بتعيين كلمة مرور جديدة بنفسه عبر الرابط الآمن.
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "جارٍ الإرسال..." : "إرسال رابط الإعادة"}
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
      </div>
    </div>
  );
}
