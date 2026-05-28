"use client";

import { useMemo, useState } from "react";
import type { Client, Task } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { LeadershipStudioPreview } from "@/lib/org/buildLeadershipStudio";
import { ORG_ASSIGNMENT_ORG_ONLY_AR } from "@/lib/org/buildLeadershipStudio";
import {
  ASSIGNMENT_GOALS,
  EMPLOYEE_TRANSFER_MODES,
  ORG_SAVE_NEXT_PHASE_AR,
  PERFORMANCE_PERIODS,
  PERFORMANCE_FOCUS,
  REVIEW_FREQUENCIES,
  TASK_DISTRIBUTION_FILTERS,
  buildAssignResponsiblePreview,
  buildEmployeeTransferPreview,
  buildPerformancePreview,
  buildTaskDistributionPreview,
  responsibilitiesForPlan,
  type AssignmentResponsibility,
  type EmployeeTransferMode,
  type LeadershipActionId,
  type TaskDistributionFilter,
} from "@/lib/org/buildLeadershipActionPreviews";
import type { EmployeeRow } from "@/lib/org/buildRolesIntelligence";
import { RISK_LABEL_AR } from "@/lib/org/buildLeadershipStudio";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import {
  LeadershipImpactBox,
  LeadershipPreviewFooter,
  OrgLeadershipActionSheet,
  leadershipLabelClass,
  leadershipSelectClass,
} from "./OrgLeadershipActionSheet";

const MODAL_TITLES: Record<LeadershipActionId, string> = {
  transfer_employee: "نقل موظف",
  assign_responsible: "تعيين مسؤول",
  distribute_tasks: "توزيع مهام",
  performance_review: "تقييم أداء",
};

export type LeadershipActionContext = {
  studio: LeadershipStudioPreview;
  employeeRows: EmployeeRow[];
  orgSnapshot: OrgStructureSnapshot | null;
  tasks: Task[];
  tasksAvailable: boolean;
  clients: Client[] | undefined;
  plan: PlanSlug;
};

interface Props {
  activeAction: LeadershipActionId | null;
  onClose: () => void;
  ctx: LeadershipActionContext;
}

export function OrgLeadershipActionModals({ activeAction, onClose, ctx }: Props) {
  if (!activeAction) return null;

  return (
    <OrgLeadershipActionSheet
      open={Boolean(activeAction)}
      title={MODAL_TITLES[activeAction]}
      accentId={activeAction}
      onClose={onClose}
    >
      {activeAction === "transfer_employee" && (
        <TransferEmployeeModal ctx={ctx} accentId="transfer_employee" />
      )}
      {activeAction === "assign_responsible" && (
        <AssignResponsibleModal ctx={ctx} accentId="assign_responsible" />
      )}
      {activeAction === "distribute_tasks" && (
        <DistributeTasksModal ctx={ctx} accentId="distribute_tasks" />
      )}
      {activeAction === "performance_review" && (
        <PerformanceReviewModal ctx={ctx} accentId="performance_review" />
      )}
    </OrgLeadershipActionSheet>
  );
}

