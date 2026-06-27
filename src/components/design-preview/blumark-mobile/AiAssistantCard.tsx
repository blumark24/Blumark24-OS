import { Sparkles, ChevronLeft } from "lucide-react";

export default function AiAssistantCard() {
  return (
    <div className="relative p-4 overflow-hidden bm-glass-strong bm-glow-ring">
      {/* Soft corner glow */}
      <span
        aria-hidden
        className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.30), transparent 70%)",
        }}
      />

      <div className="relative flex items-center justify-between mb-3">
        <h3
          className="text-[14px] font-bold flex items-center gap-2"
          style={{ color: "#F8FAFC" }}
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          مساعد بلومارك الذكي
        </h3>
      </div>

      {/* DOM order: text first → visual RIGHT in RTL, globe second → visual LEFT.
          Matches the reference where the glowing globe sits on the left edge
          of the card body. */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 min-w-0 order-1">
          <p
            className="text-[13px] font-semibold leading-snug mb-1"
            style={{ color: "#F8FAFC" }}
          >
            الإيرادات في نمو مستمر
          </p>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "#94A3B8" }}
          >
            استمر بنفس الزخم لتصل إلى هدفك الشهري
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium rounded-lg px-2.5 py-1"
            style={{
              color: "#7DDCFF",
              background:
                "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(20,124,255,0.14))",
              border: "1px solid rgba(125, 220, 255, 0.28)",
            }}
          >
            عرض التحليل الكامل
            <ChevronLeft className="h-3 w-3" />
          </button>
        </div>

        {/* Glow globe / orbits — pure SVG */}
        <div className="relative h-24 w-24 shrink-0 order-2">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(0,217,255,0.45), transparent 70%)",
            }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0">
            <defs>
              <radialGradient id="bm-globe" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#7DDCFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#147CFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="22" fill="url(#bm-globe)" />
            {/* meridians */}
            <ellipse
              cx="50"
              cy="50"
              rx="22"
              ry="9"
              fill="none"
              stroke="rgba(125,220,255,0.55)"
              strokeWidth="0.7"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="9"
              ry="22"
              fill="none"
              stroke="rgba(125,220,255,0.55)"
              strokeWidth="0.7"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="18"
              ry="22"
              fill="none"
              stroke="rgba(125,220,255,0.30)"
              strokeWidth="0.6"
            />
            {/* orbits */}
            <ellipse
              cx="50"
              cy="50"
              rx="36"
              ry="14"
              fill="none"
              stroke="rgba(125,220,255,0.35)"
              strokeWidth="0.7"
              transform="rotate(-18 50 50)"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="42"
              ry="18"
              fill="none"
              stroke="rgba(125,220,255,0.20)"
              strokeWidth="0.6"
              transform="rotate(22 50 50)"
            />
            {/* particles */}
            <circle cx="86" cy="40" r="1.8" fill="#7DDCFF" />
            <circle cx="14" cy="62" r="1.5" fill="#7DDCFF" />
            <circle cx="74" cy="76" r="1.2" fill="#147CFF" />
          </svg>
        </div>
      </div>
    </div>
  );
}
