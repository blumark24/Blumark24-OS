"use client";

// VirtualOfficeReferenceScene.tsx — VIRTUAL-OFFICE-INTERACTIVE-3
//
// PRIMARY:  public/assets/virtual-office/office-map-reference.webp
// FALLBACK: CSS grid floor plan (on image error)
//
// Now interactive: each room hotspot is clickable.
// Overlays show selection highlight when selectedRoomId matches.
//
// Read-only · isolated from /org · no DB writes.

import { useState, useMemo } from "react";
import Image from "next/image";
import { BrainCircuit, MessageSquare } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SceneRoom {
  id: string;
  fixedRoomKey?: string;
  name: string;
  accentColor: string;
  employeeCount: number;
  // statusColor is an optional presence dot (EXECUTIVE-OFFICE-PRESENCE-1).
  avatars: Array<{ initials: string; color: string; statusColor?: string }>;
  openTasks: number;
  overdueTasks: number;
  healthPct: number;
  isCenter: boolean;
  isAI: boolean;
  isDemo: boolean;
  // EXECUTIVE-OFFICE-NUMBERED-EMPTY-OFFICES-1
  // Stable office number (1..8) per fixed slot. Optional for backwards compat.
  officeNumber?: number;
  // True when no saved/preview/auto mapping is resolved AND there's no real
  // department backing the room — i.e. show "غير مخصص" instead of a name.
  isUnassigned?: boolean;
}

export interface VirtualOfficeReferenceSceneProps {
  rooms: SceneRoom[];
  selectedRoomId?: string | null;
  onRoomClick?: (room: SceneRoom) => void;
}

// ─── Asset path ───────────────────────────────────────────────────────────────
const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";
const IMAGE_ASPECT_RATIO = "1672 / 941";
const BOARD_CONTROL_LABEL = "مكتب مجلس الإدارة والتحكم";
const BOARD_CONTROL_DESCRIPTION = "مركز متابعة وتشغيل المكاتب داخل المنشأة.";
const UNASSIGNED_LABEL = "غير مخصص";
const UNAVAILABLE_LABEL = "غير متاح";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];
const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];

// Slot positions covering each room in the image (3×3 grid layout).
// meeting room (slot 4) spans rows 2+3 in the center column.
interface SlotPos {
  top?: string; bottom?: string;
  left?: string; right?: string;
  width: string; height: string;
  isMeeting?: boolean;
}
const SLOT_POSITIONS: SlotPos[] = [
  { top: "63%", left: "4%",  width: "29%", height: "32%" },
  { top: "3%",  left: "5%",  width: "31%", height: "27%" },
  { top: "3%",  left: "39%", width: "22%", height: "27%" },
  { top: "34%", left: "4%",  width: "29%", height: "27%" },
  { top: "35%", left: "39%", width: "22%", height: "24%", isMeeting: true },
  { top: "34%", left: "69%", width: "27%", height: "27%" },
  { top: "65%", left: "38%", width: "26%", height: "29%" },
  { top: "64%", left: "69%", width: "27%", height: "31%" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hpStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.22)", border: "rgba(16,185,129,0.40)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.40)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.22)",    border: "rgba(239,68,68,0.40)"  };
}

export function formatOfficeNumber(n: number | undefined): string {
  if (n == null) return "";
  return n < 10 ? `0${n}` : String(n);
}

function NumberBadge({ n, accent = "#22d3ee" }: { n?: number; accent?: string }) {
  if (n == null) return null;
  return (
    <span
      aria-label={`مكتب ${formatOfficeNumber(n)}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 16, height: 14, padding: "0 3px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${accent}36`,
        color: "#dbeafe",
        fontSize: 8, fontWeight: 850, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
      }}
    >{formatOfficeNumber(n)}</span>
  );
}

function roomDisplayName(room: SceneRoom): string {
  if (room.fixedRoomKey === "meetings") return BOARD_CONTROL_LABEL;
  if (room.isUnassigned) return UNASSIGNED_LABEL;
  return room.name;
}

function compactRoomName(room: SceneRoom): string {
  return roomDisplayName(room).replace(/^غرفة\s+/, "").trim();
}

