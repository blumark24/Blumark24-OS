import { supabase } from "@/lib/supabase";
import { requireTenantOrgId, resolveTenantOrgId } from "@/lib/tenant/tenantScope";

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

function fromRow(row: Record<string, unknown>): Department {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "",
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
    createdAt: (row.created_at as string) ?? "",
  };
}

export async function listDepartments(): Promise<Department[]> {
  // TENANT-LOCKDOWN-1: scope to caller's organization (defence-in-depth on top of RLS).
  const orgId = await resolveTenantOrgId();
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
}

export async function createDepartment(input: {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}): Promise<Department> {
  const organization_id = await requireTenantOrgId();
  const { data, error } = await supabase
    .from("departments")
    .insert([
      {
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        icon: input.icon?.trim() ?? "",
        sort_order: input.sortOrder ?? 0,
        organization_id,
      },
    ])
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as Record<string, unknown>);
}

export async function updateDepartment(
  id: string,
  changes: Partial<Pick<Department, "name" | "description" | "icon" | "sortOrder" | "isActive">>,
): Promise<void> {
  const organization_id = await requireTenantOrgId();
  const payload: Record<string, unknown> = {};
  if (changes.name !== undefined) payload.name = changes.name.trim();
  if (changes.description !== undefined) payload.description = changes.description;
  if (changes.icon !== undefined) payload.icon = changes.icon;
  if (changes.sortOrder !== undefined) payload.sort_order = changes.sortOrder;
  if (changes.isActive !== undefined) payload.is_active = changes.isActive;

  const { error } = await supabase
    .from("departments")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", organization_id);
  if (error) throw new Error(error.message);
}

export async function deleteDepartment(id: string): Promise<void> {
  const organization_id = await requireTenantOrgId();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id);
  if (error) throw new Error(error.message);
}

/** Deterministic color from department name for charts/badges */
export function departmentColor(name: string): string {
  const palette = ["#22d3ee", "#1e6fd9", "#a855f7", "#10b981", "#f59e0b", "#ff7a3d", "#06b6d4", "#8b5cf6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
