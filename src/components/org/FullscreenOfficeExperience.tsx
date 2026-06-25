"use client";

// FullscreenOfficeExperience — C15.7
// Single-office interior entry. Replaces the map-zoom approach entirely.
// Uses SingleOfficeInteriorScene (CSS/HTML 2.5D). No WebGL, no Three.js,
// no fake data, no new packages.

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  DoorOpen,
  LayoutGrid,
  Link2,
  Settings,
  Users,
  X,
} from "lucide-react";
import type {
  MappingSource,
  OfficeRoom,
  PreviewOrgUnit,
  PresencePerson,
} from "./VirtualOfficeDesign";
import SingleOfficeInteriorScene, { type Zone } from "./SingleOfficeInteriorScene";

// ─── Panel tab model ──────────────────────────────────────────────────────────

type PanelTab = "overview" | "zones" | "employees" | "tasks" | "linking" | "settings";

const PANEL_TABS: Array<{ key: PanelTab; label: string; Icon: typeof LayoutGrid }> = [
  { key: "overview",  label: "عام",        Icon: LayoutGrid },
  { key: "zones",     label: "الغرف",      Icon: DoorOpen },
  { key: "employees", label: "الفريق",     Icon: Users },
  { key: "tasks",     label: "المهام",     Icon: CheckCircle2 },
  { key: "linking",   label: "الربط",      Icon: Link2 },
  { key: "settings",  label: "الإعدادات", Icon: Settings },
];

const sourceLabel: Record<MappingSource, string> = {
  saved:   "ربط محفوظ",
  preview: "ربط تجريبي",
  auto:    "ربط تلقائي",
};

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ selectedZone, officeName, mappingUnit, mappingSource, people, isLinked }: {
  selectedZone: Zone | null;
  officeName: string;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  people: PresencePerson[];
  isLinked: boolean;
}) {
  if (!selectedZone) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", minHeight: 60 }}>
        <p style={{ margin: 0, fontSize: 10.5, color: "#2a4462", textAlign: "center" }}>
          اضغط على منطقة عمل داخل المكتب لعرض تفاصيلها
        </p>
      </div>
    );
  }

  const dot =
    selectedZone.state === "command" || selectedZone.state === "ready_after_link" ? selectedZone.accent
    : selectedZone.state === "informational" ? selectedZone.accent
    : "#64748b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {/* Zone header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}88` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#dff7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedZone.name}
          </div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          border: `1px solid ${dot}44`, background: `${dot}14`, color: dot, flexShrink: 0,
        }}>
          {selectedZone.stateLabel}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 10, color: "#6a8aaa", lineHeight: 1.55 }}>{selectedZone.purpose}</p>

      {/* Status grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
        {([
          { label: "الموظفون", value: people.length > 0 ? `${people.length}` : "غير متاح" },
          { label: "المهام",    value: "غير متاح" },
          { label: "الاجتماع", value: "غير مفعّل" },
        ] as const).map(({ label, value }) => (
          <div key={label} style={{ borderRadius: 7, padding: "4px 7px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 7.5, color: "#2a4a6a", fontWeight: 600, marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 9.5, color: "#475569", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Linking note */}
      {mappingUnit && (
        <div style={{ fontSize: 8.5, color: "#2a5a3a", display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ color: "#10b981" }}>●</span>
          <span>{mappingUnit.name} · {sourceLabel[mappingSource ?? "auto"]}</span>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 8.5, color: "#1e3050", lineHeight: 1.4 }}>
        يتم تفعيل البيانات بعد ربط الموظفين والمهام بهذا المكتب.
      </p>
    </div>
  );
}

// ─── Stub tabs (honest, no fake data) ────────────────────────────────────────

