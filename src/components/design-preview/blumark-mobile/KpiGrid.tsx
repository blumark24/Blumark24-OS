import { Users, Wallet, TrendingUp, User2, MoreVertical } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Trend = "up" | "down";

interface KpiCardProps {
  label: string;
  value: string;
  trend: Trend;
  trendText: string;
  caption: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function KpiCard({ label, value, trend, trendText, caption, Icon }: KpiCardProps) {
  const trendColor = trend === "up" ? "#10B981" : "#EF4444";
  return (
    <div
      className="relative rounded-2xl p-3 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.78) 0%, rgba(7,20,38,0.78) 100%)",
        border: "1px solid rgba(125, 220, 255, 0.18)",
        boxShadow:
          "0 6px 22px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <span
        aria-hidden
        className="absolute -top-6 -left-6 h-16 w-16 rounded-full opacity-50 blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(0,217,255,0.30), transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between mb-2">
        <div
          className="grid place-items-center h-9 w-9 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))",
            border: "1px solid rgba(125, 220, 255, 0.30)",
          }}
        >
          <Icon className="h-4 w-4 text-cyan-200" />
        </div>
        <div className="flex flex-col items-end">
          <button
            type="button"
            aria-label="خيارات"
            className="text-slate-500 hover:text-cyan-300 transition"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          <span
            className="text-[10px] mt-1 font-medium"
            style={{ color: "#94A3B8" }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          className="text-[20px] font-extrabold tracking-tight leading-none mb-1"
          style={{
            color: "#F8FAFC",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px]"
            style={{ color: "#94A3B8" }}
          >
            {caption}
          </span>
          <span
            className="text-[10px] font-bold flex items-center gap-0.5"
            style={{ color: trendColor }}
          >
            {trendText}
            <span aria-hidden>{trend === "up" ? "↑" : "↓"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard
        label="العملاء"
        value="2,847"
        trend="up"
        trendText="+18.6%"
        caption="من الشهر الماضي"
        Icon={Users}
      />
      <KpiCard
        label="المهام"
        value="156"
        trend="up"
        trendText="+12.4%"
        caption="مكتملة هذا الشهر"
        Icon={Wallet}
      />
      <KpiCard
        label="الإيرادات"
        value="8,745,230"
        trend="up"
        trendText="+24.3%"
        caption="من الشهر الماضي"
        Icon={TrendingUp}
      />
      <KpiCard
        label="الموظفون"
        value="156"
        trend="up"
        trendText="+8"
        caption="منضم جديد"
        Icon={User2}
      />
    </div>
  );
}
