"use client";

// OfficeControlModal — C14-L2: iPhone-style centered glass modal for virtual office rooms.
// Shown when clicking any office room. Read-only for non-managers.

import { X, MapPin, Users, CheckCircle2, AlertCircle, DoorOpen, Archive } from "lucide-react";
import type { OfficeRoom, MappingSource, PreviewOrgUnit } from "./VirtualOfficeDesign";
import { formatOfficeNumber } from "./VirtualOfficeReferenceScene";

const OFFICE_LABEL_PREFIX = "مكتب";
const officeLabel = (n: number) => `${OFFICE_LABEL_PREFIX} ${formatOfficeNumber(n)}`;

export interface OfficeRoomState {
  is_open: boolean;
}

export interface OfficeControlModalProps {
  room: OfficeRoom;
  roomState: OfficeRoomState | null;
  isManager: boolean;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource: MappingSource | null;
  isUpdating: boolean;
  onClose: () => void;
  onOpenMapping: () => void;
  onToggleOpen: (is_open: boolean) => void;
}

function hpStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981" };
  if (pct >= 70) return { color: "#f59e0b" };
  return { color: "#ef4444" };
}

export default function OfficeControlModal({
  room,
  roomState,
  isManager,
  mappingUnit,
  mappingSource,
  isUpdating,
  onClose,
  onOpenMapping,
  onToggleOpen,
}: OfficeControlModalProps) {
  const label = room.officeNumber ? officeLabel(room.officeNumber) : "مكتب";
  const isOpen = roomState?.is_open ?? true;
  const linkedName = mappingUnit?.name ?? (room.isUnassigned ? null : room.name);
  const hp = hpStyle(room.healthPct);
  const sourceTag = mappingSource === "saved" ? "• محفوظ" : mappingSource === "preview" ? "• معاينة" : mappingSource === "auto" ? "• تلقائي" : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`إدارة ${label}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(2,6,18,0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: 26,
          background: "rgba(8,16,36,0.98)",
          border: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04) inset",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        dir="rtl"
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, border: `1px solid ${room.accentColor}40`, background: `${room.accentColor}12`, color: room.accentColor, fontSize: 11, fontWeight: 800, padding: "3px 10px", marginBottom: 8 }}>
              {label}
              {room.isCenter && <span style={{ fontSize: 9, background: "rgba(139,92,246,0.20)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.30)", padding: "0 5px", borderRadius: 999 }}>مجلس الإدارة</span>}
            </span>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
              {room.isUnassigned ? <span style={{ color: "#8ba3c7", fontStyle: "italic" }}>غير مخصص</span> : room.name}
            </h2>
            {room.type && <p style={{ margin: "5px 0 0", color: "#6b87ab", fontSize: 12 }}>{room.type}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Status row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              borderRadius: 999, padding: "4px 12px",
              border: isOpen ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(100,116,139,0.30)",
              background: isOpen ? "rgba(16,185,129,0.10)" : "rgba(100,116,139,0.08)",
              color: isOpen ? "#6ee7b7" : "#94a3b8",
              fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOpen ? "#10b981" : "#64748b", boxShadow: isOpen ? "0 0 8px #10b981" : undefined }} />
              {isOpen ? "مفتوح" : "مغلق"}
            </span>
            {room.healthPct > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: hp.color, fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={12} /> {room.healthPct}%
              </span>
            )}
          </div>

          {/* Linked unit */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(34,211,238,0.14)", background: "rgba(34,211,238,0.05)", padding: "11px 14px" }}>
            <div style={{ fontSize: 10, color: "#4a6a8a", marginBottom: 4 }}>الربط الإداري {sourceTag}</div>
            {linkedName ? (
              <div style={{ fontSize: 14, fontWeight: 700, color: "#dff7ff" }}>{linkedName}</div>
            ) : (
              <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>لا يوجد ربط حالي</div>
            )}
          </div>

          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { Icon: Users, color: "#22d3ee", label: "الأعضاء", value: room.employeeCount },
              { Icon: CheckCircle2, color: "#10b981", label: "المهام", value: room.openTasks },
              { Icon: AlertCircle, color: "#f59e0b", label: "المتأخرة", value: room.overdueTasks },
            ].map(({ Icon, color, label: l, value }) => (
              <div key={l} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "10px 12px", textAlign: "center" }}>
                <Icon size={14} color={color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
          {!isManager && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center" }}>
              ليست لديك صلاحية إدارة المكاتب.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={!isManager}
              onClick={() => onOpenMapping()}
              style={{
                flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                borderRadius: 12, border: "1px solid rgba(34,211,238,0.30)", background: "rgba(34,211,238,0.10)", color: "#22d3ee",
                fontSize: 13, fontWeight: 600, cursor: isManager ? "pointer" : "not-allowed",
                opacity: isManager ? 1 : 0.4,
              }}
            >
              <MapPin size={14} />
              {linkedName ? "تغيير الربط" : "ربط المكتب"}
            </button>

            {!room.isCenter && (
              <button
                type="button"
                disabled={!isManager || isUpdating}
                onClick={() => onToggleOpen(!isOpen)}
                style={{
                  flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  borderRadius: 12,
                  border: isOpen ? "1px solid rgba(239,68,68,0.30)" : "1px solid rgba(16,185,129,0.30)",
                  background: isOpen ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                  color: isOpen ? "#fca5a5" : "#6ee7b7",
                  fontSize: 13, fontWeight: 600,
                  cursor: isManager && !isUpdating ? "pointer" : "not-allowed",
                  opacity: (isManager && !isUpdating) ? 1 : 0.4,
                }}
              >
                {isOpen ? <Archive size={14} /> : <DoorOpen size={14} />}
                {isUpdating ? "جارٍ التحديث..." : isOpen ? "إغلاق المكتب" : "فتح المكتب"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7",
                fontSize: 13, cursor: "pointer", padding: "0 16px",
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
