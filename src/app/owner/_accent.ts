import type { Accent } from "./_data";

// Centralised accent palette so every owner component glows the same way.
// Values are static class strings (Tailwind-safe — no runtime interpolation).

interface AccentStyle {
  text: string;
  iconBg: string;
  border: string;
  ring: string;
  glow: string;
  dot: string;
  chip: string;
}

export const ACCENT: Record<Accent, AccentStyle> = {
  cyan: {
    text: "text-[#22d3ee]",
    iconBg: "bg-[#22d3ee]/12",
    border: "border-[#22d3ee]/25",
    ring: "from-[#22d3ee]/20",
    glow: "shadow-[0_0_30px_-8px_rgba(34,211,238,0.45)]",
    dot: "bg-[#22d3ee]",
    chip: "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  },
  blue: {
    text: "text-[#1e6fd9]",
    iconBg: "bg-[#1e6fd9]/14",
    border: "border-[#1e6fd9]/30",
    ring: "from-[#1e6fd9]/20",
    glow: "shadow-[0_0_30px_-8px_rgba(30,111,217,0.45)]",
    dot: "bg-[#1e6fd9]",
    chip: "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  },
  purple: {
    text: "text-[#a855f7]",
    iconBg: "bg-[#a855f7]/14",
    border: "border-[#a855f7]/30",
    ring: "from-[#a855f7]/20",
    glow: "shadow-[0_0_30px_-8px_rgba(168,85,247,0.5)]",
    dot: "bg-[#a855f7]",
    chip: "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
  },
  orange: {
    text: "text-[#ff7a3d]",
    iconBg: "bg-[#ff7a3d]/14",
    border: "border-[#ff7a3d]/30",
    ring: "from-[#ff7a3d]/20",
    glow: "shadow-[0_0_30px_-8px_rgba(255,122,61,0.45)]",
    dot: "bg-[#ff7a3d]",
    chip: "bg-[#ff7a3d]/14 text-[#ff9a68] border border-[#ff7a3d]/30",
  },
  green: {
    text: "text-[#10b981]",
    iconBg: "bg-[#10b981]/14",
    border: "border-[#10b981]/30",
    ring: "from-[#10b981]/20",
    glow: "shadow-[0_0_30px_-8px_rgba(16,185,129,0.45)]",
    dot: "bg-[#10b981]",
    chip: "bg-[#10b981]/14 text-[#34d399] border border-[#10b981]/30",
  },
};
