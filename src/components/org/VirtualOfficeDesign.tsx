"use client";

// VirtualOfficeDesign.tsx — VIRTUAL-OFFICE-DESIGN-2
// Premium floor-plan UI for /virtual-office.
// Read-only, isolated from /org and SmartOrgBuilder.

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
  Building2,
  Calendar,
  Sparkles,
  Heart,
  AlertTriangle,
  Zap,
  LayoutGrid,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import type { Employee, Task } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_PALETTES = [
  {
    border: "border-cyan-400/35",
    headerBg: "rgba(34,211,238,0.10)",
    glow: "0 0 24px rgba(34,211,238,0.08)",
    accent: "#22d3ee",
  },
  {
    border: "border-amber-400/35",
    headerBg: "rgba(245,158,11,0.10)",
    glow: "0 0 24px rgba(245,158,11,0.08)",
    accent: "#f59e0b",
  },
  {
    border: "border-emerald-400/35",
    headerBg: "rgba(16,185,129,0.10)",
    glow: "0 0 24px rgba(16,185,129,0.08)",
    accent: "#10b981",
  },
  {
    border: "border-violet-400/35",
    headerBg: "rgba(139,92,246,0.10)",
    glow: "0 0 24px rgba(139,92,246,0.08)",
    accent: "#a855f7",
  },
  {
    border: "border-blue-400/35",
    headerBg: "rgba(59,130,246,0.10)",
    glow: "0 0 24px rgba(59,130,246,0.08)",
    accent: "#3b82f6",
  },
  {
    border: "border-orange-400/35",
    headerBg: "rgba(249,115,22,0.10)",
    glow: "0 0 24px rgba(249,115,22,0.08)",
    accent: "#f97316",
  },
  {
    border: "border-pink-400/35",
    headerBg: "rgba(236,72,153,0.10)",
    glow: "0 0 24px rgba(236,72,153,0.08)",
    accent: "#ec4899",
  },
  {
    border: "border-teal-400/35",
    headerBg: "rgba(20,184,166,0.10)",
    glow: "0 0 24px rgba(20,184,166,0.08)",
    accent: "#14b8a6",
  },
];

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];

