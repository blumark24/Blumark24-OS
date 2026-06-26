"use client";

// MobileExecutiveOfficeScene.tsx — VIRTUAL-OFFICE-CLOUD-1
// Virtual office map with 9 tappable office markers.
// Visual policy:
// - Mobile: top-right compact badge = number + status color only.
// - Tablet/Desktop: top-right compact badge = number + short label + status color.
// - Detailed data stays inside OfficeControlModal after click.
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

// ─── Badge positions — top-right corner of each room ──────────────────────────

interface ChipPos {
  top: string;
  right: string;
}

const CHIP_POSITIONS: ChipPos[] = [
  { top: "8.5%", right: "67%" }, // OFFICE 01 → أعلى يسار
  { top: "8.5%", right: "39%" }, // OFFICE 02 → أعلى وسط
  { top: "8.5%", right: "10%" }, // OFFICE 03 → أعلى يمين
  { top: "36.5%", right: "67%" }, // OFFICE 04 → وسط يسار
  { top: "40.5%", right: "39%" }, // OFFICE 05 → مجلس الإدارة / الوسط الثابت
  { top: "36.5%", right: "10%" }, // OFFICE 06 → وسط يمين
  { top: "68.5%", right: "67%" }, // OFFICE 07 → أسفل يسار
  { top: "70.5%", right: "39%" }, // OFFICE 08 → أسفل وسط
  { top: "68.5%", right: "10%" }, // OFFICE 09 → أسفل يمين
];

// ─── Status / labels ──────────────────────────────────────────────────────────

function dotColor(room: SceneRoom): string {
  if (room.isCenter) return "#a855f7";
  if (room.isUnassigned) return "#f59e0b";
  if (room.isOpen === false) return "#64748b";
  return "#10b981";
}

function officeShortLabel(room: SceneRoom): string {
  if (room.isCenter) return "مجلس الإدارة";
  if (room.isUnassigned) return "غير مخصص";
  if (room.isOpen === false) return "مغلق";
  return (room.name?.replace(/^مكتب\s+\d+\s*/, "").trim() || "مرتبط");
}

// ─── Office badge ─────────────────────────────────────────────────────────────

function OfficeChip({
  room,
  selected,
  onClick,
  position,
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
      : room.isOpen === false
        ? "#64748b"
        : (room.accentColor ?? "#10b981");

  const officeNumber = formatOfficeNumber(room.officeNumber);
  const label = officeShortLabel(room);
  const dot = dotColor(room);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`vo-office-chip ${selected ? "vo-office-chip--selected" : ""}`}
      aria-label={`مكتب ${officeNumber}: ${label}`}
      style={{
        position: "absolute",
        top: position.top,
        right: position.right,
        background: selected ? `${accent}22` : "rgba(2, 8, 23, 0.74)",
        border: selected ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
        boxShadow: selected
          ? `0 0 14px ${accent}40, 0 0 0 1px ${accent}22 inset`
          : "0 1px 6px rgba(0,0,0,0.34)",
      }}
    >
      <span className="vo-office-chip__number">{officeNumber}</span>
      <span className="vo-office-chip__label">{label}</span>
      <span
        className="vo-office-chip__dot"
        style={{
          background: dot,
          boxShadow: `0 0 6px ${dot}99`,
        }}
      />
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
          boxShadow: "0 12px 40px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.03) inset",
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
              alt="خريطة المكتب الافتراضي"
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 46%, rgba(0,0,0,0.55) 100%)",
            }}
          />

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
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 34px;
          height: 22px;
          padding: 2px 6px;
          border-radius: 999px;
          cursor: pointer;
          color: #eaf4ff;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s ease;
          touch-action: manipulation;
        }

        .vo-office-chip::before {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 999px;
        }

        .vo-office-chip:hover,
        .vo-office-chip:active,
        .vo-office-chip--selected {
          transform: scale(1.04);
        }

        .vo-office-chip__number {
          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: #eef7ff;
          flex: 0 0 auto;
        }

        .vo-office-chip__label {
          display: none;
        }

        .vo-office-chip__dot {
          width: 5.5px;
          height: 5.5px;
          border-radius: 999px;
          flex: 0 0 auto;
        }

        @media (min-width: 768px) {
          .vo-office-chip {
            min-width: 88px;
            max-width: 146px;
            height: 26px;
            padding: 3px 9px;
            gap: 5px;
          }

          .vo-office-chip__number {
            font-size: 9.5px;
          }

          .vo-office-chip__label {
            display: inline-block;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 9.5px;
            line-height: 1;
            font-weight: 800;
            color: #dff7ff;
          }

          .vo-office-chip__dot {
            width: 6px;
            height: 6px;
          }
        }

        @media (min-width: 1180px) {
          .vo-office-chip {
            max-width: 156px;
          }

          .vo-office-chip__label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
