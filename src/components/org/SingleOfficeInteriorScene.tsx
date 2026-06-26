"use client";

// SingleOfficeInteriorScene.tsx — C15.13
// One approved interior visual system is reused for all 9 offices.
// The selected exterior office number is carried inside as OFFICE 01..09,
// so مكتب 01 opens OFFICE 01 internally, مكتب 02 opens OFFICE 02, and so on.
// No missing per-office image files, no fake live data, no new packages.

import { useState } from "react";
import type { PresencePerson } from "./VirtualOfficeDesign";

export type ZoneState =
  | "unavailable"
  | "inactive"
  | "ready_after_link"
  | "needs_activation"
  | "configuring"
  | "coming";

export interface Zone {
  id: string;
  name: string;
  purpose: string;
  state: ZoneState;
  stateLabel: string;
  accent: string;
  sceneX: number;
  sceneY: number;
  actionLabel?: string;
}

interface OfficeInteriorConfig {
  officeNumber: number;
  glowX: string;
  glowY: string;
  accent: string;
  moodLabel: string;
}

const INTERIOR_ASSET = "/virtual-office/interiors/blumark-office-portal-interior.svg";

const OFFICE_INTERIOR_CONFIG: Record<number, OfficeInteriorConfig> = {
  1: { officeNumber: 1, glowX: "76%", glowY: "18%", accent: "#38bdf8", moodLabel: "أعلى يمين" },
  2: { officeNumber: 2, glowX: "50%", glowY: "18%", accent: "#22d3ee", moodLabel: "أعلى وسط" },
  3: { officeNumber: 3, glowX: "24%", glowY: "18%", accent: "#60a5fa", moodLabel: "أعلى يسار" },
  4: { officeNumber: 4, glowX: "76%", glowY: "50%", accent: "#22d3ee", moodLabel: "وسط يمين" },
  5: { officeNumber: 5, glowX: "50%", glowY: "24%", accent: "#a855f7", moodLabel: "مجلس الإدارة" },
  6: { officeNumber: 6, glowX: "24%", glowY: "50%", accent: "#38bdf8", moodLabel: "وسط يسار" },
  7: { officeNumber: 7, glowX: "76%", glowY: "72%", accent: "#10b981", moodLabel: "أسفل يمين" },
  8: { officeNumber: 8, glowX: "50%", glowY: "72%", accent: "#67e8f9", moodLabel: "أسفل وسط" },
  9: { officeNumber: 9, glowX: "24%", glowY: "72%", accent: "#22d3ee", moodLabel: "أسفل يسار" },
};

const fallbackConfig: OfficeInteriorConfig = {
  officeNumber: 0,
  glowX: "50%",
  glowY: "22%",
  accent: "#22d3ee",
  moodLabel: "مكتب سحابي",
};

function formatOfficeNumber(officeNumber?: number | null) {
  return String(officeNumber ?? 0).padStart(2, "0");
}

function getZones(isLinked: boolean, linkedUnitName?: string | null): Zone[] {
  return [
    {
      id: "office-panel",
      name: "لوحة المكتب",
      purpose: linkedUnitName
        ? `تعرض هوية المكتب المرتبط بـ ${linkedUnitName} باستخدام البيانات المتاحة فقط.`
        : "تعرض هوية المكتب وحالته بدون أي بيانات تشغيلية وهمية.",
      state: isLinked ? "ready_after_link" : "configuring",
      stateLabel: isLinked ? "مكتب مرتبط بالهيكل الإداري" : "مكتب سحابي جاهز للربط",
      accent: "#22d3ee",
      sceneX: 50,
      sceneY: 25,
      actionLabel: "عرض الحالة",
    },
    {
      id: "meeting",
      name: "غرفة الاجتماع",
      purpose: "منطقة اجتماعات مستقبلية. لا يتم عرض اجتماعات أو حضور بدون مصدر بيانات حقيقي.",
      state: "inactive",
      stateLabel: "غير مفعّل",
      accent: "#10b981",
      sceneX: 27,
      sceneY: 59,
      actionLabel: "حالة الاجتماع",
    },
    {
      id: "workspace",
      name: "مساحة العمل",
      purpose: "منطقة العمل اليومية. تظهر بيانات الفريق فقط عند توفر ربط حقيقي من النظام.",
      state: "unavailable",
      stateLabel: "غير متاح",
      accent: "#60a5fa",
      sceneX: 70,
      sceneY: 58,
      actionLabel: "بيانات الفريق",
    },
    {
      id: "focus",
      name: "غرفة التركيز",
      purpose: "مساحة هادئة للعمل الفردي داخل المكتب السحابي.",
      state: "coming",
      stateLabel: "قادم",
      accent: "#f59e0b",
      sceneX: 83,
      sceneY: 79,
      actionLabel: "وضع التركيز",
    },
    {
      id: "digital-twin",
      name: "التوأم الرقمي",
      purpose: "يعكس هذا الجدار علاقة المكتب بالإدارة أو القسم والموظفين والمهام بعد الربط.",
      state: "configuring",
      stateLabel: "جاهز بعد الربط",
      accent: "#22d3ee",
      sceneX: 28,
      sceneY: 31,
      actionLabel: "عرض المسار",
    },
    {
      id: "admin-link",
      name: "الربط الإداري",
      purpose: "نقطة الربط بين المكتب والهيكل الإداري. يتم التحكم بها من منطق الهيكل الحالي فقط.",
      state: isLinked ? "ready_after_link" : "needs_activation",
      stateLabel: isLinked ? "مكتب مرتبط بالهيكل الإداري" : "يحتاج تفعيل",
      accent: isLinked ? "#10b981" : "#f59e0b",
      sceneX: 50,
      sceneY: 78,
      actionLabel: "إدارة الربط",
    },
  ];
}

