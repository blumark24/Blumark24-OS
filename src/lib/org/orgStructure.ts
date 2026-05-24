import { supabase } from "@/lib/supabase";

export type OrgNodeKind = "agency" | "management" | "department" | "team";

export interface OrgUnitNode {
  id: string;
  kind: OrgNodeKind;
  name: string;
  parentId: string | null;
}

export interface OrgStructureSnapshot {
  units: OrgUnitNode[];
  updatedAt: string;
}

const STORAGE_PREFIX = "blumark-org-structure:";
const ACTIVITY_PREFIX = "ORG_STRUCTURE_JSON:";

function storageKey(orgId: string) {
  return `${STORAGE_PREFIX}${orgId}`;
}

export function createOrgUnit(kind: OrgNodeKind, name: string, parentId: string | null): OrgUnitNode {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    name: name.trim(),
    parentId,
  };
}

export function emptyOrgStructure(): OrgStructureSnapshot {
  return { units: [], updatedAt: new Date().toISOString() };
}

function parseSnapshot(raw: string): OrgStructureSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as OrgStructureSnapshot;
    if (!parsed || !Array.isArray(parsed.units)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Load tree: latest Supabase activity row, then localStorage fallback. */
export async function loadOrgStructure(orgId: string | null): Promise<OrgStructureSnapshot> {
  if (!orgId) return emptyOrgStructure();

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("description, timestamp")
      .like("description", `${ACTIVITY_PREFIX}%`)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (!error && data?.[0]?.description) {
      const json = String(data[0].description).slice(ACTIVITY_PREFIX.length);
      const snap = parseSnapshot(json);
      if (snap) {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey(orgId), JSON.stringify(snap));
        }
        return snap;
      }
    }
  } catch {
    /* fall through */
  }

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(storageKey(orgId));
    if (local) {
      const snap = parseSnapshot(local);
      if (snap) return snap;
    }
  }

  return emptyOrgStructure();
}

/** Org units are stored in activities JSON — not production org_units table yet. */
export const ORG_STRUCTURE_IS_PRODUCTION_UNITS = false;

/** Persist tree: Supabase activity (tenant-scoped insert) + localStorage mirror. */
export async function saveOrgStructure(
  orgId: string | null,
  snapshot: OrgStructureSnapshot,
): Promise<void> {
  const payload: OrgStructureSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(payload);

  if (typeof window !== "undefined" && orgId) {
    localStorage.setItem(storageKey(orgId), json);
  }

  if (!orgId) return;

  const { error } = await supabase.from("activities").insert([
    {
      type: "project",
      description: `${ACTIVITY_PREFIX}${json}`,
      icon: "🏛️",
      organization_id: orgId,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }
}

export function countUnits(units: OrgUnitNode[], kind: OrgNodeKind): number {
  return units.filter((u) => u.kind === kind).length;
}

export function departmentsForParent(units: OrgUnitNode[], parentId: string | null): OrgUnitNode[] {
  return units.filter((u) => u.kind === "department" && u.parentId === parentId);
}

export function childrenOf(units: OrgUnitNode[], parentId: string | null): OrgUnitNode[] {
  return units.filter((u) => u.parentId === parentId);
}
