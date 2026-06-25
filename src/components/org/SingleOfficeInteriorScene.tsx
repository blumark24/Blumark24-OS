"use client";

// SingleOfficeInteriorScene.tsx — C15.7
// CSS/HTML 2.5D office interior. No WebGL, no Three.js, no new packages.
// Regular office: dark floor, back wall screens, desks, meeting corner, focus pod.
// Board office: command wall, oval table, DT panel, AI pod.

import type { PresencePerson } from "./VirtualOfficeDesign";

// ─── Zone model ───────────────────────────────────────────────────────────────

export type ZoneState =
  | "ready_after_link"
  | "needs_link"
  | "informational"
  | "command"
  | "coming_soon";

export interface Zone {
  id: string;
  name: string;
  purpose: string;
  state: ZoneState;
  stateLabel: string;
  accent: string;
  sceneX: number; // % in scene container
  sceneY: number;
}

// ─── Zone definitions ─────────────────────────────────────────────────────────

export const BOARD_ZONES: Zone[] = [
  {
    id: "board-chamber",
    name: "غرفة مجلس الإدارة",
    purpose: "اجتماعات القرار العليا والمراجعة الاستراتيجية للشركة",
    state: "command",
    stateLabel: "مركز القيادة",
    accent: "#a855f7",
    sceneX: 50,
    sceneY: 44,
  },
  {
    id: "board-kpi",
    name: "مؤشرات الأداء",
    purpose: "متابعة KPIs وأداء المكاتب والأقسام بشكل لحظي",
    state: "needs_link",
    stateLabel: "يحتاج ربط",
    accent: "#f59e0b",
    sceneX: 78,
    sceneY: 18,
  },
  {
    id: "board-dt",
    name: "التوأم الرقمي",
    purpose: "تمثيل رقمي لهيكل الشركة والخريطة التنظيمية",
    state: "informational",
    stateLabel: "تجريبي",
    accent: "#22d3ee",
    sceneX: 18,
    sceneY: 52,
  },
  {
    id: "board-ai",
    name: "مساعد التشغيل الذكي",
    purpose: "مساعدة ذكاء اصطناعي للقرارات التشغيلية — يتطلب تفعيل",
    state: "coming_soon",
    stateLabel: "قريباً",
    accent: "#a855f7",
    sceneX: 80,
    sceneY: 62,
  },
  {
    id: "board-decision",
    name: "مركز القرار",
    purpose: "توثيق القرارات والمخرجات الاستراتيجية للمجلس",
    state: "coming_soon",
    stateLabel: "قريباً",
    accent: "#64748b",
    sceneX: 50,
    sceneY: 82,
  },
];

export function getOfficeZones(isLinked: boolean): Zone[] {
  return [
    {
      id: "zone-workspace",
      name: "مساحة العمل",
      purpose: "مكاتب الفريق وشاشات العمل اليومي",
      state: isLinked ? "ready_after_link" : "needs_link",
      stateLabel: isLinked ? "جاهز" : "يحتاج ربط",
      accent: "#22d3ee",
      sceneX: 50,
      sceneY: 32,
    },
    {
      id: "zone-meeting",
      name: "غرفة الاجتماع",
      purpose: "اجتماعات الفريق والعروض التقديمية",
      state: "coming_soon",
      stateLabel: "قريباً",
      accent: "#10b981",
      sceneX: 20,
      sceneY: 65,
    },
    {
      id: "zone-focus",
      name: "غرفة التركيز",
      purpose: "عمل فردي مكثف بدون انقطاع",
      state: "coming_soon",
      stateLabel: "قريباً",
      accent: "#f59e0b",
      sceneX: 80,
      sceneY: 62,
    },
    {
      id: "zone-panel",
      name: "لوحة المكتب",
      purpose: "إعدادات المكتب وربط الموظفين والمهام",
      state: isLinked ? "informational" : "needs_link",
      stateLabel: isLinked ? "مرتبط" : "يحتاج ربط",
      accent: "#64748b",
      sceneX: 50,
      sceneY: 82,
    },
  ];
}

// ─── Zone pin ─────────────────────────────────────────────────────────────────

