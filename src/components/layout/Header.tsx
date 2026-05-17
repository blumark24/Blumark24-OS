"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Mail, Plus, Settings,
  Users, CheckSquare, DollarSign, UserCircle,
  Clock, AlertTriangle, UserCheck, ChevronLeft, Menu,
  LogOut, User, Building2, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, ROLE_LABELS } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useMessages } from "@/contexts/MessagesContext";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
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

// ─── Quick-create items ──────────────────────────────────────────────────────

const QUICK_CREATE = [
  { label: "عميل جديد",   icon: UserCircle,  href: "/clients",   color: "#10b981" },
  { label: "مهمة جديدة",  icon: CheckSquare, href: "/tasks",     color: "#22d3ee" },
  { label: "فاتورة جديدة",icon: DollarSign,  href: "/finance",   color: "#ff7a3d" },
  { label: "مصروف جديد",  icon: DollarSign,  href: "/finance",   color: "#ef4444" },
  { label: "موظف جديد",   icon: Users,       href: "/employees", color: "#a855f7" },
];

// ─── Profile Dropdown ───────────────────────────────────────────────────────

interface ProfileDropdownProps {
  user: { id: string; name: string; email: string; role: string; avatar?: string } | null;
  userRole: string;
  managedUsers: { userId: string; department: string; isActive: boolean }[];
  onLogout: () => void;
  onNavigate: (href: string) => void;
  open: boolean;
  onToggle: () => void;
}

