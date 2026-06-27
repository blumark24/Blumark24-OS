import { Bell } from "lucide-react";

/**
 * Top bar: notifications icon (visual LEFT in RTL) — Blumark logo center —
 * avatar (visual RIGHT in RTL).
 *
 * In RTL with flex justify-between, DOM child #1 renders on the visual
 * RIGHT and the last child renders on the visual LEFT — so the DOM order
 * below is Avatar → Brand → Bell to match the reference image.
 *
 * Preview-only: avatar is a CSS placeholder, not a real photo.
 */
export default function MobileTopBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      {/* Avatar — visual right in RTL */}
      <div className="relative">
        <div
          className="h-10 w-10 rounded-full grid place-items-center text-xs font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, #1e3a5f 0%, #0B1F3A 100%)",
            border: "1px solid rgba(125, 220, 255, 0.35)",
            boxShadow: "0 0 14px rgba(0,217,255,0.25)",
          }}
          aria-label="المستخدم"
        >
          أ
        </div>
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
          style={{
            background: "#10B981",
            border: "2px solid #020817",
          }}
          aria-hidden
        />
      </div>

      {/* Brand center */}
      <div className="flex items-center gap-2">
        <div
          className="grid place-items-center rounded-xl h-9 w-9"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.20), rgba(20,124,255,0.20))",
            border: "1px solid rgba(125, 220, 255, 0.30)",
            boxShadow: "0 0 18px rgba(0,217,255,0.25)",
          }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <defs>
              <linearGradient id="bm-mark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7DDCFF" />
                <stop offset="100%" stopColor="#147CFF" />
              </linearGradient>
            </defs>
            <path
              d="M12 2 L21 7 v10 l-9 5 -9-5 V7 z"
              fill="url(#bm-mark)"
              opacity="0.95"
            />
          </svg>
        </div>
        <div className="leading-none">
          <div
            className="text-[15px] font-extrabold tracking-wide"
            style={{ color: "#F8FAFC" }}
          >
            Blumark
            <span
              className="ml-1 align-top text-[9px] font-bold rounded px-1 py-[1px]"
              style={{
                background: "rgba(0,217,255,0.18)",
                color: "#7DDCFF",
              }}
            >
              24h
            </span>
          </div>
        </div>
      </div>

      {/* Notifications — visual left in RTL */}
      <button
        type="button"
        aria-label="الإشعارات"
        className="relative grid place-items-center h-10 w-10 rounded-2xl"
        style={{
          background: "rgba(13, 31, 60, 0.55)",
          border: "1px solid rgba(125, 220, 255, 0.18)",
        }}
      >
        <Bell className="h-4 w-4 text-cyan-200" />
        <span
          className="absolute -top-1 -right-1 grid place-items-center text-[10px] font-bold text-white rounded-full"
          style={{
            width: 16,
            height: 16,
            background: "linear-gradient(135deg, #00D9FF, #147CFF)",
            boxShadow: "0 0 8px rgba(0,217,255,0.6)",
          }}
        >
          3
        </span>
      </button>
    </div>
  );
}
