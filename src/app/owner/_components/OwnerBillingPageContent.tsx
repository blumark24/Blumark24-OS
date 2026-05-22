import {
  Receipt,
  Wallet,
  CalendarClock,
  FileText,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import OwnerComingSoonBanner from "./OwnerComingSoonBanner";
import OwnerPlaceholderCard from "./OwnerPlaceholderCard";

export default function OwnerBillingPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <Receipt size={28} className="text-[#22d3ee]" />
          الفواتير والفوترة
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          نظرة عامة على فوترة المنصة، الاشتراكات الشهرية (MRR)، ودورات الفوترة — جاهزة للربط مع نظام
          الدفع لاحقاً.
        </p>
      </header>

      <OwnerComingSoonBanner
        title="مركز الفوترة قيد الإعداد"
        description="هذه الصفحة تعرض هيكل لوحة الفوترة فقط. لن تُنشأ فواتير حقيقية ولن تُنفَّذ عمليات دفع حتى ربط بوابة الدفع وجداول الفوترة في مرحلة لاحقة."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="الإيراد الشهري المتكرر (MRR)"
          description="مجموع الاشتراكات النشطة بعد خصم الملغاة."
          icon={TrendingUp}
          accent="green"
          value="—"
          hint="يُحسب من الاشتراكات لاحقاً"
        />
        <OwnerPlaceholderCard
          title="فواتير قيد الإصدار"
          description="فواتير الشهر الحالي قبل الإرسال للعملاء."
          icon={FileText}
          accent="blue"
          value="0"
          hint="معاينة واجهة"
        />
        <OwnerPlaceholderCard
          title="دورات الفوترة"
          description="شهري، سنوي، وداخلي للمنشآت الداخلية."
          icon={CalendarClock}
          accent="cyan"
          value="3"
          hint="أنواع الدورات المعرفة في النظام"
        />
        <OwnerPlaceholderCard
          title="مدفوعات معلّقة"
          description="اشتراكات متأخرة أو بحاجة متابعة."
          icon={CircleDollarSign}
          accent="orange"
          value="—"
          hint="تنبيهات الدفع — قريباً"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="glass-card p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Wallet size={18} className="text-[#1e6fd9]" />
              فواتير المنصة القادمة
            </h2>
            <span className="text-[11px] text-[#5f7798] border border-white/[0.08] rounded-lg px-2 py-1">
              قراءة فقط
            </span>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[220px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6">
            <Receipt size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
            <p className="text-white font-medium text-[15px]">لا توجد فواتير صادرة بعد</p>
            <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-md leading-relaxed">
              عند تفعيل الفوترة ستظهر هنا فواتير كل منشأة مع حالة الدفع، تاريخ الاستحقاق، والباقة
              المرتبطة.
            </p>
            <span className="mt-4 inline-flex rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/25 px-3 py-1 text-[11px] text-[#22d3ee]">
              جاهزة للربط لاحقاً
            </span>
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-white mb-4">ملخص الدورة</h2>
          <ul className="space-y-3 text-[13px]">
            {[
              { label: "بداية الدورة", value: "—" },
              { label: "نهاية الدورة", value: "—" },
              { label: "عملة الفوترة", value: "SAR" },
              { label: "حالة التزامن", value: "غير مفعّل" },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0"
              >
                <span className="text-[#8ba3c7]">{row.label}</span>
                <span className="text-white font-medium tabular-nums">{row.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
