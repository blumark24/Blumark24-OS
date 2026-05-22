"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Real owner sign-out. Ends the Supabase session, clears the edge session
// marker cookie set at /owner/login, then routes back to the owner login.
// Rendered once inside OwnerSidebar, which is shared by the desktop sidebar and
// the mobile overlay — so a single button covers both layouts (no duplicates).
export default function OwnerLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setError(false);
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(true);
        setLoading(false);
        return;
      }
      // Clear the edge session marker the owner login set, so middleware no
      // longer treats the visitor as authenticated.
      document.cookie = "blumark_session=; path=/; max-age=0; SameSite=Lax";
      router.replace("/owner/login");
      router.refresh();
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.08] px-3 py-2.5 text-[12.5px] font-medium text-[#f87171] transition-colors hover:bg-[#ef4444]/15 hover:border-[#ef4444]/45 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            جاري تسجيل الخروج...
          </>
        ) : (
          <>
            <LogOut size={15} />
            تسجيل الخروج
          </>
        )}
      </button>
      {error && (
        <p className="text-[11px] text-center text-[#f87171] leading-relaxed">
          تعذر تسجيل الخروج، حاول مرة أخرى
        </p>
      )}
    </div>
  );
}
