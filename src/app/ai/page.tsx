"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Bot,
  Send,
  RefreshCw,
  AlertCircle,
  Zap,
  Shield,
  Users,
  Target,
  BarChart3,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  Mic,
  Play,
  FlaskConical,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const MAX_HISTORY = 6;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "ما قرار اليوم؟",
  "ما أهم مخاطر التشغيل؟",
  "كم مهمة متأخرة؟",
  "كيف أحسن توزيع العمل؟",
  "ما وضع الهيكل الإداري؟",
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "مرحباً. أنا التوأم الذكي لمنشأتك — أحلّل **ملخصات منشأتك الآمنة** فقط (مهام، موظفون، عملاء، هيكل).\n\nاختر أمراً من لوحة القيادة أو اكتب استفسارك التنفيذي.",
  timestamp: new Date(),
};

const EMPTY_REPLY_FALLBACK =
  "لم أتمكن من صياغة رد — حاول مرة أخرى أو راجع إعدادات المساعد.";

const NETWORK_ERROR_MESSAGE =
  "تعذر الاتصال بالمساعد — تحقق من الشبكة وحاول مجدداً.";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatContent(content: string) {
  return escapeHtml(content)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

const ORBIT_NODES = [
  { label: "الفريق", icon: Users, angle: 0 },
  { label: "العملاء", icon: Target, angle: 51 },
  { label: "المهام", icon: BarChart3, angle: 103 },
  { label: "الهيكل", icon: GitBranch, angle: 154 },
  { label: "المالية", icon: TrendingUp, angle: 206 },
  { label: "المخاطر", icon: AlertTriangle, angle: 257 },
  { label: "التقارير", icon: BarChart3, angle: 309 },
];

const COCKPIT_CARDS = [
  { title: "نبض المنشأة", label: "جاهز للتحليل", prompt: "حلل نبض المنشأة", icon: "💓" },
  { title: "قرار اليوم", label: "اسأل التوأم الذكي", prompt: "ما قرار اليوم؟", icon: "🎯" },
  { title: "رادار المخاطر", label: "بانتظار البيانات", prompt: "ما أهم مخاطر التشغيل؟", icon: "🛡️" },
  { title: "صحة الفريق", label: "جاهز للتحليل", prompt: "هل يوجد ضغط على الفريق؟", icon: "👥" },
  { title: "متابعة العملاء", label: "بانتظار البيانات", prompt: "من العملاء الذين يحتاجون متابعة؟", icon: "🤝" },
  { title: "جاهزية الهيكل الإداري", label: "جاهز للتحليل", prompt: "هل توجد فجوات في الهيكل الإداري؟", icon: "🏛️" },
];

const RISK_PROMPTS = [
  "ما أهم مخاطر التشغيل؟",
  "هل يوجد ضغط على الفريق؟",
  "ما المهام المتأخرة؟",
  "من العملاء الذين يحتاجون متابعة؟",
  "هل توجد فجوات في الهيكل الإداري؟",
];

const COMMAND_PROMPTS = [
  { label: "حلل نبض المنشأة", icon: "💓" },
  { label: "اقترح قرار اليوم", icon: "🎯" },
  { label: "راجع المهام المتأخرة", icon: "⏰" },
  { label: "حلل توزيع العمل", icon: "📊" },
  { label: "من يحتاج متابعة اليوم؟", icon: "🔍" },
  { label: "افحص الهيكل الإداري", icon: "🏛️" },
  { label: "أعطني ملخص تنفيذي مختصر", icon: "📋" },
];

const FUTURE_MODULES = [
  { title: "المساعد الصوتي", subtitle: "قريباً", icon: Mic, desc: "تحدث مع التوأم الذكي بصوتك" },
  { title: "تنفيذ الأوامر", subtitle: "قريباً — بموافقة المدير", icon: Play, desc: "تنفيذ القرارات التنفيذية بإذن صريح" },
  { title: "محاكاة السيناريوهات", subtitle: "قريباً", icon: FlaskConical, desc: "اختبر قرارات التشغيل قبل تنفيذها" },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const addAssistantMessage = useCallback((content: string) => {
    const assistantMsg: Message = {
      id: String(Date.now() + Math.random()),
      role: "assistant",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Scroll chat into view on mobile when sending
    if (chatRef.current && window.innerWidth < 1024) {
      chatRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setErrorBanner(null);
    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        const msg = "يجب تسجيل الدخول لاستخدام المساعد الذكي";
        setErrorBanner(msg);
        addAssistantMessage(`⚠️ ${msg}`);
        return;
      }

      const history = messages
        .filter((m) => m.id !== "init")
        .slice(-MAX_HISTORY)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/tenant/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: history,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        message?: string;
        fallback?: boolean;
      };

      const replyText = data.reply?.trim();
      const safeMessage =
        data.message?.trim() ||
        (res.status === 403
          ? "المساعد متاح لمساحة عمل المنشأة فقط"
          : "تعذر الحصول على رد من المساعد");

      if (replyText) {
        addAssistantMessage(replyText);
        if (!res.ok || data.fallback) {
          setErrorBanner(safeMessage);
        }
        return;
      }

      if (!res.ok) {
        setErrorBanner(safeMessage);
        addAssistantMessage(`⚠️ ${safeMessage}`);
        return;
      }

      addAssistantMessage(EMPTY_REPLY_FALLBACK);
    } catch {
      setErrorBanner(NETWORK_ERROR_MESSAGE);
      addAssistantMessage(`⚠️ ${NETWORK_ERROR_MESSAGE}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <DashboardLayout>
      {/* Spacecraft background layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="spacecraft-stars" />
        <div className="spacecraft-grid" />
      </div>

      <style>{`
        .spacecraft-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 10% 15%, rgba(34,211,238,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 40%, rgba(30,111,217,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 50% 20%, rgba(34,211,238,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 60%, rgba(99,179,237,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 30%, rgba(34,211,238,0.2) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 75%, rgba(30,111,217,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 80%, rgba(34,211,238,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 85%, rgba(99,179,237,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 50%, rgba(34,211,238,0.15) 0%, transparent 100%),
            radial-gradient(2px 2px at 35% 10%, rgba(34,211,238,0.2) 0%, transparent 100%);
        }
        .spacecraft-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 75%);
        }

        /* Orbit ring */
        .twin-core-ring {
          border: 1.5px solid rgba(34,211,238,0.2);
          border-radius: 50%;
          position: absolute;
        }
        .twin-core-ring-outer {
          inset: -24px;
          border-color: rgba(30,111,217,0.15);
          animation: orbit-rotate 20s linear infinite;
        }
        .twin-core-ring-mid {
          inset: -8px;
          border-color: rgba(34,211,238,0.25);
          animation: orbit-rotate 14s linear infinite reverse;
        }
        @keyframes orbit-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .twin-core-ring-outer,
          .twin-core-ring-mid { animation: none; }
        }

        /* Orbit node placement */
        .orbit-node {
          position: absolute;
          transform-origin: center;
        }

        /* Glow pulse on core */
        .core-pulse {
          animation: core-glow 3s ease-in-out infinite;
        }
        @keyframes core-glow {
          0%, 100% { box-shadow: 0 0 24px rgba(34,211,238,0.35), 0 0 48px rgba(30,111,217,0.2); }
          50% { box-shadow: 0 0 40px rgba(34,211,238,0.55), 0 0 80px rgba(30,111,217,0.35); }
        }
        @media (prefers-reduced-motion: reduce) {
          .core-pulse { animation: none; }
        }

        /* Scan line */
        .scan-line {
          position: absolute;
          inset-x: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent);
          animation: scan 4s ease-in-out infinite;
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scan-line { display: none; }
        }

        /* Cockpit card hover glow */
        .cockpit-card {
          background: linear-gradient(135deg, rgba(10,22,40,0.85), rgba(13,31,60,0.7));
          border: 1px solid rgba(34,211,238,0.15);
          backdrop-filter: blur(12px);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .cockpit-card:hover {
          border-color: rgba(34,211,238,0.45);
          box-shadow: 0 0 20px rgba(34,211,238,0.12), 0 4px 24px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }

        /* Spacecraft panel */
        .spacecraft-panel {
          background: linear-gradient(135deg, rgba(10,22,40,0.92), rgba(13,31,60,0.85));
          border: 1px solid rgba(34,211,238,0.12);
          backdrop-filter: blur(16px);
        }

        /* Prompt button */
        .prompt-btn {
          background: rgba(26,51,86,0.5);
          border: 1px solid rgba(34,211,238,0.15);
          transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .prompt-btn:hover:not(:disabled) {
          background: rgba(34,211,238,0.12);
          border-color: rgba(34,211,238,0.5);
          color: #22d3ee;
          box-shadow: 0 0 12px rgba(34,211,238,0.15);
        }
        .prompt-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Badge glow */
        .badge-glow {
          box-shadow: 0 0 8px rgba(34,211,238,0.25);
        }

        /* Future card */
        .future-card {
          background: linear-gradient(135deg, rgba(10,22,40,0.7), rgba(13,31,60,0.5));
          border: 1px solid rgba(34,211,238,0.08);
          opacity: 0.65;
        }
      `}</style>

      <div className="relative space-y-6 sm:space-y-8 max-w-full overflow-x-hidden pb-8" dir="rtl">
        <section className="spacecraft-panel rounded-2xl p-4 border border-violet-300/18">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">مرتبط بخطة النمو</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">
                يمكن استخدام المساعد الذكي لتحليل مراحل النمو وفهم الخطوة التالية بعد تحديدها في خطة النمو.
              </p>
            </div>
            <span className="w-fit rounded-full border border-violet-300/22 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold text-violet-100">
              تحليل مرحلة النمو
            </span>
          </div>
        </section>

        {/* ── 1. HERO / COMMAND DECK HEADER ─────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl spacecraft-panel p-6 sm:p-8">
          <div className="scan-line" />
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "داخل نطاق منشأتك فقط", color: "from-cyan-500/20 to-blue-600/20", border: "border-cyan-500/30" },
                { label: "Read-only", color: "from-blue-500/20 to-indigo-600/20", border: "border-blue-400/30" },
                { label: "آمن حسب صلاحياتك", color: "from-emerald-500/20 to-teal-600/20", border: "border-emerald-400/30" },
                { label: "Digital Twin", color: "from-violet-500/20 to-purple-600/20", border: "border-violet-400/30" },
              ].map((b) => (
                <span
                  key={b.label}
                  className={`badge-glow inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r ${b.color} border ${b.border} text-[#e2e8f0]`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {b.label}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#22d3ee] via-[#63b3ed] to-[#1e6fd9]">
                قمرة قيادة منشأتك الذكية
              </span>
            </h1>
            <p className="text-[#8ba3c7] text-sm sm:text-base max-w-2xl leading-relaxed">
              توأم رقمي ذكي يحاكي منشأتك، يقرأ مؤشرات التشغيل المصرح بها فقط، ويربط بين الفريق والعملاء والمهام والهيكل الإداري لتحويل البيانات إلى قرارات واضحة.
            </p>

            {/* Status bar */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-[#8ba3c7]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                التوأم الرقمي نشط
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={11} className="text-[#22d3ee]" />
                Blumark24 OS
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={11} className="text-emerald-400" />
                RLS محمي
              </span>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorBanner && (
          <div
            role="alert"
            className="spacecraft-panel p-3 sm:p-4 flex items-start gap-3 border border-red-500/30 bg-red-500/10"
          >
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 break-words">{errorBanner}</p>
          </div>
        )}

        {/* ── 2. DIGITAL TWIN SPACECRAFT CORE ───────────────────────── */}
        <div className="spacecraft-panel rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#22d3ee] tracking-widest uppercase mb-1">Blumark24 Operating Brain</p>
            <h2 className="text-lg font-heading font-bold text-white">التوأم الرقمي</h2>
          </div>

          {/* Core visual */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 260, height: 260 }}>
              {/* Orbit rings */}
              <div className="twin-core-ring twin-core-ring-outer" />
              <div className="twin-core-ring twin-core-ring-mid" />

              {/* Orbit nodes positioned around */}
              {ORBIT_NODES.map((node) => {
                const rad = (node.angle - 90) * (Math.PI / 180);
                const r = 108;
                const x = 130 + r * Math.cos(rad) - 20;
                const y = 130 + r * Math.sin(rad) - 20;
                const Icon = node.icon;
                return (
                  <div
                    key={node.label}
                    className="orbit-node"
                    style={{ left: x, top: y, width: 40, height: 40 }}
                  >
                    <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center bg-[#0d1f3c] border border-[#22d3ee]/30 backdrop-blur-sm hover:border-[#22d3ee]/70 transition-all group cursor-default">
                      <Icon size={12} className="text-[#22d3ee] group-hover:scale-110 transition-transform" />
                      <span className="text-[7px] text-[#8ba3c7] mt-0.5 leading-none">{node.label}</span>
                    </div>
                    {/* Connector line to center */}
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: 20,
                        top: 20,
                        width: Math.abs(130 - (x + 20)),
                        height: Math.abs(130 - (y + 20)),
                        overflow: "visible",
                      }}
                      aria-hidden="true"
                    >
                      <line
                        x1={0}
                        y1={0}
                        x2={130 - (x + 20)}
                        y2={130 - (y + 20)}
                        stroke="rgba(34,211,238,0.12)"
                        strokeWidth={1}
                        strokeDasharray="3 4"
                      />
                    </svg>
                  </div>
                );
              })}

              {/* Core brain */}
              <div
                className="core-pulse absolute rounded-full flex flex-col items-center justify-center text-center"
                style={{
                  left: 80, top: 80, width: 100, height: 100,
                  background: "linear-gradient(135deg, #0d1f3c, #142844)",
                  border: "2px solid rgba(34,211,238,0.4)",
                }}
              >
                <Bot size={22} className="text-[#22d3ee] mb-1" />
                <span className="text-[9px] text-[#22d3ee] font-medium leading-tight">عقل<br />المنشأة</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#6b87ab] mt-4">
            7 محاور متصلة • قراءة آمنة فقط • حسب صلاحياتك
          </p>
        </div>

        {/* ── 3. EXECUTIVE COCKPIT ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#1e6fd9]" />
            <h2 className="text-lg font-heading font-bold text-white">قمرة المؤشرات</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COCKPIT_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => void sendMessage(card.prompt)}
                disabled={loading}
                className="cockpit-card rounded-xl p-4 text-right group"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="text-sm font-medium text-white mb-1 group-hover:text-[#22d3ee] transition-colors">
                  {card.title}
                </div>
                <div className="text-[10px] text-[#6b87ab] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]/50" />
                  {card.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. TODAY DECISION ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl spacecraft-panel p-6 border border-[#22d3ee]/15">
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-lg font-heading font-bold text-white">قرار اليوم</h2>
                <p className="text-[11px] text-[#22d3ee]">Executive Decision Support</p>
              </div>
            </div>
            <p className="text-sm text-[#8ba3c7] mb-4 leading-relaxed">
              اطلب من التوأم الذكي تحديد أهم قرار تشغيلي يجب التركيز عليه اليوم بناءً على مؤشرات منشأتك.
            </p>
            <button
              type="button"
              onClick={() => void sendMessage("ما قرار اليوم؟")}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #22d3ee, #1e6fd9)" }}
            >
              <Target size={15} />
              ما قرار اليوم؟
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>

        {/* ── 5. RISK RADAR ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
            <h2 className="text-lg font-heading font-bold text-white">رادار المخاطر</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RISK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={loading}
                className="prompt-btn rounded-xl p-3 text-right text-sm text-[#8ba3c7] flex items-center gap-2"
              >
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 6. SMART SPACECRAFT COMMANDS ──────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#1e6fd9]" />
            <h2 className="text-lg font-heading font-bold text-white">أوامر التوأم الذكي</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMAND_PROMPTS.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                onClick={() => void sendMessage(cmd.label)}
                disabled={loading}
                className="prompt-btn px-4 py-2 rounded-xl text-sm text-[#8ba3c7] flex items-center gap-2"
              >
                <span>{cmd.icon}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 7. AI CHAT ────────────────────────────────────────────── */}
        <div ref={chatRef}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#1e6fd9]" />
            <h2 className="text-lg font-heading font-bold text-white">تحدث مع عقل منشأتك</h2>
          </div>
          <div className="spacecraft-panel rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: 480 }}>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4" style={{ maxHeight: 480 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.role === "assistant"
                        ? "text-white"
                        : "text-white"
                    }`}
                    style={{
                      background: msg.role === "assistant"
                        ? "linear-gradient(135deg, #22d3ee, #1e6fd9)"
                        : "linear-gradient(135deg, #ff7a3d, #ff5722)",
                    }}
                  >
                    {msg.role === "assistant" ? <Bot size={14} /> : "أ"}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] min-w-0 flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed break-words ${
                        msg.role === "assistant"
                          ? "bg-[#1a3356]/70 text-white rounded-tr-none border border-[#22d3ee]/10"
                          : "text-white rounded-tl-none border border-[#22d3ee]/30"
                      }`}
                      style={msg.role === "user" ? { background: "rgba(34,211,238,0.12)" } : {}}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    <span className="text-[10px] text-[#6b87ab]">
                      {msg.timestamp.toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loading state */}
              {loading && (
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #22d3ee, #1e6fd9)" }}
                  >
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1a3356]/70 rounded-tr-none border border-[#22d3ee]/10 flex items-center gap-2">
                    <span className="text-xs text-[#8ba3c7] ml-1">التوأم يحلل...</span>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          background: "rgba(34,211,238,0.7)",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input area */}
            <div className="p-3 sm:p-4 border-t border-[#1e3a5f]">
              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={loading}
                    className="prompt-btn px-2.5 py-1 rounded-lg text-[11px] text-[#8ba3c7]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 min-w-0">
                <textarea
                  className="input-dark flex-1 resize-none text-sm py-3 min-w-0"
                  rows={2}
                  placeholder="اسأل التوأم الذكي عن التشغيل، المهام، العملاء، الفريق، المخاطر، أو قرار اليوم..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || loading}
                    aria-label="إرسال"
                    className="btn-primary p-3 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([INITIAL_MESSAGE]);
                      setErrorBanner(null);
                    }}
                    disabled={loading}
                    aria-label="محادثة جديدة"
                    className="p-3 rounded-xl bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white transition-colors disabled:opacity-50"
                    title="محادثة جديدة"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#6b87ab] mt-2 hidden sm:block">
                Enter للإرسال • Shift+Enter سطر جديد • لا يُحفظ السجل في قاعدة البيانات
              </p>
            </div>
          </div>
        </div>

        {/* ── 8. FUTURE MODULES ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-400 to-purple-600" />
            <h2 className="text-lg font-heading font-bold text-white">وحدات قادمة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FUTURE_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div key={mod.title} className="future-card rounded-xl p-5 cursor-not-allowed">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-400/20 flex-shrink-0">
                      <Icon size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-0.5">{mod.title}</div>
                      <div className="text-[10px] text-violet-400 mb-1">{mod.subtitle}</div>
                      <div className="text-[11px] text-[#6b87ab]">{mod.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
