// TENANT-LOCKDOWN-1: defence-in-depth helpers used by every customer-workspace
// query so reads/writes are scoped to the caller's organization even if RLS
// would otherwise grant a bypass (super_admin / is_owner). RLS still enforces
// isolation server-side; this layer ensures the app never *asks* for cross-
// tenant rows from the customer workspace UI.
import { supabase } from "@/lib/supabase";

/** Resolve the caller's organization_id via the SECURITY DEFINER RPC. */
export async function resolveTenantOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_org_id");
  if (error || data == null) return null;
  return data as string;
}

/** Throws an Arabic, user-facing error if the caller has no resolvable org. */
export async function requireTenantOrgId(): Promise<string> {
  const orgId = await resolveTenantOrgId();
  if (!orgId) {
    throw new Error("تعذر تحديد منشأتك — أعد تسجيل الدخول أو تواصل مع الدعم");
  }
  return orgId;
}
