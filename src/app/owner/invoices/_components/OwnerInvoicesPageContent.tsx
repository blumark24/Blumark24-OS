"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  Building2,
  CreditCard,
  CalendarDays,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { fetchSubscriptionsPage, type DisplaySubscriptionFull } from "../../_lib/ownerQueries";

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] py-4 px-1">
          <div className="h-4 w-8 rounded bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  "نشطة":    "bg-[#10b981]/15 text-[#34d399]",
  "تجريبية": "bg-[#22d3ee]/15 text-[#22d3ee]",
  "متأخرة":  "bg-[#ef4444]/15 text-[#f87171]",
  "معلقة":   "bg-[#f59e0b]/15 text-[#fbbf24]",
  "ملغاة":   "bg-[#6b7280]/15 text-[#9ca3af]",
};

export default function OwnerInvoicesPageContent() {
  const [subs, setSubs] = useState<DisplaySubscriptionFull[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptionsPage();
      setSubs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeSubs = subs.filter((s) => s.statusAr === "نشطة" || s.statusAr === "تجريبية");
  const monthlyCount = subs.filter((s) => s.billingCycleAr === "شهري" && s.isActive).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <Receipt size={28} className="text-[#22d3ee]" />
            الفواتير
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            سجل الفواتير والاشتراكات المدفوعة لمنشآت العملاء — البيانات من جدول subscriptions.
            إصدار الفواتير الفعلي يتطلب ربط بوابة الدفع.
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
          title="إجمالي الاشتراكات"
          description="عدد سجلات الاشتراك الكلية المسجّلة."
          icon={Receipt}
          accent="cyan"
          value={loading ? "…" : String(subs.length)}
          hint="من جدول subscriptions"
        />
        <OwnerPlaceholderCard
          title="اشتراكات نشطة"
          description="المنشآت التي لديها اشتراك نشط أو تجريبي."
          icon={CreditCard}
          accent="green"
          value={loading ? "…" : String(activeSubs.length)}
          hint="status = active | trialing"
        />
        <OwnerPlaceholderCard
          title="اشتراكات شهرية"
          description="عدد الاشتراكات الشهرية النشطة."
          icon={Building2}
          accent="blue"
          value={loading ? "…" : String(monthlyCount)}
          hint="billing_cycle = monthly"
        />
        <OwnerPlaceholderCard
          title="إصدار الفواتير"
          description="إرسال الفواتير الرسمية للعملاء عبر البريد الإلكتروني."
          icon={FileText}
          accent="orange"
          value="غير مفعّل"
          hint="يتطلب ربط بوابة دفع"
        />
      </div>

      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-[#22d3ee]" />
            <h2 className="font-heading text-[15px] font-bold text-white">سجل الاشتراكات</h2>
          </div>
          <button
            disabled
            className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
            title="يتطلب بوابة دفع"
          >
            <Download size={13} />
            تصدير فواتير
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-2"><TableSkeleton /></div>
          ) : subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-6 py-10">
              <Receipt size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
              <p className="text-white font-medium text-[15px]">لا توجد اشتراكات مسجّلة بعد</p>
              <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-sm leading-relaxed">
                ستظهر هنا فواتير المنشآت عند تفعيل الاشتراكات من صفحة المنشآت.
              </p>
            </div>
          ) : (
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "المنشأة", "الباقة", "دورة الفوترة", "الحالة", "تاريخ البدء", "إجراء"].map((h) => (
                    <th key={h} className="px-4 sm:px-5 py-3 text-[11px] font-medium text-[#5f7798] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subs.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 sm:px-5 py-3.5 text-[#5f7798]">{idx + 1}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-white font-medium">{sub.orgName}</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-full", ACCENT.blue.chip)}>
                        {sub.planName}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-[#8ba3c7]">{sub.billingCycleAr}</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-full", STATUS_CLASS[sub.statusAr] ?? "text-white/40")}>
                        {sub.statusAr}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-[#8ba3c7] whitespace-nowrap">{sub.startedAt}</td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <button
                        disabled
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/40 cursor-not-allowed"
                        title="إصدار الفواتير — يتطلب بوابة دفع"
                      >
                        <FileText size={12} />
                        فاتورة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && subs.length > 0 && (
          <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#5f7798]">
            <span>{subs.length} سجل</span>
            <span className="border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24] px-2.5 py-1 rounded-full">
              إصدار فواتير رسمية — يتطلب ربط بوابة الدفع
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
