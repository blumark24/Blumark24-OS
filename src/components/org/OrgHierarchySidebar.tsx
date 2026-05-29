"use client";

import { useMemo } from "react";
import { Building2, ChevronDown, ChevronLeft, Crown, Layers, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import {
  buildDepartmentTreeContext,
  departmentChildren,
  warnDepartmentTreeIssuesInDev,
} from "@/lib/org/departmentTree";
import type { Department, OrgStructureSnapshot, Team } from "@/lib/org/types";

interface Props {
  snapshot: OrgStructureSnapshot;
  boardLabel: string;
  selectedId: string | null;
  collapsed: Set<string>;
  onSelect: (nodeId: string) => void;
  onToggleCollapse: (deptId: string) => void;
  accent: string;
}

function DeptBranch({
  dept,
  depts,
  teams,
  depth,
  selectedId,
  collapsed,
  onSelect,
  onToggleCollapse,
  accent,
  treeCtx,
}: {
  dept: Department;
  depts: Department[];
  teams: Team[];
  depth: number;
  selectedId: string | null;
  collapsed: Set<string>;
  onSelect: (id: string) => void;
  onToggleCollapse: (deptId: string) => void;
  accent: string;
  treeCtx: ReturnType<typeof buildDepartmentTreeContext>;
}) {
  const nodeId = `dept-${dept.id}`;
  const isCollapsed = collapsed.has(dept.id);
  const childDepts = departmentChildren(depts, dept.id, treeCtx);
  const deptTeams = teams
    .filter((t) => t.department_id === dept.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelect(nodeId)}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-right text-sm transition-colors",
          selectedId === nodeId
            ? "bg-white/10 text-white"
            : "text-[#b8cce8] hover:bg-white/[0.05] hover:text-white",
        )}
        style={{ paddingRight: `${depth * 12 + 8}px` }}
      >
        {(childDepts.length > 0 || deptTeams.length > 0) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(dept.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onToggleCollapse(dept.id);
              }
            }}
            className="shrink-0 p-0.5"
          >
            {isCollapsed ? (
              <ChevronLeft size={14} className="text-[#6b87ab]" />
            ) : (
              <ChevronDown size={14} style={{ color: accent }} />
            )}
          </span>
        )}
        <Building2 size={14} className="shrink-0" style={{ color: dept.color || accent }} />
        <span className="truncate flex-1 min-w-0">{dept.name}</span>
        <PublicCodeBadge code={dept.publicCode} className="shrink-0 max-w-[5.5rem]" />
      </button>

      {!isCollapsed && (
        <ul className="mt-0.5 space-y-0.5">
          {deptTeams.map((team) => {
            const tid = `team-${team.id}`;
            return (
              <li key={team.id} className="list-none">
                <button
                  type="button"
                  onClick={() => onSelect(tid)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-2 py-1 text-right text-xs transition-colors",
                    selectedId === tid
                      ? "bg-white/10 text-white"
                      : "text-[#8ba3c7] hover:bg-white/[0.04] hover:text-white",
                  )}
                  style={{ paddingRight: `${(depth + 1) * 12 + 20}px` }}
                >
                  <Users size={12} className="shrink-0 text-[#6b87ab]" />
                  <span className="truncate">{team.name}</span>
                </button>
              </li>
            );
          })}
          {childDepts.map((child) => (
            <DeptBranch
              key={child.id}
              dept={child}
              depts={depts}
              teams={teams}
              depth={depth + 1}
              selectedId={selectedId}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggleCollapse={onToggleCollapse}
              accent={accent}
              treeCtx={treeCtx}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgHierarchySidebar({
  snapshot,
  boardLabel,
  selectedId,
  collapsed,
  onSelect,
  onToggleCollapse,
  accent,
}: Props) {
  const treeCtx = useMemo(
    () => buildDepartmentTreeContext(snapshot.departments),
    [snapshot.departments],
  );

  const roots = useMemo(() => {
    warnDepartmentTreeIssuesInDev(snapshot.departments);
    return departmentChildren(snapshot.departments, null, treeCtx);
  }, [snapshot.departments, treeCtx]);
  const boardCollapsed = collapsed.has("__board__");

  return (
    <aside
      dir="rtl"
      className="flex flex-col h-full min-h-0 rounded-xl border border-white/[0.08] bg-[rgba(8,18,32,0.92)] backdrop-blur-xl overflow-hidden"
    >
      <div className="px-3 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Layers size={16} style={{ color: accent }} />
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold">شجرة الهيكل</div>
          <div className="text-[#6b87ab] text-[10px]">عرض هرمي تفاعلي</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {roots.length === 0 ? (
          <ul className="space-y-0.5">
            <li className="list-none">
              <button
                type="button"
                onClick={() => onSelect("org-root")}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-right text-sm transition-colors",
                  selectedId === "org-root"
                    ? "bg-white/10 text-white"
                    : "text-[#b8cce8] hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <Crown size={14} className="shrink-0 text-[#22d3ee]" />
                <span className="truncate flex-1">{boardLabel}</span>
              </button>
            </li>
            <p className="text-[#6b87ab] text-xs text-center py-4 px-2">
              لا توجد وحدات بعد — أنشئ أول وحدة من شريط الأدوات
            </p>
          </ul>
        ) : (
          <ul className="space-y-0.5">
            <li className="list-none">
              <button
                type="button"
                onClick={() => onSelect("org-root")}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-right text-sm transition-colors",
                  selectedId === "org-root"
                    ? "bg-white/10 text-white"
                    : "text-[#b8cce8] hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {roots.length > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollapse("__board__");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onToggleCollapse("__board__");
                      }
                    }}
                    className="shrink-0 p-0.5"
                  >
                    {boardCollapsed ? (
                      <ChevronLeft size={14} className="text-[#6b87ab]" />
                    ) : (
                      <ChevronDown size={14} style={{ color: accent }} />
                    )}
                  </span>
                )}
                <Crown size={14} className="shrink-0 text-[#22d3ee]" />
                <span className="truncate flex-1">{boardLabel}</span>
              </button>
              {!boardCollapsed && (
                <ul className="mt-0.5 space-y-0.5">
                  {roots.map((dept) => (
                    <DeptBranch
                      key={dept.id}
                      dept={dept}
                      depts={snapshot.departments}
                      teams={snapshot.teams}
                      depth={1}
                      selectedId={selectedId}
                      collapsed={collapsed}
                      onSelect={onSelect}
                      onToggleCollapse={onToggleCollapse}
                      accent={accent}
                      treeCtx={treeCtx}
                    />
                  ))}
                </ul>
              )}
            </li>
          </ul>
        )}
      </div>
    </aside>
  );
}
