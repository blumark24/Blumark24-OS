"use client";

// FullscreenOfficeExperience — C15.3
// Office Focus Entry: reuses the same 3D office map image, zooms/focuses on the
// selected office via CSS transform. Zone overlay chips cluster on the actual
// office area. No WebGL, no Three.js, no fake data, no new packages.

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const ZOOM = 2.15;

// ─── Office positions — mirrors MobileExecutiveOfficeScene CHIP_POSITIONS ─────
// Do NOT change these coordinates; they match the existing hotspot layout.
const OFFICE_POSITIONS: ReadonlyArray<{ left: number; top: number }> = [
  { left: 19, top: 79 }, // slot 0 → office 01
  { left: 20, top: 18 }, // slot 1 → office 02
  { left: 50, top: 18 }, // slot 2 → office 03
  { left: 19, top: 48 }, // slot 3 → office 04
  { left: 50, top: 48 }, // slot 4 → office 05 (board / مجلس الإدارة)
  { left: 82, top: 48 }, // slot 5 → office 06
  { left: 51, top: 80 }, // slot 6 → office 07
  { left: 82, top: 79 }, // slot 7 → office 08
  { left: 82, top: 18 }, // slot 8 → office 09
] as const;

// Zone chip offsets (px from office focal point in container coordinates)
const ZONE_CHIP_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: -72, y: -44 }, // zone 0: top-left
  { x:   8, y: -44 }, // zone 1: top-right
  { x: -72, y:   8 }, // zone 2: bottom-left
  { x:   8, y:   8 }, // zone 3: bottom-right
] as const;

// ─── Zone model ───────────────────────────────────────────────────────────────

type ZoneState = "ready_after_link" | "needs_link" | "informational" | "command";

interface ZoneDef {
  id: string;
  name: string;
  type: string;
  purpose: string;
  state: ZoneState;
  stateLabel: string;
  accent: string;
}

const BOARD_ZONES: ZoneDef[] = [
  { id: "board-chamber", name: "غرفة مجلس الإدارة",    type: "غرفة تنفيذية",    purpose: "مخصصة لجلسات المجلس وقرارات الاستراتيجية.",                   state: "command",       stateLabel: "جاهزة بعد ربط البيانات",  accent: "#a855f7" },
  { id: "board-kpi",     name: "غرفة مؤشرات الأداء",   type: "لوحة تشغيل",      purpose: "تعرض مؤشرات الأداء بعد ربط البيانات التشغيلية.",              state: "informational", stateLabel: "غير مفعّل تشغيلياً",       accent: "#f59e0b" },
  { id: "board-dt",      name: "غرفة التوأم الرقمي",    type: "تشغيل تحليلي",    purpose: "تعكس حالة المكاتب والوحدات التشغيلية بصرياً.",                state: "informational", stateLabel: "جاهز بعد ربط المكاتب",    accent: "#22d3ee" },
  { id: "board-ai",      name: "مساعد التشغيل الذكي",   type: "ذكاء اصطناعي",    purpose: "يدعم قراءة حالة المقر بعد توفر البيانات التشغيلية.",          state: "informational", stateLabel: "غير مفعّل تشغيلياً",       accent: "#a855f7" },
];

function getOfficeZones(isLinked: boolean): ZoneDef[] {
  const state: ZoneState = isLinked ? "ready_after_link" : "needs_link";
  const stateLabel = isLinked ? "جاهزة بعد الربط" : "يحتاج تفعيل";
  return [
    { id: "zone-meeting",   name: "غرفة اجتماع",   type: "غرفة اجتماع",   purpose: "مخصصة لاجتماعات الفريق داخل هذا المكتب.",               state, stateLabel, accent: "#3b82f6" },
    { id: "zone-workspace", name: "مساحة عمل",      type: "مساحة عمل",     purpose: "منطقة العمل اليومي للموظفين المرتبطين بهذا المكتب.",   state, stateLabel, accent: "#22d3ee" },
    { id: "zone-focus",     name: "غرفة تركيز",     type: "غرفة تركيز",    purpose: "مخصصة للعمل الفردي والمهام التي تحتاج تركيزاً عالياً.", state, stateLabel, accent: "#10b981" },
    { id: "zone-waiting",   name: "منطقة انتظار",  type: "منطقة استقبال", purpose: "مخصصة للزوار والمراجعين قبل الدخول للمكتب.",            state, stateLabel, accent: "#8b5cf6" },
  ];
}

