"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileShellContext from "./MobileShellContext";
import MobileBottomNav, { MOBILE_BOTTOM_NAV_INSET } from "./MobileBottomNav";
import WorkspaceRouteGuard from "@/components/ui/WorkspaceRouteGuard";
import CustomerOnboardingBanner from "@/components/ui/CustomerOnboardingBanner";
import BlumarkAmbientBackground from "@/components/dashboard/BlumarkAmbientBackground";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AlertTriangle } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, profileLoadError, refreshCurrentUser } = useAuth();
  const { userRole } = usePermissions();

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#07111f]">
      <BlumarkAmbientBackground />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,20,37,0.2), rgba(4,12,24,0.7)), radial-gradient(80% 70% at 80% 0%, rgba(34,211,238,0.06), transparent 58%)",
        }}
      />

      <div className="relative z-20">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {profileLoadError && (
          <div className="flex items-center gap-3 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs">
            <AlertTriangle size={14} className="flex-shrink-0 text-red-400" />
            <span className="flex-1 text-red-300">{profileLoadError}</span>
            <button
              type="button"
              onClick={() => void refreshCurrentUser()}
              className="text-red-200 underline underline-offset-2 hover:text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {isDev && user && (
          <div className="flex flex-wrap items-center gap-4 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 font-mono text-xs">
            <span className="font-bold text-yellow-400">[DEBUG]</span>
            <span className="text-yellow-200">email: <b>{user.email}</b></span>
            <span className="text-yellow-200">role: <b>{user.role}</b></span>
            <span className={userRole === "super_admin" ? "font-bold text-green-400" : "font-bold text-red-400"}>
              mapped: {userRole ?? "—"} {userRole === "super_admin" ? "✓ FULL ACCESS" : "✗ LIMITED"}
            </span>
          </div>
        )}

        <MobileShellContext />

        <main
          className={`relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 xl:px-7 ${MOBILE_BOTTOM_NAV_INSET}`}
        >
          <div className="mx-auto w-full max-w-[1680px]">
            <WorkspaceRouteGuard>
              <CustomerOnboardingBanner />
              {children}
            </WorkspaceRouteGuard>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
