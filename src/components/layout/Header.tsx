"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Mail, Plus, Settings,
  Users, CheckSquare, DollarSign, UserCircle,
  Clock, AlertTriangle, UserCheck, ChevronLeft, Menu,
  LogOut, User, Building2, ShieldCheck, Bot, X,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useMessages } from "@/contexts/MessagesContext";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { GlassPopover } from "@/components/ui/GlassPopover";
import { CommandFloatingOverlay, CommandPopover } from "@/components/ui/CommandOverlay";
import { useIsMobile } from "@/hooks/useIsMobile";
import { QuickActionsList } from "@/components/layout/QuickActionsMenu";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { withTimeout } from "@/lib/asyncHelpers";

// Header global-search timeout — a slow Supabase must never hang the dropdown.
const SEARCH_TIMEOUT = 8_000;

// ─── Search ──────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ElementType;
}

async function searchSupabase(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const lq = `%${q.trim()}%`;
  const out: SearchResult[] = [];

  let clientsRes: { data: { id: string; name: string; city: string }[] | null };
  let tasksRes:   { data: { id: string; title: string; assignee_name: string }[] | null };
  let employeesRes:{ data: { id: string; name: string; department: string }[] | null };
  try {
    [clientsRes, tasksRes, employeesRes] = await withTimeout(
      Promise.all([
        supabase.from("clients").select("id, name, city").or(`name.ilike.${lq},phone.ilike.${lq}`).limit(3),
        supabase.from("tasks").select("id, title, assignee_name").ilike("title", lq).limit(3),
        supabase.from("employees").select("id, name, department").or(`name.ilike.${lq},email.ilike.${lq}`).limit(2),
      ]),
      SEARCH_TIMEOUT,
    );
  } catch {
    // Timeout or network failure — silently return no results
    return [];
  }

  for (const c of clientsRes.data ?? []) {
    out.push({ id: `c-${c.id}`, label: c.name, sub: `عميل · ${c.city}`, href: "/clients", icon: UserCircle });
  }
  for (const t of tasksRes.data ?? []) {
    out.push({ id: `t-${t.id}`, label: t.title, sub: `مهمة · ${t.assignee_name}`, href: "/tasks", icon: CheckSquare });
  }
  for (const e of employeesRes.data ?? []) {
    out.push({ id: `e-${e.id}`, label: e.name, sub: `موظف · ${e.department}`, href: "/employees", icon: Users });
  }

  return out;
}

// ─── Notification icon mapping ────────────────────────────────────────────────

const NOTIF_ICONS = {
  task_late:      { icon: AlertTriangle, color: "text-red-400",   bg: "bg-red-500/10"   },
  task_due:       { icon: Clock,         color: "text-amber-400", bg: "bg-amber-500/10" },
  client_followup:{ icon: UserCheck,     color: "text-cyan-400",  bg: "bg-cyan-500/10"  },
  invoice_due:    { icon: DollarSign,    color: "text-orange-400",bg: "bg-orange-500/10"},
};

// ─── Quick-create (desktop uses shared permission-aware menu) ────────────────

// ─── Profile panel content (shared desktop popover + mobile sheet) ───────────

