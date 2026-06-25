"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
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

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const FOCUS_ZOOM = 2.08;

const OFFICE_POSITIONS: ReadonlyArray<{ left: number; top: number }> = [
  { left: 19, top: 79 },
  { left: 20, top: 18 },
  { left: 50, top: 18 },
  { left: 19, top: 48 },
  { left: 50, top: 48 },
  { left: 82, top: 48 },
  { left: 51, top: 80 },
  { left: 82, top: 79 },
  { left: 82, top: 18 },
] as const;

type ZoneState = "needs_activation" | "ready_after_link" | "disabled" | "unavailable" | "setup";
type PanelTab = "overview" | "zones" | "employees" | "tasks" | "linking" | "settings";

interface ZoneDef {
  id: string;
  name: string;
  type: string;
  purpose: string;
  state: ZoneState;
  stateLabel: string;
  actionLabel: string;
  accent: string;
  x: number;
  y: number;
}

const PANEL_TABS: Array<{ key: PanelTab; label: string; Icon: typeof LayoutGrid }> = [
  { key: "overview", label: "عام", Icon: LayoutGrid },
  { key: "zones", label: "الغرف", Icon: DoorOpen },
  { key: "employees", label: "الفريق", Icon: Users },
  { key: "tasks", label: "المهام", Icon: CheckCircle2 },
  { key: "linking", label: "الربط", Icon: Link2 },
  { key: "settings", label: "الإعدادات", Icon: Settings },
];

const stateTone: Record<ZoneState, { color: string; bg: string; border: string }> = {
  needs_activation: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.32)" },
  ready_after_link: { color: "#22d3ee", bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.32)" },
  disabled: { color: "#94a3b8", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.24)" },
  unavailable: { color: "#64748b", bg: "rgba(100,116,139,0.06)", border: "rgba(100,116,139,0.18)" },
  setup: { color: "#a855f7", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.30)" },
};

const sourceLabel: Record<MappingSource, string> = {
  saved: "ربط محفوظ",
  preview: "ربط تجريبي",
  auto: "ربط تلقائي",
};

function getRegularZones(isLinked: boolean): ZoneDef[] {
  const state: ZoneState = isLinked ? "ready_after_link" : "needs_activation";
  const stateLabel = isLinked ? "جاهز بعد الربط" : "يحتاج تفعيل";
  return [
    {
      id: "meeting-room",
      name: "غرفة الاجتماع",
      type: "غرفة تشغيل",
      purpose: "مساحة مخصصة لاجتماعات هذا المكتب عند تفعيل الاجتماعات لاحقاً.",
      state,
      stateLabel,
      actionLabel: "الاجتماعات غير مفعلة",
      accent: "#3b82f6",
      x: 27,
      y: 30,
    },
    {
      id: "workspace",
      name: "مساحة العمل",
      type: "منطقة تشغيل",
      purpose: "تعرض سياق العمل اليومي للوحدة المرتبطة بهذا المكتب.",
      state,
      stateLabel,
      actionLabel: isLinked ? "جاهزة للربط التشغيلي" : "اربط المكتب أولاً",
      accent: "#22d3ee",
      x: 62,
      y: 34,
    },
    {
      id: "focus-room",
      name: "غرفة التركيز",
      type: "مساحة هادئة",
      purpose: "مكان افتراضي مخصص لمتابعة الأعمال التي تحتاج تركيزاً.",
      state,
      stateLabel,
      actionLabel: "قيد التهيئة",
      accent: "#10b981",
      x: 35,
      y: 66,
    },
    {
      id: "waiting-area",
      name: "منطقة الانتظار",
      type: "استقبال",
      purpose: "منطقة انتظار للزوار أو الطلبات قبل دخول المكتب.",
      state: "setup",
      stateLabel: "قيد التهيئة",
      actionLabel: "إعداد مستقبلي",
      accent: "#8b5cf6",
      x: 72,
      y: 67,
    },
    {
      id: "office-console",
      name: "لوحة تشغيل المكتب",
      type: "لوحة إدارة",
      purpose: "تجمع حالة الربط والموظفين والمهام المتاحة لهذا المكتب.",
      state: isLinked ? "ready_after_link" : "needs_activation",
      stateLabel: isLinked ? "جاهز بعد الربط" : "يحتاج تفعيل",
      actionLabel: "يعتمد على البيانات الحالية",
      accent: "#06b6d4",
      x: 51,
      y: 50,
    },
  ];
}

