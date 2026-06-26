import { Bell, Mail, Plus, Search, Settings, Sun } from "lucide-react";

export default function DemoTopBar() {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      {/* First DOM child = visual right in RTL: search + settings */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative hidden md:block w-[260px] lg:w-[360px]">
          <Search
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-white/45"
            strokeWidth={1.6}
          />
          <input
            type="search"
            placeholder="بحث داخل المنشأة..."
            aria-label="بحث"
            className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-[13px] text-white placeholder-white/45 ps-10 pe-3 outline-none focus:border-white/[0.18] transition"
          />
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
          aria-label="الإعدادات"
        >
          <Settings className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      {/* Last DOM child = visual left in RTL: action icons + avatar */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]"
          aria-label="إنشاء"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
          aria-label="الوضع"
        >
          <Sun className="h-4 w-4" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
          aria-label="الإشعارات"
        >
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF7A3D] text-[9px] font-semibold text-white px-1">
            3
          </span>
        </button>
        <button
          type="button"
          className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
          aria-label="الرسائل"
        >
          <Mail className="h-4 w-4" strokeWidth={1.6} />
        </button>
        <div className="inline-flex items-center gap-2 pe-3 ps-1 rounded-full border border-white/[0.08] bg-white/[0.03]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-[11px] font-semibold text-white">
            م
          </span>
          <span className="hidden sm:inline text-[12px] text-white/80">منشأة تجريبية</span>
        </div>
      </div>
    </div>
  );
}
