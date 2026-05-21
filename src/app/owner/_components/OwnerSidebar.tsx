"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Layers,
  CreditCard,
  Receipt,
  Sparkles,
  MessageCircle,
  Activity,
  ShieldCheck,
  Settings,
  X,
  ChevronLeft,
  ShieldHalf,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "command",   label: "القيادة الرئيسية",          icon: LayoutDashboard },
  { id: "orgs",      label: "المنشآت",                   icon: Building2 },
  { id: "plans",     label: "الباقات",                   icon: Layers },
  { id: "subs",      label: "الاشتراكات",                icon: CreditCard },
  { id: "invoices",  label: "الفواتير",                  icon: Receipt },
  { id: "ai",        label: "استخدام الذكاء الاصطناعي",  icon: Sparkles },
  { id: "whatsapp",  label: "واتساب بوت",                icon: MessageCircle },
  { id: "activity",  label: "سجل النشاطات",              icon: Activity },
  { id: "roles",     label: "الصلاحيات والأدوار",        icon: ShieldCheck },
  { id: "settings",  label: "الإعدادات",                 icon: Settings },
];

interface OwnerSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function OwnerSidebar({ mobileOpen, onMobileClose }: OwnerSidebarProps) {
  // Phase 1 is a single page — nav highlight is purely visual (no routing yet).
  const [active, setActive] = useState("command");

  const innerCard = (
    <div className="flex flex-col flex-1 rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0a1628] lg:bg-[rgba(10,22,40,0.6)] lg:backdrop-blur-xl">
      {/* Brand header */}
      <div className="relative flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_-4px_rgba(34,211,238,0.6)]"
          style={{ background: "linear-gradient(135deg,#22D3EE,#1E6FD9)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95" />
            <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-white font-heading font-bold text-[15px] leading-tight truncate">
            Blumark24 OS
          </div>
          <div className="text-[#22d3ee] text-[11px] leading-tight truncate">
            Owner Command Center
          </div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/55 hover:text-[#22D3EE] transition-colors lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scope chip */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#a855f7]/25 bg-[#a855f7]/[0.08] px-3 py-2">
          <ShieldHalf size={14} className="text-[#c084fc] flex-shrink-0" />
          <span className="text-[11px] text-[#c8b6e8]">منطقة خاصة بمالك المنصة</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = id === active;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(id);
                    onMobileClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors border text-right",
                    isActive
                      ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#22d3ee]/12 to-transparent border-[rgba(34,211,238,0.24)] text-white shadow-[0_2px_10px_-4px_rgba(34,211,238,0.30)]"
                      : "text-white/[0.72] hover:bg-white/[0.04] border-transparent",
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#22D3EE]" : "text-white/55")}
                      strokeWidth={1.6}
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  <ChevronLeft
                    className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-[#22D3EE]" : "text-white/25")}
                    strokeWidth={1.6}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Owner card */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#a855f7,#1E6FD9)" }}
          >
            B24
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-white truncate">مالك المنصة</div>
            <div className="text-[11px] text-white/55 truncate">Platform Owner</div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]" />
        </div>
      </div>
    </div>
  );

  const aside = (
    <aside className="flex flex-col h-screen sticky top-0 z-40 p-2 w-[80vw] max-w-[300px] lg:w-64 lg:max-w-none">
      {innerCard}
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{aside}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/55" onClick={onMobileClose} />
          <div className="absolute top-0 right-0 h-full sidebar-mobile-enter" style={{ zIndex: 51 }}>
            {aside}
          </div>
        </div>
      )}
    </>
  );
}
