"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/owner";
import { Eye, EyeOff, ShieldAlert, Crown } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  // If a valid owner session already exists, skip the form and go straight to
  // the command center. A non-owner / client session is intentionally left on
  // this page so the owner can still sign in — a client session never grants
  // owner access, and this page never redirects to /auth or the client app.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active && isOwnerEmail(user?.email)) {
        router.replace("/owner");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setAccessDenied(false);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !data.user) {
        setError("بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }

      if (!isOwnerEmail(data.user.email)) {
        await supabase.auth.signOut();
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      document.cookie = `blumark_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.replace("/owner");
    } catch {
      setError("تعذّر إكمال تسجيل الدخول — حاول مجدداً");
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0a0a 0%, #0a0a0a 60%, #0a1628 100%)" }}
        dir="rtl"
      >
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-red-900/20 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center max-w-sm">
          <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-red-950/60 border border-red-800/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={44} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">وصول مرفوض</h1>
            <p className="text-[#8ba3c7] text-sm leading-relaxed">
              هذه المنطقة مخصصة لمالك المنصة حصراً.
              <br />
              حسابك غير مدرج في قائمة الوصول المصرّح بها.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAccessDenied(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-[#8ba3c7] border border-[#1e3a5f] hover:border-[#2a4f7f] hover:text-white transition-all"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d1f38 0%, #0a1628 50%, #060e1a 100%)" }}
      dir="rtl"
    >
      {/* Ambient command-center glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-8%] h-[480px] w-[480px] rounded-full bg-amber-500/8 blur-[120px]" />
        <div className="absolute top-1/3 left-[-10%] h-[400px] w-[400px] rounded-full bg-[#1e3a8a]/15 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-1/3 h-[360px] w-[360px] rounded-full bg-amber-600/6 blur-[110px]" />
      </div>

      {/* Hex grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath d='M30 2L58 18v36L30 70 2 54V18z' fill='none' stroke='%23f59e0b' stroke-width='1'/%3E%3Cpath d='M30 70l28 16v-32zM2 54l28 16V38zM30 2L2 18v36z' fill='none' stroke='%23f59e0b' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">

        {/* Crown + Title */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-4">
            {/* Icon badge */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl scale-150" />
              <div
                className="relative flex items-center justify-center w-20 h-20 rounded-2xl border"
                style={{
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.1) 100%)",
                  borderColor: "rgba(245,158,11,0.4)",
                  boxShadow: "0 0 40px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <Crown size={36} className="text-amber-400" />
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="text-xs tracking-[0.3em] text-amber-500/70 uppercase mb-1 font-mono">
                Owner Access
              </div>
              <h1 className="text-2xl font-bold text-white font-heading">
                مركز القيادة
              </h1>
              <p className="text-[#4a6fa5] text-sm mt-1">
                محمي · مخصص لمالك المنصة فقط
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          className="relative rounded-2xl p-8"
          style={{
            background: "linear-gradient(135deg, rgba(13,31,56,0.95) 0%, rgba(10,22,40,0.98) 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(245,158,11,0.08)",
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)" }}
          />

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                className="input-dark w-full"
                placeholder="owner@blumark24.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ borderColor: "rgba(245,158,11,0.15)" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-[#8ba3c7] mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input-dark w-full pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ borderColor: "rgba(245,158,11,0.15)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-amber-400 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
              style={{
                background: loading
                  ? "rgba(245,158,11,0.15)"
                  : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: loading ? "rgba(245,158,11,0.7)" : "#0a0e17",
                boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.3)",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <>
                  <Crown size={16} />
                  <span>دخول مركز القيادة</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer badge */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-[#1e3a5f]/50" />
          <span className="text-[10px] tracking-widest text-[#2a4a6f] uppercase font-mono">Blumark24 OS</span>
          <div className="h-px flex-1 bg-[#1e3a5f]/50" />
        </div>
      </div>
    </div>
  );
}
