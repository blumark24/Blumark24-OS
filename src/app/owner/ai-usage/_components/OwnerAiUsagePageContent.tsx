"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Building2,
  Layers,
  Bot,
  RefreshCw,
  BarChart3,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { fetchOrganizationsPage, type DisplayOrgFull } from "../../_lib/ownerQueries";
import { OWNER_AI_TRACKING_DISABLED } from "../../_data";

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
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
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

  const enterpriseOrgs = orgs.filter((o) => o.planSlug === "enterprise" && !o.isInternal);
  const aiEnabledOrgs = orgs.filter((o) => !o.isInternal);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <Sparkles size={28} className="text-[#a855f7]" />
            استخدام الذكاء الاصطناعي
          </h1>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
            مراقبة استهلاك ميزة الذكاء الاصطناعي عبر منشآت العملاء حسب مستوى الباقة.
            أرقام الاستهلاك الفعلي تتطلب ربط جداول usage في مرحلة لاحقة.
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
          title="منشآت لديها ذكاء اصطناعي"
          description="المنشآت الفعّالة التي يمكنها الوصول لميزة /ai حسب الباقة."
          icon={Building2}
          accent="purple"
          value={loading ? "…" : String(aiEnabledOrgs.length)}
          hint="enterprise = ai_level 3"
        />
        <OwnerPlaceholderCard
          title="باقة Enterprise"
          description="منشآت على الباقة المؤسسية التي تتضمن الذكاء الاصطناعي كاملاً."
          icon={Layers}
          accent="cyan"
          value={loading ? "…" : String(enterpriseOrgs.length)}
          hint="ai_level = 3 من plan_limits"
        />
        <OwnerPlaceholderCard
          title="طلبات هذا الشهر"
          description="عدد استدعاءات نماذج الذكاء الاصطناعي عبر جميع المنشآت."
          icon={Bot}
          accent="blue"
          value="—"
          hint={OWNER_AI_TRACKING_DISABLED}
        />
        <OwnerPlaceholderCard
          title="تجاوز الحد"
          description="منشآت تجاوزت حد استخدام الذكاء الاصطناعي المحدد في الباقة."
          icon={Gauge}
          accent="orange"
          value="—"
          hint="تتبع الاستخدام — غير مفعّل بعد"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Orgs table */}
        <section className="glass-card overflow-hidden xl:col-span-2">
          <div className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <BarChart3 size={17} className="text-[#a855f7]" />
            <h2 className="font-heading text-[15px] font-bold text-white">المنشآت وإمكانية الذكاء الاصطناعي</h2>
          </div>
          <div className="p-4 sm:p-5">
            {loading ? (
              <OrgSkeleton />
            ) : aiEnabledOrgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[180px] text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-8">
                <Sparkles size={36} className="text-white/20 mb-3" strokeWidth={1.2} />
                <p className="text-[13px] text-[#8ba3c7]">لا توجد منشآت نشطة بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {aiEnabledOrgs.map((org) => {
                  const isEnterprise = org.planSlug === "enterprise";
                  return (
                    <div
                      key={org.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#a855f7,#1E6FD9)" }}
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
                          isEnterprise ? ACCENT.purple.chip : ACCENT.cyan.chip,
                        )}
                      >
                        {isEnterprise ? "ai_level 3" : "محدود"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Status panel */}
        <section className="glass-card p-5 sm:p-6">
          <h2 className="font-heading text-[15px] font-bold text-white mb-4">حالة التكاملات</h2>
          <ul className="space-y-3">
            {[
              { label: "نماذج Claude API",    status: "غير مربوط",     ok: false },
              { label: "تتبع الرسائل",         status: "غير مفعّل",     ok: false },
              { label: "حدود الاستخدام",       status: "من plan_limits", ok: true  },
              { label: "تنبيهات التجاوز",      status: "غير مفعّل",     ok: false },
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

          <div className="mt-5 rounded-xl border border-dashed border-[#a855f7]/25 bg-[#a855f7]/[0.05] p-4 text-center">
            <Sparkles size={22} className="text-[#c084fc] mx-auto mb-2" strokeWidth={1.4} />
            <p className="text-[12px] text-[#c8b6e8] leading-relaxed">
              ربط استهلاك الذكاء الاصطناعي يتطلب جدول ai_usage أو middleware لوسم الطلبات بـ organization_id.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
