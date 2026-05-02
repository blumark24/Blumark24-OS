import { supabase, isSupabaseConfigured } from "./supabase";

// ─── Board Members ─────────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "نشط" | "غير نشط";
}

export const DEFAULT_BOARD: BoardMember[] = [
  { id: "1", name: "عبدالله الشهري", role: "رئيس مجلس الإدارة", email: "board1@blumark24.com", phone: "0501234567", status: "نشط" },
  { id: "2", name: "محمد الغامدي",   role: "نائب الرئيس",       email: "board2@blumark24.com", phone: "0507654321", status: "نشط" },
  { id: "3", name: "سلطان العمري",   role: "عضو مجلس الإدارة", email: "board3@blumark24.com", phone: "0509876543", status: "نشط" },
];

export async function getBoardMembers(): Promise<BoardMember[]> {
  if (!isSupabaseConfigured) return DEFAULT_BOARD;
  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardMember[];
}

export async function insertBoardMember(member: Omit<BoardMember, "id">): Promise<BoardMember> {
  if (!isSupabaseConfigured) return { id: String(Date.now()), ...member };
  const { data, error } = await supabase
    .from("board_members")
    .insert([member])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as BoardMember;
}

export async function updateBoardMember(id: string, changes: Partial<Omit<BoardMember, "id">>): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("board_members").update(changes).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBoardMember(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
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

export const FALLBACK_MESSAGES: DBMessage[] = [
  { id: "m1", sender_name: "سارة أحمد",  sender_avatar: "سأ", subject: "تحديث عقد شركة الماس",  content: "تم تجديد العقد بنجاح ويحتاج توقيعك...", created_at: "2024-05-28T08:30:00", read: false },
  { id: "m2", sender_name: "محمد علي",   sender_avatar: "مع", subject: "تصميم الهوية البصرية",    content: "انتهيت من المسودة الأولى، أرسلتها للمراجعة", created_at: "2024-05-27T14:00:00", read: false },
  { id: "m3", sender_name: "فاطمة خالد", sender_avatar: "فخ", subject: "تقرير المالية لشهر مايو", content: "الأرقام النهائية جاهزة، صافي الربح +18%", created_at: "2024-05-27T10:15:00", read: false },
  { id: "m4", sender_name: "عمر حسن",    sender_avatar: "عح", subject: "متابعة العملاء المحتملين", content: "راجعت 15 عميل، 4 منهم مهتمون جداً...", created_at: "2024-05-26T16:00:00", read: true },
  { id: "m5", sender_name: "ريم الشهري", sender_avatar: "رش", subject: "تقرير AI Lab الأسبوعي",  content: "اكتملت تجارب النموذج الجديد بنتائج ممتازة", created_at: "2024-05-26T09:00:00", read: true },
];

export async function getMessages(): Promise<DBMessage[]> {
  if (!isSupabaseConfigured) return FALLBACK_MESSAGES;
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as DBMessage[];
}

export async function markMessageRead(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllMessagesReadInDB(): Promise<void> {
  if (!isSupabaseConfigured) return;
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

export const FALLBACK_NOTIFICATIONS: DBNotification[] = [
  { id: "n1", type: "task_late",       title: "مهمة متأخرة",    body: "تصميم هوية شركة الماس",    href: "/tasks",   read: false, created_at: new Date().toISOString() },
  { id: "n2", type: "client_followup", title: "متابعة عميل",    body: "شركة النخيل تحتاج متابعة", href: "/clients", read: false, created_at: new Date().toISOString() },
  { id: "n3", type: "task_due",        title: "مهمة تستحق اليوم", body: "إعداد تقرير الأداء الشهري", href: "/tasks", read: false, created_at: new Date().toISOString() },
];

export async function getNotifications(userId?: string): Promise<DBNotification[]> {
  if (!isSupabaseConfigured) return FALLBACK_NOTIFICATIONS;
  let q = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (userId) {
    q = q.eq("user_id", userId);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as DBNotification[];
}

export async function markNotificationReadInDB(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsReadInDB(userId?: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  let q = supabase.from("notifications").update({ read: true }).eq("read", false);
  if (userId) {
    q = q.eq("user_id", userId);
  }
  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ─── User Profiles & Permissions ───────────────────────────────────────────────

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
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .eq("id", userId)
    .single();
  return (data as DBProfile) ?? null;
}

export async function getAllProfiles(): Promise<DBProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .order("name");
  return (data ?? []) as DBProfile[];
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function toggleProfileStatus(userId: string, isActive: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) throw new Error(error.message);
}
