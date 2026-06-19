"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Building2, CheckCircle2, Phone, XCircle, RefreshCw, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { fetchOrganizationsPage, type DisplayOrgFull } from "../../_lib/ownerQueries";

const ELIGIBLE_SLUGS = ["growth", "advanced", "enterprise"];

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
          <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
          <div className="h-7 w-24 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export default function OwnerWhatsappPageContent() {
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

  const customerOrgs = orgs.filter((o) => !o.isInternal);
  const eligibleOrgs = customerOrgs.filter((o) => ELIGIBLE_SLUGS.includes(o.planSlug ?? ""));
  const notEligible = customerOrgs.filter((o) => !ELIGIBLE_SLUGS.includes(o.planSlug ?? ""));

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <MessageCircle size={28} className="text-[#22d3ee]" />
            واتساب بوت
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            إدارة تكاملات WhatsApp Business API لمنشآت العملاء — ربط الواجهة يتطلب Meta Business Account.
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
          title="إجمالي المنشآت"
          description="عدد منشآت العملاء الكلية."
          icon={Building2}
          accent="cyan"
          value={loading ? "…" : String(customerOrgs.length)}
          hint="غير الداخلية"
        />
        <OwnerPlaceholderCard
          title="مؤهلة للربط"
          description="المنشآت التي تدعم باقتها ربط WhatsApp."
          icon={CheckCircle2}
          accent="green"
          value={loading ? "…" : String(eligibleOrgs.length)}
          hint="Growth · Advanced · Enterprise"
        />
        <OwnerPlaceholderCard
          title="مربوطة بالفعل"
          description="المنشآت المتصلة فعلياً بـ WhatsApp Business API."
          icon={Phone}
          accent="blue"
          value="0"
          hint="الربط الفعلي غير مفعّل بعد"
        />
        <OwnerPlaceholderCard
          title="غير مؤهلة"
          description="المنشآت التي تتطلب ترقية الباقة للوصول."
          icon={XCircle}
          accent="orange"
          value={loading ? "…" : String(notEligible.length)}
          hint="Starter فقط"
        />
      </div>

      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageCircle size={17} className="text-[#22d3ee]" />
            <h2 className="font-heading text-[15px] font-bold text-white">المنشآت المؤهلة لربط WhatsApp</h2>
          </div>
          <button
            disabled
            className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
            title="يتطلب Meta Business Account وإعداداً تقنياً"
          >
            <Link2 size={13} />
            ربط WhatsApp API
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-2"><TableSkeleton /></div>
          ) : eligibleOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-6 py-10">
              <MessageCircle size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
              <p className="text-white font-medium text-[15px]">لا توجد منشآت مؤهلة حالياً</p>
              <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-sm leading-relaxed">
                المنشآت التي ترقّت إلى Growth أو Advanced أو Enterprise ستظهر هنا.
              </p>
            </div>
          ) : (
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "المنشأة", "الباقة", "حالة الربط", "إجراء"].map((h) => (
                    <th key={h} className="px-4 sm:px-5 py-3 text-[11px] font-medium text-[#5f7798] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {eligibleOrgs.map((org, idx) => (
                  <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 sm:px-5 py-3.5 text-[#5f7798]">{idx + 1}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-white font-medium">{org.name}</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-full", ACCENT.blue.chip)}>
                        {org.planName}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-white/40">
                        غير مربوطة
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <button
                        disabled
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/40 cursor-not-allowed"
                        title="يتطلب Meta Business Account"
                      >
                        <Phone size={12} />
                        ربط
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && eligibleOrgs.length > 0 && (
          <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#5f7798]">
            <span>{eligibleOrgs.length} منشأة مؤهلة</span>
            <span className="border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24] px-2.5 py-1 rounded-full">
              الربط الفعلي — يتطلب Meta Business Account
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
