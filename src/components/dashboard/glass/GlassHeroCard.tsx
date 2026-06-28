import { Building2, Crown, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassHeroCardProps {
  /** Real user display name from useAuth(). */
  userName: string;
  /** Tenant role label from getTenantRoleLabel(). */
  roleLabel: string;
  /** Tenant company name from useTenantCompanyName(). */
  companyName: string;
  companyIsFallback?: boolean;
  /** Tenant plan label (PLAN_LABELS_AR[planSlug]). */
  planLabel: string;
  /** Tenant subscription status from useTenantWorkspace(). */
  subscriptionStatusLabel: string;
  /** Optional sub-line such as today's Arabic date. */
  todayLabel?: string;
  /** Optional extra slot rendered under the metadata row (e.g. stat pills). */
  children?: ReactNode;
}

/**
 * Premium hero / welcome card matching the approved Blumark mobile
 * preview's PackageWelcomeCard pattern, adapted for the desktop
 * command-center layout used on `/dashboard`.
 *
 * Pure presentation — receives real, tenant-bound values via props.
 * Does not import data hooks or shared workspace tokens.
 */
export default function GlassHeroCard({
  userName,
  roleLabel,
  companyName,
  companyIsFallback = false,
  planLabel,
  subscriptionStatusLabel,
  todayLabel,
  children,
}: GlassHeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6 bm-dashboard-glass-strong bm-dashboard-halo">
      {/* Decorative corner glow — matches the preview's hero card */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.40), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(20,124,255,0.35), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Welcome (visual right in RTL) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h1
              className="text-2xl sm:text-3xl font-heading font-extrabold leading-none truncate"
              style={{ color: "#F8FAFC", letterSpacing: "-0.01em" }}
            >
              مرحباً {userName}
            </h1>
            <span aria-hidden className="text-xl leading-none">👋</span>
          </div>
          <p
            className="text-[13px] flex items-center gap-1.5 leading-snug"
            style={{ color: "#B6C9E0" }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "#7DDCFF" }} />
            نظام بلومارك 24 الذكي يعمل لأجلك
          </p>

          <div
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
            style={{ color: "#94A3B8" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} style={{ color: "#7DDCFF" }} />
              {roleLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                companyIsFallback && "italic",
              )}
              style={{ color: companyIsFallback ? "rgba(255,255,255,0.40)" : "#E2E8F0" }}
            >
              <Building2
                size={13}
                style={{ color: companyIsFallback ? "rgba(255,255,255,0.30)" : "#7DDCFF" }}
              />
              {companyName}
            </span>
            {todayLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }}
                />
                {todayLabel}
              </span>
            ) : null}
          </div>

          {children ? <div className="mt-4">{children}</div> : null}
        </div>

        {/* Package badge — matches the preview's left-side package chip */}
        <div
          className="shrink-0 self-start rounded-2xl px-3.5 py-3 text-center lg:min-w-[180px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(20,124,255,0.14))",
            border: "1px solid rgba(125, 220, 255, 0.32)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(0,217,255,0.16)",
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Crown className="h-4 w-4" style={{ color: "#7DDCFF" }} />
            <span className="text-[12px] font-bold" style={{ color: "#7DDCFF" }}>
              {planLabel}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }}
            />
            <span className="text-[11px]" style={{ color: "#B6C9E0" }}>
              {subscriptionStatusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
