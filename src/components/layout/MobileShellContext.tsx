"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getRouteLabel, type WorkspaceRouteId } from "@/lib/features/packageFeatures";
import { MOBILE_ROUTE_LABELS } from "@/lib/tenant/tenantDisplay";
import { MobileStatusBadge, type MobileShellStatus } from "@/components/ui/workspaceUi";

const ROUTE_HINTS: Partial<Record<WorkspaceRouteId, string>> = {
  dashboard: "مركز متابعة أعمالك اليوم",
  clients: "علاقات العملاء والمتابعة",
  tasks: "الأعمال المطلوبة الآن",
  finance: "حركة مالية مختصرة",
  reports: "قراءة الأداء والتقارير",
  settings: "إعدادات المنشأة والحساب",
  org: "تأسيس الهيكل وربطه",
  virtual_office: "مساحة تشغيل مرتبطة بالهيكل",
  ai: "مساعد تشغيلي للقراءة والتحليل",
  automation: "إجراءات تشغيل ذكية",
  employees: "الفريق والصلاحيات",
  strategy: "التخطيط والنمو",
};

function routeMatches(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

export default function MobileShellContext() {
  const pathname = usePathname();
  const { navRoutes, loading } = useTenantWorkspace();

  const current = useMemo(() => {
    if (loading) return null;
    return navRoutes.find((route) => routeMatches(pathname, route.href)) ?? null;
  }, [loading, navRoutes, pathname]);

  if (loading || !current) return null;

  const title = MOBILE_ROUTE_LABELS[current.id] ?? getRouteLabel(current.id);
  const hint = ROUTE_HINTS[current.id] ?? "مساحة عمل العميل";
  const status: MobileShellStatus = "جاهز";

  return (
    <div className="lg:hidden border-b border-cyan-300/[0.08] bg-[#071426]/86 px-3 py-2.5 backdrop-blur-2xl" dir="rtl">
      <div className="mx-auto flex min-h-[44px] w-full max-w-md items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-right">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold leading-6 text-white">{title}</h1>
            <MobileStatusBadge status={status} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-[#8ba3c7]">{hint}</p>
        </div>
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15",
            "bg-[linear-gradient(145deg,rgba(34,211,238,0.14),rgba(30,111,217,0.08))]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          )}
          aria-hidden
        >
          <ChevronLeft size={18} className="text-cyan-200" />
        </div>
      </div>
    </div>
  );
}