// ─── Zone chip overlay ────────────────────────────────────────────────────────

function ZoneChip({ zone, selected, cx, cy, offset, onSelect }: {
  zone: ZoneDef;
  selected: boolean;
  cx: number;
  cy: number;
  offset: { x: number; y: number };
  onSelect: () => void;
}) {
  const dot =
    zone.state === "command" ? zone.accent
    : zone.state === "ready_after_link" ? "#f59e0b"
    : zone.state === "informational" ? zone.accent
    : "#64748b";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        position: "absolute",
        left: `calc(${cx}% + ${offset.x}px)`,
        top: `calc(${cy}% + ${offset.y}px)`,
        zIndex: 10,
        padding: "5px 10px",
        minHeight: 36, minWidth: 44,
        borderRadius: 20,
        border: selected ? `1.5px solid ${zone.accent}` : `1px solid ${zone.accent}55`,
        background: selected ? `${zone.accent}28` : "rgba(2,8,23,0.84)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: selected ? `0 0 18px ${zone.accent}44, 0 2px 8px rgba(0,0,0,0.55)` : "0 2px 8px rgba(0,0,0,0.55)",
        display: "inline-flex", alignItems: "center", gap: 5,
        cursor: "pointer",
        transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: selected ? `0 0 5px ${dot}` : undefined }} />
      <span style={{ fontSize: 9, fontWeight: 700, color: selected ? "#fff" : "#b0c4d8" }}>
        {zone.name}
      </span>
    </button>
  );
}

// ─── Zone detail panel ────────────────────────────────────────────────────────

