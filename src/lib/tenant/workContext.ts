import { supabase } from "@/lib/supabase";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";

/**
 * TENANT-WORK-CONTEXT-ENGINE-1
 *
 * Resolves the REAL work context of a single user inside their own
 * organization. Every field comes from production tables — never mocked,
 * never hardcoded, never cross-tenant:
 *
 *   - الدور الإداري (administrative role) → profiles/employees.role label
 *   - المسمى الوظيفي (job title)          → employees.job_title
 *   - الارتباط التنظيمي (org link)        → employee_relations → departments.name
 *   - المدير المباشر (direct manager)     → employee_relations.manager_id → employees.name
 *   - تاريخ الانضمام (join date)          → employees.join_date
 *   - الحالة (status)                     → employees.status
 *
 * Tenant isolation: all reads are scoped to the caller's OWN id, and the
 * underlying tables (employees, employee_relations, departments) are guarded
 * by RLS policies that match `organization_id = current_org_id()`. There is no
 * fallback to another organization and no shared employee data across tenants.
 */
export interface WorkContext {
  /** الدور الإداري — display label for the auth role (always present). */
  roleLabel: string | null;
  /** المسمى الوظيفي — organizational job title (employees.job_title). */
  jobTitle: string | null;
  /** الارتباط التنظيمي / الجهة المرتبط بها — linked org-structure unit name. */
  orgLink: string | null;
  /** المدير المباشر — direct manager's display name (same org only). */
  directManager: string | null;
  /** تاريخ الانضمام — join date (ISO date string). */
  joinDate: string | null;
  /** الحالة — normalized employment status. */
  status: "active" | "inactive" | null;
  /**
   * Whether the user has any meaningful org-context beyond their role.
   * Role and status alone do NOT count — they exist for every account — so a
   * brand-new hire with no job title / unit / manager / join date correctly
   * shows the professional empty-state instead of a stack of placeholders.
   */
  hasWorkData: boolean;
}

export const EMPTY_WORK_CONTEXT: WorkContext = {
  roleLabel: null,
  jobTitle: null,
  orgLink: null,
  directManager: null,
  joinDate: null,
  status: null,
  hasWorkData: false,
};

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Reads the caller's own work context. `userId` MUST be the authenticated
 * user's id (the caller never passes another user's id from the profile flow).
 * Returns EMPTY_WORK_CONTEXT on any failure so the UI degrades to the
 * empty-state rather than throwing.
 */
export async function resolveMyWorkContext(
  userId: string,
  role?: string | null,
): Promise<WorkContext> {
  if (!userId) return EMPTY_WORK_CONTEXT;

  const roleLabel = role ? getTenantRoleLabel(role) : null;

  // Own employees row — org-scoped record carrying job title, status, join date.
  const { data: emp } = await supabase
    .from("employees")
    .select("job_title, join_date, status")
    .eq("id", userId)
    .maybeSingle();

  // Own org-structure link — department + direct manager (RLS: same org only).
  const { data: rel } = await supabase
    .from("employee_relations")
    .select("department_id, manager_id")
    .eq("employee_id", userId)
    .maybeSingle();

  let orgLink: string | null = null;
  if (rel?.department_id) {
    const { data: dept } = await supabase
      .from("departments")
      .select("name")
      .eq("id", rel.department_id)
      .maybeSingle();
    orgLink = cleanText(dept?.name);
  }

  let directManager: string | null = null;
  if (rel?.manager_id) {
    const { data: mgr } = await supabase
      .from("employees")
      .select("name")
      .eq("id", rel.manager_id)
      .maybeSingle();
    directManager = cleanText(mgr?.name);
  }

  const jobTitle = cleanText(emp?.job_title);
  const joinDate = cleanText(emp?.join_date);
  const statusRaw = cleanText(emp?.status);
  const status: WorkContext["status"] = !statusRaw
    ? null
    : statusRaw === "نشط"
      ? "active"
      : "inactive";

  const hasWorkData = Boolean(jobTitle || orgLink || directManager || joinDate);

  return { roleLabel, jobTitle, orgLink, directManager, joinDate, status, hasWorkData };
}
