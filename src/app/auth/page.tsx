"use client";

import { useState } from "react";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import { Eye, EyeOff, LogIn, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import { TENANT_BLOCKED_BODY, TENANT_BLOCKED_TITLE } from "@/lib/tenantAccess";

export default function AuthPage() {
  const { login } = useAuth();
  const toast     = useToast();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Forgot-password state
  const [showForgot,   setShowForgot]   = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg,     setResetMsg]     = useState("");
  const [resetErr,     setResetErr]     = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error ?? "خطأ في تسجيل الدخول");
        toast.error(result.error ?? "خطأ في تسجيل الدخول");
      } else {
        toast.success("مرحباً! تم تسجيل الدخول بنجاح");
        // On success login() performs the redirect; keep the button in its
        // loading state so it cannot be re-submitted during navigation.
        return;
      }
    } catch {
      setError("تعذّر إكمال تسجيل الدخول — حاول مجدداً");
      toast.error("تعذّر إكمال تسجيل الدخول — حاول مجدداً");
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErr("");
    setResetMsg("");
    if (!resetEmail.trim()) {
      setResetErr("يرجى إدخال بريدك الإلكتروني");
      return;
    }
    setResetLoading(true);
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim().toLowerCase(),
      { redirectTo }
    );
    setResetLoading(false);
    if (resetError) {
      setResetErr("تعذر إرسال رابط الاسترداد. تحقق من البريد الإلكتروني وحاول مجدداً.");
    } else {
      setResetMsg("تم الإرسال! تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين.");
    }
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
          <div className="inline-flex flex-col items-center gap-3 mb-4">
            <OfficialBlumarkLogo className="w-[155px] sm:w-[190px]" />
            <div className="text-sm text-[#22d3ee] font-medium">OS – نظام إدارة الأعمال</div>
          </div>
          <p className="text-[#8ba3c7] text-sm">منصة متكاملة بالذكاء الاصطناعي للشركات السعودية</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {!showForgot ? (
            <>
              <h2 className="text-white font-heading font-bold text-xl mb-6 text-center">تسجيل الدخول</h2>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input-dark"
                    placeholder="admin@blumark24.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8ba3c7] mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="input-dark pl-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><LogIn size={18} /><span>تسجيل الدخول</span></>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setResetEmail(email); setResetMsg(""); setResetErr(""); }}
                  className="text-sm text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
                <h2 className="text-white font-heading font-bold text-xl">استرداد كلمة المرور</h2>
              </div>

              {resetMsg ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center space-y-3">
                  <Mail size={24} className="mx-auto" />
                  <p>{resetMsg}</p>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="text-xs text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[#8ba3c7] text-sm mb-4">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                  </p>

                  {resetErr && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                      {resetErr}
                    </div>
                  )}

                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
                      <input
                        type="email"
                        className="input-dark"
                        placeholder="admin@blumark24.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                    >
                      {resetLoading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Mail size={17} /><span>إرسال رابط الاسترداد</span></>
                      }
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { icon: "🤖", label: "ذكاء اصطناعي متقدم" },
            { icon: "⚡", label: "أتمتة العمليات" },
            { icon: "📊", label: "تقارير ذكية فورية" },
            { icon: "🔒", label: "أمان وخصوصية عالية" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0d1f3c]/60 text-sm text-[#8ba3c7]">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
