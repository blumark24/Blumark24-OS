import { supabase } from "./supabase";

// ─── Board Members ─────────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "نشط" | "غير نشط";
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardMember[];
}

export async function insertBoardMember(member: Omit<BoardMember, "id">): Promise<BoardMember> {
  const { data, error } = await supabase
    .from("board_members")
    .insert([member])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as BoardMember;
}

export async function updateBoardMember(id: string, changes: Partial<Omit<BoardMember, "id">>): Promise<void> {
  const { error } = await supabase.from("board_members").update(changes).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBoardMember(id: string): Promise<void> {
  const { error } = await supabase.from("board_members").delete().eq("id", id);
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
  let query = supabase
    .from("notifications")
    .select("*")
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
  let q = supabase.from("notifications").update({ read: true }).eq("read", false);
  if (userId) q = q.eq("user_id", userId);
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

export async function getAllProfiles(): Promise<DBProfile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .order("name");
  return (data ?? []) as DBProfile[];
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function toggleProfileStatus(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
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
  await supabase.from("activities").insert([{ type, description, icon }]);
}

// ─── Notifications ──────────────────────────────────────────────────────────────

export async function createNotification(
  type: "task_due" | "task_late" | "client_followup" | "invoice_due",
  title: string,
  body: string,
  href: string,
  userId?: string,
): Promise<void> {
  await supabase.from("notifications").insert([{
    type,
    title,
    body,
    href,
    user_id: userId ?? null,
  }]);
}