function stateDotColor(zone: Zone) {
  if (zone.state === "ready_after_link") return zone.accent;
  if (zone.state === "needs_activation") return "#f59e0b";
  return zone.state === "inactive" || zone.state === "unavailable" ? "#64748b" : zone.accent;
}

function Hotspot({ zone, selected, onSelect }: { zone: Zone; selected: boolean; onSelect: (zone: Zone | null) => void }) {
  const dot = stateDotColor(zone);

  return (
    <button
      type="button"
      aria-label={zone.name}
      onClick={() => onSelect(selected ? null : zone)}
      style={{
        position: "absolute",
        left: `${zone.sceneX}%`,
        top: `${zone.sceneY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 15,
        minWidth: 42,
        minHeight: 42,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: 999,
          background: `${dot}10`,
          border: `1px solid ${dot}66`,
          boxShadow: selected ? `0 0 34px ${dot}88` : `0 0 20px ${dot}44`,
          animation: "bmOfficePulse 2.7s ease-in-out infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 15,
          borderRadius: 999,
          background: dot,
          boxShadow: `0 0 15px ${dot}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 42,
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          borderRadius: 999,
          padding: "5px 10px",
          border: `1px solid ${dot}44`,
          background: selected ? "rgba(3,10,24,0.94)" : "rgba(3,10,24,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: selected ? "#e8fbff" : "#8ba3c7",
          fontSize: 10,
          fontWeight: 850,
          boxShadow: selected ? `0 14px 36px rgba(0,0,0,0.38), 0 0 26px ${dot}22` : "0 10px 24px rgba(0,0,0,0.26)",
        }}
      >
        {zone.name}
      </span>
    </button>
  );
}

