"use client";

import { cn } from "@/lib/utils";

export type HeroMetricAccent = "white" | "cyan" | "emerald" | "amber" | "rose" | "sky" | "violet";

export interface HeroMetric {
  label: string;
  value: string | number;
  accent?: HeroMetricAccent;
}

const METRIC_VALUE_COLOR: Record<HeroMetricAccent, string> = {
  white: "text-white",
  cyan: "text-cyan-300",
  emerald: "text-emerald-400",
  amber: "text-amber-300",
  rose: "text-rose-300",
  sky: "text-sky-300",
  violet: "text-violet-300",
};

const METRIC_BORDER: Record<HeroMetricAccent, string> = {
  white: "border-[rgba(148,163,184,0.12)]",
  cyan: "border-cyan-400/15",
  emerald: "border-emerald-400/15",
  amber: "border-amber-400/15",
  rose: "border-rose-400/15",
  sky: "border-sky-400/15",
  violet: "border-violet-400/15",
};

/**
 * Premium mobile-only hero card (Virtual Office inspired) shared across the
 * Customer Workspace mobile directories (Employees benchmark). Dark navy glass,
 * AI grid texture, electric-blue glow, a holographic icon orb, integrated
 * metric chips and a gradient CTA. Presentation only — no business logic.
 *
 * Rendered with `sm:hidden`; desktop/tablet keep their existing PageHero + KPIs.
 */
export function MobileHeroCard({
  icon: Icon,
  title,
  subtitle,
  metrics,
  ctaLabel,
  onCta,
  showCta = true,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  metrics: HeroMetric[];
  ctaLabel?: string;
  onCta?: () => void;
  showCta?: boolean;
}) {
  const cols = metrics.length >= 4 ? "grid-cols-4" : metrics.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <section
      className="sm:hidden relative overflow-hidden rounded-[22px] border border-[rgba(34,211,238,0.18)] p-4 shadow-[0_0_60px_rgba(34,211,238,0.05)]"
      style={{ background: "linear-gradient(135deg, rgba(6,15,30,0.98) 0%, rgba(18,36,68,0.96) 58%, rgba(50,16,80,0.16) 100%)" }}
    >
      {/* AI grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(120% 90% at 85% -10%, #000 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 85% -10%, #000 35%, transparent 75%)",
        }}
      />
      {/* Electric-blue glow blob + top hairline */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-cyan-500/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

      <div className="relative z-10 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgba(34,211,238,0.28)] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.22),rgba(30,111,217,0.14))] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_8px_22px_rgba(34,211,238,0.10)]">
          <Icon size={20} className="text-cyan-200" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-white font-heading font-bold text-lg leading-tight truncate">{title}</h1>
          <p className="text-[#8ba3c7] text-[12px] mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Integrated metric chips — dark glass, compact */}
      <div className={cn("relative z-10 mt-3.5 grid gap-2", cols)}>
        {metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "rounded-xl border bg-[rgba(8,18,38,0.55)] px-1.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              METRIC_BORDER[m.accent ?? "white"],
            )}
          >
            <div className={cn("font-bold text-base leading-none tabular-nums truncate", METRIC_VALUE_COLOR[m.accent ?? "white"])}>
              {m.value}
            </div>
            <div className="text-[#8ba3c7] text-[10px] mt-1 truncate">{m.label}</div>
          </div>
        ))}
      </div>

      {showCta && ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="relative z-10 mt-3.5 w-full flex items-center justify-center gap-2 min-h-11 rounded-xl text-sm font-semibold text-[#04121f] touch-manipulation bg-gradient-to-l from-cyan-400 to-sky-500 shadow-[0_8px_24px_rgba(34,211,238,0.22)] active:scale-[0.99] transition-transform"
        >
          {ctaLabel}
        </button>
      )}
    </section>
  );
}
