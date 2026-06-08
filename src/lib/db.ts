import { supabase } from "./supabase";

// ─── Secure admin helpers ──────────────────────────────────────────────────────
// Primary path: Next.js /api/admin/* routes (server-side, use SUPABASE_SERVICE_ROLE_KEY).
// Secondary attempt: Supabase Edge Function (if fully deployed and not a placeholder).
//
// Design principle: any failure from the Edge Function silently falls back to
// the API routes. Only explicit business-logic errors (403, 400, etc.) from a
// fully-deployed Edge Function are surfaced as user-visible errors.

const ACTION_ROUTE: Record<string, { path: string; method: string }> = {
  create: { path: "/api/admin/create-user", method: "POST"   },
  delete: { path: "/api/admin/delete-user", method: "DELETE" },
  update: { path: "/api/admin/update-user", method: "PATCH"  },
};

// Discriminated union so tryEdgeFunction never throws — callers get a clean result
type EdgeResult =
  | { type: "success";  data:  Record<string, unknown> }
  | { type: "business"; error: string }
  | { type: "fallback" };

function isPlaceholder(data: Record<string, unknown>): boolean {
  const msg = String(data?.message ?? data?.error ?? "").toLowerCase();
  return msg.includes("placeholder") || msg.includes("claude code must deploy");
}

async function tryEdgeFunction(
  supabaseUrl: string,
  headers: Record<string, string>,
  action: string,
  payload: Record<string, unknown>,
): Promise<EdgeResult> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
      method:  "POST",
      signal:  controller.signal,
      headers,
      body:    JSON.stringify({ action, ...payload }),
    });
  } catch {
    // CORS error, network error, abort timeout, etc. → fall back to API route
    clearTimeout(tid);
    return { type: "fallback" };
  }
  // DO NOT clearTimeout here — keep the timer running so it can abort res.json()
  // if the Edge Function sends headers but never finishes the response body.

  let data: Record<string, unknown> = {};
  let bodyOk = true;
  try { data = await res.json(); } catch { bodyOk = false; }
  clearTimeout(tid); // safe to clear now — body read finished (or timed out)

  // Body read timed-out or failed → treat as undeployed / broken, fall back
  if (!bodyOk) return { type: "fallback" };

  // Placeholder or "not deployed" → try API route
  if (res.status === 501 || res.status === 404 || isPlaceholder(data)) {
    return { type: "fallback" };
  }

  // Genuine HTTP error from a working Edge Function → surface to user
  if (!res.ok) {
    const errMsg = (data?.error as string) ?? `خطأ HTTP ${res.status}`;
    return { type: "business", error: errMsg };
  }

  if (data?.error) {
    return { type: "business", error: data.error as string };
  }

  return { type: "success", data };
}