function TransferEmployeeModal({
  ctx,
  accentId,
}: {
  ctx: LeadershipActionContext;
  accentId: LeadershipActionId;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [targetScopeId, setTargetScopeId] = useState("");
  const [mode, setMode] = useState<EmployeeTransferMode>("employee_only");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  const preview = useMemo(
    () =>
      buildEmployeeTransferPreview({
        employeeId,
        targetScopeId,
        mode,
        reason,
        effectiveDate,
        employees: ctx.employeeRows,
        snapshot: ctx.orgSnapshot,
        scopeOptions: ctx.studio.scopeOptions,
        tasks: ctx.tasks,
        tasksAvailable: ctx.tasksAvailable,
        clients: ctx.clients,
      }),
    [
      employeeId,
      targetScopeId,
      mode,
      reason,
      effectiveDate,
      ctx,
    ],
  );

  return (
    <>
      <label className={leadershipLabelClass}>الموظف</label>
      <select
        className={leadershipSelectClass}
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      >
        <option value="">اختر موظفاً</option>
        {ctx.studio.employeeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>القسم / الفريق الهدف</label>
      <select
        className={leadershipSelectClass}
        value={targetScopeId}
        onChange={(e) => setTargetScopeId(e.target.value)}
      >
        <option value="">اختر نطاقاً</option>
        {ctx.studio.scopeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>وضع النقل</label>
      <select
        className={leadershipSelectClass}
        value={mode}
        onChange={(e) => setMode(e.target.value as EmployeeTransferMode)}
      >
        {EMPLOYEE_TRANSFER_MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>السبب (معاينة)</label>
      <input
        type="text"
        className={leadershipSelectClass}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="مثال: إعادة توزيع الحمل التشغيلي"
      />

      <label className={leadershipLabelClass}>تاريخ السريان المقترح</label>
      <input
        type="date"
        className={leadershipSelectClass}
        value={effectiveDate}
        onChange={(e) => setEffectiveDate(e.target.value)}
      />

      <LeadershipImpactBox title="معاينة الأثر" accentId={accentId}>
        <p>الوضع الحالي: {employeeId ? preview.currentPlacement : "—"}</p>
        <p>الهدف: {targetScopeId ? preview.targetLabel : "—"}</p>
        <p>مهام مفتوحة: {ctx.tasksAvailable ? preview.openTasks : "—"}</p>
        <p>مهام متأخرة: {ctx.tasksAvailable ? preview.overdueTasks : "—"}</p>
        <p>العملاء: {preview.clientLabel}</p>
        <p className="text-[#8ba3c7] pt-1">{employeeId ? preview.summary : "اختر موظفاً لعرض المعاينة."}</p>
      </LeadershipImpactBox>

      <LeadershipPreviewFooter label={ORG_SAVE_NEXT_PHASE_AR} accentId={accentId} />
    </>
  );
}

function AssignResponsibleModal({
  ctx,
  accentId,
}: {
  ctx: LeadershipActionContext;
  accentId: LeadershipActionId;
}) {
  const respOptions = responsibilitiesForPlan(ctx.plan);
  const [employeeId, setEmployeeId] = useState("");
  const [responsibility, setResponsibility] = useState<AssignmentResponsibility>(
    respOptions[0] ?? "رئيس قسم",
  );
  const [scopeId, setScopeId] = useState("");
  const [goal, setGoal] = useState<string>(ASSIGNMENT_GOALS[0]);
  const [frequency, setFrequency] = useState<string>(REVIEW_FREQUENCIES[0]);

  const sentence = useMemo(
    () =>
      buildAssignResponsiblePreview({
        employeeId,
        responsibility,
        scopeId,
        goal,
        frequency,
        employees: ctx.employeeRows,
        scopeOptions: ctx.studio.scopeOptions,
      }),
    [employeeId, responsibility, scopeId, goal, frequency, ctx],
  );

  return (
    <>
      <p className="text-[10px] text-[#6b87ab] leading-relaxed">{ORG_ASSIGNMENT_ORG_ONLY_AR}</p>

      <label className={leadershipLabelClass}>الموظف</label>
      <select
        className={leadershipSelectClass}
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      >
        <option value="">اختر موظفاً</option>
        {ctx.studio.employeeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>المسؤولية التنظيمية</label>
      <select
        className={leadershipSelectClass}
        value={responsibility}
        onChange={(e) => setResponsibility(e.target.value as AssignmentResponsibility)}
      >
        {respOptions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>النطاق</label>
      <select
        className={leadershipSelectClass}
        value={scopeId}
        onChange={(e) => setScopeId(e.target.value)}
      >
        <option value="">اختر نطاقاً</option>
        {ctx.studio.scopeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>هدف المتابعة</label>
      <select
        className={leadershipSelectClass}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      >
        {ASSIGNMENT_GOALS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>دورية المراجعة</label>
      <select
        className={leadershipSelectClass}
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
      >
        {REVIEW_FREQUENCIES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <LeadershipImpactBox title="معاينة الجملة" accentId={accentId}>
        <p>{employeeId && scopeId ? sentence : "أكمل الحقول لعرض جملة المعاينة."}</p>
      </LeadershipImpactBox>

      <LeadershipPreviewFooter label={ORG_SAVE_NEXT_PHASE_AR} accentId={accentId} />
    </>
  );
}

function DistributeTasksModal({
  ctx,
  accentId,
}: {
  ctx: LeadershipActionContext;
  accentId: LeadershipActionId;
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [filter, setFilter] = useState<TaskDistributionFilter>("open_tasks");
  const [taskCount, setTaskCount] = useState(1);

  const preview = useMemo(
    () =>
      buildTaskDistributionPreview({
        fromEmployeeId: fromId,
        toEmployeeId: toId,
        filter,
        taskCount,
        tasks: ctx.tasks,
        tasksAvailable: ctx.tasksAvailable,
        snapshot: ctx.orgSnapshot,
        employees: ctx.employeeRows,
        orgAvgOpen: ctx.studio.orgAvgOpenTasks,
      }),
    [fromId, toId, filter, taskCount, ctx],
  );

  return (
    <>
      <label className={leadershipLabelClass}>من موظف</label>
      <select
        className={leadershipSelectClass}
        value={fromId}
        onChange={(e) => setFromId(e.target.value)}
      >
        <option value="">اختر</option>
        {ctx.studio.employeeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>إلى موظف</label>
      <select
        className={leadershipSelectClass}
        value={toId}
        onChange={(e) => setToId(e.target.value)}
      >
        <option value="">اختر</option>
        {ctx.studio.employeeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>تصفية المهام</label>
      <select
        className={leadershipSelectClass}
        value={filter}
        onChange={(e) => setFilter(e.target.value as TaskDistributionFilter)}
      >
        {TASK_DISTRIBUTION_FILTERS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>عدد المهام (معاينة)</label>
      <input
        type="number"
        min={0}
        max={Math.max(preview.matchingCount, 0)}
        className={leadershipSelectClass}
        value={taskCount}
        onChange={(e) => setTaskCount(Number(e.target.value) || 0)}
      />
      {fromId && ctx.tasksAvailable && (
        <p className="text-[10px] text-[#6b87ab]">
          متاح ضمن التصفية: {preview.matchingCount} مهمة
        </p>
      )}

      <LeadershipImpactBox title="معاينة الأثر" accentId={accentId}>
        <p>مهام مفتوحة للمصدر: {ctx.tasksAvailable ? preview.fromOpen : "—"}</p>
        <p>مهام مفتوحة للهدف: {ctx.tasksAvailable ? preview.toOpen : "—"}</p>
        <p>{preview.balanceSuggestion}</p>
        <p className="text-[#8ba3c7] pt-1">
          {fromId && toId ? preview.summary : "اختر الموظفين لعرض المعاينة."}
        </p>
      </LeadershipImpactBox>

      <p className="text-[10px] text-[#6b87ab] px-0.5">معاينة فقط — لا يوجد زر حفظ نشط.</p>
    </>
  );
}

function PerformanceReviewModal({
  ctx,
  accentId,
}: {
  ctx: LeadershipActionContext;
  accentId: LeadershipActionId;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState<string>(PERFORMANCE_PERIODS[0]);
  const [focus, setFocus] = useState<string>(PERFORMANCE_FOCUS[0]);

  const preview = useMemo(
    () =>
      buildPerformancePreview({
        employeeId,
        period,
        focus,
        tasks: ctx.tasks,
        tasksAvailable: ctx.tasksAvailable,
        snapshot: ctx.orgSnapshot,
        employees: ctx.employeeRows,
        orgAvgOpen: ctx.studio.orgAvgOpenTasks,
      }),
    [employeeId, period, focus, ctx],
  );

  const completionPct =
    preview.completionRate !== null
      ? `${Math.round(preview.completionRate * 100)}%`
      : "—";

  return (
    <>
      <label className={leadershipLabelClass}>الموظف</label>
      <select
        className={leadershipSelectClass}
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      >
        <option value="">اختر موظفاً</option>
        {ctx.studio.employeeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>الفترة</label>
      <select
        className={leadershipSelectClass}
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
      >
        {PERFORMANCE_PERIODS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <label className={leadershipLabelClass}>محور التقييم</label>
      <select
        className={leadershipSelectClass}
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
      >
        {PERFORMANCE_FOCUS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <LeadershipImpactBox title="مؤشرات القراءة" accentId={accentId}>
        <p>نسبة الإكمال: {completionPct}</p>
        <p>متأخرة: {ctx.tasksAvailable ? preview.overdueCount : "—"}</p>
        <p>مفتوحة: {ctx.tasksAvailable ? preview.openTasks : "—"}</p>
        <p>ربط بالهيكل: {preview.linked ? "نعم" : "لا"}</p>
        <p>
          المخاطر: {RISK_LABEL_AR[preview.riskLevel]} · مؤشر {preview.score}
        </p>
        <p className="text-[#8ba3c7] pt-1">
          {employeeId ? preview.summary : "اختر موظفاً لعرض التقييم."}
        </p>
      </LeadershipImpactBox>

      <LeadershipPreviewFooter label={ORG_SAVE_NEXT_PHASE_AR} accentId={accentId} />
    </>
  );
}
