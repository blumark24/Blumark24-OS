"use client";

// OfficeControlModal — C14-M3: Unified Smart Office Console
// One modal shell for all 9 offices. Layout is always identical.
// Only data and available actions change per office state.

import { useState } from "react";
import {
  X, Users, CheckCircle2, DoorOpen, Archive,
  MapPin, ChevronDown, ChevronUp, Building2,
} from "lucide-react";
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 90,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16,
  background: "rgba(2,6,18,0.80)",
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

const SECTION_CARD: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.03)",
  padding: "10px 14px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10, color: "#4a6a8a", marginBottom: 4, fontWeight: 600,
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ room, isOpen }: { room: OfficeRoom; isOpen: boolean }) {
  if (room.isCenter) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", border: "1px solid rgba(139,92,246,0.40)", background: "rgba(139,92,246,0.12)", color: "#c4b5fd", fontSize: 11, fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }} />
        مكتب مجلس الإدارة
      </span>
    );
  }
  if (room.isUnassigned) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", border: "1px solid rgba(245,158,11,0.40)", background: "rgba(245,158,11,0.10)", color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 5px #f59e0b" }} />
        جاهز للتشغيل
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", border: isOpen ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(100,116,139,0.30)", background: isOpen ? "rgba(16,185,129,0.10)" : "rgba(100,116,139,0.08)", color: isOpen ? "#6ee7b7" : "#94a3b8", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? "#10b981" : "#64748b", boxShadow: isOpen ? "0 0 6px #10b981" : undefined }} />
      {isOpen ? "مرتبط ومفتوح" : "مرتبط ومغلق"}
    </span>
  );
}

// ─── Smart insight row ────────────────────────────────────────────────────────

