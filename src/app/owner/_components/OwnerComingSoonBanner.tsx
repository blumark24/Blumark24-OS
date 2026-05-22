import { Clock, Link2 } from "lucide-react";

interface OwnerComingSoonBannerProps {
  title: string;
  description: string;
}

export default function OwnerComingSoonBanner({ title, description }: OwnerComingSoonBannerProps) {
  return (
    <div className="glass-card border border-[#22d3ee]/20 bg-gradient-to-l from-[#22d3ee]/[0.08] via-transparent to-[#a855f7]/[0.06] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22d3ee]/12 border border-[#22d3ee]/25 flex-shrink-0">
          <Clock size={22} className="text-[#22d3ee]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
            <span className="inline-flex items-center rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#fbbf24]">
              قريباً
            </span>
          </div>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-3xl">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-[#5f7798] text-[11px] flex-shrink-0">
          <Link2 size={14} />
          <span>واجهة فقط — بدون منطق فوترة</span>
        </div>
      </div>
    </div>
  );
}
