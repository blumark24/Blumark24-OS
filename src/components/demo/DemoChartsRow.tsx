"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEMO_SALES, DEMO_USERS } from "@/data/demo-dashboard";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "rgba(8,18,37,0.95)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
  padding: "8px 10px",
  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.5)",
};

const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  marginBottom: "4px",
  fontSize: "11px",
};

const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: "#22D3EE",
  fontSize: "12px",
};

const TICK_STYLE = { fill: "rgba(255,255,255,0.55)", fontSize: 11 };

function SalesChart() {
  const formatK = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}K`;

  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-4 sm:p-5 min-w-0 transition-all duration-300 hover:border-white/[0.16]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] sm:text-[14px] font-semibold text-white">نظرة عامة على النمو</div>
        <div className="text-[11px] text-white/55">آخر 12 شهر</div>
      </div>
      <div className="w-full h-[180px] sm:h-[200px] lg:h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DEMO_SALES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="salesPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickMargin={6}
            />
            <YAxis
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatK}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              cursor={{ stroke: "rgba(34,211,238,0.25)", strokeWidth: 1 }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString("en-US")} SAR`,
                name === "current" ? "2026" : "2025",
              ]}
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#salesPrev)"
              dot={false}
              activeDot={false}
              name="previous"
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#22D3EE"
              strokeWidth={2.4}
              fill="url(#salesArea)"
              dot={false}
              activeDot={{ r: 5, fill: "#22D3EE", stroke: "#0A1628", strokeWidth: 2 }}
              name="current"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center gap-3 justify-end text-[10.5px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-[#22D3EE]" /> 2026
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-white/30" /> 2025
        </span>
      </div>
    </div>
  );
}

function UsersChart() {
  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-4 sm:p-5 min-w-0 transition-all duration-300 hover:border-white/[0.16]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] sm:text-[14px] font-semibold text-white">المستخدمون النشطون</div>
        <div className="text-[11px] text-white/55">آخر 30 يوم</div>
      </div>
      <div className="w-full h-[180px] sm:h-[200px] lg:h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEMO_USERS} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="usersBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#1E6FD9" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} tickMargin={6} />
            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              cursor={{ fill: "rgba(34,211,238,0.05)" }}
              formatter={(value: number) => [`${value.toLocaleString("ar-EG")} مستخدم`, "نشطون"]}
            />
            <Bar dataKey="users" fill="url(#usersBar)" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DemoChartsRow() {
  // RTL DOM: first child = visual right.
  // Image: Sales chart visual LEFT, Users chart visual RIGHT.
  // So DOM order: Users first, Sales second.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-3 sm:gap-4 min-w-0">
      <UsersChart />
      <SalesChart />
    </div>
  );
}
