"use client";

// MobileExecutiveOfficeScene.tsx — VIRTUAL-OFFICE-CLOUD-1
// Mobile office map: image overlay with 9 tappable office chips.
// All selection and management is handled by OfficeControlModal in the parent.
// No dead props, no bottom sections, no selected room card.
//
// VIRTUAL-OFFICE-NUMBERING-LOCK-1:
// Office numbers follow the visual 3×3 map order exactly:
// 01 top-left, 02 top-center, 03 top-right,
// 04 middle-left, 05 center/board, 06 middle-right,
// 07 bottom-left, 08 bottom-center, 09 bottom-right.
//
// VIRTUAL-OFFICE-MARKERS-RESPONSIVE-1:
// Mobile shows number + status dot only. Tablet/desktop shows number + short label.
// Detailed data stays in OfficeControlModal, not on top of the map.

import { useState } from "react";
import Image from "next/image";
import { formatOfficeNumber, type SceneRoom } from "./VirtualOfficeReferenceScene";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

// ─── Chip positions — mobile baseline, office-number ordered ─────────────────

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

// ─── Status + labels ─────────────────────────────────────────────────────────

function dotColor(room: SceneRoom): string {
  if (room.isCenter)      return "#a855f7";
  if (room.isUnassigned)  return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

function officeShortLabel(room: SceneRoom): string {
  if (room.isCenter) return "مجلس الإدارة";
  if (room.isUnassigned) return "غير مخصص";
  if (room.isOpen === false) return "مغلق";
  return (room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || "مرتبط");
}

// ─── Office marker ───────────────────────────────────────────────────────────

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
  const officeNumber = formatOfficeNumber(room.officeNumber);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`vo-office-chip vo-office-chip--slot-${room.officeNumber} ${selected ? "vo-office-chip--selected" : ""}`}
      aria-label={`مكتب ${officeNumber}: ${officeShortLabel(room)}`}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        background: selected ? `${accent}24` : "rgba(2,8,23,0.82)",
        border: selected ? `1px solid ${accent}` : `1px solid ${accent}55`,
        boxShadow: selected
          ? `0 0 16px ${accent}45, 0 0 0 1px ${accent}26 inset`
          : "0 1px 7px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}
    >
      <span
        className="vo-office-chip__dot"
        style={{
          background: dot,
          boxShadow: (room.isUnassigned || selected || room.isCenter) ? `0 0 7px ${dot}` : undefined,
        }}
      />
      <span className="vo-office-chip__number">{officeNumber}</span>
      <span
        className="vo-office-chip__label"
        style={{ color: room.isCenter ? "#c4b5fd" : room.isUnassigned ? "#fbbf24" : "#dff7ff" }}
      >
        {officeShortLabel(room)}
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
              alt="خريطة المكتب الافتراضي"
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

          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
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

      <style jsx>{`
        .vo-office-chip {
          position: absolute;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 30px;
          height: 24px;
          padding: 2px 6px;
          border-radius: 10px;
          cursor: pointer;
          color: #e2edf8;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
          touch-action: manipulation;
        }
        .vo-office-chip::before {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 14px;
        }
        .vo-office-chip:active,
        .vo-office-chip--selected {
          transform: translate(-50%, -50%) scale(1.04) !important;
        }
        .vo-office-chip__dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          flex: 0 0 auto;
        }
        .vo-office-chip__number {
          font-size: 9.5px;
          line-height: 1;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: #eef7ff;
        }
        .vo-office-chip__label {
          display: none;
        }

        @media (min-width: 768px) {
          .vo-office-chip {
            height: 28px;
            min-width: 70px;
            max-width: 118px;
            padding: 4px 9px;
            gap: 6px;
            border-radius: 999px;
          }
          .vo-office-chip__number {
            font-size: 10px;
          }
          .vo-office-chip__label {
            display: inline-block;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 10px;
            line-height: 1;
            font-weight: 800;
          }
          .vo-office-chip--slot-1 { top: 15% !important; left: 16% !important; }
          .vo-office-chip--slot-2 { top: 15% !important; left: 50% !important; }
          .vo-office-chip--slot-3 { top: 15% !important; left: 84% !important; }
          .vo-office-chip--slot-4 { top: 47% !important; left: 15% !important; }
          .vo-office-chip--slot-5 { top: 47% !important; left: 50% !important; }
          .vo-office-chip--slot-6 { top: 47% !important; left: 85% !important; }
          .vo-office-chip--slot-7 { top: 82% !important; left: 15% !important; }
          .vo-office-chip--slot-8 { top: 83% !important; left: 50% !important; }
          .vo-office-chip--slot-9 { top: 82% !important; left: 85% !important; }
        }

        @media (min-width: 1180px) {
          .vo-office-chip {
            max-width: 140px;
          }
          .vo-office-chip__label {
            font-size: 10.5px;
          }
        }
      `}</style>
    </div>
  );
}
