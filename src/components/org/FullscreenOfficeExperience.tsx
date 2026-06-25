"use client";

// FullscreenOfficeExperience — C15.8
// Premium fullscreen entry for one selected office only. Keeps the approved
// office modal untouched and renders a compact HUD over the interior scene.

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type {
  MappingSource,
  OfficeRoom,
  PreviewOrgUnit,
  PresencePerson,
} from "./VirtualOfficeDesign";
import SingleOfficeInteriorScene, { type Zone } from "./SingleOfficeInteriorScene";

const sourceLabel: Record<MappingSource, string> = {
  saved: "ربط محفوظ",
  preview: "ربط تجريبي",
  auto: "ربط تلقائي",
};

function formatOfficeNumber(officeNumber?: number | null) {
  return String(officeNumber ?? 0).padStart(2, "0");
}

function officeDisplayName(room: OfficeRoom) {
  if (room.officeNumber) return `مكتب ${formatOfficeNumber(room.officeNumber)}`;
  return room.name ?? "مكتب";
}

function statusBadge(room: OfficeRoom, isLinked: boolean) {
  if (room.isCenter) {
    return {
      label: "مكتب افتراضي",
      color: "#c4b5fd",
      border: "rgba(168,85,247,0.36)",
      bg: "rgba(168,85,247,0.12)",
    };
  }
  if (isLinked) {
    return {
      label: "مكتب مرتبط بالهيكل الإداري",
      color: "#86efac",
      border: "rgba(16,185,129,0.34)",
      bg: "rgba(16,185,129,0.10)",
    };
  }
  return {
    label: "مكتب سحابي جاهز للربط",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.34)",
    bg: "rgba(245,158,11,0.10)",
  };
}

function EmptyHud({ isLinked, mappingUnit, mappingSource }: {
  isLinked: boolean;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: "#5a7898", fontWeight: 900, marginBottom: 4 }}>داخل المكتب</div>
        <div style={{ fontSize: 16, color: "#e8fbff", fontWeight: 900, lineHeight: 1.25 }}>
          تجربة مكتب سحابي واحدة للمكتب المحدد
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "#7892b2", lineHeight: 1.7 }}>
        اختر نقطة مضيئة داخل المشهد لعرض حالة المنطقة بدون بيانات وهمية.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#4f6d8c", fontWeight: 800 }}>الحضور</div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>غير مفعّل</div>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#4f6d8c", fontWeight: 800 }}>المهام</div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>غير متاح</div>
        </div>
      </div>
      <div style={{ border: `1px solid ${isLinked ? "rgba(16,185,129,0.28)" : "rgba(245,158,11,0.28)"}`, background: isLinked ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)", borderRadius: 14, padding: "9px 11px" }}>
        <div style={{ fontSize: 10, color: isLinked ? "#86efac" : "#fbbf24", fontWeight: 900 }}>
          {isLinked ? "مكتب مرتبط بالهيكل الإداري" : "جاهز للربط"}
        </div>
        <div style={{ fontSize: 10, color: "#6f89a8", lineHeight: 1.55, marginTop: 3 }}>
          {isLinked && mappingUnit
            ? `${mappingUnit.name} · ${sourceLabel[mappingSource ?? "auto"]}`
            : "يتم ربط المكتب من الهيكل الإداري باستخدام المنطق الحالي."}
        </div>
      </div>
    </div>
  );
}

