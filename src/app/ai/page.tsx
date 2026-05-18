"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bot, Send, RefreshCw, Sparkles, TrendingUp, Users, AlertTriangle, BarChart3 } from "lucide-react";
import { useDashboardKPI } from "@/hooks/useData";
import { useTasks } from "@/hooks/useData";
import { formatCurrency } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: "📊", label: "تحليل الأداء",   prompt: "حلل أداء الفريق هذا الأسبوع وقدم توصيات لتحسينه" },
  { icon: "👥", label: "متابعة العملاء", prompt: "وش العملاء اللي محتاجين متابعة عاجلة الآن؟" },
  { icon: "💰", label: "تقليل المصاريف", prompt: "اقترح طرق فعّالة لتقليل المصاريف وتحسين الربحية" },
  { icon: "📋", label: "تقرير شهري",     prompt: "اكتب لي تقرير شهري شامل عن وضع الشركة" },
  { icon: "🎯", label: "اقتراحات النمو", prompt: "ما هي أفضل استراتيجيات النمو للمرحلة القادمة؟" },
  { icon: "⚠️", label: "المهام المتأخرة", prompt: "أعطني قائمة بالمهام المتأخرة وخطة لمعالجتها" },
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "مرحباً! أنا مساعدك الذكي في Blumark24 OS 🤖\n\nيمكنني مساعدتك في:\n- **تحليل أداء الفريق والعملاء**\n- **إعداد التقارير الشهرية**\n- **اقتراح استراتيجيات النمو**\n- **تتبع المهام والتنبيهات**\n\nكيف يمكنني مساعدتك اليوم؟",
  timestamp: new Date(),
};

