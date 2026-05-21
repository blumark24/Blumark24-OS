"use client";

import { ShieldCheck, Activity, HardDrive, Users } from "lucide-react";
import { SYSTEM_STATUS } from "../_data";

export default function SystemStatusFooter() {
  const storagePct = Math.round((SYSTEM_STATUS.storageUsedTb / SYSTEM_STATUS.storageTotalTb) * 100);

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Headline */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/14 text-[#34d399] shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="text-[14px] font-semibold text-white">{SYSTEM_STATUS.headline}</div>
            <div className="text-[11.5px] text-[#8ba3c7]">آخر فحص: قبل لحظات</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 lg:flex-1 lg:max-w-2xl">
          {/* Uptime */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <Activity size={16} className="text-[#22d3ee] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white tabular-nums">{SYSTEM_STATUS.uptime}</div>
              <div className="text-[11px] text-[#8ba3c7]">وقت التشغيل</div>
            </div>
          </div>

          {/* Storage */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <HardDrive size={16} className="text-[#5b9bf0] flex-shrink-0" />
              <div className="text-[12px] text-white tabular-nums">
                {SYSTEM_STATUS.storageUsedTb} TB
                <span className="text-[#8ba3c7]"> / {SYSTEM_STATUS.storageTotalTb} TB</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-l from-[#22d3ee] to-[#1e6fd9]" style={{ width: `${storagePct}%` }} />
            </div>
          </div>

          {/* Active users */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <Users size={16} className="text-[#34d399] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white tabular-nums">{SYSTEM_STATUS.activeUsers}</div>
              <div className="text-[11px] text-[#8ba3c7]">المستخدمون النشطون الآن</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
