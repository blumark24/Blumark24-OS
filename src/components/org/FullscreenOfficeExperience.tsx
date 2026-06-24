"use client";

// FullscreenOfficeExperience — C15.1
// Immersive fullscreen office entry for /virtual-office.
// Pure 2D premium interface — no WebGL, no 3D, no realtime.
// All presence/employee/task states are honest (غير متاح / غير مفعّل).

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";

// ─── Zone definitions ─────────────────────────────────────────────────────────

type ZoneState = "ready_after_link" | "needs_link" | "informational" | "command";

interface ZoneDef {
  id: string;
  name: string;
  type: string;
  purpose: string;
  state: ZoneState;
  stateLabel: string;
  accent: string;
  icon: string;
}

const BOARD_ZONES: ZoneDef[] = [
  {
    id: "board-chamber",
    name: "غرفة مجلس الإدارة",
    type: "غرفة تنفيذية",
    purpose: "مخصصة لجلسات المجلس وقرارات الاستراتيجية.",
    state: "command",
    stateLabel: "جاهزة بعد ربط البيانات",
    accent: "#a855f7",
    icon: "⬡",
  },
  {
    id: "board-kpi",
    name: "غرفة مؤشرات الأداء",
    type: "لوحة تشغيل",
    purpose: "تعرض مؤشرات الأداء بعد ربط البيانات التشغيلية.",
    state: "informational",
    stateLabel: "غير مفعّل تشغيلياً",
    accent: "#f59e0b",
    icon: "◈",
  },
  {
    id: "board-dt",
    name: "غرفة التوأم الرقمي",
    type: "تشغيل تحليلي",
    purpose: "تعكس حالة المكاتب والوحدات التشغيلية بصرياً.",
    state: "informational",
    stateLabel: "جاهز بعد ربط المكاتب",
    accent: "#22d3ee",
    icon: "◎",
  },
  {
    id: "board-ai",
    name: "غرفة مساعد التشغيل",
    type: "ذكاء اصطناعي",
    purpose: "يدعم قراءة حالة المقر بعد توفر البيانات التشغيلية.",
    state: "informational",
    stateLabel: "غير مفعّل تشغيلياً",
    accent: "#a855f7",
    icon: "◉",
  },
];

function getOfficeZones(isLinked: boolean): ZoneDef[] {
  const state: ZoneState = isLinked ? "ready_after_link" : "needs_link";
  const stateLabel = isLinked ? "جاهزة بعد الربط" : "يحتاج تفعيل";
  return [
    {
      id: "zone-meeting",
      name: "غرفة اجتماع",
      type: "غرفة اجتماع",
      purpose: "مخصصة لاجتماعات الفريق داخل هذا المكتب.",
      state, stateLabel, accent: "#3b82f6", icon: "◷",
    },
    {
      id: "zone-workspace",
      name: "مساحة عمل",
      type: "مساحة عمل",
      purpose: "منطقة العمل اليومي للموظفين المرتبطين بهذا المكتب.",
      state, stateLabel, accent: "#22d3ee", icon: "▣",
    },
    {
      id: "zone-focus",
      name: "غرفة تركيز",
      type: "غرفة تركيز",
      purpose: "مخصصة للعمل الفردي والمهام التي تحتاج تركيزاً عالياً.",
      state, stateLabel, accent: "#10b981", icon: "◈",
    },
    {
      id: "zone-waiting",
      name: "منطقة انتظار",
      type: "منطقة استقبال",
      purpose: "مخصصة للزوار والمراجعين قبل الدخول للمكتب.",
      state, stateLabel, accent: "#8b5cf6", icon: "◻",
    },
  ];
}

// ─── Zone colors ──────────────────────────────────────────────────────────────

