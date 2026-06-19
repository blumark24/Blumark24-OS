"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Building2, Layers, Bot, Gauge, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { fetchOrganizationsPage, type DisplayOrgFull } from "../../_lib/ownerQueries";

const AI_INTEGRATIONS = [
  { label: "توليد الهيكل التنظيمي بالذكاء الاصطناعي", status: "مفعّل",    note: "متاح لجميع الباقات" },
  { label: "اقتراحات المناصب الوظيفية",                 status: "مفعّل",    note: "متاح لجميع الباقات" },
  { label: "تحليل بيانات الموظفين",                     status: "قريباً",   note: "يتطلب تكاملاً إضافياً" },
  { label: "التقارير الذكية التلقائية",                  status: "قريباً",   note: "Enterprise فقط" },
];

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] py-4 px-1">
          <div className="h-4 w-8 rounded bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export default function OwnerAiUsagePageContent() {
  const [orgs, setOrgs] = useState<DisplayOrgFull[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizationsPage();
      setOrgs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const aiEnabledOrgs = orgs.filter((o) => !o.isInternal);
  const enterpriseOrgs = orgs.filter((o) => o.planSlug === "enterprise" && !o.isInternal);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <Sparkles size={28} className="text-[#22d3ee]" />
            استخدام الذكاء الاصطناعي
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            مراقبة وإدارة ميزات الذكاء الاصطناعي عبر منشآت العملاء — بيانات مبنية على سجلات المنشآت والباقات.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.07] transition-colors flex-shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="منشآت مؤهلة"
          description="المنشآت النشطة التي تملك وصولاً لميزات الذكاء الاصطناعي."
          icon={Building2}
          accent="cyan"
          value={loading ? "…" : String(aiEnabledOrgs.length)}
          hint="جميع المنشآت غير الداخلية"
        />
        <OwnerPlaceholderCard
          title="منشآت Enterprise"
          description="المنشآت بباقة Enterprise — ميزات AI موسعة."
          icon={Layers}
          accent="blue"
          value={loading ? "…" : String(enterpriseOrgs.length)}
          hint="planSlug = enterprise"
        />
        <OwnerPlaceholderCard
          title="نماذج AI المفعّلة"
          description="عدد نماذج الذكاء الاصطناعي المتصلة بالمنصة."
          icon={Bot}
          accent="green"
          value="1"
          hint="GPT-4o — OpenAI"
        />
        <OwnerPlaceholderCard
          title="مراقبة الاستهلاك"
          description="تتبع تفصيلي لاستهلاك tokens لكل منشأة."
          icon={Gauge}
          accent="orange"
          value="غير مفعّل"
          hint="يتطلب تكاملاً مع OpenAI Usage API"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Org AI access list */}
        <section className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <Building2 size={17} className="text-[#22d3ee]" />
            <h2 className="font-heading text-[15px] font-bold text-white">المنشآت وميزات AI</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-5 py-2"><TableSkeleton /></div>
            ) : aiEnabledOrgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[180px] text-center px-6 py-8">
                <Building2 size={36} className="text-white/20 mb-3" strokeWidth={1.2} />
                <p className="text-white font-medium text-[14px]">لا توجد منشآت مسجّلة</p>
              </div>
            ) : (
              <table className="w-full text-right text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["#", "المنشأة", "الباقة", "AI"].map((h) => (
                      <th key={h} className="px-4 sm:px-5 py-3 text-[11px] font-medium text-[#5f7798] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {aiEnabledOrgs.map((org, idx) => {
                    const isEnterprise = org.planSlug === "enterprise";
                    return (
                      <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 sm:px-5 py-3 text-[#5f7798]">{idx + 1}</td>
                        <td className="px-4 sm:px-5 py-3 text-white font-medium">{org.name}</td>
                        <td className="px-4 sm:px-5 py-3">
                          <span className={cn("text-[11px] px-2.5 py-1 rounded-full", isEnterprise ? ACCENT.green.chip : ACCENT.blue.chip)}>
                            {org.planName}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <CheckCircle2 size={15} className="text-[#34d399]" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!loading && aiEnabledOrgs.length > 0 && (
            <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06] text-[11px] text-[#5f7798]">
              {aiEnabledOrgs.length} منشأة مؤهلة لميزات AI
            </div>
          )}
        </section>

        {/* AI integrations */}
        <section className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <Bot size={17} className="text-[#22d3ee]" />
            <h2 className="font-heading text-[15px] font-bold text-white">حالة تكاملات AI</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {AI_INTEGRATIONS.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-white font-medium truncate">{item.label}</p>
                  <p className="text-[11px] text-[#5f7798] mt-0.5">{item.note}</p>
                </div>
                <span className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full flex-shrink-0",
                  item.status === "مفعّل" ? "bg-[#10b981]/15 text-[#34d399]" : "bg-white/[0.06] text-white/40"
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06]">
            <button
              disabled
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
              title="يتطلب إعداداً تقنياً"
            >
              <Sparkles size={13} />
              إضافة تكامل AI
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
