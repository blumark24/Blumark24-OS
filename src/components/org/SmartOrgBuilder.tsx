"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  applyNodeChanges,
  type NodeChange,
  type OnNodeDrag,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  Network,
  RefreshCw,
  Trash2,
  Pencil,
  Lock,
  Sparkles,
  Building2,
  Layers,
  Shield,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useEmployees } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import {
  buildOrgFlowGraph,
  PARENT_SNAP_DISTANCE_PX,
  type OrgNodeData,
} from "@/lib/org/buildFlowGraph";
import {
  BOARD_LABEL_AR,
  getOrgRoleDefinitions,
  allowedStructureLevels,
  canCreateStructureLevel,
  isStructureLevelLocked,
  rulesForPlan,
  STRUCTURE_LEVEL_LABELS,
} from "@/lib/org/packageHierarchy";
import { PLAN_LABELS_AR, type PlanSlug } from "@/lib/features/packageFeatures";
import {
  TENANT_EMPTY_STATE_HINT,
  TENANT_EMPTY_STATE_MSG,
} from "@/lib/features/packageFeatures";
import OrgCardNode from "./OrgCardNode";
import OrgHierarchySidebar from "./OrgHierarchySidebar";
import OrgPackagePlanCards from "./OrgPackagePlanCards";
import PositionsPanel from "./PositionsPanel";
import StructureLevelFormModal from "./StructureLevelFormModal";
import AssignEmployeeModal from "./AssignEmployeeModal";
import TeamFormModal from "./TeamFormModal";
import {
  checkCanAddTeam,
  countDepartmentsAtLevel,
  getOrgPlanLimits,
} from "@/lib/org/orgPackageLimits";
import {
  ORG_CANVAS,
  ORG_CANVAS_GLOW,
  ORG_TOOLBAR,
  orgPlanBadgeClass,
} from "@/lib/org/orgVisual";
import type { Department, StructureLevel, Team } from "@/lib/org/types";

const nodeTypes = { orgCard: OrgCardNode };

const LEVEL_ICONS = {
  agency: Shield,
  management: Layers,
  department: Building2,
} as const;

interface InnerProps {
  canManage: boolean;
  orgLabel: string;
}

