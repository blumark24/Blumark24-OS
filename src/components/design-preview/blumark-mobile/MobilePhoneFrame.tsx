import { Wifi, Signal } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Desktop wrapper: renders the mobile dashboard inside a phone-like
 * frame on wide viewports and full-bleed on small viewports.
 *
 * Width is locked between 390px and 430px to honor the brief's
 * visual target. The frame is non-functional decoration.
 */
export default function MobilePhoneFrame({
  children,
  bottomNav,
}: {
  children: ReactNode;
  bottomNav?: ReactNode;
}) {
  return (
    <div
      className="min-h-[100dvh] w-full grid place-items-center px-4 py-6"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, rgba(20,124,255,0.10), transparent 55%), #020817",
        fontFamily:
          "'IBM Plex Sans Arabic', 'Tajawal', system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
      dir="rtl"
    >
      {/* Phone shell */}
      <div
        className="relative bm-preview-phone-shell"
        style={{
          width: 412,
          maxWidth: "100%",
          height: 880,
          maxHeight: "calc(100dvh - 32px)",
        }}
      >
        {/* Outer bezel */}
        <div
          className="absolute inset-0 rounded-[44px] bm-preview-phone-bezel"
          style={{
            background:
              "linear-gradient(160deg, #1a2c47 0%, #050c1c 60%, #0b1d34 100%)",
            padding: 10,
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 0 40px rgba(0,217,255,0.10), inset 0 0 0 1px rgba(125,220,255,0.10)",
          }}
        >
          {/* Inner screen */}
          <div
            className="relative w-full h-full rounded-[36px] overflow-hidden bm-preview-phone-screen"
            style={{
              background: "#020817",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* iOS-style status bar (decorative) */}
            <div
              className="absolute top-0 inset-x-0 z-30 h-9 flex items-center justify-between px-6 text-white bm-preview-statusbar"
              style={{ direction: "ltr" }}
            >
              <span className="text-[12px] font-semibold tracking-tight">
                9:41
              </span>
              <span aria-hidden className="flex items-center gap-1.5">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <span
                  className="inline-block rounded-[3px]"
                  style={{
                    width: 18,
                    height: 9,
                    border: "1px solid rgba(255,255,255,0.7)",
                    padding: 1,
                  }}
                >
                  <span
                    className="block h-full rounded-[1.5px]"
                    style={{ width: "82%", background: "#ffffff" }}
                  />
                </span>
              </span>
            </div>

            {/* Notch */}
            <div
              aria-hidden
              className="absolute top-1.5 left-1/2 -translate-x-1/2 z-40 bm-preview-notch"
              style={{
                width: 120,
                height: 28,
                background: "#000",
                borderRadius: 18,
              }}
            />

            {/* Scrollable content area — leaves room for status bar (top) and bottom nav (bottom) */}
            <div
              className="absolute inset-0 overflow-y-auto bm-preview-scroll"
              style={{
                paddingTop: 38,
                paddingBottom: 96,
              }}
            >
              {children}
            </div>

            {/* Fixed bottom navigation pinned inside the phone frame */}
            {bottomNav}
          </div>
        </div>
      </div>
    </div>
  );
}
