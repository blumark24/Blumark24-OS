"use client";

// VirtualOfficeDesign.tsx — EXECUTIVE-OFFICE-VISUAL-1
// Tenant-aware executive virtual office (Kumospace-inspired).
// Fixed 8-zone Executive Office Template with API-backed room mapping.
// Isolated from /org. Client writes go through the tenant API route only.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, RefreshCw, Users,
  LayoutGrid, Building2,
  Layers, MapPin, Globe, Zap, BrainCircuit, GitMerge,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import type { Employee, Task } from "@/types";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { supabase } from "@/lib/supabaseClient";
import type {
  ExecutiveOfficeFixedRoomKey,
  ExecutiveOfficeRoomMapping,
  ExecutiveOfficeRoomMappingByRoom,
} from "@/lib/tenant/executiveOfficeRoomMappings";
import { type SceneRoom, formatOfficeNumber } from "./VirtualOfficeReferenceScene";
import MobileExecutiveOfficeScene from "./MobileExecutiveOfficeScene";
import OfficeControlModal, { type OfficeRoomState, type BoardOfficeStats } from "./OfficeControlModal";
import FullscreenOfficeExperience from "./FullscreenOfficeExperience";

// EXECUTIVE-OFFICE-NUMBERED-EMPTY-OFFICES-1
// 9 real office slots (01–09). Slot 4 (office 05) = مكتب مجلس الإدارة (board).
// Slot 8 (office 09) = meetings (top-right). No separate board panel.
const OFFICE_LABEL_PREFIX = "مكتب";
const officeLabel = (n: number) => `${OFFICE_LABEL_PREFIX} ${formatOfficeNumber(n)}`;
const UNASSIGNED_LABEL = "غير مخصص";
const UNASSIGNED_HINT_LONG = "اربط هذا المكتب بإدارة أو قسم من الهيكل الإداري لتفعيل التوأم الرقمي.";
const UNAVAILABLE_LABEL = "غير متاح";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfficeRoom extends SceneRoom {
  fixedRoomKey: ExecutiveOfficeFixedRoomKey;
  deptId: string;         // real department id (may differ from id for demo rooms)
  deptCode: string | null;
  type: string;           // human-readable level label
  level: string;
  teamCount: number;
  teams: Array<{ id: string; name: string; memberCount: number }>;
  managerName: string | null;
}

type PreviewOrgUnitType = "agency" | "management" | "department" | "team";
export type MappingSource = "saved" | "preview" | "auto";

export interface PreviewOrgUnit {
  id: string;
  name: string;
  type: PreviewOrgUnitType;
  typeLabel: string;
  code: string | null;
  employeeCount: number;
  taskCount: number;
}

export interface VirtualOfficeDesignProps {
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  tasks: Task[];
  orgName: string;
  orgCode?: string;
  onBackToOrg: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Executive Office Template — fixed 9 zones (C14-L2), mapped 1:1 to slot index.
// Slot 4 = board (center, مكتب مجلس الإدارة). Slot 8 = meetings (top-right, 9th room).
const EXECUTIVE_TEMPLATE_ZONES = [
  "المبيعات",
  "الإدارة العليا",
  "الدعم",
  "التسويق",
  "مجلس الإدارة",
  "المالية",
  "التنفيذ",
  "غرفة الذكاء الاصطناعي",
  "الاجتماعات",
] as const;
const ROOM_KEYS_BY_SLOT: readonly ExecutiveOfficeFixedRoomKey[] = [
  "sales",
  "executive",
  "support",
  "marketing",
  "board",
  "finance",
  "execution",
  "ai",
  "meetings",
] as const;
const EXECUTIVE_TEMPLATE_LABEL = "Executive Office";
const EXECUTIVE_TEMPLATE_LABEL_AR = "قالب المكتب التنفيذي";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_CYCLE = [
  "#22d3ee", "#f59e0b", "#10b981", "#a855f7",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];

const LEVEL_LABELS: Record<string, string> = {
  agency: "جناح", management: "غرفة إدارة", department: "مساحة عمل",
};

// Slot assignment keywords — maps Arabic/English room names to fixed visual slots.
// Slot 0=sales, 1=executive, 2=support, 3=marketing, 4=board(center), 5=finance, 6=execution, 7=AI, 8=meetings
const SLOT_KEYWORDS: Record<number, string[]> = {
  0: ["مبيعات", "بيع", "sales", "revenue", "تجار"],
  1: ["إدار", "executive", "عليا", "رئيس", "عام", "قياد", "تنفيذي"],
  2: ["دعم", "support", "خدمة عملاء", "service", "customer"],
  3: ["تسويق", "market", "إعلان", "brand", "تواصل"],
  4: ["مجلس", "board", "chairman", "رئاسة"],
  5: ["مال", "محاسب", "finance", "account", "خزين", "بنك", "حساب"],
  6: ["تنفيذ", "operat", "لوجست", "مشاريع", "project", "عمليات", "إنتاج"],
  7: ["ذكاء", "ai", "تقني", "tech", "برمجة", "software", "بيانات", "data"],
  8: ["اجتماع", "meeting", "conference", "مؤتمر", "قاعة"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = ((h * 31) + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h);
}

function nameInitials(name: string): string {
  const p = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0]?.[0] ?? "") + (p[1]?.[0] ?? "");
  return (name ?? "؟").slice(0, 2) || "؟";
}

function avatarColor(name: string): string {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length] ?? "#22d3ee";
}

function computeHp(open: number, overdue: number, emp: number): number {
  if (open === 0 && overdue === 0 && emp === 0) return 85;
  if (open === 0 && overdue === 0) return 90;
  return Math.max(45, Math.min(99, 100 - overdue * 10 - Math.max(0, open - overdue) * 3));
}

