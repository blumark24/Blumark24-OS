"use client";

// VirtualOfficeDesign.tsx — VIRTUAL-OFFICE-DESIGN-2D
// Orchestrator: builds data, renders header, KPI row, scene, bottom panels.
// Scene rendering delegated to VirtualOfficeReferenceScene.
// Read-only · isolated from /org · no external 3D libraries.

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
  BrainCircuit,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Calendar,
  Sparkles,
  Heart,
  AlertTriangle,
  Zap,
  LayoutGrid,
  MessageSquare,
} from "lucide-react";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import type { Employee, Task } from "@/types";
import VirtualOfficeReferenceScene from "./VirtualOfficeReferenceScene";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfficeRoom {
  id: string;
  name: string;
  accentColor: string;
  employeeCount: number;
  avatars: Array<{ initials: string; color: string }>;
  openTasks: number;
  overdueTasks: number;
  healthPct: number;
  isCenter: boolean;
  isAI: boolean;
  isDemo: boolean;
}

export interface VirtualOfficeDesignProps {
  snapshot: OrgStructureSnapshot | null;
  employees: Employee[];
  tasks: Task[];
  onBackToOrg: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_CYCLE = [
  "#22d3ee", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#a855f7", // violet
  "#3b82f6", // blue
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
];

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];

// 8 fixed demo rooms matching the approved reference
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

function hpColor(pct: number) {
  if (pct >= 85) return { text: "#10b981", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.35)" };
  if (pct >= 70) return { text: "#f59e0b", bg: "rgba(245,158,11,0.18)",  border: "rgba(245,158,11,0.35)" };
  return              { text: "#ef4444", bg: "rgba(239,68,68,0.18)",    border: "rgba(239,68,68,0.35)"  };
}

function hpLabel(pct: number) {
  if (pct >= 85) return "ممتاز";
  if (pct >= 70) return "جيد";
  if (pct >= 55) return "متوسط";
  return "يحتاج متابعة";
}

function computeHp(open: number, overdue: number, emp: number): number {
  if (open === 0 && overdue === 0 && emp === 0) return 85;
  if (open === 0 && overdue === 0) return 90;
  return Math.max(45, Math.min(99, 100 - overdue * 10 - Math.max(0, open - overdue) * 3));
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildRooms(
  snapshot: OrgStructureSnapshot | null,
  employees: Employee[],
  tasks: Task[],
): { rooms: OfficeRoom[]; isDemo: boolean } {
  const depts   = Array.isArray(snapshot?.departments) ? snapshot!.departments : [];
  const rels    = Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [];
  const safeEmp = Array.isArray(employees) ? employees : [];
  const safeTsk = Array.isArray(tasks)     ? tasks     : [];

  if (depts.length === 0) {
    return {
      isDemo: true,
      rooms: DEMO_DEF.map((d, i) => ({
        id: `demo-${i}`,
        name: d.name,
        accentColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] ?? "#22d3ee",
        employeeCount: d.emp,
        avatars: [],
        openTasks: d.open,
        overdueTasks: d.overdue,
        healthPct: d.hp,
        isCenter: d.center,
        isAI: d.ai,
        isDemo: true,
      })),
    };
  }

  const empById = new Map(safeEmp.map((e) => [e.id, e]));

  const rooms: OfficeRoom[] = depts.slice(0, 8).map((dept, i) => {
    if (!dept) return null;
    const deptRels  = rels.filter((r) => r?.department_id === dept.id);
    const empIds    = new Set(deptRels.map((r) => r.employee_id).filter((x): x is string => typeof x === "string"));
    const deptEmps  = Array.from(empIds).map((id) => empById.get(id)).filter((e): e is Employee => e != null);
    const deptTasks = safeTsk.filter((t) => t?.assigneeId && empIds.has(t.assigneeId));
    const open    = deptTasks.filter((t) => t?.status !== "مكتملة").length;
    const overdue = deptTasks.filter((t) => t?.status === "متأخرة").length;
    const name    = dept.name ?? "—";
    return {
      id: dept.id,
      name,
      accentColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: deptRels.length,
      avatars: deptEmps.slice(0, 3).map((e) => ({
        initials: nameInitials(e.name ?? e.email ?? "؟"),
        color: avatarColor(e.name ?? e.email ?? "؟"),
      })),
      openTasks: open,
      overdueTasks: overdue,
      healthPct: computeHp(open, overdue, deptRels.length),
      isCenter: dept.structure_level === "management",
      isAI: name.includes("ذكاء") || name.toUpperCase().includes("AI"),
      isDemo: false,
    };
  }).filter((r): r is OfficeRoom => r !== null);

  // Pad with demo placeholders so we always have 8 slots
  while (rooms.length < 8) {
    const i = rooms.length;
    rooms.push({
      id: `pad-${i}`,
      name: DEMO_DEF[i]?.name ?? `غرفة ${i + 1}`,
      accentColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] ?? "#22d3ee",
      employeeCount: 0, avatars: [],
      openTasks: 0, overdueTasks: 0, healthPct: 85,
      isCenter: i === 4, isAI: i === 7, isDemo: true,
    });
  }

  return { rooms, isDemo: false };
}

