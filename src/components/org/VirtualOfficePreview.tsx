"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Shield,
  LayoutGrid,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import type { Employee, Task } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  agency: "جناح",
  management: "غرفة إدارة",
  department: "مساحة عمل",
};

const LEVEL_ICONS = {
  agency: Shield,
  management: Layers,
  department: Building2,
} as const;

const LEVEL_ACCENT: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  agency: {
    border: "border-amber-400/30",
    bg: "bg-amber-400/5",
    text: "text-amber-300",
    badge: "bg-amber-400/15 text-amber-300 border border-amber-400/25",
  },
  management: {
    border: "border-violet-400/30",
    bg: "bg-violet-400/5",
    text: "text-violet-300",
    badge: "bg-violet-400/15 text-violet-300 border border-violet-400/25",
  },
  department: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/5",
    text: "text-cyan-300",
    badge: "bg-cyan-400/15 text-cyan-300 border border-cyan-400/25",
  },
};

type HealthStatus = "ممتاز" | "يحتاج متابعة" | "ضغط مرتفع";

function getHealth(openCount: number, overdueCount: number, empCount: number): HealthStatus {
  if (empCount === 0) return "يحتاج متابعة";
  if (overdueCount > 0 && openCount > 0 && overdueCount >= openCount * 0.5) return "ضغط مرتفع";
  if (overdueCount > 0) return "يحتاج متابعة";
  return "ممتاز";
}

const HEALTH_STYLE: Record<HealthStatus, string> = {
  "ممتاز": "text-emerald-400 bg-emerald-400/10 border border-emerald-400/25",
  "يحتاج متابعة": "text-amber-400 bg-amber-400/10 border border-amber-400/25",
  "ضغط مرتفع": "text-rose-400 bg-rose-400/10 border border-rose-400/25",
};

const HEALTH_ICON: Record<HealthStatus, typeof CheckCircle2> = {
  "ممتاز": CheckCircle2,
  "يحتاج متابعة": Clock,
  "ضغط مرتفع": AlertCircle,
};

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface RoomCard {
  id: string;
  name: string;
  type: string;
  level: string;
  departmentCode?: string | null;
  employeeCount: number;
  teamCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  health: HealthStatus;
  teams: { id: string; name: string; memberCount: number }[];
}

