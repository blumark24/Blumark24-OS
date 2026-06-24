"use client";

// OfficeControlModal — C14-M3: Unified Smart Office Console
// One modal shell for all 9 offices. Layout is always identical.
// Only data and available actions change per office state.

import { useState, useEffect } from "react";
import {
  X, Users, CheckCircle2, DoorOpen, Archive,
  MapPin, ChevronDown, ChevronUp, Building2, GitMerge, BrainCircuit,
} from "lucide-react";
import type { OfficeRoom, MappingSource, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";
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
  officePeople?: PresencePerson[];
  isSaving: boolean;
  isUpdating: boolean;
  boardStats?: BoardOfficeStats | null;
  onClose: () => void;
  onEnterOffice?: () => void;
  onSave: (unit: PreviewOrgUnit) => void;
  onToggleOpen: (is_open: boolean) => void;
  onReset: () => void;
  onOpenAll?: () => void;
  onCloseAll?: () => void;
  onReviewUnassigned?: () => void;
  onResetVirtualOffice?: () => void;
  isResettingOffice?: boolean;
  resetOfficeError?: string | null;
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
  padding: "16px 14px",
  background: "rgba(1,4,14,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overscrollBehavior: "contain",
};

const MODAL: React.CSSProperties = {
  width: "min(430px, 100%)",
  maxHeight: "78dvh",
  borderRadius: 24,
  background: "linear-gradient(160deg, rgba(6,10,28,0.99) 0%, rgba(8,14,36,0.99) 100%)",
  border: "1px solid rgba(139,92,246,0.22)",
  boxShadow: "0 28px 70px rgba(0,0,0,0.70), 0 0 0 1px rgba(139,92,246,0.08) inset, 0 0 60px rgba(139,92,246,0.06)",
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
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.03)",
  padding: "8px 12px",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9.5, color: "#4a6a8a", marginBottom: 3, fontWeight: 600,
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
    <div style={{ ...SECTION_CARD, border: "1px solid rgba(34,211,238,0.08)", background: "rgba(34,211,238,0.03)" }}>
      <span style={{ fontSize: 10.5, color: "#5a7a9a", lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function OfficeControlModal({
  room, roomState, isManager, mappingUnit, mappingSource,
  managerName, units, officePeople = [], isSaving, isUpdating, boardStats,
  onClose, onEnterOffice, onSave, onToggleOpen, onReset,
  onOpenAll, onCloseAll, onReviewUnassigned,
  onResetVirtualOffice, isResettingOffice, resetOfficeError,
}: OfficeControlModalProps) {
  const [selectedUnitId, setSelectedUnitId] = useState(mappingUnit?.id ?? "");
  const [typeFilter, setTypeFilter]         = useState<TypeFilter>("all");
  const [assignOpen, setAssignOpen]         = useState(room.isUnassigned);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOfficeResetConfirm, setShowOfficeResetConfirm] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

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
        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Badge row */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
              <span style={{ borderRadius: 999, border: `1px solid ${typeAccent}40`, background: `${typeAccent}12`, color: typeAccent, fontSize: 10, fontWeight: 800, padding: "2px 8px", flexShrink: 0 }}>
                {label}
              </span>
              <StatusBadge room={room} isOpen={isOpen} />
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>
              {subtitle}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={{ ...CLOSE_BTN, width: 30, height: 30, borderRadius: 10 }}>
            <X size={14} />
          </button>
        </div>

        {/* ══ BODY ════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8, overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>

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

          {/* 4 ── Metrics row */}
          {!room.isCenter ? (
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { Icon: Users,        color: "#22d3ee", label: "الموظفون", value: room.employeeCount, emptyLabel: "لا يوجد" },
                { Icon: CheckCircle2, color: "#10b981", label: "المهام",   value: room.openTasks,     emptyLabel: "لا توجد"  },
              ].map(({ Icon, color, label: l, value, emptyLabel }) => (
                <div key={l} style={{ ...SECTION_CARD, flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={12} color={color} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: value > 0 ? 14 : 10, fontWeight: 700, color: value > 0 ? "#fff" : "#64748b", lineHeight: 1 }}>
                      {value > 0 ? value : emptyLabel}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6b87ab", marginTop: 2 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : boardStats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {([
                { label: "المكاتب",        value: boardStats.totalOffices,          color: "#22d3ee" },
                { label: "مرتبطة",         value: boardStats.linkedOfficeCount,     color: "#10b981" },
                { label: "جاهزة للتشغيل", value: boardStats.unassignedOfficeCount, color: "#f59e0b" },
              ] as const).map(({ label: l, value, color }) => (
                <div key={l} style={{ ...SECTION_CARD, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9.5, color: "#6b87ab", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* 4b ── مساحات العمل — compact summary — C15.1 */}
          <div style={{
            ...SECTION_CARD,
            border: "1px solid rgba(34,211,238,0.10)",
            background: "rgba(34,211,238,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 12px",
          }}>
            <div>
              <div style={SECTION_LABEL}>
                {room.isCenter ? "غرف القيادة" : "مساحات العمل والغرف"}
              </div>
              <div style={{ fontSize: 11, color: "#5a7a9a", fontWeight: 600 }}>
                {room.isCenter ? "4 غرف تحكم" : "4 مناطق عمل"}
                {" · "}
                <span style={{ color: "#1e3050" }}>
                  {room.isCenter ? "جاهزة بعد ربط البيانات" : room.isUnassigned ? "يحتاج تفعيل" : "جاهزة بعد الربط"}
                </span>
              </div>
            </div>
            {onEnterOffice && (
              <button
                type="button"
                onClick={onEnterOffice}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 10, flexShrink: 0,
                  border: "1px solid rgba(34,211,238,0.35)",
                  background: "rgba(34,211,238,0.08)",
                  color: "#22d3ee", fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                دخول المكتب
              </button>
            )}
          </div>

          {/* 5 ── الموظفون في المكتب — C14-M7 */}
          {!room.isCenter && !room.isUnassigned && (
            <div style={{ ...SECTION_CARD, border: "1px solid rgba(168,85,247,0.10)", background: "rgba(168,85,247,0.03)" }}>
              <div style={{ ...SECTION_LABEL, marginBottom: 6 }}>الموظفون في المكتب</div>
              {officePeople.length === 0 ? (
                <p style={{ margin: 0, fontSize: 11, color: "#4a6a8a", fontStyle: "italic" }}>لا يوجد موظفون مرتبطون</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
                  {officePeople.map((person) => (
                    <div key={person.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${person.color}22`, border: `1px solid ${person.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9.5, fontWeight: 800, color: person.color }}>
                        {person.initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#c0d4ee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</p>
                        {person.roleOrUnit && <p style={{ margin: 0, fontSize: 9.5, color: "#4a6a8a" }}>{person.roleOrUnit}</p>}
                      </div>
                      {/* Honest presence — always gray/unavailable */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", flexShrink: 0 }} />
                        <span style={{ fontSize: 9.5, color: "#475569" }}>غير متاح</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ margin: "6px 0 0", fontSize: 9.5, color: "#2a4462", lineHeight: 1.4 }}>
                حالة الحضور تحتاج تفعيل تتبع النشاط
              </p>
            </div>
          )}

          {/* 5b-i ── Board: Digital Twin — C14-M7.2 */}
          {room.isCenter && (
            <div style={{ ...SECTION_CARD, border: "1px solid rgba(34,211,238,0.10)", background: "rgba(34,211,238,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <GitMerge size={12} color="#22d3ee" />
                <div style={{ ...SECTION_LABEL, marginBottom: 0 }}>التوأم الرقمي</div>
              </div>
              <p style={{ margin: 0, fontSize: 10.5, color: "#4a6a8a", lineHeight: 1.5 }}>
                يعكس ارتباط المكاتب بالهيكل الإداري والفرق والمهام.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 9.5, color: "#1e3050" }}>
                الحالة: جاهز بعد ربط المكاتب
              </p>
            </div>
          )}

          {/* 5b-ii ── Board: AI assistant — C14-M7.2 */}
          {room.isCenter && (
            <div style={{ ...SECTION_CARD, border: "1px solid rgba(168,85,247,0.10)", background: "rgba(168,85,247,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <BrainCircuit size={12} color="#a855f7" />
                <div style={{ ...SECTION_LABEL, marginBottom: 0 }}>مساعد تشغيل المقر</div>
              </div>
              <p style={{ margin: 0, fontSize: 10.5, color: "#4a4a8a", lineHeight: 1.5 }}>
                يدعم قراءة حالة المقر واقتراح الخطوات التالية بعد توفر البيانات.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 9.5, color: "#1e1e40" }}>
                الحالة: غير مفعّل تشغيلياً
              </p>
            </div>
          )}

          {/* 5b-iii ── Board roadmap — C14-M7 */}
          {room.isCenter && (
            <div style={{ ...SECTION_CARD, border: "1px solid rgba(139,92,246,0.12)", background: "rgba(139,92,246,0.03)" }}>
              <div style={{ ...SECTION_LABEL, marginBottom: 6 }}>خارطة طريق التفعيل</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {([
                  { label: "Cloud Office Command UI",  ar: "واجهة مقر سحابي",        chip: "الآن",  active: true },
                  { label: "Office data linking",       ar: "ربط البيانات الإدارية",  chip: "قادم",  active: false },
                  { label: "Real presence tracking",    ar: "تتبع الحضور الحقيقي",   chip: "قادم",  active: false },
                  { label: "Avatars & visual effects",  ar: "صور شخصية وتأثيرات",    chip: "قادم",  active: false },
                  { label: "Meetings + audio/video",    ar: "اجتماعات وصوت/فيديو",   chip: "قادم",  active: false },
                ] as const).map(({ label, ar, chip, active }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 10.5, color: active ? "#c4b5fd" : "#4a6a8a", fontWeight: active ? 700 : 500 }}>{ar}</span>
                      <span style={{ fontSize: 9, color: "#2a4462", marginRight: 5 }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, flexShrink: 0, border: active ? "1px solid rgba(139,92,246,0.45)" : "1px solid rgba(100,116,139,0.22)", background: active ? "rgba(139,92,246,0.16)" : "rgba(100,116,139,0.06)", color: active ? "#c4b5fd" : "#4a6a8a" }}>
                      {chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6 ── إجراءات المكتب: assignment section (manager only, non-board) */}
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
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b", textAlign: "center", padding: "6px 0" }}>
                      لا توجد إدارات أو أقسام متاحة.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto" }}>
                      {filteredUnits.map((unit) => {
                        const sel = unit.id === selectedUnitId;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => setSelectedUnitId(unit.id)}
                            style={{
                              width: "100%", textAlign: "right", borderRadius: 9,
                              border: sel ? "1px solid rgba(139,92,246,0.55)" : "1px solid rgba(255,255,255,0.07)",
                              background: sel ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                              padding: "6px 9px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
                            }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 700, color: sel ? "#e9d5ff" : "#c0d4ee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {unit.name}
                            </span>
                            <span style={{ fontSize: 9.5, color: "#6b87ab", flexShrink: 0 }}>
                              {unit.typeLabel}
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
                      minHeight: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      borderRadius: 12,
                      border: hasNewSelection && !isSaving
                        ? "1px solid rgba(139,92,246,0.60)"
                        : "1px solid rgba(139,92,246,0.25)",
                      background: hasNewSelection && !isSaving
                        ? "linear-gradient(135deg, rgba(139,92,246,0.30), rgba(168,85,247,0.20))"
                        : "rgba(139,92,246,0.08)",
                      color: hasNewSelection && !isSaving ? "#e9d5ff" : "#7c6aa0",
                      fontSize: 13, fontWeight: 800,
                      cursor: (!hasNewSelection || isSaving) ? "not-allowed" : "pointer",
                      boxShadow: hasNewSelection && !isSaving ? "0 0 16px rgba(139,92,246,0.25)" : "none",
                      transition: "all 0.15s ease",
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
        <div style={{ padding: "10px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>

            {/* Board actions */}
            {room.isCenter && isManager && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onOpenAll}
                  style={{ flex: 1, minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, border: "1px solid rgba(16,185,129,0.30)", background: "rgba(16,185,129,0.08)", color: "#6ee7b7", fontSize: 12, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer", opacity: isUpdating ? 0.4 : 1 }}
                >
                  <DoorOpen size={13} />
                  {isUpdating ? "جارٍ..." : "فتح الجميع"}
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onCloseAll}
                  style={{ flex: 1, minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, border: "1px solid rgba(239,68,68,0.30)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer", opacity: isUpdating ? 0.4 : 1 }}
                >
                  <Archive size={13} />
                  {isUpdating ? "جارٍ..." : "إغلاق الجميع"}
                </button>
              </>
            )}

            {/* Normal office: open/close toggle — only for linked offices */}
            {!room.isCenter && !room.isUnassigned && isManager && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onToggleOpen(!isOpen)}
                style={{
                  flex: 1, minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10,
                  border: isOpen ? "1px solid rgba(239,68,68,0.30)" : "1px solid rgba(16,185,129,0.30)",
                  background: isOpen ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                  color: isOpen ? "#fca5a5" : "#6ee7b7",
                  fontSize: 12, fontWeight: 600,
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.5 : 1,
                }}
              >
                {isOpen ? <Archive size={13} /> : <DoorOpen size={13} />}
                {isUpdating ? "جارٍ..." : isOpen ? "إغلاق المكتب" : "فتح المكتب"}
              </button>
            )}

            {/* Unlink button (linked offices with saved mapping only) */}
            {!room.isCenter && isManager && mappingSource === "saved" && !showResetConfirm && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                style={{
                  minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                  borderRadius: 10, border: "1px solid rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.06)", color: "#fbbf24",
                  fontSize: 12, fontWeight: 600, padding: "0 12px", cursor: "pointer",
                }}
              >
                <X size={12} />
                إلغاء الارتباط
              </button>
            )}

            {/* Board: review unassigned */}
            {room.isCenter && boardStats && boardStats.unassignedOfficeCount > 0 && isManager && (
              <button
                type="button"
                onClick={onReviewUnassigned}
                style={{ width: "100%", minHeight: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, border: "1px solid rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.08)", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                <Building2 size={12} />
                مراجعة المكاتب الجاهزة للتشغيل ({boardStats.unassignedOfficeCount})
              </button>
            )}

            {/* Board: reset virtual office */}
            {room.isCenter && isManager && !showOfficeResetConfirm && (
              <button
                type="button"
                disabled={isResettingOffice}
                onClick={() => setShowOfficeResetConfirm(true)}
                style={{ width: "100%", minHeight: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, border: "1px solid rgba(100,116,139,0.22)", background: "rgba(100,116,139,0.05)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: isResettingOffice ? "not-allowed" : "pointer", opacity: isResettingOffice ? 0.5 : 1 }}
              >
                {isResettingOffice ? "جارٍ إعادة الضبط..." : "إعادة ضبط المكتب الافتراضي"}
              </button>
            )}

            {/* Reset confirmation */}
            {room.isCenter && showOfficeResetConfirm && (
              <div style={{ borderRadius: 14, border: "1px solid rgba(100,116,139,0.28)", background: "rgba(15,20,35,0.95)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", lineHeight: 1.65, fontWeight: 600 }}>
                  هل تريد إعادة ضبط المكتب الافتراضي؟
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#6b87ab", lineHeight: 1.65 }}>
                  سيتم إلغاء ربط المكاتب فقط دون حذف أي بيانات. لن يتأثر أي موظف أو قسم أو مهمة.
                </p>
                {resetOfficeError && (
                  <p style={{ margin: 0, fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>{resetOfficeError}</p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={isResettingOffice}
                    onClick={() => { onResetVirtualOffice?.(); setShowOfficeResetConfirm(false); }}
                    style={{ flex: 1, minHeight: 36, borderRadius: 10, border: "1px solid rgba(100,116,139,0.40)", background: "rgba(100,116,139,0.12)", color: "#e2e8f0", fontSize: 12, fontWeight: 700, cursor: isResettingOffice ? "not-allowed" : "pointer", opacity: isResettingOffice ? 0.5 : 1 }}
                  >
                    {isResettingOffice ? "جارٍ..." : "تأكيد إعادة الضبط"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOfficeResetConfirm(false)}
                    style={{ flex: 1, minHeight: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 12, cursor: "pointer" }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {onEnterOffice && (
              <button
                type="button"
                onClick={onEnterOffice}
                style={{
                  flex: 1, minHeight: 38,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  borderRadius: 10,
                  border: "1px solid rgba(34,211,238,0.45)",
                  background: "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(30,111,217,0.12))",
                  color: "#22d3ee", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 0 16px rgba(34,211,238,0.12)",
                }}
              >
                دخول المكتب
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{ minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", fontSize: 12, cursor: "pointer", padding: "0 14px" }}
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
