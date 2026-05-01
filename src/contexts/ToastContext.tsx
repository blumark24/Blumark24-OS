"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts:  [],
  toast:   () => {},
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
  dismiss: () => {},
});

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: "#10b981", icon: "text-emerald-400", bg: "bg-emerald-500/10" },
  error:   { border: "#ef4444", icon: "text-red-400",     bg: "bg-red-500/10"     },
  warning: { border: "#f59e0b", icon: "text-amber-400",   bg: "bg-amber-500/10"   },
  info:    { border: "#22d3ee", icon: "text-cyan-400",    bg: "bg-cyan-500/10"    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error   = useCallback((m: string) => toast(m, "error"),   [toast]);
  const warning = useCallback((m: string) => toast(m, "warning"), [toast]);
  const info    = useCallback((m: string) => toast(m, "info"),    [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon   = ICONS[t.type];
          const colors = COLORS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl ${colors.bg} border backdrop-blur-xl shadow-lg min-w-[260px] max-w-[340px]`}
              style={{ borderColor: colors.border, background: "rgba(13,31,60,0.92)" }}
            >
              <Icon size={16} className={colors.icon + " flex-shrink-0"} />
              <span className="text-sm text-white flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-[#8ba3c7] hover:text-white transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
