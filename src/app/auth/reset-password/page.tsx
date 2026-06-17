"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [sessionReady, setSessionReady] = useState(false);
  const [expired,      setExpired]      = useState(false);
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event — fires when Supabase
    // exchanges the recovery hash fragment for a valid session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Fallback: if already in a recovery session on mount (page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setSessionReady(true);
    });

    // Show expired message after 10 s if no recovery session arrives
    const timer = setTimeout(() => {
      setExpired((prev) => prev || false);
      setExpired(true);
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Cancel expiry timer once session is ready
  useEffect(() => {
    if (sessionReady) setExpired(false);
  }, [sessionReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw !== confirmPw) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (newPw.length < 8)            { setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");      return; }
    if (!/[A-Z]/.test(newPw))        { setError("كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)");   return; }
    if (!/[a-z]/.test(newPw))        { setError("كلمة المرور يجب أن تحتوي على حرف صغير (a-z)");   return; }
    if (!/[0-9]/.test(newPw))        { setError("كلمة المرور يجب أن تحتوي على رقم (0-9)");         return; }
    if (!/[^A-Za-z0-9]/.test(newPw)) { setError("كلمة المرور يجب أن تحتوي على رمز (!@#$...)");     return; }

    setLoading(true);

    const guardRes = await fetch("/api/auth/check-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "تعذر التحقق من كلمة المرور" }));

    if (!guardRes.ok) {
      setLoading(false);
      setError(guardRes.error ?? "كلمة المرور غير مقبولة");
      return;
    }

    const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (updErr) {
      setError(`فشل تحديث كلمة المرور: ${updErr.message}`);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => router.replace("/auth"), 2000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#142844 100%)" }}
    >
      <JellyfishBackground />
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg glow-teal"
              style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95" />
                <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-heading font-bold text-white">Blumark24</div>
              <div className="text-sm text-[#22d3ee] font-medium">OS – نظام إدارة الأعمال</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8">
          {/* Success state */}
          {success && (
            <div className="text-center space-y-4">
              <CheckCircle size={40} className="text-emerald-400 mx-auto" />
              <h2 className="text-white font-heading font-bold text-xl">تم تغيير كلمة المرور</h2>
              <p className="text-[#8ba3c7] text-sm">يتم تحويلك لصفحة تسجيل الدخول…</p>
            </div>
          )}

          {/* Expired state */}
          {!success && expired && !sessionReady && (
            <div className="text-center space-y-4">
              <h2 className="text-white font-heading font-bold text-xl">رابط منتهي الصلاحية</h2>
              <p className="text-[#8ba3c7] text-sm">انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد.</p>
              <button
                onClick={() => router.replace("/auth")}
                className="btn-primary w-full py-2.5 text-sm"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          )}

          {/* Waiting for recovery session */}
          {!success && !expired && !sessionReady && (
            <div className="text-center space-y-4">
              <div className="w-10 h-10 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin mx-auto" />
              <p className="text-[#8ba3c7] text-sm">جارٍ التحقق من الرابط…</p>
            </div>
          )}

          {/* Reset form */}
          {!success && sessionReady && (
            <>
              <h2 className="text-white font-heading font-bold text-xl mb-2 text-center">تعيين كلمة مرور جديدة</h2>
              <p className="text-[#8ba3c7] text-sm mb-6 text-center">أدخل كلمة مرور قوية لحسابك</p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      className="input-dark pl-10"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="input-dark pl-10"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Lock size={16} /><span>حفظ كلمة المرور</span></>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