// ─── Avatar row ───────────────────────────────────────────────────────────────

function AvatarRow({ room, size = 24 }: { room: SceneRoom; size?: number }) {
  const items =
    room.avatars.length > 0
      ? room.avatars.slice(0, 3).map((a, i) => ({ key: `a${i}`, bg: a.color, label: a.initials, dot: a.statusColor }))
      : room.isDemo && room.employeeCount > 0
        ? Array.from({ length: Math.min(room.employeeCount, 3) }).map((_, i) => ({
            key: `d${i}`,
            bg: AVATAR_COLORS[(i * 3) % AVATAR_COLORS.length] ?? "#22d3ee",
            label: DEMO_LETTERS[i] ?? "م",
            dot: undefined as string | undefined,
          }))
        : [];
  const extra = Math.max(0, room.employeeCount - 3);
  if (items.length === 0) return null;
  const dotSize = size <= 24 ? 7 : 9;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {items.map((a) => (
        <div key={a.key} style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
          <div style={{
            width: size, height: size, borderRadius: "50%",
            background: a.bg, border: "2px solid rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size <= 24 ? 9 : 11, fontWeight: 700, color: "#fff",
          }}>{a.label}</div>
          {a.dot && (
            <span aria-hidden style={{
              position: "absolute", bottom: -1, insetInlineEnd: -1,
              width: dotSize, height: dotSize, borderRadius: "50%",
              background: a.dot, border: "2px solid rgba(4,10,22,0.85)",
            }} />
          )}
        </div>
      ))}
      {extra > 0 && <span style={{ fontSize: 9, color: "#8ba3c7" }}>+{extra}</span>}
    </div>
  );
}

// ─── Room overlay (standard) ──────────────────────────────────────────────────

function RoomOverlay({ room, selected, onClick }: { room: SceneRoom; selected: boolean; onClick: () => void }) {
  const hp = hpStyle(room.healthPct);
  const accent = room.accentColor;
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%", height: "100%",
        cursor: "pointer",
        borderRadius: 10,
        ...(selected ? {
          outline: `1px solid ${accent}aa`,
          outlineOffset: -2,
          boxShadow: `inset 0 0 0 1px ${accent}66, 0 0 28px ${accent}42`,
        } : {}),
      }}
    >
      {/* Compact HUD pill — top-left, auto-width */}
      <div style={{
        position: "absolute", top: 7, left: 7,
        display: "inline-flex", alignItems: "center", gap: 4,
        minHeight: 20,
        background: selected ? "linear-gradient(135deg, rgba(88,28,135,0.78), rgba(8,47,73,0.66))" : "rgba(4,10,22,0.58)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 6px 2px 4px",
        border: selected ? `1px solid ${accent}88` : "1px solid rgba(255,255,255,0.09)",
        boxShadow: selected ? `0 0 16px ${accent}45, 0 0 0 1px rgba(34,211,238,0.10)` : "0 1px 6px rgba(0,0,0,0.35)",
        transition: "all 0.18s ease",
        maxWidth: "72%",
      }}>
        {room.healthPct > 0 && (
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: hp.color,
            boxShadow: `0 0 6px ${hp.color}`,
            flexShrink: 0,
          }} />
        )}
        <NumberBadge n={room.officeNumber} accent={accent} />
        <span style={{
          fontSize: 9, fontWeight: 750,
          color: room.isUnassigned ? "#cbd5e1" : "#eef6ff",
          fontStyle: room.isUnassigned ? "italic" : "normal",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 86,
        }}>{compactRoomName(room)}</span>
        {room.overdueTasks > 0 && (
          <span style={{
            width: 13, height: 13, borderRadius: "50%",
            background: "#ef4444", color: "#fff",
            fontSize: 8, fontWeight: 700, flexShrink: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 6px rgba(239,68,68,0.55)",
          }}>{room.overdueTasks}</span>
        )}
      </div>

      {/* Tiny avatar cluster near bottom-right (over the desks area) */}
      <div style={{ position: "absolute", bottom: 6, right: 6 }}>
        <AvatarRow room={room} size={18} />
      </div>
    </div>
  );
}