function SmartOrgFlowInner({ canManage, orgLabel }: InnerProps) {
  const toast = useToast();
  const { fitView } = useReactFlow();
  const { planSlug, isInternal } = useTenantWorkspace();
  const plan = planSlug as PlanSlug;
  const planLimits = useMemo(() => getOrgPlanLimits(plan), [plan]);

  const {
    data,
    loading,
    error,
    refresh,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTeam,
    deleteTeam,
    createPosition,
    deletePosition,
    upsertEmployeeRelation,
  } = useOrgStructure(true);
  const { data: employees } = useEmployees();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [levelModal, setLevelModal] = useState<{
    level: StructureLevel;
    department?: Department | null;
  } | null>(null);
  const [teamModal, setTeamModal] = useState<{ team?: Team | null; deptId?: string } | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const employeeNames = useMemo(() => {
    const m = new Map<string, string>();
    employees.forEach((e) => {
      m.set(e.id, e.name || e.email || "موظف");
    });
    return m;
  }, [employees]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return buildOrgFlowGraph(data, orgLabel, employeeNames, collapsed, BOARD_LABEL_AR);
  }, [data, orgLabel, employeeNames, collapsed]);

  const [nodes, setNodes] = useState<Node<OrgNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const timer = setTimeout(() => fitView({ padding: 0.15, duration: 280 }), 100);
    return () => clearTimeout(timer);
  }, [initialNodes, initialEdges, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<OrgNodeData>[]);
  }, []);

  const onNodeClick = useCallback((_: unknown, node: Node<OrgNodeData>) => {
    const d = node.data;
    if (d.kind === "department" && (d.childCount ?? 0) > 0) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(d.entityId)) next.delete(d.entityId);
        else next.add(d.entityId);
        return next;
      });
    }
    setSelectedId(node.id);
  }, []);

  const onNodeDragStop: OnNodeDrag = useCallback(
    async (_event, node) => {
      if (!canManage || node.data.kind !== "department") return;
      const dragged = (node.data as OrgNodeData).entityId;
      const others = nodes.filter(
        (n) => n.data.kind === "department" && n.data.entityId !== dragged,
      );
      let nearest: Node<OrgNodeData> | null = null;
      let minDist = Infinity;
      for (const o of others) {
        const dx = o.position.x - node.position.x;
        const dy = o.position.y - node.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && o.position.y < node.position.y) {
          minDist = dist;
          nearest = o;
        }
      }
      if (nearest && minDist < PARENT_SNAP_DISTANCE_PX) {
        try {
          await updateDepartment(dragged, {
            parent_id: nearest.data.entityId,
          });
          toast.success("تم تحديث التسلسل الهرمي");
          await refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "تعذر تحديث التبعية");
        }
      }
    },
    [canManage, nodes, updateDepartment, toast, refresh],
  );

  const selectedDept = data?.departments.find((d) => `dept-${d.id}` === selectedId);
  const selectedTeam = data?.teams.find((t) => `team-${t.id}` === selectedId);

  const openAddLevel = (level: StructureLevel) => {
    const check = canCreateStructureLevel(plan, level, data?.departments ?? []);
    if (!check.allowed) {
      toast.error(check.reason ?? "غير متاح في باقتك");
      return;
    }
    setLevelModal({ level, department: null });
  };

  const toolbarLevels = (["agency", "management", "department"] as StructureLevel[]).filter(
    (level) => level !== "agency" || plan === "advanced",
  );

  const openAddTeam = () => {
    if (data) {
      const cap = checkCanAddTeam(data, planLimits);
      if (!cap.allowed) {
        toast.error(cap.message ?? "بلغت حد الفرق في باقتك");
        return;
      }
    }
    setTeamModal({ deptId: selectedDept?.id });
  };

  const handleSidebarSelect = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      const match = nodes.find((n) => n.id === nodeId);
      if (match) {
        void fitView({ nodes: [match], padding: 0.4, duration: 320 });
      }
    },
    [nodes, fitView],
  );

  const handleToggleCollapse = useCallback((deptId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }, []);

  const isEmpty =
    !loading && !error && data && data.departments.length === 0 && data.teams.length === 0;

  const rules = rulesForPlan(plan);
  const enabledLevels = allowedStructureLevels(plan);

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-[#1e3a5f] p-12 text-center text-[#8ba3c7] text-sm animate-pulse"
        style={{ background: "rgba(10,22,40,0.6)" }}
      >
        جارٍ تحميل الهيكل الإداري الذكي...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-red-400 text-sm space-y-3 bg-red-500/5">
        <p>{error}</p>
        <p className="text-[#8ba3c7] text-xs">
          تأكد من تطبيق migration 019 (و 026 للمستويات) على Supabase.
        </p>
        <button type="button" onClick={() => void refresh()} className="btn-secondary text-sm min-h-11">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/25 p-5 sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,22,40,0.95) 0%, rgba(30,50,90,0.85) 50%, rgba(88,28,135,0.15) 100%)",
          boxShadow: "0 0 60px rgba(34,211,238,0.08)",
        }}
      >
        <div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={orgPlanBadgeClass(planLimits)}>
                <Sparkles size={12} />
                باقة {planLimits.planLabelAr}
              </span>
              <span className="text-[#6b87ab] text-[10px]">
                {plan === "advanced" && (
                  <>
                    وكالة {countDepartmentsAtLevel(data?.departments ?? [], "agency")}/
                    {planLimits.structureCaps.agency} ·{" "}
                  </>
                )}
                إدارة {countDepartmentsAtLevel(data?.departments ?? [], "management")}/
                {planLimits.structureCaps.management} · قسم{" "}
                {countDepartmentsAtLevel(data?.departments ?? [], "department")}/
                {planLimits.structureCaps.department}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              الهيكل الإداري الذكي
            </h2>
            <p className="text-[#8ba3c7] text-sm mt-2 max-w-xl leading-relaxed">
              صمّم هيكلك التشغيلي بمرونة حسب حجم فريقك وباقة اشتراكك. كل تغيير يُحفظ في
              قاعدة البيانات ويبقى بعد التحديث.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#6b87ab] text-xs">
            <Network size={16} className="text-[#22d3ee]" />
            {orgLabel}
          </div>
        </div>
      </section>

      <OrgPackagePlanCards plan={plan} />

      {isEmpty ? (
        <div
          className="rounded-2xl border border-dashed border-[#22d3ee]/30 p-10 text-center flex flex-col items-center gap-4"
          style={{ background: "rgba(10,22,40,0.5)" }}
        >
          <Network size={40} className="text-[#22d3ee]" />
          <h3 className="text-white font-heading font-bold text-lg">{TENANT_EMPTY_STATE_MSG}</h3>
          <p className="text-[#8ba3c7] text-sm max-w-md">{TENANT_EMPTY_STATE_HINT}</p>
          {canManage && (
            <button
              type="button"
              onClick={() => openAddLevel(enabledLevels[0] ?? "department")}
              className="btn-primary mt-2 flex items-center gap-2 text-sm min-h-11 touch-manipulation"
            >
              <Plus size={16} />
              ابدأ بإضافة {STRUCTURE_LEVEL_LABELS[enabledLevels[0] ?? "department"]}
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(260px,300px)] gap-4"
          dir="rtl"
        >
          {data && (
            <div className="order-2 xl:order-none min-h-[280px] xl:min-h-[min(68vh,580px)]">
              <OrgHierarchySidebar
                snapshot={data}
                selectedId={selectedId}
                collapsed={collapsed}
                onSelect={handleSidebarSelect}
                onToggleCollapse={handleToggleCollapse}
                accent={planLimits.accent}
              />
            </div>
          )}
          <div className="space-y-3 min-w-0 order-1 xl:order-none">
            {canManage && (
              <>
              <p className="text-[#6b87ab] text-xs w-full">
                المستويات المتاحة في باقتك:{" "}
                <span className="text-[#22d3ee]">
                  {enabledLevels.map((l) => STRUCTURE_LEVEL_LABELS[l]).join(" · ")}
                </span>
                {enabledLevels.length < 3 && (
                  <span className="text-white/40"> — المستويات الأخرى مقفلة حسب الاشتراك</span>
                )}
              </p>
              <div className={cn("flex flex-wrap gap-2", ORG_TOOLBAR)}>
                {toolbarLevels.map((level) => {
                  const locked = isStructureLevelLocked(plan, level);
                  const cap = planLimits.structureCaps[level];
                  const used = countDepartmentsAtLevel(data?.departments ?? [], level);
                  const atCap = !locked && used >= cap;
                  const Icon = LEVEL_ICONS[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={locked || atCap}
                      onClick={() => openAddLevel(level)}
                      className={cn(
                        "text-sm flex items-center gap-2 px-3 py-2 rounded-xl border min-h-11 touch-manipulation transition-all",
                        locked || atCap
                          ? "border-[#1e3a5f] text-[#4a6a99] bg-[#0a1628]/40 cursor-not-allowed"
                          : "border-[#22d3ee]/40 text-white bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20",
                      )}
                      title={
                        locked
                          ? "غير متاح في باقتك"
                          : atCap
                            ? "وصلت للحد الأعلى في باقتك الحالية"
                            : `${used}/${cap}`
                      }
                    >
                      {locked || atCap ? <Lock size={14} /> : <Icon size={14} />}
                      {STRUCTURE_LEVEL_LABELS[level]}
                      <span className="text-[10px] opacity-70">
                        {used}/{cap}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAssignModal(true)}
                  disabled={!data?.departments.length}
                  title={!data?.departments.length ? "أنشئ قسمًا أولاً ثم عيّن الموظفين" : undefined}
                  className="btn-secondary text-sm flex items-center gap-2 min-h-11 touch-manipulation disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  موظف
                </button>
                <button
                  type="button"
                  onClick={openAddTeam}
                  disabled={!selectedDept}
                  className="btn-secondary text-sm flex items-center gap-2 min-h-11 touch-manipulation"
                >
                  <Plus size={14} />
                  فريق
                </button>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="btn-secondary text-sm flex items-center gap-2 min-h-11"
                >
                  <RefreshCw size={14} />
                  تحديث
                </button>
                {selectedDept && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLevelModal({
                          level: selectedDept.structure_level ?? "department",
                          department: selectedDept,
                        })
                      }
                      className="btn-secondary text-sm flex items-center gap-1 min-h-11"
                    >
                      <Pencil size={13} />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`حذف «${selectedDept.name}»؟`)) return;
                        void deleteDepartment(selectedDept.id)
                          .then(() => toast.success("تم الحذف"))
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : "تعذر الحذف"),
                          );
                      }}
                      className="text-sm flex items-center gap-1 px-3 py-2 rounded-xl border border-red-500/40 text-red-400 min-h-11"
                    >
                      <Trash2 size={13} />
                      حذف
                    </button>
                  </>
                )}
              </div>
              </>
            )}

            <div
              className={cn(ORG_CANVAS, "relative")}
              style={{ height: "min(68vh, 580px)" }}
            >
              <div className={ORG_CANVAS_GLOW} aria-hidden />
              <div className="relative z-[1] h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                nodesDraggable={canManage}
                nodesConnectable={false}
                onNodeClick={onNodeClick}
                onNodeDragStop={onNodeDragStop}
                fitView
                minZoom={0.15}
                maxZoom={1.6}
                proOptions={{ hideAttribution: true }}
                className="bg-transparent"
              >
                <Background color="#1e3a5f" gap={24} size={1} />
                <Controls className="!bg-[#0d1f3c]/90 !border-[#1e3a5f] !rounded-xl" />
                <MiniMap
                  className="!bg-[#0d1f3c]/90 !border-[#1e3a5f] hidden md:block !rounded-xl"
                  nodeColor={(n) => (n.data as OrgNodeData).color}
                />
              </ReactFlow>
              </div>
            </div>
            <p className="text-[#6b87ab] text-xs text-center">
              انقر للتوسيع · اسحب العقدة تحت الأب لتغيير التبعية · لا صور — بطاقات زجاجية فقط
            </p>
          </div>

          <aside className="space-y-4 order-3 xl:order-none">
            {data && (
              <PositionsPanel
                positions={data.positions}
                canManage={canManage}
                onCreate={createPosition}
                onDelete={deletePosition}
              />
            )}
            <div
              className="rounded-2xl border border-[#1e3a5f] p-4 space-y-3"
              style={{ background: "rgba(10,22,40,0.75)" }}
            >
              <h3 className="text-white text-sm font-bold">قواعد الباقة</h3>
              <ul className="space-y-2">
                {rules.map((line) => (
                  <li key={line} className="text-[#8ba3c7] text-xs leading-relaxed flex gap-2">
                    <span className="text-[#22d3ee] shrink-0">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl border border-[#1e3a5f] p-4 space-y-3 max-h-[320px] overflow-y-auto"
              style={{ background: "rgba(10,22,40,0.75)" }}
            >
              <h3 className="text-white text-sm font-bold">الأدوار في الهيكل</h3>
              {getOrgRoleDefinitions(isInternal).map((r) => (
                <div
                  key={r.title}
                  className="rounded-xl border border-[#1e3a5f]/80 p-3"
                  style={{ borderRightWidth: 3, borderRightColor: r.color }}
                >
                  <div className="text-white text-xs font-semibold">{r.title}</div>
                  <div className="text-[#6b87ab] text-[10px] mt-1">{r.desc}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {levelModal && data && (
        <StructureLevelFormModal
          level={levelModal.level}
          plan={plan}
          department={levelModal.department}
          departments={data.departments}
          locked={isStructureLevelLocked(plan, levelModal.level)}
          onSave={
            levelModal.department
              ? (input) => updateDepartment(levelModal.department!.id, input)
              : createDepartment
          }
          onClose={() => setLevelModal(null)}
        />
      )}
      {teamModal && data && (
        <TeamFormModal
          team={teamModal.team ?? null}
          departments={data.departments}
          defaultDepartmentId={teamModal.deptId}
          onSave={createTeam}
          onClose={() => setTeamModal(null)}
        />
      )}
      {assignModal && data && (
        <AssignEmployeeModal
          employees={employees}
          departments={data.departments}
          teams={data.teams}
          defaultDepartmentId={selectedDept?.id}
          onAssign={async (input) => {
            await upsertEmployeeRelation({
              employee_id: input.employee_id,
              department_id: input.department_id,
              team_id: input.team_id,
              position_id: null,
              manager_id: null,
            });
            toast.success("تم ربط الموظف بالهيكل");
            await refresh();
          }}
          onClose={() => setAssignModal(false)}
        />
      )}
    </div>
  );
}

export default function SmartOrgBuilder({
  canManage,
  orgLabel = "منشأتك",
}: {
  canManage: boolean;
  orgLabel?: string;
}) {
  return (
    <ReactFlowProvider>
      <SmartOrgFlowInner canManage={canManage} orgLabel={orgLabel} />
    </ReactFlowProvider>
  );
}
