"use client";

// MobileExecutiveOfficeScene.tsx — VIRTUAL-OFFICE-CLOUD-1
// Mobile office map: image overlay with 9 tappable office chips.
// All selection and management is handled by OfficeControlModal in the parent.
// No dead props, no bottom sections, no selected room card.

import { useState } from "react";
import Image from "next/image";
import { formatOfficeNumber, type SceneRoom } from "./VirtualOfficeReferenceScene";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

// ─── Chip positions — slot-ordered (slot 0 = مكتب01 … slot 8 = مكتب09) ─────

interface ChipPos { top: string; left: string; }
const CHIP_POSITIONS: ChipPos[] = [
  { top: "79%", left: "19%" }, // slot 0 → 01 مبيعات
  { top: "18%", left: "20%" }, // slot 1 → 02 إدارة عليا
  { top: "18%", left: "50%" }, // slot 2 → 03 دعم
  { top: "48%", left: "19%" }, // slot 3 → 04 تسويق
  { top: "48%", left: "50%" }, // slot 4 → 05 مجلس الإدارة (center)
  { top: "48%", left: "82%" }, // slot 5 → 06 مالية
  { top: "80%", left: "51%" }, // slot 6 → 07 تنفيذ
  { top: "79%", left: "82%" }, // slot 7 → 08 AI
  { top: "18%", left: "82%" }, // slot 8 → 09 اجتماعات (top-right)
];

// ─── Health dot color ─────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct >= 85) return "#10b981";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
}

// ─── Office chip ──────────────────────────────────────────────────────────────

function OfficeChip({ room, selected, onClick, position }: {
  room: SceneRoom;
  selected: boolean;
  onClick: () => void;
  position: ChipPos;
}) {
  const accent = room.isCenter ? "#a855f7" : room.isAI ? "#22d3ee" : (room.accentColor ?? "#22d3ee");
  const label  = room.isUnassigned
    ? "غير مخصص"
    : (room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || room.name || "—");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`مكتب ${formatOfficeNumber(room.officeNumber)}`}
      style={{
        position: "absolute",
        top: position.top, left: position.left,
        transform: "translate(-50%, -50%)",
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 7px 3px 5px",
        borderRadius: 999,
        background: selected ? `${accent}28` : "rgba(2,8,23,0.82)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        border: selected ? `1px solid ${accent}` : `1px solid ${accent}55`,
        boxShadow: selected ? `0 0 14px ${accent}55` : "0 1px 4px rgba(0,0,0,0.55)",
        color: "#e5edf8",
        fontSize: 9, fontWeight: 700,
        whiteSpace: "nowrap", cursor: "pointer",
        maxWidth: "44%",
        transition: "all 0.15s ease",
        zIndex: 2,
      }}
    >
      {/* Presence dot */}
      {room.healthPct > 0 && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: hpColor(room.healthPct),
          flexShrink: 0,
        }} />
      )}

      {/* Office number badge */}
      {room.officeNumber != null && (
        <span style={{
          fontSize: 7.5, fontWeight: 800, color: "#cbd5e1",
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(148,163,184,0.25)",
          padding: "0 4px", borderRadius: 4, lineHeight: 1.5,
          fontVariantNumeric: "tabular-nums", flexShrink: 0,
        }}>{formatOfficeNumber(room.officeNumber)}</span>
      )}

      {/* Name */}
      <span style={{
        overflow: "hidden", textOverflow: "ellipsis", maxWidth: 62,
        opacity: room.isUnassigned ? 0.75 : 1,
        fontStyle: room.isUnassigned ? "italic" : "normal",
      }}>{label}</span>
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
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      }}>
        <div style={{
          position: "relative", width: "100%",
          aspectRatio: IMAGE_ASPECT_RATIO, maxHeight: 360,
        }}>
          {!imgFailed ? (
            <Image
              src={IMAGE_SRC}
              alt="خريطة المكتب"
              fill
              sizes="100vw"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #06111f, #050d1c)" }} />
          )}

          {/* Edge vignette */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 95% 95% at 50% 50%, transparent 48%, rgba(0,0,0,0.50) 100%)",
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
