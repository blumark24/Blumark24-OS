"use client";

// MobileExecutiveOfficeScene.tsx — VIRTUAL-OFFICE-CLOUD-1
// Mobile office map: image overlay with 9 tappable office chips.
// All selection and management is handled by OfficeControlModal in the parent.
// No dead props, no bottom sections, no selected room card.
//
// C14-M4 / PR402 visual behavior:
// Default state shows clean status dots only to keep the office map premium.
// When a room is selected, the marker expands to number + short label.
//
// VIRTUAL-OFFICE-NUMBERING-LOCK-1:
// Office numbers follow the visual 3×3 map order exactly:
// 01 top-left, 02 top-center, 03 top-right,
// 04 middle-left, 05 center/board, 06 middle-right,
// 07 bottom-left, 08 bottom-center, 09 bottom-right.

import { useState } from "react";
import Image from "next/image";
import { formatOfficeNumber, type SceneRoom } from "./VirtualOfficeReferenceScene";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

// ─── Dot positions — office-number ordered, matching the 3×3 map ─────────────

interface ChipPos { top: string; left: string; }
const CHIP_POSITIONS: ChipPos[] = [
  { top: "18%", left: "20%" }, // OFFICE 01 → أعلى يسار
  { top: "18%", left: "50%" }, // OFFICE 02 → أعلى وسط
  { top: "18%", left: "82%" }, // OFFICE 03 → أعلى يمين
  { top: "48%", left: "19%" }, // OFFICE 04 → وسط يسار
  { top: "48%", left: "50%" }, // OFFICE 05 → مجلس الإدارة / الوسط الثابت
  { top: "48%", left: "82%" }, // OFFICE 06 → وسط يمين
  { top: "79%", left: "19%" }, // OFFICE 07 → أسفل يسار
  { top: "80%", left: "51%" }, // OFFICE 08 → أسفل وسط
  { top: "79%", left: "82%" }, // OFFICE 09 → أسفل يمين
];

// ─── Status dot color ─────────────────────────────────────────────────────────

function dotColor(room: SceneRoom): string {
  if (room.isCenter) return "#a855f7";
  if (room.isUnassigned) return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

function shortLabel(room: SceneRoom): string {
  if (room.isCenter) return "مجلس الإدارة";
  if (room.isUnassigned) return "جاهز للتشغيل";
  if (room.isOpen === false) return "مغلق";
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
      aria-label={`مكتب ${formatOfficeNumber(room.officeNumber)}: ${shortLabel(room)}`}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        // 48px minimum tap target via padding; visual stays clean when not selected.
        padding: selected ? "7px 11px" : "12px",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        borderRadius: selected ? 12 : "50%",
        background: selected ? `${accent}22` : "transparent",
        backdropFilter: selected ? "blur(10px)" : undefined,
        WebkitBackdropFilter: selected ? "blur(10px)" : undefined,
        border: selected ? `1.5px solid ${accent}` : "none",
        boxShadow: selected ? `0 0 18px ${accent}55, 0 0 6px ${accent}33` : "none",
        cursor: "pointer",
        transition: "all 0.18s ease",
        zIndex: 2,
      }}
    >
      {selected ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dot,
              flexShrink: 0,
              boxShadow: `0 0 6px ${dot}`,
            }} />
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
              background: `${accent}20`,
              border: `1px solid ${accent}55`,
              padding: "1px 5px",
              borderRadius: 5,
              lineHeight: 1.5,
              fontVariantNumeric: "tabular-nums",
            }}>
              {formatOfficeNumber(room.officeNumber)}
            </span>
          </div>
          <span style={{
            fontSize: 8.5,
            fontWeight: 700,
            color: room.isCenter ? "#c4b5fd" : room.isUnassigned ? "#fbbf24" : "#e2edf8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 68,
            marginTop: 1,
          }}>
            {shortLabel(room)}
          </span>
        </>
      ) : (
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          display: "block",
          boxShadow: room.isUnassigned ? `0 0 6px ${dot}88` : `0 0 3px ${dot}55`,
        }} />
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
        position: "relative",
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
        background: "#06111f",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}>
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: IMAGE_ASPECT_RATIO,
          maxHeight: "clamp(380px, 52vw, 640px)",
        }}>
          {!imgFailed ? (
            <Image
              src={IMAGE_SRC}
              alt="خريطة المكتب الافتراضي"
              fill
              sizes="(max-width: 860px) 100vw, 82vw"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
          ) : (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, #060d1c 0%, #04091a 100%)",
            }} />
          )}

          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 46%, rgba(0,0,0,0.55) 100%)",
          }} />

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
