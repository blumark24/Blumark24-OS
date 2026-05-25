"use client";

import { useEffect, useState } from "react";
import { Activity, Building2, Layers, PauseCircle, Trash2, Sparkles } from "lucide-react";
import { fetchOwnerAuditTimeline, type OwnerAuditEntry } from "../_lib/ownerQueries";
import { ACCENT } from "../_accent";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const ACTION_ICONS: Record<string, LucideIcon> = {
  activate_subscription: Sparkles,
  update_organization: Building2,
  change_plan: Layers,
  suspend_organization: PauseCircle,
  reactivate_organization: Building2,
  soft_delete_organization: Trash2,
  cancel_subscription: PauseCircle,
  create_organization: Building2,
};

export default function ActivityTimeline() {
  const [entries, setEntries] = useState<OwnerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerAuditTimeline(8)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-5">
        <Activity size={18} className="text-[#22d3ee]" />
        سجل النشاطات الأخيرة
      </h2>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-[13px] text-[#8ba3c7] py-8 text-center">لا توجد أحداث تدقيق بعد</p>
      )}

      {!loading && entries.length > 0 && (
        <ol className="relative space-y-4">
          <span className="absolute top-1 bottom-1 right-[18px] w-px bg-white/[0.08]" aria-hidden />

          {entries.map((item) => {
            const accent = "cyan" as const;
            const a = ACCENT[accent];
            const Icon = ACTION_ICONS[item.action] ?? Activity;
            return (
              <li key={item.id} className="relative flex gap-3 pr-0">
                <span
                  className={cn(
                    "relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border",
                    a.iconBg,
                    a.border,
                  )}
                >
                  <Icon size={15} className={a.text} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[13px] font-medium text-white leading-snug">{item.detail}</div>
                  <div className="text-[12px] text-[#8ba3c7] mt-0.5">{item.ownerEmail}</div>
                  <div className="text-[11px] text-[#5f7798] mt-0.5">{item.createdAt}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