async function callApiRoute(
  route: { path: string; method: string },
  headers: Record<string, string>,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(route.path, {
      method:  route.method,
      signal:  controller.signal,
      headers,
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    clearTimeout(tid);
    if ((err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError")) {
      throw new Error("انتهت مهلة الحفظ (12 ثانية) — تحقق من اتصال الإنترنت أو سجلات Vercel");
    }
    throw new Error("تعذر الاتصال بالخادم — تحقق من اتصال الإنترنت");
  }
  // Keep AbortController alive while reading body — prevents hanging if server
  // sends headers but the body stream never completes (same bug as Edge Function).
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch (bodyErr) {
    clearTimeout(tid);
    if ((bodyErr instanceof DOMException && bodyErr.name === "AbortError") ||
        (bodyErr instanceof Error && bodyErr.name === "AbortError")) {
      throw new Error("انتهت مهلة قراءة الاستجابة — تحقق من سجلات Vercel");
    }
    throw new Error(`استجابة غير صالحة من الخادم (HTTP ${res.status})`);
  }
  clearTimeout(tid);

  if (!res.ok) {
    // Include debug info from server so the toast is actionable
    const errMsg   = (data?.error as string) ?? `خطأ HTTP ${res.status}`;
    const debugMsg = (data?.debug as string);
    throw new Error(debugMsg ? `${errMsg}\n[debug: ${debugMsg}]` : errMsg);
  }
  if (data?.error) throw new Error(data.error as string);
  return data;
}

async function adminInvoke(action: string, payload: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("لم يتم تسجيل الدخول — يرجى تحديث الصفحة وإعادة المحاولة");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL غير مضبوط");
  }

  const headers: Record<string, string> = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const route = ACTION_ROUTE[action];
  if (!route) throw new Error(`action غير معروف: ${action}`);

  // "create" goes directly to the Next.js API route — it runs inside Vercel and
  // can read SUPABASE_SERVICE_ROLE_KEY. Skipping the Edge Function avoids a
  // 12-second timeout when the function is not deployed, which was causing the
  // button to stay on "جاري الحفظ" and sometimes surface a confusing 400.
  if (action === "create") {
    return callApiRoute(route, headers, payload);
  }

  // For delete/update: try Edge Function first, fall back to API route on any failure.
  const edgeResult = await tryEdgeFunction(supabaseUrl, headers, action, payload);

  if (edgeResult.type === "success")  return edgeResult.data;
  if (edgeResult.type === "business") throw new Error(edgeResult.error);

  return callApiRoute(route, headers, payload);
}

export async function createAuthUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
  department: string;
  phone?: string | null;
  salary?: number | null;
  status?: string;
  jobTitle?: string | null;
}): Promise<{ id: string }> {
  const result = await adminInvoke("create", data as Record<string, unknown>);
  return result as { id: string };
}

export async function deleteAuthUser(userId: string): Promise<void> {
  await adminInvoke("delete", { userId });
}

export async function updateAuthUser(userId: string, data: {
  role?: string;
  department?: string;
  isActive?: boolean;
  name?: string;
  jobTitle?: string | null;
}): Promise<void> {
  await adminInvoke("update", { userId, ...data });
}

// ─── Board Members ─────────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "نشط" | "غير نشط";
}

async function currentOrgIdForBoard(): Promise<string | null> {
  const { data: orgId, error: orgErr } = await supabase.rpc("current_org_id");
  if (orgErr) return null;
  return (orgId as string | null) ?? null;
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  const orgId = await currentOrgIdForBoard();
  if (!orgId) return [];

  let query = supabase
    .from("board_members")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardMember[];
}

