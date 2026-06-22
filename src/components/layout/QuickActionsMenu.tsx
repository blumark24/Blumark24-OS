"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  DollarSign,
  Receipt,
  UserCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { featureEnabled } from "@/lib/features/packageFeatures";
import { useToast } from "@/contexts/ToastContext";

export interface QuickActionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
  enabled: boolean;
  disabledReason?: string;
}

export function useQuickActions(): QuickActionDef[] {
  const { hasPermission } = usePermissions();
  const { enabledFeatures, isPlatformAdmin } = useTenantWorkspace();
  const financeOn = isPlatformAdmin || featureEnabled(enabledFeatures, "finance");

  return useMemo(() => {
    const canTasks = hasPermission("manage_tasks");
    const canEmployees = hasPermission("manage_users");
    const canClients = hasPermission("manage_clients");
    const canFinance = hasPermission("manage_finance") && financeOn;

    return [
      {
        id: "task",
        label: "مهمة جديدة",
        icon: CheckSquare,
        href: "/tasks",
        color: "#22d3ee",
        enabled: canTasks,
        disabledReason: canTasks ? undefined : "لا تملك صلاحية",
      },
      {
        id: "employee",
        label: "موظف جديد",
        icon: Users,
        href: "/employees",
        color: "#a855f7",
        enabled: canEmployees,
        disabledReason: canEmployees ? undefined : "لا تملك صلاحية",
      },
      {
        id: "client",
        label: "عميل جديد",
        icon: UserCircle,
        href: "/clients",
        color: "#10b981",
        enabled: canClients,
        disabledReason: canClients ? undefined : "لا تملك صلاحية",
      },
      {
        id: "invoice",
        label: "فاتورة جديدة",
        icon: DollarSign,
        href: "/finance",
        color: "#ff7a3d",
        enabled: canFinance,
        disabledReason: !financeOn ? "غير متاح في باقتك" : "لا تملك صلاحية",
      },
      {
        id: "expense",
        label: "مصروف جديد",
        icon: Receipt,
        href: "/finance",
        color: "#ef4444",
        enabled: canFinance,
        disabledReason: !financeOn ? "غير متاح في باقتك" : "لا تملك صلاحية",
      },
    ];
  }, [hasPermission, financeOn]);
}

export function QuickActionsList({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const actions = useQuickActions();

  const go = (action: QuickActionDef) => {
    if (!action.enabled) return;
    router.push(action.href);
    onNavigate?.();
    toast.info(`انتقلت إلى ${action.label.replace(" جديد", "").replace(" جديدة", "")}`);
  };

  return (
    <div className={cn(compact ? "p-1.5" : "p-2")}>
      {actions.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={!item.enabled}
          title={item.disabledReason}
          onClick={() => go(item)}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-xl text-right transition-all",
            compact ? "min-h-[44px] px-2.5 py-2" : "min-h-[46px] px-3 py-2.5",
            item.enabled
              ? "hover:bg-white/[0.06] text-white active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              : "opacity-40 cursor-not-allowed text-white/55",
          )}
        >
          <div
            className={cn(
              "grid place-items-center rounded-xl border border-white/[0.08] flex-shrink-0",
              compact ? "h-8 w-8" : "h-9 w-9",
            )}
            style={{
              background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
            }}
          >
            <item.icon size={compact ? 14 : 15} style={{ color: item.color }} />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className={cn("font-medium leading-snug", compact ? "text-[13px]" : "text-sm")}>
              {item.label}
            </div>
            {!item.enabled && item.disabledReason && (
              <div className="text-[10px] text-[#8ba3c7]/90 mt-0.5">{item.disabledReason}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
