"use client";

// VirtualOfficeDesign.tsx — VIRTUAL-OFFICE-INTERACTIVE-3
// Tenant-aware virtual office simulator.
// Each tenant sees their own org structure mapped into fixed visual slots.
// Interactive: click a room to open the detail panel (read-only).
// Isolated from /org · no DB writes.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, RefreshCw, BrainCircuit, Users, CheckCircle2,
  AlertCircle, Clock, Activity, Calendar, Sparkles, Heart,
  AlertTriangle, Zap, LayoutGrid, X, Building2, Shield,
  Layers, MapPin,
} from "lucide-react";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import type { Employee, Task } from "@/types";
import VirtualOfficeReferenceScene, { type SceneRoom } from "./VirtualOfficeReferenceScene";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfficeRoom extends SceneRoom {
  deptId: string;         // real department id (may differ from id for demo rooms)
  deptCode: string | null;
  type: string;           // human-readable level label
  level: string;
  teamCount: number;
  teams: Array<{ id: string; name: string; memberCount: number }>;
  managerName: string | null;
}

export interface VirtualOfficeDesignProps {
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  tasks: Task[];
  orgName: string;
  onBackToOrg: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

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

// Demo rooms matching the approved visual reference
const DEMO_DEF = [
  { name: "غرفة المبيعات",         emp: 3, open: 5, overdue: 1, hp: 74, center: false, ai: false },
  { name: "غرفة الإدارة العليا",   emp: 5, open: 2, overdue: 0, hp: 91, center: false, ai: false },
  { name: "غرفة الدعم",            emp: 4, open: 3, overdue: 0, hp: 88, center: false, ai: false },
  { name: "غرفة التسويق",          emp: 3, open: 4, overdue: 1, hp: 69, center: false, ai: false },
  { name: "غرفة الاجتماعات",       emp: 0, open: 0, overdue: 0, hp:  0, center: true,  ai: false },
  { name: "غرفة المالية",          emp: 2, open: 2, overdue: 0, hp: 81, center: false, ai: false },
  { name: "غرفة التنفيذ",          emp: 3, open: 3, overdue: 0, hp: 76, center: false, ai: false },
  { name: "غرفة الذكاء الاصطناعي", emp: 1, open: 0, overdue: 0, hp: 94, center: false, ai: true  },
] as const;

// Slot assignment keywords — maps Arabic/English room names to fixed visual slots.
// Slot 0=sales, 1=executive, 2=support, 3=marketing, 4=meeting, 5=finance, 6=execution, 7=AI
const SLOT_KEYWORDS: Record<number, string[]> = {
  0: ["مبيعات", "بيع", "sales", "revenue", "تجار"],
  1: ["إدار", "executive", "عليا", "رئيس", "عام", "قياد", "تنفيذي"],
  2: ["دعم", "support", "خدمة عملاء", "service", "customer"],
  3: ["تسويق", "market", "إعلان", "brand", "تواصل", "홍보"],
  4: ["اجتماع", "meeting", "conference", "مؤتمر", "قاعة"],
  5: ["مال", "محاسب", "finance", "account", "خزين", "بنك", "حساب"],
  6: ["تنفيذ", "operat", "لوجست", "مشاريع", "project", "عمليات", "إنتاج"],
  7: ["ذكاء", "ai", "تقني", "tech", "برمجة", "software", "بيانات", "data"],
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

// Smart keyword-based slot assignment
function assignSlot(name: string, level: string, isCenter: boolean, isAI: boolean, usedSlots: Set<number>): number {
  if (isCenter || level === "management") {
    if (!usedSlots.has(4)) return 4;
  }
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
  for (const s of [0, 1, 2, 3, 5, 6, 7]) {
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

  if (depts.length === 0) {
    return {
      isDemo: true,
      rooms: DEMO_DEF.map((d, i) => ({
        id: `demo-${i}`, deptId: `demo-${i}`,
        name: d.name,
        accentColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] ?? "#22d3ee",
        employeeCount: d.emp, avatars: [],
        openTasks: d.open, overdueTasks: d.overdue, healthPct: d.hp,
        isCenter: d.center, isAI: d.ai, isDemo: true,
        deptCode: null, type: d.center ? "قاعة اجتماعات" : d.ai ? "غرفة AI" : "مساحة عمل",
        level: d.center ? "management" : d.ai ? "department" : "department",
        teamCount: 0, teams: [], managerName: null,
      })),
    };
  }

  const empById  = new Map(safeEmp.map((e) => [e.id, e]));
  const usedSlots = new Set<number>();

  const rooms: OfficeRoom[] = depts.slice(0, 8).map((dept) => {
    if (!dept) return null;
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
    const isCenter    = level === "management";
    const isAI        = name.includes("ذكاء") || name.toUpperCase().includes("AI");
    const manager     = dept.manager_id ? (empById.get(dept.manager_id)?.name ?? null) : null;
    const slotIdx     = assignSlot(name, level, isCenter, isAI, usedSlots);
    if (slotIdx >= 0) usedSlots.add(slotIdx);
    const accentIdx   = slotIdx >= 0 ? slotIdx : (hashStr(dept.id) % ACCENT_CYCLE.length);
    return {
      id: dept.id, deptId: dept.id,
      name,
      accentColor: ACCENT_CYCLE[accentIdx % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: deptRels.length,
      avatars: deptEmps.slice(0, 3).map((e) => ({ initials: nameInitials(e.name ?? e.email ?? "؟"), color: avatarColor(e.name ?? e.email ?? "؟") })),
      openTasks: open, overdueTasks: overdue,
      healthPct: computeHp(open, overdue, deptRels.length),
      isCenter, isAI, isDemo: false,
      deptCode: dept.department_code ?? dept.publicCode ?? null,
      type: LEVEL_LABELS[level] ?? "مساحة عمل",
      level,
      teamCount: deptTeams.length, teams: teamCards,
      managerName: manager,
    };
  }).filter((r) => r !== null) as OfficeRoom[];

  // Pad with visual placeholders if fewer than 8 depts
  while (rooms.length < 8) {
    const i   = rooms.length;
    const def = DEMO_DEF[i];
    if (!def) break;
    rooms.push({
      id: `pad-${i}`, deptId: `pad-${i}`,
      name: def.name,
      accentColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: 0, avatars: [],
      openTasks: 0, overdueTasks: 0, healthPct: 85,
      isCenter: def.center, isAI: def.ai, isDemo: true,
      deptCode: null, type: def.center ? "قاعة اجتماعات" : def.ai ? "غرفة AI" : "مساحة عمل",
      level: def.center ? "management" : "department",
      teamCount: 0, teams: [], managerName: null,
    });
  }

  return { rooms, isDemo: false };
}

// ─── Workspace Identity Strip ─────────────────────────────────────────────────

function WorkspaceIdentityStrip({ orgName, snapshot, employees, planSlug }: {
  orgName: string;
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  planSlug?: string;
}) {
  const deptCount = Array.isArray(snapshot?.departments) ? snapshot!.departments.length : 0;
  const empCount  = Array.isArray(employees) ? employees.length : 0;
  const PLAN_LABELS: Record<string, string> = { basic: "بسيط", growth: "نمو", advanced: "متقدم" };
  const planLabel = planSlug ? (PLAN_LABELS[planSlug] ?? planSlug) : "";
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
          {planLabel && <p style={{ fontSize: 10, color: "#4a6a8a", margin: 0 }}>باقة {planLabel}</p>}
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

      <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#3a5570" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
        مبني من الهيكل الإداري · للقراءة فقط
      </div>
    </div>
  );
}

// ─── Room Detail Panel ────────────────────────────────────────────────────────

function RoomDetailPanel({ room, snapshot, employees, tasks, onClose }: {
  room: OfficeRoom;
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  tasks: Task[];
  onClose: () => void;
}) {
  const rels     = Array.isArray(snapshot?.relations) ? snapshot!.relations : [];
  const safeEmps = Array.isArray(employees) ? employees : [];
  const safeTsks = Array.isArray(tasks)     ? tasks     : [];

  // Employees in this room
  const roomRelIds = new Set(
    rels.filter((r) => r?.department_id === room.deptId).map((r) => r.employee_id).filter(Boolean),
  );
  const roomEmps = safeEmps.filter((e) => roomRelIds.has(e.id));

  // Tasks for room employees
  const roomTasks = safeTsks.filter((t) => t?.assigneeId && roomRelIds.has(t.assigneeId));
  const openTasks    = roomTasks.filter((t) => t?.status !== "مكتملة");
  const overdueTasks = roomTasks.filter((t) => t?.status === "متأخرة");

  const hp = room.healthPct > 0 ? room.healthPct : (room.isAI ? 94 : 0);
  const hpColor = hp >= 85 ? "#10b981" : hp >= 70 ? "#f59e0b" : "#ef4444";

  const ICON_MAP: Record<string, React.ElementType> = { agency: Shield, management: Layers, department: Building2 };
  const TypeIcon = ICON_MAP[room.level] ?? Building2;

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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>{room.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: room.accentColor, background: `${room.accentColor}18`, border: `1px solid ${room.accentColor}30`, padding: "1px 7px", borderRadius: 12 }}>{room.type}</span>
              {room.deptCode && <span style={{ fontSize: 10, color: "#4a6a8a", fontFamily: "monospace" }}>{room.deptCode}</span>}
              {hp > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: hpColor }}>{hp}% · {hpLabel(hp)}</span>}
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", cursor: "pointer", flexShrink: 0 }}>
          <X size={13} color="#8ba3c7" />
        </button>
      </div>

      <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Stats */}
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

        {/* Employees */}
        {(roomEmps.length > 0 || room.isDemo) && (
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 10, color: "#4a6a8a", margin: "0 0 6px" }}>الموظفون ({room.employeeCount})</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(roomEmps.length > 0 ? roomEmps.slice(0, 6) : Array.from({ length: Math.min(room.employeeCount, 4) })).map((emp, i) => {
                const name = typeof emp === "object" && emp !== null ? ((emp as Employee).name ?? (emp as Employee).email ?? "موظف") : `موظف ${i + 1}`;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "5px 8px" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>
                      {nameInitials(name)}
                    </div>
                    <span style={{ fontSize: 11, color: "#b0c8e0" }}>{name}</span>
                  </div>
                );
              })}
              {room.employeeCount > 6 && <span style={{ fontSize: 10, color: "#4a6a8a", alignSelf: "center" }}>+{room.employeeCount - 6} آخرون</span>}
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

        <div style={{ gridColumn: "1 / -1", fontSize: 10, color: "#2a4060", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8, marginTop: 4 }}>
          للقراءة فقط · لا تغييرات في البيانات
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
    const live = [...safeTasks].filter((t) => t?.title).slice(0, 5).map((t, i) => ({
      id: t.id ?? `a${i}`, title: t.title, status: t.status ?? "",
      room: rooms[i % Math.max(rooms.length, 1)]?.name ?? "—",
      ago: (["دقيقتين", "5 دقائق", "10 دقائق", "15 دقائق", "20 دقيقة"] as const)[i] ?? "—",
    }));
    if (live.length > 0) return live;
    return [
      { id: "d1", title: "تم إسناد مهمة في غرفة التنفيذ",           room: "غرفة التنفيذ",         ago: "دقيقتين",  status: "قيد_التنفيذ" },
      { id: "d2", title: "انضم محمد لاجتماع غرفة المبيعات",         room: "غرفة المبيعات",       ago: "5 دقائق",   status: "جديدة"       },
      { id: "d3", title: "تم تحديث مهمة في غرفة الدعم",            room: "غرفة الدعم",          ago: "10 دقائق",  status: "قيد_التنفيذ" },
      { id: "d4", title: "تم رفع فاتورة #INV-2026-0034",           room: "غرفة المالية",        ago: "15 دقائق",  status: "بانتظار_المراجعة" },
      { id: "d5", title: "تم إنشاء اجتماع في غرفة الإدارة العليا", room: "غرفة الإدارة العليا", ago: "20 دقيقة",  status: "جديدة"       },
    ];
  }, [tasks, rooms]);

  const DOT_COLOR: Record<string, string> = { "متأخرة": "#ef4444", "مكتملة": "#10b981", "قيد_التنفيذ": "#f59e0b" };

  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={14} color="#22d3ee" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>النشاط المباشر داخل المكتب</span>
        </div>
        <Link href="/tasks" style={{ fontSize: 10, color: "#3a5a7a", textDecoration: "none" }}>› الكل</Link>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => (
          <li key={item.id} style={{ padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: DOT_COLOR[item.status] ?? "#22d3ee", flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#b0c8e0", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
              <p style={{ fontSize: 10, color: "#3a5a7a", margin: "2px 0 0" }}>{item.room}</p>
            </div>
            <span style={{ fontSize: 10, color: "#2a4060", flexShrink: 0 }}>منذ {item.ago}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Meeting Rooms Panel ──────────────────────────────────────────────────────

function MeetingRoomsPanel({ rooms }: { rooms: OfficeRoom[] }) {
  const list = rooms.length > 0 ? rooms.slice(0, 3) : DEMO_DEF.slice(0, 3).map((d, i) => ({ id: `mr${i}`, name: d.name, employeeCount: d.emp }));
  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={14} color="#a855f7" /><span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>غرف الاجتماعات</span></div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض التقويم</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.map((room, i) => {
          const occupied = i === 0;
          return (
            <li key={room.id ?? i} style={{ padding: "10px 16px", borderBottom: i < list.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: occupied ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.04)" }}>
                <MessageSquare size={14} color={occupied ? "#a78bfa" : "#3a5a7a"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#c8ddf0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</p>
                <p style={{ fontSize: 10, color: "#3a5a7a", margin: "2px 0 0" }}>{occupied ? "11:00 - 11:30" : "لا يوجد اجتماع محدول"}</p>
              </div>
              <button type="button" style={{ flexShrink: 0, fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 8, border: occupied ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.08)", background: occupied ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", color: occupied ? "#c4b5fd" : "#5a7a9a", cursor: "default" }}>
                {occupied ? "مشغولة الآن" : "جدولة سريعة"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// missing import
const MessageSquare = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

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
    if (pending.length > 0) result.push({ id: "a2", type: "حاد",   text: "#INV-2026-0034 متأخر عن الموعد", room: rooms[1]?.name ?? "—", Icon: AlertCircle });
    if (result.length >= 2) return result;
    return [
      { id: "d1", type: "تنبيه",  text: "مؤشر النشاط انخفض -38% مقارنة بالأسبوع الماضي", room: "غرفة المبيعات", Icon: AlertTriangle },
      { id: "d2", type: "تحذير",  text: "3 مهام متأخرة في غرفة التسويق", room: "غرفة التسويق", Icon: AlertTriangle },
      { id: "d3", type: "حاد",    text: "#INV-2026-0034 متأخر عن الموعد", room: "غرفة المالية", Icon: AlertCircle },
      { id: "d4", type: "توصية",  text: "إعادة توزيع مهام الدعم على موظفين من قسم التنفيذ", room: "غرفة الدعم", Icon: Zap },
    ];
  }, [tasks, rooms]);

  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BrainCircuit size={14} color="#22d3ee" /><span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>تنبيهات الذكاء الاصطناعي</span></div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض الكل</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alerts.slice(0, 4).map((alert, i) => {
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

export default function VirtualOfficeDesign({
  snapshot, employees, tasks, orgName,
  onBackToOrg, onRefresh, isRefreshing = false,
}: VirtualOfficeDesignProps) {
  const [selectedRoom, setSelectedRoom] = useState<OfficeRoom | null>(null);

  const { rooms, isDemo } = useMemo(
    () => buildOfficeRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  const safeDepts = useMemo(() => Array.isArray(snapshot?.departments) ? snapshot!.departments : [], [snapshot]);
  const safeRels  = useMemo(() => Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [], [snapshot]);
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);
  const safeEmps  = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);

  const openTasks    = safeTasks.filter((t) => t?.status !== "مكتملة").length;
  const overdueTasks = safeTasks.filter((t) => t?.status === "متأخرة").length;
  const activeEmps   = safeRels.length;
  const deptCount    = isDemo ? DEMO_DEF.length : safeDepts.length;

  const avgHealth = useMemo(() => {
    const hr = rooms.filter((r) => r.healthPct > 0);
    return hr.length === 0 ? 82 : Math.round(hr.reduce((s, r) => s + r.healthPct, 0) / hr.length);
  }, [rooms]);

  const kpis = [
    { label: "صحة المكتب",       value: `${avgHealth}%`, sub: hpLabel(avgHealth),                          Icon: Heart,        iconBg: "rgba(16,185,129,0.28)" },
    { label: "الأقسام",          value: deptCount,        sub: undefined,                                   Icon: LayoutGrid,   iconBg: "rgba(34,211,238,0.25)" },
    { label: "الموظفون النشطون", value: isDemo ? 18 : activeEmps, sub: `من ${isDemo ? 24 : safeEmps.length}`, Icon: Users, iconBg: "rgba(59,130,246,0.25)" },
    { label: "اجتماعات اليوم",  value: isDemo ? 5 : 0,   sub: isDemo ? "اجتماعات" : undefined,            Icon: Calendar,     iconBg: "rgba(139,92,246,0.25)" },
    { label: "المهام المفتوحة",  value: isDemo ? 46 : openTasks,    sub: "مهمة",                           Icon: CheckCircle2, iconBg: "rgba(16,185,129,0.25)" },
    { label: "المهام المتأخرة",  value: isDemo ? 6  : overdueTasks, sub: "مهمة",                           Icon: AlertCircle,  iconBg: "rgba(245,158,11,0.28)" },
    { label: "تنبيهات AI",       value: isDemo ? 4  : Math.max(overdueTasks, 0), sub: "تنبيه",             Icon: BrainCircuit, iconBg: "rgba(139,92,246,0.28)" },
  ];

  const isEmpty = safeDepts.length === 0 && !isDemo;

  return (
    <div className="space-y-5 min-w-0" dir="rtl">

      {/* ── Header ── */}
      <section style={{ position: "relative", overflow: "hidden", borderRadius: 20, border: "1px solid rgba(34,211,238,0.18)", padding: "20px 22px", background: "linear-gradient(135deg, rgba(6,15,30,0.98) 0%, rgba(18,36,68,0.96) 55%, rgba(50,16,80,0.14) 100%)", boxShadow: "0 0 70px rgba(34,211,238,0.05)" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.09), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.20)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.32)" }}>BETA</span>
              {isDemo && <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)", display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkles size={9} color="#fcd34d" />عرض توضيحي</span>}
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>المكتب الافتراضي الذكي</h1>
            <p style={{ fontSize: 13, color: "#7a9ab8", marginTop: 8, maxWidth: 520, lineHeight: 1.6 }}>محاكاة تفاعلية مبنية من الهيكل الإداري لكل منشأة.</p>
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
      <WorkspaceIdentityStrip orgName={orgName} snapshot={snapshot} employees={safeEmps} />

      {/* ── KPI Row ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {kpis.map((k) => <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} Icon={k.Icon} iconBg={k.iconBg} />)}
      </div>

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
          {/* ── Office Floor Plan ── */}
          <VirtualOfficeReferenceScene
            rooms={rooms}
            selectedRoomId={selectedRoom?.id ?? null}
            onRoomClick={(r) => setSelectedRoom(prev => prev?.id === r.id ? null : r as OfficeRoom)}
          />

          {/* ── Room Detail Panel (shown when room is selected) ── */}
          {selectedRoom && (
            <RoomDetailPanel
              room={selectedRoom}
              snapshot={snapshot}
              employees={safeEmps}
              tasks={safeTasks}
              onClose={() => setSelectedRoom(null)}
            />
          )}

          {/* ── Bottom Panels ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ alignItems: "start" }}>
            <ActivityPanel tasks={safeTasks} rooms={rooms} />
            <MeetingRoomsPanel rooms={rooms} />
            <AIAlertsPanel tasks={safeTasks} rooms={rooms} />
          </div>
        </>
      )}

      <p style={{ fontSize: 10, color: "#1e3050", textAlign: "center", paddingBottom: 8 }}>
        محاكاة للقراءة فقط · لا تغييرات في البيانات · مبني من الهيكل الإداري
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
