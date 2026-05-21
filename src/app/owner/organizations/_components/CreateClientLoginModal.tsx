"use client";

import { useEffect, useState } from "react";
import { X, KeyRound, AlertCircle, Building2, Mail, Eye, EyeOff, RefreshCw } from "lucide-react";
import { createClientLogin, type DisplayOrgFull } from "../../_lib/ownerQueries";

// Generates a strong temp password that satisfies the server password rules
// (upper + lower + digit + symbol, length ≥ 8). Uses the Web Crypto API.
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const symbol = "!@#$%&*?";
  const all = upper + lower + digit + symbol;
  const pick = (set: string, n: number) => {
    const out: string[] = [];
    const rnd = new Uint32Array(n);
    crypto.getRandomValues(rnd);
    for (let i = 0; i < n; i++) out.push(set[rnd[i] % set.length]);
    return out;
  };
  const chars = [
    ...pick(upper, 2),
    ...pick(lower, 4),
    ...pick(digit, 2),
    ...pick(symbol, 2),
    ...pick(all, 2),
  ];
  // Fisher–Yates shuffle with crypto randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

interface Props {
  org: DisplayOrgFull | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClientLoginModal({ org, onClose, onCreated }: Props) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setPassword("");
    setShowPw(false);
    setError(null);
    setSaving(false);
  }, [org]);

  if (!org) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!password) {
      setError("كلمة المرور المؤقتة مطلوبة");
      return;
    }

    setSaving(true);
    const res = await createClientLogin({ organizationId: org.id, password });
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "تعذّر إنشاء حساب الدخول");
      return;
    }
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-[#1e6fd9]/25">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e6fd9]/15 border border-[#1e6fd9]/30">
              <KeyRound size={16} className="text-[#5b9bf0]" />
            </span>
            إنشاء حساب دخول
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
              <Mail size={14} /> بريد الدخول
            </span>
            <span className="font-semibold text-white" dir="ltr">{org.ownerEmail ?? "—"}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Temp password */}
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">كلمة المرور المؤقتة *</label>
            <div className="relative">
              <input
                className="input-dark text-sm pl-20"
                type={showPw ? "text" : "password"}
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="text-[#8ba3c7] hover:text-white p-1"
                  aria-label={showPw ? "إخفاء" : "إظهار"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => { setPassword(generatePassword()); setShowPw(true); }}
                  className="text-[#5b9bf0] hover:text-[#7fb0f5] p-1"
                  title="توليد كلمة مرور قوية"
                  aria-label="توليد"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#6b87ab] mt-1">
              8 أحرف على الأقل · حرف كبير · حرف صغير · رقم · رمز. سيُطلب من العميل تغييرها عند أول دخول.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#22d3ee]/15 bg-[#22d3ee]/[0.05] p-3 text-[12px] text-[#9fb3cf] leading-relaxed">
            <KeyRound size={14} className="text-[#22d3ee] flex-shrink-0 mt-0.5" />
            يسجّل العميل الدخول من صفحة <span className="text-[#22d3ee] font-medium">/auth</span> بهذا البريد وكلمة المرور، ويصل إلى لوحة العميل فقط — لا يمكنه الوصول إلى مركز المالك.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
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
