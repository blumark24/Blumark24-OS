"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageCircle,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plug,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { fetchOrganizationsPage, type DisplayOrgFull } from "../../_lib/ownerQueries";
import { OWNER_WHATSAPP_DISABLED } from "../../_data";

function OrgSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
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
  // whatsapp_enabled is in plan_limits; growth+ have it enabled (limit_value=1)
  const whatsappEligible = customerOrgs.filter((o) =>
    ["growth", "advanced", "enterprise"].includes(o.planSlug ?? ""),
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <MessageCircle size={28} className="text-[#10b981]" />
            واتساب بوت
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            مراقبة تفعيل واتساب بوت عبر منشآت العملاء.
            تكامل WhatsApp Business API يتطلب ربط الخدمة في مرحلة لاحقة.
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="منشآت مؤهّلة"
          description="منشآت على باقة تتضمن واتساب (growth فأعلى)."
          icon={Building2}
          accent="green"
          value={loading ? "…" : String(whatsappEligible.length)}
          hint="whatsapp_enabled = 1 في plan_limits"
        />
        <OwnerPlaceholderCard
          title="متصلة بالبوت"
          description="منشآت قامت بربط رقم واتساب بالبوت."
          icon={CheckCircle2}
          accent="cyan"
          value="—"
          hint={OWNER_WHATSAPP_DISABLED}
        />
        <OwnerPlaceholderCard
          title="رسائل اليوم"
          description="الرسائل المرسلة والواردة عبر البوت خلال اليوم الحالي."
          icon={Phone}
          accent="blue"
          value="—"
          hint="يتطلب WhatsApp Business API"
        />
        <OwnerPlaceholderCard
          title="غير مربوطة"
          description="منشآت مؤهّلة لكنها لم تفعّل البوت بعد."
          icon={XCircle}
          accent="orange"
          value="—"
          hint="بعد ربط API"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Org eligibility list */}
        <section className="glass-card overflow-hidden xl:col-span-2">
          <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <MessageCircle size={17} className="text-[#10b981]" />
            <h2 className="font-heading text-[15px] font-bold text-white">المنشآت وحالة واتساب</h2>
          </div>
          <div className="p-4 sm:p-5">
            {loading ? (
              <OrgSkeleton />
            ) : customerOrgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[180px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-8">
                <MessageCircle size={36} className="text-white/20 mb-3" strokeWidth={1.2} />
                <p className="text-[13px] text-[#8ba3c7]">لا توجد منشآت نشطة بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerOrgs.map((org) => {
                  const eligible = ["growth", "advanced", "enterprise"].includes(org.planSlug ?? "");
                  return (
                    <div
                      key={org.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#10b981,#1E6FD9)" }}
                        >
                          {org.name.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-white truncate">{org.name}</div>
                          <div className="text-[11px] text-[#5f7798]">{org.planName}</div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full flex-shrink-0",
                          eligible ? ACCENT.green.chip : ACCENT.orange.chip,
                        )}
                      >
                        {eligible ? "مؤهّلة" : "باقة محدودة"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Integration status */}
        <section className="glass-card p-5 sm:p-6">
          <h2 className="font-heading text-[15px] font-bold text-white mb-4">حالة التكامل</h2>
          <ul className="space-y-3">
            {[
              { label: "WhatsApp Business API", status: "غير مربوط", ok: false },
              { label: "رقم مُفعَّل",           status: "غير مفعّل",  ok: false },
              { label: "Webhook",               status: "غير مفعّل",  ok: false },
              { label: "حدود الباقة",           status: "من plan_limits", ok: true },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="text-[12.5px] text-[#8ba3c7]">{row.label}</span>
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border",
                    row.ok
                      ? "text-[#34d399] border-[#10b981]/30 bg-[#10b981]/10"
                      : "text-[#fbbf24] border-[#f59e0b]/30 bg-[#f59e0b]/10",
                  )}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2">
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/40 cursor-not-allowed"
            >
              <Plug size={14} />
              ربط WhatsApp API
            </button>
            <p className="text-[11px] text-[#5f7798] text-center">
              يتطلب بيانات Meta Business
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
