"use client";

// VirtualOfficeDesign.tsx — EXECUTIVE-OFFICE-VISUAL-1
// Tenant-aware executive virtual office (Kumospace-inspired).
// Fixed 8-zone Executive Office Template with API-backed room mapping.
// Isolated from /org. Client writes go through the tenant API route only.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, RefreshCw, BrainCircuit, Users,
  AlertCircle, Clock, Activity, Calendar, Heart,
  AlertTriangle, LayoutGrid, X, Building2, Shield,
  Layers, MapPin, ChevronDown, DoorOpen, Archive, Settings2,
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
import VirtualOfficeReferenceScene, { type SceneRoom, formatOfficeNumber } from "./VirtualOfficeReferenceScene";
import MobileExecutiveOfficeScene from "./MobileExecutiveOfficeScene";
import OfficeControlModal, { type OfficeRoomState, type BoardOfficeStats } from "./OfficeControlModal";

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

function hpLabel(pct: number): string {
  if (pct >= 85) return "ممتاز";
  if (pct >= 70) return "جيد";
  if (pct >= 55) return "متوسط";
  return "يحتاج متابعة";
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

// Resolves the people shown for a room, honouring mapping priority via the
// already-resolved mappingUnit (saved > preview > auto). Falls back to the
// room's own department relations when no mapping unit is provided. Read-only.
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

  // EXECUTIVE-OFFICE-NUMBERED-EMPTY-OFFICES-1 — slot-stable layout.
  // Always return an array of length 8 in fixed slot order:
  //   index 0 → مكتب 01 (sales),  index 1 → مكتب 02 (executive), …
  //   index 4 → مكتب 05 (meetings, center), index 7 → مكتب 08 (ai)
  // - Real departments are placed at the slot returned by assignSlot.
  //   The first dept to claim a slot wins; later collisions fall through to
  //   the next free slot. usedSlots prevents any duplicate office number.
  // - Any remaining slot is filled with an unassigned numbered placeholder.
  // - isCenter / isAI are derived from the SLOT (not the dept), so the visual
  //   composition matches the floor plan even when the dept is unrelated.

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
      type:  isBoard ? "مجلس الإدارة" : slot === 7 ? "غرفة AI" : slot === 8 ? "غرفة اجتماعات" : "مساحة عمل",
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

function findAutoMappedUnit(room: OfficeRoom, units: PreviewOrgUnit[]): PreviewOrgUnit | null {
  return units.find((unit) => unit.id === `department:${room.deptId}`) ?? null;
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
  previewMappings: Record<string, PreviewOrgUnit>;
}): { unit: PreviewOrgUnit | null; source: MappingSource | null } {
  const savedUnit = findSavedMappedUnit(
    input.savedMappings[input.room.fixedRoomKey],
    input.units,
  );
  if (savedUnit) return { unit: savedUnit, source: "saved" };

  const previewUnit = input.previewMappings[input.room.id] ?? null;
  if (previewUnit) return { unit: previewUnit, source: "preview" };

  const autoUnit = findAutoMappedUnit(input.room, input.units);
  if (autoUnit) return { unit: autoUnit, source: "auto" };

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
    /[\u0600-\u06ff]/.test(message)
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

function MappingPreviewModal({
  room,
  units,
  currentUnit,
  currentSource,
  previewUnit,
  saveError,
  isSaving,
  onClose,
  onPreview,
  onSave,
}: {
  room: OfficeRoom;
  units: PreviewOrgUnit[];
  currentUnit: PreviewOrgUnit | null;
  currentSource: MappingSource | null;
  previewUnit: PreviewOrgUnit | null;
  saveError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onPreview: (unit: PreviewOrgUnit) => void;
  onSave: (unit: PreviewOrgUnit) => void;
}) {
  const initialUnitId = previewUnit?.id ?? currentUnit?.id ?? units[0]?.id ?? "";
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;
  const officeNumberLabel = room.officeNumber ? officeLabel(room.officeNumber) : "مكتب";
  const currentSourceLabel = mappingSourceValue(currentSource);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapping-preview-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(2,8,23,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          maxHeight: "min(760px, calc(100vh - 32px))",
          overflow: "hidden",
          borderRadius: 22,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(6,14,28,0.98)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
        }}
        dir="rtl"
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, border: "1px solid rgba(34,211,238,0.25)", background: "rgba(34,211,238,0.10)", color: "#67e8f9", fontSize: 11, fontWeight: 850, padding: "3px 9px", marginBottom: 8 }}>
              {officeNumberLabel}
            </span>
            <h2 id="mapping-preview-title" style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800 }}>
              تخصيص ربط الغرفة
            </h2>
            <p style={{ margin: "8px 0 0", color: "#8ba3c7", fontSize: 13, lineHeight: 1.7, maxWidth: 560 }}>
              اختر إدارة أو قسم من الهيكل الإداري لربطه بهذا المكتب.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
            <div style={{ borderRadius: 14, border: "1px solid rgba(34,211,238,0.18)", background: "rgba(34,211,238,0.06)", padding: 12 }}>
              <p style={{ margin: 0, fontSize: 10, color: "#5a7a9a" }}>المكتب المحدد</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 800, color: "#dff7ff" }}>{officeNumberLabel}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#7a9ab8" }}>{room.name}</p>
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(168,85,247,0.18)", background: "rgba(168,85,247,0.06)", padding: 12 }}>
              <p style={{ margin: 0, fontSize: 10, color: "#5a7a9a" }}>الربط الحالي</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: currentUnit ? "#e9d5ff" : "#64748b" }}>
                {currentUnit ? currentUnit.name : "غير متاح"}
              </p>
              {currentUnit && (
                <p style={{ margin: "3px 0 0", fontSize: 10, color: "#9d8bc0" }}>
                  {currentUnit.typeLabel ?? "غير متاح"}{currentSourceLabel ? ` · ${currentSourceLabel}` : ""}
                </p>
              )}
            </div>
          </div>

          {units.length === 0 ? (
            <div style={{ borderRadius: 16, border: "1px dashed rgba(34,211,238,0.25)", background: "rgba(10,22,40,0.55)", padding: 18, textAlign: "center" }}>
              <p style={{ margin: 0, color: "#c8ddf0", fontSize: 13 }}>
                لا توجد وحدات إدارية متاحة. ابدأ ببناء الهيكل الإداري أولاً.
              </p>
              <Link href="/org" style={{ marginTop: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 40, padding: "8px 14px", borderRadius: 12, border: "1px solid rgba(34,211,238,0.28)", background: "rgba(34,211,238,0.10)", color: "#22d3ee", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                <MapPin size={14} />
                الانتقال إلى الهيكل الإداري
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {units.map((unit) => {
                  const selected = unit.id === selectedUnitId;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setSelectedUnitId(unit.id)}
                      style={{
                        width: "100%",
                        textAlign: "right",
                        borderRadius: 14,
                        border: selected ? "1px solid rgba(34,211,238,0.55)" : "1px solid rgba(255,255,255,0.07)",
                        background: selected ? "rgba(34,211,238,0.10)" : "rgba(255,255,255,0.035)",
                        color: "#dbeafe",
                        padding: "11px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {unit.name}
                          </span>
                          <span style={{ display: "block", marginTop: 3, fontSize: 10, color: "#6b87ab" }}>
                            {unit.typeLabel}{unit.code ? ` · ${unit.code}` : ""}
                          </span>
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#8ba3c7", fontSize: 10, flexShrink: 0 }}>
                          <span>{unit.employeeCount} موظف</span>
                          <span>{unit.taskCount} مهمة</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedUnit && (
                <div style={{ marginTop: 14, borderRadius: 14, border: "1px solid rgba(16,185,129,0.22)", background: "rgba(16,185,129,0.07)", padding: 12 }}>
                  <p style={{ margin: 0, color: "#6ee7b7", fontSize: 10, fontWeight: 850 }}>
                    الوحدة المحددة للمعاينة أو الحفظ
                  </p>
                  <p style={{ margin: "5px 0 0", color: "#a7f3d0", fontSize: 13, fontWeight: 750 }}>
                    {selectedUnit.name} · {selectedUnit.typeLabel ?? "غير متاح"}
                  </p>
                  <p style={{ margin: "7px 0 0", color: "#a7f3d0", fontSize: 13, fontWeight: 700 }}>
                    سيتم عرض {selectedUnit.name} داخل {room.name}
                  </p>
                  <p style={{ margin: "5px 0 0", color: "#6b87ab", fontSize: 11 }}>
                    هذا التخصيص للمعاينة فقط ولن يتم حفظه.
                  </p>
                </div>
              )}
              {saveError && (
                <div style={{ marginTop: 10, borderRadius: 12, border: "1px solid rgba(239,68,68,0.24)", background: "rgba(239,68,68,0.08)", color: "#fecaca", fontSize: 12, lineHeight: 1.6, padding: "9px 11px" }}>
                  {saveError}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "12px 18px calc(14px + env(safe-area-inset-bottom))", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} className="btn-secondary text-sm min-h-10">
            إلغاء
          </button>
          <button
            type="button"
            disabled={!selectedUnit}
            onClick={() => selectedUnit && onPreview(selectedUnit)}
            className="btn-primary text-sm min-h-10 disabled:opacity-50"
          >
            معاينة الربط
          </button>
          <button
            type="button"
            disabled={!selectedUnit || isSaving}
            onClick={() => selectedUnit && onSave(selectedUnit)}
            className="btn-primary text-sm min-h-10 disabled:opacity-50"
          >
            {isSaving ? "جارٍ الحفظ..." : "حفظ الربط"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room Detail Panel ────────────────────────────────────────────────────────

function DigitalTwinSnapshot({
  room,
  mappingUnit,
  mappingSource,
  openTaskCount,
  overdueTaskCount,
  healthPct,
}: {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource: MappingSource | null;
  openTaskCount: number | null;
  overdueTaskCount: number | null;
  healthPct: number | null;
}) {
  const sourceValue = mappingSourceValue(mappingSource);
  const linkedName = mappingUnit?.name ?? (room.isUnassigned ? null : room.name);
  const linkedType = mappingUnit?.typeLabel ?? (room.isUnassigned ? null : room.type || "وحدة");
  const metrics = [
    { label: "الأعضاء", value: operationalMetric(mappingUnit?.employeeCount ?? room.employeeCount) },
    { label: "المهام", value: operationalMetric(mappingUnit?.taskCount ?? openTaskCount) },
    { label: "المتأخرة", value: operationalMetric(overdueTaskCount) },
    { label: "الصحة", value: typeof healthPct === "number" && healthPct > 0 ? `${healthPct}%` : UNAVAILABLE_LABEL },
  ];

  return (
    <div style={{
      gridColumn: "1 / -1",
      borderRadius: 14,
      border: "1px solid rgba(34,211,238,0.16)",
      background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(168,85,247,0.07))",
      padding: "11px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#cffafe" }}>
          <BrainCircuit size={13} color="#67e8f9" />
          لقطة التوأم الرقمي
        </span>
        {room.officeNumber ? (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: "2px 8px" }}>
            {officeLabel(room.officeNumber)}
          </span>
        ) : null}
      </div>

      {room.isUnassigned ? (
        <div style={{ borderRadius: 11, border: "1px dashed rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.07)", padding: "10px 11px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fde68a" }}>{UNASSIGNED_LABEL}</span>
            <span style={{ fontSize: 10, color: "#fbbf24" }}>غير مخصص</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, lineHeight: 1.6, color: "#d8c7a3" }}>
            {UNASSIGNED_HINT_LONG}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: "#7a9ab8", marginBottom: 2 }}>الوحدة المرتبطة</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {linkedName ?? UNAVAILABLE_LABEL}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#d8b4fe", background: "rgba(168,85,247,0.13)", border: "1px solid rgba(168,85,247,0.28)", borderRadius: 999, padding: "2px 7px" }}>
                {linkedType ?? "وحدة"}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#67e8f9", background: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "2px 7px" }}>
                {sourceValue}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7 }}>
            {metrics.map((metric) => (
              <div key={metric.label} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(255,255,255,0.035)", padding: "7px 6px", textAlign: "center", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: metric.value === UNAVAILABLE_LABEL ? "#7a9ab8" : "#e0f2fe", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metric.value}</div>
                <div style={{ fontSize: 9.5, color: "#6b87ab", marginTop: 4 }}>{metric.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RoomDetailPanel({
  room,
  snapshot,
  employees,
  tasks,
  mappingUnit,
  mappingSource,
  mappingError,
  isDeletingSaved,
  onOpenMapping,
  onClearPreview,
  onClearSaved,
  onClose,
}: {
  room: OfficeRoom;
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  tasks: Task[];
  mappingUnit: PreviewOrgUnit | null;
  mappingSource: MappingSource | null;
  mappingError: string | null;
  isDeletingSaved: boolean;
  onOpenMapping: () => void;
  onClearPreview: () => void;
  onClearSaved: () => void;
  onClose: () => void;
}) {
  const rels     = Array.isArray(snapshot?.relations) ? snapshot!.relations : [];
  const safeEmps = Array.isArray(employees) ? employees : [];
  const safeTsks = Array.isArray(tasks)     ? tasks     : [];

  // Employees in this room
  const roomRelIds = new Set(
    rels.filter((r) => r?.department_id === room.deptId).map((r) => r.employee_id).filter(Boolean),
  );

  // Presence: people resolved with mapping priority (saved > preview > auto).
  const presencePeople = resolveRoomPeople(room, mappingUnit, snapshot, safeEmps);

  // Tasks for room employees
  const roomTasks = safeTsks.filter((t) => t?.assigneeId && roomRelIds.has(t.assigneeId));
  const openTasks    = roomTasks.filter((t) => t?.status !== "مكتملة");
  const overdueTasks = roomTasks.filter((t) => t?.status === "متأخرة");

  const hp = room.healthPct > 0 ? room.healthPct : (room.isAI ? 94 : 0);
  const hpColor = hp >= 85 ? "#10b981" : hp >= 70 ? "#f59e0b" : "#ef4444";

  const ICON_MAP: Record<string, React.ElementType> = { agency: Shield, management: Layers, department: Building2 };
  const TypeIcon = ICON_MAP[room.level] ?? Building2;

  // Local UI-only state. "opened" is a visual preview toggle (no persistence,
  // no access keys, no DB). "advancedOpen" collapses the mapping controls.
  const [opened, setOpened] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Smart office cabinet (read-only). Collapsible so the panel stays compact.
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const presentCount = presencePeople.filter((p) => p.status === "available").length;

  return (
    <div style={{
      borderRadius: 18, border: `1px solid ${room.accentColor}30`,
      background: "rgba(6,14,28,0.95)",
      overflow: "hidden",
      boxShadow: `0 0 30px ${room.accentColor}10, 0 16px 40px rgba(0,0,0,0.40)`,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `${room.accentColor}18`, border: `1px solid ${room.accentColor}30` }}>
            <TypeIcon size={18} color={room.accentColor} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {room.officeNumber ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 28, height: 22, padding: "0 7px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: `1px solid ${room.accentColor}40`,
                  color: "#cbd5e1",
                  fontSize: 10.5, fontWeight: 800, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>{officeLabel(room.officeNumber)}</span>
              ) : null}
              <h3 style={{
                fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2,
                fontStyle: room.isUnassigned ? "italic" : "normal",
                opacity: room.isUnassigned ? 0.85 : 1,
              }}>{room.isUnassigned ? UNASSIGNED_LABEL : room.name}</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              {!room.isUnassigned && (
                <span style={{ fontSize: 10, fontWeight: 600, color: room.accentColor, background: `${room.accentColor}18`, border: `1px solid ${room.accentColor}30`, padding: "1px 7px", borderRadius: 12 }}>{room.type}</span>
              )}
              {room.deptCode && <span style={{ fontSize: 10, color: "#4a6a8a", fontFamily: "monospace" }}>{room.deptCode}</span>}
              {hp > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: hpColor }}>{hp}% · {hpLabel(hp)}</span>}
              {room.isUnassigned && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.30)", padding: "1px 8px", borderRadius: 12 }}>
                  {UNASSIGNED_LABEL}
                </span>
              )}
            </div>
            {room.isUnassigned && (
              <p style={{ fontSize: 11, color: "#8ba3c7", margin: "8px 0 0", lineHeight: 1.55, maxWidth: 520 }}>
                {UNASSIGNED_HINT_LONG}
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", cursor: "pointer", flexShrink: 0 }}>
          <X size={13} color="#8ba3c7" />
        </button>
      </div>

      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <DigitalTwinSnapshot
          room={room}
          mappingUnit={mappingUnit}
          mappingSource={mappingSource}
          openTaskCount={openTasks.length || room.openTasks}
          overdueTaskCount={overdueTasks.length || room.overdueTasks}
          healthPct={hp > 0 ? hp : null}
        />

        {/* Primary action — فتح المكتب (visual preview only, no persistence) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            onClick={() => setOpened((v) => !v)}
            style={{
              width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 14px", borderRadius: 12,
              border: opened ? `1px solid ${room.accentColor}66` : `1px solid ${room.accentColor}40`,
              background: opened ? `${room.accentColor}1f` : `${room.accentColor}12`,
              color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            <DoorOpen size={16} color={room.accentColor} />
            {opened ? "المكتب مفتوح — عرض ما بداخله" : "افتح المكتب"}
          </button>
        </div>

        {/* Tasks summary (stats) */}
        {!room.isUnassigned && (
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "الموظفون", value: room.employeeCount, color: "#22d3ee" },
            { label: "الفرق",    value: room.teamCount,     color: "#a855f7" },
            { label: "المهام",   value: openTasks.length || room.openTasks, color: "#10b981" },
            { label: "المتأخرة", value: overdueTasks.length || room.overdueTasks, color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(255,255,255,0.03)", padding: "8px 12px", textAlign: "center", flex: 1, minWidth: 60 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#4a6a8a", marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        )}

        {/* Manager */}
        {room.managerName && (
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 10, color: "#4a6a8a", margin: "0 0 5px" }}>المدير المسؤول</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: avatarColor(room.managerName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                {nameInitials(room.managerName)}
              </div>
              <span style={{ fontSize: 12, color: "#c0d4ee", fontWeight: 500 }}>{room.managerName}</span>
            </div>
          </div>
        )}

        {/* الموجودون في المكتب — presence list (mapping-aware, preview-only) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 0 6px" }}>
            <p style={{ fontSize: 10, color: "#4a6a8a", margin: 0 }}>الموجودون في المكتب{presencePeople.length > 0 ? ` (${presencePeople.length})` : ""}</p>
            {presencePeople.length > 0 && (
              <span style={{ fontSize: 9, color: "#5a7a9a" }}>{PRESENCE_NOTE}</span>
            )}
          </div>
          {presencePeople.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {presencePeople.slice(0, 8).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "6px 9px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                      {p.initials}
                    </div>
                    <span style={{ position: "absolute", bottom: -1, insetInlineEnd: -1, width: 9, height: 9, borderRadius: "50%", background: p.statusColor, border: "2px solid rgba(6,14,28,0.95)" }} aria-hidden />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#c0d4ee", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    {p.roleOrUnit && <div style={{ fontSize: 9.5, color: "#5a7a9a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.roleOrUnit}</div>}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 600, color: p.statusColor, background: `${p.statusColor}1a`, border: `1px solid ${p.statusColor}33`, padding: "2px 7px", borderRadius: 999 }}>{p.statusLabel}</span>
                </div>
              ))}
              {presencePeople.length > 8 && (
                <span style={{ fontSize: 10, color: "#4a6a8a" }}>+{presencePeople.length - 8} آخرون</span>
              )}
            </div>
          ) : (
            <div style={{ borderRadius: 8, border: "1px dashed rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "10px 12px", fontSize: 11, color: "#6b87ab", textAlign: "center" }}>
              لا يوجد أعضاء مرتبطون بهذا المكتب حاليًا.
            </div>
          )}
        </div>

        {/* Office previews — read-only, derived from existing data only */}
        {opened && (
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* قاعة الاجتماعات — preview */}
            <div style={{ borderRadius: 10, border: "1px solid rgba(34,211,238,0.16)", background: "rgba(34,211,238,0.05)", padding: "10px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color="#22d3ee" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#cfeffd" }}>قاعة الاجتماعات</span>
              </div>
              <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 4 }}>معاينة — لا يوجد اجتماع مجدول حاليًا</div>
            </div>

            {/* خزانة المكتب — smart read-only cabinet (collapsible, compact) */}
            <div style={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setCabinetOpen((v) => !v)}
                aria-expanded={cabinetOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 11px", background: "transparent", border: "none", cursor: "pointer", textAlign: "start" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Archive size={13} color="#8ba3c7" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c0d4ee" }}>خزانة المكتب</span>
                  <span style={{ fontSize: 9.5, color: "#5a7a9a" }}>ملخص تشغيلي</span>
                </span>
                <ChevronDown size={14} color="#8ba3c7" style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: cabinetOpen ? "rotate(180deg)" : "none" }} />
              </button>

              {cabinetOpen && (
                <div style={{ padding: "0 11px 11px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Office identity */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 9.5, color: "#cfd9ea", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 999 }}>{room.name}</span>
                    {mappingUnit?.name && (
                      <span style={{ fontSize: 9.5, color: "#86efac", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)", padding: "2px 8px", borderRadius: 999 }}>{mappingUnit.name}</span>
                    )}
                    {(mappingUnit?.typeLabel || room.type) && (
                      <span style={{ fontSize: 9.5, color: "#8ba3c7", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "2px 8px", borderRadius: 999 }}>{mappingUnit?.typeLabel || room.type}</span>
                    )}
                  </div>

                  {/* Cabinet item rows — read-only summaries from existing data */}
                  {[
                    { Icon: Users,    color: "#22d3ee", label: "ملف الفريق",     value: `${room.employeeCount} عضو · ${presentCount} متاح` },
                    { Icon: Activity, color: "#10b981", label: "ملف المهام",     value: `${openTasks.length || room.openTasks} مفتوحة · ${overdueTasks.length || room.overdueTasks} متأخرة` },
                    { Icon: Heart,    color: hp >= 85 ? "#10b981" : hp >= 70 ? "#f59e0b" : "#ef4444", label: "ملف المؤشرات", value: hp > 0 ? `صحة المكتب ${hp}%` : "غير متاح" },
                    { Icon: Calendar, color: "#a855f7", label: "ملف الاجتماعات", value: "لا اجتماع مجدول حاليًا" },
                  ].map(({ Icon, color, label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "7px 9px" }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0, background: `${color}1a`, border: `1px solid ${color}33` }}>
                        <Icon size={12} color={color} />
                      </span>
                      <span style={{ fontSize: 11, color: "#c0d4ee", fontWeight: 600, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 10, color: "#7e96b4", marginInlineStart: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                    </div>
                  ))}

                  <p style={{ margin: 0, fontSize: 9, color: "#5a6f8a", lineHeight: 1.6 }}>
                    الخزانة تعرض ملخصًا تشغيليًا من بيانات المكتب الحالية. حفظ الملفات والمرفقات سيضاف لاحقًا.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teams */}
        {room.teams.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 10, color: "#4a6a8a", margin: "0 0 6px" }}>الفرق ({room.teamCount})</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {room.teams.map((team) => (
                <span key={team.id} style={{ fontSize: 10, color: "#8ba3c7", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "3px 8px", borderRadius: 8 }}>
                  <LayoutGrid size={9} style={{ display: "inline", marginLeft: 4 }} />
                  {team.name} · {team.memberCount}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent overdue tasks */}
        {overdueTasks.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 10, color: "#ef4444", margin: "0 0 6px" }}>مهام متأخرة ({overdueTasks.length})</p>
            {overdueTasks.slice(0, 3).map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <AlertCircle size={11} color="#ef4444" />
                <span style={{ fontSize: 11, color: "#c0d4ee", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* إدارة المكتب — advanced controls collapsed behind one button.
            Mapping save/preview/delete logic is unchanged; only its visibility
            is gated here to reduce noise. */}
        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            style={{
              width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 12px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)",
              color: "#b0c8e0", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Settings2 size={13} />
            إدارة المكتب
            <ChevronDown size={14} style={{ transition: "transform 0.2s ease", transform: advancedOpen ? "rotate(180deg)" : "none" }} />
          </button>

          {advancedOpen && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {mappingUnit && mappingSource && (
                <div style={{ borderRadius: 14, border: mappingSource === "saved" ? "1px solid rgba(34,211,238,0.28)" : mappingSource === "preview" ? "1px solid rgba(16,185,129,0.26)" : "1px solid rgba(168,85,247,0.22)", background: mappingSource === "saved" ? "rgba(34,211,238,0.08)" : mappingSource === "preview" ? "rgba(16,185,129,0.08)" : "rgba(168,85,247,0.07)", padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 800, color: mappingSource === "saved" ? "#67e8f9" : mappingSource === "preview" ? "#86efac" : "#d8b4fe", background: mappingSource === "saved" ? "rgba(34,211,238,0.12)" : mappingSource === "preview" ? "rgba(16,185,129,0.12)" : "rgba(168,85,247,0.12)", border: mappingSource === "saved" ? "1px solid rgba(34,211,238,0.25)" : mappingSource === "preview" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(168,85,247,0.24)", padding: "2px 8px", borderRadius: 999 }}>
                        <MapPin size={11} />
                        {mappingSource === "saved" ? "ربط محفوظ" : mappingSource === "preview" ? "ربط تجريبي" : "ربط تلقائي من الهيكل"}
                      </span>
                      <p style={{ margin: "7px 0 0", color: mappingSource === "saved" ? "#cffafe" : mappingSource === "preview" ? "#d1fae5" : "#ede9fe", fontSize: 13, fontWeight: 750 }}>{mappingUnit.name}</p>
                      {mappingSource === "preview" && (
                        <p style={{ margin: "3px 0 0", color: "#7aa6a0", fontSize: 11 }}>
                          هذا التخصيص للمعاينة فقط ولن يتم حفظه.
                        </p>
                      )}
                    </div>
                    {mappingSource === "preview" && (
                      <button type="button" onClick={onClearPreview} style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "#b0c8e0", borderRadius: 10, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>
                        إلغاء المعاينة
                      </button>
                    )}
                    {mappingSource === "saved" && (
                      <button type="button" onClick={onClearSaved} disabled={isDeletingSaved} style={{ border: "1px solid rgba(239,68,68,0.24)", background: "rgba(239,68,68,0.08)", color: "#fecaca", borderRadius: 10, padding: "7px 10px", fontSize: 11, cursor: isDeletingSaved ? "wait" : "pointer", opacity: isDeletingSaved ? 0.65 : 1 }}>
                        {isDeletingSaved ? "جارٍ الإلغاء..." : "إلغاء الربط المحفوظ"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {mappingError && (
                <div style={{ borderRadius: 12, border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)", color: "#fecaca", fontSize: 11, lineHeight: 1.6, padding: "8px 10px" }}>
                  {mappingError}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={onOpenMapping}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 10,
                    border: "1px solid rgba(139,92,246,0.36)",
                    background: "rgba(139,92,246,0.10)",
                    color: "#d8b4fe",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Layers size={12} />
                  تخصيص ربط المكتب
                </button>
                <span style={{ fontSize: 10, color: "#2a4060" }}>
                  محفوظ / تجريبي / تلقائي حسب أولوية الربط
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, Icon, iconBg }: {
  label: string; value: string | number; sub?: string;
  Icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="flex-shrink-0 min-w-[118px]" style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg }}>
        <Icon size={15} color="#fff" />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600, lineHeight: 1 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: "#4a6a8a", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  const items = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return [...safeTasks].filter((t) => t?.title).slice(0, 5).map((t, i) => ({
      id: t.id ?? `a${i}`, title: t.title, status: t.status ?? "",
      room: rooms[i % Math.max(rooms.length, 1)]?.name ?? "—",
      ago: t.createdAt || t.dueDate || "—",
    }));
  }, [tasks, rooms]);

  const DOT_COLOR: Record<string, string> = { "متأخرة": "#ef4444", "مكتملة": "#10b981", "قيد_التنفيذ": "#f59e0b" };

  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={14} color="#22d3ee" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>النشاط داخل المكتب التنفيذي</span>
        </div>
        <Link href="/tasks" style={{ fontSize: 10, color: "#3a5a7a", textDecoration: "none" }}>› الكل</Link>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.length === 0 ? (
          <li style={{ padding: "10px 16px", color: "#3a5a7a", fontSize: 11 }}>
            لا توجد أنشطة حالية داخل المكتب التنفيذي.
          </li>
        ) : (
          items.map((item, i) => (
            <li key={item.id} style={{ padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: DOT_COLOR[item.status] ?? "#22d3ee", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "#b0c8e0", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                <p style={{ fontSize: 10, color: "#3a5a7a", margin: "2px 0 0" }}>{item.room}</p>
              </div>
              <span style={{ fontSize: 10, color: "#2a4060", flexShrink: 0 }}>{item.ago === "—" ? "—" : item.ago}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ─── Meeting Rooms Panel ──────────────────────────────────────────────────────

function MeetingRoomsPanel() {
  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={14} color="#a855f7" /><span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>غرف الاجتماعات التنفيذية</span></div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض التقويم</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        <li style={{ padding: "10px 16px", color: "#3a5a7a", fontSize: 11 }}>
          لا توجد اجتماعات مجدولة حالياً.
        </li>
      </ul>
    </div>
  );
}

// ─── AI Alerts Panel ──────────────────────────────────────────────────────────

function AIAlertsPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  type AlertItem = { id: string; type: string; text: string; room: string; Icon: React.ElementType; };
  const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    "تنبيه": { bg: "rgba(245,158,11,0.14)", color: "#fbbf24", border: "rgba(245,158,11,0.28)" },
    "تحذير": { bg: "rgba(245,158,11,0.18)", color: "#f59e0b", border: "rgba(245,158,11,0.32)" },
    "حاد":   { bg: "rgba(239,68,68,0.14)",  color: "#f87171", border: "rgba(239,68,68,0.28)"  },
    "توصية": { bg: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  };

  const alerts: AlertItem[] = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const overdue   = safeTasks.filter((t) => t?.status === "متأخرة");
    const pending   = safeTasks.filter((t) => t?.status === "بانتظار_المراجعة");
    const result: AlertItem[] = [];
    if (overdue.length > 0) result.push({ id: "a1", type: "تحذير", text: `${overdue.length} مهام متأخرة في ${rooms[0]?.name ?? "الأقسام"}`, room: rooms[0]?.name ?? "—", Icon: AlertTriangle });
    if (pending.length > 0) result.push({ id: "a2", type: "حاد", text: `${pending.length} مهام بانتظار المراجعة`, room: rooms[1]?.name ?? "—", Icon: AlertCircle });
    return result;
  }, [tasks, rooms]);

  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BrainCircuit size={14} color="#22d3ee" /><span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>تنبيهات المكتب الذكي</span></div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض الكل</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alerts.length === 0 ? (
          <li style={{ padding: "10px 16px", color: "#3a5a7a", fontSize: 11 }}>
            لا توجد تنبيهات حالية.
          </li>
        ) : alerts.slice(0, 4).map((alert, i) => {
          const ts = TYPE_STYLE[alert.type] ?? TYPE_STYLE["تنبيه"]!;
          const AlertIcon = alert.Icon;
          return (
            <li key={alert.id} style={{ padding: "10px 16px", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)" }}>
                <AlertIcon size={13} color={ts.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, display: "inline-block", marginBottom: 4 }}>{alert.type}</span>
                <p style={{ fontSize: 11, color: "#b0c8e0", margin: 0, lineHeight: 1.4 }}>{alert.text}</p>
                <p style={{ fontSize: 10, color: "#2a4060", margin: "2px 0 0" }}>{alert.room}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type OfficeControlEntry = {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource: MappingSource | null;
};

type ExecutiveBrainSnapshot = {
  linkedOfficeCount: number;
  unassignedOfficeCount: number;
  mappingCompletionPct: number;
  linkedOrgUnitCount: number;
  structureStatus: string;
  recommendation: string;
};

function ExecutiveBrainPanel({
  brain,
  compact = false,
}: {
  brain: ExecutiveBrainSnapshot;
  compact?: boolean;
}) {
  const metrics = [
    { label: "عدد المكاتب المرتبطة", value: brain.linkedOfficeCount, color: "#22d3ee" },
    { label: "عدد المكاتب غير المخصصة", value: brain.unassignedOfficeCount, color: brain.unassignedOfficeCount > 0 ? "#f59e0b" : "#10b981" },
    { label: "نسبة اكتمال الربط", value: `${brain.mappingCompletionPct}%`, color: "#10b981" },
    { label: "عدد الإدارات/الأقسام المرتبطة بالمكاتب", value: brain.linkedOrgUnitCount, color: "#c4b5fd" },
    { label: "آخر حالة للهيكل الإداري", value: brain.structureStatus, color: "#bae6fd" },
  ];

  return (
    <div style={{ borderRadius: compact ? 11 : 13, border: "1px solid rgba(34,211,238,0.18)", background: "linear-gradient(135deg, rgba(34,211,238,0.075), rgba(168,85,247,0.07))", padding: compact ? 9 : 12, display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#e0f2fe", fontSize: compact ? 11.5 : 13, fontWeight: 900 }}>
          <BrainCircuit size={compact ? 13 : 15} color="#67e8f9" />
          العقل التنفيذي
        </span>
        <span style={{ fontSize: 9, color: "#93c5fd", border: "1px solid rgba(147,197,253,0.22)", background: "rgba(147,197,253,0.08)", borderRadius: 999, padding: "1px 7px" }}>
          تحكم آمن
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(130px, 1fr))", gap: 7 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ borderRadius: 9, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(255,255,255,0.035)", padding: "7px 6px", minWidth: 0 }}>
            <div style={{ fontSize: compact ? 12 : 14, fontWeight: 900, color: metric.color, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metric.value}</div>
            <div style={{ fontSize: 9, color: "#8ba3c7", marginTop: 4, lineHeight: 1.35 }}>{metric.label}</div>
          </div>
        ))}
      </div>

      {brain.unassignedOfficeCount > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7, borderRadius: 10, border: "1px solid rgba(245,158,11,0.22)", background: "rgba(245,158,11,0.08)", padding: "7px 8px" }}>
          <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: compact ? 10 : 11, color: "#fde68a", lineHeight: 1.6 }}>
            توجد مكاتب غير مخصصة وتحتاج إلى استكمال الربط.
          </span>
        </div>
      )}

      <p style={{ margin: 0, fontSize: compact ? 10 : 11.5, color: "#c8ddf0", lineHeight: 1.7 }}>
        {brain.recommendation}
      </p>
      <p style={{ margin: 0, fontSize: 9, color: "#5a7a9a", lineHeight: 1.5 }}>
        ملخص محسوب من بيانات الواجهة الحالية فقط، بدون ذكاء اصطناعي أو حفظ بيانات.
      </p>
    </div>
  );
}

function OfficeControlPanel({
  entries,
  linkedOfficeCount,
  unassignedOfficeCount,
  mappingCompletionPct,
  executiveBrain,
  deletingRoomKey,
  onSelectRoom,
  onOpenMapping,
  onClearPreview,
  onClearSaved,
}: {
  entries: OfficeControlEntry[];
  linkedOfficeCount: number;
  unassignedOfficeCount: number;
  mappingCompletionPct: number;
  executiveBrain: ExecutiveBrainSnapshot;
  deletingRoomKey: ExecutiveOfficeFixedRoomKey | null;
  onSelectRoom: (room: OfficeRoom) => void;
  onOpenMapping: (room: OfficeRoom) => void;
  onClearPreview: (room: OfficeRoom) => void;
  onClearSaved: (room: OfficeRoom) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section style={{ borderRadius: 18, border: "1px solid rgba(34,211,238,0.18)", background: "rgba(6,14,28,0.88)", overflow: "hidden", boxShadow: "0 18px 42px rgba(0,0,0,0.25)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", border: "none", background: "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(168,85,247,0.08))", cursor: "pointer", textAlign: "start" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: 11, display: "grid", placeItems: "center", background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.24)", flexShrink: 0 }}>
            <Settings2 size={16} color="#67e8f9" />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 850, color: "#fff" }}>إدارة المكاتب</span>
            <span style={{ display: "block", fontSize: 10.5, color: "#7a9ab8", marginTop: 2 }}>تحكم آمن في ربط المكاتب 01-09 باستخدام تدفق الربط الحالي</span>
          </span>
        </span>
        <ChevronDown size={18} color="#8ba3c7" style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
          {entries.map(({ room, mappingUnit, mappingSource }) => {
            const mapped = Boolean(mappingUnit);
            const isDeleting = deletingRoomKey === room.fixedRoomKey;
            const canClear = mappingSource === "saved" || mappingSource === "preview";
            return (
              <article key={room.id} style={{ borderRadius: 13, border: mapped ? `1px solid ${room.accentColor}30` : "1px solid rgba(245,158,11,0.20)", background: mapped ? "rgba(255,255,255,0.035)" : "rgba(245,158,11,0.055)", padding: 11, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#cbd5e1", background: "rgba(255,255,255,0.06)", border: `1px solid ${room.accentColor}35`, borderRadius: 8, padding: "2px 7px" }}>
                        {room.officeNumber ? officeLabel(room.officeNumber) : "مكتب"}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: mapped ? "#86efac" : "#fbbf24", background: mapped ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.10)", border: mapped ? "1px solid rgba(16,185,129,0.22)" : "1px solid rgba(245,158,11,0.24)", borderRadius: 999, padding: "2px 7px" }}>
                        {mapped ? "مرتبط" : "غير مخصص"}
                      </span>
                    </div>
                    <p style={{ margin: "7px 0 0", fontSize: 12.5, fontWeight: 800, color: mapped ? "#fff" : "#fde68a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mapped ? mappingUnit!.name : UNASSIGNED_LABEL}
                    </p>
                    {mapped ? (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                        <span style={{ fontSize: 9.5, color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.22)", background: "rgba(168,85,247,0.07)", borderRadius: 999, padding: "1px 7px" }}>{mappingUnit?.typeLabel ?? "غير متاح"}</span>
                        {mappingSource && <span style={{ fontSize: 9.5, color: "#67e8f9", border: "1px solid rgba(34,211,238,0.22)", background: "rgba(34,211,238,0.07)", borderRadius: 999, padding: "1px 7px" }}>{mappingSourceValue(mappingSource)}</span>}
                      </div>
                    ) : (
                      <p style={{ margin: "5px 0 0", fontSize: 10.5, lineHeight: 1.55, color: "#d8c7a3" }}>
                        اختر إدارة أو قسم من الهيكل الإداري لربط هذا المكتب.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room)}
                    style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", borderRadius: 9, padding: "5px 7px", fontSize: 9.5, cursor: "pointer", flexShrink: 0 }}
                  >
                    عرض
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onOpenMapping(room)}
                    style={{ border: "1px solid rgba(139,92,246,0.30)", background: "rgba(139,92,246,0.09)", color: "#d8b4fe", borderRadius: 9, padding: "6px 9px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                  >
                    {mapped ? "تغيير الربط" : "ربط المكتب"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mappingSource === "saved") onClearSaved(room);
                      if (mappingSource === "preview") onClearPreview(room);
                    }}
                    disabled={!canClear || isDeleting}
                    title={mappingSource === "auto" ? "الربط التلقائي لا يُحذف، ويمكن تغييره بربط محفوظ أو تجريبي." : undefined}
                    style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)", color: canClear ? "#fecaca" : "rgba(254,202,202,0.42)", borderRadius: 9, padding: "6px 9px", fontSize: 10, fontWeight: 800, cursor: !canClear || isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.7 : 1 }}
                  >
                    {isDeleting ? "جارٍ الحذف..." : "حذف الربط"}
                  </button>
                </div>
              </article>
            );
          })}

        </div>
      )}
    </section>
  );
}

export default function VirtualOfficeDesign({
  snapshot, employees, tasks, orgName, orgCode,
  onBackToOrg, onRefresh, isRefreshing = false,
}: VirtualOfficeDesignProps) {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<OfficeRoom | null>(null);
  const [controlModalRoom, setControlModalRoom] = useState<OfficeRoom | null>(null);
  const [mappingModalRoom, setMappingModalRoom] = useState<OfficeRoom | null>(null);
  const [previewMappings, setPreviewMappings] = useState<Record<string, PreviewOrgUnit>>({});
  const [savedMappings, setSavedMappings] = useState<ExecutiveOfficeRoomMappingByRoom>({});
  const [mappingErrorByRoom, setMappingErrorByRoom] = useState<Record<string, string>>({});
  const [savingRoomKey, setSavingRoomKey] = useState<ExecutiveOfficeFixedRoomKey | null>(null);
  const [deletingRoomKey, setDeletingRoomKey] = useState<ExecutiveOfficeFixedRoomKey | null>(null);
  const [roomStates, setRoomStates] = useState<Record<string, OfficeRoomState>>({});
  const [updatingRoomKey, setUpdatingRoomKey] = useState<string | null>(null);

  const isManager = user?.role === "organization_manager" || user?.role === "super_admin";

  const { rooms, isDemo } = useMemo(
    () => buildOfficeRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  const safeDepts = useMemo(() => Array.isArray(snapshot?.departments) ? snapshot!.departments : [], [snapshot]);
  const safeRels  = useMemo(() => Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [], [snapshot]);
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);
  const safeEmps  = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);
  const previewOrgUnits = useMemo(
    () => buildPreviewOrgUnits(snapshot, safeTasks),
    [snapshot, safeTasks],
  );

  // Presence overlay: replace each real room's avatars/count with mapping-aware
  // presence people (saved > preview > auto). Demo/placeholder rooms and rooms
  // with no resolvable people are left exactly as-is (no regression).
  //
  // EXECUTIVE-OFFICE-NUMBERED-EMPTY-OFFICES-1: also fold in the resolved
  // display name. If a mapping resolves (saved/preview/auto) we surface the
  // unit name; otherwise placeholder rooms keep "مكتب XX" + isUnassigned so
  // the manager sees clean empty offices, never fake departments.
  const roomsWithPresence = useMemo(() => {
    return rooms.map((room) => {
      const { unit } = resolveRoomMapping({ room, units: previewOrgUnits, savedMappings, previewMappings });
      const hasMapping = Boolean(unit);
      // Board (slot 4) always keeps its fixed name regardless of any mapping.
      const isUnassigned = !room.isCenter && !hasMapping && room.isDemo === true;
      const displayName = room.isCenter
        ? "مكتب مجلس الإدارة"
        : (unit?.name ?? (isUnassigned ? UNASSIGNED_LABEL : room.name));

      const base: OfficeRoom = {
        ...room,
        name: displayName,
        isUnassigned,
      };

      if (room.isDemo) return base;

      const people = resolveRoomPeople(room, unit, snapshot, safeEmps);
      if (people.length === 0) return base;
      return {
        ...base,
        employeeCount: people.length,
        avatars: people.slice(0, 3).map((p) => ({ initials: p.initials, color: p.color, statusColor: p.statusColor })),
      };
    });
  }, [rooms, previewOrgUnits, savedMappings, previewMappings, snapshot, safeEmps]);

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

  const clearPreviewForRoom = useCallback((room: OfficeRoom) => {
    setPreviewMappings((prev) => {
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
      clearPreviewForRoom(room);
      setSelectedRoom(room);
      setMappingModalRoom(null);
    } catch (err) {
      setMappingErrorByRoom((prev) => ({
        ...prev,
        [room.id]: safeRoomMappingErrorMessage(err),
      }));
    } finally {
      setSavingRoomKey(null);
    }
  }, [clearPreviewForRoom, clearRoomMappingError]);

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
      clearPreviewForRoom(room);
    } catch (err) {
      setMappingErrorByRoom((prev) => ({
        ...prev,
        [room.id]: safeRoomMappingErrorMessage(err),
      }));
    } finally {
      setDeletingRoomKey(null);
    }
  }, [clearPreviewForRoom, clearRoomMappingError]);

  const confirmDeleteSavedMapping = useCallback((room: OfficeRoom) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("هل تريد حذف ربط هذا المكتب؟ سيعود المكتب إلى حالة غير مخصص.")
    ) {
      return;
    }

    void handleDeleteSavedMapping(room);
  }, [handleDeleteSavedMapping]);

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

  const overdueTasks = safeTasks.filter((t) => t?.status === "متأخرة").length;
  const activeEmps   = safeRels.length;
  const deptCount    = safeDepts.length;

  const avgHealth = useMemo(() => {
    const hr = rooms.filter((r) => r.healthPct > 0);
    return hr.length === 0 ? 82 : Math.round(hr.reduce((s, r) => s + r.healthPct, 0) / hr.length);
  }, [rooms]);

  const kpis = [
    { label: "صحة المكتب",       value: `${avgHealth}%`, sub: hpLabel(avgHealth),                          Icon: Heart,        iconBg: "rgba(16,185,129,0.28)" },
    { label: "الوحدات",          value: deptCount,        sub: undefined,                                   Icon: LayoutGrid,   iconBg: "rgba(34,211,238,0.25)" },
    { label: "الموظفون النشطون", value: activeEmps, sub: `من ${safeEmps.length}`,                           Icon: Users,        iconBg: "rgba(59,130,246,0.25)" },
    { label: "المهام المتأخرة",  value: overdueTasks, sub: "مهمة",                                         Icon: AlertCircle,  iconBg: "rgba(245,158,11,0.28)" },
  ];

  const isEmpty = safeDepts.length === 0 && !isDemo;

  const linkedOfficeCount = roomsWithPresence.filter((room) => !room.isUnassigned).length;
  const unassignedOfficeCount = roomsWithPresence.filter((room) => room.isUnassigned).length;
  const mappingCompletionPct = roomsWithPresence.length > 0
    ? Math.round((linkedOfficeCount / roomsWithPresence.length) * 100)
    : 0;
  const officeControlEntries = useMemo<OfficeControlEntry[]>(
    () => roomsWithPresence.map((room) => {
      const mapping = resolveRoomMapping({
        room,
        units: previewOrgUnits,
        savedMappings,
        previewMappings,
      });
      return {
        room,
        mappingUnit: mapping.unit,
        mappingSource: mapping.source,
      };
    }),
    [roomsWithPresence, previewOrgUnits, savedMappings, previewMappings],
  );
  const executiveBrain = useMemo<ExecutiveBrainSnapshot>(() => {
    const linkedOrgUnitIds = new Set(
      officeControlEntries
        .map((entry) => entry.mappingUnit)
        .filter((unit): unit is PreviewOrgUnit => unit != null)
        .map((unit) => `${unit.type}:${unit.id}`),
    );
    const structureItemCount =
      safeDepts.length +
      (Array.isArray(snapshot?.teams) ? snapshot!.teams.length : 0) +
      (Array.isArray(snapshot?.positions) ? snapshot!.positions.length : 0) +
      safeRels.length;
    const recommendation = linkedOfficeCount === 0
      ? "لم يتم ربط أي مكتب بعد. ابدأ بربط الإدارات الأساسية."
      : unassignedOfficeCount > 0
        ? "يوجد مكاتب غير مخصصة. يفضل إكمال الربط قبل اعتماد المكتب الافتراضي."
        : "اكتمل ربط المكاتب التشغيلية. المكتب الافتراضي جاهز للمراجعة التنفيذية.";

    return {
      linkedOfficeCount,
      unassignedOfficeCount,
      mappingCompletionPct,
      linkedOrgUnitCount: linkedOrgUnitIds.size,
      structureStatus: structureItemCount > 0 ? "متاح من الهيكل الحالي" : UNAVAILABLE_LABEL,
      recommendation,
    };
  }, [officeControlEntries, linkedOfficeCount, unassignedOfficeCount, mappingCompletionPct, safeDepts.length, safeRels.length, snapshot]);

  // Compact mobile feed (max 2 each) — derived, no fetches.
  const mobileActivity = useMemo(() => {
    const fromTasks = safeTasks
      .filter((t) => t?.title)
      .slice(0, 2)
      .map((t, i) => ({
        id: t.id ?? `m-a-${i}`,
        title: t.title,
        room: rooms[i % Math.max(rooms.length, 1)]?.name ?? "—",
        ago: t.createdAt || t.dueDate || "—",
      }));
    return fromTasks;
  }, [safeTasks, rooms]);

  const mobileMeetings = useMemo(() => {
    const list: Array<{ id: string; name: string; status: string }> = [];
    return list;
  }, []);

  const mobileAlerts = useMemo(() => {
    const overdue = safeTasks.filter((t) => t?.status === "متأخرة");
    if (overdue.length > 0) {
      return [
        { id: "mal1", type: "تحذير", text: `${overdue.length} مهام متأخرة في ${rooms[0]?.name ?? "الأقسام"}`, room: rooms[0]?.name ?? "—" },
        { id: "mal2", type: "حاد",   text: "تحقق من تكليفات المهام المتأخرة", room: rooms[1]?.name ?? "—" },
      ];
    }
    return [];
  }, [safeTasks, rooms]);

  const selectedMapping = selectedRoom
    ? resolveRoomMapping({
        room: selectedRoom,
        units: previewOrgUnits,
        savedMappings,
        previewMappings,
      })
    : { unit: null, source: null as MappingSource | null };

  const selectedPeople = useMemo(
    () => (selectedRoom ? resolveRoomPeople(selectedRoom, selectedMapping.unit, snapshot, safeEmps) : []),
    [selectedRoom, selectedMapping.unit, snapshot, safeEmps],
  );

  const modalCurrentMapping = mappingModalRoom
    ? resolveRoomMapping({
        room: mappingModalRoom,
        units: previewOrgUnits,
        savedMappings,
        previewMappings,
      })
    : { unit: null, source: null as MappingSource | null };

  const modalSaveError = mappingModalRoom ? mappingErrorByRoom[mappingModalRoom.id] ?? null : null;
  const selectedMappingError = selectedRoom ? mappingErrorByRoom[selectedRoom.id] ?? null : null;

  return (
    <div className="space-y-5 min-w-0" dir="rtl">

      {/* ── Header ── */}
      <section style={{ position: "relative", overflow: "hidden", borderRadius: 20, border: "1px solid rgba(34,211,238,0.18)", padding: "20px 22px", background: "linear-gradient(135deg, rgba(6,15,30,0.98) 0%, rgba(18,36,68,0.96) 55%, rgba(50,16,80,0.14) 100%)", boxShadow: "0 0 70px rgba(34,211,238,0.05)" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.09), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.20)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.32)" }}>BETA</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>المكتب التنفيذي الافتراضي</h1>
            <p style={{ fontSize: 13, color: "#7a9ab8", marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>مساحة عمل تفاعلية مستوحاة من أسلوب المكاتب الافتراضية، مبنية من هيكل منشأتك.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={onBackToOrg} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "#8ba3c7", fontSize: 13, cursor: "pointer" }}>
              <ArrowRight size={14} /> رجوع للهيكل
            </button>
            <button type="button" onClick={onRefresh} disabled={isRefreshing || !onRefresh} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "1px solid rgba(34,211,238,0.25)", background: "rgba(34,211,238,0.08)", color: "#22d3ee", fontSize: 13, cursor: "pointer", opacity: (isRefreshing || !onRefresh) ? 0.5 : 1 }}>
              <RefreshCw size={14} style={isRefreshing ? { animation: "spin 1s linear infinite" } : undefined} /> مزامنة من الهيكل
            </button>
            <button type="button" disabled style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.22)", background: "rgba(139,92,246,0.07)", color: "rgba(168,85,247,0.50)", fontSize: 13, cursor: "not-allowed" }}>
              <BrainCircuit size={14} /> تقرير AI
            </button>
          </div>
        </div>
      </section>

      {/* ── Workspace Identity Strip ── */}
      <WorkspaceIdentityStrip orgName={orgName} orgCode={orgCode} snapshot={snapshot} employees={safeEmps} />

      <OfficeControlPanel
        entries={officeControlEntries}
        linkedOfficeCount={linkedOfficeCount}
        unassignedOfficeCount={unassignedOfficeCount}
        mappingCompletionPct={mappingCompletionPct}
        executiveBrain={executiveBrain}
        deletingRoomKey={deletingRoomKey}
        onSelectRoom={(room) => setSelectedRoom(room)}
        onOpenMapping={(room) => {
          clearRoomMappingError(room);
          setSelectedRoom(room);
          setMappingModalRoom(room);
        }}
        onClearPreview={(room) => clearPreviewForRoom(room)}
        onClearSaved={(room) => confirmDeleteSavedMapping(room)}
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
          {/* ── Desktop scene (sm+) ── */}
          <div className="hidden sm:block space-y-5">
            {/* Section clarity: the 8 map rooms are the operational offices,
                distinct from the off-map Board/Executive office above. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LayoutGrid size={15} color="#22d3ee" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>المكاتب التشغيلية</span>
              </div>
              <span style={{ fontSize: 11, color: "#5a7a9a" }}>اختر مكتبًا من المخطط ثم اضغط «افتح المكتب».</span>
            </div>
            <VirtualOfficeReferenceScene
              rooms={roomsWithPresence}
              selectedRoomId={selectedRoom?.id ?? null}
              onRoomClick={(r) => {
                const officeRoom = r as OfficeRoom;
                setSelectedRoom(prev => prev?.id === r.id ? null : officeRoom);
                setControlModalRoom(officeRoom);
              }}
            />
            {selectedRoom && (
              <RoomDetailPanel
                room={selectedRoom}
                snapshot={snapshot}
                employees={safeEmps}
                tasks={safeTasks}
                mappingUnit={selectedMapping.unit}
                mappingSource={selectedMapping.source}
                mappingError={selectedMappingError}
                isDeletingSaved={deletingRoomKey === selectedRoom.fixedRoomKey}
                onOpenMapping={() => setMappingModalRoom(selectedRoom)}
                onClearPreview={() => clearPreviewForRoom(selectedRoom)}
                onClearSaved={() => confirmDeleteSavedMapping(selectedRoom)}
                onClose={() => setSelectedRoom(null)}
              />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ alignItems: "start" }}>
              <ActivityPanel tasks={safeTasks} rooms={rooms} />
              <MeetingRoomsPanel />
              <AIAlertsPanel tasks={safeTasks} rooms={rooms} />
            </div>
          </div>

          {/* ── Mobile console (xs only) ── */}
          <div
            className="sm:hidden"
            style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom))" }}
          >
            <MobileExecutiveOfficeScene
              rooms={roomsWithPresence}
              selectedRoom={selectedRoom}
              people={selectedPeople}
              onRoomClick={(r) => setSelectedRoom(prev => prev?.id === r.id ? null : r as OfficeRoom)}
              mappingUnit={selectedMapping.unit}
              mappingSource={selectedMapping.source}
              mappingError={selectedMappingError}
              isDeletingSaved={selectedRoom ? deletingRoomKey === selectedRoom.fixedRoomKey : false}
              onOpenMapping={() => selectedRoom && setMappingModalRoom(selectedRoom)}
              onClearPreview={() => selectedRoom && clearPreviewForRoom(selectedRoom)}
              onClearSaved={() => selectedRoom && confirmDeleteSavedMapping(selectedRoom)}
              activity={mobileActivity}
              meetings={mobileMeetings}
              alerts={mobileAlerts}
            />
          </div>
        </>
      )}

      {/* ── KPI summary (below the map — keeps the office image central) ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {kpis.map((k) => <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} Icon={k.Icon} iconBg={k.iconBg} />)}
      </div>

      <p style={{ fontSize: 10, color: "#1e3050", textAlign: "center", paddingBottom: 8 }}>
        حالة المكتب محفوظة · إدارة المكاتب · يعتمد على بيانات المنشأة
      </p>
      {controlModalRoom && !mappingModalRoom && (() => {
        const controlMapping = resolveRoomMapping({ room: controlModalRoom, units: previewOrgUnits, savedMappings, previewMappings });
        const openCount = ROOM_KEYS_BY_SLOT.filter((k) => k !== "board").filter((k) => (roomStates[k]?.is_open ?? true)).length;
        const closedCount = ROOM_KEYS_BY_SLOT.filter((k) => k !== "board").length - openCount;
        const boardStats: BoardOfficeStats = {
          totalOffices: roomsWithPresence.length,
          linkedOfficeCount,
          unassignedOfficeCount,
          openCount,
          closedCount,
        };
        return (
          <OfficeControlModal
            key={controlModalRoom.id}
            room={controlModalRoom}
            roomState={roomStates[controlModalRoom.fixedRoomKey] ?? null}
            isManager={isManager}
            mappingUnit={controlMapping.unit}
            mappingSource={controlMapping.source}
            isUpdating={updatingRoomKey === controlModalRoom.fixedRoomKey || updatingRoomKey === "bulk"}
            boardStats={controlModalRoom.isCenter ? boardStats : null}
            onClose={() => setControlModalRoom(null)}
            onOpenMapping={() => {
              clearRoomMappingError(controlModalRoom);
              setMappingModalRoom(controlModalRoom);
            }}
            onToggleOpen={(is_open) => void handleToggleRoomOpen(controlModalRoom, is_open)}
            onOpenAll={() => void handleBulkToggle(true)}
            onCloseAll={() => void handleBulkToggle(false)}
            onReviewUnassigned={() => setControlModalRoom(null)}
          />
        );
      })()}
      {mappingModalRoom && (
        <MappingPreviewModal
          key={mappingModalRoom.id}
          room={mappingModalRoom}
          units={previewOrgUnits}
          currentUnit={modalCurrentMapping.unit}
          currentSource={modalCurrentMapping.source}
          previewUnit={previewMappings[mappingModalRoom.id] ?? null}
          saveError={modalSaveError}
          isSaving={savingRoomKey === mappingModalRoom.fixedRoomKey}
          onClose={() => setMappingModalRoom(null)}
          onPreview={(unit) => {
            clearRoomMappingError(mappingModalRoom);
            setPreviewMappings((prev) => ({ ...prev, [mappingModalRoom.id]: unit }));
            setSelectedRoom(mappingModalRoom);
            setMappingModalRoom(null);
          }}
          onSave={(unit) => void handleSaveMapping(mappingModalRoom, unit)}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
