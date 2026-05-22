import {
  Sparkles,
  MessageCircle,
  Building2,
  Gauge,
  BarChart3,
  Bot,
} from "lucide-react";
import OwnerComingSoonBanner from "./OwnerComingSoonBanner";
import OwnerPlaceholderCard from "./OwnerPlaceholderCard";

export default function OwnerUsagePageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <BarChart3 size={28} className="text-[#a855f7]" />
          الاستخدام والحدود
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          متابعة استهلاك الذكاء الاصطناعي وواتساب بوت عبر المنشآت، مع حدود الباقات — واجهة معاينة
          بدون اتصال بقاعدة البيانات.
        </p>
      </header>

      <OwnerComingSoonBanner
        title="لوحة الاستخدام — معاينة"
        description="البطاقات أدناه توضّح شكل المراقبة فقط. لن تُجلب أرقام حقيقية ولن تُرسل طلبات API حتى ربط جداول usage في مرحلة لاحقة."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="طلبات الذكاء الاصطناعي"
          description="عدد رسائل المساعد واستدعاءات النماذج هذا الشهر."
          icon={Sparkles}
          accent="purple"
          value="—"
          hint="تتبع حسب المنشأة — قريباً"
        />
        <OwnerPlaceholderCard
          title="رسائل واتساب بوت"
          description="الرسائل المرسلة والواردة عبر البوت لكل منشأة."
          icon={MessageCircle}
          accent="green"
          value="—"
          hint="تكامل واتساب — قريباً"
        />
        <OwnerPlaceholderCard
          title="المنشآت النشطة"
          description="منشآت لديها استهلاك مسجّل في الفترة الحالية."
          icon={Building2}
          accent="cyan"
          value="—"
          hint="من جدول organizations لاحقاً"
        />
        <OwnerPlaceholderCard
          title="حدود الاستخدام"
          description="مقارنة الاستهلاك الفعلي بحدود الباقة (ai_level، whatsapp_enabled)."
          icon={Gauge}
          accent="orange"
          value="—"
          hint="من plan_limits لاحقاً"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bot size={18} className="text-[#c084fc]" />
            <h2 className="font-heading text-lg font-bold text-white">تفصيل الذكاء الاصطناعي</h2>
          </div>
          <div className="space-y-3">
            {[
              "محادثات المساعد (/ai)",
              "تقارير مُولَّدة تلقائياً",
              "استدعاءات API (Claude)",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
              >
                <span className="text-[13px] text-[#8ba3c7]">{label}</span>
                <span className="text-[12px] text-[#5f7798]">قريباً</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageCircle size={18} className="text-[#34d399]" />
            <h2 className="font-heading text-lg font-bold text-white">تفصيل واتساب</h2>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[180px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4">
            <MessageCircle size={36} className="text-white/20 mb-3" />
            <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-xs">
              سيُعرض هنا حجم الرسائل، معدل الرد، والمنشآت التي تجاوزت حد الباقة.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
