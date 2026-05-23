"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ChevronDown,
  ChevronLeft,
  Building2,
  Users,
  User,
  Layers,
  Shield,
  Network,
} from "lucide-react";
import type { OrgNodeData } from "@/lib/org/buildFlowGraph";
import { cn } from "@/lib/utils";

function levelIcon(d: OrgNodeData) {
  if (d.kind === "org") return Network;
  if (d.kind === "team") return Users;
  if (d.kind === "employee") return User;
  if (d.structureLevel === "agency") return Shield;
  if (d.structureLevel === "management") return Layers;
  return Building2;
}

function OrgCardNodeComponent({ data, selected }: NodeProps) {
  const d = data as OrgNodeData;
  const Icon = levelIcon(d);

  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5 min-w-[168px] max-w-[220px] transition-all duration-200",
        selected && "ring-2 ring-[#22d3ee]/70 scale-[1.02]",
        d.kind === "org" && "min-w-[200px]",
      )}
      style={{
        background:
          d.kind === "org"
            ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(30,111,217,0.12))"
            : "rgba(10,22,40,0.94)",
        borderColor: `${d.color}66`,
        boxShadow: selected
          ? `0 0 24px ${d.color}44`
          : `0 4px 20px rgba(0,0,0,0.35), 0 0 1px ${d.color}33`,
        backdropFilter: "blur(14px)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#22d3ee] !w-2 !h-2 !border-0" />
      <div className="flex items-start gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${d.color}33, ${d.color}11)`,
          }}
        >
          <Icon size={16} style={{ color: d.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-semibold truncate leading-tight">{d.label}</div>
          {d.subtitle && (
            <div className="text-[#8ba3c7] text-[10px] truncate mt-0.5">{d.subtitle}</div>
          )}
        </div>
        {d.kind === "department" && (d.childCount ?? 0) > 0 && (
          <span className="text-[#8ba3c7]">
            {d.collapsed ? <ChevronLeft size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#22d3ee] !w-2 !h-2 !border-0" />
    </div>
  );
}

export default memo(OrgCardNodeComponent);