// ─── Slot layout ──────────────────────────────────────────────────────────────
//  slots[0] row1-col1  slots[1] row1-col2  slots[2] row1-col3
//  slots[3] row2-col1  slots[4] CENTER(row2-3 col2) slots[5] row2-col3
//  slots[6] row3-col1  [corridor row3-col2]          slots[7] row3-col3

function buildSlots(rooms: OfficeRoom[]): (OfficeRoom | null)[] {
  const s: (OfficeRoom | null)[] = Array(8).fill(null);
  const used = new Set<number>();
  const ci = rooms.findIndex((r) => r.isCenter);
  const ai = rooms.findIndex((r) => r.isAI && !r.isCenter);
  if (ci >= 0) { s[4] = rooms[ci]; used.add(ci); }
  if (ai >= 0) { s[7] = rooms[ai]; used.add(ai); }
  const rem = rooms.filter((_, i) => !used.has(i));
  [0, 1, 2, 3, 5, 6].filter((p) => !s[p]).forEach((pos, i) => { if (rem[i]) s[pos] = rem[i]; });
  if (!s[4]) { const fb = rem[6] ?? rooms[Math.floor(rooms.length / 2)]; if (fb) s[4] = { ...fb, isCenter: true }; }
  return s;
}

// ─── Furniture shapes ─────────────────────────────────────────────────────────

function Desk({ w = 34, h = 16, opacity = 1 }: { w?: number; h?: number; opacity?: number }) {
  return (
    <div style={{
      width: w, height: h, flexShrink: 0,
      background: `rgba(255,255,255,${0.025 * opacity})`,
      border: `1px solid rgba(255,255,255,${0.05 * opacity})`,
      borderRadius: 4,
    }} />
  );
}

// ─── Avatar stack (inline, no extra hooks) ────────────────────────────────────

function AvatarRow({ avatars, total, isDemo, demoCount }: {
  avatars: Array<{ initials: string; color: string }>;
  total: number;
  isDemo: boolean;
  demoCount: number;
}) {
  const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];
  const show = avatars.length > 0 ? avatars.map((a, i) => ({ key: `a${i}`, bg: a.color, label: a.initials }))
    : isDemo && demoCount > 0 ? Array.from({ length: Math.min(demoCount, 3) }).map((_, i) => ({
        key: `d${i}`, bg: AVATAR_COLORS[(i * 3) % AVATAR_COLORS.length] ?? "#22d3ee", label: DEMO_LETTERS[i] ?? "م",
      }))
    : [];
  const extra = avatars.length > 0 ? Math.max(0, total - 3) : isDemo ? Math.max(0, demoCount - 3) : 0;
  if (show.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {show.map((a) => (
        <div key={a.key} style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#fff",
          background: a.bg, border: "1px solid rgba(255,255,255,0.12)",
        }}>{a.label}</div>
      ))}
      {extra > 0 && (
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#6b87ab",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null;
  const c = hpColor(pct);
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: c.text,
      background: c.bg, border: `1px solid ${c.border}`,
      padding: "2px 7px", borderRadius: 20, flexShrink: 0,
    }}>
      {pct}%
    </span>
  );
}

