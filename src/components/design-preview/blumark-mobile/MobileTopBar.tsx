import { Bell, User } from "lucide-react";

/**
 * Top bar: notifications icon (visual LEFT in RTL) — official Blumark24
 * logo + 24h badge (centre) — glass avatar placeholder (visual RIGHT).
 *
 * In RTL flex justify-between, DOM child #1 renders on the visual RIGHT
 * and the last child on the visual LEFT — so the DOM order below is
 * Avatar → Brand → Bell to match the approved reference image.
 *
 * Preview-only: avatar is a CSS placeholder using the lucide User icon
 * inside a glass disc; no external photos, no real people.
 */
export default function MobileTopBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      {/* Glass avatar — visual right in RTL */}
      <div className="relative">
        <div
          className="grid place-items-center h-10 w-10 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(11,31,58,0.85) 0%, rgba(7,20,38,0.85) 100%)",
            border: "1px solid rgba(125, 220, 255, 0.40)",
            boxShadow:
              "0 0 16px rgba(0,217,255,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          aria-label="المستخدم"
        >
          <User
            className="h-4.5 w-4.5"
            strokeWidth={1.6}
            style={{ color: "#7DDCFF", width: 18, height: 18 }}
          />
        </div>
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
          style={{
            background: "#10B981",
            border: "2px solid #020817",
            boxShadow: "0 0 6px rgba(16,185,129,0.7)",
          }}
          aria-hidden
        />
      </div>

      {/* Brand center — official Blumark24 lockup (icon + wordmark + 24h
          badge + tagline are all baked into the PNG). Plain <img> with
          fixed height keeps the layout deterministic inside the small
          top bar. Subtle drop-shadow gives the lockup definition on the
          dark navy background. */}
      <div className="flex items-center max-w-[60%]" aria-label="Blumark24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/blumark24-logo-transparent.png"
          alt="Blumark24"
          height={36}
          style={{
            height: 36,
            width: "auto",
            display: "block",
            filter:
              "drop-shadow(0 0 8px rgba(0,217,255,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
          }}
        />
      </div>

      {/* Notifications — visual left in RTL */}
      <button
        type="button"
        aria-label="الإشعارات"
        className="relative grid place-items-center h-10 w-10 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(11,31,58,0.85) 0%, rgba(7,20,38,0.85) 100%)",
          border: "1px solid rgba(125, 220, 255, 0.28)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 10px rgba(0,217,255,0.10)",
        }}
      >
        <Bell className="h-4 w-4" style={{ color: "#7DDCFF" }} />
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
