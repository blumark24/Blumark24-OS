import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// PR5-D: dedicated Supabase auth client for the Owner Panel.
//
// Same project, same anon key — but a distinct browser auth storage key,
// distinct in-memory client instance, and a distinct onAuthStateChange
// event stream. This is what isolates the Owner Panel session from the
// Customer Workspace session in the same browser tab:
//
//   • Owner client    → localStorage key "blumark_owner_auth"
//   • Customer client → localStorage key "blumark_customer_auth"
//
// Both clients send Authorization: Bearer <jwt> headers to the same
// PostgREST/RPC endpoints; they simply persist and refresh independent
// session objects. signOut on one client only clears its own storage
// (callers pass { scope: "local" } so the other surface's refresh token
// chain is never invalidated).
//
// This file is the ONLY place that may build the owner auth client. All
// owner-area code (OwnerLogin, OwnerGuard, OwnerLogoutButton, ownerQueries,
// ownerTruthQueries, ownerOrgDetailQueries) imports `ownerSupabase` from
// here — never the customer-side `supabase` from "@/lib/supabase".

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const BUILD_PLACEHOLDER_URL = "https://build-placeholder.supabase.co";
const BUILD_PLACEHOLDER_KEY = "build-placeholder-anon-key";

export const OWNER_AUTH_STORAGE_KEY = "blumark_owner_auth";

function createOwnerSupabase(): SupabaseClient {
  return createClient(
    supabaseUrl     || BUILD_PLACEHOLDER_URL,
    supabaseAnonKey || BUILD_PLACEHOLDER_KEY,
    {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        storageKey:       OWNER_AUTH_STORAGE_KEY,
        // Default browser localStorage is fine; we just isolate by key.
      },
    },
  );
}

export const ownerSupabase = createOwnerSupabase();