interface VirtualOfficePreviewProps {
  snapshot: OrgStructureSnapshot;
  employees: Employee[];
  tasks: Task[];
  onBack: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Data builder
// ──────────────────────────────────────────────────────────────────────────────

function buildRooms(
  snapshot: OrgStructureSnapshot,
  employees: Employee[],
  tasks: Task[],
): RoomCard[] {
  const { departments, teams, relations } = snapshot;

  // Map employee IDs to employees for task lookup
  const employeeIdSet = new Set(employees.map((e) => e.id));

  return departments.map((dept) => {
    // Employees linked to this department
    const deptRelations = relations.filter((r) => r.department_id === dept.id);
    const deptEmployeeIds = new Set(deptRelations.map((r) => r.employee_id));
    const employeeCount = deptRelations.length;

    // Teams in this department
    const deptTeams = teams.filter((t) => t.department_id === dept.id);

    // Team member counts
    const teamCards = deptTeams.map((team) => {
      const memberCount = relations.filter((r) => r.team_id === team.id).length;
      return { id: team.id, name: team.name, memberCount };
    });

    // Tasks for employees in this department
    const deptTaskAssignees = new Set(
      Array.from(deptEmployeeIds).filter((id) => employeeIdSet.has(id)),
    );

    const deptTasks = tasks.filter(
      (t) => t.assigneeId && deptTaskAssignees.has(t.assigneeId),
    );

    const openTaskCount = deptTasks.filter(
      (t) => t.status !== "مكتملة",
    ).length;

    const overdueTaskCount = deptTasks.filter(
      (t) => t.status === "متأخرة",
    ).length;

    const level = dept.structure_level ?? "department";
    const type = LEVEL_LABELS[level] ?? "وحدة";

    return {
      id: dept.id,
      name: dept.name,
      type,
      level,
      departmentCode: dept.department_code ?? dept.publicCode ?? null,
      employeeCount,
      teamCount: deptTeams.length,
      openTaskCount,
      overdueTaskCount,
      health: getHealth(openTaskCount, overdueTaskCount, employeeCount),
      teams: teamCards,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Room card sub-component
// ──────────────────────────────────────────────────────────────────────────────

function RoomCardView({ room }: { room: RoomCard }) {
  const accent = LEVEL_ACCENT[room.level] ?? LEVEL_ACCENT.department;
  const Icon = LEVEL_ICONS[room.level as keyof typeof LEVEL_ICONS] ?? Building2;
  const HealthIcon = HEALTH_ICON[room.health];

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-5 flex flex-col gap-3 transition-all",
        "bg-[rgba(10,22,40,0.85)] backdrop-blur-[14px]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]",
        accent.border,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
              accent.bg,
            )}
          >
            <Icon size={16} className={accent.text} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">{room.name}</p>
            {room.departmentCode && (
              <p className="text-[10px] text-[#6b87ab] mt-0.5 font-mono">{room.departmentCode}</p>
            )}
          </div>
        </div>
        <span className={cn("flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium", accent.badge)}>
          {room.type}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8ba3c7]">
        <span className="flex items-center gap-1">
          <Users size={12} className="text-[#22d3ee]" />
          {room.employeeCount} موظف
        </span>
        {room.teamCount > 0 && (
          <span className="flex items-center gap-1">
            <LayoutGrid size={12} className="text-violet-400" />
            {room.teamCount} فريق
          </span>
        )}
        {room.openTaskCount > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            {room.openTaskCount} مهمة
          </span>
        )}
        {room.overdueTaskCount > 0 && (
          <span className="flex items-center gap-1">
            <AlertCircle size={12} className="text-rose-400" />
            {room.overdueTaskCount} متأخرة
          </span>
        )}
      </div>

      {/* Teams */}
      {room.teams.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {room.teams.map((team) => (
            <span
              key={team.id}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#8ba3c7]"
            >
              <LayoutGrid size={9} />
              {team.name}
              {team.memberCount > 0 && (
                <span className="text-[#6b87ab]">· {team.memberCount}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Health label */}
      <div className="mt-auto pt-2 border-t border-white/[0.05]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium",
            HEALTH_STYLE[room.health],
          )}
        >
          <HealthIcon size={11} />
          {room.health}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export default function VirtualOfficePreview({
  snapshot,
  employees,
  tasks,
  onBack,
}: VirtualOfficePreviewProps) {
  const rooms = useMemo(
    () => buildRooms(snapshot, employees, tasks),
    [snapshot, employees, tasks],
  );

  const isEmpty = snapshot.departments.length === 0 && snapshot.teams.length === 0;

  // Group rooms by level order: agency → management → department
  const grouped = useMemo(() => {
    const order = ["agency", "management", "department"];
    const groups: Record<string, RoomCard[]> = { agency: [], management: [], department: [] };
    for (const room of rooms) {
      const key = order.includes(room.level) ? room.level : "department";
      groups[key].push(room);
    }
    return order
      .filter((lvl) => groups[lvl].length > 0)
      .map((lvl) => ({ level: lvl, label: LEVEL_LABELS[lvl], rooms: groups[lvl] }));
  }, [rooms]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <section
        className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/20 p-5 sm:p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(20,40,70,0.9) 55%, rgba(88,28,135,0.12) 100%)",
          boxShadow: "0 0 60px rgba(34,211,238,0.06)",
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee]">
                <Sparkles size={11} />
                Beta · معاينة
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              المكتب الافتراضي للمنشأة
            </h2>
            <p className="text-[#8ba3c7] text-sm mt-2 max-w-lg leading-relaxed">
              هذه المعاينة تُبنى من الهيكل الإداري ولا تغيّر البيانات.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Disabled AI button */}
            <div className="relative group">
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-400/20 bg-violet-400/5 text-violet-400/50 text-sm cursor-not-allowed"
                aria-label="تقرير AI — غير مفعّل"
              >
                <BrainCircuit size={15} />
                تقرير AI
              </button>
              <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block z-10 w-56 p-2.5 rounded-xl border border-white/[0.08] bg-[#0a1628]/95 backdrop-blur-xl text-[11px] text-[#8ba3c7] leading-relaxed shadow-xl">
                سيتم ربط التقرير الذكي بعد تفعيل AI Copilot.
              </div>
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.05] text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition-all text-sm min-h-10 touch-manipulation"
            >
              <ArrowRight size={15} />
              الهيكل
            </button>
          </div>
        </div>
      </section>

      {/* Empty state */}
      {isEmpty ? (
        <div
          className="rounded-2xl border border-dashed border-[#22d3ee]/25 p-12 text-center flex flex-col items-center gap-4"
          style={{ background: "rgba(10,22,40,0.5)" }}
        >
          <Building2 size={40} className="text-[#22d3ee]/50" />
          <p className="text-[#8ba3c7] text-sm max-w-sm">
            ابدأ ببناء الهيكل الإداري لتفعيل المكتب الافتراضي.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ level, label, rooms: levelRooms }) => {
            const accent = LEVEL_ACCENT[level] ?? LEVEL_ACCENT.department;
            const Icon = LEVEL_ICONS[level as keyof typeof LEVEL_ICONS] ?? Building2;
            return (
              <section key={level} className="space-y-3">
                {/* Zone header */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      accent.bg,
                    )}
                  >
                    <Icon size={14} className={accent.text} />
                  </div>
                  <h3 className={cn("text-base font-semibold", accent.text)}>
                    {label}
                    <span className="mr-2 text-[#6b87ab] font-normal text-sm">
                      ({levelRooms.length})
                    </span>
                  </h3>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>

                {/* Room grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {levelRooms.map((room) => (
                    <RoomCardView key={room.id} room={room} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Summary bar */}
          <div
            className="rounded-2xl border border-white/[0.06] p-4 flex flex-wrap items-center gap-4 text-sm text-[#6b87ab]"
            style={{ background: "rgba(10,22,40,0.6)" }}
          >
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-[#22d3ee]" />
              {snapshot.departments.length} وحدة إدارية
            </span>
            <span className="flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-violet-400" />
              {snapshot.teams.length} فريق
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-emerald-400" />
              {snapshot.relations.length} موظف مرتبط
            </span>
            <span className="mr-auto text-[11px] text-[#4a6a99]">
              معاينة للقراءة فقط · لا تغييرات في البيانات
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