function StubTab({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", minHeight: 60 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#2a4a6a" }}>{title}</p>
      <p style={{ margin: 0, fontSize: 10, color: "#1e3050", textAlign: "center", lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface FullscreenOfficeExperienceProps {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  officePeople: PresencePerson[];
  onClose: () => void;
}

export default function FullscreenOfficeExperience({
  room, mappingUnit, mappingSource, officePeople, onClose,
}: FullscreenOfficeExperienceProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("overview");

  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;

  const officeName = room.isCenter
    ? "مركز قيادة مجلس الإدارة"
    : mappingUnit?.name ?? room.name ?? (room.officeNumber ? `مكتب ${String(room.officeNumber).padStart(2, "0")}` : "مكتب");

  const officeSubtitle = room.isCenter
    ? "مكتب مجلس الإدارة"
    : room.isUnassigned
    ? "غير مخصص · جاهز للتشغيل"
    : mappingUnit?.typeLabel ?? "مرتبط";

  const statusBadge = room.isCenter
    ? { label: "مجلس الإدارة", color: "#a855f7", bg: "rgba(168,85,247,0.14)", border: "rgba(168,85,247,0.40)" }
    : room.isUnassigned
    ? { label: "يحتاج ربط",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" }
    : { label: "مرتبط",        color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`داخل المكتب — ${officeName}`}
      style={{
        position: "fixed", inset: 0, zIndex: 110,
        display: "flex", flexDirection: "column",
        background: "#030812",
        overflow: "hidden",
      }}
      dir="rtl"
    >

      {/* ── TOP BAR ────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "11px 16px",
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
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, border: "1px solid rgba(34,211,238,0.20)", background: "rgba(34,211,238,0.05)", color: "rgba(34,211,238,0.60)" }}>
            مكتب افتراضي
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          style={{
            width: 32, height: 32, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)", color: "#8ba3c7",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── SINGLE OFFICE INTERIOR SCENE ────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <SingleOfficeInteriorScene
          isBoard={!!room.isCenter}
          isLinked={isLinked}
          officePeople={officePeople}
          selectedZone={selectedZone}
          onZoneSelect={setSelectedZone}
        />
      </div>

      {/* ── BOTTOM PANEL ────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${selectedZone ? `${selectedZone.accent}28` : "rgba(255,255,255,0.05)"}`,
        background: selectedZone
          ? `linear-gradient(180deg, ${selectedZone.accent}08 0%, rgba(0,0,0,0.55) 100%)`
          : "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "border-color 0.12s, background 0.12s",
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        zIndex: 20,
      }}>
        {/* Tab bar */}
        <div style={{
          display: "flex", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
        }}>
          {PANEL_TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            const accent = selectedZone?.accent ?? "#22d3ee";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                style={{
                  flexShrink: 0,
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "7px 12px",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: active ? accent : "#3a5570",
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
                  transition: "color 0.12s, border-color 0.12s",
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: "10px 16px", minHeight: 64, maxHeight: "22dvh", overflowY: "auto", overscrollBehavior: "contain" }}>
          {activeTab === "overview" && (
            <OverviewTab
              selectedZone={selectedZone}
              officeName={officeName}
              mappingUnit={mappingUnit}
              mappingSource={mappingSource}
              people={officePeople}
              isLinked={isLinked}
            />
          )}
          {activeTab === "zones" && (
            <StubTab title="مناطق العمل" note="اضغط على أي منطقة داخل المكتب لعرض تفاصيلها." />
          )}
          {activeTab === "employees" && (
            <StubTab title="الفريق" note="حالة الحضور والفريق تحتاج تفعيل تتبع النشاط." />
          )}
          {activeTab === "tasks" && (
            <StubTab title="المهام" note="يتم عرض المهام بعد ربط الموظفين والمهام بهذا المكتب." />
          )}
          {activeTab === "linking" && (
            <StubTab
              title="الربط"
              note={isLinked ? `مرتبط بـ: ${mappingUnit?.name ?? "—"}` : "اربط المكتب من نافذة إدارة المكتب."}
            />
          )}
          {activeTab === "settings" && (
            <StubTab title="الإعدادات" note="إعدادات المكتب تُدار من نافذة إدارة المكتب." />
          )}
        </div>
      </div>

    </div>
  );
}
