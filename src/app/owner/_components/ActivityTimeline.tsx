"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { ACCENT } from "../_accent";
import { OWNER_ACTIVITY_EMPTY } from "../_data";
import {
  fetchOwnerAuditTimeline,
  type OwnerAuditEntry,
} from "../_lib/ownerTruthQueries";
import { cn } from "@/lib/utils";

export default function ActivityTimeline() {
  const [items, setItems] = useState<OwnerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOwnerAuditTimeline()
      .then((rows) => {
        if (active) setItems(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-white/[0.06] flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
          <Activity size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
          <p className="text-[14px] font-medium text-white">{OWNER_ACTIVITY_EMPTY}</p>
          <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-xs leading-relaxed">
            تُسجَّل هنا إجراءات المالك (إنشاء منشآت، تغيير الباقات، إلخ) عند تنفيذها.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ol className="relative space-y-4">
          <span className="absolute top-1 bottom-1 right-[18px] w-px bg-white/[0.08]" aria-hidden />

          {items.map((item) => {
            const a = ACCENT[item.accent];
            const Icon = item.icon;
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
                  <div className="text-[13px] font-medium text-white leading-snug">{item.title}</div>
                  <div className="text-[12px] text-[#8ba3c7] mt-0.5">{item.detail}</div>
                  <div className="text-[11px] text-[#5f7798] mt-0.5">{item.time}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
