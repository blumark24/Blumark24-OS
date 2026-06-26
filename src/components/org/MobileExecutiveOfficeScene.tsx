"use client";

// MobileExecutiveOfficeScene.tsx — C15.11
// Image-based office map for all viewport sizes.
// Each chip = transparent tap area centered on the office position.
// A compact badge sits in the top-right corner of the tap area at all times.
// Mobile:      badge = number + status dot
// md/desktop:  badge = number + name (or غير مخصص) + status dot
// Selection:   glow/border only — no content expansion over the map.

import { useState } from "react";
import Image from "next/image";
import { formatOfficeNumber, type SceneRoom } from "./VirtualOfficeReferenceScene";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

// ─── Chip positions — slot-ordered (slot 0 = مكتب01 … slot 8 = مكتب09) ─────

interface ChipPos { top: string; left: string; }
const CHIP_POSITIONS: ChipPos[] = [
  { top: "79%", left: "19%" }, // slot 0 → 01
  { top: "18%", left: "20%" }, // slot 1 → 02
  { top: "18%", left: "50%" }, // slot 2 → 03
  { top: "48%", left: "19%" }, // slot 3 → 04
  { top: "48%", left: "50%" }, // slot 4 → 05  مجلس الإدارة (center — fixed)
  { top: "48%", left: "82%" }, // slot 5 → 06
  { top: "80%", left: "51%" }, // slot 6 → 07
  { top: "79%", left: "82%" }, // slot 7 → 08
  { top: "18%", left: "82%" }, // slot 8 → 09
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dotColor(room: SceneRoom): string {
  if (room.isCenter)         return "#a855f7";
  if (room.isUnassigned)     return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

function badgeName(room: SceneRoom): string {
  if (room.isCenter)         return "مجلس الإدارة";
  if (room.isUnassigned)     return "غير مخصص";
  if (room.isOpen === false) return "مغلق";
  return room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || "—";
}

// ─── Office chip ──────────────────────────────────────────────────────────────

function OfficeChip({
  room, selected, onClick, position,
}: {
  room: SceneRoom;
  selected: boolean;
  onClick: () => void;
  position: ChipPos;
}) {
  const accent = room.isCenter
    ? "#a855f7"
    : room.isUnassigned
    ? "#f59e0b"
    : (room.accentColor ?? "#22d3ee");
  const dot = dotColor(room);
  const name = badgeName(room);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`مكتب ${formatOfficeNumber(room.officeNumber)}`}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        // Center the tap area on the office position
        transform: "translate(-50%, -50%)",
        // Fixed tap area — large enough for touch, small enough not to overlap
        width: 80,
        height: 60,
        minWidth: 80,
        minHeight: 60,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        zIndex: 2,
        // Selected: subtle glow ring around the tap area
        borderRadius: 14,
        outline: selected ? `1.5px solid ${accent}88` : "none",
        boxShadow: selected
          ? `0 0 22px ${accent}55, 0 0 8px ${accent}33`
          : "none",
        transition: "outline 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Status dot — always at center of tap area */}
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
          boxShadow: selected
            ? `0 0 10px ${dot}, 0 0 4px ${dot}88`
            : `0 0 4px ${dot}88`,
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      />

      {/* Badge — always visible, top-right of tap area */}
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
          background: selected
            ? `${accent}28`
            : "rgba(3,8,20,0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: selected
            ? `1px solid ${accent}88`
            : `1px solid rgba(255,255,255,0.10)`,
          boxShadow: selected
            ? `0 0 10px ${accent}44`
            : "0 1px 6px rgba(0,0,0,0.50)",
          transition: "all 0.15s ease",
          maxWidth: 90,
          pointerEvents: "none",
        }}
      >
        {/* Office number */}
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: selected ? "#fff" : "#b0c4d8",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {formatOfficeNumber(room.officeNumber)}
        </span>

        {/* Name — hidden on mobile, visible on md+ */}
        <span
          className="hidden md:inline"
          style={{
            fontSize: 8,
            fontWeight: 600,
            color: room.isCenter
              ? "#c4b5fd"
              : room.isUnassigned
              ? "#fbbf24"
              : "#8ba3c7",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 56,
          }}
        >
          {name}
        </span>

        {/* Status dot inside badge */}
        <span
          aria-hidden
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: dot,
            flexShrink: 0,
            boxShadow: `0 0 4px ${dot}`,
          }}
        />
      </span>
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface MobileExecutiveOfficeSceneProps {
  rooms: SceneRoom[];
  onRoomClick: (room: SceneRoom) => void;
  selectedRoomId?: string | null;
}

export default function MobileExecutiveOfficeScene({
  rooms,
  onRoomClick,
  selectedRoomId,
}: MobileExecutiveOfficeSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 18,
          overflow: "hidden",
          background: "#06111f",
          border: "1px solid rgba(148,163,184,0.12)",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: IMAGE_ASPECT_RATIO,
            maxHeight: "clamp(380px, 52vw, 640px)",
          }}
        >
          {!imgFailed ? (
            <Image
              src={IMAGE_SRC}
              alt="خريطة المكتب التنفيذي"
              fill
              sizes="(max-width: 860px) 100vw, 82vw"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(160deg, #060d1c 0%, #04091a 100%)",
              }}
            />
          )}

          {/* Edge vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 46%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* Office chips — all 9 */}
          {rooms.map((room, i) => {
            const pos = CHIP_POSITIONS[i];
            if (!pos) return null;
            return (
              <OfficeChip
                key={room.id}
                room={room}
                selected={room.id === selectedRoomId}
                onClick={() => onRoomClick(room)}
                position={pos}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