// ─── Overdue alert badge ──────────────────────────────────────────────────────

function AlertBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, borderRadius: "50%",
      background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>{count}</span>
  );
}

// ─── STANDARD ROOM ────────────────────────────────────────────────────────────

function StandardRoom({ room, style }: { room: OfficeRoom; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, rgba(5,13,26,0.97) 0%, rgba(8,18,36,0.99) 100%)",
      borderTop: `2px solid ${room.accentColor}60`,
      border: "1px solid rgba(255,255,255,0.045)",
      ...style,
    }}>
      {/* Subtle floor glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 90% 55% at 50% 120%, ${room.accentColor}0c, transparent)`,
      }} />

      {/* Top bar */}
      <div style={{ padding: "8px 10px 4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, position: "relative" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", lineHeight: 1.25, flex: 1, minWidth: 0 }}>
          {room.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <AlertBadge count={room.overdueTasks} />
          <HealthBadge pct={room.healthPct} />
        </div>
      </div>

      {/* Desk furniture area */}
      <div style={{ flex: 1, padding: "6px 10px 4px", display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 5, position: "relative" }}>
        <Desk />
        <Desk />
        {room.employeeCount > 2 && <Desk w={28} />}
      </div>

      {/* Avatar + count footer */}
      <div style={{ padding: "4px 10px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <AvatarRow avatars={room.avatars} total={room.employeeCount} isDemo={room.isDemo} demoCount={room.employeeCount} />
        {room.openTasks > 0 && (
          <span style={{ fontSize: 10, color: "#5a7a9a", display: "flex", alignItems: "center", gap: 3 }}>
            <CheckCircle2 size={9} color="#10b981" />
            {room.openTasks}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MEETING ROOM (CENTER) ────────────────────────────────────────────────────

function MeetingRoom({ room, style }: { room: OfficeRoom; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, rgba(32,10,65,0.96) 0%, rgba(16,6,42,0.98) 100%)",
      border: "2px solid rgba(139,92,246,0.38)",
      boxShadow: "0 0 50px rgba(139,92,246,0.14), inset 0 0 50px rgba(139,92,246,0.06)",
      ...style,
    }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(139,92,246,0.20), transparent)" }} />
      {/* Corner grid lines (decorative) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />

      {/* Header row */}
      <div style={{ position: "absolute", top: 8, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{room.name}</span>
        {(room.isDemo || room.employeeCount === 0) && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "#c4b5fd",
            background: "rgba(139,92,246,0.22)", border: "1px solid rgba(139,92,246,0.38)",
            padding: "2px 8px", borderRadius: 20,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
            مشغولة الآن
          </span>
        )}
      </div>

      {/* Central icon */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle, rgba(139,92,246,0.38), rgba(139,92,246,0.06))",
          border: "1px solid rgba(139,92,246,0.45)",
          boxShadow: "0 0 24px rgba(139,92,246,0.25)",
        }}>
          <MessageSquare size={22} color="#c4b5fd" />
        </div>
      </div>

      {room.isDemo && (
        <>
          <p style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600, position: "relative" }}>11:00 – 11:30</p>
          <p style={{ fontSize: 10, color: "rgba(139,92,246,0.55)", marginTop: 4, position: "relative" }}>مراجعة فرص البيع الشهرية</p>
        </>
      )}

      {/* Avatars at bottom */}
      {(room.avatars.length > 0 || (room.isDemo && room.employeeCount > 0)) && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
          <AvatarRow avatars={room.avatars} total={room.employeeCount} isDemo={room.isDemo} demoCount={room.employeeCount} />
        </div>
      )}
    </div>
  );
}

