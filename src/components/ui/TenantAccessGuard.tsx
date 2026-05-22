"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TENANT_BLOCKED_BODY, TENANT_BLOCKED_TITLE } from "@/lib/tenantAccess";

type GuardPhase = "idle" | "checking" | "allowed" | "blocked" | "error";

interface TenantAccessPayload {
  allowed: boolean;
  code?: string;
  title?: string | null;
  body?: string | null;
  message?: string | null;
}

interface TenantAccessGuardProps {
  children: React.ReactNode;
}

export default function TenantAccessGuard({ children }: TenantAccessGuardProps) {
  const { user, loading: authLoading, logout, loggingOut } = useAuth();
  const [phase, setPhase] = useState<GuardPhase>("idle");
  const [blockedTitle, setBlockedTitle] = useState(TENANT_BLOCKED_TITLE);
  const [blockedBody, setBlockedBody] = useState(TENANT_BLOCKED_BODY);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    if (!user) {
      setPhase("idle");
      return;
    }

    setPhase("checking");
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/auth/tenant-access", {
        method: "GET",
        headers,
        credentials: "same-origin",
        cache: "no-store",
      });

      let payload: TenantAccessPayload = { allowed: false };
      try {
        payload = (await res.json()) as TenantAccessPayload;
      } catch {
        payload = { allowed: false, message: "استجابة غير صالحة من الخادم" };
      }

      if (res.status === 401) {
        setPhase("idle");
        return;
      }

      if (!res.ok && res.status >= 500) {
        setErrorMsg(payload.message ?? "تعذّر التحقق من حالة المنشأة");
        setPhase("error");
        return;
      }

      if (payload.allowed) {
        setPhase("allowed");
        return;
      }

      setBlockedTitle(payload.title ?? payload.message ?? TENANT_BLOCKED_TITLE);
      setBlockedBody(payload.body ?? TENANT_BLOCKED_BODY);
      setPhase("blocked");
    } catch {
      setErrorMsg("تعذّر الاتصال بالخادم للتحقق من صلاحية المنشأة");
      setPhase("error");
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPhase("idle");
      return;
    }
    void runCheck();
  }, [authLoading, user, runCheck]);

  if (authLoading || !user) {
    return <>{children}</>;
  }

  if (phase === "checking" || phase === "idle") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0a1628" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={32} className="animate-spin text-[#22d3ee]" />
          <p className="text-[#8ba3c7] text-sm">جاري التحقق من صلاحية المنشأة…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "#0a1628" }}
      >
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <ShieldAlert size={40} className="mx-auto text-amber-400" />
          <p className="text-white font-heading font-bold text-lg">{errorMsg}</p>
          <button
            type="button"
            onClick={() => void runCheck()}
            className="w-full rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/10 py-2.5 text-sm text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (phase === "blocked") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
        style={{ background: "#0a1628" }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-[#ef4444]/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-[#1e6fd9]/10 blur-3xl" />
        </div>

        <div className="glass-card max-w-lg w-full p-8 sm:p-10 text-center border border-red-500/20 shadow-[0_0_40px_-12px_rgba(239,68,68,0.35)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30">
            <Building2 size={32} className="text-red-400" />
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug mb-3">
            {blockedTitle}
          </h1>
          <p className="text-[#8ba3c7] text-sm sm:text-[15px] leading-relaxed mb-8">
            {blockedBody}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1E6FD9,#22D3EE)" }}
          >
            <LogOut size={18} />
            {loggingOut ? "جاري تسجيل الخروج…" : "تسجيل الخروج"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
