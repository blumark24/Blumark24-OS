"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePermissions, Permission } from "@/contexts/PermissionsContext";

// ─── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  href:       string;
  label:      string;
  icon:       React.ElementType;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",           label: "الرئيسية",         icon: LayoutDashboard, permission: "view_dashboard"    },
  { href: "/employees",  label: "الموظفين",          icon: Users,           permission: "manage_users"      },
  { href: "/tasks",      label: "المهام",             icon: CheckSquare,     permission: "manage_tasks"      },
  { href: "/clients",    label: "العملاء (CRM)",      icon: UserCircle,      permission: "manage_clients"    },
  { href: "/finance",    label: "المالية",            icon: DollarSign,      permission: "manage_finance"    },
  { href: "/strategy",   label: "الاستراتيجية",      icon: Map,             permission: "manage_reports"    },
  { href: "/org",        label: "الهيكل الإداري",    icon: Network,         permission: "view_dashboard"    },
  { href: "/automation", label: "مركز الأتمتة",      icon: Zap,             permission: "manage_automations"},
  { href: "/ai",         label: "المساعد الذكي",     icon: Bot,             permission: "view_dashboard"    },
  { href: "/reports",    label: "التقارير",           icon: BarChart3,       permission: "manage_reports"    },
  { href: "/settings",   label: "الإعدادات",         icon: Settings,        permission: "manage_settings"   },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?:   boolean;
  onToggle?:    () => void;
  mobileOpen?:  boolean;
  onMobileClose?:() => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname    = usePathname();
  const { user, logout } = useAuth();
  const toast       = useToast();
  const { hasPermission, userRole } = usePermissions();

  const handleLogout = () => {
    toast.info("تم تسجيل الخروج بنجاح");
    setTimeout(() => logout(), 600);
  };

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  const sidebarContent = (
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
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
        >
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
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="mr-auto text-[#8ba3c7] hover:text-[#22d3ee] transition-colors hidden lg:block"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="mr-auto text-[#8ba3c7] hover:text-[#22d3ee] transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
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
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-[#1e3a5f] p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
          >
            {user?.name?.slice(0, 2) ?? "؟"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? "المستخدم"}</div>
              <div className="text-xs text-[#8ba3c7] truncate">{userRole.replace(/_/g, " ")}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-[#8ba3c7] hover:text-red-400 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex justify-center text-[#8ba3c7] hover:text-red-400 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={onMobileClose}
          />
          {/* Sidebar panel - RTL: slides in from right */}
          <div className="absolute top-0 right-0 h-full sidebar-mobile-enter" style={{ zIndex: 51 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
