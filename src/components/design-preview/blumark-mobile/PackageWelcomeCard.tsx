import { Crown, Sparkles } from "lucide-react";

/**
 * Welcome card with package badge (preview-only, static data).
 *
 * Layout: package badge top-right, welcome heading top-left in RTL.
 */
export default function PackageWelcomeCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.85) 0%, rgba(7,20,38,0.85) 100%)",
        border: "1px solid rgba(125, 220, 255, 0.22)",
        boxShadow:
          "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 22px rgba(0,217,255,0.10)",
      }}
    >
      {/* Decorative corner glow */}
      <span
        aria-hidden
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.35), transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Welcome (right side in RTL) */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl font-extrabold leading-none"
              style={{ color: "#F8FAFC" }}
            >
              مرحباً أحمد
            </h2>
            <span aria-hidden className="text-xl leading-none">👋</span>
          </div>
          <p
            className="text-[12px] flex items-center gap-1.5"
            style={{ color: "#94A3B8" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            نظام بلومارك 24 الذكي يعمل لأجلك
          </p>
        </div>

        {/* Package badge (left in RTL) */}
        <div
          className="shrink-0 rounded-xl px-3 py-2 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.16), rgba(20,124,255,0.16))",
            border: "1px solid rgba(125, 220, 255, 0.35)",
            boxShadow: "0 0 18px rgba(0,217,255,0.18)",
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
            <span className="text-[10px]" style={{ color: "#94A3B8" }}>
              تنتهي في 2025/06/21
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
