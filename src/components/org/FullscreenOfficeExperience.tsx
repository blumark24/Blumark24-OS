"use client";

// FullscreenOfficeExperience — exact 2D top-view office crop.
// Shows the selected office cell from the same external office map.

import { ArrowRight, X } from "lucide-react";
import type { MappingSource, OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";

const MAP_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

const OFFICE_CROPS: Record<number, { position: string; label: string }> = {
  1: { position: "right top", label: "أعلى يمين" },
  2: { position: "center top", label: "أعلى وسط" },
  3: { position: "left top", label: "أعلى يسار" },
  4: { position: "right center", label: "وسط يمين" },
  5: { position: "center center", label: "مجلس الإدارة" },
  6: { position: "left center", label: "وسط يسار" },
  7: { position: "right bottom", label: "أسفل يمين" },
  8: { position: "center bottom", label: "أسفل وسط" },
  9: { position: "left bottom", label: "أسفل يسار" },
};

const sourceLabel: Record<MappingSource, string> = {
  saved: "ربط محفوظ",
  preview: "ربط تجريبي",
  auto: "ربط تلقائي",
};

function fmt(n?: number | null) {
  return String(n ?? 0).padStart(2, "0");
}

function officeDisplayName(room: OfficeRoom, mappingUnit: PreviewOrgUnit | null) {
  if (room.isCenter) return "مجلس الإدارة";
  return mappingUnit?.name ?? room.name ?? `مكتب ${fmt(room.officeNumber)}`;
}

export interface FullscreenOfficeExperienceProps {
  room: OfficeRoom;
  mappingUnit: PreviewOrgUnit | null;
  mappingSource?: MappingSource | null;
  officePeople: PresencePerson[];
  onClose: () => void;
}

export default function FullscreenOfficeExperience({
  room,
  mappingUnit,
  mappingSource,
  officePeople: _officePeople,
  onClose,
}: FullscreenOfficeExperienceProps) {
  const officeNum = room.officeNumber ?? 5;
  const crop = OFFICE_CROPS[officeNum] ?? OFFICE_CROPS[5];
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const displayName = officeDisplayName(room, mappingUnit);
  const accent = room.isCenter ? "#a855f7" : isLinked ? "#10b981" : "#f59e0b";
  const status = room.isCenter ? "مجلس الإدارة" : isLinked ? "مرتبط" : "جاهز للربط";

  return (
    <div role="dialog" aria-modal="true" aria-label={`داخل ${displayName}`} className="bm-office-portal-shell" dir="rtl">
      <div className="bm-office-portal-topbar">
        <button type="button" onClick={onClose} className="bm-office-portal-back">
          <ArrowRight size={14} />
          المقر
        </button>

        <div className="bm-office-portal-divider" />

        <div className="bm-office-portal-titlebox">
          <div className="bm-office-portal-title">{displayName}</div>
          <div className="bm-office-portal-subtitle">{`OFFICE ${fmt(officeNum)} · 2D من الأعلى · ${crop.label}`}</div>
        </div>

        <div className="bm-office-portal-badges">
          <span style={{ border: `1px solid ${accent}44`, background: `${accent}0f`, color: accent }}>{status}</span>
          {isLinked && mappingSource && <span>{sourceLabel[mappingSource]}</span>}
        </div>

        <button type="button" onClick={onClose} aria-label="إغلاق" className="bm-office-portal-close">
          <X size={13} />
        </button>
      </div>

      <main className="bm-office-portal-main">
        <div className="bm-office-crop-frame">
          <div
            className="bm-office-crop-image"
            style={{
              backgroundImage: `url(${MAP_SRC})`,
              backgroundPosition: crop.position,
            }}
          />

          <div className="bm-office-crop-vignette" />

          <div className="bm-office-crop-pill" style={{ borderColor: `${accent}33`, color: accent }}>
            <span style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
            {`OFFICE ${fmt(officeNum)}`}
          </div>
        </div>
      </main>

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
          background: rgba(2,7,22,0.86);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
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
        .bm-office-portal-titlebox {
          flex: 1;
          min-width: 0;
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bm-office-portal-badges {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .bm-office-portal-badges span {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(100,116,139,0.22);
          background: rgba(100,116,139,0.06);
          color: #64748b;
          white-space: nowrap;
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
        .bm-office-portal-main {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2vw, 22px);
          background: radial-gradient(circle at 50% 48%, rgba(34,211,238,0.08), transparent 42%), #020716;
        }
        .bm-office-crop-frame {
          position: relative;
          width: min(100%, calc((100dvh - 92px) * 1672 / 941));
          aspect-ratio: ${IMAGE_ASPECT_RATIO};
          max-height: calc(100dvh - 84px);
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(125,211,252,0.16);
          box-shadow: 0 30px 96px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.025) inset;
          background: #020716;
        }
        .bm-office-crop-image {
          position: absolute;
          inset: 0;
          background-size: 300% 300%;
          background-repeat: no-repeat;
          image-rendering: auto;
        }
        .bm-office-crop-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 88% 78% at 50% 50%, transparent 64%, rgba(2,7,22,0.46) 100%);
        }
        .bm-office-crop-pill {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(2,7,22,0.66);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
          white-space: nowrap;
          pointer-events: none;
        }
        .bm-office-crop-pill span {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .bm-office-portal-topbar {
            padding: 8px 10px;
            min-height: 50px;
            gap: 8px;
          }
          .bm-office-portal-subtitle {
            display: none;
          }
          .bm-office-portal-badges span {
            font-size: 8.5px;
            padding: 3px 7px;
          }
          .bm-office-portal-main {
            padding: 8px;
          }
          .bm-office-crop-frame {
            width: 100%;
            border-radius: 14px;
          }
        }
      `}</style>
    </div>
  );
}
