"use client";

import { formatCurrency } from "@/lib/utils";
import type { CrmSnapshot } from "@/lib/crm/types";
import type { Client } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  snapshot: CrmSnapshot;
  clients: Client[];
}

export default function CrmRevenueTab({ snapshot, clients }: Props) {
  const total = snapshot.revenue.reduce((s, r) => s + Number(r.amount), 0);
  const pipelineValue = snapshot.deals
    .filter((d) => {
      const st = snapshot.stages.find((s) => s.id === d.stage_id);
      return st && !st.is_closed_lost;
    })
    .reduce((s, d) => s + Number(d.value), 0);
  const wonValue = snapshot.revenue
    .filter((r) => r.event_type === "deal_won")
    .reduce((s, r) => s + Number(r.amount), 0);
  const contractValue = snapshot.contracts
    .filter((c) => c.status === "نشط")
    .reduce((s, c) => s + Number(c.contract_value), 0);

  const byMonth = new Map<string, number>();
  snapshot.revenue.forEach((r) => {
    const key = r.recorded_at?.slice(0, 7) ?? "غير محدد";
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r.amount));
  });
  const chartData = Array.from(byMonth.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الإيرادات", value: total, color: "#22d3ee" },
          { label: "قيمة الأنبوب", value: pipelineValue, color: "#f59e0b" },
          { label: "صفقات رابحة", value: wonValue, color: "#10b981" },
          { label: "عقود نشطة", value: contractValue, color: "#a855f7" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="text-[#8ba3c7] text-xs">{label}</div>
            <div className="text-xl font-bold mt-1" style={{ color }}>
              {formatCurrency(value)} SAR
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-white text-sm font-medium mb-3">الإيرادات الشهرية</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
              <XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8 }}
                formatter={(v: number) => `${formatCurrency(v)} SAR`}
              />
              <Bar dataKey="amount" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e3a5f]">
              {["التاريخ", "العميل", "النوع", "المبلغ", "ملاحظات"].map((h) => (
                <th key={h} className="text-right text-[#8ba3c7] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.revenue.map((r) => (
              <tr key={r.id} className="border-b border-[#1e3a5f]/40">
                <td className="px-4 py-2 text-[#8ba3c7]">{r.recorded_at}</td>
                <td className="px-4 py-2 text-white">{clientMap.get(r.client_id) ?? "—"}</td>
                <td className="px-4 py-2 text-[#8ba3c7]">{r.event_type}</td>
                <td className="px-4 py-2 text-[#22d3ee] font-bold">{formatCurrency(r.amount)}</td>
                <td className="px-4 py-2 text-[#8ba3c7] text-xs">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {snapshot.revenue.length === 0 && (
          <p className="text-center text-[#8ba3c7] text-sm py-8">لا توجد إيرادات مسجّلة بعد</p>
        )}
      </div>
    </div>
  );
}
