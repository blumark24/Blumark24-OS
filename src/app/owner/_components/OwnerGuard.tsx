"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerEmail } from "@/lib/owner";
import AccessDenied from "@/components/ui/AccessDenied";

// Restricts the entire /owner area to the Blumark24 platform owner.
// Authentication (must be signed in) is enforced one layer up in middleware.ts;
// this guard adds the identity check the edge middleware can't do without a DB
// read. We never render owner content — or an access-denied screen — until the
// AuthContext has finished resolving the profile, to avoid a wrong-state flash.
export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    // Still resolving the session, or AuthContext is redirecting an
    // unauthenticated visitor to /auth — show a neutral placeholder meanwhile.
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0a1628" }}
      >
        <Loader2 size={28} className="animate-spin text-[#22d3ee]" />
      </div>
    );
  }

  if (!isOwnerEmail(user.email)) {
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