function ProfilePanelContent({
  user,
  userRole,
  loggingOut,
  onLogout,
  onNavigate,
  onClose,
}: {
  user: NonNullable<ProfileDropdownProps["user"]>;
  userRole: string | null;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  const { display: departmentInfo } = useProfileOrgDepartment();
  const isActive = user.is_active !== false;
  const initials = user.name?.slice(0, 2) ?? "م";
  const roleLabel = userRole
    ? getTenantRoleLabel(userRole)
    : getTenantRoleLabel(user.role);

  return (
    <div className="flex flex-col">
      {/* Identity header */}
      <div className="px-3.5 pt-3.5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 ring-1 ring-white/10"
            style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm truncate">{user.name}</div>
            <div className="text-[#8ba3c7] text-[11px] truncate mt-0.5">{user.email}</div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
              isActive
                ? "bg-emerald-500/12 text-emerald-400 border border-emerald-400/20"
                : "bg-red-500/12 text-red-400 border border-red-400/20",
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-red-400")} />
            {isActive ? "نشط" : "غير نشط"}
          </span>
        </div>
      </div>

      {/* Info chips */}
      <div className="px-3.5 py-2.5 flex flex-wrap gap-2 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px]">
          <ShieldCheck size={12} className="text-cyan-300 shrink-0" />
          <span className="text-[#8ba3c7]">الدور</span>
          <span className="text-white font-medium">{roleLabel || "عضو الفريق"}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] min-w-0">
          <Building2 size={12} className="text-cyan-300 shrink-0" />
          <span className="text-[#8ba3c7] shrink-0">القسم</span>
          <span className={cn("font-medium truncate", departmentInfo.isEmpty ? "text-white/40 italic" : "text-white")}>
            {departmentInfo.text}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => { onNavigate("/employees"); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#8ba3c7] hover:text-white hover:bg-white/[0.05] transition-all text-right"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-cyan-500/10">
            <User size={14} className="text-cyan-300" />
          </span>
          الملف الشخصي
        </button>
        <button
          onClick={() => { onNavigate("/settings"); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#8ba3c7] hover:text-white hover:bg-white/[0.05] transition-all text-right"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-cyan-500/10">
            <Settings size={14} className="text-cyan-300" />
          </span>
          إعدادات الحساب
        </button>
        <button
          onClick={() => { if (loggingOut) return; onLogout(); onClose(); }}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-red-400/90 hover:text-red-300 hover:bg-red-500/10 transition-all text-right disabled:opacity-50"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-red-400/15 bg-red-500/10">
            <LogOut size={14} className="text-red-400" />
          </span>
          {loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </div>
  );
}

// ─── Notifications panel content ─────────────────────────────────────────────

function NotificationsPanelContent({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  unreadCount = 0,
  compact = false,
}: {
  notifications: ReturnType<typeof useNotifications>["notifications"];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (href: string) => void;
  unreadCount?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-0">
      {!compact && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white">الإشعارات</span>
            {unreadCount > 0 && (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#ff7a3d]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff7a3d] border border-[#ff7a3d]/30">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-cyan-300/90 hover:text-cyan-200 transition-colors"
          >
            تحديد الكل كمقروء
          </button>
        </div>
      )}

      <div className={cn("overflow-y-auto overscroll-contain", compact ? "max-h-[50vh] p-2" : "max-h-[min(52vh,320px)] p-2")}>
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 mb-3">
              <Bell size={22} className="text-cyan-300/70" />
            </span>
            <p className="text-sm text-white/80 font-medium">لا توجد إشعارات</p>
            <p className="text-[11px] text-[#8ba3c7] mt-1">ستظهر التنبيهات هنا عند وصولها</p>
          </div>
        )}
        <div className="space-y-1.5">
          {notifications.map((n) => {
            const cfg = NOTIF_ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => { onMarkRead(n.id); onNavigate(n.href); }}
                className={cn(
                  "w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-right transition-all",
                  "border border-transparent hover:border-white/[0.06] hover:bg-white/[0.04]",
                  !n.read && "bg-cyan-500/[0.06] border-cyan-400/10",
                )}
              >
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl shrink-0 border border-white/[0.06]", cfg.bg)}>
                  <cfg.icon size={15} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-medium text-white leading-snug line-clamp-2">{n.title}</div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1 shadow-[0_0_6px_#22d3ee]" />}
                  </div>
                  {n.body && (
                    <div className="text-[11px] text-[#8ba3c7] mt-0.5 line-clamp-1">{n.body}</div>
                  )}
                  <div className="text-[10px] text-[#6b87ab] mt-1">{timeAgo(n.at)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] px-3.5 py-2">
        <button
          onClick={() => onNavigate("/tasks")}
          className="text-[11px] text-cyan-300/90 hover:text-cyan-200 w-full text-center transition-colors"
        >
          عرض جميع التنبيهات
        </button>
      </div>
    </div>
  );
}

// ─── Profile Dropdown ───────────────────────────────────────────────────────

interface ProfileDropdownProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    department?: string;
    is_active?: boolean;
  } | null;
  userRole: string | null;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: (href: string) => void;
  open: boolean;
  onToggle: () => void;
}

function ProfileDropdown({ user, userRole, loggingOut, onLogout, onNavigate, open, onToggle }: ProfileDropdownProps) {
  const isMobile = useIsMobile();
  if (!user) return null;

  const initials = user.name?.slice(0, 2) ?? "م";
  const roleLabel = userRole
    ? getTenantRoleLabel(userRole)
    : getTenantRoleLabel(user.role);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all",
          open ? "bg-[#1a3356]" : "hover:bg-[#1a3356]/50",
        )}
        title="الملف الشخصي"
        aria-label="الملف الشخصي"
        aria-expanded={open}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-right leading-none">
          <div className="text-xs font-medium text-white">{user.name}</div>
          {roleLabel ? <div className="text-[10px] text-[#8ba3c7] mt-0.5">{roleLabel}</div> : null}
        </div>
        <ChevronLeft size={12} className={cn("text-[#8ba3c7] hidden sm:block transition-transform", open && "rotate-90")} />
      </button>

      {open && !isMobile && (
        <GlassPopover className="absolute left-0 top-full mt-2 w-72 z-50">
          <ProfilePanelContent
            user={user}
            userRole={userRole}
            loggingOut={loggingOut}
            onLogout={onLogout}
            onNavigate={onNavigate}
            onClose={onToggle}
          />
        </GlassPopover>
      )}

      <CommandFloatingOverlay
        open={open && isMobile}
        onClose={onToggle}
        width="92vw"
        maxWidth={420}
        maxHeight="72vh"
        placement="bottom-float"
        showClose
      >
        <ProfilePanelContent
          user={user}
          userRole={userRole}
          loggingOut={loggingOut}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onClose={onToggle}
        />
      </CommandFloatingOverlay>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const router = useRouter();
  const { user, logout, loggingOut } = useAuth();
  const { userRole } = usePermissions();
  const isMobile = useIsMobile();

  if (process.env.NODE_ENV === "development") {
    console.log("Header userRole:", userRole);
  }

  const toast = useToast();
  const { notifications, unread: unreadNotif, markRead, markAllRead } = useNotifications();
  const { messages, unread: unreadMsg, markRead: markMsgRead, markAllRead: markAllMsgRead } = useMessages();

  // dropdown open state
  const [openNotif,   setOpenNotif]   = useState(false);
  const [openMsg,     setOpenMsg]     = useState(false);
  const [openNew,     setOpenNew]     = useState(false);
  const [openSearch,  setOpenSearch]  = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // search
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSupabase(query).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // close all on outside click
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as HTMLElement | null;

      // Mobile dropdowns (profile, notifications) render through a portal to
      // document.body via CommandFloatingOverlay, so their DOM lives outside
      // headerRef. Treat any pointer-down inside a portaled dialog as "inside"
      // so this handler does not close the menu on mousedown before the menu
      // item's click handler can run. The overlay's own backdrop still closes.
      if (target?.closest('[role="dialog"]')) {
        return;
      }

      if (headerRef.current && !headerRef.current.contains(target as Node)) {
        setOpenNotif(false);
        setOpenMsg(false);
        setOpenNew(false);
        setOpenSearch(false);
        setOpenProfile(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Escape closes desktop dropdowns (mobile overlays also listen independently)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenNotif(false);
      setOpenMsg(false);
      setOpenNew(false);
      setOpenSearch(false);
      setOpenProfile(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = useCallback(() => {
    if (loggingOut) return;
    toast.info("تم تسجيل الخروج بنجاح");
    void logout();
  }, [logout, loggingOut, toast]);

  const goTo = useCallback((href: string) => {
    router.push(href);
    setOpenNotif(false); setOpenMsg(false); setOpenNew(false);
  }, [router]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#1e3a5f]"
      style={{ background: "rgba(10,22,40,0.9)", backdropFilter: "blur(16px)" }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-white/[0.08] transition-all flex-shrink-0"
        aria-label="القائمة"
      >
        <Menu size={18} />
      </button>

      {/* Mobile brand (centered) — hidden when the mobile search is expanded */}
      {!mobileSearchOpen && (
        <Link href="/dashboard" className="lg:hidden flex min-w-0 flex-1 items-center justify-center" aria-label="Blumark24 OS">
          <OfficialBlumarkLogo className="w-[118px]" />
        </Link>
      )}

      {/* ─── Search ─────────────────────────────────────────────── */}
      <div className={cn("relative", mobileSearchOpen ? "block flex-1" : "hidden lg:block lg:max-w-md lg:flex-1")}>
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] pointer-events-none" />
        <input
          type="text"
          placeholder="ابحث في النظام أو اكتب أمراً..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenSearch(true); }}
          onFocus={() => setOpenSearch(true)}
          className="input-dark pr-9 pl-12 py-2 text-sm w-full"
        />
        <kbd className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-[#8ba3c7] lg:inline-flex">
          ⌘ K
        </kbd>
        {openSearch && results.length > 0 && (
          <GlassPopover className="absolute top-full mt-2 w-full z-50 overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => { goTo(r.href); setQuery(""); setOpenSearch(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a3356] transition-colors text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1a3356] flex items-center justify-center flex-shrink-0">
                  <r.icon size={13} className="text-[#22d3ee]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{r.label}</div>
                  <div className="text-xs text-[#8ba3c7]">{r.sub}</div>
                </div>
                <ChevronLeft size={12} className="text-[#8ba3c7] mr-auto flex-shrink-0" />
              </button>
            ))}
          </GlassPopover>
        )}
        {openSearch && query && results.length === 0 && (
          <GlassPopover className="absolute top-full mt-2 w-full z-50 px-4 py-3 text-sm text-[#8ba3c7]">
            لا توجد نتائج لـ &quot;{query}&quot;
          </GlassPopover>
        )}
      </div>

      {/* ─── Actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Mobile search toggle */}
        <button
          onClick={() => { setMobileSearchOpen((v) => !v); setOpenSearch(true); }}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-white/[0.08] transition"
          aria-label="بحث"
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* AI assistant pill (desktop) */}
        <Link
          href="/ai"
          className="hidden lg:inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-500/15 transition"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-white">
            <Bot size={12} />
          </span>
          مساعد AI
        </Link>

        {/* + New (desktop orb) */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => { setOpenNew(!openNew); setOpenNotif(false); setOpenMsg(false); }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] hover:opacity-90 transition"
            aria-label="إنشاء جديد"
          >
            <Plus size={18} />
          </button>
          {openNew && (
            <div className="absolute left-0 top-full mt-2 z-50">
              <CommandPopover width="320px">
                <div className="border-b border-white/[0.07] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/70">
                    إجراء سريع
                  </p>
                </div>
                <QuickActionsList onNavigate={() => setOpenNew(false)} compact />
              </CommandPopover>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setOpenNotif(!openNotif); setOpenMsg(false); setOpenNew(false); }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-white/[0.08] transition-all"
            aria-label="الإشعارات"
          >
            <Bell size={18} />
            {unreadNotif > 0 && (
              <span className="notif-badge" style={{ background: "#ff7a3d" }}>{unreadNotif}</span>
            )}
          </button>
          {openNotif && !isMobile && (
            <GlassPopover className="absolute left-0 top-full mt-2 w-[min(340px,92vw)] z-50 flex flex-col">
              <NotificationsPanelContent
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onNavigate={goTo}
                unreadCount={unreadNotif}
              />
            </GlassPopover>
          )}
        </div>

        <CommandFloatingOverlay
          open={openNotif && isMobile}
          onClose={() => setOpenNotif(false)}
          title="الإشعارات"
          width="94vw"
          maxWidth={460}
          maxHeight="70vh"
          placement="bottom-float"
          headerAction={
            <div className="flex items-center gap-2">
              {unreadNotif > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#ff7a3d]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff7a3d] border border-[#ff7a3d]/30">
                  {unreadNotif}
                </span>
              )}
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-cyan-300/90 hover:text-cyan-200 whitespace-nowrap"
              >
                تحديد الكل كمقروء
              </button>
            </div>
          }
        >
          <NotificationsPanelContent
            notifications={notifications}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onNavigate={(href) => { goTo(href); setOpenNotif(false); }}
            unreadCount={unreadNotif}
            compact
          />
        </CommandFloatingOverlay>

        {/* Messages (desktop) */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => { setOpenMsg(!openMsg); setOpenNotif(false); setOpenNew(false); }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-white/[0.08] transition-all"
            aria-label="الرسائل"
          >
            <Mail size={18} />
            {unreadMsg > 0 && (
              <span className="notif-badge" style={{ background: "#22d3ee" }}>{unreadMsg}</span>
            )}
          </button>
          {openMsg && (
            <GlassPopover className="absolute left-0 top-full mt-2 w-80 z-50 max-h-[min(70vh,420px)] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
                <span className="text-white font-medium text-sm">الرسائل</span>
                <button onClick={markAllMsgRead} className="text-xs text-[#22d3ee] hover:underline">تحديد الكل كمقروء</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => markMsgRead(m.id)}
                    className={cn("w-full flex items-start gap-3 px-4 py-3 hover:bg-[#1a3356]/60 transition-colors text-right border-b border-[#1e3a5f]/40 last:border-0", !m.read && "bg-[#1a3356]/60")}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#1e6fd9,#22d3ee)" }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium text-white truncate">{m.from}</span>
                        <span className="text-[10px] text-[#6b87ab] flex-shrink-0">{timeAgo(m.at)}</span>
                      </div>
                      <div className="text-xs text-white mt-0.5 truncate">{m.subject}</div>
                      <div className="text-xs text-[#8ba3c7] truncate">{m.preview}</div>
                    </div>
                    {!m.read && <div className="w-2 h-2 rounded-full bg-[#22d3ee] flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </GlassPopover>
          )}
        </div>

        {/* Settings (desktop) */}
        <button
          onClick={() => goTo("/settings")}
          className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-white/[0.08] transition-all"
          title="الإعدادات"
          aria-label="الإعدادات"
        >
          <Settings size={18} />
        </button>

        {/* Profile dropdown */}
        <ProfileDropdown
          user={user}
          userRole={userRole}
          loggingOut={loggingOut}
          onLogout={handleLogout}
          onNavigate={goTo}
          open={openProfile}
          onToggle={() => {
            setOpenProfile(!openProfile);
            setOpenNotif(false); setOpenMsg(false); setOpenNew(false);
          }}
        />
      </div>
    </header>
  );
}
