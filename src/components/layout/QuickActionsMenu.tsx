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
        disabledReason: canTasks ? undefined : "لا تملك صلاحية إدارة المهام",
      },
      {
        id: "employee",
        label: "موظف جديد",
        icon: Users,
        href: "/employees",
        color: "#a855f7",
        enabled: canEmployees,
        disabledReason: canEmployees ? undefined : "لا تملك صلاحية إدارة الموظفين",
      },
      {
        id: "client",
        label: "عميل جديد",
        icon: UserCircle,
        href: "/clients",
        color: "#10b981",
        enabled: canClients,
        disabledReason: canClients ? undefined : "لا تملك صلاحية إدارة العملاء",
      },
      {
        id: "invoice",
        label: "فاتورة جديدة",
        icon: DollarSign,
        href: "/finance",
        color: "#ff7a3d",
        enabled: canFinance,
        disabledReason: !financeOn
          ? "ميزة المالية غير مفعّلة في باقتك"
          : !hasPermission("manage_finance")
            ? "لا تملك صلاحية إدارة المالية"
            : undefined,
      },
      {
        id: "expense",
        label: "مصروف جديد",
        icon: Receipt,
        href: "/finance",
        color: "#ef4444",
        enabled: canFinance,
        disabledReason: !financeOn
          ? "ميزة المالية غير مفعّلة في باقتك"
          : !hasPermission("manage_finance")
            ? "لا تملك صلاحية إدارة المالية"
            : undefined,
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
    <div className={cn("py-1", compact ? "px-1" : "px-2")}>
      {actions.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={!item.enabled}
          title={item.disabledReason}
          onClick={() => go(item)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-right transition-colors border-b border-white/[0.06] last:border-0",
            compact ? "px-3 py-2.5" : "px-4 py-3.5",
            item.enabled
              ? "hover:bg-white/[0.06] text-white"
              : "opacity-45 cursor-not-allowed text-white/60",
          )}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${item.color}22` }}
          >
            <item.icon size={16} style={{ color: item.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{item.label}</div>
            {!item.enabled && item.disabledReason && (
              <div className="text-[10px] text-[#8ba3c7] mt-0.5 leading-snug">{item.disabledReason}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
