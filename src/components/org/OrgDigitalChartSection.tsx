"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Hand,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import type { BoardMember } from "@/lib/db";
import type { Employee } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { OrgPackageLimits } from "@/lib/org/orgPackageLimits";
import {
  buildSmartAlerts,
  buildSmartOrgSuggestion,
  type SmartOrgSuggestion,
} from "@/lib/org/orgSmartSuggest";
import {
  addOrgUnit,
  applyOrgStructure,
  countUnits,
  removeOrgUnit,
  type OrgNodeKind,
  type OrgStructureSnapshot,
  type OrgUnitNode,
} from "@/lib/org/orgStructure";
import { WS_SURFACE } from "@/components/ui/workspaceVisual";

export type OrgChartMode = "manual" | "smart";

function GlassNode({
  title,
  subtitle,
  count,
  accent,
  onAdd,
  onDelete,
  canManage,
  addLabel,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  accent: string;
  onAdd?: () => void;
  onDelete?: () => void;
  canManage: boolean;
  addLabel?: string;
}) {
  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3 min-w-[120px] max-w-[220px] text-center shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]"
      style={{ borderColor: `${accent}40`, boxShadow: `0 0 24px -8px ${accent}33` }}
    >
      {canManage && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1 left-1 p-1 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
          aria-label="حذف"
        >
          <Trash2 size={12} />
        </button>
      )}
      <div className="text-sm font-semibold text-white">{title}</div>
      {subtitle && <div className="text-[10px] text-white/60 mt-0.5">{subtitle}</div>}
      {typeof count === "number" && (
        <div
          className="mt-1 text-[10px] rounded-full px-2 py-0.5 inline-block"
          style={{ background: `${accent}22`, color: accent }}
        >
          {count} موظف
        </div>
      )}
      {canManage && onAdd && addLabel && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 text-[10px] flex items-center justify-center gap-1 mx-auto text-cyan-300 hover:text-cyan-100 touch-manipulation min-h-8"
        >
          <Plus size={12} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function OrgStructureTree({
  snapshot,
  limits,
  canManage,
  boardMembers,
  employeesByDept,
  onAddUnit,
  onRemoveUnit,
  onAssignToDept,
  onEditBoardMember,
  onDeleteBoardMember,
  onAddBoardMember,
  previewLabel,
}: {
  snapshot: OrgStructureSnapshot;
  limits: OrgPackageLimits;
  canManage: boolean;
  boardMembers: BoardMember[];
  employeesByDept: Map<string, Employee[]>;
  onAddUnit: (kind: OrgNodeKind, parentId: string | null) => void;
  onRemoveUnit: (id: string) => void;
  onAssignToDept: (deptId: string) => void;
  onEditBoardMember: (member: BoardMember) => void;
  onDeleteBoardMember: (id: string) => void;
  onAddBoardMember: () => void;
  previewLabel?: string;
}) {
  const agencies = snapshot.units.filter((u) => u.kind === "agency");
  const managements = snapshot.units.filter((u) => u.kind === "management");
  const departments = snapshot.units.filter((u) => u.kind === "department");
  const teams = snapshot.units.filter((u) => u.kind === "team");

  const teamsByParent = useMemo(() => {
    const map = new Map<string, OrgUnitNode[]>();
    teams.forEach((t) => {
      if (!t.parentId) return;
      const list = map.get(t.parentId) ?? [];
      list.push(t);
      map.set(t.parentId, list);
    });
    return map;
  }, [teams]);

  return (
    <div className="org-tree-scroll overflow-x-auto pb-2 max-w-full">
      {previewLabel && (
        <p className="text-center text-xs text-amber-200/90 mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 py-2 px-3">
          <Eye size={14} className="inline ml-1" />
          {previewLabel}
        </p>
      )}
      <div className="min-w-0 w-full mx-auto flex flex-col items-center gap-4">
        <div className="w-full max-w-md space-y-2">
          <GlassNode
            title="مجلس الإدارة"
            subtitle={`${boardMembers.length} عضو — Supabase`}
            accent="#a855f7"
            canManage={canManage}
            onAdd={onAddBoardMember}
            addLabel="عضو مجلس"
          />
          {boardMembers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {boardMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onEditBoardMember(m)}
                  className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-center min-w-[100px] touch-manipulation"
                >
                  <div className="text-xs font-semibold text-white">{m.name}</div>
                  <div className="text-[10px] text-cyan-200/90">{m.role}</div>
                  {canManage && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-[10px] text-red-300 mt-1 inline-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBoardMember(m.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          onDeleteBoardMember(m.id);
                        }
                      }}
                    >
                      حذف
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <ChevronDown className="text-cyan-400/60 shrink-0" size={20} />
        {limits.agencies > 0 && (
          <div className="flex flex-wrap justify-center gap-3 w-full min-w-0">
            {agencies.length === 0 ? (
              <GlassNode
                title="وكالة (اختياري)"
                subtitle="أضف وكالة"
                accent="#8b5cf6"
                canManage={canManage}
                onAdd={() => onAddUnit("agency", null)}
                addLabel="إضافة"
              />
            ) : (
              agencies.map((a) => (
                <GlassNode
                  key={a.id}
                  title={a.name}
                  subtitle="وكالة"
                  accent="#8b5cf6"
                  canManage={canManage}
                  onDelete={() => onRemoveUnit(a.id)}
                />
              ))
            )}
          </div>
        )}
        {limits.managements > 0 && (
          <>
            <ChevronDown className="text-emerald-400/50 shrink-0" size={18} />
            <div className="flex flex-wrap justify-center gap-3 min-w-0">
              {managements.length === 0 ? (
                <GlassNode
                  title="إدارة (اختياري)"
                  accent="#10b981"
                  canManage={canManage}
                  onAdd={() => onAddUnit("management", agencies[0]?.id ?? null)}
                  addLabel="إضافة إدارة"
                />
              ) : (
                managements.map((m) => (
                  <GlassNode
                    key={m.id}
                    title={m.name}
                    subtitle="إدارة"
                    accent="#10b981"
                    canManage={canManage}
                    onDelete={() => onRemoveUnit(m.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
        <ChevronDown className="text-cyan-400/50 shrink-0" size={18} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full min-w-0">
          {departments.length === 0 ? (
            <GlassNode
              title="قسم"
              subtitle="أضف أول قسم"
              accent="#22d3ee"
              canManage={canManage}
              onAdd={() => onAddUnit("department", managements[0]?.id ?? agencies[0]?.id ?? null)}
              addLabel="قسم جديد"
            />
          ) : (
            departments.map((d) => (
              <div key={d.id} className="space-y-2 min-w-0">
                <GlassNode
                  title={d.name}
                  subtitle="قسم"
                  count={(employeesByDept.get(d.id) ?? []).length}
                  accent="#22d3ee"
                  canManage={canManage}
                  onDelete={() => onRemoveUnit(d.id)}
                />
                {(teamsByParent.get(d.id) ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(teamsByParent.get(d.id) ?? []).map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] rounded-full px-2 py-0.5 border border-violet-400/30 bg-violet-500/15 text-violet-100"
                      >
                        {t.name}
                        {canManage && (
                          <button
                            type="button"
                            className="mr-1 text-red-300"
                            onClick={() => onRemoveUnit(t.id)}
                            aria-label="حذف الفريق"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 justify-center">
                  {(employeesByDept.get(d.id) ?? []).slice(0, 6).map((e) => (
                    <span
                      key={e.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] flex items-center justify-center text-white"
                      title={e.name}
                    >
                      {e.name.slice(0, 2)}
                    </span>
                  ))}
                  {canManage && (
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full border border-dashed border-white/30 text-white/50 flex items-center justify-center touch-manipulation"
                      onClick={() => onAssignToDept(d.id)}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export interface OrgDigitalChartSectionProps {
  organizationId: string;
  plan: PlanSlug;
  limits: OrgPackageLimits;
  canManage: boolean;
  structure: OrgStructureSnapshot;
  structLoading: boolean;
  savingStruct: boolean;
  employees: Employee[];
  boardMembers: BoardMember[];
  employeesByDept: Map<string, Employee[]>;
  departments: OrgUnitNode[];
  unassignedCount: number;
  onReloadStructure: () => Promise<void>;
  onAddBoardMember: () => void;
  onEditBoardMember: (member: BoardMember) => void;
  onDeleteBoardMember: (id: string) => void;
  onRequestAssignEmployee: () => void;
  onAssignToDept: (deptId: string) => void;
}

const MODE_COPY: Record<OrgChartMode, { title: string; body: string }> = {
  manual: {
    title: "الوضع اليدوي",
    body: "الوضع اليدوي يمنحك تحكماً كاملاً في بناء الهيكل، إضافة المستويات، وربط الموظفين حسب طريقة عمل منشأتك.",
  },
  smart: {
    title: "الوضع الرقمي الذكي",
    body: "يقترح هيكلاً منظماً من باقتك والموظفين والأقسام ومجلس الإدارة والموظفين غير المرتبطين — دون مستويات غير مدعومة في باقتك.",
  },
};

export default function OrgDigitalChartSection({
  organizationId,
  plan,
  limits,
  canManage,
  structure,
  structLoading,
  savingStruct,
  employees,
  boardMembers,
  employeesByDept,
  departments,
  unassignedCount,
  onReloadStructure,
  onAddBoardMember,
  onEditBoardMember,
  onDeleteBoardMember,
  onRequestAssignEmployee,
  onAssignToDept,
}: OrgDigitalChartSectionProps) {
  const toast = useToast();
  const [mode, setMode] = useState<OrgChartMode>("manual");
  const [smartPreview, setSmartPreview] = useState<SmartOrgSuggestion | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);

  const smartAlerts = useMemo(
    () => buildSmartAlerts(limits, employees, departments, unassignedCount),
    [limits, employees, departments, unassignedCount],
  );

  const runAutoOrganize = useCallback(() => {
    const suggestion = buildSmartOrgSuggestion({
      plan,
      employees,
      boardMembers,
      current: structure,
    });
    setSmartPreview(suggestion);
    setReviewing(false);
    toast.success("اقتراح من بيانات حقيقية فقط — معاينة قبل أي اعتماد إنتاجي");
  }, [plan, employees, boardMembers, structure, toast]);

  const handleReview = () => {
    if (!smartPreview) {
      runAutoOrganize();
      setReviewing(true);
      return;
    }
    setReviewing(true);
  };

  const tryAddUnit = async (kind: OrgNodeKind, parentId: string | null) => {
    const labels: Record<OrgNodeKind, string> = {
      agency: "اسم الوكالة",
      management: "اسم الإدارة",
      department: "اسم القسم",
      team: "اسم الفريق",
    };
    const name = window.prompt(labels[kind]);
    if (!name?.trim()) return;

    if (kind !== "team") {
      const cap =
        kind === "agency"
          ? limits.agencies
          : kind === "management"
            ? limits.managements
            : limits.departments;
      const current = countUnits(structure.units, kind);
      if (current >= cap) {
        toast.error(`وصلت للحد الأعلى (${cap}) في باقة ${limits.label}`);
        return;
      }
    } else if (!parentId) {
      toast.error("اختر قسماً أولاً لإضافة فريق تحته");
      return;
    }

    try {
      await addOrgUnit(organizationId, kind, name, parentId);
      await onReloadStructure();
      toast.success("تمت إضافة الوحدة في org_units");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإضافة");
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      await removeOrgUnit(organizationId, id);
      await onReloadStructure();
      toast.success("تم حذف الوحدة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحذف");
    }
  };

  const handleApplySuggestion = async () => {
    if (!smartPreview) {
      toast.error("نفّذ «تنظيم تلقائي» أولاً");
      return;
    }
    setApplying(true);
    try {
      const added = await applyOrgStructure(organizationId, smartPreview.snapshot);
      await onReloadStructure();
      setReviewing(false);
      setSmartPreview(null);
      toast.success(added > 0 ? `تمت إضافة ${added} وحدة في org_units` : "لا وحدات جديدة للإضافة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تطبيق الاقتراح");
    } finally {
      setApplying(false);
    }
  };

  const displaySnapshot =
    mode === "smart" && smartPreview && reviewing ? smartPreview.snapshot : structure;

  const employeesByDeptForDisplay = useMemo(() => {
    if (!(mode === "smart" && reviewing && smartPreview)) {
      return employeesByDept;
    }
    const depts = displaySnapshot.units.filter((u) => u.kind === "department");
    const map = new Map<string, Employee[]>();
    depts.forEach((d) => map.set(d.id, []));
    employees.forEach((e) => {
      const dept = depts.find((d) => d.name === e.department);
      if (dept) map.get(dept.id)?.push(e);
    });
    return map;
  }, [mode, reviewing, smartPreview, employeesByDept, displaySnapshot, employees]);

  const recommendationLines = useMemo(() => {
    if (mode === "smart" && smartPreview) {
      return [...smartPreview.summary, ...smartPreview.warnings, ...smartAlerts];
    }
    const msgs: string[] = [...smartAlerts];
    if (unassignedCount > 0) {
      msgs.push(`${unassignedCount} موظف غير مربوط — استخدم + موظف أو لوحة الإرسال.`);
    }
    return msgs;
  }, [mode, smartPreview, smartAlerts, unassignedCount]);

  return (
    <section className={cn(WS_SURFACE, "p-4 sm:p-5 overflow-hidden min-w-0")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 min-w-0">
        <h2 className="text-lg font-bold text-white shrink-0">المخطط التنظيمي الرقمي</h2>
        {savingStruct && (
          <span className="text-xs text-cyan-300 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> جارٍ الحفظ...
          </span>
        )}
      </div>

      <div
        className="org-chart-mode-switch flex rounded-2xl border border-white/15 bg-white/[0.04] p-1 gap-1 mb-4 max-w-full"
        role="tablist"
        aria-label="وضع المخطط"
      >
        {(
          [
            { id: "manual" as const, label: "يدوي", icon: Hand },
            { id: "smart" as const, label: "رقمي ذكي", icon: Wand2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              if (id === "manual") setReviewing(false);
            }}
            className={cn(
              "flex-1 min-h-11 touch-manipulation rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              mode === id
                ? "bg-cyan-500/25 text-cyan-100 border border-cyan-400/40 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]"
                : "text-white/55 hover:text-white/80 border border-transparent",
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 mb-4 text-[11px] sm:text-xs text-emerald-100/95 leading-relaxed">
        <strong className="text-emerald-200">Production:</strong> الهيكل في <code className="text-emerald-50/90">org_units</code>
        ، ربط الموظفين في <code className="text-emerald-50/90">org_unit_members</code>
        ، مجلس الإدارة في <code className="text-emerald-50/90">board_members</code>.
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 mb-4">
        <p className="text-sm font-semibold text-white mb-1">{MODE_COPY[mode].title}</p>
        <p className="text-xs sm:text-sm text-white/65 leading-relaxed">{MODE_COPY[mode].body}</p>
      </div>

      {mode === "manual" && canManage && (
        <div className="flex flex-wrap gap-2 mb-4">
          {limits.agencies > 0 && (
            <button
              type="button"
              className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
              onClick={() => tryAddUnit("agency", null)}
            >
              + وكالة
            </button>
          )}
          {limits.managements > 0 && (
            <button
              type="button"
              className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
              onClick={() => tryAddUnit("management", structure.units.find((u) => u.kind === "agency")?.id ?? null)}
            >
              + إدارة
            </button>
          )}
          <button
            type="button"
            className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
            onClick={() =>
              tryAddUnit(
                "department",
                structure.units.find((u) => u.kind === "management")?.id ??
                  structure.units.find((u) => u.kind === "agency")?.id ??
                  null,
              )
            }
          >
            + قسم
          </button>
          <button
            type="button"
            className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
            onClick={() => {
              const dept = structure.units.find((u) => u.kind === "department");
              if (!dept) {
                toast.error("أضف قسماً أولاً ثم أضف فريقاً تحته");
                return;
              }
              tryAddUnit("team", dept.id);
            }}
          >
            + فريق
          </button>
          <button
            type="button"
            className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
            onClick={onRequestAssignEmployee}
          >
            + موظف
          </button>
          <button
            type="button"
            className="btn-secondary text-xs py-2 min-h-10 touch-manipulation"
            onClick={onAddBoardMember}
          >
            إضافة عضو مجلس
          </button>
        </div>
      )}

      {mode === "smart" && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
          <button
            type="button"
            className="btn-primary text-xs sm:text-sm py-2.5 min-h-11 flex-1 sm:flex-none touch-manipulation flex items-center justify-center gap-2"
            onClick={runAutoOrganize}
          >
            <Zap size={16} />
            تنظيم تلقائي
          </button>
          <button
            type="button"
            className="btn-secondary text-xs sm:text-sm py-2.5 min-h-11 flex-1 sm:flex-none touch-manipulation flex items-center justify-center gap-2"
            onClick={handleReview}
            disabled={!smartPreview && structLoading}
          >
            <Eye size={16} />
            مراجعة قبل التطبيق
          </button>
          <button
            type="button"
            className="btn-secondary text-xs sm:text-sm py-2.5 min-h-11 flex-1 sm:flex-none touch-manipulation flex items-center justify-center gap-2 border-emerald-400/40 text-emerald-100 disabled:opacity-50"
            onClick={() => void handleApplySuggestion()}
            disabled={!canManage || !smartPreview || applying}
          >
            {applying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            تطبيق الاقتراح (آمن)
          </button>
        </div>
      )}

      {mode === "smart" && smartPreview && !reviewing && (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 mb-3 text-xs text-cyan-100/90">
          <Sparkles size={14} className="inline ml-1" />
          اقتراح جاهز — {smartPreview.summary.length} خطوة مقترحة. اضغط «مراجعة قبل التطبيق» لمعاينة الشجرة.
        </div>
      )}

      {structLoading ? (
        <p className="text-center text-white/50 py-10">جارٍ تحميل المخطط...</p>
      ) : (
        <OrgStructureTree
          snapshot={displaySnapshot}
          limits={limits}
          canManage={mode === "manual" && canManage}
          boardMembers={boardMembers}
          employeesByDept={employeesByDeptForDisplay}
          onAddUnit={tryAddUnit}
          onRemoveUnit={(id) => void deleteUnit(id)}
          onAssignToDept={onAssignToDept}
          onEditBoardMember={onEditBoardMember}
          onDeleteBoardMember={onDeleteBoardMember}
          onAddBoardMember={onAddBoardMember}
          previewLabel={
            mode === "smart" && reviewing && smartPreview
              ? "معاينة — التطبيق يضيف وحدات ناقصة فقط (بدون حذف) إلى org_units."
              : undefined
          }
        />
      )}

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-300" />
          توصيات ذكية
        </h3>
        {recommendationLines.length === 0 ? (
          <p className="text-xs text-white/50">لا توجد تنبيهات حالياً — الهيكل متوافق مع باقتك.</p>
        ) : (
          <ul className="space-y-1.5">
            {recommendationLines.map((msg, i) => (
              <li key={`${msg}-${i}`} className="text-[11px] sm:text-xs text-cyan-100/85 flex gap-2 items-start">
                <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-300/90" />
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        )}
        {mode === "smart" && (
          <p className="text-[10px] text-white/40 pt-1 border-t border-white/5">
            الاقتراح من بيانات حقيقية فقط. التطبيق الآمن يضيف وحدات غير موجودة دون حذف. ربط الموظفين عبر org_unit_members.
          </p>
        )}
      </div>
    </section>
  );
}