function OfficeInsight({ room, isOpen }: { room: OfficeRoom; isOpen: boolean }) {
  let text: string;
  if (room.isCenter) text = "هذا مكتب مجلس الإدارة لمتابعة تشغيل المكاتب.";
  else if (room.isUnassigned) text = "هذا المكتب غير مخصص وجاهز للربط وتشغيله.";
  else if (!isOpen) text = "هذا المكتب مغلق ويمكن إعادة فتحه في أي وقت.";
  else text = "هذا المكتب مرتبط ويعمل حالياً.";

  return (
    <div style={{ ...SECTION_CARD, border: "1px solid rgba(34,211,238,0.10)", background: "rgba(34,211,238,0.04)", display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>💡</span>
      <span style={{ fontSize: 11, color: "#6b87ab", lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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

  const selectedUnit    = units.find((u) => u.id === selectedUnitId) ?? null;
  const hasNewSelection = selectedUnit && selectedUnit.id !== (mappingUnit?.id ?? "");

  const sourceTag =
    mappingSource === "saved" ? " · محفوظ" :
    mappingSource === "auto"  ? " · تلقائي" : "";

  // ─── Subtitle ────────────────────────────────────────────────────────────────
  const subtitle = room.isCenter
    ? "مركز التحكم التشغيلي للمنشأة"
    : room.isUnassigned
    ? "مكتب غير مخصص · جاهز للتشغيل"
    : `${room.name} · ${isOpen ? "مفتوح" : "مغلق"}`;

  // ─── Type badge ──────────────────────────────────────────────────────────────
  const typeLabel = room.isCenter
    ? "مجلس الإدارة"
    : room.isAI
    ? "مكتب الذكاء الاصطناعي"
    : room.type ?? "مساحة عمل";

  const typeAccent = room.isCenter ? "#a855f7" : room.isAI ? "#22d3ee" : (room.accentColor ?? "#22d3ee");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`وحدة تحكم ${label}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={OVERLAY}
    >
      <div style={MODAL} dir="rtl">

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Badge row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
              <span style={{ borderRadius: 999, border: `1px solid ${typeAccent}40`, background: `${typeAccent}12`, color: typeAccent, fontSize: 11, fontWeight: 800, padding: "3px 10px", flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 10, fontWeight: 600, padding: "3px 9px", flexShrink: 0 }}>
                {typeLabel}
              </span>
              <StatusBadge room={room} isOpen={isOpen} />
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
              إدارة المكتب
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6b87ab", fontSize: 12, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={CLOSE_BTN}>
            <X size={16} />
          </button>
        </div>

        {/* ══ BODY ════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* 1 ── حالة المكتب (smart insight) */}
          <OfficeInsight room={room} isOpen={isOpen} />

          {/* 2 ── الارتباط الإداري */}
          <div style={{ ...SECTION_CARD, border: "1px solid rgba(34,211,238,0.12)", background: "rgba(34,211,238,0.04)" }}>
            <div style={SECTION_LABEL}>الارتباط الإداري{sourceTag}</div>
            {room.isCenter ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>مركز التحكم</div>
            ) : mappingUnit ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#dff7ff" }}>{mappingUnit.name}</div>
                <div style={{ fontSize: 11, color: "#6b87ab", marginTop: 2 }}>{mappingUnit.typeLabel}</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>غير مخصص</div>
            )}
          </div>

          {/* 3 ── المدير */}
          <div style={SECTION_CARD}>
            <div style={SECTION_LABEL}>المدير المسؤول</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: managerName ? "#c0d4ee" : "#64748b", fontStyle: managerName ? "normal" : "italic" }}>
              {managerName ?? "غير متاح"}
            </div>
          </div>

          {/* 4 ── الموظفون + المهام */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { Icon: Users,        color: "#22d3ee", label: "الموظفون", value: room.isCenter ? (boardStats?.totalOffices ?? 0) : room.employeeCount, emptyLabel: "لا يوجد موظفون" },
              { Icon: CheckCircle2, color: "#10b981", label: "المهام",   value: room.isCenter ? (boardStats ? boardStats.openCount + boardStats.closedCount : 0) : room.openTasks,   emptyLabel: "لا توجد مهام"     },
            ].map(({ Icon, color, label: l, value, emptyLabel }) => (
              <div key={l} style={{ ...SECTION_CARD, textAlign: "center" }}>
                <Icon size={13} color={color} style={{ marginBottom: 4 }} />
                {value > 0 ? (
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</div>
                ) : (
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>{emptyLabel}</div>
                )}
                <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* ── Board-specific stats ── */}
          {room.isCenter && boardStats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {([
                { label: "المكاتب",          value: boardStats.totalOffices,          color: "#22d3ee" },
                { label: "مرتبطة",           value: boardStats.linkedOfficeCount,     color: "#10b981" },
                { label: "جاهزة للتشغيل",   value: boardStats.unassignedOfficeCount, color: "#f59e0b" },
              ] as const).map(({ label: l, value, color }) => (
                <div key={l} style={{ ...SECTION_CARD, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#6b87ab", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* 5 ── إجراءات المكتب: assignment section (manager only, non-board) */}
          {isManager && !room.isCenter && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(139,92,246,0.22)", background: "rgba(139,92,246,0.05)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setAssignOpen((v) => !v)}
                aria-expanded={assignOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "start" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>
                  <MapPin size={14} color="#a855f7" />
                  {room.isUnassigned ? "ربط المكتب وتشغيله" : "تغيير الربط"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: "#6b87ab", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mappingUnit?.name ?? "غير مخصص"}
                  </span>
                  {assignOpen
                    ? <ChevronUp   size={14} color="#8ba3c7" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={14} color="#8ba3c7" style={{ flexShrink: 0 }} />
                  }
                </span>
              </button>

              {assignOpen && (
                <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#6b87ab", lineHeight: 1.5 }}>
                    {room.isUnassigned
                      ? "اختر إدارة أو قسم أو فريق لتشغيل هذا المكتب."
                      : "اختر إدارة أو قسم أو فريق لتغيير ربط هذا المكتب."}
                  </p>

                  {/* نوع الربط */}
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

                  {/* اختيار الجهة */}
                  {filteredUnits.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center", padding: "8px 0" }}>
                      لا توجد إدارات أو أقسام متاحة حالياً.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
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

                  {/* حفظ الربط */}
                  <button
                    type="button"
                    disabled={!hasNewSelection || isSaving}
                    onClick={() => selectedUnit && onSave(selectedUnit)}
                    style={{
                      minHeight: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      borderRadius: 10, border: "1px solid rgba(139,92,246,0.40)", background: "rgba(139,92,246,0.14)", color: "#c4b5fd",
                      fontSize: 13, fontWeight: 700,
                      cursor: (!hasNewSelection || isSaving) ? "not-allowed" : "pointer",
                      opacity: (!hasNewSelection || isSaving) ? 0.5 : 1,
                    }}
                  >
                    {isSaving ? "جارٍ الحفظ..." : room.isUnassigned ? "ربط المكتب وتشغيله" : "حفظ الربط"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Read-only notice */}
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

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

            {/* Board actions */}
            {room.isCenter && isManager && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onOpenAll}
                  style={{ flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(16,185,129,0.30)", background: "rgba(16,185,129,0.08)", color: "#6ee7b7", fontSize: 13, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer", opacity: isUpdating ? 0.4 : 1 }}
                >
                  <DoorOpen size={14} />
                  {isUpdating ? "جارٍ..." : "فتح جميع المكاتب"}
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onCloseAll}
                  style={{ flex: 1, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(239,68,68,0.30)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer", opacity: isUpdating ? 0.4 : 1 }}
                >
                  <Archive size={14} />
                  {isUpdating ? "جارٍ..." : "إغلاق جميع المكاتب"}
                </button>
              </>
            )}

            {/* Normal office: open/close toggle */}
            {!room.isCenter && isManager && (
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
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.5 : 1,
                }}
              >
                {isOpen ? <Archive size={14} /> : <DoorOpen size={14} />}
                {isUpdating ? "جارٍ..." : isOpen ? "إغلاق المكتب" : "فتح المكتب"}
              </button>
            )}

            {/* Unlink button (linked offices with saved mapping only) */}
            {!room.isCenter && isManager && mappingSource === "saved" && !showResetConfirm && (
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

            {/* Board: review unassigned */}
            {room.isCenter && boardStats && boardStats.unassignedOfficeCount > 0 && isManager && (
              <button
                type="button"
                onClick={onReviewUnassigned}
                style={{ width: "100%", minHeight: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, border: "1px solid rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.08)", color: "#fbbf24", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <Building2 size={13} />
                مراجعة المكاتب الجاهزة للتشغيل ({boardStats.unassignedOfficeCount})
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{ minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 13, cursor: "pointer", padding: "0 16px" }}
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
