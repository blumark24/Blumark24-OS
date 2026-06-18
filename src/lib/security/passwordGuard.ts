import { createHash } from "crypto";

export function validatePasswordStrength(password: string): string | null {
  if (!password) return "كلمة المرور مطلوبة";
  if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (password.length > 128) return "كلمة المرور طويلة جداً";
  if (!/[A-Z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)";
  if (!/[a-z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)";
  if (!/[0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رقم (0-9)";
  if (!/[^A-Za-z0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رمز (!@#$...)";
  return null;
}

export async function checkPwnedPassword(
  password: string,
): Promise<{ pwned: boolean; count?: number; unavailable?: boolean }> {
  const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Blumark24-OS-Free-Password-Guard" },
    });

    if (!res.ok) return { pwned: false, unavailable: true };

    const text = await res.text();

    for (const line of text.split("\n")) {
      const [lineSuffix, countStr] = line.trim().split(":");
      if (lineSuffix === suffix) {
        const count = parseInt(countStr ?? "0", 10);
        if (count > 0) return { pwned: true, count };
      }
    }

    return { pwned: false };
  } catch {
    return { pwned: false, unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function validatePasswordForAuth(
  password: string,
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const strengthErr = validatePasswordStrength(password);
  if (strengthErr) return { ok: false, error: strengthErr };

  const result = await checkPwnedPassword(password);

  if (result.unavailable) {
    return {
      ok: true,
      warning: "تعذر فحص تسريب كلمة المرور مؤقتاً — تم تطبيق قواعد القوة المحلية فقط.",
    };
  }

  if (result.pwned) {
    return {
      ok: false,
      error: "كلمة المرور مستخدمة في تسريبات سابقة. اختر كلمة مرور جديدة وغير مستخدمة.",
    };
  }

  return { ok: true };
}