// ─── Presence (EXECUTIVE-OFFICE-PRESENCE-1) ─────────────────────────────────────
// Visual presence ONLY. Status is DETERMINISTIC (derived from a stable seed) —
// never random, never persisted, never realtime. No DB/network involved.
export type PresenceStatus = "available" | "busy" | "meeting" | "offline";

const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  available: "متاح",
  busy: "مشغول",
  meeting: "في اجتماع",
  offline: "غير متاح",
};
const PRESENCE_COLOR: Record<PresenceStatus, string> = {
  available: "#10b981",
  busy: "#f59e0b",
  meeting: "#a855f7",
  offline: "#6b7a8f",
};
export const PRESENCE_NOTE = "الحالة المعروضة للمعاينة التشغيلية فقط.";
const PRESENCE_FALLBACK_LETTERS = ["م", "ف", "ع", "س", "ر"];

function presenceStatusFor(seed: string): PresenceStatus {
  const h = hashStr(seed || "؟") % 10;
  if (h <= 4) return "available"; // ~50%
  if (h <= 6) return "busy";      // ~20%
  if (h <= 8) return "meeting";   // ~20%
  return "offline";               // ~10%
}

export interface PresencePerson {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: PresenceStatus;
  statusLabel: string;
  statusColor: string;
  roleOrUnit: string | null;
}

function resolveRoomPeople(
  room: OfficeRoom,
  mappingUnit: PreviewOrgUnit | null,
  snapshot: OrgStructureSnapshot | null,
  employees: Employee[],
): PresencePerson[] {
  if (room.isDemo) return [];
  const rels = Array.isArray(snapshot?.relations) ? snapshot!.relations : [];
  const empById = new Map((Array.isArray(employees) ? employees : []).map((e) => [e.id, e]));

  let employeeIds: string[];
  if (mappingUnit) {
    const sep = mappingUnit.id.indexOf(":");
    const kind = sep >= 0 ? mappingUnit.id.slice(0, sep) : "department";
    const rawId = sep >= 0 ? mappingUnit.id.slice(sep + 1) : mappingUnit.id;
    employeeIds = rels
      .filter((r) => (kind === "team" ? r?.team_id === rawId : r?.department_id === rawId))
      .map((r) => r.employee_id)
      .filter((x): x is string => typeof x === "string");
  } else {
    employeeIds = rels
      .filter((r) => r?.department_id === room.deptId)
      .map((r) => r.employee_id)
      .filter((x): x is string => typeof x === "string");
  }

  const seen = new Set<string>();
  const people: PresencePerson[] = [];
  for (const id of employeeIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const emp = empById.get(id);
    if (!emp) continue;
    const rawName = (emp.name ?? emp.email ?? "").trim();
    const name = rawName || `عضو ${people.length + 1}`;
    const initials = rawName
      ? nameInitials(name)
      : PRESENCE_FALLBACK_LETTERS[people.length % PRESENCE_FALLBACK_LETTERS.length] ?? "م";
    const status = presenceStatusFor(emp.id || name);
    const roleLabel = emp.role ? getTenantRoleLabel(emp.role) : null;
    people.push({
      id,
      name,
      initials,
      color: avatarColor(name),
      status,
      statusLabel: PRESENCE_LABEL[status],
      statusColor: PRESENCE_COLOR[status],
      roleOrUnit: roleLabel || mappingUnit?.name || null,
    });
  }
  return people;
}