// ─── Meeting room overlay ─────────────────────────────────────────────────────

function MeetingOverlay({ room, selected, onClick }: { room: SceneRoom; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%", height: "100%",
        cursor: "pointer",
        borderRadius: 10,
        ...(selected ? {
          outline: "1px solid rgba(216,180,254,0.86)",
          outlineOffset: -2,
          boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.20), 0 0 34px rgba(168,85,247,0.45)",
        } : {}),
      }}
    >
      {/* Top compact name pill */}
      <div style={{
        position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
        display: "inline-flex", alignItems: "center", gap: 4,
        background: selected ? "linear-gradient(135deg, rgba(88,28,135,0.82), rgba(49,46,129,0.70))" : "rgba(20,6,48,0.60)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 7px",
        border: selected ? "1px solid rgba(139,92,246,0.65)" : "1px solid rgba(139,92,246,0.40)",
        transition: "all 0.18s ease", maxWidth: "82%",
        boxShadow: selected ? "0 0 18px rgba(168,85,247,0.45)" : "0 1px 7px rgba(0,0,0,0.38)",
      }}>
        <NumberBadge n={room.officeNumber} accent="#a855f7" />
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: "#f3e8ff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{compactRoomName(room)}</span>
      </div>

      {/* Center compact status — "مشغولة الآن" + time */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
        pointerEvents: "none",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "rgba(20,6,48,0.78)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(167,139,250,0.55)",
          borderRadius: 999, padding: "3px 9px",
          boxShadow: "0 0 16px rgba(139,92,246,0.35)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
          <span style={{ fontSize: 9.5, color: "#ddd6fe", fontWeight: 700 }}>{BOARD_CONTROL_LABEL}</span>
        </div>
        <span style={{
          maxWidth: 190,
          fontSize: 9, fontWeight: 650, color: "#c4b5fd",
          background: "rgba(20,6,48,0.54)",
          border: "1px solid rgba(139,92,246,0.30)",
          padding: "1px 7px", borderRadius: 999,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{BOARD_CONTROL_DESCRIPTION}</span>
      </div>

      {/* Tiny avatar cluster bottom-center */}
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)" }}>
        <AvatarRow room={room} size={18} />
      </div>
    </div>
  );
}

// ─── AI room overlay ──────────────────────────────────────────────────────────

function AIOverlay({ room, selected, onClick }: { room: SceneRoom; selected: boolean; onClick: () => void }) {
  const pct = room.healthPct > 0 ? room.healthPct : 94;
  const hp = hpStyle(pct);
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%", height: "100%",
        cursor: "pointer",
        borderRadius: 10,
        ...(selected ? {
          outline: "1px solid rgba(34,211,238,0.84)",
          outlineOffset: -2,
          boxShadow: "inset 0 0 0 1px rgba(168,85,247,0.22), 0 0 30px rgba(34,211,238,0.42)",
        } : {}),
      }}
    >
      {/* Compact HUD pill — top-right */}
      <div style={{
        position: "absolute", top: 7, right: 7,
        display: "inline-flex", alignItems: "center", gap: 4,
        minHeight: 20,
        background: selected ? "linear-gradient(135deg, rgba(8,47,73,0.82), rgba(88,28,135,0.56))" : "rgba(2,10,22,0.58)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 6px 2px 4px",
        border: selected ? "1px solid rgba(34,211,238,0.55)" : "1px solid rgba(34,211,238,0.32)",
        boxShadow: selected ? "0 0 14px rgba(34,211,238,0.30)" : "0 0 10px rgba(34,211,238,0.14)",
        transition: "all 0.18s ease", maxWidth: "72%",
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: hp.color,
          boxShadow: `0 0 6px ${hp.color}`,
          flexShrink: 0,
        }} />
        <NumberBadge n={room.officeNumber} accent="#22d3ee" />
        <span style={{
          fontSize: 9, fontWeight: 750,
          color: room.isUnassigned ? "#cbd5e1" : "#eef6ff",
          fontStyle: room.isUnassigned ? "italic" : "normal",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 86,
        }}>{compactRoomName(room)}</span>
      </div>

      {/* Avatar cluster bottom-left so it doesn't cover the AI chip */}
      <div style={{ position: "absolute", bottom: 6, left: 6 }}>
        <AvatarRow room={room} size={18} />
      </div>
    </div>
  );
}

