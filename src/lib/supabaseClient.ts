import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Build-time placeholder only — never used at runtime when env is configured.
 * Avoids throwing during static prerender when CI omits Supabase env vars.
 */
const BUILD_PLACEHOLDER_URL = "https://build-placeholder.supabase.co";
const BUILD_PLACEHOLDER_KEY = "build-placeholder-anon-key";

function createSupabase(): SupabaseClient {
  return createClient(
    supabaseUrl || BUILD_PLACEHOLDER_URL,
    supabaseAnonKey || BUILD_PLACEHOLDER_KEY,
    {
      auth: {
        persistSession: true,
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