function InteriorAssetLayer({ config, officeNumber, isBoard, isLinked }: { config: OfficeInteriorConfig; officeNumber?: number | null; isBoard: boolean; isLinked: boolean }) {
  const [imgError, setImgError] = useState(false);
  const accent = isBoard ? "#a855f7" : config.accent;
  const number = formatOfficeNumber(officeNumber);

  return (
    <>
      {!imgError ? (
        <img
          src={INTERIOR_ASSET}
          alt=""
          aria-hidden="true"
          onError={() => setImgError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.99,
            transform: "scale(1.01)",
            filter: isBoard ? "saturate(1.12) hue-rotate(8deg)" : "saturate(1.05)",
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #020a1a 0%, #010610 100%)" }} />
      )}

      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${config.glowX} ${config.glowY}, ${accent}32, transparent 34%), linear-gradient(180deg, rgba(2,7,22,0.08), rgba(2,7,22,0.36))` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.10), transparent 34%, rgba(0,0,0,0.42))" }} />

      <div
        style={{
          position: "absolute",
          top: "15.5%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 8,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "rgba(125,211,252,0.78)", fontSize: 11, fontWeight: 950, letterSpacing: 2.8 }}>BLUMARK24 OFFICE PORTAL</div>
        <div style={{ color: "#e8fbff", fontSize: "clamp(30px, 4vw, 56px)", fontWeight: 950, lineHeight: 1, textShadow: `0 0 34px ${accent}44` }}>
          OFFICE {number}
        </div>
        <div style={{ marginTop: 7, color: isLinked ? "#86efac" : "#fbbf24", fontSize: 12, fontWeight: 900 }}>
          {isLinked ? "مكتب مرتبط بالهيكل الإداري" : "مكتب سحابي جاهز للربط"}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "8%",
          transform: "translateX(-50%)",
          zIndex: 7,
          width: "25%",
          height: "15%",
          borderRadius: "50%",
          border: `1px solid ${accent}33`,
          background: `radial-gradient(ellipse at 50% 50%, ${accent}18, transparent 68%)`,
          boxShadow: `0 0 75px ${accent}18`,
          animation: "bmPortalBreath 4.3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function SceneIdentityCard({ officeTitle, officeNumber, isLinked, moodLabel }: { officeTitle?: string; officeNumber?: number | null; isLinked: boolean; moodLabel: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "12%",
        right: "6%",
        zIndex: 14,
        width: "min(250px, 28vw)",
        minWidth: 178,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.11)",
        background: "linear-gradient(145deg, rgba(6,20,39,0.78), rgba(4,12,27,0.34))",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 30px 82px rgba(0,0,0,0.36)",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 9, color: "#5a7898", fontWeight: 950, letterSpacing: 1 }}>داخل المكتب · {moodLabel}</div>
      <div style={{ fontSize: 15, color: "#e8fbff", fontWeight: 950, marginTop: 4 }}>{officeTitle ?? `مكتب ${formatOfficeNumber(officeNumber)}`}</div>
      <div style={{ fontSize: 10, color: isLinked ? "#86efac" : "#fbbf24", fontWeight: 850, marginTop: 6 }}>
        {isLinked ? "مكتب مرتبط بالهيكل الإداري" : "مكتب سحابي جاهز للربط"}
      </div>
    </div>
  );
}

export interface SingleOfficeInteriorSceneProps {
  isBoard: boolean;
  isLinked: boolean;
  officeNumber?: number | null;
  officeTitle?: string;
  linkedUnitName?: string | null;
  officePeople: PresencePerson[];
  selectedZone: Zone | null;
  onZoneSelect: (zone: Zone | null) => void;
}

export default function SingleOfficeInteriorScene({
  isBoard,
  isLinked,
  officeNumber,
  officeTitle,
  linkedUnitName,
  officePeople: _officePeople,
  selectedZone,
  onZoneSelect,
}: SingleOfficeInteriorSceneProps) {
  const config = officeNumber ? OFFICE_INTERIOR_CONFIG[officeNumber] ?? fallbackConfig : fallbackConfig;
  const zones = getZones(isLinked, linkedUnitName);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        userSelect: "none",
        background: "#020716",
        isolation: "isolate",
      }}
      dir="rtl"
    >
      <InteriorAssetLayer config={config} officeNumber={officeNumber} isBoard={isBoard} isLinked={isLinked} />
      <SceneIdentityCard officeTitle={officeTitle} officeNumber={officeNumber} isLinked={isLinked} moodLabel={config.moodLabel} />

      {zones.map((zone) => (
        <Hotspot key={zone.id} zone={zone} selected={selectedZone?.id === zone.id} onSelect={onZoneSelect} />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
          background: "linear-gradient(115deg, transparent 0%, rgba(34,211,238,0.065) 48%, transparent 58%)",
          animation: "bmEntrySweep 1.25s ease-out both",
        }}
      />

      {!selectedZone && (
        <div
          style={{
            position: "absolute",
            bottom: "14%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 14,
            fontSize: 10,
            color: "rgba(139,163,199,0.62)",
            fontWeight: 800,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          اختر نقطة مضيئة داخل المكتب
        </div>
      )}

      <style>{`
        @keyframes bmEntrySweep {
          0% { opacity: 0; transform: translateX(36%); }
          45% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-36%); }
        }
        @keyframes bmOfficePulse {
          0%, 100% { transform: scale(0.84); opacity: 0.56; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes bmPortalBreath {
          0%, 100% { transform: translateX(-50%) scale(0.96); opacity: 0.55; }
          50% { transform: translateX(-50%) scale(1.04); opacity: 0.96; }
        }
        @media (max-width: 720px) {
          button[aria-label] span:last-child { display: none; }
        }
      `}</style>
    </div>
  );
}
