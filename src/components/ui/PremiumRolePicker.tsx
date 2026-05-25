"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSurface } from "@/components/ui/CommandOverlay";

export interface RoleOption {
  value: string;
  label: string;
}

export function PremiumRolePicker({
  value,
  options,
  onChange,
  label = "الدور",
  required,
  disabled,
  hideLabel,
}: {
  value: string;
  options: RoleOption[];
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <span className={cn("block text-xs text-[#8ba3c7] mb-1.5", hideLabel && "sr-only")}>
        {label}
        {required && " *"}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border border-white/[0.10]",
          "bg-[#0a1628]/80 px-3 py-2.5 text-sm text-right transition-all",
          "hover:border-cyan-400/30 hover:bg-white/[0.04]",
          disabled && "opacity-50 cursor-not-allowed",
          open && "border-cyan-400/35 ring-1 ring-cyan-400/15",
        )}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-500/10">
            <ShieldCheck size={14} className="text-cyan-300" />
          </span>
          <span className="truncate text-white">{selected?.label ?? "— اختر الدور —"}</span>
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-[#8ba3c7] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5">
          <CommandSurface accent="cyan" className="overflow-hidden p-1.5 max-h-[min(240px,50vh)] overflow-y-auto">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-all",
                    active
                      ? "bg-cyan-500/12 text-cyan-100 border border-cyan-400/25"
                      : "text-[#8ba3c7] hover:bg-white/[0.05] hover:text-white border border-transparent",
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  {active && <Check size={15} className="text-cyan-300 shrink-0" />}
                </button>
              );
            })}
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
