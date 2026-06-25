"use client";

// SingleOfficeInteriorScene.tsx — C15.8
// Premium single-office portal interior. No WebGL, no Three.js, no canvas,
// no new packages, no fake live data.

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
  variant: "executive" | "north" | "east" | "south" | "west";
  glowX: string;
  glowY: string;
  portalTilt: string;
  accent: string;
}

const OFFICE_INTERIOR_CONFIG: Record<number, OfficeInteriorConfig> = {
  1: { officeNumber: 1, variant: "north", glowX: "24%", glowY: "18%", portalTilt: "-7deg", accent: "#22d3ee" },
  2: { officeNumber: 2, variant: "east", glowX: "72%", glowY: "16%", portalTilt: "5deg", accent: "#38bdf8" },
  3: { officeNumber: 3, variant: "south", glowX: "50%", glowY: "72%", portalTilt: "0deg", accent: "#67e8f9" },
  4: { officeNumber: 4, variant: "west", glowX: "18%", glowY: "58%", portalTilt: "-3deg", accent: "#60a5fa" },
  5: { officeNumber: 5, variant: "executive", glowX: "50%", glowY: "20%", portalTilt: "0deg", accent: "#a855f7" },
  6: { officeNumber: 6, variant: "north", glowX: "64%", glowY: "22%", portalTilt: "4deg", accent: "#22d3ee" },
  7: { officeNumber: 7, variant: "west", glowX: "28%", glowY: "64%", portalTilt: "-5deg", accent: "#38bdf8" },
  8: { officeNumber: 8, variant: "east", glowX: "76%", glowY: "48%", portalTilt: "6deg", accent: "#67e8f9" },
  9: { officeNumber: 9, variant: "south", glowX: "52%", glowY: "74%", portalTilt: "0deg", accent: "#22d3ee" },
};

