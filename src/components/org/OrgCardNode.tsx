"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronLeft, Building2, Users, User } from "lucide-react";
import type { OrgNodeData } from "@/lib/org/buildFlowGraph";
import { cn } from "@/lib/utils";

function OrgCardNodeComponent({ data, selected }: NodeProps) {
  const d = data as OrgNodeData;
  const Icon =
    d.kind === "department" ? Building2 : d.kind === "team" ? Users : User;

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 min-w-[180px] max-w-[220px] shadow-lg transition-all",
        selected && "ring-2 ring-[#22d3ee]/60",
      )}
      style={{
        background: "rgba(10,22,40,0.92)",
        borderColor: `${d.color}55`,
        backdropFilter: "blur(12px)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#22d3ee] !w-2 !h-2" />
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${d.color}22` }}
        >
          <Icon size={14} style={{ color: d.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-semibold truncate">{d.label}</div>
          {d.subtitle && (
            <div className="text-[#8ba3c7] text-[11px] truncate mt-0.5">{d.subtitle}</div>
          )}
        </div>
        {d.kind === "department" && (d.childCount ?? 0) > 0 && (
          <span className="text-[#8ba3c7]">
            {d.collapsed ? <ChevronLeft size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#22d3ee] !w-2 !h-2" />
    </div>
  );
}

export default memo(OrgCardNodeComponent);
