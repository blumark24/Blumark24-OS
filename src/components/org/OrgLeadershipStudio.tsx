"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Brain,
  Compass,
  Map,
  Sparkles,
  UserCog,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks } from "@/hooks/useData";
import type { Employee } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import {
  ORG_ASSIGNMENT_ORG_ONLY_AR,
  ORG_LEADERSHIP_STUDIO_HELPER_AR,
  ORG_LEADERSHIP_STUDIO_TITLE_AR,
  RISK_LABEL_AR,
  organizationalResponsibilitiesForPlan,
  TRANSFER_MODES,
  buildAssignmentPreviewSentence,
  buildDecisionOfTheDay,
  buildLeadershipStudioPreview,
  buildTransferImpactPreview,
  type OrganizationalResponsibility,
} from "@/lib/org/buildLeadershipStudio";

type TransferMode = (typeof TRANSFER_MODES)[number]["id"];

interface OrgLeadershipStudioProps {
  employees: Employee[] | undefined;
  orgSnapshot: OrgStructureSnapshot | null | undefined;
  plan: PlanSlug;
}

export default function OrgLeadershipStudio({
  employees,
  orgSnapshot,
  plan,
}: OrgLeadershipStudioProps) {
  const { managedUsers } = usePermissions();
  const { data: tasks, error: tasksError } = useTasks();

  const studio = useMemo(() => {
    const employeeRows = (employees ?? []).map((e) => ({
      id: e.id,
      name: e.name || e.email || "موظف",
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

    return buildLeadershipStudioPreview({
      employees: employeeRows,
      managedProfiles: profiles,
      orgSnapshot: orgSnapshot ?? null,
      tasks: tasksError ? null : (tasks ?? []),
      tasksAvailable: !tasksError && tasks !== undefined,
      plan,
    });
  }, [employees, managedUsers, orgSnapshot, tasks, tasksError, plan]);

  const decision = useMemo(() => buildDecisionOfTheDay(studio.intel), [studio.intel]);

  const responsibilityOptions = useMemo(
    () => organizationalResponsibilitiesForPlan(plan),
    [plan],
  );

  const orgHealthScore = useMemo(() => {
    if (studio.healthByEmployee.length === 0) return null;
    const sum = studio.healthByEmployee.reduce((a, r) => a + r.score, 0);
    return Math.round(sum / studio.healthByEmployee.length);
  }, [studio.healthByEmployee]);

  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignResponsibility, setAssignResponsibility] =
    useState<OrganizationalResponsibility>("رئيس قسم");
  const [assignScope, setAssignScope] = useState("");
  const [assignGoal, setAssignGoal] = useState("ضبط الهيكل");

  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferMode, setTransferMode] = useState<TransferMode>("role_only");

  const assignSentence = useMemo(() => {
    const emp =
      studio.employeeOptions.find((e) => e.id === assignEmployeeId)?.name ?? "موظف";
    const scope =
      studio.scopeOptions.find((o) => o.id === assignScope)?.label ?? "نطاق غير محدد";
    return buildAssignmentPreviewSentence(
      emp,
      assignResponsibility,
      scope,
      assignGoal.trim() || "—",
    );
  }, [
    assignEmployeeId,
    assignResponsibility,
    assignScope,
    assignGoal,
    studio.employeeOptions,
    studio.scopeOptions,
  ]);

  const transferImpact = useMemo(() => {
    const employeeRows = (employees ?? []).map((e) => ({
      id: e.id,
      name: e.name || e.email || "موظف",
      role: String(e.role),
      department: String(e.department ?? ""),
      status: String(e.status),
    }));
    return buildTransferImpactPreview({
      fromEmployeeId: transferFromId,
      toEmployeeId: transferToId,
      mode: transferMode,
      employees: employeeRows,
      snapshot: orgSnapshot ?? null,
      tasks: tasksError ? [] : (tasks ?? []),
      tasksAvailable: !tasksError && tasks !== undefined,
    });
  }, [
    transferFromId,
    transferToId,
    transferMode,
    employees,
    orgSnapshot,
    tasks,
    tasksError,
  ]);

  const selectClass =
    "w-full rounded-xl border border-[#1e3a5f] bg-[rgba(8,18,32,0.65)] px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/30";

  const panelClass =
    "rounded-xl border border-[#1e3a5f]/80 p-3 space-y-2 min-w-0";
  const panelBg = { background: "rgba(10,22,40,0.55)" } as const;

  return (
    <div
      className="rounded-2xl border border-[#1e3a5f] p-4 space-y-4 max-h-[min(78vh,760px)] overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,40,0.9) 0%, rgba(8,18,32,0.94) 100%)",
      }}
      dir="rtl"
      aria-label={ORG_LEADERSHIP_STUDIO_TITLE_AR}
    >
      <header className="space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-[#22d3ee] shrink-0" />
          <h3 className="text-white text-sm font-bold">{ORG_LEADERSHIP_STUDIO_TITLE_AR}</h3>
        </div>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed">{ORG_LEADERSHIP_STUDIO_HELPER_AR}</p>
        <p className="text-[#8ba3c7] text-[10px]">
          {studio.packageTierLabel}
          {studio.packageStructureHint ? ` · ${studio.packageStructureHint}` : ""}
        </p>
      </header>

      {/* 1. قرار اليوم */}
      <article className={panelClass} style={{ ...panelBg, borderColor: "rgba(245,158,11,0.35)" }}>
        <div className="flex items-center gap-2">
          <Compass size={14} className="text-amber-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">قرار اليوم</h4>
        </div>
        <p className="text-amber-100/95 text-xs font-semibold">{decision.headline}</p>
        <p className="text-[#8ba3c7] text-[10px] leading-relaxed">{decision.body}</p>
      </article>

      {/* 2. خريطة القيادة */}
      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <Map size={14} className="text-sky-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">خريطة القيادة</h4>
        </div>
        {studio.mapRows.length === 0 ? (
          <p className="text-[#6b87ab] text-[10px]">لا توجد قيادات مرتبطة بالهيكل بعد.</p>
        ) : (
          <ul className="space-y-2 max-h-44 overflow-y-auto">
            {studio.mapRows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-[#1e3a5f]/60 px-2.5 py-2 bg-white/[0.02]"
              >
                <p className="text-white text-[11px] font-medium">{row.title}</p>
                <p className="text-[#8ba3c7] text-[10px] mt-0.5">{row.subtitle}</p>
                <p className="text-[#6b87ab] text-[10px] mt-0.5">{row.meta}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      {/* 3. استوديو التعيين */}
      <article className={panelClass} style={{ ...panelBg, borderColor: "rgba(139,92,246,0.3)" }}>
        <div className="flex items-center gap-2">
          <UserCog size={14} className="text-violet-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">استوديو التعيين</h4>
        </div>
        <p className="text-[#6b87ab] text-[10px]">{ORG_ASSIGNMENT_ORG_ONLY_AR}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-[#6b87ab] text-[10px]">الموظف</span>
            <select
              className={selectClass}
              value={assignEmployeeId}
              onChange={(e) => setAssignEmployeeId(e.target.value)}
            >
              <option value="">اختر موظفاً</option>
              {studio.employeeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[#6b87ab] text-[10px]">المسؤولية التنظيمية</span>
            <select
              className={selectClass}
              value={assignResponsibility}
              onChange={(e) =>
                setAssignResponsibility(e.target.value as OrganizationalResponsibility)
              }
            >
              {responsibilityOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[#6b87ab] text-[10px]">النطاق</span>
            <select
              className={selectClass}
              value={assignScope}
              onChange={(e) => setAssignScope(e.target.value)}
            >
              <option value="">اختر نطاقاً</option>
              {studio.scopeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-[#6b87ab] text-[10px]">هدف المتابعة (معاينة)</span>
            <input
              type="text"
              className={selectClass}
              value={assignGoal}
              onChange={(e) => setAssignGoal(e.target.value)}
              placeholder="مثال: تقليل التأخير في القسم"
            />
          </label>
        </div>
        <div
          className="rounded-lg border border-violet-500/25 px-3 py-2"
          style={{ background: "rgba(88,28,135,0.12)" }}
        >
          <p className="text-violet-200/70 text-[10px] mb-1">معاينة الجملة</p>
          <p className="text-[#b8cce8] text-[10px] leading-relaxed">{assignSentence}</p>
        </div>
      </article>

      {/* 4. استوديو النقل */}
      <article className={panelClass} style={{ ...panelBg, borderColor: "rgba(34,211,238,0.25)" }}>
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={14} className="text-cyan-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">استوديو النقل</h4>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[#6b87ab] text-[10px]">من موظف</span>
            <select
              className={selectClass}
              value={transferFromId}
              onChange={(e) => setTransferFromId(e.target.value)}
            >
              <option value="">اختر</option>
              {studio.employeeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[#6b87ab] text-[10px]">إلى موظف</span>
            <select
              className={selectClass}
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
            >
              <option value="">اختر</option>
              {studio.employeeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-[#6b87ab] text-[10px]">وضع النقل (معاينة)</span>
            <select
              className={selectClass}
              value={transferMode}
              onChange={(e) => setTransferMode(e.target.value as TransferMode)}
            >
              {TRANSFER_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="rounded-lg border border-cyan-500/25 px-3 py-2 space-y-1"
          style={{ background: "rgba(34,211,238,0.08)" }}
        >
          <p className="text-cyan-200/70 text-[10px]">معاينة الأثر</p>
          <p className="text-[#b8cce8] text-[10px] leading-relaxed">{transferImpact.summary}</p>
          <p className="text-[#6b87ab] text-[10px] tabular-nums">
            مهام مفتوحة: {transferImpact.openTasks}
            {transferImpact.teamsCount > 0
              ? ` · فرق بقيادة المصدر: ${transferImpact.teamsCount}`
              : ""}
          </p>
        </div>
        <p className="text-[#6b87ab] text-[10px]">لا يوجد زر حفظ — المعاينة لا تكتب بيانات.</p>
      </article>

      {/* 5. صحة الدور */}
      <article className={panelClass} style={panelBg}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-300 shrink-0" />
            <h4 className="text-white text-xs font-bold">صحة الدور</h4>
          </div>
          {orgHealthScore !== null && (
            <span className="text-white text-sm font-bold tabular-nums">{orgHealthScore}</span>
          )}
        </div>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed">
          {studio.intel.summary.tasksAvailable
            ? "تقييم مبدئي من إكمال المهام والتأخير والربط بالهيكل وتوازن الحمل."
            : "تقييم مبدئي من الربط بالهيكل (المهام غير متاحة للقراءة)."}
        </p>
        <ul className="space-y-1.5 max-h-36 overflow-y-auto">
          {studio.healthByEmployee.slice(0, 12).map((row) => (
            <li
              key={row.employeeId}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#1e3a5f]/50 px-2 py-1.5 bg-black/15"
            >
              <span className="text-[#b8cce8] text-[10px] truncate">{row.name}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  row.riskLevel === "high"
                    ? "bg-red-500/15 text-red-200 border border-red-400/30"
                    : row.riskLevel === "medium"
                      ? "bg-amber-500/15 text-amber-200 border border-amber-400/30"
                      : "bg-cyan-500/10 text-cyan-200 border border-cyan-400/25"
                }`}
              >
                {RISK_LABEL_AR[row.riskLevel]} · {row.score}
              </span>
            </li>
          ))}
        </ul>
        {studio.healthByEmployee.length === 0 && (
          <p className="text-[#6b87ab] text-[10px]">لا يوجد موظفون نشطون لحساب الصحة.</p>
        )}
      </article>

      <footer className="flex items-start gap-2 rounded-lg border border-[#1e3a5f]/60 px-2.5 py-2 bg-white/[0.02]">
        <Sparkles size={12} className="text-[#22d3ee] shrink-0 mt-0.5" />
        <p className="text-[#6b87ab] text-[10px] leading-relaxed">
          معاينة فقط — قراءة من البيانات الحالية دون POST أو PATCH أو تخزين محلي.
        </p>
      </footer>
    </div>
  );
}