// ─── AI ROOM ─────────────────────────────────────────────────────────────────

function AIRoomCell({ room, style }: { room: OfficeRoom; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, rgba(3,10,24,0.98) 0%, rgba(5,14,32,0.99) 100%)",
      border: "1px solid rgba(34,211,238,0.22)",
      boxShadow: "0 0 40px rgba(34,211,238,0.09), 0 0 60px rgba(139,92,246,0.06), inset 0 0 30px rgba(34,211,238,0.04)",
      ...style,
    }}>
      {/* Dual neon glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 70% at 50% 110%, rgba(34,211,238,0.12), transparent), radial-gradient(ellipse 90% 50% at 90% 0%, rgba(139,92,246,0.10), transparent)",
      }} />
      {/* Hex grid texture */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }} />

      {/* Header */}
      <div style={{ padding: "8px 10px 4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, position: "relative" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", lineHeight: 1.25, flex: 1 }}>{room.name}</span>
        <HealthBadge pct={room.healthPct} />
      </div>

      {/* Brain icon */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle, rgba(34,211,238,0.26), rgba(34,211,238,0.04))",
          border: "1px solid rgba(34,211,238,0.32)",
          boxShadow: "0 0 24px rgba(34,211,238,0.20)",
        }}>
          <BrainCircuit size={24} color="#22d3ee" />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px 8px", textAlign: "center", position: "relative" }}>
        <span style={{ fontSize: 10, color: "rgba(34,211,238,0.45)" }}>
          {room.employeeCount > 0 ? `${room.employeeCount} موظف` : room.isDemo ? "AI Engine Active" : "—"}
        </span>
      </div>
    </div>
  );
}


// ─── OFFICE FLOOR PLAN ────────────────────────────────────────────────────────

