import { Crown, Sparkles } from "lucide-react";

/**
 * Welcome card with package badge (preview-only, static data).
 *
 * Layout matches the reference: welcome heading on the visual RIGHT
 * (start of RTL), package badge on the visual LEFT (end of RTL).
 */
export default function PackageWelcomeCard() {
  return (
    <div className="relative overflow-hidden p-4 bm-glass-strong bm-glow-ring">
      {/* Decorative corner glow */}
      <span
        aria-hidden
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.40), transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Welcome (visual right in RTL) */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h2
              className="text-[22px] font-extrabold leading-none"
              style={{ color: "#F8FAFC", letterSpacing: "-0.01em" }}
            >
              مرحباً أحمد
            </h2>
            <span aria-hidden className="text-lg leading-none">👋</span>
          </div>
          <p
            className="text-[12px] flex items-center gap-1.5 leading-snug"
            style={{ color: "#B6C9E0" }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#7DDCFF" }} />
            نظام بلومارك 24 الذكي يعمل لأجلك
          </p>
        </div>

        {/* Package badge (visual left in RTL) */}
        <div
          className="shrink-0 rounded-xl px-3 py-2 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(20,124,255,0.14))",
            border: "1px solid rgba(125, 220, 255, 0.32)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px rgba(0,217,255,0.16)",
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Crown className="h-3.5 w-3.5" style={{ color: "#7DDCFF" }} />
            <span
              className="text-[11px] font-bold"
              style={{ color: "#7DDCFF" }}
            >
              الباقة الاحترافية
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "#10B981",
                boxShadow: "0 0 6px rgba(16,185,129,0.8)",
              }}
            />
            <span
              className="text-[10px]"
              style={{ color: "#B6C9E0", fontVariantNumeric: "tabular-nums" }}
            >
              تنتهي في 2025/06/21
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
