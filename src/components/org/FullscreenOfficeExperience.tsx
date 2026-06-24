"use client";

// FullscreenOfficeExperience — C15.2
// 2.5D CSS floor plan scene per office. No WebGL, no Three.js, no fake data.
// Presence/employees/tasks: honest "غير متاح" until real data is wired.

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";

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

// ─── Zone definitions ─────────────────────────────────────────────────────────

const BOARD_ZONES: ZoneDef[] = [
  { id: "board-chamber", name: "غرفة مجلس الإدارة", type: "غرفة تنفيذية", purpose: "مخصصة لجلسات المجلس وقرارات الاستراتيجية.", state: "command", stateLabel: "جاهزة بعد ربط البيانات", accent: "#a855f7" },
  { id: "board-kpi",     name: "غرفة مؤشرات الأداء", type: "لوحة تشغيل",  purpose: "تعرض مؤشرات الأداء بعد ربط البيانات التشغيلية.", state: "informational", stateLabel: "غير مفعّل تشغيلياً", accent: "#f59e0b" },
  { id: "board-dt",      name: "غرفة التوأم الرقمي", type: "تشغيل تحليلي", purpose: "تعكس حالة المكاتب والوحدات التشغيلية بصرياً.", state: "informational", stateLabel: "جاهز بعد ربط المكاتب", accent: "#22d3ee" },
  { id: "board-ai",      name: "غرفة مساعد التشغيل", type: "ذكاء اصطناعي", purpose: "يدعم قراءة حالة المقر بعد توفر البيانات التشغيلية.", state: "informational", stateLabel: "غير مفعّل تشغيلياً", accent: "#a855f7" },
];

