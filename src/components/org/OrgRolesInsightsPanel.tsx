"use client";

import { useMemo } from "react";
import { Activity, Sparkles, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks } from "@/hooks/useData";
import {
  ORG_COMMAND_CENTER_HELPER_AR,
  ORG_COMMAND_CENTER_READONLY_AR,
  RISK_LABEL_AR,
  buildRolesIntelligence,
  type OrgRolesIntelligence,
  type RiskLevel,
} from "@/lib/org/buildRolesIntelligence";
import { TENANT_ORG_ROLE_DEFINITIONS } from "@/lib/org/packageHierarchy";
import type { Employee } from "@/types";
import type { OrgStructureSnapshot } from "@/lib/org/types";

const ROLE_ACCENT: Record<string, string> = {
  organization_manager: "#22d3ee",
  finance_manager: "#f59e0b",
  employee: "#8ba3c7",
};

interface Props {
  employees: Employee[] | undefined;
  orgSnapshot: OrgStructureSnapshot | null | undefined;
}

function riskBadgeClass(level: RiskLevel): string {
  if (level === "high") return "border-red-400/35 text-red-200 bg-red-500/10";
  if (level === "medium") return "border-amber-400/35 text-amber-200 bg-amber-500/10";
  return "border-cyan-400/30 text-cyan-200 bg-cyan-500/10";
}

