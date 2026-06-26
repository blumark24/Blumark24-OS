"use client";

// FullscreenOfficeExperience — exact 2D top-view office crop.
// Shows the selected office cell from the same external office map.

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { MappingSource, OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";
import { buildOfficeInteriorProfile } from "@/lib/virtual-office/officeInteriorProfile";
import { buildTextMeetingRoom } from "@/lib/virtual-office/textMeetingRoom";

const MAP_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";
const CLOSE_MOTION_MS = 170;

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
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const displayName = officeDisplayName(room, mappingUnit);
  const interior = buildOfficeInteriorProfile({
    officeNumber: officeNum,
    officeName: displayName,
    isBoard: room.isCenter,
    isUnassigned: room.isUnassigned,
  });
  const interiorAssetSrc = interior.canOpenInterior ? interior.assetSrc : null;
  const isInteriorAssetMode = Boolean(interiorAssetSrc);
  const accent = room.isCenter ? "#a855f7" : isLinked ? "#10b981" : "#f59e0b";
  const status = room.isCenter ? "مجلس الإدارة" : isLinked ? "مرتبط" : "جاهز للربط";
  const safePeople = Array.isArray(officePeople) ? officePeople : [];
  const personaPeople = safePeople.slice(0, 5);
  const personaOverflow = Math.max(0, safePeople.length - personaPeople.length);
  const textRoom = buildTextMeetingRoom({
    officeNumber: officeNum,
    officeName: displayName,
    audience: room.isCenter ? "owner" : "manager",
    isBoard: room.isCenter,
    isUnassigned: room.isUnassigned,
    hasApproval: true,
    requiresApproval: false,
    participantCount: safePeople.length,
    topic: "تنسيق متابعة المكتب",
  });
  const openTasks = room.openTasks ?? 0;
  const overdueTasks = room.overdueTasks ?? 0;
  const healthPct = room.healthPct ?? 0;
  const panelStats = [
    { label: "أعضاء", value: String(safePeople.length), color: "#22d3ee" },
    { label: "مهام", value: String(openTasks), color: "#10b981" },
    { label: "متأخرة", value: String(overdueTasks), color: overdueTasks > 0 ? "#f59e0b" : "#64748b" },
    { label: "صحة", value: `${healthPct}%`, color: healthPct > 0 ? accent : "#64748b" },
  ] as const;
  const textRoomAgenda = textRoom.agenda.slice(0, 3);
  const textRoomDecisions = textRoom.canOpenTextRoom
    ? ["جاهز لتدوين القرار", "لا إرسال خارجي", "اعتماد داخلي فقط"]
    : [textRoom.actionLabel, "لا يتم فتح غرفة", "لا توجد محاكاة وهمية"];
  const textRoomFollowUps = textRoom.canOpenTextRoom
    ? ["تحديث المهام", "تحديد المسؤول", "إغلاق المتابعة"]
    : ["استكمال الربط", "تأكيد الصلاحية", "إعادة الفحص"];

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const selectedPersona = personaPeople.find((person) => person.id === selectedPersonaId) ?? personaPeople[0] ?? null;

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, CLOSE_MOTION_MS);
  }, [isClosing, onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label={`داخل ${displayName}`} className={`bm-office-portal-shell ${isClosing ? "is-closing" : "is-opening"}`} dir="rtl">
      <div className="bm-office-portal-topbar">
        <button type="button" onClick={handleClose} className="bm-office-portal-back">
          <ArrowRight size={14} />
          المقر
        </button>

        <div className="bm-office-portal-divider" />

        <div className="bm-office-portal-titlebox">
          <div className="bm-office-portal-title">{displayName}</div>
          <div className="bm-office-portal-subtitle">{`OFFICE ${fmt(officeNum)} · ${isInteriorAssetMode ? "مكتب داخلي" : "2D من الأعلى"} · ${crop.label}`}</div>
        </div>

        <div className="bm-office-portal-badges">
          <span style={{ border: `1px solid ${accent}44`, background: `${accent}0f`, color: accent }}>{status}</span>
          {isInteriorAssetMode && <span>صورة داخلية محفوظة</span>}
          {isLinked && mappingSource && <span>{sourceLabel[mappingSource]}</span>}
        </div>

        <button type="button" onClick={handleClose} aria-label="إغلاق" className="bm-office-portal-close">
          <X size={13} />
        </button>
      </div>

      <main className="bm-office-portal-main">
        <div className="bm-office-crop-frame">
          <div
            className="bm-office-crop-image"
            style={{
              backgroundImage: interiorAssetSrc
                ? `url(${interiorAssetSrc}), url(${MAP_SRC})`
                : `url(${MAP_SRC})`,
              backgroundPosition: interiorAssetSrc
                ? `center center, ${crop.position}`
                : crop.position,
              backgroundSize: interiorAssetSrc
                ? "cover, 300% 300%"
                : "300% 300%",
            }}
          />

          <div className="bm-office-crop-vignette" />

          <div className="bm-office-crop-pill" style={{ borderColor: `${accent}33`, color: accent }}>
            <span style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
            {`OFFICE ${fmt(officeNum)}`}
          </div>

          {personaPeople.length > 0 && (
            <div className="bm-office-persona-stage" aria-label="تموضع الشخصيات داخل المكتب">
              {personaPeople.slice(0, 3).map((person, index) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedPersonaId(person.id)}
                  className={selectedPersona?.id === person.id ? "is-selected" : ""}
                  aria-label={`${person.name} · غير متاح`}
                  style={{ borderColor: `${person.color}55`, color: person.color }}
                >
                  <span>{person.initials}</span>
                  <small>{index === 0 ? "قيادة" : index === 1 ? "تنسيق" : "متابعة"}</small>
                </button>
              ))}
            </div>
          )}

          <section className="bm-office-command-panel" aria-label="لوحة المكتب الداخلي" style={{ borderColor: `${accent}26` }}>
            <div className="bm-office-command-kicker" style={{ color: accent }}>مكتب داخلي</div>
            <h3>{displayName}</h3>
            <p>{interior.detail}</p>

            <div className="bm-office-command-stats">
              {panelStats.map((item) => (
                <div key={item.label}>
                  <span style={{ color: item.color }}>{item.value}</span>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>

            <div className="bm-office-command-room" style={{ borderColor: `${accent}22`, background: `${accent}08` }}>
              <div>
                <strong>{textRoom.canOpenTextRoom ? "غرفة نصية جاهزة" : "الغرفة النصية مقيدة"}</strong>
                <span>{textRoom.canOpenTextRoom ? textRoom.topic : textRoom.actionLabel}</span>
              </div>
              <em style={{ color: textRoom.canOpenTextRoom ? "#10b981" : "#f59e0b" }}>
                {textRoom.canOpenTextRoom ? "آمنة" : "تحتاج إجراء"}
              </em>
            </div>

            <div className="bm-office-text-room-workspace" aria-label="مساحة الغرفة النصية">
              <div className="bm-office-text-room-head">
                <strong>مساحة الغرفة النصية</strong>
                <span>{textRoom.participantLabel}</span>
              </div>
              <div className="bm-office-text-room-grid">
                <div>
                  <small>الأجندة</small>
                  {textRoomAgenda.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div>
                  <small>القرارات</small>
                  {textRoomDecisions.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div>
                  <small>مهام بعد الاجتماع</small>
                  {textRoomFollowUps.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            </div>

            <div className="bm-office-persona-deck" aria-label="شخصيات المكتب">
              <div className="bm-office-persona-head">
                <strong>الشخصيات</strong>
                <span>حالة صريحة: غير متاح</span>
              </div>
              {personaPeople.length > 0 ? (
                <>
                  <div className="bm-office-persona-list">
                    {personaPeople.map((person) => {
                      const isSelected = selectedPersona?.id === person.id;
                      return (
                        <button
                          type="button"
                          key={person.id}
                          aria-pressed={isSelected}
                          aria-label={`${person.name} · غير متاح`}
                          className={isSelected ? "is-selected" : ""}
                          onClick={() => setSelectedPersonaId(person.id)}
                        >
                          <b style={{ borderColor: `${person.color}44`, background: `${person.color}18`, color: person.color }}>
                            {person.initials}
                          </b>
                          <div>
                            <strong>{person.name}</strong>
                            <span>{person.roleOrUnit ?? displayName}</span>
                          </div>
                          <em>غير متاح</em>
                        </button>
                      );
                    })}
                    {personaOverflow > 0 && <small>{`+${personaOverflow} آخرين داخل نفس المكتب`}</small>}
                  </div>

                  {selectedPersona && (
                    <div className="bm-office-persona-focus" aria-label="بطاقة الشخصية المحددة">
                      <strong>{selectedPersona.name}</strong>
                      <span>{selectedPersona.roleOrUnit ?? displayName}</span>
                      <em>عرض فقط · غير متاح · لا تتبع</em>
                    </div>
                  )}
                </>
              ) : (
                <p className="bm-office-persona-empty">تظهر الشخصيات بعد ربط موظفين بهذا المكتب.</p>
              )}
            </div>

            <div className="bm-office-command-people">
              <span>أعضاء المكتب</span>
              <div>
                {safePeople.length > 0 ? safePeople.slice(0, 4).map((person) => (
                  <b key={person.id} title={person.name} style={{ borderColor: `${person.color}44`, background: `${person.color}18`, color: person.color }}>
                    {person.initials}
                  </b>
                )) : <small>جاهز بعد الربط</small>}
              </div>
            </div>

            <p className="bm-office-command-note">لا صوت · لا فيديو · لا حضور لحظي</p>
          </section>
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
          animation: bm-office-shell-in 140ms ease-out both;
        }
        .bm-office-portal-shell.is-closing { animation: bm-office-shell-out 160ms ease-in both; }
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
          animation: bm-office-topbar-in 180ms ease-out both;
        }
        .bm-office-portal-shell.is-closing .bm-office-portal-topbar { opacity: 0; transform: translateY(-4px); transition: opacity 140ms ease, transform 140ms ease; }
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
          transition: color 140ms ease, transform 140ms ease;
        }
        .bm-office-portal-back:hover { color: #c8daf0; transform: translateX(1px); }
        .bm-office-portal-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); flex-shrink: 0; }
        .bm-office-portal-titlebox { flex: 1; min-width: 0; }
        .bm-office-portal-title { font-size: 14px; font-weight: 950; color: #e8fbff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-portal-subtitle { font-size: 9.5px; color: #3a5570; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-portal-badges { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .bm-office-portal-badges span { font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(100,116,139,0.22); background: rgba(100,116,139,0.06); color: #64748b; white-space: nowrap; }
        .bm-office-portal-close { width: 32px; height: 32px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #8ba3c7; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: border-color 140ms ease, background 140ms ease, color 140ms ease, transform 140ms ease; }
        .bm-office-portal-close:hover { border-color: rgba(125,211,252,0.24); background: rgba(125,211,252,0.08); color: #dbeafe; transform: translateY(-1px); }
        .bm-office-portal-main { position: relative; flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: clamp(10px, 2vw, 22px); background: radial-gradient(circle at 50% 48%, rgba(34,211,238,0.08), transparent 42%), #020716; }
        .bm-office-crop-frame { position: relative; width: min(100%, calc((100dvh - 92px) * 1672 / 941)); aspect-ratio: ${IMAGE_ASPECT_RATIO}; max-height: calc(100dvh - 84px); overflow: hidden; border-radius: 18px; border: 1px solid rgba(125,211,252,0.16); box-shadow: 0 30px 96px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.025) inset; background: #020716; animation: bm-office-frame-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: center center; transition: opacity 150ms ease, transform 150ms ease, filter 150ms ease; }
        .bm-office-portal-shell.is-closing .bm-office-crop-frame { opacity: 0; transform: scale(0.992); filter: saturate(0.9) brightness(0.82); }
        .bm-office-crop-image { position: absolute; inset: 0; background-size: 300% 300%; background-repeat: no-repeat; image-rendering: auto; animation: bm-office-image-settle 280ms ease-out both; transform-origin: center center; }
        .bm-office-crop-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 88% 78% at 50% 50%, transparent 64%, rgba(2,7,22,0.46) 100%); }
        .bm-office-crop-pill { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: rgba(2,7,22,0.66); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; white-space: nowrap; pointer-events: none; animation: bm-office-pill-in 190ms 70ms ease-out both; }
        .bm-office-crop-pill span { width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; }
        .bm-office-persona-stage { position: absolute; left: 14px; bottom: 14px; display: flex; align-items: flex-end; gap: 8px; pointer-events: auto; animation: bm-office-panel-in 220ms 120ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .bm-office-persona-stage button { width: 52px; min-height: 50px; border-radius: 18px; border: 1px solid; background: rgba(2,7,22,0.58); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); cursor: pointer; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease; }
        .bm-office-persona-stage button:hover, .bm-office-persona-stage button.is-selected { transform: translateY(-3px); background: rgba(15,23,42,0.76); box-shadow: 0 14px 30px rgba(0,0,0,0.28); }
        .bm-office-persona-stage span { font-size: 12px; font-weight: 950; }
        .bm-office-persona-stage small { color: #7b92aa; font-size: 7.5px; font-weight: 850; }
        .bm-office-command-panel { position: absolute; top: 54px; right: 14px; width: min(340px, calc(100% - 28px)); border: 1px solid; border-radius: 18px; background: rgba(2,7,22,0.70); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 20px 55px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.025) inset; padding: 12px; pointer-events: auto; animation: bm-office-panel-in 240ms 55ms cubic-bezier(0.16, 1, 0.3, 1) both; transition: opacity 150ms ease, transform 150ms ease; }
        .bm-office-portal-shell.is-closing .bm-office-command-panel { opacity: 0; transform: translate3d(10px, 4px, 0) scale(0.99); }
        .bm-office-command-kicker { font-size: 9px; font-weight: 950; letter-spacing: 1px; margin-bottom: 5px; }
        .bm-office-command-panel h3 { margin: 0; color: #e8fbff; font-size: 16px; font-weight: 950; line-height: 1.25; }
        .bm-office-command-panel p { margin: 6px 0 0; color: #6b87ab; font-size: 10px; line-height: 1.55; }
        .bm-office-command-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; }
        .bm-office-command-stats div { border-radius: 12px; border: 1px solid rgba(148,163,184,0.10); background: rgba(255,255,255,0.035); padding: 7px 4px; text-align: center; }
        .bm-office-command-stats span { display: block; font-size: 14px; font-weight: 950; line-height: 1; }
        .bm-office-command-stats small { display: block; margin-top: 4px; font-size: 8.5px; color: #4a6a8a; font-weight: 800; }
        .bm-office-command-room { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid; border-radius: 14px; padding: 9px 10px; margin-top: 9px; }
        .bm-office-command-room div { min-width: 0; }
        .bm-office-command-room strong { display: block; color: #dbeafe; font-size: 11px; font-weight: 950; line-height: 1.2; }
        .bm-office-command-room span { display: block; color: #5a7a9a; font-size: 9px; font-weight: 700; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-command-room em { font-style: normal; flex-shrink: 0; font-size: 9px; font-weight: 950; }
        .bm-office-text-room-workspace, .bm-office-persona-deck { margin-top: 9px; border-radius: 14px; border: 1px solid rgba(148,163,184,0.10); background: rgba(255,255,255,0.035); padding: 9px; animation: bm-office-panel-in 220ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .bm-office-text-room-head, .bm-office-persona-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
        .bm-office-text-room-head strong, .bm-office-persona-head strong { color: #dbeafe; font-size: 11px; font-weight: 950; }
        .bm-office-text-room-head span, .bm-office-persona-head span { color: #4a6a8a; font-size: 8.5px; font-weight: 850; white-space: nowrap; }
        .bm-office-text-room-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
        .bm-office-text-room-grid div { border-radius: 11px; border: 1px solid rgba(148,163,184,0.08); background: rgba(2,7,22,0.38); padding: 7px; min-width: 0; }
        .bm-office-text-room-grid small { display: block; color: #7dd3fc; font-size: 8.5px; font-weight: 950; margin-bottom: 5px; }
        .bm-office-text-room-grid span { display: block; color: #7b92aa; font-size: 8px; font-weight: 750; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-persona-list { display: flex; flex-direction: column; gap: 5px; }
        .bm-office-persona-list button { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; align-items: center; gap: 7px; border-radius: 12px; border: 1px solid rgba(148,163,184,0.08); background: rgba(2,7,22,0.38); padding: 6px; cursor: pointer; text-align: right; transition: border-color 150ms ease, background 150ms ease, transform 150ms ease; }
        .bm-office-persona-list button:hover, .bm-office-persona-list button.is-selected { border-color: rgba(125,211,252,0.22); background: rgba(125,211,252,0.055); transform: translateY(-1px); }
        .bm-office-persona-list b, .bm-office-command-people b { width: 24px; height: 24px; border-radius: 999px; border: 1px solid; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 950; }
        .bm-office-persona-list button div { min-width: 0; }
        .bm-office-persona-list button strong { display: block; color: #dbeafe; font-size: 9px; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-persona-list button span { display: block; margin-top: 2px; color: #5a7a9a; font-size: 8px; font-weight: 750; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bm-office-persona-list em { font-style: normal; color: #64748b; font-size: 8px; font-weight: 950; white-space: nowrap; }
        .bm-office-persona-list > small, .bm-office-persona-empty { color: #64748b !important; font-size: 8.5px !important; font-weight: 850; }
        .bm-office-persona-focus { margin-top: 7px; border-radius: 12px; border: 1px solid rgba(125,211,252,0.12); background: rgba(2,7,22,0.42); padding: 8px; }
        .bm-office-persona-focus strong { display: block; color: #e0f2fe; font-size: 10px; font-weight: 950; }
        .bm-office-persona-focus span, .bm-office-persona-focus em { display: block; margin-top: 3px; color: #64748b; font-size: 8.5px; font-style: normal; font-weight: 850; }
        .bm-office-command-people { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; }
        .bm-office-command-people > span { color: #4a6a8a; font-size: 9.5px; font-weight: 900; }
        .bm-office-command-people div { display: flex; align-items: center; gap: 4px; min-width: 0; }
        .bm-office-command-people small { color: #64748b; font-size: 9px; font-weight: 800; }
        .bm-office-command-note { color: #3a5570 !important; font-size: 9px !important; font-weight: 800; text-align: center; }
        @keyframes bm-office-shell-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bm-office-shell-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes bm-office-topbar-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bm-office-frame-in { from { opacity: 0; transform: scale(0.992); filter: saturate(0.92) brightness(0.88); } to { opacity: 1; transform: scale(1); filter: saturate(1) brightness(1); } }
        @keyframes bm-office-image-settle { from { transform: scale(1.012); } to { transform: scale(1); } }
        @keyframes bm-office-panel-in { from { opacity: 0; transform: translate3d(12px, 6px, 0) scale(0.99); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
        @keyframes bm-office-pill-in { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .bm-office-portal-shell, .bm-office-portal-topbar, .bm-office-crop-frame, .bm-office-crop-image, .bm-office-crop-pill, .bm-office-command-panel, .bm-office-text-room-workspace, .bm-office-persona-deck, .bm-office-persona-stage {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
          }
          .bm-office-portal-shell.is-closing { opacity: 0; }
        }
        @media (max-width: 640px) {
          .bm-office-portal-topbar { padding: 8px 10px; min-height: 50px; gap: 8px; }
          .bm-office-portal-subtitle { display: none; }
          .bm-office-portal-badges span { font-size: 8.5px; padding: 3px 7px; }
          .bm-office-portal-main { padding: 8px; }
          .bm-office-crop-frame { width: 100%; border-radius: 14px; }
          .bm-office-command-panel { top: auto; right: 8px; left: 8px; bottom: 8px; width: auto; padding: 10px; }
          .bm-office-command-panel h3 { font-size: 13px; }
          .bm-office-persona-stage, .bm-office-command-panel p, .bm-office-text-room-workspace, .bm-office-persona-deck, .bm-office-command-people, .bm-office-command-note { display: none; }
          .bm-office-command-stats { margin-top: 8px; }
        }
      `}</style>
    </div>
  );
}
