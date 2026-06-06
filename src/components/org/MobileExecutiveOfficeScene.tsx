"use client";

// MobileExecutiveOfficeScene.tsx — EXECUTIVE-OFFICE-MOBILE-SAFE-2
// Compact mobile-first console for /virtual-office.
// Reuses the office-map-reference asset and slot-ordered rooms.
// Read-only. No DB writes. No new libraries.

import { useState } from "react";
import Image from "next/image";
import {
  Layers, Users, CheckCircle2, AlertCircle,
  Activity, Calendar, BrainCircuit, MessageSquare, AlertTriangle,
} from "lucide-react";
import type { SceneRoom } from "./VirtualOfficeReferenceScene";
import type { PreviewOrgUnit } from "./VirtualOfficeDesign";

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";

// Loose superset of SceneRoom — OfficeRoom satisfies this.
export interface MobileSelectedRoom extends SceneRoom {
  type?: string;
  teamCount?: number;
  deptCode?: string | null;
}

// ─── Chip positions over the office image (slot-ordered) ──────────────────────

interface ChipPos { top: string; left: string; }
const CHIP_POSITIONS: ChipPos[] = [
  { top: "79%", left: "19%" }, // 0 Sales
  { top: "18%", left: "20%" }, // 1 Exec
  { top: "18%", left: "50%" }, // 2 Support
  { top: "48%", left: "19%" }, // 3 Marketing
  { top: "48%", left: "50%" }, // 4 Meeting (center)
  { top: "48%", left: "82%" }, // 5 Finance
  { top: "80%", left: "51%" }, // 6 Execution
  { top: "79%", left: "82%" }, // 7 AI
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hpStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.20)", border: "rgba(16,185,129,0.38)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.20)", border: "rgba(245,158,11,0.38)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.20)",   border: "rgba(239,68,68,0.38)"  };
}

function shortName(name: string): string {
  return (name ?? "").replace(/^غرفة\s+/, "").trim() || "—";
}

function hpLabel(pct: number): string {
  if (pct >= 85) return "ممتاز";
  if (pct >= 70) return "جيد";
  if (pct >= 55) return "متوسط";
  return "يحتاج متابعة";
}

// ─── Compact chip ─────────────────────────────────────────────────────────────

function Chip({ room, selected, onClick, position }: {
  room: SceneRoom; selected: boolean; onClick: () => void; position: ChipPos;
}) {
  const hp = hpStyle(room.healthPct);
  const accent = room.isCenter ? "#a855f7" : room.isAI ? "#22d3ee" : room.accentColor;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        top: position.top, left: position.left,
        transform: "translate(-50%, -50%)",
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 6px 2px 5px",
        borderRadius: 999,
        background: selected ? `${accent}33` : "rgba(2,8,23,0.80)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        border: selected ? `1px solid ${accent}` : `1px solid ${accent}55`,
        boxShadow: selected
          ? `0 0 14px ${accent}66, 0 0 0 2px rgba(2,8,23,0.5)`
          : "0 1px 4px rgba(0,0,0,0.55)",
        color: "#e5edf8",
        fontSize: 8.5, fontWeight: 600,
        whiteSpace: "nowrap", cursor: "pointer",
        maxWidth: "40%",
        transition: "all 0.18s ease",
      }}
    >
      <span style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: hp.color, boxShadow: `0 0 4px ${hp.color}` }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 64 }}>
        {shortName(room.name)}
      </span>
      {room.healthPct > 0 && (
        <span style={{
          fontSize: 7.5, fontWeight: 800, color: hp.color,
          padding: "0 3.5px", borderRadius: 999,
          background: hp.bg, border: `1px solid ${hp.border}`,
          lineHeight: 1.45,
        }}>{room.healthPct}%</span>
      )}
    </button>
  );
}

// ─── Selected room card ───────────────────────────────────────────────────────