function PulseMetric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[rgba(8,18,32,0.55)] p-2.5 min-w-0">
      <p className="text-[#6b87ab] text-[10px] mb-1 truncate">{label}</p>
      <p className="text-white text-sm font-semibold tabular-nums leading-none">
        {value}
        {suffix ? (
          <span className="text-[#8ba3c7] text-[10px] font-normal mr-0.5">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

function CommandCenterBody({ intel }: { intel: OrgRolesIntelligence }) {
  const { leadershipPulse, primaryAction, leadershipGaps, activeRoleInsights, recommendations } =
    intel;

  if (intel.isLowData) {
    return (
      <div
        className="rounded-xl border border-dashed border-cyan-400/25 p-6 text-center space-y-2"
        style={{ background: "rgba(10,22,40,0.45)" }}
      >
        <Users size={28} className="mx-auto text-[#22d3ee] opacity-80" />
        <p className="text-white text-xs font-medium">ابدأ بربط الموظفين بالهيكل</p>
        <p className="text-[#8ba3c7] text-[10px] leading-relaxed max-w-xs mx-auto">
          ابدأ بربط الموظفين بالهيكل لتفعيل قراءة الأدوار بشكل أدق.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-[#6b87ab] text-[10px] leading-relaxed">{ORG_COMMAND_CENTER_READONLY_AR}</p>

      {/* نبض القيادة */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/20 p-3 sm:p-4 space-y-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,22,40,0.92) 0%, rgba(30,50,90,0.75) 55%, rgba(88,28,135,0.12) 100%)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-25 blur-2xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
        />
        <div className="relative flex items-center gap-2">
          <Activity size={16} className="text-[#22d3ee] shrink-0" />
          <h4 className="text-white text-xs font-bold">نبض القيادة</h4>
          <span className="text-[#6b87ab] text-[10px] mr-auto">قراءة تشغيلية</span>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          <PulseMetric
            label="جاهزية الهيكل"
            value={leadershipPulse.structureReadinessPct}
            suffix="%"
          />
          <PulseMetric
            label="وضوح القيادة"
            value={leadershipPulse.leadershipClarityPct}
            suffix="%"
          />
          <PulseMetric label="ضغط المهام" value={leadershipPulse.taskPressureLabel} />
          <PulseMetric
            label="مستوى المخاطر"
            value={RISK_LABEL_AR[leadershipPulse.orgRiskLevel]}
          />
        </div>
        <div className="relative rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2">
          <p className="text-[#6b87ab] text-[10px] mb-0.5">توصية اليوم</p>
          <p className="text-[#b8cce8] text-[10px] leading-relaxed">
            {leadershipPulse.todayInsight}
          </p>
        </div>
      </div>

      {/* الإجراء المقترح */}
      <div
        className="rounded-xl border border-[#f59e0b]/25 p-3 space-y-1"
        style={{ background: "rgba(245,158,11,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Target size={14} className="text-[#f59e0b] shrink-0" />
          <p className="text-[#f59e0b] text-[10px] font-semibold">{primaryAction.title}</p>
        </div>
        <p className="text-[#b8cce8] text-[10px] leading-relaxed">{primaryAction.body}</p>
      </div>

      {/* فجوات القيادة */}
      <div className="space-y-2">
        <h4 className="text-white text-xs font-semibold">فجوات القيادة</h4>
        {leadershipGaps.length === 0 ? (
          <p className="text-[#8ba3c7] text-[10px] rounded-xl border border-[#1e3a5f]/60 px-3 py-2 bg-white/[0.02]">
            لا توجد فجوات قيادية واضحة حاليًا.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {leadershipGaps.map((gap) => (
              <span
                key={gap.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1e3a5f]/80 bg-[rgba(8,18,32,0.6)] px-2.5 py-1 text-[10px] text-[#b8cce8] max-w-full"
              >
                <span className="truncate">{gap.label}</span>
                <span className="text-[#22d3ee] font-semibold tabular-nums shrink-0">
                  {gap.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* توصيات ذكية */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#22d3ee]" />
            <h4 className="text-white text-xs font-semibold">توصيات ذكية</h4>
          </div>
          <ul className="space-y-1.5">
            {recommendations.map((line) => (
              <li
                key={line}
                className="text-[#8ba3c7] text-[10px] leading-relaxed flex gap-2 rounded-lg px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-[#22d3ee] shrink-0">▸</span>
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* أدوار فعلية */}
      <div className="space-y-2">
        <h4 className="text-white text-xs font-semibold">الأدوار الفعلية</h4>
        {activeRoleInsights.map((row) => {
          const accent = ROLE_ACCENT[row.roleSlug] ?? "#1e6fd9";
          const def = TENANT_ORG_ROLE_DEFINITIONS.find((d) => d.title === row.roleName);
          return (
            <div
              key={row.roleSlug}
              className="rounded-xl border border-[#1e3a5f]/80 p-3 space-y-2 min-w-0"
              style={{
                borderRightWidth: 3,
                borderRightColor: accent,
                background: "linear-gradient(165deg, rgba(10,22,40,0.85), rgba(15,30,55,0.65))",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold">{row.roleName}</p>
                  <p className="text-[#6b87ab] text-[10px] mt-0.5">
                    {def?.desc ?? "دور تشغيلي"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                  دور فعلي
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <span className="text-[#6b87ab]">
                  الأفراد:{" "}
                  <span className="text-white font-medium">{row.assignedCount}</span>
                </span>
                <span className="text-[#6b87ab] truncate col-span-2 sm:col-span-1">
                  النطاق:{" "}
                  <span className="text-[#8ba3c7]">{row.operationalScope}</span>
                </span>
                {intel.summary.tasksAvailable && row.taskLoad !== null && (
                  <span className="text-[#6b87ab] col-span-2 sm:col-span-1">
                    ضغط المهام:{" "}
                    <span className="text-white font-medium">
                      {row.taskLoad} مفتوحة
                      {row.overdueCount !== null && row.overdueCount > 0
                        ? ` · ${row.overdueCount} متأخرة`
                        : ""}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px]",
                    riskBadgeClass(row.riskLevel),
                  )}
                >
                  مخاطر {RISK_LABEL_AR[row.riskLevel]}
                </span>
              </div>
              <p className="text-[#8ba3c7] text-[10px] leading-relaxed border-t border-white/[0.06] pt-2">
                {row.recommendation}
              </p>
            </div>
          );
        })}
      </div>

      {/* مسميات تنظيمية */}
      <div className="space-y-2 pt-1 border-t border-[#1e3a5f]/50">
        <h4 className="text-white text-xs font-semibold">مسميات تنظيمية</h4>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed">
          هذه المسميات تنظّم الهيكل الإداري ولا تمنح صلاحيات دخول مباشرة حاليًا.
        </p>
        <div className="grid gap-2">
          {intel.organizationalInsights.map((row) => (
            <div
              key={row.title}
              className="rounded-xl border border-[#1e3a5f]/60 px-3 py-2 bg-white/[0.02] min-w-0"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-[#b8cce8] text-[10px] font-medium">{row.title}</span>
                <span className="text-[#6b87ab] text-[10px] shrink-0">مسمى تنظيمي</span>
              </div>
              <p className="text-[#6b87ab] text-[10px] mt-1 tabular-nums">
                {row.structureCount > 0
                  ? `${row.structureCount} وحدة · `
                  : ""}
                {row.linkedEmployees} مرتبط بالهيكل
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrgRolesInsightsPanel({ employees, orgSnapshot }: Props) {
  const { managedUsers } = usePermissions();
  const { data: tasks, error: tasksError } = useTasks();

  const intel = useMemo(() => {
    const employeeRows = (employees ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      role: String(e.role),
      department: String(e.department ?? ""),
      status: String(e.status),
    }));

    const profiles =
      managedUsers.length > 0
        ? managedUsers.map((u) => ({
            userId: u.userId,
            name: u.name,
            role: u.role,
            isActive: u.isActive,
          }))
        : null;

    return buildRolesIntelligence({
      employees: employeeRows,
      managedProfiles: profiles,
      orgSnapshot: orgSnapshot ?? null,
      tasks: tasksError ? null : (tasks ?? []),
      tasksAvailable: !tasksError && tasks !== undefined,
    });
  }, [employees, managedUsers, orgSnapshot, tasks, tasksError]);

  return (
    <div
      className="rounded-2xl border border-[#1e3a5f] p-4 space-y-3 max-h-[min(72vh,720px)] overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,40,0.88) 0%, rgba(8,18,32,0.92) 100%)",
      }}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#22d3ee] shrink-0" />
          <h3 className="text-white text-sm font-bold">مركز قيادة الأدوار</h3>
        </div>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed">{ORG_COMMAND_CENTER_HELPER_AR}</p>
      </div>
      <CommandCenterBody intel={intel} />
    </div>
  );
}
