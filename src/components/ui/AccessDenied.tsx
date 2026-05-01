"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function AccessDenied({ message = "ليس لديك صلاحية للوصول إلى هذه الصفحة" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <ShieldOff size={36} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-heading font-bold text-white mb-2">وصول مقيّد</h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs">{message}</p>
      </div>
      <Link href="/" className="btn-primary px-6 py-2 text-sm">
        العودة للرئيسية
      </Link>
    </div>
  );
}