export async function insertBoardMember(member: Omit<BoardMember, "id">): Promise<BoardMember> {
  const orgId = await currentOrgIdForBoard();
  if (!orgId) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");

  const { data, error } = await supabase
    .from("board_members")
    .insert([{ ...member, organization_id: orgId }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as BoardMember;
}

export async function updateBoardMember(id: string, changes: Partial<Omit<BoardMember, "id">>): Promise<void> {
  const orgId = await currentOrgIdForBoard();
  if (!orgId) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");

  const { error } = await supabase
    .from("board_members")
    .update(changes)
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
}

export async function deleteBoardMember(id: string): Promise<void> {
  const orgId = await currentOrgIdForBoard();
  if (!orgId) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");

  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export interface DBMessage {
  id: string;
  sender_name: string;
  sender_avatar: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

export async function getMessages(): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as DBMessage[];
}

export async function markMessageRead(id: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllMessagesReadInDB(): Promise<void> {
  const { error } = await supabase.from("messages").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
}

// ─── Tenant scope helpers ─────────────────────────────────────────────────────

export async function resolveCurrentOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_org_id");
  if (error || data == null) return null;
  return data as string;
}

export interface TenantWorkspaceSettings {
  company_info: Record<string, unknown>;
  notifications: Record<string, unknown>;
  appearance: Record<string, unknown>;
}

export async function getTenantWorkspaceSettings(
  organizationId: string,
): Promise<TenantWorkspaceSettings | null> {
  const { data, error } = await supabase
    .from("tenant_workspace_settings")
    .select("company_info, notifications, appearance")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as TenantWorkspaceSettings;
}

export async function getOrganizationName(organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const raw = typeof data?.name === "string" ? data.name.trim() : "";
  return raw || null;
}

export async function upsertTenantWorkspaceSettings(
  organizationId: string,
  patch: Partial<TenantWorkspaceSettings>,
): Promise<void> {
  const { error } = await supabase.from("tenant_workspace_settings").upsert(
    {
      organization_id: organizationId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
  if (error) throw new Error(error.message);
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface DBNotification {
  id: string;
  type: "task_due" | "task_late" | "client_followup" | "invoice_due";
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId?: string): Promise<DBNotification[]> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) return [];

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DBNotification[];
}

export async function markNotificationReadInDB(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsReadInDB(userId?: string): Promise<void> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) return;

  let q = supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false)
    .eq("organization_id", orgId);

  if (userId) {
    q = q.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    q = q.is("user_id", null);
  }

  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ─── User Profiles ─────────────────────────────────────────────────────────────

export interface DBProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  department: string;
  avatar?: string;
}

export async function getUserProfile(userId: string): Promise<DBProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .eq("id", userId)
    .single();
  return (data as DBProfile) ?? null;
}

// Tenant-scoped on purpose: the customer-workspace user list (Settings →
// users/permissions) must show ONLY the current organization's members.
// Relying on RLS alone is unsafe here — the legacy "profiles: read" policy
// (auth.role()='authenticated') and the super_admin/owner cross-org bypass in
// later policies would otherwise leak other tenants' users into this list.
// An explicit organization_id filter scopes the result for every role,
// including a super_admin viewing a customer workspace.
export async function getAllProfiles(): Promise<DBProfile[]> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .eq("organization_id", orgId)
    .order("name");
  return (data ?? []) as DBProfile[];
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
}

// Self-service: a user updates ONLY their own basic profile fields. Always
// scoped to the caller's own id, so one user can never edit another's profile.
// Never touches role/organization_id/is_active (also blocked by the
// profiles_block_protected_updates trigger).
export async function updateMyProfile(
  userId: string,
  patch: { name?: string },
): Promise<void> {
  if (!userId) throw new Error("تعذر تحديد المستخدم الحالي");
  const clean: Record<string, unknown> = {};
  if (patch.name !== undefined) clean.name = patch.name.trim();
  if (Object.keys(clean).length === 0) return;
  const { error } = await supabase.from("profiles").update(clean).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function toggleProfileStatus(userId: string, isActive: boolean): Promise<void> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) throw new Error("تعذر تحديد المنشأة أو صلاحيات الوصول.");
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
}

// ─── System Settings ───────────────────────────────────────────────────────────

export async function getSystemSettings(): Promise<Record<string, unknown>> {
  const { data } = await supabase.from("system_settings").select("key, value");
  const result: Record<string, unknown> = {};
  ((data ?? []) as { key: string; value: unknown }[]).forEach((row) => {
    result[row.key] = row.value;
  });
  return result;
}

export async function setSystemSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

// ─── Activity Log ───────────────────────────────────────────────────────────────

export async function logActivity(
  type: "employee" | "task" | "client" | "finance" | "project",
  description: string,
  icon?: string,
): Promise<void> {
  const orgId = await resolveCurrentOrgId();
  await supabase.from("activities").insert([{
    type,
    description,
    icon,
    ...(orgId ? { organization_id: orgId } : {}),
  }]);
}

// ─── Notifications ──────────────────────────────────────────────────────────────

export async function createNotification(
  type: "task_due" | "task_late" | "client_followup" | "invoice_due",
  title: string,
  body: string,
  href: string,
  userId?: string,
): Promise<void> {
  const orgId = await resolveCurrentOrgId();
  if (!orgId) return;

  const { error } = await supabase.from("notifications").insert([{
    type,
    title,
    body,
    href,
    user_id: userId ?? null,
    organization_id: orgId,
  }]);
  if (error) console.error("[createNotification]", error.message);
}