// ─── CSS Fallback floor plan ──────────────────────────────────────────────────

function hpCss(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.32)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.32)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.32)"  };
}

function CSSFloor({ slots, selectedRoomId, onRoomClick }: {
  slots: (SceneRoom | null)[];
  selectedRoomId: string | null;
  onRoomClick: (r: SceneRoom) => void;
}) {
  function bg(r: SceneRoom | null): React.CSSProperties {
    if (!r) return { background: "rgba(4,10,20,0.6)", border: "1px solid rgba(255,255,255,0.02)" };
    const sel = r.id === selectedRoomId;
    if (r.isCenter) return { background: sel ? "rgba(50,15,85,0.97)" : "linear-gradient(160deg, rgba(28,8,58,0.96), rgba(14,5,38,0.98))", border: sel ? "2px solid rgba(139,92,246,0.70)" : "2px solid rgba(139,92,246,0.40)", boxShadow: sel ? "0 0 60px rgba(139,92,246,0.22)" : "0 0 44px rgba(139,92,246,0.14)" };
    if (r.isAI) return { background: sel ? "rgba(5,18,40,0.99)" : "linear-gradient(160deg, rgba(3,10,24,0.98), rgba(5,14,32,0.99))", border: sel ? "2px solid rgba(34,211,238,0.55)" : "1px solid rgba(34,211,238,0.24)", boxShadow: sel ? "0 0 50px rgba(34,211,238,0.22)" : "0 0 36px rgba(34,211,238,0.10)" };
    return { background: sel ? `rgba(8,18,40,0.99)` : "linear-gradient(160deg, rgba(5,13,26,0.97), rgba(8,18,36,0.99))", borderTop: `2px solid ${r.accentColor}${sel ? "99" : "55"}`, border: sel ? `1px solid ${r.accentColor}55` : "1px solid rgba(255,255,255,0.045)", boxShadow: sel ? `0 0 30px ${r.accentColor}22` : "none" };
  }

  function Inner({ room }: { room: SceneRoom }) {
    const sel = room.id === selectedRoomId;
    const hp = hpCss(room.healthPct);
    const pct = room.healthPct > 0 ? room.healthPct : (room.isAI ? 94 : 0);
    const ehp = hpCss(pct);
    if (room.isCenter) return (
      <div style={{ padding: 12, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(139,92,246,0.18), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 700 }}>{BOARD_CONTROL_LABEL}</span>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(139,92,246,0.35), rgba(139,92,246,0.06))", border: "1px solid rgba(139,92,246,0.42)", boxShadow: sel ? "0 0 30px rgba(139,92,246,0.35)" : "0 0 20px rgba(139,92,246,0.25)" }}>
          <MessageSquare size={19} color="#c4b5fd" />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", textAlign: "center" }}>{compactRoomName(room)}</span>
        <span style={{ fontSize: 9.5, color: "#c4b5fd", fontWeight: 600, textAlign: "center", lineHeight: 1.45 }}>{BOARD_CONTROL_DESCRIPTION}</span>
        <AvatarRow room={room} />
      </div>
    );
    if (room.isAI) return (
      <div style={{ padding: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 110%, rgba(34,211,238,0.12), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#dde8f4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{compactRoomName(room)}</span>
          {pct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: ehp.color, background: ehp.bg, border: `1px solid ${ehp.border}`, padding: "1px 5px", borderRadius: 14 }}>{pct}%</span>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(34,211,238,0.26), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.32)", boxShadow: sel ? "0 0 30px rgba(34,211,238,0.30)" : "0 0 20px rgba(34,211,238,0.20)" }}>
          <BrainCircuit size={20} color="#22d3ee" />
        </div>
        <span style={{ fontSize: 9, color: "rgba(34,211,238,0.45)" }}>{room.employeeCount > 0 ? `${room.employeeCount} موظف` : UNAVAILABLE_LABEL}</span>
      </div>
    );
    return (
      <div style={{ padding: "8px 10px", height: "100%", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 55% at 50% 120%, ${room.accentColor}0a, transparent)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", flex: 1, lineHeight: 1.25 }}>{compactRoomName(room)}</span>
          <div style={{ display: "flex", gap: 3 }}>
            {room.overdueTasks > 0 && <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{room.overdueTasks}</span>}
            {pct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: hp.color, background: hp.bg, border: `1px solid ${hp.border}`, padding: "1px 5px", borderRadius: 14 }}>{pct}%</span>}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
          {[0, 1].map((d) => <div key={d} style={{ width: 32, height: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 3 }} />)}
        </div>
        <AvatarRow room={room} />
      </div>
    );
  }

  function G(col: number | string, row: number | string): React.CSSProperties {
    return { gridColumn: col as React.CSSProperties["gridColumn"], gridRow: row as React.CSSProperties["gridRow"], position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" };
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.12fr 1fr", gridTemplateRows: "minmax(155px,auto) minmax(172px,auto) minmax(148px,auto)", gap: 4, background: "rgba(16,28,50,0.55)", borderRadius: 14, overflow: "hidden" }}>
      {[0, 1, 2].map((i) => (
        <div key={`r${i}`} style={{ ...G(i + 1, 1), ...bg(slots[i]) }} onClick={() => slots[i] && onRoomClick(slots[i]!)}>
          {slots[i] && <Inner room={slots[i]!} />}
        </div>
      ))}
      <div style={{ ...G(1, 2), ...bg(slots[3]) }} onClick={() => slots[3] && onRoomClick(slots[3]!)}>{slots[3] && <Inner room={slots[3]} />}</div>
      <div style={{ ...G(2, "2 / 4"), ...bg(slots[4]), alignItems: "center", justifyContent: "center" }} onClick={() => slots[4] && onRoomClick(slots[4]!)}>{slots[4] && <Inner room={slots[4]} />}</div>
      <div style={{ ...G(3, 2), ...bg(slots[5]) }} onClick={() => slots[5] && onRoomClick(slots[5]!)}>{slots[5] && <Inner room={slots[5]} />}</div>
      <div style={{ ...G(1, 3), ...bg(slots[6]) }} onClick={() => slots[6] && onRoomClick(slots[6]!)}>{slots[6] && <Inner room={slots[6]} />}</div>
      <div style={{ ...G(3, 3), ...bg(slots[7]), alignItems: "center", justifyContent: "center" }} onClick={() => slots[7] && onRoomClick(slots[7]!)}>{slots[7] && <Inner room={slots[7]} />}</div>
    </div>
  );
}

