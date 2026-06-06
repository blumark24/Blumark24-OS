import { supabase } from "@/lib/supabase";

/**
 * Tenant organization logo upload (TENANT-LOGO-UPLOAD-1).
 *
 * Uploads to Supabase Storage at:  organization-logos/{organizationId}/logo.{ext}
 * The first path segment is always the current organization_id, and the
 * storage RLS policy (migration 034) enforces that a caller may only write
 * into their own org folder — so Organization A can never overwrite
 * Organization B's logo. The returned public URL is meant to be saved into
 * tenant_workspace_settings.company_info.logo_url (never base64 in the DB).
 */

export const ORG_LOGOS_BUCKET = "organization-logos";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Validates type/size, returns a human-readable Arabic error or null. */
export function validateLogoFile(file: File): string | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return "نوع الملف غير مدعوم — استخدم PNG أو JPEG أو WebP";
  }
  if (file.size > MAX_BYTES) {
    return "حجم الملف يتجاوز الحد الأقصى (2 ميغابايت)";
  }
  return null;
}

/**
 * Uploads (or overwrites) the org logo and returns a cache-busted public URL.
 * Throws an Error (Arabic message) on validation failure or storage error.
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  file: File,
): Promise<string> {
  if (!organizationId) {
    throw new Error("تعذر تحديد منشأتك — أعد تسجيل الدخول");
  }
  const validationError = validateLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = EXT_BY_TYPE[file.type] ?? "png";
  const path = `${organizationId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
  if (uploadError) {
    throw new Error(uploadError.message || "تعذر رفع الشعار");
  }

  const { data } = supabase.storage.from(ORG_LOGOS_BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) {
    throw new Error("تعذر الحصول على رابط الشعار بعد الرفع");
  }
  // Cache-bust so an overwritten logo refreshes immediately in the UI.
  return `${publicUrl}?t=${Date.now()}`;
}
