"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import { Eye, EyeOff, LogIn } from "lucide-react";

const ROLES = ["مدير_عام", "مدير_مالي", "مدير_مبيعات", "مدير", "موظف"];
const ROLE_LABELS: Record<string, string> = {
  "مدير_عام": "مدير عام",
  "مدير_مالي": "مدير مالي",
  "مدير_مبيعات": "مدير مبيعات",
  "مدير": "مدير",
  "موظف": "موظف",
};

const DEMO_CREDENTIALS = [
  { email: "admin@blumark24.com", password: "admin123", role: "مدير_عام", name: "أحمد محمد" },
  { email: "finance@blumark24.com", password: "finance123", role: "مدير_مالي", name: "فاطمة خالد" },
  { email: "sales@blumark24.com", password: "sales123", role: "مدير_مبيعات", name: "سارة أحمد" },
];

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@blumark24.com");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const found = DEMO_CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (found) {
      router.push("/");
    } else {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#142844 100%)" }}>
      <JellyfishBackground />

      {/* Background orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg glow-teal"
              style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95"/>
                <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-heading font-bold text-white">Blumark24</div>
              <div className="text-sm text-[#22d3ee] font-medium">OS – نظام إدارة الأعمال</div>
            </div>
          </div>
          <p className="text-[#8ba3c7] text-sm">منصة متكاملة بالذكاء الاصطناعي للشركات السعودية</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
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
                  type={showPass ? "text" : "password"}
                  className="input-dark pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-[#1e3a5f]">
            <p className="text-xs text-[#8ba3c7] text-center mb-3">حسابات تجريبية</p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a3356]/50 hover:bg-[#1a3356] transition-colors text-sm"
                >
                  <span className="text-white font-medium">{cred.name}</span>
                  <span className="badge bg-[#0d1f3c] text-[#22d3ee] text-xs">{ROLE_LABELS[cred.role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
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
