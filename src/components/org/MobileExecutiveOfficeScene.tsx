"use client";

import { useState } from "react";
import Image from "next/image";
import { formatOfficeNumber, type SceneRoom } from "./VirtualOfficeReferenceScene";
// C16.3-D — safe motion adapter for office chips.
import {
  useVirtualOfficeMotionStyle,
  type VirtualOfficeMotionStyleResult,
} from "@/lib/virtual-office/useVirtualOfficeMotion";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

interface ChipPos { top: string; left: string; }
const CHIP_POSITIONS: ChipPos[] = [
  { top: "18%", left: "82%" }, // 01 أعلى يمين
  { top: "18%", left: "50%" }, // 02 أعلى وسط
  { top: "18%", left: "20%" }, // 03 أعلى يسار
  { top: "48%", left: "82%" }, // 04 وسط يمين
  { top: "48%", left: "50%" }, // 05 الوسط / مجلس الإدارة
  { top: "48%", left: "19%" }, // 06 وسط يسار
  { top: "79%", left: "82%" }, // 07 أسفل يمين
  { top: "80%", left: "51%" }, // 08 أسفل وسط
  { top: "79%", left: "19%" }, // 09 أسفل يسار
];

function dotColor(room: SceneRoom): string {
  if (room.isCenter) return "#a855f7";
  if (room.isUnassigned) return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

function badgeName(room: SceneRoom): string {
  if (room.isCenter) return "مجلس الإدارة";
  if (room.isUnassigned) return "غير مخصص";
  if (room.isOpen === false) return "مغلق";
  return room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || "—";
}

function OfficeChip({ room, selected, onClick, position }: {
  room: SceneRoom;
  selected: boolean;
  onClick: () => void;
  position: ChipPos;
}) {
  const accent = room.isCenter ? "#a855f7" : room.isUnassigned ? "#f59e0b" : (room.accentColor ?? "#22d3ee");
  const dot = dotColor(room);
  const name = badgeName(room);

  // C16.3-D — safe motion adapter.
  // The chip's coordinate transform (translate(-50%, -50%)) must NEVER change,
  // otherwise the office hotspot drifts. We therefore feed the motion hook for
  // state tracking (and reduced-motion handling) but only apply the safe
  // visual properties — opacity, outline, transition — to the button. The
  // motion adapter's own `transform` is intentionally discarded here.
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const motionState: Parameters<typeof useVirtualOfficeMotionStyle>[0] = {
    state: isHovered ? "hover" : isFocused ? "focus" : "idle",
  };
  const motion: VirtualOfficeMotionStyleResult = useVirtualOfficeMotionStyle(motionState);
  const interactive = isHovered || isFocused;
  // Selection outline keeps priority; otherwise we fall back to the adapter's
  // safe outline so reduced-motion users still get a clear interaction cue.
  const interactionOutline = selected
    ? `1.5px solid ${accent}88`
    : interactive
      ? (motion.style.outline ?? `1.5px solid ${accent}55`)
      : "none";
  const interactionShadow = selected
    ? `0 0 22px ${accent}55, 0 0 8px ${accent}33`
    // Light hover-only glow; reduced motion users won't see the shadow
    // animation either because transition is taken from the adapter.
    : interactive && !motion.reducedMotion
      ? `0 0 14px ${accent}55, 0 0 6px ${accent}33`
      : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={`مكتب ${formatOfficeNumber(room.officeNumber)}`}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        // Keep the chip's coordinate transform locked. Do not blend the
        // motion adapter transform here — it must remain translate(-50%, -50%).
        transform: "translate(-50%, -50%)",
        width: 80,
        height: 60,
        minWidth: 80,
        minHeight: 60,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        zIndex: 2,
        borderRadius: 14,
        // Safe properties from the motion adapter:
        opacity: motion.style.opacity,
        outline: interactionOutline,
        boxShadow: interactionShadow,
        transition: motion.style.transition ?? "outline 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: selected ? 11 : 8,
          height: selected ? 11 : 8,
          borderRadius: "50%",
          background: dot,
          boxShadow: selected ? `0 0 10px ${dot}, 0 0 4px ${dot}88` : `0 0 4px ${dot}88`,
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          borderRadius: 999,
          padding: "2px 6px 2px 5px",
          background: selected ? `${accent}28` : "rgba(3,8,20,0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: selected ? `1px solid ${accent}88` : `1px solid rgba(255,255,255,0.10)`,
          boxShadow: selected ? `0 0 10px ${accent}44` : "0 1px 6px rgba(0,0,0,0.50)",
          transition: "all 0.15s ease",
          maxWidth: 90,
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: 8.5, fontWeight: 800, color: selected ? "#fff" : "#b0c4d8", fontVariantNumeric: "tabular-nums", lineHeight: 1, flexShrink: 0 }}>
          {formatOfficeNumber(room.officeNumber)}
        </span>
        <span className="hidden md:inline" style={{ fontSize: 8, fontWeight: 600, color: room.isCenter ? "#c4b5fd" : room.isUnassigned ? "#fbbf24" : "#8ba3c7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 56 }}>
          {name}
        </span>
        <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: `0 0 4px ${dot}` }} />
      </span>
    </button>
  );
}

export interface MobileExecutiveOfficeSceneProps {
  rooms: SceneRoom[];
  onRoomClick: (room: SceneRoom) => void;
  selectedRoomId?: string | null;
}

export default function MobileExecutiveOfficeScene({ rooms, onRoomClick, selectedRoomId }: MobileExecutiveOfficeSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", borderRadius: 18, overflow: "hidden", background: "#06111f", border: "1px solid rgba(148,163,184,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.03) inset" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: IMAGE_ASPECT_RATIO, maxHeight: "clamp(380px, 52vw, 640px)" }}>
          {!imgFailed ? (
            <Image src={IMAGE_SRC} alt="خريطة المكتب الافتراضي" fill sizes="(max-width: 860px) 100vw, 82vw" style={{ objectFit: "contain", objectPosition: "center" }} onError={() => setImgFailed(true)} priority />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #060d1c 0%, #04091a 100%)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 46%, rgba(0,0,0,0.55) 100%)" }} />
          {rooms.map((room, i) => {
            const pos = CHIP_POSITIONS[i];
            if (!pos) return null;
            return <OfficeChip key={room.id} room={room} selected={room.id === selectedRoomId} onClick={() => onRoomClick(room)} position={pos} />;
          })}
        </div>
      </div>
    </div>
  );
}
