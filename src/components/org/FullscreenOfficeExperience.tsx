"use client";

import { ArrowRight, X } from "lucide-react";
import type { MappingSource, OfficeRoom, PreviewOrgUnit, PresencePerson } from "./VirtualOfficeDesign";

const OFFICE_META: Record<number, { label: string; board?: boolean }> = {
  1: { label: "أعلى يمين" },
  2: { label: "أعلى وسط" },
  3: { label: "أعلى يسار" },
  4: { label: "وسط يمين" },
  5: { label: "مجلس الإدارة", board: true },
  6: { label: "وسط يسار" },
  7: { label: "أسفل يمين" },
  8: { label: "أسفل وسط" },
  9: { label: "أسفل يسار" },
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

function Desk({ className = "" }: { className?: string }) {
  return (
    <div className={`desk ${className}`}>
      <span className="monitor" />
      <span className="keyboard" />
      <span className="paper p1" />
      <span className="paper p2" />
      <span className="chair" />
    </div>
  );
}

function RegularPlan() {
  return (
    <div className="plan regular-plan">
      <div className="wall top-wall"><span>BLUMARK24 DIGITAL WALL</span></div>
      <div className="side side-right" />
      <div className="side side-left" />
      <Desk className="d1" />
      <Desk className="d2" />
      <Desk className="d3" />
      <Desk className="d4" />
      <div className="center-line vertical" />
      <div className="center-line horizontal" />
      <div className="plant plant-a" />
      <div className="plant plant-b" />
      <div className="plant plant-c" />
      <div className="plant plant-d" />
      <div className="door" />
    </div>
  );
}

function BoardPlan() {
  return (
    <div className="plan board-plan">
      <div className="wall top-wall board-wall"><span>BOARD COMMAND ROOM</span></div>
      <div className="board-table"><span className="table-core" /></div>
      {Array.from({ length: 12 }).map((_, index) => <span key={index} className={`board-chair c${index + 1}`} />)}
      <div className="side side-right" />
      <div className="side side-left" />
      <div className="plant plant-a" />
      <div className="plant plant-b" />
      <div className="plant plant-c" />
      <div className="plant plant-d" />
      <div className="door" />
    </div>
  );
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
  const meta = OFFICE_META[officeNum] ?? OFFICE_META[5];
  const isLinked = Boolean(mappingUnit) && !room.isUnassigned;
  const displayName = officeDisplayName(room, mappingUnit);
  const accent = room.isCenter ? "#a855f7" : isLinked ? "#10b981" : "#f59e0b";
  const status = room.isCenter ? "مجلس الإدارة" : isLinked ? "مرتبط" : "جاهز للربط";

  return (
    <div role="dialog" aria-modal="true" aria-label={`داخل ${displayName}`} className="portal" dir="rtl" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="topbar">
        <button type="button" onClick={onClose} className="back"><ArrowRight size={14} />المقر</button>
        <div className="divider" />
        <div className="titlebox">
          <div className="title">{displayName}</div>
          <div className="subtitle">{`OFFICE ${fmt(officeNum)} · مخطط 2D مستقيم عالي الوضوح · ${meta.label}`}</div>
        </div>
        <div className="badges">
          <span className="status">{status}</span>
          {isLinked && mappingSource && <span>{sourceLabel[mappingSource]}</span>}
        </div>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="close"><X size={13} /></button>
      </div>

      <main className="main">
        <section className="frame">
          <div className="office-pill"><span />{`OFFICE ${fmt(officeNum)}`}</div>
          {meta.board || room.isCenter ? <BoardPlan /> : <RegularPlan />}
        </section>
      </main>

      <style>{`
        .portal{position:fixed;inset:0;z-index:110;display:flex;flex-direction:column;background:#020716;overflow:hidden}.topbar{min-height:52px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(2,7,22,.9);backdrop-filter:blur(18px);display:flex;align-items:center;gap:10px;z-index:20}.back{display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;color:#8ba3c7;font-size:12px;font-weight:800;cursor:pointer}.divider{width:1px;height:20px;background:rgba(255,255,255,.08)}.titlebox{flex:1;min-width:0}.title{font-size:14px;font-weight:950;color:#e8fbff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.subtitle{font-size:9.5px;color:#3a5570;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badges{display:flex;gap:5px}.badges span{font-size:9px;font-weight:800;padding:3px 8px;border-radius:999px;border:1px solid rgba(100,116,139,.22);background:rgba(100,116,139,.06);color:#64748b;white-space:nowrap}.badges .status{border-color:color-mix(in srgb,var(--accent) 40%,transparent);background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent)}.close{width:32px;height:32px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#8ba3c7;display:grid;place-items:center;cursor:pointer}.main{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:clamp(10px,2vw,22px);background:radial-gradient(circle at 50% 45%,rgba(34,211,238,.1),transparent 42%),#020716}.frame{position:relative;width:min(100%,calc((100dvh - 92px)*16/9));aspect-ratio:16/9;max-height:calc(100dvh - 84px);overflow:hidden;border-radius:20px;border:1px solid rgba(125,211,252,.16);box-shadow:0 30px 96px rgba(0,0,0,.56);background:#061426}.plan{position:absolute;inset:0;background:linear-gradient(135deg,#071426,#0b1b2f 52%,#050b16);background-size:100% 100%}.plan:before{content:"";position:absolute;inset:38px;border-radius:32px;border:4px solid rgba(125,211,252,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}.plan:after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px);background-size:80px 80px;opacity:.9}.wall{position:absolute;left:7%;right:7%;top:8%;height:9%;border-radius:22px;background:rgba(2,7,22,.75);border:1px solid rgba(125,211,252,.2);display:grid;place-items:center;color:#7dd3fc;font-weight:950;font-size:clamp(11px,1.3vw,20px);letter-spacing:2px}.board-wall{color:#c4b5fd;border-color:rgba(168,85,247,.28)}.side{position:absolute;top:24%;bottom:22%;width:6%;border-radius:22px;background:rgba(15,23,42,.68);border:1px solid rgba(245,158,11,.22)}.side-right{right:7%}.side-left{left:7%}.desk{position:absolute;width:20%;height:15%;border-radius:18px;background:linear-gradient(135deg,#202734,#111827 60%,#070b12);border:2px solid rgba(148,163,184,.34);box-shadow:0 18px 38px rgba(0,0,0,.25)}.d1{right:25%;top:27%}.d2{left:25%;top:27%}.d3{right:25%;bottom:20%}.d4{left:25%;bottom:20%}.monitor{position:absolute;left:28%;right:28%;top:14%;height:36%;border-radius:8px;background:#031224;border:2px solid color-mix(in srgb,var(--accent) 60%,transparent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 25%,transparent)}.keyboard{position:absolute;left:36%;right:36%;top:57%;height:6%;border-radius:6px;background:color-mix(in srgb,var(--accent) 42%,transparent)}.paper{position:absolute;top:67%;width:15%;height:14%;border-radius:4px;background:rgba(226,232,240,.58)}.p1{right:13%}.p2{left:13%}.chair{position:absolute;left:39%;bottom:-36%;width:22%;height:28%;border-radius:14px;background:#0b1220;border:1px solid rgba(148,163,184,.34)}.center-line{position:absolute;background:rgba(34,211,238,.1)}.vertical{top:5%;bottom:5%;left:50%;width:3px}.horizontal{left:3%;right:3%;top:50%;height:3px}.plant{position:absolute;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle,#86efac 0 14%,#10b981 15% 30%,#0f172a 31%);border:1px solid rgba(245,158,11,.24)}.plant-a{right:9%;top:13%}.plant-b{left:9%;top:13%}.plant-c{right:9%;bottom:9%}.plant-d{left:9%;bottom:9%}.door{position:absolute;left:43%;right:43%;bottom:4%;height:2%;border-radius:999px;background:var(--accent);box-shadow:0 0 22px var(--accent)}.office-pill{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:rgba(2,7,22,.72);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);color:var(--accent);font-size:10px;font-weight:900;letter-spacing:.5px}.office-pill span{width:6px;height:6px;border-radius:999px;background:var(--accent);box-shadow:0 0 6px var(--accent)}.board-plan{background:linear-gradient(135deg,#090d1c,#10112a 52%,#050716)}.board-table{position:absolute;left:25%;right:25%;top:34%;height:31%;border-radius:80px;background:rgba(15,23,42,.96);border:4px solid rgba(168,85,247,.5);box-shadow:0 0 38px rgba(168,85,247,.18)}.table-core{position:absolute;inset:20%;border-radius:60px;background:rgba(2,7,22,.74);border:1px solid rgba(255,255,255,.08)}.board-chair{position:absolute;width:4.5%;height:4.6%;border-radius:14px;background:#0b1220;border:1px solid rgba(196,181,253,.35)}.c1{left:25%;top:27%}.c2{left:35%;top:27%}.c3{left:45%;top:27%}.c4{left:55%;top:27%}.c5{left:65%;top:27%}.c6{left:75%;top:27%}.c7{left:25%;bottom:27%}.c8{left:35%;bottom:27%}.c9{left:45%;bottom:27%}.c10{left:55%;bottom:27%}.c11{left:65%;bottom:27%}.c12{left:75%;bottom:27%}@media(max-width:640px){.topbar{padding:8px 10px;min-height:50px;gap:8px}.subtitle{display:none}.badges span{font-size:8.5px;padding:3px 7px}.main{padding:8px}.frame{width:100%;border-radius:14px}.plant{width:34px;height:34px}}
      `}</style>
    </div>
  );
}
