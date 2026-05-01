"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bot, Send, RefreshCw, Sparkles, TrendingUp, Users, AlertTriangle, BarChart3 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: "📊", label: "تحليل الأداء", prompt: "حلل أداء الفريق هذا الأسبوع وقدم توصيات لتحسينه" },
  { icon: "👥", label: "متابعة العملاء", prompt: "وش العملاء اللي محتاجين متابعة عاجلة الآن؟" },
  { icon: "💰", label: "تقليل المصاريف", prompt: "اقترح طرق فعّالة لتقليل المصاريف وتحسين الربحية" },
  { icon: "📋", label: "تقرير شهري", prompt: "اكتب لي تقرير شهري شامل عن وضع الشركة" },
  { icon: "🎯", label: "اقتراحات النمو", prompt: "ما هي أفضل استراتيجيات النمو للمرحلة القادمة؟" },
  { icon: "⚠️", label: "المهام المتأخرة", prompt: "أعطني قائمة بالمهام المتأخرة وخطة لمعالجتها" },
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "مرحباً! أنا مساعدك الذكي في Blumark24 OS 🤖\n\nيمكنني مساعدتك في:\n- **تحليل أداء الفريق والعملاء**\n- **إعداد التقارير الشهرية**\n- **اقتراح استراتيجيات النمو**\n- **تتبع المهام والتنبيهات**\n\nكيف يمكنني مساعدتك اليوم؟",
  timestamp: new Date(),
};

const DEMO_RESPONSES: Record<string, string> = {
  default: "بناءً على بيانات النظام الحالية، إليك التحليل المطلوب:\n\n📊 **الوضع العام:**\n- إجمالي العملاء: 1,248 عميل نشط\n- معدل إتمام المهام: 89%\n- رضا العملاء: 95%\n\n✅ **التوصيات:**\n1. التركيز على 6 عملاء محتملين في مرحلة التحويل\n2. تسريع المشاريع المتأخرة بتخصيص موارد إضافية\n3. زيادة التواصل مع العملاء النشطين لتحسين فرص التجديد\n\n🎯 **الأولويات الأسبوعية:**\n- إكمال 3 مهام عاجلة قبل نهاية الأسبوع\n- جدولة اجتماعات متابعة مع 5 عملاء رئيسيين",
};

const AI_CARDS = [
  { icon: TrendingUp, label: "اكتشاف الأنماط غير الطبيعية", value: "لا توجد انحرافات", color: "#10b981" },
  { icon: Users, label: "توازن عبء العمل", value: "85% متوازن", color: "#22d3ee" },
  { icon: AlertTriangle, label: "تنبيهات المهام", value: "3 مهام متأخرة", color: "#f59e0b" },
  { icon: BarChart3, label: "تقرير أسبوعي", value: "متاح الإثنين", color: "#a855f7" },
];

function formatContent(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: Message = { id: String(Date.now()), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const aiResponse = DEMO_RESPONSES.default;
    const assistantMsg: Message = { id: String(Date.now() + 1), role: "assistant", content: aiResponse, timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Bot size={24} className="text-[#22d3ee]" />
              المساعد الذكي
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">مدعوم بالذكاء الاصطناعي لتحليل بيانات شركتك</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30">
            <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
            <span className="text-xs text-[#22d3ee] font-medium">متصل ونشط</span>
          </div>
        </div>

        {/* AI Insight Cards */}
        <div className="grid grid-cols-4 gap-3">
          {AI_CARDS.map((card) => (
            <div key={card.label} className="glass-card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${card.color}20` }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[#8ba3c7] leading-tight">{card.label}</div>
                <div className="text-sm font-medium text-white mt-0.5" style={{ color: card.color }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}>
          {/* Quick Prompts */}
          <div className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#22d3ee]" />
              <span className="text-xs font-medium text-[#8ba3c7]">أسئلة جاهزة</span>
            </div>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.prompt)}
                className="flex items-center gap-2 p-2.5 rounded-xl text-right text-sm bg-[#1a3356]/40 hover:bg-[#1a3356] hover:text-[#22d3ee] transition-all text-[#8ba3c7] group"
              >
                <span className="flex-shrink-0">{p.icon}</span>
                <span className="leading-tight">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9] text-white"
                      : "bg-gradient-to-br from-[#ff7a3d] to-[#ff5722] text-white"
                  }`}>
                    {msg.role === "assistant" ? <Bot size={14} /> : "أ"}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed ${
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
                <div className="flex gap-3">
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

            {/* Input */}
            <div className="p-4 border-t border-[#1e3a5f]">
              <div className="flex gap-2">
                <textarea
                  className="input-dark flex-1 resize-none text-sm py-3"
                  rows={2}
                  placeholder="اسأل عن أداء فريقك، العملاء، التقارير..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="btn-primary p-3 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                  <button
                    onClick={() => setMessages([INITIAL_MESSAGE])}
                    className="p-3 rounded-xl bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white transition-colors"
                    title="محادثة جديدة"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#6b87ab] mt-2">اضغط Enter للإرسال • Shift+Enter للسطر الجديد</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
