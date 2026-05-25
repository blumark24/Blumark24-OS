"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  KeyRound,
  ShieldHalf,
  Lock,
} from "lucide-react";
import { ACCENT } from "../_accent";
import OwnerComingSoonBanner from "./OwnerComingSoonBanner";
import OwnerPlaceholderCard from "./OwnerPlaceholderCard";
import { OWNER_ACTIVITY_EMPTY } from "../_data";
import {
  fetchOwnerAuditLogCount,
  fetchOwnerAuditTimeline,
  type OwnerAuditEntry,
} from "../_lib/ownerTruthQueries";
import { OWNER_EMAILS } from "@/lib/owner";
import { cn } from "@/lib/utils";

export default function OwnerSecurityPageContent() {
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [auditItems, setAuditItems] = useState<OwnerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([fetchOwnerAuditLogCount(), fetchOwnerAuditTimeline(10)])
      .then(([count, items]) => {
        if (!active) return;
        setAuditCount(count);
        setAuditItems(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const auditDisplay =
    loading ? "…" : auditCount === null ? "—" : String(auditCount);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <ShieldCheck size={28} className="text-[#10b981]" />
          الأمان والتدقيق
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          مراقبة وصول مالك المنصة وسجل التدقيق — بيانات حقيقية من owner_audit_logs.
        </p>
      </header>

      <OwnerComingSoonBanner
        title="مركز الأمان — قراءة فقط"
        description="تُعرض هنا سجلات التدقيق المسجّلة فعلياً. لا تُنشأ تنبيهات مشبوهة وهمية."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="وصول المالك"
          description="حسابات المالك المسموح لها بدخول /owner."
          icon={ShieldHalf}
          accent="purple"
          value={String(OWNER_EMAILS.length)}
          hint="قائمة ثابتة في التطبيق"
        />
        <OwnerPlaceholderCard
          title="سجل التدقيق"
          description="إجراءات المالك: إنشاء منشأة، تغيير باقة، إعادة كلمة مرور."
          icon={ScrollText}
          accent="cyan"
          value={auditDisplay}
          hint="من جدول owner_audit_logs"
        />
        <OwnerPlaceholderCard
          title="نشاط مشبوه"
          description="محاولات دخول فاشلة أو أنماط غير اعتيادية."
          icon={AlertTriangle}
          accent="orange"
          value="—"
          hint="مراقبة التنبيهات — غير مفعّلة بعد"
        />
        <OwnerPlaceholderCard
          title="فحص الجلسات"
          description="جلسات Supabase النشطة وانتهاء الصلاحية."
          icon={KeyRound}
          accent="green"
          value="—"
          hint="مراقبة الجلسات — غير مفعّلة بعد"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="glass-card p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <ScrollText size={18} className="text-[#22d3ee]" />
            <h2 className="font-heading text-lg font-bold text-white">آخر أحداث التدقيق</h2>
          </div>

          {loading && (
            <div className="space-y-4 animate-pulse min-h-[220px]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/[0.06] flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                    <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && auditItems.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6">
              <Lock size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
              <p className="text-white font-medium text-[15px]">{OWNER_ACTIVITY_EMPTY}</p>
              <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-md leading-relaxed">
                تُسجَّل هنا عمليات المالك عند تنفيذها من صفحة المنشآت.
              </p>
            </div>
          )}

          {!loading && auditItems.length > 0 && (
            <ol className="relative space-y-4">
              <span className="absolute top-1 bottom-1 right-[18px] w-px bg-white/[0.08]" aria-hidden />
              {auditItems.map((item) => {
                const a = ACCENT[item.accent];
                const Icon = item.icon;
                return (
                  <li key={item.id} className="relative flex gap-3 pr-0">
                    <span
                      className={cn(
                        "relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border",
                        a.iconBg,
                        a.border,
                      )}
                    >
                      <Icon size={15} className={a.text} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-[13px] font-medium text-white leading-snug">{item.title}</div>
                      <div className="text-[12px] text-[#8ba3c7] mt-0.5">{item.detail}</div>
                      <div className="text-[11px] text-[#5f7798] mt-0.5">{item.time}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="glass-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold text-white mb-4">حالة الحماية</h2>
          <ul className="space-y-3">
            {[
              { label: "عزل المستأجر (RLS)", status: "مفعّل في SQL", ok: true },
              { label: "حماية /api/ai/chat", status: "مفعّل", ok: true },
              {
                label: "سجل تدقيق حي",
                status: auditCount !== null && auditCount > 0 ? "مسجّل" : "فارغ",
                ok: auditCount !== null && auditCount > 0,
              },
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
