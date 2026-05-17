"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap, X, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePermissions, Permission, ROLE_LABELS } from "@/contexts/PermissionsContext";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",   label: "الرئيسية",         icon: LayoutDashboard, permission: "view_dashboard" },
  { href: "/employees",   label: "الموظفين",          icon: Users,           permission: "manage_users" },
  { href: "/tasks",       label: "المهام",             icon: CheckSquare,     permission: "manage_tasks" },
  { href: "/clients",     label: "العملاء (CRM)",      icon: UserCircle,      permission: "manage_clients" },
  { href: "/finance",     label: "المالية",            icon: DollarSign,      permission: "manage_finance" },
  { href: "/strategy",    label: "الاستراتيجية",      icon: Map,             permission: "manage_reports" },
  { href: "/org",         label: "الهيكل الإداري",    icon: Network,         permission: "view_dashboard" },
  { href: "/automation",  label: "مركز الأتمتة",      icon: Zap,             permission: "manage_automations" },
  { href: "/ai",          label: "المساعد الذكي",     icon: Bot,             permission: "view_dashboard" },
  { href: "/reports",     label: "التقارير",           icon: BarChart3,       permission: "manage_reports" },
  { href: "/settings",    label: "الإعدادات",         icon: Settings,        permission: "manage_settings" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAuth();
  const toast = useToast();
  const { hasPermission, userRole } = usePermissions();

  const handleLogout = () => {
    toast.info("تم تسجيل الخروج بنجاح");
    setTimeout(() => logout(), 600);
  };

  const visibleItems = authLoading
    ? NAV_ITEMS
    : userRole === "super_admin"
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => hasPermission(item.permission));

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 z-40",
        "border-l border-white/[0.08]",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ background: "rgba(10,22,40,0.58)", backdropFilter: "blur(18px)" }}
    >
      <div className="flex items-center px-3 py-4 border-b border-white/[0.08]">
        {collapsed ? (
          <div className="w-10 h-10 rounded-2xl border border-white/[0.12] bg-white/[0.03] flex items-center justify-center">
            <OfficialBlumarkLogo className="w-8" />
          </div>
        ) : (
          <OfficialBlumarkLogo className="w-[145px]" />
        )}

        <button
          onClick={onToggle}
          className="mr-auto ms-2 text-white/55 hover:text-[#22d3ee] transition-colors hidden lg:block"
          aria-label="طي الشريط الجانبي"
        >
          <ChevronLeft size={17} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="mr-auto ms-2 text-white/55 hover:text-[#22d3ee] transition-colors lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1.5 px-2.5">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#3B82F6]/15 to-transparent border-[rgba(34,211,238,0.24)] text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.35)]"
                      : "border-transparent text-white/70 hover:text-white hover:bg-white/[0.04]"
                  )}
                  title={collapsed ? label : undefined}
                >
                  {!collapsed ? (
                    <>
                      <ArrowLeft className={cn("h-3.5 w-3.5", isActive ? "text-[#22D3EE]" : "text-white/35 group-hover:text-white/60")} strokeWidth={1.6} />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="truncate text-sm font-medium">{label}</span>
                        <Icon size={17} className={cn(isActive ? "text-[#22D3EE]" : "text-white/55 group-hover:text-[#22D3EE]")} />
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex justify-center">
                      <Icon size={18} className={cn(isActive ? "text-[#22D3EE]" : "text-white/60 group-hover:text-[#22D3EE]")} />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className={cn("rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5", collapsed && "flex justify-center") }>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-[12px] font-semibold text-white shrink-0">
              {user?.name?.slice(0, 2) ?? "؟"}
            </span>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-white truncate">{user?.name ?? "المستخدم"}</div>
                  <div className="text-[11px] text-white/55 truncate">{ROLE_LABELS[userRole] ?? userRole.replace(/_/g, " ")}</div>
                </div>
                <button onClick={handleLogout} className="text-white/60 hover:text-red-400 transition-colors" title="تسجيل الخروج">
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <button onClick={handleLogout} className="mt-2 w-full flex justify-center text-white/60 hover:text-red-400 transition-colors" title="تسجيل الخروج">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebarContent}</div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onMobileClose} />
          <div className="absolute top-0 right-0 h-full sidebar-mobile-enter" style={{ zIndex: 51 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
