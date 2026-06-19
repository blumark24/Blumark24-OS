"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ShieldHalf,
  ChevronDown,
  Clock,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Settings,
  AlertOctagon,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  fetchNotificationBellData,
  type BellEntry,
  type NotificationBellData,
} from "../_lib/ownerTruthQueries";
import { ownerSupabase } from "@/lib/supabase/ownerClient";

interface OwnerHeaderProps {
  onMobileMenuToggle: () => void;
}

// ─── Bell dropdown ─────────────────────────────────────────────────────────────

function BellDropdown({
  data,
  loading,
  onClose,
}: {
  data: NotificationBellData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const entries: BellEntry[] = data?.entries ?? [];

  return (
    <div className="absolute left-0 top-full mt-2 w-[340px] sm:w-[380px] z-50 rounded-2xl border border-white/[0.10] bg-[#0a1628] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.8)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <span className="text-[13px] font-semibold text-white">آخر النشاطات</span>
        <Link
          href="/owner/security"
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors"
        >
          عرض الكل
          <ExternalLink size={10} />
        </Link>
      </div>

      <div className="max-h-[340px] overflow-y-auto">
        {loading ? (
          <div className="animate-pulse px-4 py-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-white/[0.06] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-24 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Inbox size={32} className="text-white/20 mb-3" strokeWidth={1.2} />
            <p className="text-[13px] text-white/50">لا توجد نشاطات مسجّلة بعد</p>
            <p className="text-[11px] text-white/30 mt-1">ستظهر هنا الإجراءات التي يقوم بها مالك المنصة</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#22d3ee]/10 mt-0.5">
                  <Clock size={12} className="text-[#22d3ee]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-white font-medium leading-tight truncate">{entry.title}</p>
                  <p className="text-[11px] text-[#8ba3c7] mt-0.5 truncate">{entry.detail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#5f7798]">{entry.timeAgo}</span>
                    {entry.targetType && (
                      <span className="text-[10px] text-[#5f7798] border border-white/[0.08] rounded px-1 py-0.5">
                        {entry.targetType}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-white/[0.06]">
        <p className="text-[10px] text-[#5f7798]">
          {entries.length > 0 ? `${entries.length} نشاط — آخر 10 سجلات` : "سجل النشاطات فارغ"}
        </p>
      </div>
    </div>
  );
}

// ─── Owner quick menu ──────────────────────────────────────────────────────────

const QUICK_MENU_ITEMS = [
  { href: "/owner",          label: "لوحة المالك الرئيسية", icon: LayoutDashboard, disabled: false },
  { href: "/owner/roles",    label: "الصلاحيات والأدوار",   icon: Lock,            disabled: false },
  { href: "/owner/security", label: "مركز التدقيق والمراقبة", icon: ShieldCheck,    disabled: false },
  { href: "/owner/settings", label: "إعدادات المنصة",       icon: Settings,        disabled: false },
  { href: null,              label: "وضع الطوارئ",          icon: AlertOctagon,    disabled: true,  badge: "قريبًا" },
] as const;

function OwnerQuickMenu({
  ownerEmail,
  onClose,
}: {
  ownerEmail: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLogoutError(false);
    setLoggingOut(true);
    try {
      const { error } = await ownerSupabase.auth.signOut({ scope: "local" });
      if (error) { setLogoutError(true); setLoggingOut(false); return; }
      const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `blumark_owner_session=; path=/; max-age=0; SameSite=Strict${secureAttr}`;
      onClose();
      router.replace("/owner/login");
      router.refresh();
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  return (
    <div className="absolute left-0 top-full mt-2 w-[260px] z-50 rounded-2xl border border-white/[0.10] bg-[#0a1628] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.85)] overflow-hidden">
      {/* Identity strip */}
      <div className="px-4 py-3.5 border-b border-white/[0.07] flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#a855f7,#1e6fd9)" }}
        >
          <ShieldHalf size={16} className="text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight">مالك المنصة</p>
          <p className="text-[10.5px] text-white/40 leading-tight mt-0.5">Platform Owner</p>
          {ownerEmail && (
            <p className="text-[10.5px] text-[#22d3ee]/70 truncate mt-0.5">{ownerEmail}</p>
          )}
        </div>
      </div>

      {/* Nav items */}
      <div className="py-1.5">
        {QUICK_MENU_ITEMS.map((item) =>
          item.disabled ? (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-2.5 text-white/25 cursor-not-allowed select-none"
            >
              <item.icon size={14} className="flex-shrink-0" />
              <span className="text-[12.5px] flex-1">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="text-[10px] bg-white/[0.07] text-white/30 rounded-md px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-white/65 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <item.icon size={14} className="flex-shrink-0 text-white/35" />
              <span className="text-[12.5px]">{item.label}</span>
            </Link>
          )
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-white/[0.07] px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[#f87171] hover:bg-[#ef4444]/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut
            ? <Loader2 size={14} className="animate-spin flex-shrink-0" />
            : <LogOut size={14} className="flex-shrink-0" />}
          <span className="text-[12.5px] font-medium">
            {loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
          </span>
        </button>
        {logoutError && (
          <p className="text-[11px] text-[#f87171]/70 text-center mt-1.5">
            تعذّر تسجيل الخروج، حاول مرة أخرى
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main header ───────────────────────────────────────────────────────────────

export default function OwnerHeader({ onMobileMenuToggle }: OwnerHeaderProps) {
  const pathname = usePathname();

  // Bell state
  const [bellOpen, setBellOpen] = useState(false);
  const [bellData, setBellData] = useState<NotificationBellData | null>(null);
  const [bellLoading, setBellLoading] = useState(false);
  const [hasRecent, setHasRecent] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Quick menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close both dropdowns on route change
  useEffect(() => {
    setBellOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Fetch owner email once on mount
  useEffect(() => {
    ownerSupabase.auth.getUser()
      .then(({ data }) => setOwnerEmail(data.user?.email ?? null))
      .catch(() => {/* silent */});
  }, []);

  // Bell lazy fetch
  const fetchBell = useCallback(async () => {
    if (bellData !== null) return;
    setBellLoading(true);
    try {
      const data = await fetchNotificationBellData();
      setBellData(data);
      setHasRecent(data.hasRecentActivity);
    } catch {
      setBellData({ entries: [], hasRecentActivity: false });
    } finally {
      setBellLoading(false);
    }
  }, [bellData]);

  // Initial dot check
  useEffect(() => {
    fetchNotificationBellData()
      .then((d) => setHasRecent(d.hasRecentActivity))
      .catch(() => {/* silent */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBellClick() {
    if (menuOpen) setMenuOpen(false);
    if (!bellOpen) void fetchBell();
    setBellOpen((prev) => !prev);
  }

  function handleMenuClick() {
    if (bellOpen) setBellOpen(false);
    setMenuOpen((prev) => !prev);
  }

  // Click-outside: bell
  useEffect(() => {
    if (!bellOpen) return;
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  // Click-outside: menu
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

        {/* Title */}
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
          {/* System status */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/[0.1] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-[11px] text-[#34d399] font-medium whitespace-nowrap">
              الأنظمة تعمل بشكل طبيعي
            </span>
          </div>

          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-xl text-white/70 hover:text-[#22d3ee] hover:bg-white/[0.04] transition-colors"
              aria-label="الإشعارات"
              aria-expanded={bellOpen}
            >
              <Bell size={18} />
              {hasRecent && (
                <span className="absolute top-1 left-1 h-2 w-2 rounded-full bg-[#ff7a3d] shadow-[0_0_6px_1px_rgba(255,122,61,0.6)]" />
              )}
            </button>

            {bellOpen && (
              <BellDropdown
                data={bellData}
                loading={bellLoading}
                onClose={() => setBellOpen(false)}
              />
            )}
          </div>

          {/* Owner profile chip → quick menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={handleMenuClick}
              aria-expanded={menuOpen}
              aria-label="قائمة المالك"
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors pr-2 pl-1.5 py-1.5"
            >
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#a855f7,#1e6fd9)" }}
              >
                <ShieldHalf size={14} className="text-white" />
              </span>
              <span className="hidden sm:block text-[12px] font-medium text-white whitespace-nowrap">
                مالك المنصة
              </span>
              <ChevronDown
                size={14}
                className={`hidden sm:block text-white/45 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <OwnerQuickMenu
                ownerEmail={ownerEmail}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
