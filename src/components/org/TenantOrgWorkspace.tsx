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
import { Plus, Network, RefreshCw, Trash2, Pencil } from "lucide-react";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useEmployees } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import { buildOrgFlowGraph, type OrgNodeData } from "@/lib/org/buildFlowGraph";
import {
  TENANT_EMPTY_STATE_HINT,
  TENANT_EMPTY_STATE_MSG,
} from "@/lib/features/packageFeatures";
import OrgCardNode from "./OrgCardNode";
import DepartmentFormModal from "./DepartmentFormModal";
import TeamFormModal from "./TeamFormModal";
import PositionsPanel from "./PositionsPanel";
import type { Department, Team } from "@/lib/org/types";

const nodeTypes = { orgCard: OrgCardNode };

interface InnerProps {
  canManage: boolean;
  orgLabel: string;
}

function TenantOrgFlowInner({ canManage, orgLabel }: InnerProps) {
  const toast = useToast();
  const { fitView } = useReactFlow();
  const { data, loading, error, refresh, createDepartment, updateDepartment, deleteDepartment, createTeam, deleteTeam, createPosition, deletePosition } =
    useOrgStructure(true);
  const { data: employees } = useEmployees();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deptModal, setDeptModal] = useState<Department | null | "new">(null);
  const [teamModal, setTeamModal] = useState<{ team?: Team | null; deptId?: string } | null>(null);
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
    return buildOrgFlowGraph(data, orgLabel, employeeNames, collapsed);
  }, [data, orgLabel, employeeNames, collapsed]);

  const [nodes, setNodes] = useState<Node<OrgNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const timer = setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 80);
    return () => clearTimeout(timer);
  }, [initialNodes, initialEdges, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<OrgNodeData>[]);
  }, []);

  const onNodeClick = useCallback(
    (_: unknown, node: Node<OrgNodeData>) => {
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
    },
    [],
  );

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
      if (nearest && minDist < 280) {
        try {
          await updateDepartment(dragged, {
            parent_id: (nearest.data as OrgNodeData).entityId,
          });
          toast.success("تم تحديث التسلسل الهرمي");
          await refresh();
        } catch {
          toast.error("تعذر تحديث الإدارة");
        }
      }
    },
    [canManage, nodes, updateDepartment, toast, refresh],
  );

  const selectedDept = data?.departments.find((d) => `dept-${d.id}` === selectedId);
  const selectedTeam = data?.teams.find((t) => `team-${t.id}` === selectedId);

  const isEmpty =
    !loading &&
    !error &&
    data &&
    data.departments.length === 0 &&
    data.teams.length === 0;

  if (loading) {
    return (
      <div className="glass-card p-10 text-center text-[#8ba3c7] text-sm">
        جارٍ تحميل الهيكل التنظيمي...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border border-red-500/30 text-red-400 text-sm space-y-3">
        <p>{error}</p>
        <p className="text-[#8ba3c7] text-xs">
          تأكد من تطبيق migration 019 على قاعدة البيانات إذا كانت الجداول غير موجودة بعد.
        </p>
        <button type="button" onClick={() => void refresh()} className="btn-secondary text-sm">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
        <Network size={32} className="text-[#22d3ee]" />
        <h3 className="text-white font-heading font-bold text-lg">{TENANT_EMPTY_STATE_MSG}</h3>
        <p className="text-[#8ba3c7] text-sm max-w-md">{TENANT_EMPTY_STATE_HINT}</p>
        {canManage && (
          <button
            type="button"
            onClick={() => setDeptModal("new")}
            className="btn-primary mt-2 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            إنشاء أول إدارة
          </button>
        )}
        {deptModal === "new" && data && (
          <DepartmentFormModal
            departments={data.departments}
            onSave={createDepartment}
            onClose={() => setDeptModal(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeptModal("new")}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={14} />
            إدارة
          </button>
          <button
            type="button"
            onClick={() => setTeamModal({ deptId: selectedDept?.id })}
            className="btn-secondary text-sm flex items-center gap-2"
            disabled={!data?.departments.length}
          >
            <Plus size={14} />
            فريق
          </button>
          <button type="button" onClick={() => void refresh()} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} />
            تحديث
          </button>
          {selectedDept && (
            <>
              <button
                type="button"
                onClick={() => setDeptModal(selectedDept)}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Pencil size={13} />
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(`حذف إدارة "${selectedDept.name}"؟`)) return;
                  void deleteDepartment(selectedDept.id).then(() => toast.success("تم الحذف"));
                }}
                className="text-sm flex items-center gap-1 px-3 py-2 rounded-xl border border-red-500/40 text-red-400"
              >
                <Trash2 size={13} />
                حذف
              </button>
            </>
          )}
          {selectedTeam && (
            <button
              type="button"
              onClick={() => {
                if (!confirm(`حذف فريق "${selectedTeam.name}"؟`)) return;
                void deleteTeam(selectedTeam.id).then(() => toast.success("تم الحذف"));
              }}
              className="text-sm flex items-center gap-1 px-3 py-2 rounded-xl border border-red-500/40 text-red-400"
            >
              <Trash2 size={13} />
              حذف فريق
            </button>
          )}
        </div>
      )}

      <div
        className="glass-card overflow-hidden rounded-2xl border border-[#1e3a5f]"
        style={{ height: "min(70vh, 560px)" }}
      >
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
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0a1628]"
        >
          <Background color="#1e3a5f" gap={20} />
          <Controls className="!bg-[#0d1f3c] !border-[#1e3a5f]" />
          <MiniMap
            className="!bg-[#0d1f3c] hidden sm:block"
            nodeColor={(n) => (n.data as OrgNodeData).color}
          />
        </ReactFlow>
      </div>

      {data && (
        <PositionsPanel
          positions={data.positions}
          canManage={canManage}
          onCreate={createPosition}
          onDelete={deletePosition}
        />
      )}

      <p className="text-[#6b87ab] text-xs text-center">
        انقر على إدارة لتوسيع/طي الفروع · اسحب الإدارة تحت إدارة أخرى لتعيين التبعية
      </p>

      {deptModal === "new" && data && (
        <DepartmentFormModal
          departments={data.departments}
          onSave={createDepartment}
          onClose={() => setDeptModal(null)}
        />
      )}
      {deptModal && deptModal !== "new" && data && (
        <DepartmentFormModal
          department={deptModal}
          departments={data.departments}
          onSave={(input) => updateDepartment(deptModal.id, input)}
          onClose={() => setDeptModal(null)}
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
    </div>
  );
}

export default function TenantOrgWorkspace({
  canManage,
  orgLabel = "المنشأة",
}: {
  canManage: boolean;
  orgLabel?: string;
}) {
  return (
    <ReactFlowProvider>
      <TenantOrgFlowInner canManage={canManage} orgLabel={orgLabel} />
    </ReactFlowProvider>
  );
}
