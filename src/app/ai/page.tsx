"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Gauge,
  Network,
  Users,
  CheckSquare,
  UserCircle,
  TrendingUp,
  ArrowUpRight,
  Zap,
  BrainCircuit,
  Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const MAX_HISTORY = 6;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { label: "قرار اليوم", prompt: "ما قرار اليوم؟", icon: Target, accent: "cyan" },
  { label: "مخاطر التشغيل", prompt: "ما أهم مخاطر التشغيل؟", icon: AlertCircle, accent: "rose" },
  { label: "المهام المتأخرة", prompt: "كم مهمة متأخرة؟", icon: CheckSquare, accent: "amber" },
  { label: "توزيع العمل", prompt: "كيف أحسن توزيع العمل؟", icon: Users, accent: "emerald" },
  { label: "الهيكل الإداري", prompt: "ما وضع الهيكل الإداري؟", icon: Network, accent: "violet" },
];

const COMMAND_TOOLS = [
  {
    title: "توزيع العمل",
    value: "وازن ضغط المهام بين الفريق",
    prompt: "حلل توزيع العمل واقترح أين يجب تخفيف الضغط اليوم.",
    icon: Users,
    accent: "cyan",
  },
  {
    title: "فحص الهيكل",
    value: "اكتشف فجوات المسؤوليات والوحدات",
    prompt: "افحص الهيكل الإداري واذكر أهم الفجوات التي يجب علاجها.",
    icon: Network,
    accent: "violet",
  },
  {
    title: "صحة العملاء",
    value: "راجع نشاط العملاء وحالة المتابعة",
    prompt: "ما وضع العملاء الحالي وما أولويات المتابعة؟",
    icon: UserCircle,
    accent: "emerald",
  },
  {
    title: "قرارات التوسع",
    value: "اقترح متى نحتاج قسم أو مسؤول جديد",
    prompt: "هل توجد مؤشرات تستدعي توسعاً أو إعادة تنظيم؟",
    icon: TrendingUp,
    accent: "amber",
  },
];

const EXECUTIVE_CARDS = [
  {
    label: "قرار اليوم",
    value: "اسأل المساعد عن أول إجراء تنفيذي",
    icon: Target,
    accent: "cyan",
  },
  {
    label: "ضغط العمل",
    value: "تحليل المهام المفتوحة والمتأخرة",
    icon: Gauge,
    accent: "amber",
  },
  {
    label: "جاهزية الهيكل",
    value: "فجوات الأقسام والفرق والربط",
    icon: Network,
    accent: "violet",
  },
  {
    label: "صحة العملاء",
    value: "ملخص المتابعة والنشاط",
    icon: UserCircle,
    accent: "emerald",
  },
];

