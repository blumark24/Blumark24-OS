"use client";

// FullscreenOfficeExperience — C15.11
// 2D top-down: zooms into the clicked office's exact area on the external map image.
// Same visual DNA as the external map. No interior scene, no 3D, no CSS furniture.
// Minimal overlays: label pill + compact status note only.

import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type {
  MappingSource,
  OfficeRoom,
  PreviewOrgUnit,
  PresencePerson,
} from "./VirtualOfficeDesign";

// ─── Office center positions (mirrors CHIP_POSITIONS, fractions 0–1) ─────────

const OFFICE_POS: Array<{ top: number; left: number }> = [
  { top: 0.79, left: 0.19 }, // 01
  { top: 0.18, left: 0.20 }, // 02
  { top: 0.18, left: 0.50 }, // 03
  { top: 0.48, left: 0.19 }, // 04
  { top: 0.48, left: 0.50 }, // 05 — مجلس الإدارة (center, fixed)
  { top: 0.48, left: 0.82 }, // 06
  { top: 0.80, left: 0.51 }, // 07
  { top: 0.79, left: 0.82 }, // 08
  { top: 0.18, left: 0.82 }, // 09
];

const MAP_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMG_ASPECT = 1672 / 941; // natural image aspect ratio
const ZOOM = 3.0;

const sourceLabel: Record<MappingSource, string> = {
  saved: "ربط محفوظ",
  preview: "ربط تجريبي",
  auto: "ربط تلقائي",
};

function fmt(n?: number | null) {
  return String(n ?? 0).padStart(2, "0");
}

// ─── Zoom origin hook ─────────────────────────────────────────────────────────
// Measures the container and computes the transformOrigin that centers image
// point (px, py) in the viewport, correctly accounting for objectFit:contain
// letterboxing in both portrait and landscape containers.

function useZoomOrigin(
  containerRef: React.RefObject<HTMLDivElement | null>,
  px: number,
  py: number,
): string {
  const [origin, setOrigin] = useState(`${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`);

  useEffect(() => {
    function compute() {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;

      let ox: number, oy: number;
      if (width / height >= IMG_ASPECT) {
        // Container wider than image ratio → letterbox left/right, image fills height
        const iw = height * IMG_ASPECT;
        const xOff = (width - iw) / 2;
        ox = (xOff + px * iw) / width;
        oy = py;
      } else {
        // Container taller than image ratio → letterbox top/bottom, image fills width
        const ih = width / IMG_ASPECT;
        const yOff = (height - ih) / 2;
        ox = px;
        oy = (yOff + py * ih) / height;
      }

      setOrigin(`${(ox * 100).toFixed(2)}% ${(oy * 100).toFixed(2)}%`);
    }

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, px, py]);

  return origin;
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface FullscreenOfficeExperienceProps {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  officePeople: PresencePerson[];
  onClose: () => void;
}

export default function FullscreenOfficeExperience({
  room, mappingUnit, mappingSource, officePeople: _p, onClose,
}: FullscreenOfficeExperienceProps) {
  const officeNum = room.officeNumber ?? 5;
  const pos = OFFICE_POS[officeNum - 1] ?? { top: 0.50, left: 0.50 };
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;

  const displayName = room.isCenter
    ? "مجلس الإدارة"
    : mappingUnit?.name ?? room.name ?? `مكتب ${fmt(officeNum)}`;

  const accent = room.isCenter ? "#a855f7" : isLinked ? "#10b981" : "#f59e0b";

  const heroRef = useRef<HTMLDivElement>(null);
  const origin = useZoomOrigin(heroRef, pos.left, pos.top);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`داخل ${displayName}`}
      className="bm-office-portal-shell"
      dir="rtl"
    >
      {/* ── TOP BAR ── */}
      <div className="bm-office-portal-topbar">
        <button type="button" onClick={onClose} className="bm-office-portal-back">
          <ArrowRight size={14} />
          المقر
        </button>

        <div className="bm-office-portal-divider" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bm-office-portal-title">{displayName}</div>
          <div className="bm-office-portal-subtitle">{`OFFICE ${fmt(officeNum)} · عرض من الأعلى`}</div>
        </div>

        <div className="bm-office-portal-badges">
          <span
            style={{
              border: `1px solid ${accent}44`,
              background: `${accent}0f`,
              color: accent,
            }}
          >
            {room.isCenter ? "مجلس الإدارة" : isLinked ? "مرتبط" : "يحتاج ربط"}
          </span>
          {isLinked && mappingSource && (
            <span>{sourceLabel[mappingSource]}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="bm-office-portal-close"
        >
          <X size={13} />
        </button>
      </div>

      {/* ── MAP ZOOM HERO ── */}
      <div
        ref={heroRef}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
          background: "#020716",
        }}
      >
        {/* Scalable image layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${ZOOM})`,
            transformOrigin: origin,
            transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
            willChange: "transform",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MAP_SRC}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Edge vignette — blends into dark background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 76% at 50% 50%, transparent 42%, rgba(2,7,22,0.85) 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Office label — small pill, top-center */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 11px",
              borderRadius: 999,
              background: "rgba(2,7,22,0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: `1px solid ${accent}33`,
              color: accent,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 6px ${accent}`,
                flexShrink: 0,
              }}
            />
            {`OFFICE ${fmt(officeNum)}`}
          </span>
        </div>

        {/* Status note — compact, bottom-center */}
        <div
          style={{
            position: "absolute",
            bottom: "max(14px, env(safe-area-inset-bottom))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(2,7,22,0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#4a6480",
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {isLinked
              ? `مرتبط بـ ${mappingUnit?.name ?? "—"} · الحضور غير متاح`
              : "اربط المكتب لتفعيل البيانات · لا توجد بيانات وهمية"}
          </span>
        </div>
      </div>

      <style>{`
        .bm-office-portal-shell {
          position: fixed;
          inset: 0;
          z-index: 110;
          display: flex;
          flex-direction: column;
          background: #020716;
          overflow: hidden;
        }
        .bm-office-portal-topbar {
          flex-shrink: 0;
          min-height: 52px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(2,7,22,0.84);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
          flex-wrap: wrap;
        }
        .bm-office-portal-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #8ba3c7;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 0;
          flex-shrink: 0;
        }
        .bm-office-portal-divider {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .bm-office-portal-title {
          font-size: 14px;
          font-weight: 950;
          color: #e8fbff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bm-office-portal-subtitle {
          font-size: 9.5px;
          color: #3a5570;
          margin-top: 2px;
        }
        .bm-office-portal-badges {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .bm-office-portal-badges span {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,0.22);
          background: rgba(100,116,139,0.06);
          color: #64748b;
        }
        .bm-office-portal-close {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #8ba3c7;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .bm-office-portal-topbar {
            padding: 9px 12px;
            min-height: auto;
          }
          .bm-office-portal-badges {
            order: 4;
            width: 100%;
          }
          .bm-office-portal-title { font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
