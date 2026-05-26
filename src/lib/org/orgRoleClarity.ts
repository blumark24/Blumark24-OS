import { BOARD_LABEL_AR } from "./packageHierarchy";

/** Display classification for الأدوار tab (render-only; no RBAC changes). */
export type OrgRoleCardKind = "active" | "organizational" | "coming_soon";

export const ORG_ROLE_KIND_LABEL: Record<OrgRoleCardKind, string> = {
  active: "دور فعلي",
  organizational: "مسمى تنظيمي",
  coming_soon: "قيد التفعيل لاحقًا",
};

export const ORG_ROLES_TAB_HELPER_AR =
  "الأدوار الفعلية تتحكم في صلاحيات الدخول، أما المسميات التنظيمية فهي لتنظيم الهيكل الإداري وسيتم ربطها بالصلاحيات الذكية لاحقًا.";

/** Active RBAC roles (profiles.role) — must match tenant user admin assignable set. */
export const TENANT_ACTIVE_RBAC_ROLES = [
  { title: "مدير المنشأة", slug: "organization_manager" as const },
  { title: "مدير مالي", slug: "finance_manager" as const },
  { title: "موظف", slug: "employee" as const },
] as const;

/** Kind per tenant role card title (titles unchanged). */
export const TENANT_ORG_ROLE_CARD_KIND: Record<string, OrgRoleCardKind> = {
  "مدير المنشأة": "active",
  "مدير مالي": "active",
  موظف: "active",
  "رئيس قسم": "organizational",
};

export function getTenantOrgRoleCardKind(title: string): OrgRoleCardKind {
  return TENANT_ORG_ROLE_CARD_KIND[title] ?? "organizational";
}

/** Structure titles shown in الهيكل but not login roles today (titles unchanged). */
export const ORG_STRUCTURE_LABELS_ONLY = [
  { title: BOARD_LABEL_AR, kind: "organizational" as const },
  { title: "مدير وكالة", kind: "organizational" as const },
  { title: "مدير إدارة", kind: "organizational" as const },
] as const;

export const ORG_SMART_PERMISSIONS_FOOTNOTE_AR =
  "ربط المسميات التنظيمية بصلاحيات الدخول الذكية";
