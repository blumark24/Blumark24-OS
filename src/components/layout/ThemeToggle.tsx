"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "dark" | "light";

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      const raw = localStorage.getItem("blumark-theme");
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem("blumark-theme", JSON.stringify({ ...current, darkMode: next === "dark" }));
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl",
        "border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7]",
        "hover:text-[#22d3ee] hover:bg-white/[0.08] transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        className,
      )}
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isDark ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} className="text-indigo-200" />}
    </button>
  );
}
