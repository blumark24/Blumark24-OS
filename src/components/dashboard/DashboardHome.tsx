"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import { CheckCircle2, Users, AlertTriangle, ListTodo, Smile } from "lucide-react";

const KPI_ITEMS = [
  { label: "المهام المكتملة", value: "0%", icon: CheckCircle2, color: "#22d3ee" },
  { label: "العملاء النشطون", value: "0", icon: Users, color: "#10b981" },
  { label: "المهام المتأخرة", value: "0", icon: AlertTriangle, color: "#f59e0b" },
  { label: "المهام المتبقية", value: "3", icon: ListTodo, color: "#1e6fd9" },
];

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="space-y-6 overflow-x-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#8ba3c7] text-xs mb-2">{item.label}</p>
                    <p className="text-2xl font-heading font-bold text-white">{item.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}22` }}>
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 glass-card p-6 relative overflow-hidden min-h-[220px]">
            <JellyfishBackground />
            <div className="relative z-10">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                مرحباً <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">Blumark24 CEO</span>
              </h2>
              <p className="text-[#8ba3c7] text-sm mb-2">مدير أعلى</p>
              <p className="text-[#8ba3c7] text-sm mb-5">اليوم هو 16 مايو 2026</p>
              <p className="text-white/90">نحو إنجازات أكبر وأداء أفضل</p>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
            <div className="w-14 h-14 rounded-full bg-[#22d3ee1f] flex items-center justify-center mb-3">
              <Smile size={26} className="text-[#22d3ee]" />
            </div>
            <h3 className="text-white font-heading font-semibold mb-2">معدل رضا العملاء</h3>
            <p className="text-3xl font-heading font-bold text-[#22d3ee]">0%</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
