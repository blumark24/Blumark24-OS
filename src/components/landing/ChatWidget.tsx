"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "أهلاً! 👋 أنا Blumark AI، مساعد الأعمال الذكي. كيف أساعدك اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.text || "معذرة، حدث خطأ. يرجى المحاولة لاحقاً.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "معذرة، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    { label: "الباقات", text: "أبغى أتعرف على الباقات المتاحة" },
    { label: "الخدمات", text: "ما هي الخدمات التي تقدمونها؟" },
    {
      label: "استشارة مجانية",
      text: "أبغى أحجز استشارة مجانية",
    },
  ];

  return (
    <>
      {/* Chat Button (Fixed) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_0_30px_rgba(34,211,238,0.6),0_8px_25px_rgba(0,0,0,0.4)] hover:scale-110 transition-transform duration-300"
        aria-label="فتح الشات"
      >
        {isOpen ? (
          <X className="h-6 w-6" strokeWidth={2} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 left-6 z-40 w-80 max-w-[calc(100vw-24px)] rounded-3xl border border-white/[0.10] bg-[rgba(5,8,22,0.95)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="border-b border-white/[0.08] bg-gradient-to-r from-[rgba(34,211,238,0.08)] to-[rgba(59,130,246,0.08)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-[14px]">
                  Blumark AI
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D3EE]" />
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    متاح الآن
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "flex-row-reverse" : ""} gap-2`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#3B82F6] flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                    B
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white rounded-tl-sm"
                      : "bg-white/[0.06] text-gray-200 rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#3B82F6] flex-shrink-0 flex items-center justify-center">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies (first message only) */}
          {messages.length === 1 && !isLoading && (
            <div className="border-t border-white/[0.08] p-3 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply.label}
                  onClick={() => {
                    setInput(reply.text);
                    setTimeout(() => {
                      const form = document.querySelector(
                        "form[data-chat-form]"
                      ) as HTMLFormElement;
                      if (form) form.dispatchEvent(new Event("submit"));
                    }, 0);
                  }}
                  className="px-3 py-1.5 rounded-full text-[11px] bg-white/[0.06] text-[#22D3EE] border border-[#22D3EE]/30 hover:bg-white/[0.10] transition"
                >
                  {reply.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            data-chat-form
            className="border-t border-white/[0.08] p-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl text-[13px] bg-white/[0.04] border border-white/[0.10] text-white placeholder:text-white/35 focus:outline-none focus:border-[#22D3EE]/50 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
