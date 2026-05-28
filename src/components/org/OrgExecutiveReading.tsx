"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Compass,
  Map,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { LeadershipStudioPreview } from "@/lib/org/buildLeadershipStudio";
import {
  EXECUTIVE_PLAN_HELPER_AR,
  EXECUTIVE_PLAN_TITLE_AR,
  EXECUTIVE_TOOLS_CTA_AR,
  buildExecutiveReading,
  type HealingPriorityCard,
  type PriorityLevel,
} from "@/lib/org/buildExecutiveReading";

function riskBadgeClass(level: "low" | "medium" | "high"): string {
  if (level === "high") return "border-red-400/35 text-red-200 bg-red-500/10";
  if (level === "medium") return "border-amber-400/35 text-amber-200 bg-amber-500/10";
  return "border-cyan-400/30 text-cyan-200 bg-cyan-500/10";
}

function priorityBadgeClass(level: PriorityLevel): string {
  if (level === "عالية") return "border-red-400/30 bg-red-500/12 text-red-100";
  if (level === "متوسطة") return "border-amber-400/30 bg-amber-500/12 text-amber-100";
  return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
}

function ReadinessRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0" aria-hidden>
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgba(30,58,95,0.8)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="url(#execReadinessGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="execReadinessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

function PriorityCard({ card }: { card: HealingPriorityCard }) {
  return (
    <div className="rounded-xl border border-[#1e3a5f]/70 bg-white/[0.03] p-2.5 sm:p-3 space-y-2 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-[11px] font-bold">{card.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
            priorityBadgeClass(card.priority),
          )}
        >
          {card.priority}
        </span>
      </div>
      <p className="text-[#8ba3c7] text-[10px] leading-relaxed break-words">{card.reason}</p>
      <p className="text-[#6b87ab] text-[10px] leading-relaxed break-words">
        <span className="text-emerald-300/90">الفائدة: </span>
        {card.benefit}
      </p>
      <p className="text-[#22d3ee] text-[10px]">أداة مقترحة: {card.suggestedTool}</p>
      <p className="text-[#6b87ab] text-[10px] italic pt-0.5">{EXECUTIVE_TOOLS_CTA_AR}</p>
    </div>
  );
}

const panelClass =
  "rounded-xl border border-[#1e3a5f]/80 p-2.5 sm:p-3 space-y-2 min-w-0 max-w-full";
const panelBg = { background: "rgba(10,22,40,0.55)" } as const;

interface Props {
  studio: LeadershipStudioPreview;
  plan: PlanSlug;
}

