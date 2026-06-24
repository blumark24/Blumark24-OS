"use client";

// OfficeControlModal — C14-L2C: iPhone-style smart office management modal.
// All office actions (link, open/close, reset) happen in one centered glass modal.

import { useState } from "react";
import { X, Users, CheckCircle2, DoorOpen, Archive, MapPin, ChevronDown } from "lucide-react";
import type { OfficeRoom, MappingSource, PreviewOrgUnit } from "./VirtualOfficeDesign";
import { formatOfficeNumber } from "./VirtualOfficeReferenceScene";

const officeLabel = (n: number) => `مكتب ${formatOfficeNumber(n)}`;

export interface OfficeRoomState {
  is_open: boolean;
}

export interface BoardOfficeStats {
  totalOffices: number;
  linkedOfficeCount: number;
  unassignedOfficeCount: number;
  openCount: number;
  closedCount: number;
}

export interface OfficeControlModalProps {
  room: OfficeRoom;
  roomState: OfficeRoomState | null;
  isManager: boolean;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource: MappingSource | null;
  managerName: string | null;
  units: PreviewOrgUnit[];
  isSaving: boolean;
  isUpdating: boolean;
  boardStats?: BoardOfficeStats | null;
  onClose: () => void;
  onSave: (unit: PreviewOrgUnit) => void;
  onToggleOpen: (is_open: boolean) => void;
  onReset: () => void;
  onOpenAll?: () => void;
  onCloseAll?: () => void;
  onReviewUnassigned?: () => void;
}

type TypeFilter = "all" | "management" | "department" | "team";

const TYPE_TABS: Array<{ key: TypeFilter; label: string }> = [
  { key: "all",        label: "الكل"  },
  { key: "management", label: "إدارة" },
  { key: "department", label: "قسم"   },
  { key: "team",       label: "فريق"  },
];

const OVERLAY: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 90,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16,
  background: "rgba(2,6,18,0.78)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const MODAL: React.CSSProperties = {
  width: "min(560px, 100%)",
  maxHeight: "min(740px, calc(100vh - 32px))",
  borderRadius: 26,
  background: "rgba(8,16,36,0.98)",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "0 32px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04) inset",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const CLOSE_BTN: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)", color: "#8ba3c7",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0,
};

