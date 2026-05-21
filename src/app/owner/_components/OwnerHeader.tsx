"use client";

import { Search, Bell, Menu, ShieldHalf, ChevronDown } from "lucide-react";

interface OwnerHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function OwnerHeader({ onMobileMenuToggle }: OwnerHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3">
        {/* Mobile menu */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 -m-1 rounded-xl text-white/70 hover:text-[#22d3ee] hover:bg-white/[0.04] transition-colors flex-shrink-0"
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>

        {/* Title (compact, hidden on small) */}
        <div className="hidden md:block flex-shrink-0">
          <div className="text-white font-heading font-bold text-[15px] leading-tight">
            Owner Command Center
          </div>
          <div className="text-white/45 text-[11px] leading-tight">Blumark24 OS</div>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-xl mx-auto">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="text"
            placeholder="ابحث عن منشأة، اشتراك، باقة، موظف..."
            className="w-full rounded-xl bg-[rgba(13,31,60,0.7)] border border-white/[0.08] text-[13px] text-white placeholder:text-white/40 pr-10 pl-3 py-2.5 outline-none transition-colors focus:border-[#22d3ee]/50 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.12)]"
          />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* System status badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/[0.1] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-[11px] text-[#34d399] font-medium whitespace-nowrap">
              الأنظمة تعمل بشكل طبيعي
            </span>
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl text-white/70 hover:text-[#22d3ee] hover:bg-white/[0.04] transition-colors"
            aria-label="الإشعارات"
          >
            <Bell size={18} />
            <span className="absolute top-1 left-1 h-2 w-2 rounded-full bg-[#ff7a3d] shadow-[0_0_6px_1px_rgba(255,122,61,0.6)]" />
          </button>

          {/* Owner profile chip */}
          <button className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors pr-2 pl-1.5 py-1.5">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#a855f7,#1e6fd9)" }}
            >
              <ShieldHalf size={14} className="text-white" />
            </span>
            <span className="hidden sm:block text-[12px] font-medium text-white whitespace-nowrap">
              مالك المنصة
            </span>
            <ChevronDown size={14} className="hidden sm:block text-white/45" />
          </button>
        </div>
      </div>
    </header>
  );
}