// Smart keyword-based slot assignment. Slot 4 is pre-reserved for board —
// never assigned here regardless of dept level or name.
function assignSlot(name: string, _level: string, _isCenter: boolean, isAI: boolean, usedSlots: Set<number>): number {
  if (isAI) {
    if (!usedSlots.has(7)) return 7;
  }
  const nameLower = name.toLowerCase();
  for (const [slot, keywords] of Object.entries(SLOT_KEYWORDS)) {
    const slotNum = Number(slot);
    if (usedSlots.has(slotNum)) continue;
    if (keywords.some((kw) => nameLower.includes(kw))) return slotNum;
  }
  // Fill any remaining slot
  for (const s of [0, 1, 2, 3, 5, 6, 7, 8]) {
    if (!usedSlots.has(s)) return s;
  }
  return -1;
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildOfficeRooms(
  snapshot: OrgStructureSnapshot | null,
  employees: Employee[],
  tasks: Task[],
): { rooms: OfficeRoom[]; isDemo: boolean } {
  const depts   = Array.isArray(snapshot?.departments) ? snapshot!.departments : [];
  const teams   = Array.isArray(snapshot?.teams)       ? snapshot!.teams       : [];
  const rels    = Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [];
  const safeEmp = Array.isArray(employees) ? employees : [];
  const safeTsk = Array.isArray(tasks)     ? tasks     : [];

  const empById  = new Map(safeEmp.map((e) => [e.id, e]));
  const usedSlots = new Set<number>();
  const slotArr: (OfficeRoom | null)[] = Array(9).fill(null);

  // Slot 4 is always reserved for مكتب مجلس الإدارة — never overwritten by depts.
  slotArr[4] = makePlaceholder(4);
  usedSlots.add(4);

  function makePlaceholder(slot: number): OfficeRoom {
    const isBoard = slot === 4;
    return {
      id: `pad-${slot}`,
      fixedRoomKey: ROOM_KEYS_BY_SLOT[slot] ?? "sales",
      deptId: `pad-${slot}`,
      name: isBoard ? "مكتب مجلس الإدارة" : officeLabel(slot + 1),
      accentColor: ACCENT_CYCLE[slot % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: 0, avatars: [],
      openTasks: 0, overdueTasks: 0, healthPct: 0,
      isCenter: isBoard,
      isAI:     slot === 7,
      isDemo: true,
      deptCode: null,
      type:  isBoard ? "مجلس الإدارة" : slot === 7 ? "مكتب الذكاء الاصطناعي" : slot === 8 ? "مكتب الاجتماعات" : "مساحة عمل",
      level: isBoard ? "management" : "department",
      teamCount: 0, teams: [], managerName: null,
      officeNumber: slot + 1,
      isUnassigned: !isBoard,
    };
  }

  // Empty-org default: 9 stable numbered empty offices.
  if (depts.length === 0) {
    return {
      isDemo: true,
      rooms: Array.from({ length: 9 }, (_, i) => makePlaceholder(i)),
    };
  }

  // Place real depts.
  for (const dept of depts.slice(0, 9)) {
    if (!dept) continue;
    const deptRels    = rels.filter((r) => r?.department_id === dept.id);
    const empIds      = new Set(deptRels.map((r) => r.employee_id).filter((x): x is string => typeof x === "string"));
    const deptEmps    = Array.from(empIds).map((id) => empById.get(id)).filter((e): e is Employee => e != null);
    const deptTeams   = teams.filter((t) => t?.department_id === dept.id);
    const teamCards   = deptTeams.map((t) => ({ id: t.id, name: t.name ?? "—", memberCount: rels.filter((r) => r?.team_id === t.id).length }));
    const deptTasks   = safeTsk.filter((t) => t?.assigneeId && empIds.has(t.assigneeId));
    const open        = deptTasks.filter((t) => t?.status !== "مكتملة").length;
    const overdue     = deptTasks.filter((t) => t?.status === "متأخرة").length;
    const name        = dept.name ?? "—";
    const level       = typeof dept.structure_level === "string" ? dept.structure_level : "department";
    const deptIsCenter = level === "management";
    const deptIsAI     = name.includes("ذكاء") || name.toUpperCase().includes("AI");
    const manager     = dept.manager_id ? (empById.get(dept.manager_id)?.name ?? null) : null;

    const slotIdx = assignSlot(name, level, deptIsCenter, deptIsAI, usedSlots); // slot 4 already in usedSlots
    if (slotIdx < 0) continue;            // no free slot — skip (cap at 9).
    if (usedSlots.has(slotIdx)) continue; // belt-and-braces against duplicate.
    usedSlots.add(slotIdx);

    slotArr[slotIdx] = {
      id: dept.id,
      fixedRoomKey: ROOM_KEYS_BY_SLOT[slotIdx] ?? "sales",
      deptId: dept.id,
      name,
      accentColor: ACCENT_CYCLE[slotIdx % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: deptRels.length,
      avatars: deptEmps.slice(0, 3).map((e) => ({ initials: nameInitials(e.name ?? e.email ?? "؟"), color: avatarColor(e.name ?? e.email ?? "؟") })),
      openTasks: open, overdueTasks: overdue,
      healthPct: computeHp(open, overdue, deptRels.length),
      // isCenter / isAI follow the SLOT for visual consistency.
      isCenter: slotIdx === 4,
      isAI:     slotIdx === 7,
      isDemo: false,
      deptCode: dept.department_code ?? dept.publicCode ?? null,
      type: LEVEL_LABELS[level] ?? "مساحة عمل",
      level,
      teamCount: deptTeams.length, teams: teamCards,
      managerName: manager,
      officeNumber: slotIdx + 1,
      isUnassigned: false,
    };
  }

  // Fill any unfilled slot with a stable numbered empty office.
  const rooms: OfficeRoom[] = slotArr.map((r, i) => r ?? makePlaceholder(i));

  return { rooms, isDemo: false };
}

const ORG_UNIT_LABELS: Record<PreviewOrgUnitType, string> = {
  agency: "وكالة",
  management: "إدارة",
  department: "قسم",
  team: "فريق",
};

const ROOM_MAPPINGS_API = "/api/tenant/executive-office/room-mappings";
const VIRTUAL_OFFICE_ROOMS_API = "/api/tenant/virtual-office/rooms";

function buildPreviewOrgUnits(
  snapshot: OrgStructureSnapshot | null,
  tasks: Task[],
): PreviewOrgUnit[] {
  const departments = Array.isArray(snapshot?.departments) ? snapshot!.departments : [];
  const teams = Array.isArray(snapshot?.teams) ? snapshot!.teams : [];
  const relations = Array.isArray(snapshot?.relations) ? snapshot!.relations : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const countForEmployees = (employeeIds: Set<string>) =>
    safeTasks.filter((task) => task?.assigneeId && employeeIds.has(task.assigneeId)).length;

  const departmentUnits = departments.map((department) => {
    const type = (department.structure_level ?? "department") as PreviewOrgUnitType;
    const employeeIds = new Set(
      relations
        .filter((relation) => relation.department_id === department.id)
        .map((relation) => relation.employee_id)
        .filter((id): id is string => typeof id === "string"),
    );
    return {
      id: `department:${department.id}`,
      name: department.name,
      type,
      typeLabel: ORG_UNIT_LABELS[type] ?? ORG_UNIT_LABELS.department,
      code: department.department_code ?? department.publicCode ?? null,
      employeeCount: employeeIds.size,
      taskCount: countForEmployees(employeeIds),
    };
  });

  const teamUnits = teams.map((team) => {
    const employeeIds = new Set(
      relations
        .filter((relation) => relation.team_id === team.id)
        .map((relation) => relation.employee_id)
        .filter((id): id is string => typeof id === "string"),
    );
    return {
      id: `team:${team.id}`,
      name: team.name,
      type: "team" as const,
      typeLabel: ORG_UNIT_LABELS.team,
      code: null,
      employeeCount: employeeIds.size,
      taskCount: countForEmployees(employeeIds),
    };
  });

  return [...departmentUnits, ...teamUnits];
}


function unitApiId(unit: PreviewOrgUnit): string {
  return unit.id.includes(":") ? unit.id.split(":").slice(1).join(":") : unit.id;
}

function unitCompositeId(type: PreviewOrgUnitType, id: string): string {
  return type === "team" ? `team:${id}` : `department:${id}`;
}

function findSavedMappedUnit(
  mapping: ExecutiveOfficeRoomMapping | undefined,
  units: PreviewOrgUnit[],
): PreviewOrgUnit | null {
  if (!mapping) return null;
  const unit = units.find(
    (candidate) =>
      candidate.type === mapping.mapped_unit_type &&
      candidate.id === unitCompositeId(mapping.mapped_unit_type, mapping.mapped_unit_id),
  );
  if (!unit) return null;
  const displayName = mapping.display_name?.trim();
  return displayName ? { ...unit, name: displayName } : unit;
}

function resolveRoomMapping(input: {
  room: OfficeRoom;
  units: PreviewOrgUnit[];
  savedMappings: ExecutiveOfficeRoomMappingByRoom;
}): { unit: PreviewOrgUnit | null; source: MappingSource | null } {
  const savedUnit = findSavedMappedUnit(
    input.savedMappings[input.room.fixedRoomKey],
    input.units,
  );
  if (savedUnit) return { unit: savedUnit, source: "saved" };

  // Auto-linking is intentionally disabled. Every office starts unassigned
  // and must be linked manually by the manager. Only saved mappings are used.

  return { unit: null, source: null };
}

function mappingSourceValue(source: MappingSource | null): string {
  if (source === "saved") return "saved";
  if (source === "preview") return "preview";
  if (source === "auto") return "auto";
  return UNAVAILABLE_LABEL;
}

function operationalMetric(value: number | null | undefined): string | number {
  return typeof value === "number" ? value : UNAVAILABLE_LABEL;
}

async function getRoomMappingAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function mappingHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function mapRoomMappingApiError(status: number, fallback?: string): string {
  if (status === 401) return "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.";
  if (status === 403) return "ليست لديك صلاحية تعديل ربط الغرف.";
  if (status === 409) return "يوجد تعارض في الربط، أعد المحاولة.";
  if (status === 400 && fallback) return fallback;
  return "تعذر حفظ الربط حاليًا.";
}

function safeRoomMappingErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message === "401") return mapRoomMappingApiError(401);
  if (
    message === "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى." ||
    message === "ليست لديك صلاحية تعديل ربط الغرف." ||
    message === "يوجد تعارض في الربط، أعد المحاولة." ||
    message === "تعذر حفظ الربط حاليًا." ||
    /[؀-ۿ]/.test(message)
  ) {
    return message;
  }
  return "تعذر حفظ الربط حاليًا.";
}

function normalizeSavedMappings(value: unknown): ExecutiveOfficeRoomMappingByRoom {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: ExecutiveOfficeRoomMappingByRoom = {};
  for (const key of ROOM_KEYS_BY_SLOT) {
    const candidate = (value as Record<string, unknown>)[key];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      output[key] = candidate as ExecutiveOfficeRoomMapping;
    }
  }
  return output;
}


