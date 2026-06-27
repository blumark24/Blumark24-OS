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
    <div className="relative p-3 overflow-hidden bm-glass">
      <span
        aria-hidden
        className="absolute -top-8 -left-8 h-20 w-20 rounded-full opacity-40 blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(0,217,255,0.40), transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between mb-2">
        <div
          className="grid place-items-center h-9 w-9 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))",
            border: "1px solid rgba(125, 220, 255, 0.32)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <Icon className="h-4 w-4" style={{ color: "#7DDCFF" }} />
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
            className="text-[10.5px] mt-1 font-medium"
            style={{ color: "#B6C9E0" }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          className="text-[20px] font-extrabold tracking-tight leading-none mb-1.5"
          style={{
            color: "#F8FAFC",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px]" style={{ color: "#94A3B8" }}>
            {caption}
          </span>
          <span
            className="text-[10px] font-bold flex items-center gap-0.5"
            style={{ color: trendColor, fontVariantNumeric: "tabular-nums" }}
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
