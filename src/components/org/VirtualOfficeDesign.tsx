"use client";

// VirtualOfficeDesign.tsx — EXECUTIVE-OFFICE-VISUAL-1
// Tenant-aware executive virtual office (Kumospace-inspired).
// Fixed 8-zone Executive Office Template with API-backed room mapping.
// Isolated from /org. Client writes go through the tenant API route only.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, RefreshCw, BrainCircuit, Users,
  LayoutGrid, Building2,
  Layers, MapPin, Sparkles, Crown, ChevronLeft,
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

// ─── Premium Visual Cards ─────────────────────────────────────────────────────

function BoardPremiumCard({ boardRoom, onClick }: {
  boardRoom: OfficeRoom | undefined;
  onClick: () => void;
}) {
  if (!boardRoom) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", textAlign: "right", cursor: "pointer",
        position: "relative", overflow: "hidden",
        borderRadius: 18,
        border: "1px solid rgba(139,92,246,0.32)",
        background: "linear-gradient(135deg, rgba(10,6,30,0.98) 0%, rgba(30,12,65,0.97) 50%, rgba(55,16,100,0.18) 100%)",
        padding: "18px 20px",
        boxShadow: "0 0 60px rgba(139,92,246,0.10), 0 8px 32px rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", gap: 16,
      }}
    >
      {/* Glow blob */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent)", pointerEvents: "none" }} />

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(168,85,247,0.12))",
        border: "1px solid rgba(139,92,246,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 20px rgba(139,92,246,0.25)",
      }}>
        <Crown size={22} color="#c4b5fd" />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(139,92,246,0.22)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.35)" }}>
            مكتب 05
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px #a855f7", display: "inline-block" }} />
            <span style={{ fontSize: 10, color: "#9d8bc9" }}>نشط</span>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e9d5ff", lineHeight: 1.2 }}>
          مجلس الإدارة · المكتب التنفيذي
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9d8bc9", lineHeight: 1.4 }}>
          مركز التحكم التشغيلي للمنشأة
        </p>
      </div>

      {/* Arrow */}
      <ChevronLeft size={18} color="#7c5fbf" style={{ flexShrink: 0 }} />
    </button>
  );
}

function ExecutiveBrainCard({ total, linked, unassigned }: {
  total: number;
  linked: number;
  unassigned: number;
}) {
  const nonBoardTotal = Math.max(total - 1, 0);
  const completionPct = nonBoardTotal > 0 ? Math.round((linked / nonBoardTotal) * 100) : 0;

  const metrics = [
    { label: "المكاتب", value: total, color: "#22d3ee" },
    { label: "المرتبطة", value: linked, color: "#10b981" },
    { label: "الجاهزة للتشغيل", value: unassigned, color: "#f59e0b" },
    { label: "الاكتمال", value: `${completionPct}%`, color: "#a855f7" },
  ];

  return (
    <div style={{
      flex: 1, minWidth: 160,
      borderRadius: 16, border: "1px solid rgba(34,211,238,0.18)",
      background: "linear-gradient(160deg, rgba(6,14,28,0.97) 0%, rgba(6,22,44,0.95) 100%)",
      padding: "14px 14px 12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <BrainCircuit size={15} color="#22d3ee" />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>العقل التنفيذي</span>
        <span style={{ marginRight: "auto", fontSize: 9, color: "#3a6a8a", fontWeight: 600 }}>قراءة تشغيلية فقط</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {metrics.map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "8px 10px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9.5, color: "#4a6a8a", marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 9, color: "#2a4a6a", lineHeight: 1.4 }}>محسوب من حالة ربط المكاتب الحالية</p>
    </div>
  );
}

function AIRoomCard() {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      borderRadius: 16, border: "1px solid rgba(34,211,238,0.14)",
      background: "linear-gradient(160deg, rgba(2,12,26,0.98) 0%, rgba(4,20,36,0.96) 100%)",
      padding: "14px 14px 12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle glow */}
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.07), transparent)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, position: "relative" }}>
        <Sparkles size={15} color="#22d3ee" />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>غرفة المساعد الذكي</span>
        <span style={{ marginRight: "auto", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.25)" }}>قريباً</span>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ borderRadius: 10, border: "1px dashed rgba(34,211,238,0.18)", background: "rgba(34,211,238,0.03)", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={13} color="#22d3ee" />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#4a8a9a", lineHeight: 1.4 }}>
              وكيل ذكاء اصطناعي خاص بهذه المنشأة
            </p>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["تحليل تشغيلي", "توصيات", "تقارير"].map((tag) => (
              <span key={tag} style={{ fontSize: 9, color: "#2a5a6a", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(34,211,238,0.10)", background: "rgba(34,211,238,0.04)" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
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
          {/* ── Board premium card ── */}
          <BoardPremiumCard
            boardRoom={roomsWithPresence.find((r) => r.isCenter)}
            onClick={() => {
              const b = roomsWithPresence.find((r) => r.isCenter);
              if (b) setControlModalRoom(b as OfficeRoom);
            }}
          />

          {/* ── Executive brain + AI room ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ExecutiveBrainCard
              total={roomsWithPresence.length}
              linked={linkedOfficeCount}
              unassigned={unassignedOfficeCount}
            />
            <AIRoomCard />
          </div>

          {/* ── Office map section ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LayoutGrid size={15} color="#22d3ee" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>المكاتب التشغيلية</span>
              </div>
              <span style={{ fontSize: 11, color: "#5a7a9a" }}>اضغط على أي مكتب لإدارته.</span>
            </div>

            {/* Activation strip — above map, only when unassigned exist */}
            {unassignedOfficeCount > 0 && (
              <div style={{ borderRadius: 12, border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.06)", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>اضغط على أي مكتب غير مخصص لربطه وتشغيله.</span>
                <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{unassignedOfficeCount}</span>
                    <span style={{ fontSize: 9, color: "#78716c" }}>جاهزة للتشغيل</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{linkedOfficeCount}</span>
                    <span style={{ fontSize: 9, color: "#78716c" }}>مرتبطة</span>
                  </div>
                </div>
              </div>
            )}

            {/* Image map — centered, max 860px, same visual for all screen sizes */}
            <div style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <MobileExecutiveOfficeScene
                rooms={roomsWithPresence}
                selectedRoomId={controlModalRoom?.id ?? null}
                onRoomClick={(r) => setControlModalRoom(r as OfficeRoom)}
              />
            </div>
          </div>

          {/* Bottom padding — keeps content above bottom nav on mobile */}
          <div style={{ height: "calc(72px + env(safe-area-inset-bottom))" }} />
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
            isSaving={savingRoomKey === controlModalRoom.fixedRoomKey}
            isUpdating={updatingRoomKey === controlModalRoom.fixedRoomKey || updatingRoomKey === "bulk"}
            boardStats={controlModalRoom.isCenter ? boardStats : null}
            onClose={() => setControlModalRoom(null)}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
