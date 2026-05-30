import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Build-time placeholder only — never used at runtime when env is configured.
 * Avoids throwing during static prerender when CI omits Supabase env vars.
 */
const BUILD_PLACEHOLDER_URL = "https://build-placeholder.supabase.co";
const BUILD_PLACEHOLDER_KEY = "build-placeholder-anon-key";

// PR5-D: this is the **Customer Workspace** auth client. The Owner Panel
// uses a separate browser client — see `src/lib/supabase/ownerClient.ts`
// (`ownerSupabase`, storageKey "blumark_owner_auth"). Both clients hit the
// same Supabase project with the same anon key, but they persist auth
// sessions under distinct localStorage keys so a sign-in or sign-out on
// one surface never touches the other.
//
// Existing customer sessions persisted under the default
// `sb-<project-ref>-auth-token` key will be ignored after this change;
// users mid-session will need to re-authenticate once.
export const CUSTOMER_AUTH_STORAGE_KEY = "blumark_customer_auth";

function createSupabase(): SupabaseClient {
  return createClient(
    supabaseUrl || BUILD_PLACEHOLDER_URL,
    supabaseAnonKey || BUILD_PLACEHOLDER_KEY,
    {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        storageKey:       CUSTOMER_AUTH_STORAGE_KEY,
      },
    },
  );
}

export const supabase = createSupabase();

/** Call before auth/data operations in the browser when env must be present. */
export function assertSupabaseEnv(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set.");
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
