"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/owner";
import AccessDenied from "@/components/ui/AccessDenied";

type GuardState = "checking" | "no-session" | "denied" | "owner";

// Gates the entire /owner area to the Blumark24 platform owner. The owner area
// is intentionally independent of the client AuthContext: it reads the Supabase
// session directly (so access never depends on a profiles-table row) and routes
// unauthenticated visitors to the dedicated /owner/login — never the client
// /auth page. We never render owner content, or an access-denied screen, until
// the session has been resolved, to avoid a wrong-state flash.
export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let active = true;

    const resolve = (email: string | null | undefined, hasSession: boolean) => {
      if (!active) return;
      if (!hasSession) setState("no-session");
      else setState(isOwnerEmail(email) ? "owner" : "denied");
    };

    // getUser() validates the token against Supabase — authoritative initial check.
    supabase.auth
      .getUser()
      .then(({ data }) => resolve(data.user?.email, !!data.user))
      .catch(() => active && setState("no-session"));

    // React to sign-in / sign-out after mount. INITIAL_SESSION is skipped because
    // getUser() above is the authoritative (server-validated) initial check.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      resolve(session?.user?.email, !!session?.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state !== "no-session") return;
    // Clear any stale auth marker so /owner/login isn't bounced straight back
    // to /owner by middleware (which would otherwise loop).
    document.cookie = "blumark_session=; path=/; max-age=0; SameSite=Lax";
    router.replace("/owner/login");
  }, [state, router]);

  if (state === "owner") return <>{children}</>;

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#0a1628" }}>
        <AccessDenied message="هذه المنطقة مخصصة لمالك المنصة فقط." />
      </div>
    );
  }

  // checking, or no-session with the redirect to /owner/login in flight.
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0a1628" }}>
      <Loader2 size={28} className="animate-spin text-[#22d3ee]" />
    </div>
  );
}
