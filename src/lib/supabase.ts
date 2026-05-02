import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "";
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// createClient requires non-empty strings; use placeholders so the module
// loads cleanly in environments where the vars are not yet set.
export const supabase = createClient(
  supabaseUrl  || "https://placeholder.supabase.co",
  supabaseKey  || "placeholder-anon-key",
);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;