function ZoneDetailPanel({ zone, officeName, people }: {
  zone: ZoneDef | null;
  officeName: string;
  people: PresencePerson[];
}) {
  if (!zone) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", minHeight: 64 }}>
        <p style={{ margin: 0, fontSize: 10.5, color: "#2a4462", textAlign: "center" }}>اضغط على منطقة عمل لعرض تفاصيلها</p>
      </div>
    );
  }

  const dot =
    zone.state === "command" ? zone.accent
    : zone.state === "ready_after_link" ? "#f59e0b"
    : zone.state === "informational" ? zone.accent
    : "#64748b";
  const dotLabel =
    zone.state === "command" ? zone.accent
    : zone.state === "ready_after_link" ? "#fbbf24"
    : zone.state === "informational" ? `${zone.accent}cc`
    : "#94a3b8";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px 16px" }}>
      {/* Zone header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}88` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{zone.name}</div>
          <div style={{ fontSize: 9, color: "#3a5570" }}>{zone.type}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, border: `1px solid ${dot}44`, background: `${dot}14`, color: dotLabel, flexShrink: 0 }}>
          {zone.stateLabel}
        </span>
      </div>

      {/* Purpose */}
      <p style={{ margin: 0, fontSize: 10, color: "#6a8aaa", lineHeight: 1.55 }}>{zone.purpose}</p>

      {/* Data grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
        {([
          { label: "المكتب",   value: officeName },
          { label: "الموظفون", value: people.length > 0 ? `${people.length}` : "غير متاح" },
          { label: "الاجتماع", value: "غير مفعّل" },
        ] as const).map(({ label, value }) => (
          <div key={label} style={{ borderRadius: 7, padding: "4px 7px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 7.5, color: "#2a4a6a", fontWeight: 600, marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 9.5, color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 8.5, color: "#1e3050", lineHeight: 1.4 }}>
        يتم تفعيل البيانات بعد ربط الموظفين والمهام بهذا المكتب.
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

  // Derive office focal point from slot index (officeNumber is 1-based)
  const slotIndex = Math.max(0, Math.min(8, (room.officeNumber ?? 5) - 1));
  const officePos = OFFICE_POSITIONS[slotIndex] ?? { left: 50, top: 50 };
  const cx = officePos.left; // % from left — focal point in the image
  const cy = officePos.top;  // % from top

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
    ? { label: "يحتاج ربط",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" }
    : { label: "مرتبط",        color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`المكتب الافتراضي — ${officeName}`}
      style={{
        position: "fixed", inset: 0, zIndex: 110,
        display: "flex", flexDirection: "column",
        background: "#030816",
        overflow: "hidden",
      }}
      dir="rtl"
    >

      {/* ── TOP COMMAND BAR ──────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        zIndex: 20,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none", cursor: "pointer",
            color: "#8ba3c7", fontSize: 12, fontWeight: 600, padding: "5px 0", flexShrink: 0,
          }}
        >
          <ArrowRight size={14} />
          العودة للمقر
        </button>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {officeName}
          </div>
          <div style={{ fontSize: 9.5, color: "#3a5570" }}>{officeSubtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, border: `1px solid ${statusBadge.border}`, background: statusBadge.bg, color: statusBadge.color }}>
            {statusBadge.label}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, border: "1px solid rgba(100,116,139,0.22)", background: "rgba(100,116,139,0.06)", color: "#64748b" }}>
            الحضور: غير مفعّل
          </span>
        </div>

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

      {/* ── OFFICE IMAGE FOCUS — main scene ──────────────────────────── */}
      {/*
        The same 3D office map image used on the main virtual-office page.
        A scale wrapper inside the container applies CSS zoom centered on
        the selected office's focal point (cx%, cy%). The outer container
        clips the overflow so only the focused area is visible.
        Zone chips and overlays are positioned in the outer (unscaled)
        coordinate space so they don't scale with the image.
      */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>

        {/* Scale wrapper — image zoomed around the selected office */}
        <div style={{
          position: "absolute", inset: 0,
          transformOrigin: `${cx}% ${cy}%`,
          transform: `scale(${ZOOM})`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGE_SRC}
            alt=""
            aria-hidden="true"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${cx}% ${cy}%`, display: "block" }}
          />
        </div>

        {/* Vignette — dims the map outside the focal office */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: `radial-gradient(ellipse 36% 30% at ${cx}% ${cy}%, transparent 0%, rgba(1,5,16,0.72) 100%)`,
        }} />

        {/* Focus ring around the selected office */}
        <div style={{
          position: "absolute",
          left: `calc(${cx}% - 52px)`,
          top: `calc(${cy}% - 38px)`,
          width: 104, height: 76,
          borderRadius: 16,
          border: `1.5px solid ${statusBadge.color}55`,
          boxShadow: `0 0 28px ${statusBadge.color}25, inset 0 0 14px ${statusBadge.color}08`,
          zIndex: 3, pointerEvents: "none",
        }} />

        {/* Office name pin above the focus ring */}
        <div style={{
          position: "absolute",
          left: `calc(${cx}% - 36px)`,
          top: `calc(${cy}% - 62px)`,
          zIndex: 5, pointerEvents: "none",
          fontSize: 8.5, fontWeight: 700, color: statusBadge.color,
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          padding: "2px 8px", borderRadius: 8,
          border: `1px solid ${statusBadge.color}35`,
          whiteSpace: "nowrap",
        }}>
          {officeName}
        </div>

        {/* Zone chips — 4 chips clustered around the focal office */}
        {zones.map((zone, i) => {
          const offset = ZONE_CHIP_OFFSETS[i] ?? { x: 0, y: 0 };
          return (
            <ZoneChip
              key={zone.id}
              zone={zone}
              selected={selectedZone?.id === zone.id}
              cx={cx}
              cy={cy}
              offset={offset}
              onSelect={() => setSelectedZone(prev => prev?.id === zone.id ? null : zone)}
            />
          );
        })}
      </div>

      {/* ── ZONE DETAIL PANEL — bottom ────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${selectedZone ? `${selectedZone.accent}28` : "rgba(255,255,255,0.05)"}`,
        background: selectedZone
          ? `linear-gradient(180deg, ${selectedZone.accent}08 0%, rgba(0,0,0,0.45) 100%)`
          : "rgba(0,0,0,0.45)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "border-color 0.12s, background 0.12s",
        minHeight: 88,
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        zIndex: 20,
      }}>
        <ZoneDetailPanel zone={selectedZone} officeName={officeName} people={officePeople} />
      </div>

    </div>
  );
}
