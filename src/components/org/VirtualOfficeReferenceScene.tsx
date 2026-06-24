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

import { useMemo } from "react";
import { BrainCircuit, MessageSquare } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SceneRoom {
  id: string;
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
  // Live open/closed state from DB (undefined = open by default)
  isOpen?: boolean;
}

export interface VirtualOfficeReferenceSceneProps {
  rooms: SceneRoom[];
  selectedRoomId?: string | null;
  onRoomClick?: (room: SceneRoom) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];
const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];

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
        minWidth: 18, height: 16, padding: "0 4px",
        borderRadius: 5,
        background: "rgba(255,255,255,0.07)",
        border: `1px solid ${accent}40`,
        color: "#cbd5e1",
        fontSize: 9, fontWeight: 800, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
      }}
    >{formatOfficeNumber(n)}</span>
  );
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
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%", height: "100%",
        cursor: "pointer",
        ...(selected ? { outline: `2px solid ${room.accentColor}`, outlineOffset: -2, borderRadius: 8 } : {}),
      }}
    >
      {/* Compact HUD pill — top-left, auto-width */}
      <div style={{
        position: "absolute", top: 6, left: 6,
        display: "inline-flex", alignItems: "center", gap: 5,
        background: selected ? `${room.accentColor}26` : "rgba(4,10,22,0.70)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 7px 2px 4px",
        border: selected ? `1px solid ${room.accentColor}55` : "1px solid rgba(255,255,255,0.10)",
        boxShadow: selected ? `0 0 12px ${room.accentColor}30` : "0 1px 6px rgba(0,0,0,0.45)",
        transition: "all 0.18s ease",
        maxWidth: "85%",
      }}>
        {room.healthPct > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: hp.color,
            background: hp.bg, border: `1px solid ${hp.border}`,
            padding: "0 5px", borderRadius: 999, lineHeight: 1.45, flexShrink: 0,
          }}>{room.healthPct}%</span>
        )}
        <NumberBadge n={room.officeNumber} accent={room.accentColor} />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: room.isUnassigned ? "#94a3b8" : "#e5edf8",
          fontStyle: room.isUnassigned ? "italic" : "normal",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 120,
        }}>{room.name}</span>
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
        ...(selected ? { outline: "2px solid rgba(139,92,246,0.80)", outlineOffset: -2, borderRadius: 8 } : {}),
      }}
    >
      {/* Top compact name pill */}
      <div style={{
        position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
        display: "inline-flex", alignItems: "center", gap: 5,
        background: selected ? "rgba(139,92,246,0.28)" : "rgba(20,6,48,0.72)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 9px",
        border: selected ? "1px solid rgba(139,92,246,0.65)" : "1px solid rgba(139,92,246,0.40)",
        transition: "all 0.18s ease", maxWidth: "90%",
      }}>
        <NumberBadge n={room.officeNumber} accent="#a855f7" />
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: room.isUnassigned ? "#c4b5fd" : "#ddd6fe",
          fontStyle: room.isUnassigned ? "italic" : "normal",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{room.name}</span>
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
          <span style={{ fontSize: 10, color: "#ddd6fe", fontWeight: 600 }}>مشغولة الآن</span>
        </div>
        {(room.isDemo || room.employeeCount === 0) && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#e9d5ff",
            background: "rgba(20,6,48,0.62)",
            border: "1px solid rgba(139,92,246,0.35)",
            padding: "1px 7px", borderRadius: 999,
          }}>11:00 – 11:30</span>
        )}
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
        ...(selected ? { outline: "2px solid rgba(34,211,238,0.70)", outlineOffset: -2, borderRadius: 8 } : {}),
      }}
    >
      {/* Compact HUD pill — top-right */}
      <div style={{
        position: "absolute", top: 6, right: 6,
        display: "inline-flex", alignItems: "center", gap: 5,
        background: selected ? "rgba(34,211,238,0.18)" : "rgba(2,10,22,0.72)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999, padding: "2px 7px 2px 4px",
        border: selected ? "1px solid rgba(34,211,238,0.55)" : "1px solid rgba(34,211,238,0.32)",
        boxShadow: selected ? "0 0 14px rgba(34,211,238,0.30)" : "0 0 10px rgba(34,211,238,0.14)",
        transition: "all 0.18s ease", maxWidth: "85%",
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: hp.color,
          background: hp.bg, border: `1px solid ${hp.border}`,
          padding: "0 5px", borderRadius: 999, lineHeight: 1.45, flexShrink: 0,
        }}>{pct}%</span>
        <NumberBadge n={room.officeNumber} accent="#22d3ee" />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: room.isUnassigned ? "#94a3b8" : "#e5edf8",
          fontStyle: room.isUnassigned ? "italic" : "normal",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 120,
        }}>{room.name}</span>
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
        <NumberBadge n={room.officeNumber} accent="#a855f7" />
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(139,92,246,0.35), rgba(139,92,246,0.06))", border: "1px solid rgba(139,92,246,0.42)", boxShadow: sel ? "0 0 30px rgba(139,92,246,0.35)" : "0 0 20px rgba(139,92,246,0.25)" }}>
          <MessageSquare size={19} color="#c4b5fd" />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", textAlign: "center" }}>مكتب مجلس الإدارة</span>
        <span style={{ fontSize: 9, color: "#9d8bc0", textAlign: "center" }}>المكتب المركزي</span>
        <AvatarRow room={room} />
      </div>
    );
    if (room.isAI) return (
      <div style={{ padding: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 110%, rgba(34,211,238,0.12), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#dde8f4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</span>
          {pct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: ehp.color, background: ehp.bg, border: `1px solid ${ehp.border}`, padding: "1px 5px", borderRadius: 14 }}>{pct}%</span>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(34,211,238,0.26), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.32)", boxShadow: sel ? "0 0 30px rgba(34,211,238,0.30)" : "0 0 20px rgba(34,211,238,0.20)" }}>
          <BrainCircuit size={20} color="#22d3ee" />
        </div>
        <span style={{ fontSize: 9, color: "rgba(34,211,238,0.45)" }}>{room.isDemo ? "AI Engine Active" : room.employeeCount > 0 ? `${room.employeeCount} موظف` : "—"}</span>
      </div>
    );
    return (
      <div style={{ padding: "8px 10px", height: "100%", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 55% at 50% 120%, ${room.accentColor}0a, transparent)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
            <NumberBadge n={room.officeNumber} accent={room.accentColor} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</span>
          </div>
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.12fr 1fr", gridTemplateRows: "minmax(140px,auto) minmax(172px,auto) minmax(140px,auto)", gap: 4, background: "rgba(16,28,50,0.55)", borderRadius: 14, overflow: "hidden", direction: "ltr" }}>
      {/* Row 1: exec(1) | support(2) | meetings(8) */}
      <div style={{ ...G(1, 1), ...bg(slots[1]) }} onClick={() => slots[1] && onRoomClick(slots[1]!)}>{slots[1] && <Inner room={slots[1]} />}</div>
      <div style={{ ...G(2, 1), ...bg(slots[2]) }} onClick={() => slots[2] && onRoomClick(slots[2]!)}>{slots[2] && <Inner room={slots[2]} />}</div>
      <div style={{ ...G(3, 1), ...bg(slots[8]) }} onClick={() => slots[8] && onRoomClick(slots[8]!)}>{slots[8] && <Inner room={slots[8]} />}</div>
      {/* Row 2: marketing(3) | board(4) | finance(5) */}
      <div style={{ ...G(1, 2), ...bg(slots[3]) }} onClick={() => slots[3] && onRoomClick(slots[3]!)}>{slots[3] && <Inner room={slots[3]} />}</div>
      <div style={{ ...G(2, 2), ...bg(slots[4]), alignItems: "center", justifyContent: "center" }} onClick={() => slots[4] && onRoomClick(slots[4]!)}>{slots[4] && <Inner room={slots[4]} />}</div>
      <div style={{ ...G(3, 2), ...bg(slots[5]) }} onClick={() => slots[5] && onRoomClick(slots[5]!)}>{slots[5] && <Inner room={slots[5]} />}</div>
      {/* Row 3: sales(0) | execution(6) | ai(7) */}
      <div style={{ ...G(1, 3), ...bg(slots[0]) }} onClick={() => slots[0] && onRoomClick(slots[0]!)}>{slots[0] && <Inner room={slots[0]} />}</div>
      <div style={{ ...G(2, 3), ...bg(slots[6]) }} onClick={() => slots[6] && onRoomClick(slots[6]!)}>{slots[6] && <Inner room={slots[6]} />}</div>
      <div style={{ ...G(3, 3), ...bg(slots[7]), alignItems: "center", justifyContent: "center" }} onClick={() => slots[7] && onRoomClick(slots[7]!)}>{slots[7] && <Inner room={slots[7]} />}</div>
    </div>
  );
}