const ACCENT_STYLES: Record<string, { text: string; border: string; bg: string; glow: string; icon: string }> = {
  cyan: {
    text: "text-[#22d3ee]",
    border: "border-[#22d3ee]/30",
    bg: "bg-[#22d3ee]/10",
    glow: "shadow-[0_0_35px_rgba(34,211,238,0.16)]",
    icon: "from-[#22d3ee] to-[#1e6fd9]",
  },
  emerald: {
    text: "text-[#34d399]",
    border: "border-[#10b981]/30",
    bg: "bg-[#10b981]/10",
    glow: "shadow-[0_0_35px_rgba(16,185,129,0.14)]",
    icon: "from-[#34d399] to-[#0f766e]",
  },
  amber: {
    text: "text-[#fbbf24]",
    border: "border-[#f59e0b]/30",
    bg: "bg-[#f59e0b]/10",
    glow: "shadow-[0_0_35px_rgba(245,158,11,0.14)]",
    icon: "from-[#fbbf24] to-[#f97316]",
  },
  violet: {
    text: "text-[#a78bfa]",
    border: "border-[#8b5cf6]/30",
    bg: "bg-[#8b5cf6]/10",
    glow: "shadow-[0_0_35px_rgba(139,92,246,0.14)]",
    icon: "from-[#a78bfa] to-[#4f46e5]",
  },
  rose: {
    text: "text-[#fb7185]",
    border: "border-[#f43f5e]/30",
    bg: "bg-[#f43f5e]/10",
    glow: "shadow-[0_0_35px_rgba(244,63,94,0.12)]",
    icon: "from-[#fb7185] to-[#be123c]",
  },
};

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "مرحباً. أنا مساعدك التنفيذي داخل **مركز قيادة Blumark24** — أقرأ ملخصات منشأتك الآمنة فقط وأحوّلها إلى قرارات وتشخيصات عملية.\n\nاختر أداة ذكية أو اكتب سؤالك.",
  timestamp: new Date(),
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatContent(content: string) {
  return escapeHtml(content)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

function AccentIcon({ icon: Icon, accent }: { icon: typeof Bot; accent: string }) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.cyan;
  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ring-1 ring-white/15", style.icon, style.glow)}>
      <Icon size={18} />
    </span>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

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

    const assistantId = String(Date.now() + 1);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorBanner("يجب تسجيل الدخول لاستخدام المساعد الذكي");
        setLoading(false);
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
      };

      if (!res.ok) {
        const msg =
          data.message ??
          data.error ??
          (res.status === 403
            ? "المساعد متاح لمساحة عمل المنشأة فقط"
            : "تعذر الحصول على رد من المساعد");
        setErrorBanner(msg);
        setLoading(false);
        return;
      }

      const reply = data.reply?.trim() || "لم أتمكن من صياغة رد — حاول مرة أخرى.";
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorBanner("تعذر الاتصال بالمساعد — تحقق من الشبكة وحاول مجدداً");
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
      <div className="relative max-w-full space-y-4 overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:space-y-6 lg:pb-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.22),rgba(30,111,217,0.08)_35%,transparent_70%)]" />

        <section className="relative overflow-hidden rounded-[2rem] border border-[#22d3ee]/20 bg-[linear-gradient(135deg,rgba(12,30,58,0.92),rgba(9,18,38,0.96))] p-4 shadow-[0_25px_90px_-55px_rgba(34,211,238,0.55)] sm:p-6 lg:p-7">
          <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#22d3ee]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#1e6fd9]/15 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1.05fr_1.4fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/25 bg-[#22d3ee]/10 px-3 py-1.5 text-[11px] font-medium text-[#9deeff]">
                <ShieldCheck size={13} />
                سياق آمن حسب منشأتك فقط
              </div>
              <div>
                <h1 className="flex items-center gap-3 font-heading text-2xl font-bold text-white sm:text-3xl">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9] shadow-[0_0_38px_rgba(34,211,238,0.42)] ring-1 ring-white/15">
                    <BrainCircuit size={24} />
                  </span>
                  المساعد الذكي
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9fb5d4] sm:text-[15px]">
                  مركز قرارات وتشغيل يربط المهام والموظفين والعملاء والهيكل الإداري ليقدم توصيات تنفيذية آمنة داخل مساحة منشأتك.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {EXECUTIVE_CARDS.map((card) => {
                  const style = ACCENT_STYLES[card.accent];
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className={cn("rounded-2xl border bg-white/[0.035] p-3 backdrop-blur-xl", style.border, style.glow)}>
                      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl", style.bg, style.text)}>
                        <Icon size={15} />
                      </div>
                      <div className="text-[12px] font-semibold text-white">{card.label}</div>
                      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#8ba3c7]">{card.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/[0.08] bg-[#08162d]/55 p-3 shadow-inner shadow-white/[0.03] sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#22d3ee]" />
                  <span className="text-sm font-semibold text-white">ماذا تريد أن تفعل الآن؟</span>
                </div>
                <span className="rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-2.5 py-1 text-[10px] text-[#9deeff]">AI Command</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((item) => {
                  const Icon = item.icon;
                  const style = ACCENT_STYLES[item.accent];
                  return (
                    <button
                      key={item.prompt}
                      type="button"
                      onClick={() => void sendMessage(item.prompt)}
                      disabled={loading}
                      className={cn(
                        "group flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border bg-[#11284d]/55 px-3 py-2.5 text-right transition-all hover:-translate-y-0.5 disabled:opacity-50",
                        style.border,
                        "hover:bg-[#16345f]",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", style.bg, style.text)}>
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 truncate text-[13px] font-medium text-white">{item.label}</span>
                      </span>
                      <ArrowUpRight size={14} className={cn("shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5", style.text)} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {errorBanner && (
          <div
            role="alert"
            className="glass-card flex items-start gap-3 border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 sm:p-4"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#f87171]" />
            <p className="break-words text-sm text-[#fecaca]">{errorBanner}</p>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.6fr]">
          <div className="space-y-4">
            <div className="glass-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Zap size={16} className="text-[#22d3ee]" />
                    أدوات ذكية
                  </div>
                  <p className="mt-1 text-[12px] text-[#8ba3c7]">اختصارات تحليلية تخدم التشغيل اليومي.</p>
                </div>
                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#8ba3c7]">قراءة فقط</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {COMMAND_TOOLS.map((tool) => {
                  const style = ACCENT_STYLES[tool.accent];
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.title}
                      type="button"
                      onClick={() => void sendMessage(tool.prompt)}
                      disabled={loading}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border bg-[linear-gradient(145deg,rgba(17,40,77,0.78),rgba(10,22,45,0.86))] p-3.5 text-right transition-all hover:-translate-y-0.5 disabled:opacity-50",
                        style.border,
                        style.glow,
                      )}
                    >
                      <div className="absolute left-0 top-0 h-24 w-24 rounded-full bg-white/[0.04] blur-2xl" />
                      <div className="relative flex items-start gap-3">
                        <AccentIcon icon={Icon} accent={tool.accent} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", style.bg, style.text)}>تحليل</span>
                          </div>
                          <p className="mt-1 text-[12px] leading-5 text-[#8ba3c7]">{tool.value}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[#22d3ee]/18 bg-[#07162d]/70 p-4 shadow-[0_20px_70px_-45px_rgba(34,211,238,0.55)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck size={16} className="text-[#22d3ee]" />
                حدود الأمان
              </div>
              <div className="mt-3 space-y-2 text-[12px] leading-5 text-[#8ba3c7]">
                <p>• لا يكتب أو يحذف أو يعدّل بيانات.</p>
                <p>• لا يقرأ إلا ملخصات منشأتك الآمنة.</p>
                <p>• المالية تظهر فقط للمستخدم المصرح له.</p>
              </div>
            </div>
          </div>

          <div className="glass-card flex min-h-[620px] min-w-0 flex-col overflow-hidden border-[#22d3ee]/18 shadow-[0_25px_90px_-60px_rgba(34,211,238,0.7)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#1e3a5f]/70 bg-[#07162d]/55 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9] text-white shadow-[0_0_26px_rgba(34,211,238,0.35)]">
                  <Bot size={17} />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">المحادثة التنفيذية</div>
                  <div className="text-[11px] text-[#8ba3c7]">اسأل عن التشغيل، المخاطر، العمل، العملاء والهيكل</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessages([INITIAL_MESSAGE]);
                  setErrorBanner(null);
                }}
                aria-label="محادثة جديدة"
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-[#8ba3c7] transition-colors hover:text-white"
                title="محادثة جديدة"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2 sm:gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white ring-1 ring-white/10",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9]"
                        : "bg-gradient-to-br from-[#ff7a3d] to-[#ff5722]",
                    )}
                  >
                    {msg.role === "assistant" ? <Bot size={15} /> : "أ"}
                  </div>
                  <div
                    className={cn("flex min-w-0 max-w-[88%] flex-col gap-1 sm:max-w-[82%]", msg.role === "user" ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "rounded-3xl p-3 text-sm leading-7 text-white shadow-sm sm:p-4",
                        msg.role === "assistant"
                          ? "rounded-tr-md border border-white/[0.06] bg-[#142844]/78"
                          : "rounded-tl-md border border-[#22d3ee]/30 bg-[#22d3ee]/18",
                      )}
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

              {loading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9]">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-3xl rounded-tr-md border border-white/[0.06] bg-[#142844]/78 p-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-[#22d3ee]/70"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-[#1e3a5f]/80 bg-[#07162d]/70 p-3 sm:p-4">
              <div className="flex min-w-0 gap-2">
                <textarea
                  className="input-dark min-w-0 flex-1 resize-none py-3 text-sm"
                  rows={2}
                  placeholder="اسأل عن قرار اليوم، المخاطر، توزيع العمل، الهيكل..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label="إرسال"
                  className="btn-primary flex min-h-[52px] w-14 shrink-0 items-center justify-center disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </div>
              <p className="mt-2 hidden text-[10px] text-[#6b87ab] sm:block">
                Enter للإرسال • Shift+Enter سطر جديد • لا تُحفظ المحادثة في قاعدة البيانات
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