function getBoardZones(): ZoneDef[] {
  return [
    {
      id: "board-room",
      name: "غرفة مجلس الإدارة",
      type: "غرفة قيادة",
      purpose: "مساحة مراجعة قرارات المجلس وحالة المقر الافتراضي.",
      state: "ready_after_link",
      stateLabel: "جاهز بعد ربط البيانات",
      actionLabel: "قراءة تنفيذية فقط",
      accent: "#a855f7",
      x: 31,
      y: 30,
    },
    {
      id: "performance-room",
      name: "مؤشرات الأداء",
      type: "لوحة مؤشرات",
      purpose: "تظهر المؤشرات فقط عند توفر بيانات تشغيلية حقيقية.",
      state: "disabled",
      stateLabel: "غير مفعّل",
      actionLabel: "لا توجد مؤشرات مفعلة",
      accent: "#f59e0b",
      x: 66,
      y: 31,
    },
    {
      id: "digital-twin-room",
      name: "التوأم الرقمي",
      type: "طبقة تشغيل",
      purpose: "تعكس حالة الربط بين المكاتب والهيكل الإداري.",
      state: "setup",
      stateLabel: "قيد التهيئة",
      actionLabel: "جاهز بعد الربط",
      accent: "#22d3ee",
      x: 34,
      y: 66,
    },
    {
      id: "smart-ops-assistant",
      name: "مساعد التشغيل الذكي",
      type: "مساعد مستقبلي",
      purpose: "يبقى غير مفعّل حتى يتم ربط طبقة ذكاء تشغيلية حقيقية.",
      state: "disabled",
      stateLabel: "غير مفعّل",
      actionLabel: "لا توجد أوامر ذكية مفعلة",
      accent: "#c084fc",
      x: 70,
      y: 67,
    },
    {
      id: "decision-center",
      name: "مركز القرار",
      type: "منطقة تنفيذية",
      purpose: "تجميع قرارات التشغيل والمراجعة التنفيذية للمكتب.",
      state: "setup",
      stateLabel: "قيد التهيئة",
      actionLabel: "قراءة فقط",
      accent: "#38bdf8",
      x: 51,
      y: 50,
    },
  ];
}

function MetricTile({ label, value, tone = "#22d3ee" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="office-shell-metric">
      <span>{label}</span>
      <strong style={{ color: tone }}>{value}</strong>
    </div>
  );
}