const fallbackConfig: OfficeInteriorConfig = {
  officeNumber: 0,
  variant: "north",
  glowX: "50%",
  glowY: "22%",
  portalTilt: "0deg",
  accent: "#22d3ee",
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
      sceneY: 28,
      actionLabel: "عرض الحالة",
    },
    {
      id: "workspace",
      name: "مساحة العمل",
      purpose: "منطقة العمل اليومية. تظهر بيانات الفريق فقط عند توفر ربط حقيقي من النظام.",
      state: "unavailable",
      stateLabel: "غير متاح",
      accent: "#60a5fa",
      sceneX: 67,
      sceneY: 52,
      actionLabel: "بيانات الفريق",
    },
    {
      id: "meeting",
      name: "غرفة الاجتماع",
      purpose: "منطقة اجتماعات مستقبلية. لا يتم عرض اجتماعات أو حضور بدون مصدر بيانات حقيقي.",
      state: "inactive",
      stateLabel: "غير مفعّل",
      accent: "#10b981",
      sceneX: 26,
      sceneY: 56,
      actionLabel: "حالة الاجتماع",
    },
    {
      id: "focus",
      name: "منطقة التركيز",
      purpose: "مساحة هادئة للعمل الفردي داخل المكتب السحابي.",
      state: "coming",
      stateLabel: "قادم",
      accent: "#f59e0b",
      sceneX: 82,
      sceneY: 72,
      actionLabel: "وضع التركيز",
    },
    {
      id: "digital-twin",
      name: "التوأم الرقمي",
      purpose: "يعكس هذا الجدار علاقة المكتب بالإدارة أو القسم والموظفين والمهام بعد الربط.",
      state: isLinked ? "ready_after_link" : "configuring",
      stateLabel: isLinked ? "جاهز بعد الربط" : "جاهز بعد الربط",
      accent: "#22d3ee",
      sceneX: 29,
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
    {
      id: "settings",
      name: "الإعدادات",
      purpose: "إعدادات المكتب تُدار من نافذة المكتب المعتمدة بدون تغيير تصميمها.",
      state: "configuring",
      stateLabel: "قيد التهيئة",
      accent: "#64748b",
      sceneX: 15,
      sceneY: 76,
      actionLabel: "الإعدادات",
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
        zIndex: 12,
        minWidth: 36,
        minHeight: 36,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: 999,
          background: `${dot}12`,
          border: `1px solid ${dot}55`,
          boxShadow: selected ? `0 0 26px ${dot}66` : `0 0 16px ${dot}33`,
          animation: "bmOfficePulse 2.6s ease-in-out infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: 999,
          background: dot,
          boxShadow: `0 0 12px ${dot}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 35,
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          borderRadius: 999,
          padding: "4px 9px",
          border: `1px solid ${dot}40`,
          background: selected ? "rgba(3,10,24,0.92)" : "rgba(3,10,24,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: selected ? "#e8fbff" : "#8ba3c7",
          fontSize: 10,
          fontWeight: 800,
          boxShadow: selected ? `0 12px 32px rgba(0,0,0,0.35), 0 0 22px ${dot}22` : "0 10px 22px rgba(0,0,0,0.25)",
        }}
      >
        {zone.name}
      </span>
    </button>
  );
}

function DigitalTwinWall({ isLinked, linkedUnitName }: { isLinked: boolean; linkedUnitName?: string | null }) {
  const nodes = ["المنشأة", "الإدارة", "القسم", "الموظفون", "المهام"];
  return (
    <div
      style={{
        position: "absolute",
        top: "9%",
        left: "7%",
        width: "38%",
        height: "30%",
        borderRadius: 22,
        border: "1px solid rgba(34,211,238,0.25)",
        background: "linear-gradient(145deg, rgba(8,20,42,0.78), rgba(2,8,23,0.35))",
        boxShadow: "0 36px 90px rgba(0,0,0,0.34), inset 0 0 44px rgba(34,211,238,0.05)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 24% 24%, rgba(34,211,238,0.18), transparent 36%)" }} />
      <div style={{ position: "relative", padding: "16px 18px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#dff7ff", marginBottom: 3 }}>التوأم الرقمي</div>
          <div style={{ fontSize: 10, color: "#5a7898", lineHeight: 1.5 }}>
            {isLinked && linkedUnitName ? linkedUnitName : "يتم تفعيل التوأم الرقمي بعد ربط المكتب بالهيكل الإداري."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {nodes.map((node, index) => {
            const active = isLinked && index <= 2;
            return (
              <span key={node} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 999,
                    color: active ? "#dff7ff" : "#4d6178",
                    border: active ? "1px solid rgba(34,211,238,0.36)" : "1px solid rgba(100,116,139,0.18)",
                    background: active ? "rgba(34,211,238,0.10)" : "rgba(100,116,139,0.05)",
                  }}
                >
                  {node}
                </span>
                {index < nodes.length - 1 && <span style={{ color: "#1d4458", fontSize: 10 }}>←</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SmartWall({ officeNumber, isLinked }: { officeNumber?: number | null; isLinked: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%) perspective(900px) rotateX(2deg)",
        width: "42%",
        height: "27%",
        borderRadius: 24,
        border: "1px solid rgba(125,211,252,0.30)",
        background: "linear-gradient(140deg, rgba(14,33,60,0.88), rgba(4,12,27,0.52))",
        boxShadow: "0 32px 100px rgba(0,0,0,0.42), 0 0 65px rgba(34,211,238,0.12), inset 0 0 60px rgba(34,211,238,0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.08) 42%, transparent 58%)", animation: "bmWallSweep 5.5s ease-in-out infinite" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ color: "rgba(34,211,238,0.65)", fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>BLUMARK24 OFFICE PORTAL</div>
        <div style={{ color: "#e8fbff", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>OFFICE {formatOfficeNumber(officeNumber)}</div>
        <div style={{ color: isLinked ? "#86efac" : "#fbbf24", fontSize: 11, fontWeight: 800 }}>
          {isLinked ? "مكتب مرتبط بالهيكل الإداري" : "مكتب سحابي جاهز للربط"}
        </div>
      </div>
    </div>
  );
}

function PortalArchitecture({ config, isBoard }: { config: OfficeInteriorConfig; isBoard: boolean }) {
  const accent = isBoard ? "#a855f7" : config.accent;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #020716 0%, #041023 48%, #030817 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(34,211,238,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.035) 1px, transparent 1px)", backgroundSize: "72px 72px", transform: `rotate(${config.portalTilt}) scale(1.08)`, transformOrigin: "center" }} />
      <div style={{ position: "absolute", inset: "-18% -8% 38%", background: `radial-gradient(circle at ${config.glowX} ${config.glowY}, ${accent}28, transparent 42%)` }} />

      {/* Glass side walls */}
      <div style={{ position: "absolute", top: "6%", bottom: "8%", left: "2%", width: "22%", transform: "skewY(-11deg)", borderRadius: 32, border: "1px solid rgba(125,211,252,0.12)", background: "linear-gradient(100deg, rgba(125,211,252,0.10), rgba(2,8,23,0.03))", boxShadow: "inset 0 0 48px rgba(34,211,238,0.04)" }} />
      <div style={{ position: "absolute", top: "6%", bottom: "8%", right: "2%", width: "22%", transform: "skewY(11deg)", borderRadius: 32, border: "1px solid rgba(125,211,252,0.12)", background: "linear-gradient(260deg, rgba(125,211,252,0.10), rgba(2,8,23,0.03))", boxShadow: "inset 0 0 48px rgba(34,211,238,0.04)" }} />

      {/* Cinematic floor */}
      <div style={{ position: "absolute", left: "12%", right: "12%", bottom: "-8%", height: "54%", borderRadius: "50% 50% 0 0", background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.15), rgba(15,23,42,0.30) 35%, rgba(2,6,23,0.86) 74%)", transform: "perspective(820px) rotateX(63deg)", border: "1px solid rgba(125,211,252,0.12)", boxShadow: "0 -34px 88px rgba(34,211,238,0.06), inset 0 0 70px rgba(34,211,238,0.05)" }} />
      <div style={{ position: "absolute", left: "49.7%", bottom: "4%", width: 2, height: "44%", background: `linear-gradient(180deg, transparent, ${accent}88, transparent)`, boxShadow: `0 0 22px ${accent}77`, transform: "perspective(600px) rotateX(56deg)", transformOrigin: "bottom" }} />

      {/* Executive zones, rendered as reflections/portals rather than furniture */}
      <div style={{ position: "absolute", left: "58%", top: "42%", width: "27%", height: "18%", borderRadius: 26, border: "1px solid rgba(96,165,250,0.17)", background: "linear-gradient(145deg, rgba(96,165,250,0.10), rgba(2,8,23,0.15))", boxShadow: "0 34px 80px rgba(0,0,0,0.30), inset 0 0 34px rgba(96,165,250,0.05)", transform: "perspective(650px) rotateX(55deg) rotateZ(-3deg)" }} />
      <div style={{ position: "absolute", left: "12%", top: "48%", width: "27%", height: "18%", borderRadius: 26, border: "1px solid rgba(16,185,129,0.16)", background: "linear-gradient(145deg, rgba(16,185,129,0.09), rgba(2,8,23,0.14))", boxShadow: "0 34px 80px rgba(0,0,0,0.30), inset 0 0 34px rgba(16,185,129,0.05)", transform: "perspective(650px) rotateX(55deg) rotateZ(5deg)" }} />
      <div style={{ position: "absolute", right: "10%", bottom: "13%", width: "18%", height: "18%", borderRadius: 999, border: "1px solid rgba(245,158,11,0.17)", background: "radial-gradient(circle, rgba(245,158,11,0.09), rgba(2,8,23,0.10))", boxShadow: "0 30px 70px rgba(0,0,0,0.28), inset 0 0 32px rgba(245,158,11,0.05)" }} />
      <div style={{ position: "absolute", left: "10%", bottom: "13%", width: "16%", height: "16%", borderRadius: 24, border: "1px solid rgba(100,116,139,0.20)", background: "linear-gradient(145deg, rgba(100,116,139,0.09), rgba(2,8,23,0.12))", boxShadow: "0 30px 70px rgba(0,0,0,0.28)" }} />

      {/* Entry portal */}
      <div style={{ position: "absolute", left: "50%", bottom: "9%", transform: "translateX(-50%)", width: "24%", height: "20%", borderRadius: "50%", border: `1px solid ${accent}33`, background: `radial-gradient(ellipse at 50% 50%, ${accent}16, transparent 62%)`, boxShadow: `0 0 70px ${accent}16`, animation: "bmPortalBreath 4s ease-in-out infinite" }} />
    </>
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
      }}
      dir="rtl"
    >
      <PortalArchitecture config={config} isBoard={isBoard} />
      <DigitalTwinWall isLinked={isLinked} linkedUnitName={linkedUnitName} />
      <SmartWall officeNumber={officeNumber} isLinked={isLinked} />

      <div
        style={{
          position: "absolute",
          top: "13%",
          right: "7%",
          width: "20%",
          minWidth: 170,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 28px 70px rgba(0,0,0,0.30)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontSize: 9, color: "#5a7898", fontWeight: 900, letterSpacing: 1 }}>داخل المكتب</div>
        <div style={{ fontSize: 14, color: "#e8fbff", fontWeight: 900, marginTop: 4 }}>{officeTitle ?? `مكتب ${formatOfficeNumber(officeNumber)}`}</div>
        <div style={{ fontSize: 10, color: isLinked ? "#86efac" : "#fbbf24", fontWeight: 800, marginTop: 6 }}>
          {isLinked ? "مكتب مرتبط بالهيكل الإداري" : "مكتب سحابي جاهز للربط"}
        </div>
      </div>

      {zones.map((zone) => (
        <Hotspot key={zone.id} zone={zone} selected={selectedZone?.id === zone.id} onSelect={onZoneSelect} />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(0,0,0,0.22), transparent 28%, rgba(0,0,0,0.30))",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(115deg, transparent 0%, rgba(34,211,238,0.055) 47%, transparent 58%)",
          animation: "bmEntrySweep 1.3s ease-out both",
        }}
      />

      {!selectedZone && (
        <div
          style={{
            position: "absolute",
            bottom: "14%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            color: "rgba(139,163,199,0.58)",
            fontWeight: 700,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          اختر نقطة مضيئة داخل المكتب
        </div>
      )}

      <style>{`
        @keyframes bmEntrySweep {
          0% { opacity: 0; transform: translateX(34%); }
          45% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-34%); }
        }
        @keyframes bmWallSweep {
          0%, 100% { transform: translateX(90%); opacity: 0; }
          38%, 62% { opacity: 1; }
          100% { transform: translateX(-90%); }
        }
        @keyframes bmOfficePulse {
          0%, 100% { transform: scale(0.84); opacity: 0.58; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes bmPortalBreath {
          0%, 100% { transform: translateX(-50%) scale(0.96); opacity: 0.55; }
          50% { transform: translateX(-50%) scale(1.04); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
