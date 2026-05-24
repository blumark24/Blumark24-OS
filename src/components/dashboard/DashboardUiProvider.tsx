"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type DashboardCopy,
  type DashboardLocale,
  getDashboardCopy,
} from "./dashboardCopy";
import "./dashboardTheme.css";

type DashboardUiContextValue = {
  locale: DashboardLocale;
  copy: DashboardCopy;
  dir: "rtl" | "ltr";
  isRtl: boolean;
  setLocale: (locale: DashboardLocale) => void;
};

const DashboardUiContext = createContext<DashboardUiContextValue | null>(null);

function readLocaleFromStorage(): DashboardLocale {
  if (typeof window === "undefined") return "ar";
  try {
    const t = JSON.parse(localStorage.getItem("blumark-theme") || "{}") as {
      language?: string;
    };
    return t.language === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function DashboardUiProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<DashboardLocale>("ar");

  useEffect(() => {
    setLocaleState(readLocaleFromStorage());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "blumark-theme") setLocaleState(readLocaleFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLocale = useCallback((next: DashboardLocale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<DashboardUiContextValue>(() => {
    const isRtl = locale === "ar";
    return {
      locale,
      copy: getDashboardCopy(locale),
      dir: isRtl ? "rtl" : "ltr",
      isRtl,
      setLocale,
    };
  }, [locale, setLocale]);

  return (
    <DashboardUiContext.Provider value={value}>{children}</DashboardUiContext.Provider>
  );
}

export function useDashboardUi(): DashboardUiContextValue {
  const ctx = useContext(DashboardUiContext);
  if (!ctx) {
    throw new Error("useDashboardUi must be used within DashboardUiProvider");
  }
  return ctx;
}
