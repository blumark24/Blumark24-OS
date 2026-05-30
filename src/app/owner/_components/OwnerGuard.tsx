"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/owner";
import AccessDenied from "@/components/ui/AccessDenied";

type GuardState = "checking" | "denied" | "authorized";

// Restricts the entire /owner area to the Blumark24 platform owner.
//
// This guard is deliberately independent of the client AuthContext: owner
// access is decided purely from the Supabase auth identity vs. the owner
// allowlist. A client session, a missing client profile row, or a
// force-password-change flag therefore can never grant or block owner access.
//
//  • No valid session  → hand off to the dedicated /owner/login (never /auth).
//  • Session, not owner → Access Denied (never the client dashboard).
//  • Session + owner    → render the owner area.
//
// Edge-level "is signed in?" gating lives in middleware.ts; this adds the
// identity check the edge can't do without reading the auth user.
export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let active = true;

    const evaluate = (email: string | null | undefined, hasSession: boolean) => {
      if (!active) return;
      if (!hasSession) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[OwnerGuard/PR5-C] no-session → /owner/login", {
            route: typeof window !== "undefined" ? window.location.pathname : null,
          });
        }
        router.replace("/owner/login");
        return;
      }
      const authorized = isOwnerEmail(email);
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[OwnerGuard/PR5-C] evaluated session", {
          route: typeof window !== "undefined" ? window.location.pathname : null,
          isOwner: authorized,
          target: authorized ? null : "AccessDenied",
        });
      }
      setState(authorized ? "authorized" : "denied");
    };

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      evaluate(user?.email, !!user);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => evaluate(session?.user?.email, !!session?.user),
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (state === "checking") {
    // Resolving the owner session, or redirecting an unauthenticated visitor
    // to /owner/login — show a neutral placeholder meanwhile.
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0a1628" }}
      >
        <Loader2 size={28} className="animate-spin text-[#22d3ee]" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "#0a1628" }}
      >
        <AccessDenied message="هذه المنطقة مخصصة لمالك المنصة فقط." />
      </div>
    );
  }

  return <>{children}</>;
}
