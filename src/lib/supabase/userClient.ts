import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client that runs queries as the signed-in user (RLS applies).
 * Never use the service role for tenant-scoped reads in customer APIs.
 */
export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