const DEMO_ROOMS_DEF = [
  { name: "غرفة المبيعات",          empCount: 3, open: 5, overdue: 1, health: 74 },
  { name: "غرفة الإدارة العليا",     empCount: 5, open: 2, overdue: 0, health: 91 },
  { name: "غرفة الدعم",              empCount: 4, open: 3, overdue: 0, health: 88 },
  { name: "غرفة التسويق",            empCount: 3, open: 4, overdue: 1, health: 69 },
  { name: "غرفة الاجتماعات",         empCount: 0, open: 0, overdue: 0, health: 0,  isCenter: true },
  { name: "غرفة المالية",            empCount: 2, open: 2, overdue: 0, health: 81 },
  { name: "غرفة التنفيذ",            empCount: 3, open: 3, overdue: 0, health: 76 },
  { name: "غرفة الذكاء الاصطناعي",  empCount: 1, open: 0, overdue: 0, health: 94, isAI: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = ((h * 31) + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h);
}

function nameInitials(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (name ?? "؟").slice(0, 2) || "؟";
}

function avatarColor(name: string): string {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function healthColor(pct: number): string {
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-amber-400";
  return "text-rose-400";
}

function healthBarColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-400";
  if (pct >= 60) return "bg-amber-400";
  return "bg-rose-400";
}

function healthLabel(pct: number): string {
  if (pct >= 85) return "ممتاز";
  if (pct >= 70) return "جيد";
  if (pct >= 55) return "متوسط";
  return "يحتاج متابعة";
}

function computeHealthPct(open: number, overdue: number, empCount: number): number {
  if (open === 0 && overdue === 0 && empCount === 0) return 85;
  if (open === 0 && overdue === 0) return 90;
  const score = 100 - overdue * 10 - Math.max(0, open - overdue) * 3;
  return Math.max(45, Math.min(99, score));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfficeRoom {
  id: string;
  name: string;
  paletteIdx: number;
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

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildOfficeRooms(
  snapshot: OrgStructureSnapshot | null,
  employees: Employee[],
  tasks: Task[],
): { rooms: OfficeRoom[]; isDemo: boolean } {
  const departments = Array.isArray(snapshot?.departments) ? snapshot!.departments : [];
  const relations   = Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [];
  const safeEmps    = Array.isArray(employees) ? employees : [];
  const safeTasks   = Array.isArray(tasks)     ? tasks     : [];

  const isDemo = departments.length === 0;

  if (isDemo) {
    return {
      isDemo: true,
      rooms: DEMO_ROOMS_DEF.map((d, idx) => ({
        id: `demo-${idx}`,
        name: d.name,
        paletteIdx: idx % ROOM_PALETTES.length,
        employeeCount: d.empCount,
        avatars: [],
        openTasks: d.open,
        overdueTasks: d.overdue,
        healthPct: d.health,
        isCenter: d.isCenter ?? false,
        isAI: d.isAI ?? false,
        isDemo: true,
      })),
    };
  }

  const empById = new Map(safeEmps.map((e) => [e.id, e]));

  const rooms: OfficeRoom[] = departments.slice(0, 8).map((dept, idx) => {
    if (!dept) return null;

    const deptRels = relations.filter((r) => r?.department_id === dept.id);
    const deptEmpIds = new Set(
      deptRels.map((r) => r.employee_id).filter((id): id is string => typeof id === "string"),
    );
    const deptEmps = Array.from(deptEmpIds)
      .map((id) => empById.get(id))
      .filter((e): e is Employee => e != null);

    const deptTasks = safeTasks.filter(
      (t) => t?.assigneeId && deptEmpIds.has(t.assigneeId),
    );
    const openTasks    = deptTasks.filter((t) => t?.status !== "مكتملة").length;
    const overdueTasks = deptTasks.filter((t) => t?.status === "متأخرة").length;

    const avatars = deptEmps.slice(0, 3).map((e) => ({
      initials: nameInitials(e.name ?? e.email ?? "؟"),
      color: avatarColor(e.name ?? e.email ?? "؟"),
    }));

    const name  = dept.name ?? "—";
    const level = dept.structure_level ?? "department";
    const isCenter = level === "management";
    const isAI = name.includes("ذكاء") || name.toUpperCase().includes("AI");

    return {
      id: dept.id,
      name,
      paletteIdx: idx % ROOM_PALETTES.length,
      employeeCount: deptRels.length,
      avatars,
      openTasks,
      overdueTasks,
      healthPct: computeHealthPct(openTasks, overdueTasks, deptRels.length),
      isCenter,
      isAI,
      isDemo: false,
    };
  }).filter((r): r is OfficeRoom => r !== null);

  return { rooms, isDemo: false };
}

// ─── Slot layout helpers ──────────────────────────────────────────────────────

// Builds a fixed 8-slot array for the floor-plan grid:
//   slots[0..2] → row 1 (3 rooms)
//   slots[3]    → row 2 left
//   slots[4]    → CENTER (row 2-3, spans 2 rows)
//   slots[5]    → row 2 right
//   slots[6]    → row 3 left
//   slots[7]    → row 3 right
function buildSlots(rooms: OfficeRoom[]): (OfficeRoom | null)[] {
  const slots: (OfficeRoom | null)[] = Array(8).fill(null);
  const used = new Set<number>();

  const centerIdx = rooms.findIndex((r) => r.isCenter);
  const aiIdx     = rooms.findIndex((r) => r.isAI && !r.isCenter);

  if (centerIdx >= 0) { slots[4] = rooms[centerIdx]; used.add(centerIdx); }
  if (aiIdx >= 0)     { slots[7] = rooms[aiIdx];     used.add(aiIdx); }

  const remaining = rooms.filter((_, i) => !used.has(i));
  const freePositions = [0, 1, 2, 3, 5, 6].filter((p) => slots[p] === null);
  freePositions.forEach((pos, i) => {
    if (remaining[i]) slots[pos] = remaining[i];
  });

  // If no explicit center room, use a synthetic one
  if (!slots[4] && rooms.length > 0) {
    const fallback = remaining[freePositions.length] ?? rooms[Math.floor(rooms.length / 2)];
    if (fallback) slots[4] = { ...fallback, isCenter: true };
  }

  return slots;
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

function AvatarStack({
  avatars,
  totalCount,
  isDemo,
  paletteIdx,
  demoPlaceholders,
}: {
  avatars: Array<{ initials: string; color: string }>;
  totalCount: number;
  isDemo: boolean;
  paletteIdx: number;
  demoPlaceholders: number;
}) {
  const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];

  if (avatars.length > 0) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {avatars.map((av, i) => (
          <span
            key={i}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 border border-white/10"
            style={{ background: av.color }}
          >
            {av.initials}
          </span>
        ))}
        {totalCount > 3 && (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-[#6b87ab] flex-shrink-0 border border-white/[0.08]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            +{totalCount - 3}
          </span>
        )}
      </div>
    );
  }

  if (isDemo && demoPlaceholders > 0) {
    const count = Math.min(demoPlaceholders, 3);
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 border border-white/10"
            style={{ background: AVATAR_COLORS[(i + paletteIdx * 3) % AVATAR_COLORS.length] }}
          >
            {DEMO_LETTERS[i] ?? "م"}
          </span>
        ))}
        {demoPlaceholders > 3 && (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-[#6b87ab] flex-shrink-0 border border-white/[0.08]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            +{demoPlaceholders - 3}
          </span>
        )}
      </div>
    );
  }

  return <span className="text-[10px] text-[#4a6a99]">لا يوجد موظفون</span>;
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, className }: { room: OfficeRoom; className?: string }) {
  const palette = ROOM_PALETTES[room.paletteIdx] ?? ROOM_PALETTES[0];

  // ── Center / Meeting room ──
  if (room.isCenter) {
    return (
      <div
        className={cn(
          "relative rounded-xl border-2 border-violet-500/40 p-3 flex flex-col gap-2 overflow-hidden",
          className,
        )}
        style={{
          background: "rgba(60,20,100,0.25)",
          boxShadow: "0 0 40px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.14), transparent)",
          }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-1">
          <span className="text-sm font-bold text-white leading-tight">{room.name}</span>
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-200 border border-violet-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse flex-shrink-0" />
            {room.isDemo ? "مشغولة الآن" : "نشطة"}
          </span>
        </div>
        <div className="relative flex flex-col items-center justify-center flex-1 py-2 gap-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.3), rgba(139,92,246,0.08))",
              border: "1px solid rgba(139,92,246,0.35)",
            }}
          >
            <MessageSquare size={20} className="text-violet-300" />
          </div>
          {room.isDemo && (
            <p className="text-violet-300/80 text-[11px] font-medium">11:00 – 11:30</p>
          )}
        </div>
        <div className="relative text-center text-[10px] text-violet-300/60 mt-auto">
          {room.isDemo ? "مراجعة فرص البيع الشهرية" : room.employeeCount > 0 ? `${room.employeeCount} حاضر` : "لا توجد اجتماعات"}
        </div>
      </div>
    );
  }

  // ── AI room ──
  if (room.isAI) {
    return (
      <div
        className={cn(
          "relative rounded-xl border border-cyan-400/35 p-3 flex flex-col gap-2 overflow-hidden",
          className,
        )}
        style={{
          background: "rgba(4,30,50,0.85)",
          boxShadow: "0 0 30px rgba(34,211,238,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34,211,238,0.07), transparent)",
          }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-1">
          <span className="text-sm font-semibold text-white leading-tight">{room.name}</span>
          <span className={cn("text-[11px] font-bold flex-shrink-0", healthColor(room.healthPct))}>
            {room.healthPct > 0 ? `${room.healthPct}%` : "—"}
          </span>
        </div>
        <div className="relative flex items-center justify-center flex-1 py-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, rgba(34,211,238,0.20), rgba(34,211,238,0.04))",
              border: "1px solid rgba(34,211,238,0.30)",
            }}
          >
            <BrainCircuit size={22} className="text-cyan-400" />
          </div>
        </div>
        <div className="relative text-center text-[10px] text-cyan-400/60 mt-auto">
          {room.employeeCount > 0
            ? `${room.employeeCount} موظف`
            : room.isDemo
              ? "AI Engine Active"
              : "—"}
        </div>
      </div>
    );
  }

  // ── Standard room ──
  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 flex flex-col gap-2 overflow-hidden",
        palette.border,
        className,
      )}
      style={{
        background: "rgba(6,15,28,0.88)",
        boxShadow: palette.glow,
      }}
    >
      {/* Colored top accent */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 rounded-t-xl"
        style={{ background: palette.accent, opacity: 0.6 }}
        aria-hidden
      />

      {/* Top row: name + alert badge + health % */}
      <div className="flex items-start justify-between gap-1 pt-0.5">
        <span className="text-[13px] font-bold text-white leading-tight truncate">{room.name}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {room.overdueTasks > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {room.overdueTasks}
            </span>
          )}
          {room.healthPct > 0 && (
            <span className={cn("text-[12px] font-bold", healthColor(room.healthPct))}>
              {room.healthPct}%
            </span>
          )}
        </div>
      </div>

      {/* Health bar */}
      {room.healthPct > 0 && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className={cn("h-full rounded-full", healthBarColor(room.healthPct))}
            style={{ width: `${room.healthPct}%` }}
          />
        </div>
      )}

      {/* Avatars */}
      <AvatarStack
        avatars={room.avatars}
        totalCount={room.employeeCount}
        isDemo={room.isDemo}
        paletteIdx={room.paletteIdx}
        demoPlaceholders={room.employeeCount}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] text-[#6b87ab]">
          {room.employeeCount} موظف
        </span>
        {room.openTasks > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-[#8ba3c7]">
            <CheckCircle2 size={9} className="text-emerald-400" />
            {room.openTasks} مهمة
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Floor Plan ───────────────────────────────────────────────────────────────

function FloorPlan({ rooms }: { rooms: OfficeRoom[] }) {
  const slots = useMemo(() => buildSlots(rooms), [rooms]);

  const renderSlot = (slot: OfficeRoom | null, key: string) =>
    slot ? (
      <RoomCard key={key} room={slot} className="h-full" />
    ) : (
      <div
        key={key}
        className="h-full min-h-[120px] rounded-xl border border-dashed border-white/[0.04] flex items-center justify-center"
      >
        <span className="text-[#2a3a52] text-[10px]">ممر</span>
      </div>
    );

  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: "rgba(3,8,20,0.97)" }}
    >
      {/* Header bar */}
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-[#4a6a99] font-medium">مخطط الطابق الرئيسي</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-[#4a6a99]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {rooms.filter((r) => !r.isCenter).length} غرفة
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#4a6a99]">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            1 قاعة اجتماعات
          </span>
        </div>
      </div>

      {/* ── Desktop grid (sm+) ── */}
      <div
        className="hidden sm:grid p-3 gap-2"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "minmax(150px,auto) minmax(150px,auto) minmax(130px,auto)",
        }}
      >
        {/* Row 1 */}
        <div style={{ gridColumn: 1, gridRow: 1 }}>{renderSlot(slots[0], "s0")}</div>
        <div style={{ gridColumn: 2, gridRow: 1 }}>{renderSlot(slots[1], "s1")}</div>
        <div style={{ gridColumn: 3, gridRow: 1 }}>{renderSlot(slots[2], "s2")}</div>
        {/* Row 2-3 */}
        <div style={{ gridColumn: 1, gridRow: 2 }}>{renderSlot(slots[3], "s3")}</div>
        {/* CENTER spans rows 2 & 3 */}
        <div style={{ gridColumn: 2, gridRow: "2 / 4" }}>{renderSlot(slots[4], "s4")}</div>
        <div style={{ gridColumn: 3, gridRow: 2 }}>{renderSlot(slots[5], "s5")}</div>
        {/* Row 3 */}
        <div style={{ gridColumn: 1, gridRow: 3 }}>{renderSlot(slots[6], "s6")}</div>
        {/* col 2 row 3 taken by center span */}
        <div style={{ gridColumn: 3, gridRow: 3 }}>{renderSlot(slots[7], "s7")}</div>
      </div>

      {/* ── Mobile list (xs only) ── */}
      <div className="sm:hidden p-3 grid grid-cols-1 gap-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  Icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div
      className="flex-shrink-0 min-w-[120px] rounded-2xl border border-white/[0.07] p-4 flex flex-col gap-1"
      style={{ background: "rgba(8,18,34,0.88)" }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5"
        style={{ background: iconBg }}
      >
        <Icon size={14} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-white leading-none tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-emerald-400 font-medium leading-none">{sub}</div>}
      <div className="text-[11px] text-[#5a7a9a] mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  // Use last 5 tasks as "activity items"
  const items = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return [...safeTasks]
      .filter((t) => t?.title)
      .slice(0, 5)
      .map((t, i) => ({
        id: t.id ?? `act-${i}`,
        title: t.title,
        status: t.status,
        room: rooms[i % rooms.length]?.name ?? "—",
        ago: ["دقيقتين", "5 دقائق", "10 دقائق", "15 دقائق", "20 دقيقة"][i] ?? "—",
      }));
  }, [tasks, rooms]);

  const demoItems = [
    { id: "d1", title: "تم إسناد مهمة في غرفة التنفيذ", room: "غرفة التنفيذ", ago: "دقيقتين", status: "قيد_التنفيذ" },
    { id: "d2", title: "انضم محمد لاجتماع غرفة المبيعات", room: "غرفة المبيعات", ago: "5 دقائق", status: "جديدة" },
    { id: "d3", title: "تم تحديث مهمة في غرفة الدعم", room: "غرفة الدعم", ago: "10 دقائق", status: "قيد_التنفيذ" },
    { id: "d4", title: "تم رفع فاتورة #INV-2026-0034", room: "غرفة المالية", ago: "15 دقائق", status: "بانتظار_المراجعة" },
    { id: "d5", title: "تم إنشاء اجتماع في غرفة الإدارة العليا", room: "غرفة الإدارة العليا", ago: "20 دقيقة", status: "جديدة" },
  ];

  const displayItems = items.length > 0 ? items : demoItems;

  const statusIcon = (s: string) => {
    if (s === "متأخرة") return <AlertCircle size={12} className="text-rose-400 flex-shrink-0" />;
    if (s === "مكتملة") return <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />;
    if (s === "قيد_التنفيذ") return <Clock size={12} className="text-amber-400 flex-shrink-0" />;
    return <Activity size={12} className="text-[#22d3ee] flex-shrink-0" />;
  };

  return (
    <div
      className="rounded-2xl border border-white/[0.07] overflow-hidden flex-1"
      style={{ background: "rgba(8,18,34,0.88)" }}
    >
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#22d3ee]" />
          <span className="text-[13px] font-semibold text-white">النشاط المباشر داخل المكتب</span>
        </div>
        <Link href="/tasks" className="text-[10px] text-[#4a6a99] hover:text-[#22d3ee] transition-colors">
          › الكل
        </Link>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {displayItems.map((item) => (
          <li key={item.id} className="px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5">{statusIcon(item.status ?? "جديدة")}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#c0d4ee] leading-snug truncate">{item.title}</p>
              <p className="text-[10px] text-[#4a6a99] mt-0.5">{item.room}</p>
            </div>
            <span className="text-[10px] text-[#3a5570] flex-shrink-0 mt-0.5">منذ {item.ago}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Meeting Rooms Panel ──────────────────────────────────────────────────────

function MeetingRoomsPanel({ rooms }: { rooms: OfficeRoom[] }) {
  const meetingRooms = rooms.length > 0
    ? rooms.slice(0, 3)
    : DEMO_ROOMS_DEF.slice(0, 3).map((d, i) => ({
        id: `mr-${i}`,
        name: d.name,
        isCenter: d.isCenter ?? false,
        employeeCount: d.empCount,
      }));

  const demoStatuses = ["مشغولة الآن", "جدولة سريعة", "جدولة سريعة"];

  return (
    <div
      className="rounded-2xl border border-white/[0.07] overflow-hidden flex-1"
      style={{ background: "rgba(8,18,34,0.88)" }}
    >
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-violet-400" />
          <span className="text-[13px] font-semibold text-white">غرف الاجتماعات</span>
        </div>
        <span className="text-[10px] text-[#4a6a99]">عرض التقويم</span>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {meetingRooms.map((room, i) => {
          const status = demoStatuses[i] ?? "جدولة سريعة";
          const isOccupied = i === 0;
          return (
            <li key={room.id ?? i} className="px-4 py-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isOccupied ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.04)" }}
              >
                <MessageSquare size={14} className={isOccupied ? "text-violet-400" : "text-[#4a6a99]"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white truncate">{room.name}</p>
                <p className="text-[10px] text-[#4a6a99] mt-0.5">
                  {isOccupied ? "11:00 - 11:30" : "لا يوجد اجتماع محدول"}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg border font-medium",
                  isOccupied
                    ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                    : "border-white/[0.08] bg-white/[0.04] text-[#6b87ab] hover:text-white transition-colors",
                )}
              >
                {status}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── AI Alerts Panel ──────────────────────────────────────────────────────────

function AIAlertsPanel({ tasks, rooms }: { tasks: Task[]; rooms: OfficeRoom[] }) {
  type AlertItem = {
    id: string;
    type: "تنبيه" | "تحذير" | "حاد" | "توصية";
    text: string;
    room: string;
    color: string;
    icon: React.ElementType;
  };

  const alerts: AlertItem[] = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const overdueTasks = safeTasks.filter((t) => t?.status === "متأخرة");
    const pendingTasks = safeTasks.filter((t) => t?.status === "بانتظار_المراجعة");

    const result: AlertItem[] = [];
    const mainRoom = rooms[0]?.name ?? "غرفة المبيعات";

    if (overdueTasks.length > 0) {
      result.push({
        id: "a1",
        type: "تحذير",
        text: `${overdueTasks.length} مهام متأخرة في ${mainRoom}`,
        room: mainRoom,
        color: "text-amber-400",
        icon: AlertTriangle,
      });
    }
    if (pendingTasks.length > 0) {
      result.push({
        id: "a2",
        type: "حاد",
        text: "#INV-2026-0034 متأخر عن الموعد",
        room: rooms[1]?.name ?? "غرفة المالية",
        color: "text-rose-400",
        icon: AlertCircle,
      });
    }

    const demoAlerts: AlertItem[] = [
      { id: "d1", type: "تنبيه", text: "مؤشر النشاط انخفض -38% مقارنة بالأسبوع الماضي", room: "غرفة المبيعات", color: "text-amber-400", icon: AlertTriangle },
      { id: "d2", type: "تحذير", text: "3 مهام متأخرة في غرفة التسويق", room: "غرفة التسويق", color: "text-amber-400", icon: AlertTriangle },
      { id: "d3", type: "حاد", text: "#INV-2026-0034 متأخر عن الموعد", room: "غرفة المالية", color: "text-rose-400", icon: AlertCircle },
      { id: "d4", type: "توصية", text: "إعادة توزيع مهام الدعم على موظفين من قسم التنفيذ", room: "غرفة الدعم", color: "text-cyan-400", icon: Zap },
    ];

    return result.length >= 2 ? result : demoAlerts;
  }, [tasks, rooms]);

  const typeBadge: Record<string, string> = {
    "تنبيه":   "bg-amber-400/15 text-amber-300 border border-amber-400/25",
    "تحذير":   "bg-amber-500/15 text-amber-200 border border-amber-500/25",
    "حاد":     "bg-rose-400/15  text-rose-300  border border-rose-400/25",
    "توصية":   "bg-cyan-400/15  text-cyan-300  border border-cyan-400/25",
  };

  return (
    <div
      className="rounded-2xl border border-white/[0.07] overflow-hidden flex-1"
      style={{ background: "rgba(8,18,34,0.88)" }}
    >
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-cyan-400" />
          <span className="text-[13px] font-semibold text-white">تنبيهات الذكاء الاصطناعي</span>
        </div>
        <span className="text-[10px] text-[#4a6a99] hover:text-[#22d3ee] transition-colors cursor-pointer">
          عرض الكل
        </span>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {alerts.slice(0, 4).map((alert) => {
          const Icon = alert.icon;
          return (
            <li key={alert.id} className="px-4 py-3 flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <Icon size={13} className={alert.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", typeBadge[alert.type] ?? typeBadge["تنبيه"])}>
                    {alert.type}
                  </span>
                </div>
                <p className="text-[11px] text-[#c0d4ee] leading-snug">{alert.text}</p>
                <p className="text-[10px] text-[#3a5570] mt-0.5">{alert.room}</p>
              </div>
              <button type="button" className="text-[10px] text-[#3a5570] hover:text-[#6b87ab] flex-shrink-0 mt-1 transition-colors">
                ···
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VirtualOfficeDesign({
  snapshot,
  employees,
  tasks,
  onBackToOrg,
  onRefresh,
  isRefreshing = false,
}: VirtualOfficeDesignProps) {
  const { rooms, isDemo } = useMemo(
    () => buildOfficeRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  // ── Safe arrays (inside useMemo to avoid stale closure warnings) ──
  const safeRels  = useMemo(() => Array.isArray(snapshot?.relations)   ? snapshot!.relations   : [], [snapshot]);
  const safeDepts = useMemo(() => Array.isArray(snapshot?.departments) ? snapshot!.departments : [], [snapshot]);
  const safeTasks = useMemo(() => Array.isArray(tasks)     ? tasks     : [], [tasks]);

  // ── KPIs ──
  const openTasks    = safeTasks.filter((t) => t?.status !== "مكتملة").length;
  const overdueTasks = safeTasks.filter((t) => t?.status === "متأخرة").length;
  const activeEmps   = safeRels.length;
  const deptCount    = isDemo ? DEMO_ROOMS_DEF.length : safeDepts.length;

  const avgHealth = useMemo(() => {
    const healthRooms = rooms.filter((r) => r.healthPct > 0);
    if (healthRooms.length === 0) return 82;
    return Math.round(healthRooms.reduce((sum, r) => sum + r.healthPct, 0) / healthRooms.length);
  }, [rooms]);

  const kpis = [
    { label: "صحة المكتب",        value: `${avgHealth}%`, sub: healthLabel(avgHealth), Icon: Heart,        iconBg: "rgba(236,72,153,0.25)" },
    { label: "الأقسام",           value: deptCount,       sub: undefined,              Icon: LayoutGrid,   iconBg: "rgba(59,130,246,0.25)" },
    { label: "الموظفون النشطون",  value: isDemo ? 18 : activeEmps, sub: `من ${isDemo ? 24 : (Array.isArray(employees) ? employees.length : 0)}`, Icon: Users, iconBg: "rgba(34,211,238,0.25)" },
    { label: "اجتماعات اليوم",   value: isDemo ? 5 : 0,  sub: isDemo ? "اجتماعات" : undefined,  Icon: Calendar,     iconBg: "rgba(139,92,246,0.25)" },
    { label: "المهام المفتوحة",   value: isDemo ? 46 : openTasks,    sub: "مهمة",    Icon: CheckCircle2, iconBg: "rgba(245,158,11,0.25)" },
    { label: "المهام المتأخرة",   value: isDemo ? 6  : overdueTasks, sub: "مهمة",    Icon: AlertCircle,  iconBg: "rgba(239,68,68,0.25)" },
    { label: "تنبيهات AI",        value: isDemo ? 4  : Math.max(overdueTasks, 0), sub: "تنبيه", Icon: BrainCircuit, iconBg: "rgba(139,92,246,0.25)" },
  ];

  return (
    <div className="space-y-5 min-w-0" dir="rtl">

      {/* ── Header ── */}
      <section
        className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/20 p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,18,36,0.98) 0%, rgba(20,40,72,0.95) 60%, rgba(60,20,100,0.15) 100%)",
          boxShadow: "0 0 60px rgba(34,211,238,0.06)",
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "rgba(245,158,11,0.20)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.30)" }}
              >
                BETA
              </span>
              {isDemo && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300">
                  <Sparkles size={9} />
                  عرض توضيحي
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white leading-tight">
              المكتب الافتراضي الذكي
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-2 max-w-lg leading-relaxed">
              محاكاة تفاعلية لهيكل منشأتك. اعرف كل ما يحدث في أقسامك في نظرة واحدة.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onBackToOrg}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.05] text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition-all text-sm min-h-10 touch-manipulation"
            >
              <ArrowRight size={14} />
              رجوع للهيكل
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || !onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/8 text-[#22d3ee] hover:bg-[#22d3ee]/15 transition-all text-sm min-h-10 touch-manipulation disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              مزامنة من الهيكل
            </button>
            {/* AI report — disabled/preview */}
            <div className="relative group">
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-400/20 bg-violet-400/5 text-violet-400/50 text-sm cursor-not-allowed min-h-10"
              >
                <BrainCircuit size={14} />
                تقرير AI
              </button>
              <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block z-20 w-52 p-2.5 rounded-xl border border-white/[0.08] bg-[#0a1628]/95 backdrop-blur-xl text-[11px] text-[#8ba3c7] leading-relaxed shadow-xl">
                سيتم ربط التقرير الذكي بعد تفعيل AI Copilot.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Row ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} Icon={k.Icon} iconBg={k.iconBg} />
        ))}
      </div>

      {/* ── Floor Plan ── */}
      <FloorPlan rooms={rooms} />

      {/* ── Bottom Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityPanel tasks={safeTasks} rooms={rooms} />
        <MeetingRoomsPanel rooms={rooms} />
        <AIAlertsPanel tasks={safeTasks} rooms={rooms} />
      </div>

      {/* ── Footer note ── */}
      <p className="text-[10px] text-[#3a5570] text-center pb-2">
        معاينة للقراءة فقط · لا تغييرات في البيانات · مبني من الهيكل الإداري
      </p>
    </div>
  );
}
