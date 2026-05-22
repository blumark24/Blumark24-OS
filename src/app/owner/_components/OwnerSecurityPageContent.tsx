import {
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  KeyRound,
  ShieldHalf,
  Lock,
} from "lucide-react";
import OwnerComingSoonBanner from "./OwnerComingSoonBanner";
import OwnerPlaceholderCard from "./OwnerPlaceholderCard";

export default function OwnerSecurityPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <ShieldCheck size={28} className="text-[#10b981]" />
          الأمان والتدقيق
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          مراقبة وصول مالك المنصة، سجل التدقيق، والنشاط المشبوه — واجهة جاهزة لربط سجلات التدقيق
          لاحقاً.
        </p>
      </header>

      <OwnerComingSoonBanner
        title="مركز الأمان — معاينة"
        description="لا تُقرأ سجلات التدقيق من قاعدة البيانات في هذه المرحلة. البطاقات توضّح التخطيط فقط قبل تفعيل المراقبة الحية."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="وصول المالك"
          description="حسابات المالك المسموح لها بدخول /owner."
          icon={ShieldHalf}
          accent="purple"
          value="2"
          hint="قائمة ثابتة في التطبيق حالياً"
        />
        <OwnerPlaceholderCard
          title="سجل التدقيق"
          description="إجراءات المالك: إنشاء منشأة، تغيير باقة، إعادة كلمة مرور."
          icon={ScrollText}
          accent="cyan"
          value="—"
          hint="جدول owner_audit_logs — قريباً"
        />
        <OwnerPlaceholderCard
          title="نشاط مشبوه"
          description="محاولات دخول فاشلة أو أنماط غير اعتيادية."
          icon={AlertTriangle}
          accent="orange"
          value="0"
          hint="تنبيهات — قريباً"
        />
        <OwnerPlaceholderCard
          title="فحص الجلسات"
          description="جلسات Supabase النشطة وانتهاء الصلاحية."
          icon={KeyRound}
          accent="green"
          value="—"
          hint="مراقبة الجلسات — قريباً"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="glass-card p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <ScrollText size={18} className="text-[#22d3ee]" />
            <h2 className="font-heading text-lg font-bold text-white">آخر أحداث التدقيق</h2>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[220px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6">
            <Lock size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
            <p className="text-white font-medium text-[15px]">لا توجد أحداث معروضة بعد</p>
            <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-md leading-relaxed">
              عند الربط ستُسجَّل هنا عمليات المالك مع الطابع الزمني، نوع الهدف، والبيانات
              الوصفية.
            </p>
            <span className="mt-4 inline-flex rounded-full bg-[#10b981]/10 border border-[#10b981]/25 px-3 py-1 text-[11px] text-[#34d399]">
              قراءة فقط — بدون استعلامات
            </span>
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-white mb-4">حالة الحماية</h2>
          <ul className="space-y-3">
            {[
              { label: "عزل المستأجر (RLS)", status: "مفعّل في SQL", ok: true },
              { label: "حماية /api/ai/chat", status: "مفعّل", ok: true },
              { label: "سجل تدقيق حي", status: "قريباً", ok: false },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="text-[12.5px] text-[#8ba3c7]">{item.label}</span>
                <span
                  className={
                    item.ok
                      ? "text-[11px] text-[#34d399] border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 rounded-full"
                      : "text-[11px] text-[#fbbf24] border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 rounded-full"
                  }
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
