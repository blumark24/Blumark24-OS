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
import { fetchOwnerAuditLogs, type OwnerAuditEntry } from "../_lib/ownerQueries";
import { OWNER_EMAILS } from "@/lib/owner";
import OwnerComingSoonBanner from "./OwnerComingSoonBanner";
import OwnerPlaceholderCard from "./OwnerPlaceholderCard";

export default function OwnerSecurityPageContent() {
  const [logs, setLogs] = useState<OwnerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerAuditLogs(25)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <ShieldCheck size={28} className="text-[#10b981]" />
          الأمان والتدقيق
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          مراقبة وصول مالك المنصة وسجل التدقيق من جدول owner_audit_logs.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="وصول المالك"
          description="حسابات المالك المسموح لها بدخول /owner."
          icon={ShieldHalf}
          accent="purple"
          value={String(OWNER_EMAILS.length)}
          hint="من src/lib/owner.ts"
        />
        <OwnerPlaceholderCard
          title="سجل التدقيق"
          description="إجراءات المالك المسجّلة في قاعدة البيانات."
          icon={ScrollText}
          accent="cyan"
          value={loading ? "…" : String(logs.length)}
          hint="owner_audit_logs"
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

          {loading && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6">
              <Lock size={40} className="text-white/20 mb-4" strokeWidth={1.2} />
              <p className="text-white font-medium text-[15px]">لا توجد أحداث بعد</p>
              <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-md leading-relaxed">
                ستظهر هنا عمليات المالك (إنشاء منشأة، تغيير باقة، إلخ) عند تنفيذها.
              </p>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm border-collapse">
                <thead>
                  <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
                    <th className="font-medium pb-3 pr-1">الإجراء</th>
                    <th className="font-medium pb-3">المالك</th>
                    <th className="font-medium pb-3">النوع</th>
                    <th className="font-medium pb-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/[0.04]">
                      <td className="py-3 pr-1 text-white">{log.detail}</td>
                      <td className="py-3 text-[#8ba3c7]">{log.ownerEmail}</td>
                      <td className="py-3 text-[#8ba3c7]">{log.targetType}</td>
                      <td className="py-3 text-[#8ba3c7] tabular-nums">{log.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <OwnerComingSoonBanner
          title="تنبيهات الأمان"
          description="مراقبة محاولات الدخول الفاشلة وإشعارات الجلسات — مخطط للمرحلة التالية."
        />
      </div>
    </div>
  );
}
