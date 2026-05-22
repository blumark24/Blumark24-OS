import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

interface OwnerFeaturePlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
}

/** Minimal owner placeholder — UI only, no API or DB. */
export default function OwnerFeaturePlaceholderPage({
  title,
  description,
  icon: Icon,
  accentClass,
}: OwnerFeaturePlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className={`font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap`}>
          <Icon size={28} className={accentClass} />
          {title}
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">{description}</p>
      </header>

      <div className="glass-card border border-[#22d3ee]/20 bg-gradient-to-l from-[#22d3ee]/[0.06] via-transparent to-transparent p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center min-h-[240px] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22d3ee]/12 border border-[#22d3ee]/25 mb-4">
            <Clock size={26} className="text-[#22d3ee]" />
          </div>
          <span className="inline-flex rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-medium text-[#fbbf24] mb-3">
            قريباً — واجهة فقط
          </span>
          <p className="text-white font-medium text-[15px] max-w-md">
            هذا القسم جاهز للربط لاحقاً مع بيانات الاستخدام الحقيقية.
          </p>
          <p className="text-[#8ba3c7] text-[13px] mt-2 max-w-lg leading-relaxed">
            لا توجد استعلامات API أو قاعدة بيانات من هذه الصفحة في المرحلة الحالية.
          </p>
        </div>
      </div>
    </div>
  );
}
