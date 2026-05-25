import { Eye } from "lucide-react";

export default function OwnerReadOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/[0.06] px-2.5 py-1 text-[11px] text-[#22d3ee]/80">
      <Eye size={11} /> عرض فقط — بدون إجراءات
    </span>
  );
}
