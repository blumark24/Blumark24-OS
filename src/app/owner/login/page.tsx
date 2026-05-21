"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, ShieldHalf } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/owner";

const OWNER_ONLY_MSG = "هذا الدخول مخصص لمالك منصة Blumark24 فقط.";

// Independent, owner-only login for the Owner Command Center. It is deliberately
// separate from the client /auth page and authenticates platform-owner accounts
// only (see src/lib/owner.ts). On success it enters /owner.
export default function OwnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    // Hard gate: reject non-owner addresses before touching Supabase so this
    // route can never be used as a general-purpose login.
    if (!isOwnerEmail(normalizedEmail)) {
      setError(OWNER_ONLY_MSG);
      return;
    }

    setLoading(true);
    const { data, error: signErr } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signErr || !data.user) {
      setLoading(false);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    // Defense in depth: confirm the authenticated identity is still an owner,
    // otherwise sign back out so no session leaks into the owner area.
    if (!isOwnerEmail(data.user.email)) {
      await supabase.auth.signOut().catch(() => {});
      setLoading(false);
      setError(OWNER_ONLY_MSG);
      return;
    }

    // Mark the session for the edge middleware synchronously so the redirect to
    // /owner is recognized immediately, independent of the client AuthContext.
    document.cookie = `blumark_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.replace("/owner");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#142844 100%)" }}
    >
      {/* Ambient command-center glow (matches the owner shell) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[#a855f7]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand / heading */}
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_0_24px_-4px_rgba(34,211,238,0.6)]"
            style={{ background: "linear-gradient(135deg,#a855f7,#1e6fd9)" }}
          >
            <ShieldHalf size={26} className="text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            مركز قيادة <span className="gradient-text-teal">Blumark24</span>
          </h1>
          <p className="mt-1.5 text-sm text-[#8ba3c7]">دخول مالك المنصة — Owner Command Center</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
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
                placeholder="owner@blumark24.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                  aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
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
                <>
                  <LogIn size={18} />
                  <span>دخول مالك المنصة</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#8ba3c7]/70">
            هذه المنطقة مخصصة لمالك منصة Blumark24 فقط.
          </p>
        </div>
      </div>
    </div>
  );
}