function ZoneButton({
  zone,
  selected,
  onSelect,
}: {
  zone: ZoneDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = stateTone[zone.state];
  return (
    <button
      type="button"
      className={`office-zone-node ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        borderColor: selected ? zone.accent : tone.border,
        background: selected ? `linear-gradient(135deg, ${zone.accent}28, rgba(2,8,23,0.88))` : "rgba(2,8,23,0.76)",
        boxShadow: selected ? `0 0 28px ${zone.accent}42` : "0 14px 34px rgba(0,0,0,0.26)",
      }}
    >
      <span className="office-zone-dot" style={{ background: zone.accent }} />
      <span className="office-zone-copy">
        <strong>{zone.name}</strong>
        <small>{zone.stateLabel}</small>
      </span>
    </button>
  );
}

function ZoneListItem({
  zone,
  selected,
  onSelect,
}: {
  zone: ZoneDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = stateTone[zone.state];
  return (
    <button
      type="button"
      className={`office-shell-zone-row ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      style={{ borderColor: selected ? zone.accent : "rgba(148,163,184,0.12)" }}
    >
      <span className="office-shell-zone-row-dot" style={{ background: zone.accent }} />
      <span className="office-shell-zone-row-main">
        <strong>{zone.name}</strong>
        <small>{zone.type}</small>
      </span>
      <span style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}>
        {zone.stateLabel}
      </span>
    </button>
  );
}

export interface FullscreenOfficeExperienceProps {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  officePeople: PresencePerson[];
  onClose: () => void;
}

export default function FullscreenOfficeExperience({
  room,
  mappingUnit,
  mappingSource,
  officePeople,
  onClose,
}: FullscreenOfficeExperienceProps) {
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const zones = useMemo(() => (room.isCenter ? getBoardZones() : getRegularZones(isLinked)), [isLinked, room.isCenter]);
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<PanelTab>("overview");

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0] ?? null;
  const slotIndex = Math.max(0, Math.min(8, (room.officeNumber ?? 5) - 1));
  const officePos = OFFICE_POSITIONS[slotIndex] ?? { left: 50, top: 50 };
  const officeNumber = room.officeNumber ? `مكتب ${String(room.officeNumber).padStart(2, "0")}` : "مكتب";
  const officeName = room.isCenter
    ? "مركز قيادة مجلس الإدارة"
    : mappingUnit?.name ?? room.name ?? officeNumber;
  const linkedUnitLabel = room.isCenter
    ? "مركز تحكم تنفيذي"
    : mappingUnit?.name ?? "غير مخصص";
  const linkingState = room.isCenter
    ? "قراءة تنفيذية"
    : mappingUnit
      ? sourceLabel[mappingSource ?? "auto"]
      : "غير مخصص";
  const peopleValue = officePeople.length > 0 ? `${officePeople.length}` : "غير متاح";
  const taskValue = room.openTasks > 0 ? `${room.openTasks}` : "غير متاح";
  const officeStatus = room.isCenter ? "مكتب افتراضي تنفيذي" : room.isUnassigned ? "يحتاج ربط" : "جاهز بعد الربط";
  const accent = room.isCenter ? "#a855f7" : room.accentColor ?? "#22d3ee";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`دخول المكتب - ${officeName}`}
      className="office-workspace-shell"
      dir="rtl"
    >
      <header className="office-shell-topbar">
        <button type="button" className="office-shell-back" onClick={onClose}>
          <ArrowRight size={15} />
          العودة للمقر
        </button>

        <div className="office-shell-title">
          <span>{officeNumber}</span>
          <strong>{officeName}</strong>
        </div>

        <div className="office-shell-badges">
          <span style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}>{officeStatus}</span>
          <span>الحضور: غير مفعّل</span>
          <span>مكتب افتراضي</span>
        </div>

        <button type="button" className="office-shell-close" onClick={onClose} aria-label="إغلاق">
          <X size={15} />
        </button>
      </header>

      <main className="office-shell-main">
        <section className="office-shell-visual" aria-label="مساحة المكتب">
          <div className="office-shell-map-frame">
            <div
              className="office-shell-map-zoom"
              style={{
                transformOrigin: `${officePos.left}% ${officePos.top}%`,
                transform: `scale(${FOCUS_ZOOM})`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGE_SRC}
                alt=""
                aria-hidden="true"
                style={{ objectPosition: `${officePos.left}% ${officePos.top}%` }}
              />
            </div>

            <div className="office-shell-dim" />
            <div className="office-shell-grid" />
            <div className="office-shell-focus" style={{ borderColor: `${accent}66`, boxShadow: `0 0 70px ${accent}2f` }}>
              <span>{officeNumber}</span>
              <strong>{room.isCenter ? "مجلس الإدارة" : mappingUnit?.typeLabel ?? "مساحة تشغيل"}</strong>
            </div>

            <div className="office-shell-zone-layer" aria-label="مناطق المكتب">
              {zones.map((zone) => (
                <ZoneButton
                  key={zone.id}
                  zone={zone}
                  selected={selectedZone?.id === zone.id}
                  onSelect={() => {
                    setSelectedZoneId(zone.id);
                    setActiveTab("overview");
                  }}
                />
              ))}
            </div>

            <div className="office-shell-context-card">
              <span>داخل المكتب</span>
              <strong>{linkedUnitLabel}</strong>
              <small>اختر منطقة لعرض تفاصيلها.</small>
            </div>
          </div>

          <div className="office-shell-quick-state">
            <MetricTile label="المنطقة" value={selectedZone?.name ?? "غير متاح"} tone={selectedZone?.accent ?? "#22d3ee"} />
            <MetricTile label="حالة المكتب" value={officeStatus} tone={mappingUnit ? "#22d3ee" : "#f59e0b"} />
            <MetricTile label="الربط" value={linkingState} tone={mappingUnit ? "#22d3ee" : "#f59e0b"} />
          </div>
        </section>

        <aside className="office-shell-command" aria-label="لوحة المكتب">
          <div className="office-shell-command-head">
            <div>
              <span>لوحة المكتب</span>
              <strong>{room.isCenter ? "مركز القيادة" : "إدارة المكتب"}</strong>
            </div>
            <Building2 size={18} color={accent} />
          </div>

          <nav className="office-shell-tabs" aria-label="تبويبات لوحة المكتب">
            {PANEL_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                className={activeTab === key ? "is-active" : ""}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>

          <div className="office-shell-panel-body">
            {activeTab === "overview" && (
              <div className="office-shell-panel-stack">
                <div className="office-shell-info-card is-hero">
                  <span>المكتب</span>
                  <strong>{officeName}</strong>
                  <small>
                    {mappingUnit
                      ? `${officeNumber} · ${linkingState}`
                      : "هذا المكتب يحتاج ربطاً قبل تفعيل بيانات الفريق والمهام."}
                  </small>
                </div>

                {selectedZone && (
                  <div className="office-shell-info-card">
                    <span>تفاصيل المنطقة</span>
                    <strong>{selectedZone.name}</strong>
                    <small>{selectedZone.purpose}</small>
                  </div>
                )}

                <button type="button" className="office-shell-disabled-action" disabled>
                  إدارة الربط من نافذة المكتب
                </button>
              </div>
            )}

            {activeTab === "zones" && (
              <div className="office-shell-panel-stack">
                {zones.map((zone) => (
                  <ZoneListItem
                    key={zone.id}
                    zone={zone}
                    selected={selectedZone?.id === zone.id}
                    onSelect={() => setSelectedZoneId(zone.id)}
                  />
                ))}
                {selectedZone && (
                  <div className="office-shell-info-card">
                    <span>الغرض</span>
                    <strong>{selectedZone.actionLabel}</strong>
                    <small>{selectedZone.purpose}</small>
                  </div>
                )}
              </div>
            )}

            {activeTab === "employees" && (
              <div className="office-shell-panel-stack">
                {officePeople.length > 0 ? (
                  officePeople.map((person) => (
                    <div key={person.id} className="office-shell-person-row">
                      <span style={{ color: person.color, borderColor: `${person.color}55`, background: `${person.color}18` }}>
                        {person.initials}
                      </span>
                      <div>
                        <strong>{person.name}</strong>
                        <small>{person.roleOrUnit ?? "غير متاح"}</small>
                      </div>
                      <em>الحضور غير مفعّل</em>
                    </div>
                  ))
                ) : (
                  <div className="office-shell-empty">
                    <Users size={18} />
                    <strong>غير متاح</strong>
                    <span>لا يتم عرض موظفين إلا من بيانات مرتبطة ومتاحة فعلياً.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="office-shell-panel-stack">
                <div className="office-shell-empty">
                  <CheckCircle2 size={18} />
                  <strong>{taskValue}</strong>
                  <span>لا يتم إنشاء أو عرض مهام افتراضية داخل هذا المكتب.</span>
                </div>
              </div>
            )}

            {activeTab === "linking" && (
              <div className="office-shell-panel-stack">
                <div className="office-shell-info-card is-hero">
                  <span>حالة الربط</span>
                  <strong>{linkingState}</strong>
                  <small>{mappingUnit ? mappingUnit.name : "اربط المكتب من نافذة إدارة المكتب الحالية."}</small>
                </div>
                <button type="button" className="office-shell-disabled-action" disabled>
                  إدارة الربط من نافذة المكتب
                </button>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="office-shell-panel-stack">
                {[
                  "تفعيل الحضور",
                  "تفعيل الاجتماعات",
                  "تفعيل المساعد الذكي",
                  "تفعيل لوحة الغرفة",
                ].map((label) => (
                  <div key={label} className="office-shell-setting-row">
                    <span>{label}</span>
                    <strong>قادم</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <style>{`
        .office-workspace-shell {
          position: fixed;
          inset: 0;
          z-index: 110;
          height: 100dvh;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #e5f7ff;
          background:
            radial-gradient(circle at 18% 18%, rgba(34,211,238,0.14), transparent 32%),
            radial-gradient(circle at 82% 18%, rgba(168,85,247,0.12), transparent 28%),
            linear-gradient(145deg, #020617 0%, #06111f 52%, #020617 100%);
        }

        .office-shell-topbar {
          min-height: 64px;
          flex-shrink: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 12px;
          padding: max(12px, env(safe-area-inset-top)) 16px 12px;
          border-bottom: 1px solid rgba(148,163,184,0.12);
          background: rgba(2,6,23,0.78);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .office-shell-back,
        .office-shell-close {
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(15,23,42,0.72);
          color: #9fb7d7;
          cursor: pointer;
        }

        .office-shell-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .office-shell-close {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .office-shell-title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .office-shell-title span,
        .office-shell-command-head span,
        .office-shell-info-card span,
        .office-shell-metric span {
          font-size: 10px;
          font-weight: 800;
          color: #4d7398;
          letter-spacing: 0;
        }

        .office-shell-title strong {
          color: #fff;
          font-size: 15px;
          line-height: 1.2;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .office-shell-badges {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          flex-wrap: wrap;
        }

        .office-shell-badges span {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 9px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,0.22);
          background: rgba(100,116,139,0.08);
          color: #8ca3bf;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .office-shell-main {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 330px);
          gap: 10px;
          padding: 12px;
          overflow: hidden;
        }

        .office-shell-visual,
        .office-shell-command {
          min-width: 0;
          min-height: 0;
        }

        .office-shell-visual {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .office-shell-map-frame {
          flex: 1;
          min-height: 0;
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(34,211,238,0.14);
          background: rgba(2,8,23,0.74);
          box-shadow: 0 28px 80px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.03);
        }

        .office-shell-map-zoom {
          position: absolute;
          inset: 0;
          transition: transform 180ms ease;
        }

        .office-shell-map-zoom img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.05) contrast(1.04);
        }

        .office-shell-dim,
        .office-shell-grid,
        .office-shell-zone-layer {
          position: absolute;
          inset: 0;
        }

        .office-shell-dim {
          background:
            radial-gradient(circle at 50% 50%, rgba(2,8,23,0.04) 0%, rgba(2,8,23,0.22) 42%, rgba(2,8,23,0.82) 100%),
            linear-gradient(180deg, rgba(2,8,23,0.12), rgba(2,8,23,0.44));
          pointer-events: none;
          z-index: 2;
        }

        .office-shell-grid {
          z-index: 3;
          pointer-events: none;
          opacity: 0.26;
          background-image:
            linear-gradient(rgba(34,211,238,0.10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.10) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 78%);
        }

        .office-shell-focus {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 48%;
          width: min(40vw, 430px);
          height: min(32vh, 250px);
          min-width: 240px;
          min-height: 170px;
          transform: translate(-50%, -50%) perspective(900px) rotateX(4deg);
          border: 1px solid;
          border-radius: 28px;
          background:
            radial-gradient(circle at 50% 35%, rgba(34,211,238,0.08), transparent 68%);
          pointer-events: none;
        }

        .office-shell-focus span,
        .office-shell-focus strong {
          position: absolute;
          right: 18px;
          border-radius: 999px;
          background: rgba(2,8,23,0.72);
          border: 1px solid rgba(148,163,184,0.16);
        }

        .office-shell-focus span {
          top: 16px;
          padding: 4px 10px;
          font-size: 10px;
          color: #8bdcf5;
          font-weight: 900;
        }

        .office-shell-focus strong {
          bottom: 16px;
          padding: 6px 12px;
          font-size: 12px;
          color: #e5f7ff;
          max-width: 74%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .office-shell-zone-layer {
          z-index: 8;
        }

        .office-zone-node {
          position: absolute;
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 106px;
          max-width: 146px;
          min-height: 38px;
          padding: 6px 9px;
          border: 1px solid;
          border-radius: 14px;
          color: #dcecff;
          cursor: pointer;
          text-align: right;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }

        .office-zone-node:hover,
        .office-zone-node.is-selected {
          transform: translate(-50%, -50%) translateY(-2px);
        }

        .office-zone-dot,
        .office-shell-zone-row-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex-shrink: 0;
          box-shadow: 0 0 12px currentColor;
        }

        .office-zone-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .office-zone-copy strong {
          font-size: 10px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .office-zone-copy small {
          font-size: 8.5px;
          color: #7d94b0;
        }

        .office-shell-context-card {
          position: absolute;
          z-index: 9;
          right: 18px;
          bottom: 18px;
          width: min(240px, calc(100% - 36px));
          border-radius: 16px;
          border: 1px solid rgba(34,211,238,0.18);
          background: rgba(2,8,23,0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .office-shell-context-card span,
        .office-shell-context-card small {
          color: #5f7895;
          font-size: 10px;
          line-height: 1.5;
        }

        .office-shell-context-card strong {
          color: #e5f7ff;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .office-shell-quick-state,
        .office-shell-two-col {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .office-shell-two-col {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .office-shell-metric,
        .office-shell-info-card,
        .office-shell-zone-row,
        .office-shell-person-row,
        .office-shell-empty,
        .office-shell-setting-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.58);
          border-radius: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .office-shell-metric {
          min-width: 0;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .office-shell-metric strong {
          font-size: 12px;
          line-height: 1.25;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .office-shell-command {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid rgba(168,85,247,0.18);
          background:
            radial-gradient(circle at 16% 0%, rgba(168,85,247,0.14), transparent 34%),
            rgba(2,8,23,0.78);
          box-shadow: 0 28px 70px rgba(0,0,0,0.36), inset 0 0 0 1px rgba(255,255,255,0.03);
        }

        .office-shell-command-head {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px 8px;
          border-bottom: 1px solid rgba(148,163,184,0.10);
        }

        .office-shell-command-head strong {
          display: block;
          margin-top: 2px;
          color: #fff;
          font-size: 13px;
        }

        .office-shell-tabs {
          flex-shrink: 0;
          display: flex;
          gap: 6px;
          padding: 8px 10px;
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }

        .office-shell-tabs::-webkit-scrollbar {
          display: none;
        }

        .office-shell-tabs button {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.62);
          color: #7890ad;
          min-height: 32px;
          padding: 0 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        .office-shell-tabs button.is-active {
          color: #dff7ff;
          border-color: rgba(34,211,238,0.40);
          background: rgba(34,211,238,0.12);
        }

        .office-shell-panel-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 10px;
        }

        .office-shell-panel-stack {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .office-shell-info-card {
          padding: 12px 13px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .office-shell-info-card.is-hero {
          border-color: rgba(34,211,238,0.20);
          background: rgba(34,211,238,0.06);
        }

        .office-shell-info-card strong {
          color: #e5f7ff;
          font-size: 14px;
          line-height: 1.3;
        }

        .office-shell-info-card small {
          color: #6f86a3;
          font-size: 11px;
          line-height: 1.55;
        }

        .office-shell-zone-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          color: #dbeafe;
          text-align: right;
          cursor: pointer;
        }

        .office-shell-zone-row-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .office-shell-zone-row-main strong {
          font-size: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .office-shell-zone-row-main small {
          color: #7890ad;
          font-size: 10px;
        }

        .office-shell-zone-row > span:last-child {
          flex-shrink: 0;
          border: 1px solid;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 9px;
          font-weight: 900;
        }

        .office-shell-person-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
        }

        .office-shell-person-row > span {
          width: 32px;
          height: 32px;
          border: 1px solid;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .office-shell-person-row div {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .office-shell-person-row strong {
          color: #e5f7ff;
          font-size: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .office-shell-person-row small,
        .office-shell-person-row em {
          color: #7890ad;
          font-size: 10px;
          font-style: normal;
        }

        .office-shell-empty {
          min-height: 132px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-align: center;
          color: #7890ad;
        }

        .office-shell-empty strong {
          color: #cbd5e1;
          font-size: 14px;
        }

        .office-shell-empty span {
          max-width: 260px;
          font-size: 11px;
          line-height: 1.6;
        }

        .office-shell-disabled-action {
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(100,116,139,0.20);
          background: rgba(100,116,139,0.07);
          color: #64748b;
          font-weight: 900;
        }

        .office-shell-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 12px;
        }

        .office-shell-setting-row span {
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 800;
        }

        .office-shell-setting-row strong {
          color: #94a3b8;
          font-size: 10px;
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 999px;
          padding: 3px 8px;
          background: rgba(148,163,184,0.07);
        }

        @media (max-width: 860px) {
          .office-shell-topbar {
            grid-template-columns: auto minmax(0, 1fr) auto;
            gap: 8px;
            padding: max(10px, env(safe-area-inset-top)) 10px 9px;
          }

          .office-shell-badges {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }

          .office-shell-main {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(290px, 1fr) auto;
            gap: 10px;
            padding: 10px;
            overflow: hidden;
          }

          .office-shell-map-frame,
          .office-shell-command {
            border-radius: 18px;
          }

          .office-shell-focus {
            width: min(74vw, 360px);
            height: min(25vh, 210px);
            min-width: 220px;
            min-height: 150px;
          }

          .office-zone-node {
            min-width: 44px;
            max-width: 128px;
            min-height: 38px;
            padding: 6px 8px;
            border-radius: 14px;
          }

          .office-zone-copy strong {
            font-size: 10px;
          }

          .office-zone-copy small {
            display: none;
          }

          .office-shell-context-card {
            right: 10px;
            bottom: 10px;
            padding: 9px 10px;
          }

          .office-shell-context-card small {
            display: none;
          }

          .office-shell-quick-state {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .office-shell-command {
            max-height: min(38dvh, 310px);
            border-radius: 18px 18px 0 0;
          }

          .office-shell-panel-body {
            padding-bottom: max(14px, env(safe-area-inset-bottom));
          }
        }

        @media (max-width: 520px) {
          .office-shell-title strong {
            font-size: 13px;
          }

          .office-shell-back {
            padding: 0 9px;
          }

          .office-shell-badges span {
            font-size: 9px;
            min-height: 22px;
            padding: 0 7px;
          }

          .office-shell-main {
            grid-template-rows: minmax(280px, 1fr) auto;
          }

          .office-shell-quick-state {
            grid-template-columns: 1fr;
          }

          .office-zone-node {
            transform: translate(-50%, -50%) scale(0.92);
          }

          .office-zone-node:hover,
          .office-zone-node.is-selected {
            transform: translate(-50%, -50%) scale(0.92) translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}