export function OrgExecutiveReading({ studio, plan }: Props) {
  const reading = useMemo(() => buildExecutiveReading(studio, plan), [studio, plan]);

  return (
    <section className="space-y-3 min-w-0" aria-label={EXECUTIVE_PLAN_TITLE_AR}>
      <div className="space-y-1 min-w-0 pt-1 border-t border-white/[0.06]">
        <h4 className="text-white text-xs font-bold tracking-wide">{EXECUTIVE_PLAN_TITLE_AR}</h4>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed break-words">
          {EXECUTIVE_PLAN_HELPER_AR}
        </p>
      </div>

      {/* حالة القيادة */}
      <article
        className="rounded-2xl border-2 border-[#22d3ee]/25 p-3 sm:p-4 space-y-3 min-w-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(10,22,40,0.92) 45%, rgba(8,18,32,0.95) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px -8px rgba(34,211,238,0.35)",
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-[#22d3ee] shrink-0" />
          <h4 className="text-white text-sm font-bold">حالة القيادة</h4>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <ReadinessRing pct={reading.status.readinessPct} />
          <div className="flex-1 min-w-[140px] grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#1e3a5f]/60 bg-black/20 px-2 py-1.5">
              <p className="text-[#6b87ab] text-[9px]">المخاطر</p>
              <span
                className={cn(
                  "inline-block mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  riskBadgeClass(reading.status.riskLevel),
                )}
              >
                {reading.status.riskLabel}
              </span>
            </div>
            <div className="rounded-lg border border-[#1e3a5f]/60 bg-black/20 px-2 py-1.5">
              <p className="text-[#6b87ab] text-[9px]">خارج الهيكل</p>
              <p className="text-white text-sm font-bold tabular-nums mt-0.5">
                {reading.status.unlinkedEmployees}
              </p>
            </div>
            <div className="rounded-lg border border-[#1e3a5f]/60 bg-black/20 px-2 py-1.5 col-span-2 sm:col-span-1">
              <p className="text-[#6b87ab] text-[9px]">وحدات بلا مسؤول</p>
              <p className="text-white text-sm font-bold tabular-nums mt-0.5">
                {reading.status.unitsWithoutManager}
              </p>
            </div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#1e3a5f]/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400/80 to-cyan-400/80 transition-all"
            style={{ width: `${reading.status.readinessPct}%` }}
          />
        </div>
        <p className="text-[#6b87ab] text-[10px]">جاهزية القيادة — مؤشر مركّب من الربط والمسؤوليات والفرق</p>
      </article>

      {/* الإجراء المقترح الآن */}
      <article
        className={panelClass}
        style={{ ...panelBg, borderColor: "rgba(245,158,11,0.4)" }}
      >
        <div className="flex items-center gap-2">
          <Compass size={14} className="text-amber-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">الإجراء المقترح الآن</h4>
        </div>
        <p className="text-[#b8cce8] text-[11px] leading-relaxed break-words">
          {reading.nowAction.body}
        </p>
      </article>

      {/* أولويات العلاج */}
      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <Target size={14} className="text-violet-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">أولويات العلاج</h4>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
          {reading.healingPriorities.map((card) => (
            <PriorityCard key={card.id} card={card} />
          ))}
        </div>
      </article>

      {/* فجوات الهيكل */}
      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">فجوات الهيكل</h4>
        </div>
        {reading.gapCards.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-emerald-400/25 bg-emerald-500/5 px-3 py-4 text-center"
          >
            <Sparkles size={18} className="mx-auto text-emerald-300/80 mb-2" />
            <p className="text-emerald-100/90 text-[11px] font-medium">
              لا توجد فجوات تشغيلية واضحة حاليًا.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reading.gapCards.map((gap) => (
              <div
                key={gap.id}
                className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-2.5 py-2 min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-[11px] font-semibold break-words">{gap.label}</p>
                  <span className="text-amber-200 text-xs font-bold tabular-nums shrink-0">
                    {gap.count}
                  </span>
                </div>
                <p className="text-[#8ba3c7] text-[10px] mt-1 break-words">{gap.impact}</p>
                <p className="text-[#22d3ee] text-[10px] mt-1">أداة: {gap.suggestedTool}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* خريطة القيادة */}
      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <Map size={14} className="text-sky-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">خريطة القيادة</h4>
        </div>
        {reading.mapGroups.length === 0 ? (
          <p className="text-[#6b87ab] text-[10px]">لا توجد بيانات هيكل كافية بعد.</p>
        ) : (
          <div className="space-y-2.5">
            {reading.mapGroups.map((group) => (
              <div key={group.id} className="rounded-lg border border-[#1e3a5f]/50 bg-black/15 p-2 min-w-0">
                <p className="text-[#8ba3c7] text-[10px] font-semibold mb-1.5">{group.title}</p>
                <ul className="space-y-1">
                  {group.items.map((item, i) => (
                    <li key={`${group.id}-${i}`} className="min-w-0">
                      <p className="text-white text-[10px] font-medium truncate" title={item.label}>
                        {item.label}
                      </p>
                      <p className="text-[#6b87ab] text-[9px] truncate" title={item.detail}>
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* مؤشر القيادة */}
      <article className={panelClass} style={panelBg}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-300 shrink-0" />
            <h4 className="text-white text-xs font-bold">مؤشر القيادة</h4>
          </div>
          {reading.indicator.averageScore !== null && (
            <span className="text-white text-sm font-bold tabular-nums">
              {reading.indicator.averageScore}
            </span>
          )}
        </div>
        <span
          className={cn(
            "inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium",
            riskBadgeClass(reading.indicator.riskLevel),
          )}
        >
          مخاطر {reading.indicator.riskLabel}
        </span>
        <p className="text-[#8ba3c7] text-[10px] leading-relaxed break-words">
          {reading.indicator.businessMeaning}
        </p>
        {reading.indicator.topEmployees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {reading.indicator.topEmployees.map((emp, idx) => (
              <div
                key={`${emp.name}-${idx}`}
                className="rounded-lg border border-[#1e3a5f]/50 px-2 py-1.5 bg-black/15 min-w-0"
              >
                <p className="text-[#b8cce8] text-[10px] truncate" title={emp.name}>
                  {emp.name}
                </p>
                <p className="text-[#6b87ab] text-[10px] tabular-nums">
                  {emp.riskLabel} · {emp.score}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