function ProfileDropdown({ user, userRole, managedUsers, onLogout, onNavigate, open, onToggle }: ProfileDropdownProps) {
  if (!user) return null;

  const currentMU = managedUsers.find((u) => u.userId === user.id);
  const department = currentMU?.department || "—";
  const isActive   = currentMU?.isActive ?? true;
  const initials   = user.name?.slice(0, 2) ?? "م";
  const roleLabel  = ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole.replace(/_/g, " ");

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all",
          open ? "bg-[#1a3356]" : "hover:bg-[#1a3356]/50"
        )}
        title="الملف الشخصي"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-right leading-none">
          <div className="text-xs font-medium text-white">{user.name}</div>
          <div className="text-[10px] text-[#8ba3c7] mt-0.5">{roleLabel}</div>
        </div>
        <ChevronLeft size={12} className={cn("text-[#8ba3c7] hidden sm:block transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-[#1e3a5f] shadow-2xl z-50 overflow-hidden"
          style={{ background: "rgba(10,22,40,0.98)", backdropFilter: "blur(20px)" }}
        >
          {/* User card */}
          <div className="p-4 border-b border-[#1e3a5f]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{user.name}</div>
                <div className="text-[#8ba3c7] text-xs truncate mt-0.5">{user.email}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-red-400")} />
                    {isActive ? "نشط" : "غير نشط"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="px-4 py-3 space-y-2 border-b border-[#1e3a5f]">
            <div className="flex items-center gap-3 text-xs">
              <ShieldCheck size={14} className="text-[#22d3ee] flex-shrink-0" />
              <span className="text-[#8ba3c7]">الدور:</span>
              <span className="text-white font-medium mr-auto">{roleLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Building2 size={14} className="text-[#22d3ee] flex-shrink-0" />
              <span className="text-[#8ba3c7]">القسم:</span>
              <span className="text-white font-medium mr-auto">{department}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => { onNavigate("/employees"); onToggle(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8ba3c7] hover:text-white hover:bg-[#1a3356]/60 transition-all text-right"
            >
              <User size={15} className="text-[#22d3ee] flex-shrink-0" />
              الملف الشخصي
            </button>
            <button
              onClick={() => { onNavigate("/settings"); onToggle(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8ba3c7] hover:text-white hover:bg-[#1a3356]/60 transition-all text-right"
            >
              <Settings size={15} className="text-[#22d3ee] flex-shrink-0" />
              إعدادات الحساب
            </button>
            <div className="my-1 border-t border-[#1e3a5f]" />
            <button
              onClick={() => { onLogout(); onToggle(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-right"
            >
              <LogOut size={15} className="flex-shrink-0" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { userRole, managedUsers } = usePermissions();

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
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
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

  const handleLogout = useCallback(() => {
    toast.info("تم تسجيل الخروج بنجاح");
    setTimeout(() => logout(), 600);
  }, [logout, toast]);

  const goTo = useCallback((href: string) => {
    router.push(href);
    setOpenNotif(false); setOpenMsg(false); setOpenNew(false);
  }, [router]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 flex items-center gap-3 px-6 py-3 border-b border-[#1e3a5f]"
      style={{ background: "rgba(10,22,40,0.9)", backdropFilter: "blur(16px)" }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all flex-shrink-0"
        aria-label="القائمة"
      >
        <Menu size={20} />
      </button>

      {/* ─── Search ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7] pointer-events-none" />
        <input
          type="text"
          placeholder="بحث في العملاء والمهام والموظفين..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenSearch(true); }}
          onFocus={() => setOpenSearch(true)}
          className="input-dark pr-9 py-2 text-sm w-full"
        />
        {openSearch && results.length > 0 && (
          <div
            className="absolute top-full mt-2 w-full rounded-2xl border border-[#1e3a5f] shadow-xl overflow-hidden z-50"
            style={{ background: "rgba(13,31,60,0.98)", backdropFilter: "blur(16px)" }}
          >
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
          </div>
        )}
        {openSearch && query && results.length === 0 && (
          <div
            className="absolute top-full mt-2 w-full rounded-2xl border border-[#1e3a5f] px-4 py-3 text-sm text-[#8ba3c7] z-50"
            style={{ background: "rgba(13,31,60,0.98)" }}
          >
            لا توجد نتائج لـ &quot;{query}&quot;
          </div>
        )}
      </div>

      {/* ─── Actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        {/* + New */}
        <div className="relative">
          <button
            onClick={() => { setOpenNew(!openNew); setOpenNotif(false); setOpenMsg(false); }}
            className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm"
          >
            <Plus size={15} />
            <span>جديد</span>
          </button>
          {openNew && (
            <div
              className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-[#1e3a5f] shadow-xl overflow-hidden z-50"
              style={{ background: "rgba(13,31,60,0.98)", backdropFilter: "blur(16px)" }}
            >
              {QUICK_CREATE.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { goTo(item.href); toast.info(`انتقلت إلى صفحة ${item.label.replace(" جديد", "")}`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a3356] transition-colors text-right"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                    <item.icon size={13} style={{ color: item.color }} />
                  </div>
                  <span className="text-sm text-white">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setOpenNotif(!openNotif); setOpenMsg(false); setOpenNew(false); }}
            className="relative p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all"
          >
            <Bell size={18} />
            {unreadNotif > 0 && (
              <span className="notif-badge" style={{ background: "#ff7a3d" }}>{unreadNotif}</span>
            )}
          </button>
          {openNotif && (
            <div
              className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-[#1e3a5f] shadow-xl z-50 overflow-hidden"
              style={{ background: "rgba(13,31,60,0.98)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
                <span className="text-white font-medium text-sm">الإشعارات</span>
                <button onClick={markAllRead} className="text-xs text-[#22d3ee] hover:underline">تحديد الكل كمقروء</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-[#8ba3c7]">لا توجد إشعارات</div>
                )}
                {notifications.map((n) => {
                  const cfg = NOTIF_ICONS[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => { markRead(n.id); goTo(n.href); }}
                      className={cn("w-full flex items-start gap-3 px-4 py-3 hover:bg-[#1a3356]/60 transition-colors text-right border-b border-[#1e3a5f]/40 last:border-0", !n.read && "bg-[#1a3356]/60")}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <cfg.icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{n.title}</div>
                        <div className="text-xs text-[#8ba3c7] mt-0.5 truncate">{n.body}</div>
                        <div className="text-[10px] text-[#6b87ab] mt-1">{timeAgo(n.at)}</div>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#22d3ee] flex-shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-[#1e3a5f]">
                <button onClick={() => goTo("/tasks")} className="text-xs text-[#22d3ee] hover:underline w-full text-center">
                  عرض جميع التنبيهات
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="relative">
          <button
            onClick={() => { setOpenMsg(!openMsg); setOpenNotif(false); setOpenNew(false); }}
            className="relative p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all"
          >
            <Mail size={18} />
            {unreadMsg > 0 && (
              <span className="notif-badge" style={{ background: "#22d3ee" }}>{unreadMsg}</span>
            )}
          </button>
          {openMsg && (
            <div
              className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-[#1e3a5f] shadow-xl z-50 overflow-hidden"
              style={{ background: "rgba(13,31,60,0.98)", backdropFilter: "blur(16px)" }}
            >
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
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => goTo("/settings")}
          className="p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all"
          title="الإعدادات"
        >
          <Settings size={18} />
        </button>

        {/* Profile dropdown */}
        <ProfileDropdown
          user={user}
          userRole={userRole}
          managedUsers={managedUsers}
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