function SelectedRoomCard({
  room,
  previewUnit,
  onOpenMapping,
  onClearPreview,
}: {
  room: MobileSelectedRoom;
  previewUnit: PreviewOrgUnit | null;
  onOpenMapping: () => void;
  onClearPreview: () => void;
}) {
  const hp = hpStyle(room.healthPct);
  const lbl = hpLabel(room.healthPct);
  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${room.accentColor}30`,
      background: "rgba(6,14,28,0.92)",
      padding: 12,
      marginBottom: 4,
      boxShadow: `0 0 18px ${room.accentColor}14`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</p>
          <p style={{ fontSize: 10, color: "#5a7a9a", margin: "3px 0 0" }}>
            {room.type ?? "مساحة عمل"}
            {room.deptCode ? <span style={{ fontFamily: "monospace", marginRight: 6 }}> · {room.deptCode}</span> : null}
          </p>
        </div>
        {room.healthPct > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: hp.color,
            background: hp.bg, border: `1px solid ${hp.border}`,
            padding: "2px 7px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap",
          }}>{room.healthPct}% · {lbl}</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
        {[
          { label: "موظف",  value: room.employeeCount,  Icon: Users,        color: "#22d3ee" },
          { label: "فريق",  value: room.teamCount ?? 0, Icon: Layers,       color: "#a855f7" },
          { label: "مهمة",  value: room.openTasks,      Icon: CheckCircle2, color: "#10b981" },
          { label: "متأخر", value: room.overdueTasks,   Icon: AlertCircle,  color: "#ef4444" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{
            borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            padding: "6px 4px", textAlign: "center",
          }}>
            <Icon size={11} color={color} />
            <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1, marginTop: 2 }}>{value}</div>
            <div style={{ fontSize: 9, color: "#4a6a8a", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {previewUnit && (
        <div style={{
          borderRadius: 12,
          border: "1px solid rgba(16,185,129,0.25)",
          background: "rgba(16,185,129,0.08)",
          padding: 10,
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, color: "#86efac" }}>
                <Layers size={10} />
                ربط تجريبي
              </span>
              <p style={{ margin: "4px 0 0", color: "#d1fae5", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewUnit.name}
              </p>
              <p style={{ margin: "3px 0 0", color: "#7aa6a0", fontSize: 9 }}>
                هذا التخصيص للمعاينة فقط ولن يتم حفظه.
              </p>
            </div>
            <button type="button" onClick={onClearPreview} style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "#b0c8e0", borderRadius: 9, padding: "6px 8px", fontSize: 9, cursor: "pointer", flexShrink: 0 }}>
              إلغاء المعاينة
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenMapping}
        style={{
          width: "100%",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 12px", borderRadius: 10,
          border: "1px solid rgba(139,92,246,0.36)",
          background: "rgba(139,92,246,0.10)",
          color: "#d8b4fe",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        <Layers size={12} />
        تخصيص الربط
      </button>
    </div>
  );
}

// ─── Compact bottom sections ──────────────────────────────────────────────────

interface ActivityItem  { id: string; title: string; room: string; ago: string; }
interface MeetingItem   { id: string; name: string; status: string; }
interface AlertItem     { id: string; type: string; text: string; room: string; }

function SectionCard({
  Icon, title, accent, items, renderItem, empty,
}: {
  Icon: React.ElementType;
  title: string;
  accent: string;
  items: Array<{ id: string }>;
  renderItem: (item: { id: string }) => React.ReactNode;
  empty: string;
}) {
  return (
    <div style={{
      borderRadius: 14, border: "1px solid rgba(255,255,255,0.065)",
      background: "rgba(6,14,28,0.92)", overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 7 }}>
        <Icon size={13} color={accent} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 10, color: "#3a5a7a", padding: "10px 12px", margin: 0 }}>{empty}</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.slice(0, 2).map((item, i) => (
            <li key={item.id} style={{
              padding: "8px 12px",
              borderBottom: i < Math.min(items.length, 2) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MobileBottomSections({
  activity, meetings, alerts,
}: {
  activity: ActivityItem[];
  meetings: MeetingItem[];
  alerts:   AlertItem[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionCard
        Icon={Activity} title="النشاط" accent="#22d3ee"
        items={activity}
        empty="لا يوجد نشاط حاليًا"
        renderItem={(raw) => {
          const a = raw as ActivityItem;
          return (
            <>
              <p style={{ fontSize: 11, color: "#b0c8e0", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
              <p style={{ fontSize: 9, color: "#3a5a7a", margin: "2px 0 0" }}>{a.room} · منذ {a.ago}</p>
            </>
          );
        }}
      />
      <SectionCard
        Icon={Calendar} title="الاجتماعات" accent="#a855f7"
        items={meetings}
        empty="لا يوجد اجتماعات اليوم"
        renderItem={(raw) => {
          const m = raw as MeetingItem;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.18)" }}>
                <MessageSquare size={12} color="#a78bfa" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#c8ddf0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                <p style={{ fontSize: 9, color: "#3a5a7a", margin: "2px 0 0" }}>{m.status}</p>
              </div>
            </div>
          );
        }}
      />
      <SectionCard
        Icon={BrainCircuit} title="التنبيهات" accent="#22d3ee"
        items={alerts}
        empty="لا يوجد تنبيهات"
        renderItem={(raw) => {
          const a = raw as AlertItem;
          return (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
              <AlertTriangle size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#b0c8e0", margin: 0, lineHeight: 1.4 }}>{a.text}</p>
                <p style={{ fontSize: 9, color: "#2a4060", margin: "2px 0 0" }}>{a.room}</p>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

// ─── Main mobile scene ────────────────────────────────────────────────────────

export interface MobileExecutiveOfficeSceneProps {
  rooms: SceneRoom[];
  selectedRoom: MobileSelectedRoom | null;
  onRoomClick: (room: SceneRoom) => void;
  previewUnit: PreviewOrgUnit | null;
  onOpenMapping: () => void;
  onClearPreview: () => void;
  activity: ActivityItem[];
  meetings: MeetingItem[];
  alerts:   AlertItem[];
}

export default function MobileExecutiveOfficeScene({
  rooms, selectedRoom, onRoomClick,
  previewUnit, onOpenMapping, onClearPreview,
  activity, meetings, alerts,
}: MobileExecutiveOfficeSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "100%", overflow: "hidden" }}>
      {/* Office preview card */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "100%",
        borderRadius: 18, overflow: "hidden",
        background: "#06111f",
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      }}>
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: IMAGE_ASPECT_RATIO,
          maxHeight: 340,
          margin: "0 auto",
        }}>
          {!imgFailed ? (
            <Image
              src={IMAGE_SRC}
              alt="Office floor plan"
              fill
              sizes="100vw"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #06111f, #050d1c)" }} />
          )}
          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 95% 95% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />
          {/* Chips over image */}
          {rooms.slice(0, 8).map((room, i) => {
            const pos = CHIP_POSITIONS[i];
            if (!pos) return null;
            return (
              <Chip
                key={room.id}
                room={room}
                selected={room.id === selectedRoom?.id}
                onClick={() => onRoomClick(room)}
                position={pos}
              />
            );
          })}
        </div>
      </div>

      {/* Selected card / empty hint */}
      {selectedRoom ? (
        <SelectedRoomCard
          room={selectedRoom}
          previewUnit={previewUnit}
          onOpenMapping={onOpenMapping}
          onClearPreview={onClearPreview}
        />
      ) : (
        <div style={{
          borderRadius: 12, border: "1px dashed rgba(34,211,238,0.22)",
          background: "rgba(10,22,40,0.50)",
          padding: "10px 14px",
          textAlign: "center", fontSize: 11, color: "#5a7a9a",
        }}>
          انقر على أي غرفة لعرض تفاصيلها
        </div>
      )}

      {/* Compact bottom sections */}
      <MobileBottomSections activity={activity} meetings={meetings} alerts={alerts} />
    </div>
  );
}
