"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
// PR5-D: owner logout signs out the isolated owner auth client only.
import { ownerSupabase as supabase } from "@/lib/supabase/ownerClient";

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
      // scope: "local" so we only drop the owner auth client's storage —
      // a parallel customer session in the same browser stays intact.
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) {
        setError(true);
        setLoading(false);
        return;
      }
      // PR5-D: clear ONLY the owner edge marker. A parallel customer
      // session in the same browser still satisfies middleware via its
      // own `blumark_customer_session` cookie.
      const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `blumark_owner_session=; path=/; max-age=0; SameSite=Strict${secureAttr}`;
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