// ─── HQ Command Header — C14-M7 ──────────────────────────────────────────────

interface HQCommandHeaderProps {
  orgName: string;
  linkedCount: number;
  unassignedCount: number;
  totalOffices: number;
  onBackToOrg: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenBoard?: () => void;
  onScrollToDT?: () => void;
}

function HQCommandHeader({
  orgName, linkedCount, unassignedCount, totalOffices,
  onBackToOrg, onRefresh, isRefreshing, onOpenBoard, onScrollToDT,
}: HQCommandHeaderProps) {
  return (
    <section style={{
      position: "relative", overflow: "hidden", borderRadius: 16,
      border: "1px solid rgba(34,211,238,0.16)",
      padding: "10px 14px 8px",
      background: "linear-gradient(135deg, rgba(6,15,30,0.99) 0%, rgba(14,28,58,0.98) 60%, rgba(30,10,55,0.10) 100%)",
    }}>
      <div style={{ position: "relative" }}>

        {/* ── Top row: identity + nav ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Badge row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Globe size={11} color="#22d3ee" style={{ flexShrink: 0 }} />
              {orgName && (
                <span style={{ fontSize: 10.5, color: "#4a6a8a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                  {orgName}
                </span>
              )}
              <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, background: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.26)", flexShrink: 0 }}>
                مقر سحابي
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.14)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.24)", flexShrink: 0 }}>
                BETA
              </span>
            </div>
            {/* Titles inline */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "clamp(15px,3.5vw,20px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: -0.2, whiteSpace: "nowrap" }}>
                مقر الشركة السحابي
              </h1>
              <span style={{ fontSize: 10, color: "#2a4060", fontWeight: 500, whiteSpace: "nowrap" }}>
                Blumark24 Cloud Office
              </span>
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <button type="button" onClick={onBackToOrg} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 11, cursor: "pointer" }}>
              <ArrowRight size={12} /> رجوع
            </button>
            <button type="button" onClick={onRefresh} disabled={isRefreshing || !onRefresh} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 9, border: "1px solid rgba(34,211,238,0.22)", background: "rgba(34,211,238,0.07)", color: "#22d3ee", fontSize: 11, cursor: "pointer", opacity: (isRefreshing || !onRefresh) ? 0.5 : 1 }}>
              <RefreshCw size={12} style={isRefreshing ? { animation: "spin 1s linear infinite" } : undefined} /> مزامنة
            </button>
          </div>
        </div>

        {/* ── Status row — single compact line ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 7, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"], scrollbarWidth: "none" }}>
          {([
            { label: `${totalOffices} مكاتب`,        color: "#22d3ee" },
            { label: `${linkedCount} مرتبطة`,         color: "#10b981" },
            { label: `${unassignedCount} تحتاج ربط`, color: "#f59e0b" },
            { label: "الحضور: غير مفعّل",             color: "#3a5570" },
            { label: "آخر تحديث: غير متاح",          color: "#1e3050" },
          ] as const).map(({ label, color }, i) => (
            <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
              <span style={{ fontSize: 9.5, color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
              {i < 4 && <span style={{ fontSize: 9.5, color: "#1a2e48", margin: "0 6px" }}>·</span>}
            </span>
          ))}
        </div>

        {/* ── Quick action chips — horizontally scrollable on mobile ── */}
        <div style={{ display: "flex", gap: 5, marginTop: 7, overflowX: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"], scrollbarWidth: "none", paddingBottom: 1 }}>
          {([
            { label: "المكاتب",       Icon: LayoutGrid,    action: undefined as (() => void) | undefined },
            { label: "الموظفون",      Icon: Users,         action: undefined as (() => void) | undefined },
            { label: "المهام",        Icon: Zap,           action: undefined as (() => void) | undefined },
            { label: "التوأم الرقمي", Icon: GitMerge,      action: onScrollToDT },
            { label: "المساعد الذكي", Icon: BrainCircuit,  action: undefined as (() => void) | undefined },
            { label: "مجلس الإدارة",  Icon: Building2,     action: onOpenBoard },
            { label: "تشغيل المقر",  Icon: Layers,         action: undefined as (() => void) | undefined },
          ]).map(({ label, Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={!action}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
                borderRadius: 999, fontSize: 10, fontWeight: 600, cursor: action ? "pointer" : "default",
                border: "1px solid rgba(148,163,184,0.13)",
                background: action ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.02)",
                color: action ? "#4a8aaa" : "#1e3050",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={10} />
              {label}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Workspace Identity Strip ─────────────────────────────────────────────────

function WorkspaceIdentityStrip({ orgName, orgCode, snapshot, employees }: {
  orgName: string;
  orgCode?: string;
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
}) {
  const deptCount = Array.isArray(snapshot?.departments) ? snapshot!.departments.length : 0;
  const empCount  = Array.isArray(employees) ? employees.length : 0;
  return (
    <div style={{
      borderRadius: 14, border: "1px solid rgba(255,255,255,0.065)",
      background: "rgba(6,14,28,0.90)",
      padding: "10px 16px",
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    }}>
      {/* Org identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={16} color="#22d3ee" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            {orgName || "منشأتك"}
          </p>
          {orgCode && (
            <p style={{ fontSize: 10, color: "#4a6a8a", margin: 0, fontFamily: "monospace" }}>
              كود المنشأة · {orgCode}
            </p>
          )}
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />

      {/* Office template */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Layers size={13} color="#a855f7" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, color: "#4a6a8a", lineHeight: 1.1 }}>قالب المكتب</span>
          <span style={{ fontSize: 12, color: "#c0d4ee", fontWeight: 600, lineHeight: 1.2 }}>
            {EXECUTIVE_TEMPLATE_LABEL_AR} <span style={{ color: "#5a7a9a", fontWeight: 500 }}>({EXECUTIVE_TEMPLATE_LABEL})</span>
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />

      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {[
          { Icon: LayoutGrid, color: "#22d3ee", label: `${deptCount} قسم` },
          { Icon: Users,      color: "#10b981", label: `${empCount} موظف` },
        ].map(({ Icon, color, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8ba3c7" }}>
            <Icon size={13} color={color} />
            {label}
          </span>
        ))}
      </div>

      {/* Sync status */}
      <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#3a5570" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
        حالة المزامنة · مبني من الهيكل الإداري
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VirtualOfficeDesign({
  snapshot, employees, tasks, orgName, orgCode,
  onBackToOrg, onRefresh, isRefreshing = false,
}: VirtualOfficeDesignProps) {
  const { user } = useAuth();
  const [controlModalRoom, setControlModalRoom] = useState<OfficeRoom | null>(null);
  const [fullscreenRoom, setFullscreenRoom] = useState<OfficeRoom | null>(null);
  const [savedMappings, setSavedMappings] = useState<ExecutiveOfficeRoomMappingByRoom>({});
  const [mappingErrorByRoom, setMappingErrorByRoom] = useState<Record<string, string>>({});
  const [savingRoomKey, setSavingRoomKey] = useState<ExecutiveOfficeFixedRoomKey | null>(null);
  const [deletingRoomKey, setDeletingRoomKey] = useState<ExecutiveOfficeFixedRoomKey | null>(null);
  const [roomStates, setRoomStates] = useState<Record<string, OfficeRoomState>>({});
  const [updatingRoomKey, setUpdatingRoomKey] = useState<string | null>(null);
  const [isResettingOffice, setIsResettingOffice] = useState(false);
  const [resetOfficeError, setResetOfficeError] = useState<string | null>(null);

  const isManager = user?.role === "organization_manager" || user?.role === "super_admin";

  const { rooms, isDemo } = useMemo(
    () => buildOfficeRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  const safeDepts = useMemo(() => Array.isArray(snapshot?.departments) ? snapshot!.departments : [], [snapshot]);
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);
  const safeEmps  = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);
  const previewOrgUnits = useMemo(
    () => buildPreviewOrgUnits(snapshot, safeTasks),
    [snapshot, safeTasks],
  );

  const roomsWithPresence = useMemo(() => {
    return rooms.map((room) => {
      const { unit } = resolveRoomMapping({ room, units: previewOrgUnits, savedMappings });
      const hasMapping = Boolean(unit);
      const isUnassigned = !room.isCenter && !hasMapping;
      const displayName = room.isCenter
        ? "مكتب مجلس الإدارة"
        : (unit?.name ?? (isUnassigned ? UNASSIGNED_LABEL : room.name));

      const base: OfficeRoom = {
        ...room,
        name: displayName,
        isUnassigned,
        isOpen: roomStates[room.fixedRoomKey]?.is_open ?? true,
        // Unassigned offices have no employees or tasks until the manager links them.
        ...(isUnassigned ? { employeeCount: 0, openTasks: 0, overdueTasks: 0, avatars: [] } : {}),
      };

      if (room.isDemo || isUnassigned) return base;

      const people = resolveRoomPeople(room, unit, snapshot, safeEmps);
      if (people.length === 0) return base;
      return {
        ...base,
        employeeCount: people.length,
        avatars: people.slice(0, 3).map((p) => ({ initials: p.initials, color: p.color, statusColor: p.statusColor })),
      };
    });
  }, [rooms, previewOrgUnits, savedMappings, roomStates, snapshot, safeEmps]);

  useEffect(() => {
    let alive = true;

    async function loadSavedMappings() {
      try {
        const token = await getRoomMappingAccessToken();
        if (!token) return;
        const res = await fetch(ROOM_MAPPINGS_API, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json().catch(() => null)) as { mappings?: unknown } | null;
        if (alive) setSavedMappings(normalizeSavedMappings(body?.mappings));
      } catch {
        // Saved mappings are additive; auto-mapping keeps the office usable.
      }
    }

    void loadSavedMappings();
    return () => { alive = false; };
  }, []);

  const clearRoomMappingError = useCallback((room: OfficeRoom) => {
    setMappingErrorByRoom((prev) => {
      if (!prev[room.id]) return prev;
      const next = { ...prev };
      delete next[room.id];
      return next;
    });
  }, []);

  const handleSaveMapping = useCallback(async (room: OfficeRoom, unit: PreviewOrgUnit) => {
    setSavingRoomKey(room.fixedRoomKey);
    clearRoomMappingError(room);
    try {
      const token = await getRoomMappingAccessToken();
      if (!token) throw new Error("401");

      const res = await fetch(ROOM_MAPPINGS_API, {
        method: "POST",
        headers: mappingHeaders(token),
        cache: "no-store",
        body: JSON.stringify({
          fixed_room_key: room.fixedRoomKey,
          mapped_unit_type: unit.type,
          mapped_unit_id: unitApiId(unit),
          display_name: null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        mapping?: ExecutiveOfficeRoomMapping;
        error?: string;
      };

      if (!res.ok || !body.mapping) {
        throw new Error(mapRoomMappingApiError(res.status, body.error));
      }

      setSavedMappings((prev) => ({ ...prev, [body.mapping!.fixed_room_key]: body.mapping! }));
    } catch (err) {
      setMappingErrorByRoom((prev) => ({
        ...prev,
        [room.id]: safeRoomMappingErrorMessage(err),
      }));
    } finally {
      setSavingRoomKey(null);
    }
  }, [clearRoomMappingError]);

  const handleDeleteSavedMapping = useCallback(async (room: OfficeRoom) => {
    setDeletingRoomKey(room.fixedRoomKey);
    clearRoomMappingError(room);
    try {
      const token = await getRoomMappingAccessToken();
      if (!token) throw new Error("401");

      const res = await fetch(ROOM_MAPPINGS_API, {
        method: "DELETE",
        headers: mappingHeaders(token),
        cache: "no-store",
        body: JSON.stringify({ fixed_room_key: room.fixedRoomKey }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(mapRoomMappingApiError(res.status, body.error));
      }

      setSavedMappings((prev) => {
        const next = { ...prev };
        delete next[room.fixedRoomKey];
        return next;
      });
    } catch (err) {
      setMappingErrorByRoom((prev) => ({
        ...prev,
        [room.id]: safeRoomMappingErrorMessage(err),
      }));
    } finally {
      setDeletingRoomKey(null);
    }
  }, [clearRoomMappingError]);

  // Load room open/close states from DB.
  useEffect(() => {
    let alive = true;
    async function loadRoomStates() {
      try {
        const token = await getRoomMappingAccessToken();
        if (!token || !alive) return;
        const res = await fetch(VIRTUAL_OFFICE_ROOMS_API, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { rooms?: Array<{ room_key: string; is_open: boolean }> };
        if (!alive) return;
        const states: Record<string, OfficeRoomState> = {};
        for (const r of data.rooms ?? []) {
          states[r.room_key] = { is_open: r.is_open };
        }
        setRoomStates(states);
      } catch {
        // Non-critical — rooms default to open
      }
    }
    void loadRoomStates();
    return () => { alive = false; };
  }, []);

  const handleToggleRoomOpen = useCallback(async (room: OfficeRoom, is_open: boolean) => {
    setUpdatingRoomKey(room.fixedRoomKey);
    try {
      const token = await getRoomMappingAccessToken();
      if (!token) return;
      const res = await fetch(`${VIRTUAL_OFFICE_ROOMS_API}/${room.fixedRoomKey}`, {
        method: "PATCH",
        headers: mappingHeaders(token),
        cache: "no-store",
        body: JSON.stringify({ is_open }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { room?: { room_key: string; is_open: boolean } };
      if (data.room) {
        setRoomStates((prev) => ({ ...prev, [data.room!.room_key]: { is_open: data.room!.is_open } }));
      }
    } catch {
      // Non-critical
    } finally {
      setUpdatingRoomKey(null);
    }
  }, []);

  const handleBulkToggle = useCallback(async (is_open: boolean) => {
    const nonBoardKeys = ROOM_KEYS_BY_SLOT.filter((k) => k !== "board");
    setUpdatingRoomKey("bulk");
    try {
      const token = await getRoomMappingAccessToken();
      if (!token) return;
      await Promise.all(
        nonBoardKeys.map((key) =>
          fetch(`${VIRTUAL_OFFICE_ROOMS_API}/${key}`, {
            method: "PATCH",
            headers: mappingHeaders(token),
            cache: "no-store",
            body: JSON.stringify({ is_open }),
          }).then(async (res) => {
            if (res.ok) {
              const data = (await res.json()) as { room?: { room_key: string; is_open: boolean } };
              if (data.room) {
                setRoomStates((prev) => ({ ...prev, [data.room!.room_key]: { is_open: data.room!.is_open } }));
              }
            }
          }).catch(() => undefined),
        ),
      );
    } catch {
      // Non-critical
    } finally {
      setUpdatingRoomKey(null);
    }
  }, []);

  const handleResetVirtualOffice = useCallback(async () => {
    setIsResettingOffice(true);
    setResetOfficeError(null);
    try {
      const token = await getRoomMappingAccessToken();
      if (!token) { setResetOfficeError("تعذر التحقق من الصلاحية."); return; }
      const res = await fetch("/api/tenant/virtual-office/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setResetOfficeError(data.error ?? "تعذر إعادة ضبط المكتب الافتراضي حالياً.");
        return;
      }
      // Clear all local mapping + room state after reset
      setSavedMappings({});
      setRoomStates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { if (k !== "board") next[k] = { is_open: true }; });
        return next;
      });
    } catch {
      setResetOfficeError("تعذر إعادة ضبط المكتب الافتراضي حالياً.");
    } finally {
      setIsResettingOffice(false);
    }
  }, []);

  const isEmpty = safeDepts.length === 0 && !isDemo;

  const linkedOfficeCount = roomsWithPresence.filter((room) => !room.isUnassigned).length;
  const unassignedOfficeCount = roomsWithPresence.filter((room) => room.isUnassigned).length;

  const boardRoom = useMemo(
    () => roomsWithPresence.find((r) => r.isCenter) ?? null,
    [roomsWithPresence],
  );

  const dtRef = useRef<HTMLDivElement>(null);
  const scrollToDT = useCallback(() => {
    dtRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="space-y-4 min-w-0" dir="rtl">

      {/* ── HQ Command Header — C14-M7 ── */}
      <HQCommandHeader
        orgName={orgName}
        linkedCount={linkedOfficeCount}
        unassignedCount={unassignedOfficeCount}
        totalOffices={roomsWithPresence.length}
        onBackToOrg={onBackToOrg}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onOpenBoard={boardRoom ? () => setControlModalRoom(boardRoom) : undefined}
        onScrollToDT={scrollToDT}
      />

      {/* ── Empty State ── */}
      {isEmpty ? (
        <div style={{ borderRadius: 20, border: "1px dashed rgba(34,211,238,0.25)", padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, background: "rgba(10,22,40,0.5)" }}>
          <Building2 size={40} color="rgba(34,211,238,0.40)" />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>ابدأ ببناء الهيكل الإداري لتفعيل المكتب الافتراضي</p>
            <p style={{ fontSize: 13, color: "#6b87ab" }}>أضف أقسامك وفرقك وموظفيك لتظهر هنا على شكل مكتب افتراضي.</p>
          </div>
          <Link href="/org" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 12, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.30)", color: "#22d3ee", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <MapPin size={14} /> الانتقال إلى الهيكل الإداري
          </Link>
        </div>
      ) : (
        <>
          {/* ── MAP-FIRST: office map is the first and primary element ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Map label + hint row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LayoutGrid size={12} color="#22d3ee" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#c8daf0" }}>المكاتب التشغيلية</span>
                <span style={{ fontSize: 10, color: "#2a4462", fontWeight: 600 }}>· {roomsWithPresence.length} مكاتب</span>
              </div>
              <span style={{ fontSize: 10, color: "#2a4462" }}>اضغط على أي مكتب لإدارته</span>
            </div>

            {/* Activation hint — compact single line, only when unassigned exist */}
            {unassignedOfficeCount > 0 && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(245,158,11,0.20)", background: "rgba(245,158,11,0.05)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, boxShadow: "0 0 6px #f59e0b" }} />
                <span style={{ fontSize: 10, color: "#78716c", lineHeight: 1.4, flex: 1 }}>
                  {unassignedOfficeCount} مكتب جاهز للتشغيل — اضغط عليه لربطه
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", flexShrink: 0 }}>{linkedOfficeCount} مرتبط</span>
              </div>
            )}

            {/* Office image map — centered, max 860px */}
            <div style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <MobileExecutiveOfficeScene
                rooms={roomsWithPresence}
                selectedRoomId={controlModalRoom?.id ?? null}
                onRoomClick={(r) => setControlModalRoom(r as OfficeRoom)}
              />
            </div>
          </div>

          {/* ── Dot legend — clarify dots are linkage state, not presence ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {([
                { color: "#10b981", label: "مرتبط" },
                { color: "#f59e0b", label: "جاهز للتشغيل" },
                { color: "#a855f7", label: "مجلس الإدارة" },
              ] as const).map(({ color, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, color: "#3a5570" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {label}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 9, color: "#1e3050", lineHeight: 1.4 }}>
              النقاط توضّح حالة ربط المكتب، وليست حضور الموظفين
            </span>
          </div>

          {/* ── Digital Twin command layer — C14-M7.2 ── */}
          <div ref={dtRef} style={{ scrollMarginTop: 12, borderRadius: 14, border: "1px solid rgba(34,211,238,0.12)", background: "rgba(34,211,238,0.03)", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <GitMerge size={14} color="#22d3ee" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#c0d4ee", lineHeight: 1.2 }}>التوأم الرقمي للمقر</p>
                <p style={{ margin: 0, fontSize: 10, color: "#3a5570", lineHeight: 1.4 }}>يربط بين الهيكل الإداري، المكاتب، الغرف، الموظفين، والمهام لتكوين صورة تشغيلية أوضح للمقر.</p>
              </div>
            </div>
            {/* Relationship chain */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {["الهيكل الإداري", "المكاتب", "الغرف", "الموظفون", "المهام"].map((node, i, arr) => (
                <span key={node} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(34,211,238,0.20)", background: "rgba(34,211,238,0.06)", color: "#5a9abf" }}>{node}</span>
                  {i < arr.length - 1 && <span style={{ fontSize: 9, color: "#1e3050" }}>←</span>}
                </span>
              ))}
            </div>
            {/* Real counts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([
                { label: "أقسام",    value: safeDepts.length > 0 ? `${safeDepts.length}` : null },
                { label: "مكاتب مرتبطة", value: linkedOfficeCount > 0 ? `${linkedOfficeCount}` : null },
                { label: "موظفون",   value: safeEmps.length  > 0 ? `${safeEmps.length}`  : null },
                { label: "مهام",     value: safeTasks.length > 0 ? `${safeTasks.length}` : null },
              ] as const).map(({ label, value }) => (
                <div key={label} style={{ fontSize: 10, color: "#4a6a8a" }}>
                  <span style={{ fontWeight: 700, color: value ? "#7ab4d4" : "#1e3050" }}>{value ?? "غير متاح"}</span>
                  {" "}{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── AI command layer — C14-M7.2 ── */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(168,85,247,0.12)", background: "rgba(168,85,247,0.03)", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <BrainCircuit size={14} color="#a855f7" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#c4b5fd", lineHeight: 1.2 }}>مساعد تشغيل المقر</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#3a3060", lineHeight: 1.4 }}>يساعدك لاحقاً على فهم حالة المكاتب والغرف بعد ربط البيانات التشغيلية.</p>
                </div>
              </div>
              <a
                href="/ai"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 9, border: "1px solid rgba(168,85,247,0.30)", background: "rgba(168,85,247,0.08)", color: "#c4b5fd", fontSize: 10, fontWeight: 700, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
              >
                <BrainCircuit size={10} />
                فتح المساعد
              </a>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 9.5, color: "#2a2050", lineHeight: 1.4 }}>
              المساعد الذكي يعرض التوصيات بعد تفعيل وربط البيانات التشغيلية. · جاهز بعد ربط البيانات
            </p>
          </div>

          {/* Bottom padding — keeps the office content above the compact mobile dock. */}
          <div style={{ height: "calc(5.25rem + env(safe-area-inset-bottom, 0px))" }} />
        </>
      )}

      <p style={{ fontSize: 10, color: "#1e3050", textAlign: "center", paddingBottom: 8 }}>
        حالة المكتب محفوظة · إدارة المكاتب · يعتمد على بيانات المنشأة
      </p>

      {/* ── Office Control Modal — opened on every office tap ── */}
      {controlModalRoom && (() => {
        const controlMapping = resolveRoomMapping({ room: controlModalRoom, units: previewOrgUnits, savedMappings });
        const openCount = ROOM_KEYS_BY_SLOT.filter((k) => k !== "board").filter((k) => (roomStates[k]?.is_open ?? true)).length;
        const closedCount = ROOM_KEYS_BY_SLOT.filter((k) => k !== "board").length - openCount;
        const boardStats: BoardOfficeStats = {
          totalOffices: roomsWithPresence.length,
          linkedOfficeCount,
          unassignedOfficeCount,
          openCount,
          closedCount,
        };
        const managerRoom = roomsWithPresence.find((r) => r.id === controlModalRoom.id) ?? controlModalRoom;
        const officePeople = (managerRoom.isCenter || managerRoom.isUnassigned)
          ? []
          : resolveRoomPeople(controlModalRoom, controlMapping.unit, snapshot, safeEmps);
        return (
          <OfficeControlModal
            key={controlModalRoom.id}
            room={managerRoom}
            roomState={roomStates[controlModalRoom.fixedRoomKey] ?? null}
            isManager={isManager}
            mappingUnit={controlMapping.unit}
            mappingSource={controlMapping.source}
            managerName={managerRoom.managerName}
            units={previewOrgUnits}
            officePeople={officePeople}
            isSaving={savingRoomKey === controlModalRoom.fixedRoomKey}
            isUpdating={updatingRoomKey === controlModalRoom.fixedRoomKey || updatingRoomKey === "bulk"}
            boardStats={controlModalRoom.isCenter ? boardStats : null}
            onClose={() => setControlModalRoom(null)}
            onEnterOffice={() => {
              setFullscreenRoom(controlModalRoom);
              setControlModalRoom(null);
            }}
            onSave={(unit) => void handleSaveMapping(controlModalRoom, unit)}
            onReset={() => void handleDeleteSavedMapping(controlModalRoom)}
            onToggleOpen={(is_open) => void handleToggleRoomOpen(controlModalRoom, is_open)}
            onOpenAll={() => void handleBulkToggle(true)}
            onCloseAll={() => void handleBulkToggle(false)}
            onReviewUnassigned={() => setControlModalRoom(null)}
            onResetVirtualOffice={() => void handleResetVirtualOffice()}
            isResettingOffice={isResettingOffice}
            resetOfficeError={resetOfficeError}
          />
        );
      })()}
      {/* ── Fullscreen Office Entry — C15.1 ── */}
      {fullscreenRoom && (() => {
        const fsMapping = resolveRoomMapping({ room: fullscreenRoom, units: previewOrgUnits, savedMappings });
        const fsPeople = fullscreenRoom.isCenter || fullscreenRoom.isUnassigned
          ? []
          : resolveRoomPeople(fullscreenRoom, fsMapping.unit, snapshot, safeEmps);
        return (
          <FullscreenOfficeExperience
            room={fullscreenRoom}
            mappingUnit={fsMapping.unit}
            mappingSource={fsMapping.source}
            officePeople={fsPeople}
            onClose={() => setFullscreenRoom(null)}
          />
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
