"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bot, Send, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
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
    "مرحباً. أنا مساعدك التنفيذي — أحلّل **ملخصات منشأتك الآمنة** فقط (مهام، موظفون، عملاء، هيكل).\n\nاختر سؤالاً جاهزاً أو اكتب استفسارك.",
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
      <div className="space-y-4 sm:space-y-6 h-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Bot size={22} className="text-[#22d3ee] shrink-0" />
              المساعد الذكي
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">
              تحليل تنفيذي آمن يعتمد على بيانات منشأتك فقط.
            </p>
          </div>
        </div>

        {errorBanner && (
          <div
            role="alert"
            className="glass-card p-3 sm:p-4 flex items-start gap-3 border border-[#ef4444]/30 bg-[#ef4444]/10"
          >
            <AlertCircle size={18} className="text-[#f87171] shrink-0 mt-0.5" />
            <p className="text-sm text-[#fecaca] break-words">{errorBanner}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:[height:calc(100vh-280px)] lg:min-h-[400px]">
          <div className="glass-card p-4 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#22d3ee]" />
              <span className="text-xs font-medium text-[#8ba3c7]">أسئلة مقترحة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="p-2.5 rounded-xl text-right text-[13px] sm:text-sm bg-[#1a3356]/40 hover:bg-[#1a3356] hover:text-[#22d3ee] transition-colors text-[#8ba3c7] min-h-[44px] disabled:opacity-50 break-words"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden min-w-0 h-[60vh] min-h-[420px] lg:h-auto lg:min-h-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9] text-white"
                        : "bg-gradient-to-br from-[#ff7a3d] to-[#ff5722] text-white"
                    }`}
                  >
                    {msg.role === "assistant" ? <Bot size={14} /> : "أ"}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] min-w-0 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed break-words ${
                        msg.role === "assistant"
                          ? "bg-[#1a3356]/60 text-white rounded-tr-none"
                          : "bg-[#22d3ee]/20 text-white rounded-tl-none border border-[#22d3ee]/30"
                      }`}
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#22d3ee] to-[#1e6fd9]">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1a3356]/60 rounded-tr-none flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#22d3ee]/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 sm:p-4 border-t border-[#1e3a5f]">
              <div className="flex gap-2 min-w-0">
                <textarea
                  className="input-dark flex-1 resize-none text-sm py-3 min-w-0"
                  rows={2}
                  placeholder="اسأل عن قرارات اليوم، المخاطر، المهام المتأخرة..."
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
                    aria-label="محادثة جديدة"
                    className="p-3 rounded-xl bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white transition-colors"
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
      </div>
    </DashboardLayout>
  );
}
