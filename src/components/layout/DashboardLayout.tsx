"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav, { MOBILE_BOTTOM_NAV_INSET } from "./MobileBottomNav";
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a1628" }}>
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {/* Profile load error banner — visible when the auth session is alive
            but the matching profile row couldn't be read after retries. */}
        {profileLoadError && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs flex items-center gap-3">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 flex-1">{profileLoadError}</span>
            <button
              type="button"
              onClick={() => void refreshCurrentUser()}
              className="text-red-200 hover:text-white underline underline-offset-2"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Debug banner — visible only in dev */}
        {isDev && user && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-1.5 text-xs font-mono flex items-center gap-4 flex-wrap">
            <span className="text-yellow-400 font-bold">[DEBUG]</span>
            <span className="text-yellow-200">email: <b>{user.email}</b></span>
            <span className="text-yellow-200">role: <b>{user.role}</b></span>
            <span className={userRole === "super_admin" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              mapped: {userRole ?? "—"} {userRole === "super_admin" ? "✓ FULL ACCESS" : "✗ LIMITED"}
            </span>
          </div>
        )}

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 ${MOBILE_BOTTOM_NAV_INSET}`}
        >
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