function ZoneHud({ zone, mappingUnit, mappingSource, peopleCount }: {
  zone: Zone;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  peopleCount: number;
}) {
  const showLink = zone.id === "office-panel" || zone.id === "admin-link" || zone.id === "digital-twin";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: zone.accent, boxShadow: `0 0 14px ${zone.accent}` }} />
            <span style={{ fontSize: 10, color: "#5a7898", fontWeight: 900 }}>منطقة داخلية</span>
          </div>
          <div style={{ fontSize: 17, color: "#e8fbff", fontWeight: 950, lineHeight: 1.25 }}>{zone.name}</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 10, color: zone.accent, fontWeight: 900, borderRadius: 999, padding: "4px 9px", border: `1px solid ${zone.accent}44`, background: `${zone.accent}12` }}>
          {zone.stateLabel}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "#8ba3c7", lineHeight: 1.75 }}>
        {zone.purpose}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "7px 8px" }}>
          <div style={{ fontSize: 8.5, color: "#4f6d8c", fontWeight: 800 }}>الموظفون</div>
          <div style={{ fontSize: 10.5, color: peopleCount > 0 ? "#86efac" : "#64748b", fontWeight: 900 }}>{peopleCount > 0 ? peopleCount : "غير متاح"}</div>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "7px 8px" }}>
          <div style={{ fontSize: 8.5, color: "#4f6d8c", fontWeight: 800 }}>المهام</div>
          <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 900 }}>غير متاح</div>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "7px 8px" }}>
          <div style={{ fontSize: 8.5, color: "#4f6d8c", fontWeight: 800 }}>الاجتماع</div>
          <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 900 }}>غير مفعّل</div>
        </div>
      </div>
      {showLink && (
        <div style={{ border: "1px solid rgba(34,211,238,0.20)", background: "rgba(34,211,238,0.055)", borderRadius: 14, padding: "9px 11px" }}>
          <div style={{ fontSize: 10, color: "#67e8f9", fontWeight: 900 }}>
            {mappingUnit ? "بيانات ربط حقيقية" : "جاهز بعد الربط"}
          </div>
          <div style={{ fontSize: 10, color: "#6f89a8", lineHeight: 1.55, marginTop: 3 }}>
            {mappingUnit
              ? `${mappingUnit.name} · ${sourceLabel[mappingSource ?? "auto"]}`
              : "يتم تفعيل التوأم الرقمي بعد ربط المكتب بالهيكل الإداري."}
          </div>
        </div>
      )}
      {zone.actionLabel && (
        <div style={{ fontSize: 10, color: "#476684", fontWeight: 800 }}>
          {zone.actionLabel}
        </div>
      )}
    </div>
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
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const displayName = room.isCenter ? "مكتب مجلس الإدارة" : officeDisplayName(room);
  const badge = statusBadge(room, isLinked);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`داخل المكتب — ${displayName}`}
      className="bm-office-portal-shell"
      dir="rtl"
    >
      <div className="bm-office-portal-topbar">
        <button type="button" onClick={onClose} className="bm-office-portal-back">
          <ArrowRight size={14} />
          العودة للمقر
        </button>

        <div className="bm-office-portal-divider" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bm-office-portal-title">{displayName}</div>
          <div className="bm-office-portal-subtitle">نفس المكتب المحدد ولكن من الداخل</div>
        </div>

        <div className="bm-office-portal-badges">
          <span style={{ border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
          <span>الحضور: غير مفعّل</span>
          <span>مكتب افتراضي</span>
        </div>

        <button type="button" onClick={onClose} aria-label="إغلاق" className="bm-office-portal-close">
          <X size={14} />
        </button>
      </div>

      <div className="bm-office-portal-main">
        <SingleOfficeInteriorScene
          isBoard={!!room.isCenter}
          isLinked={isLinked}
          officeNumber={room.officeNumber}
          officeTitle={displayName}
          linkedUnitName={mappingUnit?.name ?? null}
          officePeople={officePeople}
          selectedZone={selectedZone}
          onZoneSelect={setSelectedZone}
        />

        <aside className="bm-office-portal-hud" aria-live="polite">
          {selectedZone ? (
            <ZoneHud
              zone={selectedZone}
              mappingUnit={mappingUnit}
              mappingSource={mappingSource}
              peopleCount={officePeople.length}
            />
          ) : (
            <EmptyHud isLinked={isLinked} mappingUnit={mappingUnit} mappingSource={mappingSource} />
          )}
        </aside>
      </div>

      <style>{`
        .bm-office-portal-shell {
          position: fixed;
          inset: 0;
          z-index: 110;
          display: flex;
          flex-direction: column;
          background: #020716;
          overflow: hidden;
        }
        .bm-office-portal-topbar {
          flex-shrink: 0;
          min-height: 58px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(2,7,22,0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
        }
        .bm-office-portal-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #8ba3c7;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 0;
          flex-shrink: 0;
        }
        .bm-office-portal-divider {
          width: 1px;
          height: 22px;
          background: rgba(255,255,255,0.09);
          flex-shrink: 0;
        }
        .bm-office-portal-title {
          font-size: 14px;
          font-weight: 950;
          color: #e8fbff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bm-office-portal-subtitle {
          font-size: 10px;
          color: #526d8c;
          margin-top: 2px;
        }
        .bm-office-portal-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .bm-office-portal-badges span {
          font-size: 9.5px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,0.24);
          background: rgba(100,116,139,0.07);
          color: #64748b;
        }
        .bm-office-portal-close {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.045);
          color: #8ba3c7;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .bm-office-portal-main {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .bm-office-portal-hud {
          position: absolute;
          top: 22px;
          left: 22px;
          width: min(360px, calc(100vw - 44px));
          max-height: calc(100% - 44px);
          overflow: auto;
          overscroll-behavior: contain;
          border-radius: 24px;
          border: 1px solid rgba(125,211,252,0.18);
          background: linear-gradient(145deg, rgba(5,14,30,0.84), rgba(2,7,22,0.68));
          box-shadow: 0 34px 100px rgba(0,0,0,0.42), inset 0 0 36px rgba(34,211,238,0.045);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          padding: 16px;
          z-index: 18;
        }
        @media (max-width: 760px) {
          .bm-office-portal-topbar {
            align-items: flex-start;
            flex-wrap: wrap;
            min-height: auto;
            padding: 9px 12px;
          }
          .bm-office-portal-badges {
            order: 4;
            width: 100%;
          }
          .bm-office-portal-badges span {
            font-size: 8.5px;
            padding: 3px 7px;
          }
          .bm-office-portal-main {
            min-height: 0;
          }
          .bm-office-portal-hud {
            top: auto;
            left: 10px;
            right: 10px;
            bottom: max(10px, env(safe-area-inset-bottom));
            width: auto;
            max-height: 42dvh;
            border-radius: 22px;
            padding: 13px;
          }
        }
      `}</style>
    </div>
  );
}