function buildAIResponse(
  kpi: { activeClients: number; completedTasksPct: number; incompleteTasks: number; netProfit: number }
): string {
  return `بناءً على بيانات النظام الحالية، إليك التحليل المطلوب:\n\n📊 **الوضع العام:**\n- العملاء النشطين: ${kpi.activeClients} عميل\n- معدل إتمام المهام: ${kpi.completedTasksPct}%\n- صافي الربح: ${formatCurrency(kpi.netProfit)} SAR\n\n✅ **التوصيات:**\n1. ${kpi.incompleteTasks > 0 ? `معالجة ${kpi.incompleteTasks} مهمة غير مكتملة في أقرب وقت` : "جميع المهام مكتملة — أداء ممتاز"}\n2. تسريع المشاريع المتأخرة بتخصيص موارد إضافية\n3. زيادة التواصل مع العملاء النشطين لتحسين فرص التجديد\n\n🎯 **الأولويات الأسبوعية:**\n- ${kpi.incompleteTasks > 0 ? `إكمال ${Math.min(kpi.incompleteTasks, 3)} مهام عاجلة قبل نهاية الأسبوع` : "الحفاظ على الأداء الممتاز للمهام"}\n- جدولة اجتماعات متابعة مع العملاء الرئيسيين`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatContent(content: string) {
  return escapeHtml(content)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef    = useRef<HTMLDivElement>(null);
  // AbortController for in-flight streaming request — cancelled on every new send
  const abortRef  = useRef<AbortController | null>(null);

  const { kpi }                     = useDashboardKPI();
  const { data: tasks }             = useTasks();

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.status === "متأخرة").length,
    [tasks]
  );

  const workloadBalance = useMemo(() => {
    if (tasks.length === 0) return "لا توجد مهام";
    const done = tasks.filter((t) => t.status === "مكتملة").length;
    const pct = Math.round((done / tasks.length) * 100);
    return `${pct}% مكتمل`;
  }, [tasks]);

  const aiCards = useMemo(() => [
    { icon: TrendingUp,     label: "العملاء النشطون",         value: `${kpi.activeClients} عميل`,   color: "#10b981" },
    { icon: Users,          label: "نسبة إتمام المهام",       value: `${kpi.completedTasksPct}%`,   color: "#22d3ee" },
    { icon: AlertTriangle,  label: "المهام المتأخرة",         value: `${overdueTasks} مهمة`,        color: overdueTasks > 0 ? "#f59e0b" : "#10b981" },
    { icon: BarChart3,      label: "صافي الربح",              value: `${formatCurrency(kpi.netProfit)} SAR`, color: kpi.netProfit >= 0 ? "#a855f7" : "#ef4444" },
  ], [kpi, overdueTasks]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    // Cancel any previous in-flight request before starting a new one
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = { id: String(Date.now()), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantId = String(Date.now() + 1);
    let streamed = false;

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body:    JSON.stringify({
          message: content,
          kpi: {
            activeClients:      kpi.activeClients,
            completedTasksPct:  kpi.completedTasksPct,
            incompleteTasks:    kpi.incompleteTasks,
            netProfit:          kpi.netProfit,
            overdueTasks:       overdueTasks,
          },
        }),
      });

      if (res.ok && res.body) {
        // Streaming path
        const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", timestamp: new Date() };
        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);
        streamed = true;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
            );
          }
        }
      }
    } catch (err) {
      // AbortError means the user sent a new message — silently discard
      if (err instanceof DOMException && err.name === "AbortError") {
        setLoading(false);
        return;
      }
      // Any other network error — fall through to local fallback
    }

    if (!streamed) {
      // Fallback: local template response (no API key or API error)
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      const aiResponse = buildAIResponse(kpi);
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: aiResponse, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Bot size={22} className="text-[#22d3ee]" />
              المساعد الذكي
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">مدعوم بالذكاء الاصطناعي لتحليل بيانات شركتك</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
            <span className="text-xs text-[#22d3ee] font-medium">متصل ونشط</span>
          </div>
        </div>

        {/* AI Insight Cards — real data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {aiCards.map((card) => (
            <div key={card.label} className="glass-card p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${card.color}20` }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-[#8ba3c7] leading-tight truncate">{card.label}</div>
                <div className="text-sm font-medium mt-0.5 truncate" style={{ color: card.color }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid.  Mobile: stacked + min-height so the input never gets
            cut off by the keyboard.  Desktop (≥lg): 4-col with calc'd height. */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:[height:calc(100vh-380px)] lg:min-h-[400px]">
          {/* Quick Prompts — 2-col grid on mobile (compact, tap-friendly),
              vertical list on desktop. */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#22d3ee]" />
              <span className="text-xs font-medium text-[#8ba3c7]">أسئلة جاهزة</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-right text-[13px] sm:text-sm bg-[#1a3356]/40 hover:bg-[#1a3356] hover:text-[#22d3ee] transition-colors text-[#8ba3c7] min-h-[44px]"
                >
                  <span className="flex-shrink-0">{p.icon}</span>
                  <span className="leading-tight min-w-0 truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat — fixed mobile height so input stays in view; flex on desktop. */}
          <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden h-[60vh] min-h-[420px] lg:h-auto lg:min-h-0">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9] text-white"
                      : "bg-gradient-to-br from-[#ff7a3d] to-[#ff5722] text-white"
                  }`}>
                    {msg.role === "assistant" ? <Bot size={14} /> : "أ"}
                  </div>
                  <div className={`max-w-[85%] sm:max-w-[80%] min-w-0 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed break-words ${
                        msg.role === "assistant"
                          ? "bg-[#1a3356]/60 text-white rounded-tr-none"
                          : "bg-[#22d3ee]/20 text-white rounded-tl-none border border-[#22d3ee]/30"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    <span className="text-[10px] text-[#6b87ab]">
                      {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9]">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1a3356]/60 rounded-tr-none flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#22d3ee]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 sm:p-4 border-t border-[#1e3a5f]">
              <div className="flex gap-2">
                <textarea
                  className="input-dark flex-1 resize-none text-sm py-3 min-w-0"
                  rows={2}
                  placeholder="اسأل عن أداء فريقك، العملاء، التقارير..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    aria-label="إرسال"
                    className="btn-primary p-3 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                  <button
                    onClick={() => setMessages([INITIAL_MESSAGE])}
                    aria-label="محادثة جديدة"
                    className="p-3 rounded-xl bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white transition-colors"
                    title="محادثة جديدة"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#6b87ab] mt-2 hidden sm:block">اضغط Enter للإرسال • Shift+Enter للسطر الجديد</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
