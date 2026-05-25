"use client";

import { useEffect, useState } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import {
  AI_TRACKING_DISABLED_MSG,
  AI_TRACKING_EMPTY_MSG,
  fetchAiUsageTruthState,
  type AiUsageTruthState,
} from "../_lib/ownerTruthQueries";

export default function AiUsageCard() {
  const [state, setState] = useState<AiUsageTruthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAiUsageTruthState()
      .then((result) => {
        if (active) setState(result);
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
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a855f7]/14 text-[#c084fc]">
          <Sparkles size={17} />
        </span>
        <h2 className="font-heading text-lg font-bold text-white">استخدام الذكاء الاصطناعي</h2>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 h-[88px]" />
          ))}
        </div>
      )}

      {!loading && state && !state.trackingEnabled && (
        <div className="flex flex-col items-center justify-center min-h-[180px] text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
          <Sparkles size={28} className="text-[#c084fc]/40 mb-3" strokeWidth={1.4} />
          <p className="text-[14px] font-medium text-white">{AI_TRACKING_DISABLED_MSG}</p>
          <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-xs leading-relaxed">
            سيظهر الاستخدام الفعلي بعد تفعيل سجل الطلبات في مرحلة لاحقة.
          </p>
        </div>
      )}

      {!loading && state?.trackingEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 col-span-2">
            <MessageSquare size={16} className="text-[#c084fc] mb-2" />
            <div className="font-heading text-lg font-bold text-white tabular-nums">
              {state.totalRequests ?? "—"}
            </div>
            <div className="text-[11.5px] text-[#8ba3c7] mt-0.5">إجمالي الطلبات المسجّلة</div>
          </div>
          {(state.totalRequests ?? 0) === 0 && (
            <p className="col-span-2 text-center text-[12px] text-[#8ba3c7] py-2">
              {AI_TRACKING_EMPTY_MSG}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
