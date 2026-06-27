import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title = "حدث خطأ غير متوقع",
  message = "تعذر تحميل البيانات. حاول مجدداً.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      dir="rtl"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-premium-3 rounded-premium-lg border border-[#EF4444]/30 bg-[#0B1F3A]/60 p-premium-6 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/15 text-[#FCA5A5] text-xl font-bold"
      >
        !
      </div>
      <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="max-w-md text-sm text-[#94A3B8]">{message}</p>
      {action ? <div className="pt-premium-2">{action}</div> : null}
    </div>
  );
}
