// Server-side input validation helpers (used in API routes only)

const VALID_ROLES = [
  "super_admin", "board_member", "defense_manager",
  "attack_manager", "finance_manager", "employee",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) return "البريد الإلكتروني مطلوب";
  if (!EMAIL_RE.test(email.trim())) return "البريد الإلكتروني غير صالح";
  if (email.length > 254) return "البريد الإلكتروني طويل جداً";
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || !password) return "كلمة المرور مطلوبة";
  if (password.length < 8)   return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (password.length > 128) return "كلمة المرور طويلة جداً";
  if (!/[A-Z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف إنجليزي كبير (A-Z)";
  if (!/[a-z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف إنجليزي صغير (a-z)";
  if (!/[0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رقم (0-9)";
  if (!/[^A-Za-z0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رمز مثل (!@#$%^&*)";
  return null;
}

export function validateRole(role: unknown): string | null {
  if (role === undefined || role === null) return null; // optional field
  if (typeof role !== "string") return "الدور غير صالح";
  if (!VALID_ROLES.includes(role)) return `الدور غير مقبول: ${role}`;
  return null;
}

export function validateName(name: unknown): string | null {
  if (name === undefined || name === null) return null; // optional
  if (typeof name !== "string") return "الاسم غير صالح";
  if (name.trim().length === 0) return "الاسم لا يمكن أن يكون فارغاً";
  if (name.length > 100) return "الاسم طويل جداً";
  return null;
}

export function validateUserId(userId: unknown): string | null {
  if (typeof userId !== "string" || !userId.trim()) return "userId مطلوب";
  // UUID v4 format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) return "userId غير صالح";
  return null;
}

/** Collect all validation errors and return the first one, or null if clean. */
export function firstError(...results: (string | null)[]): string | null {
  return results.find((r) => r !== null) ?? null;
}