function getOfficeZones(isLinked: boolean): ZoneDef[] {
  const state: ZoneState = isLinked ? "ready_after_link" : "needs_link";
  const stateLabel = isLinked ? "جاهزة بعد الربط" : "يحتاج تفعيل";
  return [
    { id: "zone-meeting",   name: "غرفة اجتماع",   type: "غرفة اجتماع",   purpose: "مخصصة لاجتماعات الفريق داخل هذا المكتب.",                      state, stateLabel, accent: "#3b82f6" },
    { id: "zone-workspace", name: "مساحة عمل",      type: "مساحة عمل",     purpose: "منطقة العمل اليومي للموظفين المرتبطين بهذا المكتب.",           state, stateLabel, accent: "#22d3ee" },
    { id: "zone-focus",     name: "غرفة تركيز",     type: "غرفة تركيز",    purpose: "مخصصة للعمل الفردي والمهام التي تحتاج تركيزاً عالياً.",       state, stateLabel, accent: "#10b981" },
    { id: "zone-waiting",   name: "منطقة انتظار",   type: "منطقة استقبال", purpose: "مخصصة للزوار والمراجعين قبل الدخول للمكتب.",                  state, stateLabel, accent: "#8b5cf6" },
  ];
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ZoneDetailPanel({ zone, officeName, people }: { zone: ZoneDef | null; officeName: string; people: PresencePerson[] }) {
  if (!zone) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#2a4462", textAlign: "center" }}>اضغط على أي منطقة لعرض تفاصيلها</p>
      </div>
    );
  }

  const dotColor =
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 8px ${dotColor}88` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{zone.name}</div>
          <div style={{ fontSize: 9.5, color: "#3a5570" }}>{zone.type}</div>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: `1px solid ${dotColor}44`, background: `${dotColor}14`, color: dotLabel }}>{zone.stateLabel}</span>
      </div>

      <p style={{ margin: 0, fontSize: 10.5, color: "#6a8aaa", lineHeight: 1.6 }}>{zone.purpose}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
        {[
          { label: "المكتب", value: officeName },
          { label: "الموظفون", value: people.length > 0 ? `${people.length}` : "غير متاح" },
          { label: "الاجتماع", value: "غير مفعّل" },
        ].map(({ label, value }) => (
          <div key={label} style={{ borderRadius: 8, padding: "5px 8px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 8.5, color: "#2a4a6a", fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 9, color: "#1e3050", lineHeight: 1.4 }}>يتم تفعيل بيانات المنطقة بعد ربط الموظفين والمهام.</p>
    </div>
  );
}

// ─── 2.5D Floor Plan ─────────────────────────────────────────────────────────

function FloorPlan2D({
  zones,
  isBoard,
  selectedZone,
  onSelect,
}: {
  zones: ZoneDef[];
  isBoard: boolean;
  selectedZone: ZoneDef | null;
  onSelect: (z: ZoneDef) => void;
}) {
  return isBoard ? <BoardFloor zones={zones} selectedZone={selectedZone} onSelect={onSelect} /> : <OfficeFloor zones={zones} selectedZone={selectedZone} onSelect={onSelect} />;
}

// ─── Board command center floor ───────────────────────────────────────────────

function BoardFloor({ zones, selectedZone, onSelect }: { zones: ZoneDef[]; selectedZone: ZoneDef | null; onSelect: (z: ZoneDef) => void }) {
  const [z0, z1, z2, z3] = zones; // chamber / kpi / dt / ai

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      backgroundImage: ["linear-gradient(rgba(168,85,247,0.04) 1px,transparent 1px)", "linear-gradient(90deg,rgba(168,85,247,0.04) 1px,transparent 1px)"].join(","),
      backgroundSize: "28px 28px",
    }}>
      {/* Room walls outline */}
      <div style={{
        position: "absolute", inset: 12,
        border: "1px solid rgba(168,85,247,0.18)",
        borderRadius: 18,
        background: "rgba(168,85,247,0.03)",
      }} />

      {/* ── Zone: Board Chamber (top-left, large) */}
      <ZoneArea
        zone={z0}
        selected={selectedZone?.id === z0?.id}
        onSelect={() => z0 && onSelect(z0)}
        style={{ position: "absolute", top: 24, left: 16, width: "44%", height: "44%", borderRadius: 14 }}
      >
        {/* Oval conference table */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "60%", height: "38%",
          borderRadius: "50%",
          background: "rgba(168,85,247,0.18)",
          border: "1.5px solid rgba(168,85,247,0.45)",
          boxShadow: "0 2px 18px rgba(168,85,247,0.18)",
        }} />
        {/* Chairs around table */}
        {[
          { top: "14%", left: "25%" }, { top: "14%", left: "50%" }, { top: "14%", left: "75%" },
          { top: "72%", left: "25%" }, { top: "72%", left: "50%" }, { top: "72%", left: "75%" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 10, height: 7, borderRadius: 3, background: "rgba(168,85,247,0.28)", border: "1px solid rgba(168,85,247,0.40)", transform: "translate(-50%,-50%)" }} />
        ))}
        <ZoneLabel name={z0?.name} accent={z0?.accent ?? "#a855f7"} />
      </ZoneArea>

      {/* ── Zone: KPI Dashboard (top-right) */}
      <ZoneArea
        zone={z1}
        selected={selectedZone?.id === z1?.id}
        onSelect={() => z1 && onSelect(z1)}
        style={{ position: "absolute", top: 24, right: 16, width: "44%", height: "44%", borderRadius: 14 }}
      >
        {/* Screen wall */}
        <div style={{ position: "absolute", top: "15%", left: "10%", right: "10%", height: "28%", background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 6 }}>
          <div style={{ display: "flex", gap: 3, padding: "4px 6px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, background: "rgba(245,158,11,0.30)" }} />)}
          </div>
        </div>
        {/* Console table */}
        <div style={{ position: "absolute", bottom: "18%", left: "15%", right: "15%", height: "12%", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: 4 }} />
        <ZoneLabel name={z1?.name} accent={z1?.accent ?? "#f59e0b"} />
      </ZoneArea>

      {/* ── Zone: Digital Twin (bottom-left) */}
      <ZoneArea
        zone={z2}
        selected={selectedZone?.id === z2?.id}
        onSelect={() => z2 && onSelect(z2)}
        style={{ position: "absolute", bottom: 24, left: 16, width: "44%", height: "44%", borderRadius: 14 }}
      >
        {/* Node grid representing office network */}
        {[
          { top: "28%", left: "25%" }, { top: "28%", left: "55%" }, { top: "28%", left: "75%" },
          { top: "55%", left: "40%" }, { top: "55%", left: "65%" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 10, height: 10, borderRadius: "50%", background: "rgba(34,211,238,0.22)", border: "1.5px solid rgba(34,211,238,0.55)", transform: "translate(-50%,-50%)", boxShadow: "0 0 6px rgba(34,211,238,0.30)" }} />
        ))}
        {/* Connector lines via thin divs */}
        <div style={{ position: "absolute", top: "32%", left: "20%", width: "42%", height: 1, background: "rgba(34,211,238,0.20)", transformOrigin: "left center", transform: "rotate(18deg)" }} />
        <div style={{ position: "absolute", top: "32%", left: "49%", width: "28%", height: 1, background: "rgba(34,211,238,0.20)", transformOrigin: "left center", transform: "rotate(-5deg)" }} />
        <ZoneLabel name={z2?.name} accent={z2?.accent ?? "#22d3ee"} />
      </ZoneArea>

      {/* ── Zone: AI Assistant (bottom-right) */}
      <ZoneArea
        zone={z3}
        selected={selectedZone?.id === z3?.id}
        onSelect={() => z3 && onSelect(z3)}
        style={{ position: "absolute", bottom: 24, right: 16, width: "44%", height: "44%", borderRadius: 14 }}
      >
        {/* AI ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 44, height: 44, borderRadius: "50%",
          border: "2px solid rgba(168,85,247,0.40)",
          boxShadow: "0 0 18px rgba(168,85,247,0.20), inset 0 0 12px rgba(168,85,247,0.10)",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: "rgba(168,85,247,0.22)",
          border: "1px solid rgba(168,85,247,0.60)",
        }} />
        <ZoneLabel name={z3?.name} accent={z3?.accent ?? "#a855f7"} />
      </ZoneArea>

      {/* Center corridor label */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        fontSize: 8, color: "rgba(168,85,247,0.30)", fontWeight: 700, whiteSpace: "nowrap",
        pointerEvents: "none",
      }}>مجلس الإدارة</div>
    </div>
  );
}

// ─── Regular office floor ─────────────────────────────────────────────────────

function OfficeFloor({ zones, selectedZone, onSelect }: { zones: ZoneDef[]; selectedZone: ZoneDef | null; onSelect: (z: ZoneDef) => void }) {
  const [meeting, workspace, focus, waiting] = zones;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      backgroundImage: ["linear-gradient(rgba(34,211,238,0.03) 1px,transparent 1px)", "linear-gradient(90deg,rgba(34,211,238,0.03) 1px,transparent 1px)"].join(","),
      backgroundSize: "24px 24px",
    }}>
      {/* Office perimeter */}
      <div style={{ position: "absolute", inset: 12, border: "1px solid rgba(34,211,238,0.14)", borderRadius: 18, background: "rgba(34,211,238,0.02)" }} />

      {/* ── Meeting room (top-left, large) */}
      <ZoneArea
        zone={meeting}
        selected={selectedZone?.id === meeting?.id}
        onSelect={() => meeting && onSelect(meeting)}
        style={{ position: "absolute", top: 20, left: 16, width: "48%", height: "46%", borderRadius: 12 }}
      >
        {/* Round meeting table */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-54%)",
          width: 50, height: 30, borderRadius: "50%",
          background: "rgba(59,130,246,0.16)", border: "1.5px solid rgba(59,130,246,0.40)",
        }} />
        {[
          { top: "18%", left: "30%" }, { top: "18%", left: "55%" }, { top: "18%", left: "75%" },
          { top: "68%", left: "22%" }, { top: "68%", left: "50%" }, { top: "68%", left: "75%" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 9, height: 6, borderRadius: 3, background: "rgba(59,130,246,0.24)", border: "1px solid rgba(59,130,246,0.38)", transform: "translate(-50%,-50%)" }} />
        ))}
        <ZoneLabel name={meeting?.name} accent={meeting?.accent ?? "#3b82f6"} />
      </ZoneArea>

      {/* ── Workspace (top-right) */}
      <ZoneArea
        zone={workspace}
        selected={selectedZone?.id === workspace?.id}
        onSelect={() => workspace && onSelect(workspace)}
        style={{ position: "absolute", top: 20, right: 16, width: "42%", height: "46%", borderRadius: 12 }}
      >
        {/* Row of desks */}
        {[
          { top: "22%", left: "18%" }, { top: "22%", left: "58%" },
          { top: "52%", left: "18%" }, { top: "52%", left: "58%" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transform: "translate(-50%,-50%)" }}>
            {/* desk */}
            <div style={{ width: 24, height: 14, background: "rgba(34,211,238,0.14)", border: "1px solid rgba(34,211,238,0.32)", borderRadius: 4 }} />
            {/* monitor */}
            <div style={{ width: 12, height: 8, background: "rgba(34,211,238,0.20)", border: "1px solid rgba(34,211,238,0.40)", borderRadius: 2 }} />
          </div>
        ))}
        <ZoneLabel name={workspace?.name} accent={workspace?.accent ?? "#22d3ee"} />
      </ZoneArea>

      {/* ── Focus pod (bottom-left) */}
      <ZoneArea
        zone={focus}
        selected={selectedZone?.id === focus?.id}
        onSelect={() => focus && onSelect(focus)}
        style={{ position: "absolute", bottom: 20, left: 16, width: "42%", height: "42%", borderRadius: 12 }}
      >
        {/* Single focus desk */}
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)",
          width: 32, height: 18, background: "rgba(16,185,129,0.16)", border: "1.5px solid rgba(16,185,129,0.38)", borderRadius: 6,
        }} />
        <div style={{
          position: "absolute", top: "60%", left: "50%", transform: "translate(-50%,-50%)",
          width: 16, height: 10, background: "rgba(16,185,129,0.22)", border: "1px solid rgba(16,185,129,0.45)", borderRadius: 3,
        }} />
        {/* Focus ring decoration */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 12, height: 12, borderRadius: "50%",
          border: "1.5px solid rgba(16,185,129,0.30)",
        }} />
        <ZoneLabel name={focus?.name} accent={focus?.accent ?? "#10b981"} />
      </ZoneArea>

      {/* ── Waiting area (bottom-right) */}
      <ZoneArea
        zone={waiting}
        selected={selectedZone?.id === waiting?.id}
        onSelect={() => waiting && onSelect(waiting)}
        style={{ position: "absolute", bottom: 20, right: 16, width: "48%", height: "42%", borderRadius: 12 }}
      >
        {/* Sofa shapes */}
        <div style={{ position: "absolute", top: "22%", left: "15%", right: "15%", height: "26%", background: "rgba(139,92,246,0.14)", border: "1px solid rgba(139,92,246,0.32)", borderRadius: 8 }} />
        <div style={{ position: "absolute", bottom: "20%", left: "30%", right: "30%", height: "20%", background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.26)", borderRadius: 6 }} />
        <ZoneLabel name={waiting?.name} accent={waiting?.accent ?? "#8b5cf6"} />
      </ZoneArea>
    </div>
  );
}

// ─── Reusable zone area wrapper ───────────────────────────────────────────────

function ZoneArea({ zone, selected, onSelect, style, children }: {
  zone: ZoneDef | undefined;
  selected: boolean;
  onSelect: () => void;
  style: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const accent = zone?.accent ?? "#22d3ee";
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...style,
        cursor: "pointer",
        border: selected ? `1.5px solid ${accent}80` : `1px solid ${accent}20`,
        background: selected ? `${accent}12` : `${accent}05`,
        boxShadow: selected ? `0 0 24px ${accent}22, inset 0 0 12px ${accent}08` : "none",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        overflow: "hidden",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Zone label overlay ───────────────────────────────────────────────────────

function ZoneLabel({ name, accent }: { name: string | undefined; accent: string }) {
  if (!name) return null;
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: "4px 8px",
      background: `linear-gradient(0deg, ${accent}18 0%, transparent 100%)`,
      fontSize: 8, fontWeight: 700, color: `${accent}cc`,
      pointerEvents: "none",
      textAlign: "center",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>
      {name}
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
        overflowY: "hidden",
      }}
      dir="rtl"
    >

      {/* ── TOP COMMAND BAR */}
      <div style={{
        flexShrink: 0, padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.25)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <button type="button" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: "#8ba3c7", fontSize: 12, fontWeight: 600, padding: "5px 0", flexShrink: 0 }}>
          <ArrowRight size={14} />
          العودة للمقر
        </button>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{officeName}</div>
          <div style={{ fontSize: 9.5, color: "#3a5570" }}>{officeSubtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: `1px solid ${statusBadge.border}`, background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(100,116,139,0.22)", background: "rgba(100,116,139,0.06)", color: "#64748b" }}>الحضور: غير مفعّل</span>
        </div>

        <button type="button" onClick={onClose} aria-label="إغلاق" style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8ba3c7", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      {/* ── 2.5D FLOOR PLAN (main area) */}
      <div style={{ flex: 1, padding: "12px 14px", minHeight: 0 }}>
        <div style={{ height: "100%", position: "relative" }}>
          <FloorPlan2D zones={zones} isBoard={!!room.isCenter} selectedZone={selectedZone} onSelect={setSelectedZone} />
        </div>
      </div>

      {/* ── ZONE DETAIL PANEL (bottom) */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${selectedZone ? `${selectedZone.accent}25` : "rgba(255,255,255,0.05)"}`,
        background: selectedZone ? `linear-gradient(180deg, ${selectedZone.accent}06 0%, rgba(0,0,0,0.30) 100%)` : "rgba(0,0,0,0.22)",
        transition: "border-color 0.12s ease, background 0.12s ease",
        minHeight: 90,
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
      }}>
        <ZoneDetailPanel zone={selectedZone} officeName={officeName} people={officePeople} />
      </div>

    </div>
  );
}
