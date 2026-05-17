"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, X, ArrowLeft,
  Network, Zap,
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
  { href: "/dashboard",  label: "الرئيسية",         icon: LayoutDashboard, permission: "view_dashboard" },
  { href: "/employees",  label: "الموظفين",         icon: Users,           permission: "manage_users" },
  { href: "/tasks",      label: "المهام",           icon: CheckSquare,     permission: "manage_tasks" },
  { href: "/dashboard/crm", label: "العملاء (CRM)",    icon: UserCircle,      permission: "manage_clients" },
  { href: "/finance",    label: "المالية",          icon: DollarSign,      permission: "manage_finance" },
  { href: "/strategy",   label: "الاستراتيجية",     icon: Map,             permission: "manage_reports" },
  { href: "/org",        label: "الهيكل الإداري",   icon: Network,         permission: "view_dashboard" },
  { href: "/automation", label: "مركز الأتمتة",     icon: Zap,             permission: "manage_automations" },
  { href: "/ai",         label: "المساعد الذكي",    icon: Bot,             permission: "view_dashboard" },
  { href: "/reports",    label: "التقارير",         icon: BarChart3,       permission: "manage_reports" },
  { href: "/settings",   label: "الإعدادات",        icon: Settings,        permission: "manage_settings" },
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

  const sidebarShell = cn(
    "h-full flex flex-col rounded-none lg:rounded-2xl border border-white/[0.08]",
    "bg-[rgba(10,22,40,0.62)] backdrop-blur-xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.95)]",
    collapsed ? "w-20" : "w-72 max-w-[86vw]"
  );

  const sidebarContent = (
    <aside className={sidebarShell}>
      <div className="flex items-center px-3 py-4 border-b border-white/[0.08]">
        {!collapsed && <OfficialBlumarkLogo className="w-[150px]" />}
        {collapsed && <OfficialBlumarkLogo className="w-[36px]" />}

        <button
          onClick={onToggle}
          className="mr-auto ms-2 text-white/55 hover:text-[#22d3ee] transition-colors hidden lg:inline-flex"
          aria-label="طي الشريط الجانبي"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="mr-auto ms-2 text-white/55 hover:text-[#22d3ee] transition-colors lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-all",
                    isActive
                      ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#3B82F6]/15 to-transparent border border-[rgba(34,211,238,0.24)] text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.35)]"
                      : "text-white/72 hover:bg-white/[0.04] border border-transparent"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-[#22D3EE]" : "text-white/55 group-hover:text-[#22D3EE]"
                      )}
                      strokeWidth={1.6}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!collapsed && (
                    <ArrowLeft
                      className={cn("h-3.5 w-3.5", isActive ? "text-[#22D3EE]" : "text-white/30")}
                      strokeWidth={1.6}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/[0.08] p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03]",
          collapsed ? "justify-center p-2" : "p-2.5"
        )}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-[12px] font-semibold text-white shrink-0">
            {user?.name?.slice(0, 2) ?? "؟"}
          </span>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-white truncate">{user?.name ?? "المستخدم"}</div>
                <div className="text-[11px] text-white/55 truncate">{ROLE_LABELS[userRole] ?? userRole.replace(/_/g, " ")}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/55 hover:text-red-400 transition-colors"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={15} />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="text-white/55 hover:text-red-400 transition-colors"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block p-3 pe-0">{sidebarContent}</div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onMobileClose}
          />
          <div className="absolute top-0 right-0 h-full sidebar-mobile-enter" style={{ zIndex: 51 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
