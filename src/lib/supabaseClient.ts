import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv && process.env.NODE_ENV !== "production") {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_ANON_KEY غير مضبوطين. " +
      "سيعمل التطبيق بوضع fallback حتى يتم ضبط env."
  );
}

const fallbackUrl = "https://example.supabase.co";
const fallbackAnonKey = "public-anon-key-placeholder";

// IMPORTANT:
// - We never expose service-role keys on the client.
// - Fallback values avoid hard build failure when env is missing.
// - Any real data operation will naturally fail at runtime until env is set.
export const supabase = createClient(
  hasSupabaseEnv ? (supabaseUrl as string) : fallbackUrl,
  hasSupabaseEnv ? (supabaseAnonKey as string) : fallbackAnonKey,
  {
    auth: {
      persistSession: true,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return hasSupabaseEnv;
}
