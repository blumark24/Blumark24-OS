"use client";

// MobileExecutiveOfficeScene.tsx — VIRTUAL-OFFICE-CLOUD-1
// Mobile office map: image overlay with 9 tappable office chips.
// All selection and management is handled by OfficeControlModal in the parent.
// No dead props, no bottom sections, no selected room card.
//
// C14-M4: map-first. Chips default to number + status dot only.
// Short name appears only on the selected chip to avoid covering the map.

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
  { top: "48%", left: "50%" }, // slot 4 → 05 مجلس الإدارة (center)
  { top: "48%", left: "82%" }, // slot 5 → 06
  { top: "80%", left: "51%" }, // slot 6 → 07
  { top: "79%", left: "82%" }, // slot 7 → 08
  { top: "18%", left: "82%" }, // slot 8 → 09
];

// ─── Status dot color ─────────────────────────────────────────────────────────

function dotColor(room: SceneRoom): string {
  if (room.isCenter)      return "#a855f7";
  if (room.isUnassigned)  return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

// Short label shown only when the chip is selected.
function shortLabel(room: SceneRoom): string {
  if (room.isCenter)     return "مجلس الإدارة";
  if (room.isUnassigned) return "جاهز للتشغيل";
  if (room.isOpen === false) return "مغلق";
  // Strip leading "مكتب NN " prefix if present, return mapped name
  return (room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || "مفتوح");
}

// ─── Office chip ──────────────────────────────────────────────────────────────

function OfficeChip({ room, selected, onClick, position }: {
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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`مكتب ${formatOfficeNumber(room.officeNumber)}`}
      style={{
        position: "absolute",
        top: position.top, left: position.left,
        transform: "translate(-50%, -50%)",
        // Minimum 48×48px effective tap area via padding
        padding: selected ? "6px 10px" : "8px 10px",
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
        borderRadius: 12,
        background: selected
          ? `${accent}22`
          : "rgba(2,8,23,0.80)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: selected
          ? `1.5px solid ${accent}`
          : `1px solid ${accent}44`,
        boxShadow: selected
          ? `0 0 18px ${accent}55, 0 0 6px ${accent}33`
          : "0 1px 6px rgba(0,0,0,0.60)",
        cursor: "pointer",
        transition: "all 0.18s ease",
        zIndex: 2,
        minWidth: 36,
      }}
    >
      {/* Number + dot — always visible */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{
          width: selected ? 7 : 6,
          height: selected ? 7 : 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          boxShadow: (room.isUnassigned || selected) ? `0 0 6px ${dot}` : undefined,
          transition: "all 0.18s ease",
        }} />
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: selected ? "#fff" : "#b0c4d8",
          background: selected ? `${accent}20` : "rgba(255,255,255,0.08)",
          border: `1px solid ${selected ? accent + "55" : "rgba(148,163,184,0.20)"}`,
          padding: "1px 5px", borderRadius: 5,
          lineHeight: 1.5, fontVariantNumeric: "tabular-nums",
          transition: "all 0.18s ease",
        }}>
          {formatOfficeNumber(room.officeNumber)}
        </span>
      </div>

      {/* Short name — visible only when selected */}
      {selected && (
        <span style={{
          fontSize: 8.5, fontWeight: 700,
          color: room.isCenter ? "#c4b5fd" : room.isUnassigned ? "#fbbf24" : "#e2edf8",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 68,
          marginTop: 1,
        }}>
          {shortLabel(room)}
        </span>
      )}
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
      <div style={{
        position: "relative", width: "100%",
        borderRadius: 18, overflow: "hidden",
        background: "#06111f",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}>
        <div style={{
          position: "relative", width: "100%",
          aspectRatio: IMAGE_ASPECT_RATIO, maxHeight: 380,
        }}>
          {!imgFailed ? (
            <Image
              src={IMAGE_SRC}
              alt="خريطة المكتب التنفيذي"
              fill
              sizes="(max-width: 860px) 100vw, 860px"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(160deg, #060d1c 0%, #04091a 100%)",
            }} />
          )}

          {/* Edge vignette */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 46%, rgba(0,0,0,0.55) 100%)",
          }} />

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