// ─── Slot builder ─────────────────────────────────────────────────────────────

function buildSlots(rooms: SceneRoom[]): (SceneRoom | null)[] {
  const s: (SceneRoom | null)[] = Array(9).fill(null);
  const used = new Set<number>();
  const ci = rooms.findIndex((r) => r.isCenter);
  const ai = rooms.findIndex((r) => r.isAI && !r.isCenter);
  if (ci >= 0) { s[4] = rooms[ci]; used.add(ci); }
  if (ai >= 0) { s[7] = rooms[ai]; used.add(ai); }
  const rem = rooms.filter((_, i) => !used.has(i));
  [0, 1, 2, 3, 5, 6, 8].filter((p) => !s[p]).forEach((pos, i) => { if (rem[i]) s[pos] = rem[i]; });
  if (!s[4]) { const fb = rem[7] ?? rooms[Math.floor(rooms.length / 2)]; if (fb) s[4] = { ...fb, isCenter: true }; }
  return s;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function VirtualOfficeReferenceScene({
  rooms,
  selectedRoomId = null,
  onRoomClick,
}: VirtualOfficeReferenceSceneProps) {
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
          <span style={{ fontSize: 9, color: "rgba(34,211,238,0.40)" }}>· اضغط على أي مكتب لإدارته</span>
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

      {/* ── Desktop scene — CSS 3×3 grid is the primary interactive UX ── */}
      <div className="hidden sm:block">
        <CSSFloor slots={slots} selectedRoomId={selectedRoomId ?? ""} onRoomClick={handleClick} />
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