export default function OfficeControlModal({
  room, roomState, isManager, mappingUnit, mappingSource,
  managerName, units, isSaving, isUpdating, boardStats,
  onClose, onSave, onToggleOpen, onReset,
  onOpenAll, onCloseAll, onReviewUnassigned,
}: OfficeControlModalProps) {
  const [selectedUnitId, setSelectedUnitId] = useState(mappingUnit?.id ?? "");
  const [typeFilter, setTypeFilter]         = useState<TypeFilter>("all");
  const [assignOpen, setAssignOpen]         = useState(room.isUnassigned);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const label  = room.officeNumber ? officeLabel(room.officeNumber) : "مكتب";
  const isOpen = roomState?.is_open ?? true;

  const filteredUnits = units.filter((u) => {
    if (typeFilter === "all") return true;
    if (typeFilter === "management") return u.type === "agency" || u.type === "management";
    return u.type === typeFilter;
  });

  const selectedUnit     = units.find((u) => u.id === selectedUnitId) ?? null;
  const hasNewSelection  = selectedUnit && selectedUnit.id !== (mappingUnit?.id ?? "");

  const sourceTag =
    mappingSource === "saved" ? "• محفوظ" :
    mappingSource === "auto"  ? "• تلقائي" : "";

  // ─── Board Modal ─────────────────────────────────────────────────────────────
  if (room.isCenter) {
    return (
      <div
        role="dialog" aria-modal="true" aria-label="إدارة مكتب مجلس الإدارة"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={OVERLAY}
      >
        <div style={MODAL} dir="rtl">
          {/* Header */}
          <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, border: "1px solid rgba(139,92,246,0.40)", background: "rgba(139,92,246,0.12)", color: "#c4b5fd", fontSize: 11, fontWeight: 800, padding: "3px 10px", marginBottom: 8 }}>
                {label} · مجلس الإدارة
              </span>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
                مكتب مجلس الإدارة
              </h2>
              <p style={{ margin: "6px 0 0", color: "#6b87ab", fontSize: 12, lineHeight: 1.5, maxWidth: 340 }}>
                مكتب مركزي لمتابعة وتشغيل مكاتب المنشأة.
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="إغلاق" style={CLOSE_BTN}>
              <X size={16} />
            </button>
          </div>

          {/* Stats */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {boardStats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {([
                  { label: "عدد المكاتب",      value: boardStats.totalOffices,         color: "#22d3ee" },
                  { label: "المكاتب المرتبطة",  value: boardStats.linkedOfficeCount,    color: "#10b981" },
                  { label: "غير المخصصة",       value: boardStats.unassignedOfficeCount, color: "#f59e0b" },
                  { label: "المفتوحة",          value: boardStats.openCount,            color: "#6ee7b7" },
                  { label: "المغلقة",           value: boardStats.closedCount,          color: "#94a3b8" },
                ] as const).map(({ label: l, value, color }) => (
                  <div key={l} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ margin: 0, fontSize: 11, color: "#4a6a8a", lineHeight: 1.65 }}>
              من هنا يدير مدير المنشأة حالة المكاتب والربط الإداري.
            </p>
          </div>

          {/* Actions */}
          <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            {!isManager && (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center" }}>
                ليست لديك صلاحية إدارة المكتب.
              </p>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={!isManager || isUpdating}
                onClick={onOpenAll}
                style={{ flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(16,185,129,0.30)", background: "rgba(16,185,129,0.08)", color: "#6ee7b7", fontSize: 13, fontWeight: 600, cursor: (isManager && !isUpdating) ? "pointer" : "not-allowed", opacity: (isManager && !isUpdating) ? 1 : 0.4 }}
              >
                <DoorOpen size={14} />
                {isUpdating ? "جارٍ..." : "فتح جميع المكاتب"}
              </button>
              <button
                type="button"
                disabled={!isManager || isUpdating}
                onClick={onCloseAll}
                style={{ flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(239,68,68,0.30)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: (isManager && !isUpdating) ? "pointer" : "not-allowed", opacity: (isManager && !isUpdating) ? 1 : 0.4 }}
              >
                <Archive size={14} />
                {isUpdating ? "جارٍ..." : "إغلاق جميع المكاتب"}
              </button>
            </div>
            {boardStats && boardStats.unassignedOfficeCount > 0 && (
              <button
                type="button"
                disabled={!isManager}
                onClick={onReviewUnassigned}
                style={{ minHeight: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.08)", color: "#fbbf24", fontSize: 12, fontWeight: 600, cursor: isManager ? "pointer" : "not-allowed", opacity: isManager ? 1 : 0.4 }}
              >
                <MapPin size={13} />
                مراجعة المكاتب الجاهزة للتشغيل ({boardStats.unassignedOfficeCount})
              </button>
            )}
            <button type="button" onClick={onClose} style={{ minHeight: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 13, cursor: "pointer" }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal Office Modal ──────────────────────────────────────────────────────
  return (
    <div
      role="dialog" aria-modal="true" aria-label={`إدارة ${label}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={OVERLAY}
    >
      <div style={MODAL} dir="rtl">
        {/* ── Header ── */}
        <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ borderRadius: 999, border: `1px solid ${room.accentColor}40`, background: `${room.accentColor}12`, color: room.accentColor, fontSize: 11, fontWeight: 800, padding: "3px 10px" }}>
                {label}
              </span>
              {room.isUnassigned ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", border: "1px solid rgba(245,158,11,0.40)", background: "rgba(245,158,11,0.10)", color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 6px #f59e0b" }} />
                  جاهز للتشغيل
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", border: isOpen ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(100,116,139,0.30)", background: isOpen ? "rgba(16,185,129,0.10)" : "rgba(100,116,139,0.08)", color: isOpen ? "#6ee7b7" : "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? "#10b981" : "#64748b", boxShadow: isOpen ? "0 0 6px #10b981" : undefined }} />
                  {isOpen ? "مفتوح" : "مغلق"}
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
              إدارة المكتب
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6b87ab", fontSize: 12, lineHeight: 1.5 }}>
              {room.isUnassigned ? "مكتب غير مخصص · جاهز للتشغيل" : `${room.name} · أدر الربط والحالة من نافذة واحدة.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={CLOSE_BTN}>
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Info section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Linked unit */}
            <div style={{ borderRadius: 14, border: "1px solid rgba(34,211,238,0.14)", background: "rgba(34,211,238,0.05)", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#4a6a8a", marginBottom: 3 }}>الجهة المرتبطة {sourceTag}</div>
              {mappingUnit ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#dff7ff" }}>{mappingUnit.name}</div>
                  <div style={{ fontSize: 11, color: "#6b87ab", marginTop: 2 }}>{mappingUnit.typeLabel}</div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>غير مخصص</div>
              )}
            </div>

            {/* Manager */}
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#4a6a8a", marginBottom: 3 }}>المدير المسؤول</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: managerName ? "#c0d4ee" : "#64748b", fontStyle: managerName ? "normal" : "italic" }}>
                {managerName ?? "غير متاح"}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {[
                { Icon: Users,        color: "#22d3ee", label: "الموظفون داخل المكتب", value: room.employeeCount > 0 ? room.employeeCount : "لا يوجد موظفون" },
                { Icon: CheckCircle2, color: "#10b981", label: "المهام المرتبطة",       value: room.openTasks   > 0 ? room.openTasks   : "لا توجد مهام"    },
              ].map(({ Icon, color, label: l, value }) => (
                <div key={l} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "10px 12px", textAlign: "center" }}>
                  <Icon size={13} color={color} style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: typeof value === "number" ? 18 : 11, fontWeight: 700, color: typeof value === "number" ? "#fff" : "#64748b", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Assignment section (manager only) ── */}
          {isManager && units.length >= 0 && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(139,92,246,0.22)", background: "rgba(139,92,246,0.05)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setAssignOpen((v) => !v)}
                aria-expanded={assignOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "start" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>
                  <MapPin size={14} color="#a855f7" />
                  ربط المكتب
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: "#6b87ab", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mappingUnit?.name ?? "غير مخصص"}
                  </span>
                  <ChevronDown size={14} color="#8ba3c7" style={{ flexShrink: 0, transition: "transform 0.18s ease", transform: assignOpen ? "rotate(180deg)" : "none" }} />
                </span>
              </button>

              {assignOpen && (
                <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#6b87ab", lineHeight: 1.5 }}>
                    {room.isUnassigned ? "اختر إدارة أو قسم أو فريق لتشغيل هذا المكتب." : "اختر إدارة أو قسم أو فريق لربط هذا المكتب."}
                  </p>

                  {/* Type filter tabs */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {TYPE_TABS.map(({ key, label: tl }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTypeFilter(key)}
                        style={{
                          borderRadius: 999, padding: "4px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: typeFilter === key ? "1px solid rgba(139,92,246,0.55)" : "1px solid rgba(255,255,255,0.08)",
                          background: typeFilter === key ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                          color: typeFilter === key ? "#c4b5fd" : "#6b87ab",
                        }}
                      >{tl}</button>
                    ))}
                  </div>

                  {/* Unit list */}
                  {filteredUnits.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center", padding: "8px 0" }}>
                      لا توجد إدارات أو أقسام متاحة حالياً.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                      {filteredUnits.map((unit) => {
                        const sel = unit.id === selectedUnitId;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => setSelectedUnitId(unit.id)}
                            style={{
                              width: "100%", textAlign: "right", borderRadius: 10,
                              border: sel ? "1px solid rgba(139,92,246,0.55)" : "1px solid rgba(255,255,255,0.07)",
                              background: sel ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                              padding: "8px 10px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 700, color: sel ? "#e9d5ff" : "#c0d4ee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {unit.name}
                            </span>
                            <span style={{ fontSize: 10, color: "#6b87ab", flexShrink: 0 }}>
                              {unit.typeLabel} · {unit.employeeCount > 0 ? `${unit.employeeCount} موظف` : "—"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Save */}
                  <button
                    type="button"
                    disabled={!hasNewSelection || isSaving}
                    onClick={() => selectedUnit && onSave(selectedUnit)}
                    style={{
                      minHeight: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      borderRadius: 10, border: "1px solid rgba(139,92,246,0.40)", background: "rgba(139,92,246,0.14)", color: "#c4b5fd",
                      fontSize: 13, fontWeight: 700, cursor: (!hasNewSelection || isSaving) ? "not-allowed" : "pointer",
                      opacity: (!hasNewSelection || isSaving) ? 0.5 : 1,
                    }}
                  >
                    {isSaving ? "جارٍ الحفظ..." : room.isUnassigned ? "ربط المكتب وتشغيله" : "حفظ الربط"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Read-only notice for non-managers */}
          {!isManager && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center", padding: "4px 0" }}>
              ليست لديك صلاحية إدارة المكتب.
            </p>
          )}

          {/* Unlink confirmation inline */}
          {showResetConfirm && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(239,68,68,0.28)", background: "rgba(239,68,68,0.07)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#fecaca", lineHeight: 1.65 }}>
                هل تريد إلغاء ارتباط هذا المكتب؟ سيتم فك الربط فقط دون حذف أي بيانات.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { onReset(); setShowResetConfirm(false); }}
                  style={{ flex: 1, minHeight: 34, borderRadius: 10, border: "1px solid rgba(239,68,68,0.40)", background: "rgba(239,68,68,0.14)", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  تأكيد إلغاء الارتباط
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  style={{ flex: 1, minHeight: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 12, cursor: "pointer" }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isManager && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onToggleOpen(!isOpen)}
                  style={{
                    flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12,
                    border: isOpen ? "1px solid rgba(239,68,68,0.30)" : "1px solid rgba(16,185,129,0.30)",
                    background: isOpen ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                    color: isOpen ? "#fca5a5" : "#6ee7b7",
                    fontSize: 13, fontWeight: 600,
                    cursor: !isUpdating ? "pointer" : "not-allowed",
                    opacity: !isUpdating ? 1 : 0.5,
                  }}
                >
                  {isOpen ? <Archive size={14} /> : <DoorOpen size={14} />}
                  {isUpdating ? "جارٍ..." : isOpen ? "إغلاق المكتب" : "فتح المكتب"}
                </button>
                {mappingSource === "saved" && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    style={{
                      minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      borderRadius: 12, border: "1px solid rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.06)", color: "#fbbf24",
                      fontSize: 13, fontWeight: 600, padding: "0 14px", cursor: "pointer",
                    }}
                  >
                    <X size={13} />
                    إلغاء ارتباط المكتب
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 13, cursor: "pointer", padding: "0 16px" }}
            >
              إغلاق
            </button>
          </div>
          {isManager && !showResetConfirm && (
            <p style={{ margin: 0, fontSize: 10, color: "#2a4060", textAlign: "center" }}>
              أنت تتحكم بهذا المكتب من هنا.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
