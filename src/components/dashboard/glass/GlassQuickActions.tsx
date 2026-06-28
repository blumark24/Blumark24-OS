import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

export interface GlassQuickAction {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface GlassQuickActionsProps {
  actions: GlassQuickAction[];
  title?: string;
  caption?: string;
}

/**
 * Glass quick-actions strip matching the approved preview pattern.
 * Each action navigates to the real corresponding feature page; the
 * dashboard page provides the action list with real routes (no synthesised
 * endpoints).
 */
export default function GlassQuickActions({ actions, title = "اختصارات سريعة", caption }: GlassQuickActionsProps) {
  return (
    <div className="bm-dashboard-glass relative overflow-hidden rounded-2xl p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>
          {title}
        </h3>
        {caption ? (
          <span className="text-[11px] truncate" style={{ color: "#94A3B8" }}>
            {caption}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {actions.map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            <span
              className="grid place-items-center h-10 w-10 rounded-xl transition group-hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,217,255,0.16), rgba(20,124,255,0.16))",
                border: "1px solid rgba(125, 220, 255, 0.30)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 10px rgba(0,217,255,0.10)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "#7DDCFF" }} />
            </span>
            <span
              className="text-[10.5px] leading-tight font-medium text-center"
              style={{ color: "#DBE6F7" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