function zoneColors(state: ZoneState, accent: string) {
  if (state === "command") {
    return {
      border: `${accent}50`,
      bg: `${accent}14`,
      dotColor: accent,
      labelColor: `${accent}cc`,
      stateBg: `${accent}1a`,
    };
  }
  if (state === "ready_after_link") {
    return {
      border: "rgba(245,158,11,0.30)",
      bg: "rgba(245,158,11,0.06)",
      dotColor: "#f59e0b",
      labelColor: "#fbbf24",
      stateBg: "rgba(245,158,11,0.10)",
    };
  }
  if (state === "informational") {
    return {
      border: `${accent}30`,
      bg: `${accent}08`,
      dotColor: accent,
      labelColor: `${accent}cc`,
      stateBg: `${accent}12`,
    };
  }
  // needs_link
  return {
    border: "rgba(100,116,139,0.22)",
    bg: "rgba(100,116,139,0.05)",
    dotColor: "#64748b",
    labelColor: "#94a3b8",
    stateBg: "rgba(100,116,139,0.10)",
  };
}

// ─── Zone card ────────────────────────────────────────────────────────────────

function ZoneCard({
  zone, selected, onSelect,
}: {
  zone: ZoneDef;
  selected: boolean;
  onSelect: (z: ZoneDef) => void;
}) {
  const c = zoneColors(zone.state, zone.accent);
  return (
    <button
      type="button"
      onClick={() => onSelect(zone)}
      style={{
        textAlign: "right",
        borderRadius: 16,
        padding: "14px 16px",
        border: selected ? `1.5px solid ${zone.accent}80` : `1px solid ${c.border}`,
        background: selected ? `${zone.accent}14` : c.bg,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "border-color 0.1s ease, background-color 0.1s ease, box-shadow 0.1s ease",
        boxShadow: selected ? `0 0 20px ${zone.accent}20, inset 0 0 0 1px ${zone.accent}18` : "none",
        width: "100%",
        minHeight: 90,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: selected ? "#fff" : "#c8daf0", lineHeight: 1.2, marginBottom: 3 }}>
            {zone.name}
          </div>
          <div style={{ fontSize: 10, color: "#5a7a9a", fontWeight: 500 }}>{zone.type}</div>
        </div>
        <span style={{
          fontSize: 18,
          color: zone.accent,
          opacity: selected ? 1 : 0.6,
          flexShrink: 0,
          lineHeight: 1,
        }}>{zone.icon}</span>
      </div>

      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        background: c.stateBg,
        alignSelf: "flex-start",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 9.5, color: c.labelColor, fontWeight: 700 }}>{zone.stateLabel}</span>
      </div>
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ZoneDetailPanel({
  zone, officeName, people,
}: {
  zone: ZoneDef | null;
  officeName: string;
  people: PresencePerson[];
}) {
  if (!zone) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#2a4462", textAlign: "center" }}>
          اختر منطقة عمل لعرض تفاصيلها
        </p>
      </div>
    );
  }

  const c = zoneColors(zone.state, zone.accent);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px" }}>
      {/* Zone title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22, color: zone.accent }}>{zone.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#dff7ff" }}>{zone.name}</div>
          <div style={{ fontSize: 10, color: "#5a7a9a" }}>{zone.type}</div>
        </div>
        <div style={{ marginRight: "auto", display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: c.stateBg, border: `1px solid ${c.border}` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: c.labelColor, fontWeight: 700 }}>{zone.stateLabel}</span>
        </div>
      </div>

      {/* Purpose */}
      <p style={{ margin: 0, fontSize: 11, color: "#7a9abc", lineHeight: 1.6 }}>{zone.purpose}</p>

      {/* Data grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {[
          { label: "المكتب", value: officeName, highlight: false },
          { label: "الموظفون", value: people.length > 0 ? `${people.length}` : "غير متاح", highlight: people.length > 0 },
          { label: "الاجتماع", value: "غير مفعّل", highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{
            borderRadius: 9, padding: "6px 8px",
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: 8.5, color: "#2a4a6a", fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 10.5, color: highlight ? "#7ab4d4" : "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Honest note */}
      <p style={{ margin: 0, fontSize: 9, color: "#1e3050", lineHeight: 1.4 }}>
        يتم تفعيل بيانات الغرفة بعد ربط الموظفين والمهام.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface FullscreenOfficeExperienceProps {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  officePeople: PresencePerson[];
  onClose: () => void;
}

