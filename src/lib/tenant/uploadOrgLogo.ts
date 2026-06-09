import { supabase } from "@/lib/supabase";

const LOGO_BUCKET = "organization-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export interface UploadedOrgLogo {
  path: string;
  publicUrl: string;
}

export async function uploadOrgLogo(organizationId: string, file: File): Promise<UploadedOrgLogo> {
  const orgId = organizationId.trim();
  if (!orgId) {
    throw new Error("تعذر تحديد منشأتك لرفع الشعار.");
  }

  const extension = ALLOWED_LOGO_TYPES.get(file.type);
  if (!extension) {
    throw new Error("صيغة الشعار غير مدعومة. استخدم PNG أو JPG أو WebP.");
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("حجم الشعار يجب ألا يتجاوز 2 ميجابايت.");
  }

  const path = `${orgId}/logo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("تم رفع الشعار لكن تعذر إنشاء الرابط العام.");
  }

  return { path, publicUrl: data.publicUrl };
}