function OfficeFloorPlan({ rooms }: { rooms: OfficeRoom[] }) {
  const slots = useMemo(() => buildSlots(rooms), [rooms]);

  function cell(slot: OfficeRoom | null, key: string, gridCol: number | string, gridRow: number | string) {
    const pos: React.CSSProperties = { gridColumn: gridCol as React.CSSProperties["gridColumn"], gridRow: gridRow as React.CSSProperties["gridRow"] };
    if (!slot) return <div key={key} style={{ ...pos, background: "rgba(4,10,20,0.6)", border: "1px solid rgba(255,255,255,0.02)" }} />;
    if (slot.isCenter) return <MeetingRoom key={key} room={slot} style={pos} />;
    if (slot.isAI)    return <AIRoomCell  key={key} room={slot} style={pos} />;
    return <StandardRoom key={key} room={slot} style={pos} />;
  }

  return (
    <div style={{
      background: "rgba(2,6,16,0.99)",
      border: "2px solid rgba(45,75,125,0.30)",
      borderRadius: 20,
      padding: 4,
      boxShadow: "0 0 100px rgba(34,211,238,0.05), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Header bar */}
      <div style={{ padding: "8px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: 11, color: "rgba(80,120,160,0.85)", fontWeight: 500 }}>مخطط الطابق الرئيسي</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 10, color: "rgba(60,90,130,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            {rooms.filter((r) => !r.isCenter && !r.isAI).length} غرفة
          </span>
          <span style={{ fontSize: 10, color: "rgba(60,90,130,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
            قاعة اجتماعات
          </span>
          <span style={{ fontSize: 10, color: "rgba(60,90,130,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", display: "inline-block" }} />
            غرفة AI
          </span>
        </div>
      </div>

      {/* ── Desktop grid (sm+) ── */}
      <div
        className="hidden sm:grid"
        style={{
          gridTemplateColumns: "1fr 1.12fr 1fr",
          gridTemplateRows: "minmax(155px,auto) minmax(172px,auto) minmax(148px,auto)",
          gap: 4,
          background: "rgba(16,28,50,0.55)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {cell(slots[0], "r0", 1, 1)}
        {cell(slots[1], "r1", 2, 1)}
        {cell(slots[2], "r2", 3, 1)}
        {cell(slots[3], "r3", 1, 2)}
        {cell(slots[4], "r4", 2, "2 / 4")}
        {cell(slots[5], "r5", 3, 2)}
        {cell(slots[6], "r6", 1, 3)}
        {/* col 2 row 3 is fully occupied by the center room span (gridRow: "2 / 4") */}
        {cell(slots[7], "r7", 3, 3)}
      </div>

      {/* ── Mobile stacked (xs only) ── */}
      <div className="sm:hidden space-y-2">
        {rooms.map((room) =>
          room.isCenter ? (
            <MeetingRoom key={room.id} room={room} style={{ minHeight: 148 }} />
          ) : room.isAI ? (
            <AIRoomCell key={room.id} room={room} style={{ minHeight: 120 }} />
          ) : (
            <StandardRoom key={room.id} room={room} style={{ minHeight: 120 }} />
          ),
        )}
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, Icon, iconBg }: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div
      className="flex-shrink-0 min-w-[118px]"
      style={{
        borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)",
        background: "rgba(6,14,28,0.92)",
        padding: "14px 14px 12px",
        display: "flex", flexDirection: "column", gap: 4,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 10, marginBottom: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: iconBg,
      }}>
        <Icon size={15} color="#fff" />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600, lineHeight: 1 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: "#4a6a8a", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── ACTIVITY PANEL ───────────────────────────────────────────────────────────

function ActivityPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  const items = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const live = [...safeTasks].filter((t) => t?.title).slice(0, 5).map((t, i) => ({
      id: t.id ?? `a${i}`,
      title: t.title,
      status: t.status ?? "",
      room: rooms[i % Math.max(rooms.length, 1)]?.name ?? "—",
      ago: (["دقيقتين", "5 دقائق", "10 دقائق", "15 دقائق", "20 دقيقة"] as const)[i] ?? "—",
    }));
    if (live.length > 0) return live;
    return [
      { id: "d1", title: "تم إسناد مهمة في غرفة التنفيذ",              room: "غرفة التنفيذ",         ago: "دقيقتين",  status: "قيد_التنفيذ" },
      { id: "d2", title: "انضم محمد لاجتماع غرفة المبيعات",            room: "غرفة المبيعات",       ago: "5 دقائق",   status: "جديدة"       },
      { id: "d3", title: "تم تحديث مهمة في غرفة الدعم",               room: "غرفة الدعم",          ago: "10 دقائق",  status: "قيد_التنفيذ" },
      { id: "d4", title: "تم رفع فاتورة #INV-2026-0034",              room: "غرفة المالية",        ago: "15 دقائق",  status: "بانتظار_المراجعة" },
      { id: "d5", title: "تم إنشاء اجتماع في غرفة الإدارة العليا",    room: "غرفة الإدارة العليا", ago: "20 دقيقة",  status: "جديدة"       },
    ];
  }, [tasks, rooms]);

  function StatusDot({ s }: { s: string }) {
    const color = s === "متأخرة" ? "#ef4444" : s === "مكتملة" ? "#10b981" : s === "قيد_التنفيذ" ? "#f59e0b" : "#22d3ee";
    return <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;
  }

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
            <StatusDot s={item.status} />
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

// ─── MEETING ROOMS PANEL ──────────────────────────────────────────────────────

function MeetingRoomsPanel({ rooms }: { rooms: OfficeRoom[] }) {
  const list = rooms.length > 0 ? rooms.slice(0, 3) : DEMO_DEF.slice(0, 3).map((d, i) => ({
    id: `mr${i}`, name: d.name, employeeCount: d.emp,
  }));

  return (
    <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.065)", background: "rgba(6,14,28,0.92)", overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color="#a855f7" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>غرف الاجتماعات</span>
        </div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض التقويم</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.map((room, i) => {
          const occupied = i === 0;
          return (
            <li key={room.id ?? i} style={{ padding: "10px 16px", borderBottom: i < list.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: occupied ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.04)",
              }}>
                <MessageSquare size={14} color={occupied ? "#a78bfa" : "#3a5a7a"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#c8ddf0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</p>
                <p style={{ fontSize: 10, color: "#3a5a7a", margin: "2px 0 0" }}>{occupied ? "11:00 - 11:30" : "لا يوجد اجتماع محدول"}</p>
              </div>
              <button type="button" style={{
                flexShrink: 0, fontSize: 10, fontWeight: 500,
                padding: "4px 10px", borderRadius: 8,
                border: occupied ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
                background: occupied ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                color: occupied ? "#c4b5fd" : "#5a7a9a",
                cursor: "default",
              }}>
                {occupied ? "مشغولة الآن" : "جدولة سريعة"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── AI ALERTS PANEL ──────────────────────────────────────────────────────────

function AIAlertsPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  type AlertItem = { id: string; type: "تنبيه" | "تحذير" | "حاد" | "توصية"; text: string; room: string; Icon: React.ElementType; };
  const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    "تنبيه":  { bg: "rgba(245,158,11,0.14)", color: "#fbbf24", border: "rgba(245,158,11,0.28)" },
    "تحذير":  { bg: "rgba(245,158,11,0.18)", color: "#f59e0b", border: "rgba(245,158,11,0.32)" },
    "حاد":    { bg: "rgba(239,68,68,0.14)",  color: "#f87171", border: "rgba(239,68,68,0.28)"  },
    "توصية":  { bg: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  };

  const alerts: AlertItem[] = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const overdue = safeTasks.filter((t) => t?.status === "متأخرة");
    const pending = safeTasks.filter((t) => t?.status === "بانتظار_المراجعة");
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrainCircuit size={14} color="#22d3ee" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>تنبيهات الذكاء الاصطناعي</span>
        </div>
        <span style={{ fontSize: 10, color: "#3a5a7a" }}>عرض الكل</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {alerts.slice(0, 4).map((alert, i) => {
          const ts = TYPE_STYLE[alert.type] ?? TYPE_STYLE["تنبيه"]!;
          const AlertIcon = alert.Icon;
          return (
            <li key={alert.id} style={{ padding: "10px 16px", borderBottom: i < Math.min(alerts.length, 4) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)" }}>
                <AlertIcon size={13} color={ts.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, display: "inline-block", marginBottom: 4 }}>
                  {alert.type}
                </span>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function VirtualOfficeDesign({
  snapshot,
  employees,
  tasks,
  onBackToOrg,
  onRefresh,
  isRefreshing = false,
}: VirtualOfficeDesignProps) {
  const { rooms, isDemo } = useMemo(
    () => buildRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  const safeRels  = useMemo(() => Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [], [snapshot]);
  const safeDepts = useMemo(() => Array.isArray(snapshot?.departments) ? snapshot!.departments : [], [snapshot]);
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);

  const openTasks    = safeTasks.filter((t) => t?.status !== "مكتملة").length;
  const overdueTasks = safeTasks.filter((t) => t?.status === "متأخرة").length;
  const activeEmps   = safeRels.length;
  const deptCount    = isDemo ? DEMO_DEF.length : safeDepts.length;

  const avgHealth = useMemo(() => {
    const hr = rooms.filter((r) => r.healthPct > 0);
    return hr.length === 0 ? 82 : Math.round(hr.reduce((s, r) => s + r.healthPct, 0) / hr.length);
  }, [rooms]);

  const kpis = [
    { label: "صحة المكتب",       value: `${avgHealth}%`, sub: hpLabel(avgHealth),                  Icon: Heart,        iconBg: "rgba(16,185,129,0.28)" },
    { label: "الأقسام",          value: deptCount,        sub: undefined,                          Icon: LayoutGrid,   iconBg: "rgba(34,211,238,0.25)" },
    { label: "الموظفون النشطون", value: isDemo ? 18 : activeEmps, sub: `من ${isDemo ? 24 : (Array.isArray(employees) ? employees.length : 0)}`, Icon: Users, iconBg: "rgba(59,130,246,0.25)" },
    { label: "اجتماعات اليوم",  value: isDemo ? 5 : 0,   sub: isDemo ? "اجتماعات" : undefined,    Icon: Calendar,     iconBg: "rgba(139,92,246,0.25)" },
    { label: "المهام المفتوحة",  value: isDemo ? 46 : openTasks,    sub: "مهمة",                  Icon: CheckCircle2, iconBg: "rgba(16,185,129,0.25)" },
    { label: "المهام المتأخرة",  value: isDemo ? 6  : overdueTasks, sub: "مهمة",                  Icon: AlertCircle,  iconBg: "rgba(245,158,11,0.28)" },
    { label: "تنبيهات AI",       value: isDemo ? 4  : Math.max(overdueTasks, 0), sub: "تنبيه",    Icon: BrainCircuit, iconBg: "rgba(139,92,246,0.28)" },
  ];

  return (
    <div className="space-y-5 min-w-0" dir="rtl">

      {/* ── Header ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        borderRadius: 20,
        border: "1px solid rgba(34,211,238,0.18)",
        padding: "20px 22px",
        background: "linear-gradient(135deg, rgba(6,15,30,0.98) 0%, rgba(18,36,68,0.96) 55%, rgba(50,16,80,0.14) 100%)",
        boxShadow: "0 0 70px rgba(34,211,238,0.05)",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.09), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {/* Title */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.20)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.32)" }}>BETA</span>
              {isDemo && (
                <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={9} color="#fcd34d" />
                  عرض توضيحي
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              المكتب الافتراضي الذكي
            </h1>
            <p style={{ fontSize: 13, color: "#7a9ab8", marginTop: 8, maxWidth: 520, lineHeight: 1.6 }}>
              محاكاة تفاعلية لهيكل منشأتك. اعرف كل ما يحدث في أقسامك في نظرة واحدة.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={onBackToOrg} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)", color: "#8ba3c7",
              fontSize: 13, cursor: "pointer",
            }}>
              <ArrowRight size={14} />
              رجوع للهيكل
            </button>
            <button type="button" onClick={onRefresh} disabled={isRefreshing || !onRefresh} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 12,
              border: "1px solid rgba(34,211,238,0.25)",
              background: "rgba(34,211,238,0.08)", color: "#22d3ee",
              fontSize: 13, cursor: "pointer", opacity: (isRefreshing || !onRefresh) ? 0.5 : 1,
            }}>
              <RefreshCw size={14} style={isRefreshing ? { animation: "spin 1s linear infinite" } : undefined} />
              مزامنة من الهيكل
            </button>
            <div className="relative group" style={{ position: "relative" }}>
              <button type="button" disabled style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 12,
                border: "1px solid rgba(139,92,246,0.22)",
                background: "rgba(139,92,246,0.07)", color: "rgba(168,85,247,0.50)",
                fontSize: 13, cursor: "not-allowed",
              }}>
                <BrainCircuit size={14} />
                تقرير AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Row ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} Icon={k.Icon} iconBg={k.iconBg} />
        ))}
      </div>

      {/* ── Office Floor Plan ── */}
      <VirtualOfficeReferenceScene rooms={rooms} />

      {/* ── Bottom Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ alignItems: "start" }}>
        <ActivityPanel tasks={safeTasks} rooms={rooms} />
        <MeetingRoomsPanel rooms={rooms} />
        <AIAlertsPanel tasks={safeTasks} rooms={rooms} />
      </div>

      {/* Footer */}
      <p style={{ fontSize: 10, color: "#1e3050", textAlign: "center", paddingBottom: 8 }}>
        معاينة للقراءة فقط · لا تغييرات في البيانات · مبني من الهيكل الإداري
      </p>

      {/* Keyframes for spin */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