function ZonePin({
  zone,
  selected,
  onSelect,
}: {
  zone: Zone;
  selected: boolean;
  onSelect: (z: Zone | null) => void;
}) {
  const dot =
    zone.state === "command" || zone.state === "ready_after_link"
      ? zone.accent
      : zone.state === "informational"
      ? zone.accent
      : zone.state === "needs_link"
      ? "#f59e0b"
      : "#64748b";

  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : zone)}
      aria-label={zone.name}
      style={{
        position: "absolute",
        left: `${zone.sceneX}%`,
        top: `${zone.sceneY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        minHeight: 36,
        padding: "4px 10px",
        borderRadius: 18,
        border: selected
          ? `1.5px solid ${zone.accent}`
          : `1px solid ${zone.accent}55`,
        background: selected
          ? `${zone.accent}28`
          : "rgba(2,8,23,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: selected
          ? `0 0 16px ${zone.accent}44, 0 0 4px ${zone.accent}22`
          : "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          boxShadow: `0 0 5px ${dot}99`,
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: selected ? "#fff" : "#8ba3c7",
          whiteSpace: "nowrap",
        }}
      >
        {zone.name}
      </span>
    </button>
  );
}

// ─── Regular office interior ──────────────────────────────────────────────────

function RegularOfficeScene() {
  return (
    <>
      {/* Floor */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #040c18 0%, #050e1c 55%, #07111f 100%)",
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          backgroundPosition: "0 0",
        }}
      />

      {/* Back wall */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "38%",
          background:
            "linear-gradient(180deg, #060f1e 0%, #040c18 100%)",
          borderBottom: "1px solid rgba(34,211,238,0.10)",
        }}
      />

      {/* Main screen — back wall center */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "36%",
          height: "20%",
          borderRadius: 6,
          border: "1.5px solid rgba(34,211,238,0.30)",
          background: "rgba(34,211,238,0.04)",
          boxShadow:
            "0 0 28px rgba(34,211,238,0.12), inset 0 0 20px rgba(34,211,238,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 7,
            color: "rgba(34,211,238,0.35)",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          BLUMARK24 OS
        </div>
      </div>

      {/* Side screens */}
      {[{ left: "10%", w: "16%" }, { right: "10%", w: "16%" }].map(
        (pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "6%",
              left: pos.left,
              right: pos.right as string | undefined,
              width: pos.w,
              height: "14%",
              borderRadius: 4,
              border: "1px solid rgba(34,211,238,0.15)",
              background: "rgba(34,211,238,0.02)",
              boxShadow: "0 0 12px rgba(34,211,238,0.06)",
            }}
          />
        )
      )}

      {/* Desks row */}
      {[22, 50, 78].map((left, i) => (
        <div key={i} style={{ position: "absolute", top: "42%", left: `${left}%`, transform: "translateX(-50%)" }}>
          {/* Desk surface */}
          <div
            style={{
              width: 72,
              height: 38,
              borderRadius: 6,
              background: "linear-gradient(160deg, #0d1f35 0%, #0a1828 100%)",
              border: "1px solid rgba(34,211,238,0.14)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            {/* Monitor */}
            <div
              style={{
                position: "absolute",
                top: -22,
                left: "50%",
                transform: "translateX(-50%)",
                width: 42,
                height: 22,
                borderRadius: 3,
                border: "1px solid rgba(34,211,238,0.22)",
                background: "rgba(34,211,238,0.05)",
                boxShadow: "0 0 10px rgba(34,211,238,0.08)",
              }}
            />
            {/* Monitor stand */}
            <div
              style={{
                position: "absolute",
                top: 2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 6,
                background: "rgba(34,211,238,0.12)",
              }}
            />
          </div>
        </div>
      ))}

      {/* Meeting corner — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "13%",
          transform: "translateX(-50%)",
        }}
      >
        {/* Round table */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "1.5px solid rgba(16,185,129,0.25)",
            background: "rgba(16,185,129,0.04)",
            boxShadow: "0 0 20px rgba(16,185,129,0.08)",
            position: "relative",
          }}
        >
          {/* Chairs around table */}
          {[0, 51, 102, 154, 205, 256, 308].map((deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "1px solid rgba(16,185,129,0.20)",
                background: "rgba(16,185,129,0.06)",
                top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 32}px - 5px)`,
                left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 32}px - 5px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Focus pod — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: "9%",
          right: "10%",
        }}
      >
        {/* Focus ring */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            border: "1px solid rgba(245,158,11,0.18)",
            background: "rgba(245,158,11,0.03)",
            boxShadow: "0 0 16px rgba(245,158,11,0.06)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Mini desk */}
          <div
            style={{
              width: 32,
              height: 20,
              borderRadius: 4,
              border: "1px solid rgba(245,158,11,0.20)",
              background: "rgba(245,158,11,0.04)",
            }}
          />
        </div>
      </div>

      {/* Office panel — bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: "4%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "28%",
          height: "8%",
          borderRadius: 8,
          border: "1px solid rgba(100,116,139,0.22)",
          background: "rgba(100,116,139,0.05)",
          boxShadow: "0 0 14px rgba(100,116,139,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 4,
              borderRadius: 2,
              background: "rgba(100,116,139,0.25)",
            }}
          />
        ))}
      </div>

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "30%",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// ─── Board office interior ────────────────────────────────────────────────────

function BoardOfficeScene() {
  return (
    <>
      {/* Floor */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #06030f 0%, #08041a 55%, #09051e 100%)",
        }}
      />

      {/* Purple grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* Ceiling glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "40%",
          background:
            "radial-gradient(ellipse at 50% -20%, rgba(168,85,247,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Back wall */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(180deg, #0a0420 0%, #06030f 100%)",
          borderBottom: "1px solid rgba(168,85,247,0.12)",
        }}
      />

      {/* Command wall — 3 screens */}
      {[
        { left: "16%", w: "22%", accent: "#a855f7" },
        { left: "50%", w: "28%", accent: "#c084fc" },
        { left: "84%", w: "22%", accent: "#a855f7" },
      ].map(({ left, w, accent }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "5%",
            left: left,
            transform: "translateX(-50%)",
            width: w,
            height: "22%",
            borderRadius: 5,
            border: `1.5px solid ${accent}40`,
            background: `${accent}06`,
            boxShadow: `0 0 24px ${accent}18, inset 0 0 16px ${accent}06`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {i === 1 && (
            <div
              style={{
                fontSize: 7,
                color: `${accent}55`,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              BOARD HQ
            </div>
          )}
          {/* Abstract data lines */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
            {[20, 40, 60].map((top) => (
              <div
                key={top}
                style={{
                  position: "absolute",
                  top: `${top}%`,
                  left: "12%",
                  right: "12%",
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Oval board table */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "58%",
          height: "28%",
          borderRadius: "50%",
          border: "2px solid rgba(168,85,247,0.28)",
          background:
            "linear-gradient(160deg, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0.02) 100%)",
          boxShadow:
            "0 0 40px rgba(168,85,247,0.14), inset 0 0 24px rgba(168,85,247,0.04)",
        }}
      />

      {/* Board table chairs (8) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const rx = 37, ry = 21; // % radii relative to scene
        const cx = 50 + rx * Math.cos(angle);
        const cy = 52 + ry * Math.sin(angle);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${cx}%`,
              top: `${cy}%`,
              transform: "translate(-50%,-50%)",
              width: 14,
              height: 10,
              borderRadius: 4,
              border: "1px solid rgba(168,85,247,0.22)",
              background: "rgba(168,85,247,0.06)",
            }}
          />
        );
      })}

      {/* DT panel — left */}
      <div
        style={{
          position: "absolute",
          top: "36%",
          left: "6%",
          width: "14%",
          height: "32%",
          borderRadius: 8,
          border: "1px solid rgba(34,211,238,0.22)",
          background: "rgba(34,211,238,0.04)",
          boxShadow: "0 0 20px rgba(34,211,238,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Node graph */}
        <svg width="100%" height="100%" viewBox="0 0 60 80" style={{ opacity: 0.5 }}>
          <circle cx="30" cy="16" r="4" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <circle cx="14" cy="44" r="3" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <circle cx="46" cy="44" r="3" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <circle cx="30" cy="66" r="3" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <line x1="30" y1="20" x2="14" y2="41" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="20" x2="46" y2="41" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
          <line x1="14" y1="47" x2="30" y2="63" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
          <line x1="46" y1="47" x2="30" y2="63" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
        </svg>
      </div>

      {/* AI pod — right */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          right: "5%",
          width: "12%",
          height: "26%",
          borderRadius: 8,
          border: "1px solid rgba(168,85,247,0.22)",
          background: "rgba(168,85,247,0.04)",
          boxShadow: "0 0 16px rgba(168,85,247,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Concentric rings */}
        <svg width="100%" height="100%" viewBox="0 0 52 52" style={{ opacity: 0.5 }}>
          <circle cx="26" cy="26" r="20" fill="none" stroke="#a855f7" strokeWidth="0.8" />
          <circle cx="26" cy="26" r="13" fill="none" stroke="#a855f7" strokeWidth="0.8" />
          <circle cx="26" cy="26" r="6" fill="none" stroke="#a855f7" strokeWidth="1" />
          <circle cx="26" cy="26" r="2" fill="#a855f7" opacity="0.6" />
        </svg>
      </div>

      {/* Decision center — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "4%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "32%",
          height: "8%",
          borderRadius: 8,
          border: "1px solid rgba(100,116,139,0.20)",
          background: "rgba(100,116,139,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 4,
              borderRadius: 2,
              background: "rgba(100,116,139,0.22)",
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface SingleOfficeInteriorSceneProps {
  isBoard: boolean;
  isLinked: boolean;
  officePeople: PresencePerson[];
  selectedZone: Zone | null;
  onZoneSelect: (zone: Zone | null) => void;
}

export default function SingleOfficeInteriorScene({
  isBoard,
  isLinked,
  officePeople: _officePeople,
  selectedZone,
  onZoneSelect,
}: SingleOfficeInteriorSceneProps) {
  const zones = isBoard ? BOARD_ZONES : getOfficeZones(isLinked);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        userSelect: "none",
      }}
      dir="rtl"
    >
      {isBoard ? <BoardOfficeScene /> : <RegularOfficeScene />}

      {/* Zone pins */}
      {zones.map((zone) => (
        <ZonePin
          key={zone.id}
          zone={zone}
          selected={selectedZone?.id === zone.id}
          onSelect={onZoneSelect}
        />
      ))}

      {/* Empty state hint */}
      {!selectedZone && (
        <div
          style={{
            position: "absolute",
            bottom: "17%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            color: "rgba(139,163,199,0.45)",
            fontWeight: 500,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          اضغط على منطقة لعرض تفاصيلها
        </div>
      )}
    </div>
  );
}