export default function FullscreenOfficeExperience({
  room, mappingUnit, officePeople, onClose,
}: FullscreenOfficeExperienceProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneDef | null>(null);

  const zones = room.isCenter ? BOARD_ZONES : getOfficeZones(!room.isUnassigned && !room.isCenter);

  const officeName = room.isCenter
    ? "مكتب مجلس الإدارة"
    : mappingUnit?.name ?? room.name ?? "مكتب";

  const officeSubtitle = room.isCenter
    ? "مركز قيادة مجلس الإدارة"
    : room.isUnassigned
    ? "مكتب غير مخصص · جاهز للتشغيل"
    : mappingUnit?.name ?? "مرتبط";

  const statusBadge = room.isCenter
    ? { label: "مجلس الإدارة", color: "#a855f7", bg: "rgba(168,85,247,0.14)", border: "rgba(168,85,247,0.40)" }
    : room.isUnassigned
    ? { label: "يحتاج ربط", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" }
    : { label: "مرتبط", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`المكتب الافتراضي — ${officeName}`}
      style={{
        position: "fixed", inset: 0, zIndex: 110,
        display: "flex", flexDirection: "column",
        background: "linear-gradient(175deg, rgba(3,8,22,0.99) 0%, rgba(5,12,30,0.99) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        overflowY: "auto",
      }}
      dir="rtl"
    >

      {/* ── TOP COMMAND BAR ──────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}>
        {/* Back button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none", cursor: "pointer",
            color: "#8ba3c7", fontSize: 12, fontWeight: 600,
            padding: "5px 0",
            flexShrink: 0,
          }}
        >
          <ArrowRight size={14} />
          العودة للمقر
        </button>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Office identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {officeName}
          </div>
          <div style={{ fontSize: 9.5, color: "#3a5570" }}>{officeSubtitle}</div>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            border: `1px solid ${statusBadge.border}`,
            background: statusBadge.bg,
            color: statusBadge.color,
          }}>{statusBadge.label}</span>
          <span style={{
            fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            border: "1px solid rgba(100,116,139,0.22)",
            background: "rgba(100,116,139,0.06)",
            color: "#64748b",
          }}>الحضور: غير مفعّل</span>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          style={{
            width: 32, height: 32, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#8ba3c7",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── MAIN WORKSPACE AREA ─────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>

        {/* Floor plan area */}
        <div style={{
          flex: 1,
          padding: "16px",
          // Subtle floor plan grid background
          backgroundImage: [
            "linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "36px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>

          {/* Office type label */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 4, height: 16, borderRadius: 2, background: room.isCenter ? "#a855f7" : "#22d3ee", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2a4462" }}>
              {room.isCenter ? "غرف القيادة والتحكم" : "مناطق ومساحات العمل"}
            </span>
            <span style={{ fontSize: 9, color: "#1e3050" }}>· {zones.length} مناطق</span>
          </div>

          {/* Zone grid — 2 columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}>
            {zones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                selected={selectedZone?.id === zone.id}
                onSelect={setSelectedZone}
              />
            ))}
          </div>

          {/* Presence honest state row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(100,116,139,0.15)",
            background: "rgba(100,116,139,0.04)",
            marginTop: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#3a5570", flex: 1 }}>
              الموظفون: {officePeople.length > 0 ? `${officePeople.length} موظف` : "غير متاح"}
              {" · "}
              حالة الحضور: غير مفعّلة
              {" · "}
              الاجتماعات: غير مفعّلة
            </span>
          </div>
        </div>

        {/* ── ZONE DETAIL PANEL (bottom) ─────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${selectedZone ? `${selectedZone.accent}25` : "rgba(255,255,255,0.05)"}`,
          background: selectedZone
            ? `linear-gradient(180deg, ${selectedZone.accent}06 0%, rgba(0,0,0,0.30) 100%)`
            : "rgba(0,0,0,0.22)",
          transition: "border-color 0.12s ease, background 0.12s ease",
          minHeight: 80,
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}>
          <ZoneDetailPanel
            zone={selectedZone}
            officeName={officeName}
            people={officePeople}
          />
        </div>

      </div>
    </div>
  );
}
