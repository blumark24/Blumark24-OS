"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "dark" | "light";

function readStoredTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(readStoredTheme());

    const observer = new MutationObserver(() => {
      setTheme(readStoredTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);

    try {
      const raw = localStorage.getItem("blumark-theme");
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "blumark-theme",
        JSON.stringify({
          ...current,
          darkMode: next === "dark",
        }),
      );
    } catch {
      // Storage can be blocked in private/restricted browser contexts.
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "bm-fusion-control bm-theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring",
        className,
      )}
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isDark ? <Sun size={17} className="text-amber-200" /> : <Moon size={17} className="text-indigo-100" />}
    </button>
  );
}
