import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import type { KpiAccent } from "@/components/ui/workspaceVisual";
import type { ComponentType, SVGProps } from "react";

export interface GlassInsight {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
  tone?: KpiAccent;
}

interface GlassAiAssistantCardProps {
  /** Lead insight rendered alongside the orbit globe (one-line headline). */
  headline: string;
  /** Body line explaining the insight (still derived from existing KPIs). */
  body: string;
  /** Insights from the existing smartInsights array — rendered as a row. */
  insights: GlassInsight[];
  /** Link target for the "see all" chip (defaults to /ai). */
  href?: string;
}

const TONE_ICON: Record<KpiAccent, string> = {
  cyan:    "#7DDCFF",
  emerald: "#6EE7B7",
  amber:   "#FCD34D",
  rose:    "#FCA5A5",
  violet:  "#C4B5FD",
  sky:     "#7DD3FC",
};

/**
 * Glass AI assistant card mirroring the approved preview's globe + body
 * + insight strip pattern. The data ALL flows in from real, existing
 * dashboard derivations (smartInsights / aiInsight) — no fake AI text,
 * no fabricated metrics.
 */
export default function GlassAiAssistantCard({
  headline,
  body,
  insights,
  href = "/ai",
}: GlassAiAssistantCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bm-dashboard-glass-strong bm-dashboard-halo">
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.30), transparent 70%)",
        }}
      />

      <div className="relative flex items-center justify-between mb-3">
        <h3
          className="text-[14px] font-bold flex items-center gap-2"
          style={{ color: "#F8FAFC" }}
        >
          <Sparkles className="h-4 w-4" style={{ color: "#7DDCFF" }} />
          مساعد بلومارك الذكي
        </h3>
        <Link
          href={href}
          className="text-[11px] font-semibold flex items-center gap-1 rounded-lg px-2 py-1"
          style={{
            color: "#7DDCFF",
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(20,124,255,0.14))",
            border: "1px solid rgba(125, 220, 255, 0.28)",
          }}
        >
          عرض جميع الرؤى
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>

      {/* DOM order: text first → visual RIGHT in RTL; globe second → visual LEFT */}
      <div className="relative flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0 order-1">
          <p
            className="text-[14px] font-semibold leading-snug mb-1"
            style={{ color: "#F8FAFC" }}
          >
            {headline}
          </p>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "#B6C9E0" }}
          >
            {body}
          </p>
        </div>

        <div className="relative h-24 w-24 shrink-0 self-center order-2">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(0,217,255,0.45), transparent 70%)",
            }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
            <defs>
              <radialGradient id="bm-dash-globe" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#7DDCFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#147CFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="22" fill="url(#bm-dash-globe)" />
            <ellipse cx="50" cy="50" rx="22" ry="9" fill="none" stroke="rgba(125,220,255,0.55)" strokeWidth="0.7" />
            <ellipse cx="50" cy="50" rx="9" ry="22" fill="none" stroke="rgba(125,220,255,0.55)" strokeWidth="0.7" />
            <ellipse cx="50" cy="50" rx="18" ry="22" fill="none" stroke="rgba(125,220,255,0.30)" strokeWidth="0.6" />
            <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="rgba(125,220,255,0.35)" strokeWidth="0.7" transform="rotate(-18 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="18" fill="none" stroke="rgba(125,220,255,0.20)" strokeWidth="0.6" transform="rotate(22 50 50)" />
            <circle cx="86" cy="40" r="1.8" fill="#7DDCFF" />
            <circle cx="14" cy="62" r="1.5" fill="#7DDCFF" />
            <circle cx="74" cy="76" r="1.2" fill="#147CFF" />
          </svg>
        </div>
      </div>

      {insights.length > 0 && (
        <ul
          className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
          style={{ borderTop: "1px solid rgba(125, 220, 255, 0.10)", paddingTop: 12 }}
        >
          {insights.map((ins, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl p-2.5"
              style={{
                background: "rgba(11,31,58,0.45)",
                border: "1px solid rgba(125, 220, 255, 0.14)",
              }}
            >
              <span
                aria-hidden
                className="grid place-items-center h-7 w-7 rounded-lg shrink-0 mt-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,217,255,0.16), rgba(20,124,255,0.16))",
                  border: "1px solid rgba(125, 220, 255, 0.26)",
                }}
              >
                <ins.Icon className="h-3.5 w-3.5" style={{ color: TONE_ICON[ins.tone ?? "cyan"] }} />
              </span>
              <p
                className="text-[12px] leading-snug min-w-0"
                style={{ color: "#DBE6F7" }}
              >
                {ins.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
