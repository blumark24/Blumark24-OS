"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import OwnerSidebar from "./_components/OwnerSidebar";
import OwnerHeader from "./_components/OwnerHeader";
import OwnerGuard from "./_components/OwnerGuard";

// Self-contained shell for the Owner Command Center. It deliberately does NOT
// reuse the client `DashboardLayout`, which is wired to the client AuthContext /
// PermissionsContext. The owner area is a separate system with its own
// navigation. The shared mobile-sidebar state lives here so the header's menu
// button can drive the sidebar overlay.
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // The owner login route is the one public page within the owner area: it has
  // no guard (it's how you authenticate) and no shell chrome.
  if (pathname === "/owner/login") {
    return <>{children}</>;
  }

  return (
    <OwnerGuard>
      <div className="relative flex min-h-screen overflow-x-hidden" style={{ background: "#0a1628" }}>
        {/* Ambient command-center glow */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#22d3ee]/10 blur-3xl" />
          <div className="absolute top-1/3 left-[-12%] h-[460px] w-[460px] rounded-full bg-[#a855f7]/10 blur-3xl" />
          <div className="absolute bottom-[-12%] right-1/4 h-[400px] w-[400px] rounded-full bg-[#1e6fd9]/10 blur-3xl" />
        </div>

        <OwnerSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <OwnerHeader onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 px-3 sm:px-5 lg:px-7 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </OwnerGuard>
  );
}