// ─── Slot builder ─────────────────────────────────────────────────────────────

function buildSlots(rooms: SceneRoom[]): (SceneRoom | null)[] {
  const s: (SceneRoom | null)[] = Array(8).fill(null);
  const used = new Set<number>();
  const ci = rooms.findIndex((r) => r.isCenter);
  const ai = rooms.findIndex((r) => r.isAI && !r.isCenter);
  if (ci >= 0) { s[4] = rooms[ci]; used.add(ci); }
  if (ai >= 0) { s[7] = rooms[ai]; used.add(ai); }
  const rem = rooms.filter((_, i) => !used.has(i));
  [0, 1, 2, 3, 5, 6].filter((p) => !s[p]).forEach((pos, i) => { if (rem[i]) s[pos] = rem[i]; });
  if (!s[4]) { const fb = rem[6] ?? rooms[Math.floor(rooms.length / 2)]; if (fb) s[4] = { ...fb, isCenter: true }; }
  return s;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function VirtualOfficeReferenceScene({
  rooms,
  selectedRoomId = null,
  onRoomClick,
}: VirtualOfficeReferenceSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const slots = useMemo(() => buildSlots(rooms), [rooms]);
  const handleClick = (room: SceneRoom) => onRoomClick?.(room);

  return (
    <div style={{
      background: "rgba(2,6,16,0.99)",
      border: "2px solid rgba(45,75,125,0.28)",
      borderRadius: 20, padding: 4,
      boxShadow: "0 0 100px rgba(34,211,238,0.04), 0 32px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Header bar */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: 11, color: "rgba(80,120,160,0.85)", fontWeight: 500 }}>مخطط الطابق الرئيسي</span>
          {!imgFailed && <span style={{ fontSize: 9, color: "rgba(34,211,238,0.40)" }}>· انقر على غرفة للتفاصيل</span>}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[{ c: "#10b981", l: `${rooms.filter((r) => !r.isCenter && !r.isAI).length} غرفة` }, { c: "#a855f7", l: "قاعة اجتماعات" }, { c: "#22d3ee", l: "غرفة AI" }].map((x) => (
            <span key={x.l} style={{ fontSize: 10, color: "rgba(60,90,130,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.c, display: "inline-block" }} />
              {x.l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Desktop scene ── */}
      <div className="hidden sm:block">
        {!imgFailed ? (
          <div style={{
            position: "relative",
            borderRadius: 14,
            overflow: "hidden",
            // Match the final asset aspect ratio (1672x941). No crop.
            aspectRatio: IMAGE_ASPECT_RATIO,
            // Cap so it doesn't dominate the page on very wide screens.
            maxHeight: 700,
            margin: "0 auto",
            background: "#06111f",
          }}>
            {/* Image base — contain to show full floor plan, no cropping */}
            <Image
              src={IMAGE_SRC}
              alt="Office floor plan"
              fill
              sizes="(min-width: 1024px) 1100px, 100vw"
              style={{ objectFit: "contain", objectPosition: "center" }}
              onError={() => setImgFailed(true)}
              priority
            />
            {/* Vignette */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
            {/* Glow */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 30% at 10% 10%, rgba(34,211,238,0.06), transparent), radial-gradient(ellipse 45% 30% at 90% 90%, rgba(139,92,246,0.07), transparent)" }} />
            {/* Room overlays */}
            {slots.map((room, i) => {
              if (!room) return null;
              const pos = SLOT_POSITIONS[i];
              if (!pos) return null;
              const ps: React.CSSProperties = {
                position: "absolute", width: pos.width, height: pos.height,
                ...(pos.top    != null ? { top:    pos.top    } : {}),
                ...(pos.bottom != null ? { bottom: pos.bottom } : {}),
                ...(pos.left   != null ? { left:   pos.left   } : {}),
                ...(pos.right  != null ? { right:  pos.right  } : {}),
                zIndex: pos.isMeeting ? 10 : 5,
              };
              return (
                <div key={room.id} style={ps}>
                  {room.isCenter
                    ? <MeetingOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />
                    : room.isAI
                      ? <AIOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />
                      : <RoomOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />}
                </div>
              );
            })}
          </div>
        ) : (
          <CSSFloor slots={slots} selectedRoomId={selectedRoomId ?? ""} onRoomClick={handleClick} />
        )}
      </div>

      {/* ── Mobile stacked ── */}
      <div className="sm:hidden space-y-2 p-1">
        {rooms.map((room) => (
          <div key={room.id} onClick={() => handleClick(room)} style={{
            borderRadius: 12,
            border: room.id === selectedRoomId
              ? (room.isCenter ? "2px solid rgba(139,92,246,0.70)" : room.isAI ? "2px solid rgba(34,211,238,0.60)" : `2px solid ${room.accentColor}60`)
              : (room.isCenter ? "1px solid rgba(139,92,246,0.40)" : room.isAI ? "1px solid rgba(34,211,238,0.24)" : `1px solid ${room.accentColor}28`),
            background: room.isCenter ? "rgba(20,6,48,0.80)" : room.isAI ? "rgba(2,10,22,0.80)" : "rgba(5,12,26,0.75)",
            padding: "12px", minHeight: 88, cursor: "pointer",
          }}>
            {room.isCenter ? <MeetingOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />
              : room.isAI ? <AIOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />
              : <RoomOverlay room={room} selected={room.id === selectedRoomId} onClick={() => handleClick(room)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
