"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const navItems = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/employees", label: "الموظفين", icon: Users },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/clients", label: "العملاء (CRM)", icon: UserCircle },
  { href: "/finance", label: "المالية", icon: DollarSign },
  { href: "/strategy", label: "الاستراتيجية", icon: Map },
  { href: "/org", label: "الهيكل الإداري", icon: Network },
  { href: "/automation", label: "مركز الأتمتة", icon: Zap },
  { href: "/ai", label: "المساعد الذكي", icon: Bot },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    toast.info("تم تسجيل الخروج بنجاح");
    setTimeout(() => logout(), 600);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 z-40",
        "border-l border-[#1e3a5f]",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e3a5f]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9"/>
            <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="font-heading font-bold text-white text-base leading-none">Blumark24</div>
            <div className="text-[10px] text-[#22d3ee] font-medium mt-0.5">OS</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="mr-auto text-[#8ba3c7] hover:text-[#22d3ee] transition-colors"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "sidebar-active"
                      : "text-[#8ba3c7] hover:text-white hover:bg-[#1a3356]/50"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive ? "text-[#22d3ee]" : "group-hover:text-[#22d3ee]"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-[#1e3a5f] p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}>
            أم
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? "المستخدم"}</div>
              <div className="text-xs text-[#8ba3c7]">{user?.role?.replace("_", " ") ?? ""}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="text-[#8ba3c7] hover:text-red-400 transition-colors" title="تسجيل الخروج">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
