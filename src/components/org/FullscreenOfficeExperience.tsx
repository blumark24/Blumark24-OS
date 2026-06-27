"use client";

// FullscreenOfficeExperience — C23-A
// Uses registered interior assets for office entry, with the approved
// external map crop as a safe fallback only when an asset is unavailable.
// Adds a safe scene-control dock below the interior so controls do not cover the office.

import { Activity, ArrowRight, Sparkles, UserCheck, Users, Video, Wand2, X } from "lucide-react";
import { getOfficeInteriorProfile } from "@/lib/virtual-office/officeInteriorProfile";
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
  officePeople,
  onClose,
}: FullscreenOfficeExperienceProps) {
  const officeNum = room.officeNumber ?? 5;
  const crop = OFFICE_CROPS[officeNum] ?? OFFICE_CROPS[5];
  const profile = getOfficeInteriorProfile(officeNum);
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const displayName = officeDisplayName(room, mappingUnit);
  const accent = profile?.accent ?? (room.isCenter ? "#a855f7" : isLinked ? "#10b981" : "#f59e0b");
  const status = room.isCenter ? "مجلس الإدارة" : isLinked ? "مرتبط" : "جاهز للربط";
  const imageSrc = profile?.imageSrc ?? MAP_SRC;
  const usesInteriorAsset = Boolean(profile?.imageSrc);
  const people = Array.isArray(officePeople) ? officePeople : [];
  const presentPeople = people.filter((p) => p.status !== "offline");
  const offlinePeople = people.length - presentPeople.length;
  const shownPeople = people.slice(0, 5);
  const sceneLabel = usesInteriorAsset
    ? `${profile?.nameAr ?? "مكتب داخلي"} · ${profile?.functionAr ?? "مساحة عمل"}`
    : `2D من الأعلى · ${crop.label}`;

  const tools = [
    {
      key: "characters",
      icon: UserCheck,
      label: "الشخصيات",
      value: people.length > 0 ? String(people.length) : "جاهزة",
      hint: people.length > 0 ? "شخصيات مرتبطة بالمكتب" : "تظهر بعد ربط الموظفين",
    },
    {
      key: "employees",
      icon: Users,
      label: "الموظفون",
      value: `${presentPeople.length} حاضر`,
      hint: offlinePeople > 0 ? `${offlinePeople} غير حاضر` : "لا توجد بيانات حضور حقيقية بعد",
    },
    {
      key: "meetings",
      icon: Video,
      label: "الاجتماعات",
      value: "جاهزة",
      hint: "واجهة فقط · لا صوت/فيديو خفي",
    },
    {
      key: "effects",
      icon: Sparkles,
      label: "المؤثرات",
      value: "آمنة",
      hint: "إضاءة وحركة بصرية فقط",
    },
    {
      key: "motion",
      icon: Activity,
      label: "الحركات",
      value: "خفيفة",
      hint: "بدون تتبع سري للحضور",
    },
  ] as const;

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
          <div className="bm-office-portal-subtitle">{`OFFICE ${fmt(officeNum)} · ${sceneLabel}`}</div>
        </div>

        <div className="bm-office-portal-badges">
          <span style={{ border: `1px solid ${accent}44`, background: `${accent}0f`, color: accent }}>{status}</span>
          {isLinked && mappingSource && <span>{sourceLabel[mappingSource]}</span>}
          {profile && <span>{profile.assetId}</span>}
        </div>

        <button type="button" onClick={onClose} aria-label="إغلاق" className="bm-office-portal-close">
          <X size={13} />
        </button>
      </div>

      <main className="bm-office-portal-main">
        <section className="bm-office-scene-stack" aria-label="مشهد المكتب الداخلي وأدوات التشغيل">
          <div className="bm-office-visual-frame">
            <div
              className={usesInteriorAsset ? "bm-office-interior-image" : "bm-office-crop-image"}
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundPosition: usesInteriorAsset ? "center" : crop.position,
              }}
            />

            <div className="bm-office-crop-vignette" />

            <div className="bm-office-crop-pill" style={{ borderColor: `${accent}33`, color: accent }}>
              <span style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
              {`OFFICE ${fmt(officeNum)}`}
            </div>

            <div className="bm-office-presence-strip" aria-label="حالة الحضور داخل المكتب">
              {shownPeople.length > 0 ? shownPeople.map((person) => (
                <span key={person.id} className="bm-office-person-dot" title={`${person.name} · ${person.statusLabel}`}>
                  <i style={{ background: person.statusColor, boxShadow: `0 0 10px ${person.statusColor}88` }} />
                  <b style={{ borderColor: `${person.color}66`, color: person.color }}>{person.initials}</b>
                </span>
              )) : (
                <span className="bm-office-empty-presence">الموظفون يظهرون بعد الربط</span>
              )}
            </div>
          </div>

          <div className="bm-office-control-dock" style={{ borderColor: `${accent}2e` }}>
            <div className="bm-office-dock-summary">
              <div>
                <span style={{ color: accent }}>لوحة تشغيل المكتب</span>
                <strong>{profile?.nameAr ?? displayName}</strong>
              </div>
              <p>{profile?.functionAr ?? "تحكم آمن بالمكتب الافتراضي"} · {isLinked ? "مرتبط بالهيكل" : "جاهز بعد الربط"}</p>
            </div>

            <div className="bm-office-tool-tabs" aria-label="أدوات المكتب">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.key} type="button" className="bm-office-tool-tab">
                    <span className="bm-office-tool-icon" style={{ color: accent }}><Icon size={14} /></span>
                    <span className="bm-office-tool-copy">
                      <b>{tool.label}</b>
                      <small>{tool.value} · {tool.hint}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bm-office-safety-note">
              <Wand2 size={13} />
              الشخصيات والاجتماعات والمؤثرات والحركات واجهة تشغيل آمنة · لا مراقبة سرية · لا صوت/فيديو خفي.
            </div>
          </div>
        </section>
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
          align-items: stretch;
          justify-content: center;
          padding: clamp(10px, 1.7vw, 18px);
          background: radial-gradient(circle at 50% 20%, rgba(34,211,238,0.08), transparent 44%), #020716;
        }
        .bm-office-scene-stack {
          width: min(100%, 1180px);
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          gap: 12px;
        }
        .bm-office-visual-frame {
          position: relative;
          width: min(100%, calc((100dvh - 250px) * 1672 / 941));
          aspect-ratio: ${IMAGE_ASPECT_RATIO};
          max-height: calc(100dvh - 230px);
          justify-self: center;
          align-self: start;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(125,211,252,0.16);
          box-shadow: 0 30px 96px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.025) inset;
          background: #020716;
        }
        .bm-office-interior-image,
        .bm-office-crop-image {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          image-rendering: auto;
        }
        .bm-office-interior-image {
          background-size: cover;
        }
        .bm-office-crop-image {
          background-size: 300% 300%;
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
        .bm-office-presence-strip {
          position: absolute;
          left: 12px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 999px;
          background: rgba(2,7,22,0.58);
          border: 1px solid rgba(125,211,252,0.14);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .bm-office-person-dot {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .bm-office-person-dot i {
          width: 6px;
          height: 6px;
          border-radius: 999px;
        }
        .bm-office-person-dot b {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          font-size: 9px;
          font-weight: 950;
        }
        .bm-office-empty-presence {
          color: #6f86a6;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }
        .bm-office-control-dock {
          min-height: 118px;
          border: 1px solid rgba(34,211,238,0.22);
          border-radius: 18px;
          padding: 12px;
          background: linear-gradient(145deg, rgba(5,14,30,0.82), rgba(2,7,22,0.66));
          box-shadow: 0 24px 70px rgba(0,0,0,0.28), inset 0 0 28px rgba(34,211,238,0.035);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          gap: 12px;
          align-items: stretch;
        }
        .bm-office-dock-summary {
          min-width: 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.035);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .bm-office-dock-summary span {
          display: block;
          font-size: 10px;
          font-weight: 950;
          margin-bottom: 4px;
        }
        .bm-office-dock-summary strong {
          display: block;
          color: #e8fbff;
          font-size: 15px;
          font-weight: 950;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bm-office-dock-summary p {
          margin: 0;
          color: #7f94b2;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.55;
        }
        .bm-office-tool-tabs {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .bm-office-tool-tab {
          min-width: 0;
          min-height: 76px;
          border-radius: 14px;
          border: 1px solid rgba(125,211,252,0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.026));
          color: #dff7ff;
          cursor: default;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          text-align: right;
        }
        .bm-office-tool-icon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(34,211,238,0.08);
          border: 1px solid rgba(34,211,238,0.14);
        }
        .bm-office-tool-copy {
          min-width: 0;
        }
        .bm-office-tool-copy b {
          display: block;
          color: #e8fbff;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bm-office-tool-copy small {
          display: block;
          margin-top: 3px;
          color: #7489a8;
          font-size: 9.5px;
          font-weight: 800;
          line-height: 1.35;
        }
        .bm-office-safety-note {
          grid-column: 1 / -1;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #5f7898;
          font-size: 10px;
          font-weight: 800;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 8px;
        }
        @media (max-width: 860px) {
          .bm-office-scene-stack {
            gap: 10px;
          }
          .bm-office-visual-frame {
            width: min(100%, calc((100dvh - 302px) * 1672 / 941));
            max-height: calc(100dvh - 286px);
          }
          .bm-office-control-dock {
            grid-template-columns: 1fr;
          }
          .bm-office-tool-tabs {
            overflow-x: auto;
            grid-template-columns: repeat(5, minmax(132px, 1fr));
            padding-bottom: 2px;
            scrollbar-width: thin;
            scrollbar-color: rgba(34,211,238,0.38) rgba(2,7,22,0.22);
          }
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
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            align-items: start;
          }
          .bm-office-scene-stack {
            min-height: calc(100dvh - 66px);
            grid-template-rows: auto auto;
          }
          .bm-office-visual-frame {
            width: 100%;
            max-height: 43dvh;
            border-radius: 14px;
          }
          .bm-office-control-dock {
            min-height: 0;
            border-radius: 16px;
            padding: 10px;
          }
          .bm-office-dock-summary {
            padding: 9px 10px;
          }
          .bm-office-tool-tabs {
            grid-template-columns: repeat(5, minmax(126px, 1fr));
            gap: 7px;
          }
          .bm-office-tool-tab {
            min-height: 70px;
            padding: 9px;
          }
          .bm-office-safety-note {
            align-items: flex-start;
            line-height: 1.55;
          }
          .bm-office-presence-strip {
            left: 8px;
            bottom: 8px;
            max-width: calc(100% - 16px);
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}
