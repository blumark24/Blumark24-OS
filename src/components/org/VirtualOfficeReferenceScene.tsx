"use client";

// VirtualOfficeReferenceScene.tsx — VIRTUAL-OFFICE-DESIGN-2D
//
// Layered architecture:
//   Layer 1 — Base image (office-map-reference.webp) OR CSS atmospheric floor
//   Layer 2 — Vignette + cyan/purple glow
//   Layer 3 — Absolute-positioned HUD overlay hotspots per room
//
// Drop the approved office render at:
//   public/assets/virtual-office/office-map-reference.webp
// → it automatically replaces the CSS fallback floor.
//
// Read-only · isolated from /org · no external 3D libraries.

import { useState, useMemo } from "react";
import Image from "next/image";
import { BrainCircuit, MessageSquare } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SceneRoom {
  id: string;
  name: string;
  accentColor: string;
  employeeCount: number;
  avatars: Array<{ initials: string; color: string }>;
  openTasks: number;
  overdueTasks: number;
  healthPct: number;
  isCenter: boolean;
  isAI: boolean;
  isDemo: boolean;
}

export interface VirtualOfficeReferenceSceneProps {
  rooms: SceneRoom[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];
const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];

// 8 fixed overlay slot positions calibrated for the approved reference image.
// Adjust percentages after placing the actual image asset if needed.
interface SlotPos {
  top?: string; bottom?: string;
  left?: string; right?: string;
  width: string;
  tall?: boolean; // meeting room spans taller
}
const SLOT_POSITIONS: SlotPos[] = [
  { top: "3%",    left:  "1%",   width: "30%" },
  { top: "3%",    left:  "34%",  width: "32%" },
  { top: "3%",    right: "1%",   width: "30%" },
  { top: "37%",   left:  "1%",   width: "30%" },
  { top: "34%",   left:  "34%",  width: "32%", tall: true },
  { top: "37%",   right: "1%",   width: "30%" },
  { bottom: "2%", left:  "1%",   width: "30%" },
  { bottom: "2%", right: "1%",   width: "30%" },
];

// ─── Health style ─────────────────────────────────────────────────────────────

function hpStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.32)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.18)",  border: "rgba(245,158,11,0.32)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.18)",    border: "rgba(239,68,68,0.32)"  };
}

// ─── Shared avatar row ────────────────────────────────────────────────────────

function SmallAvatarRow({ room, size = 22 }: { room: SceneRoom; size?: number }) {
  const show = room.avatars.length > 0
    ? room.avatars.slice(0, 3).map((a, i) => ({ key: `a${i}`, bg: a.color, label: a.initials }))
    : room.isDemo && room.employeeCount > 0
      ? Array.from({ length: Math.min(room.employeeCount, 3) }).map((_, i) => ({
          key: `d${i}`, bg: AVATAR_COLORS[(i * 3) % AVATAR_COLORS.length] ?? "#22d3ee", label: DEMO_LETTERS[i] ?? "م",
        }))
      : [];
  if (show.length === 0) return null;
  const extra = room.avatars.length > 0 ? Math.max(0, room.employeeCount - 3) : Math.max(0, room.employeeCount - 3);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {show.map((a) => (
        <div key={a.key} style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          background: a.bg, border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size <= 22 ? 8 : 10, fontWeight: 700, color: "#fff",
        }}>{a.label}</div>
      ))}
      {extra > 0 && (
        <span style={{ fontSize: 9, color: "#5a7a9a" }}>+{extra}</span>
      )}
    </div>
  );
}

// ─── Room HUD hotspot (standard) ──────────────────────────────────────────────

function RoomHotspot({ room }: { room: SceneRoom }) {
  const hp = hpStyle(room.healthPct);
  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${room.accentColor}30`,
      background: "rgba(5,12,26,0.70)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      padding: "8px 10px",
      display: "flex", flexDirection: "column", gap: 6,
      boxShadow: `0 0 18px ${room.accentColor}0e, inset 0 1px 0 rgba(255,255,255,0.06)`,
    }}>
      {/* Name + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", lineHeight: 1.25, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {room.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          {room.overdueTasks > 0 && (
            <span style={{
              width: 16, height: 16, borderRadius: "50%", background: "#ef4444",
              color: "#fff", fontSize: 9, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>{room.overdueTasks}</span>
          )}
          {room.healthPct > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: hp.color, background: hp.bg, border: `1px solid ${hp.border}`, padding: "1px 6px", borderRadius: 16 }}>
              {room.healthPct}%
            </span>
          )}
        </div>
      </div>
      {/* Avatars */}
      <SmallAvatarRow room={room} />
    </div>
  );
}

// ─── Meeting room HUD hotspot ─────────────────────────────────────────────────

function MeetingHotspot({ room }: { room: SceneRoom }) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(139,92,246,0.44)",
      background: "rgba(20,6,48,0.75)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 7, alignItems: "center",
      boxShadow: "0 0 36px rgba(139,92,246,0.20), inset 0 1px 0 rgba(255,255,255,0.07)",
    }}>
      {/* Status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
        <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 600 }}>مشغولة الآن</span>
      </div>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.38), rgba(139,92,246,0.06))",
        border: "1px solid rgba(139,92,246,0.44)", boxShadow: "0 0 20px rgba(139,92,246,0.26)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MessageSquare size={19} color="#c4b5fd" />
      </div>
      {/* Room label */}
      <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4" }}>{room.name}</span>
      {/* Time */}
      {(room.isDemo || room.employeeCount === 0) && (
        <>
          <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 600 }}>11:00 – 11:30</span>
          <span style={{ fontSize: 9, color: "rgba(139,92,246,0.50)", textAlign: "center" }}>مراجعة فرص البيع الشهرية</span>
        </>
      )}
      {/* Avatars */}
      <SmallAvatarRow room={room} />
    </div>
  );
}

// ─── AI room HUD hotspot ──────────────────────────────────────────────────────

function AIHotspot({ room }: { room: SceneRoom }) {
  const effectivePct = room.healthPct > 0 ? room.healthPct : 94;
  const hp = hpStyle(effectivePct);
  return (
    <div style={{
      borderRadius: 12,
      border: "1px solid rgba(34,211,238,0.28)",
      background: "rgba(2,10,22,0.76)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "8px 10px",
      display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
      boxShadow: "0 0 30px rgba(34,211,238,0.12), 0 0 50px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      {/* Name + badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#dde8f4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: hp.color, background: hp.bg, border: `1px solid ${hp.border}`, padding: "1px 5px", borderRadius: 14 }}>{effectivePct}%</span>
      </div>
      {/* Brain icon */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.28), rgba(34,211,238,0.04))",
        border: "1px solid rgba(34,211,238,0.34)", boxShadow: "0 0 20px rgba(34,211,238,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BrainCircuit size={20} color="#22d3ee" />
      </div>
      <span style={{ fontSize: 9, color: "rgba(34,211,238,0.45)" }}>
        {room.employeeCount > 0 ? `${room.employeeCount} موظف` : room.isDemo ? "AI Engine Active" : "—"}
      </span>
    </div>
  );
}

// ─── CSS Fallback floor plan ──────────────────────────────────────────────────
// Used when image asset is unavailable.
// Same 3×3 grid structure as the image overlay, so data positions match.

function CSSFloor({ slots }: { slots: (SceneRoom | null)[] }) {
  function bg(room: SceneRoom | null): React.CSSProperties {
    if (!room) return { background: "rgba(4,10,20,0.6)", border: "1px solid rgba(255,255,255,0.02)" };
    if (room.isCenter) return {
      background: "linear-gradient(160deg, rgba(28,8,58,0.96), rgba(14,5,38,0.98))",
      border: "2px solid rgba(139,92,246,0.40)",
      boxShadow: "0 0 44px rgba(139,92,246,0.14), inset 0 0 40px rgba(139,92,246,0.06)",
    };
    if (room.isAI) return {
      background: "linear-gradient(160deg, rgba(3,10,24,0.98), rgba(5,14,32,0.99))",
      border: "1px solid rgba(34,211,238,0.24)",
      boxShadow: "0 0 36px rgba(34,211,238,0.10), 0 0 50px rgba(139,92,246,0.07)",
    };
    return {
      background: "linear-gradient(160deg, rgba(5,13,26,0.97), rgba(8,18,36,0.99))",
      borderTop: `2px solid ${room.accentColor}55`,
      border: "1px solid rgba(255,255,255,0.045)",
    };
  }

  function wrapStyle(col: number | string, row: number | string): React.CSSProperties {
    return {
      gridColumn: col as React.CSSProperties["gridColumn"],
      gridRow:    row as React.CSSProperties["gridRow"],
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    };
  }

  function Glow({ room }: { room: SceneRoom }) {
    const color = room.isCenter ? "rgba(139,92,246,0.18)" : room.isAI ? "rgba(34,211,238,0.10)" : `${room.accentColor}0a`;
    return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 120%, ${color}, transparent)`, pointerEvents: "none" }} />;
  }

  function CellInner({ room }: { room: SceneRoom }) {
    return (
      <div style={{ padding: "10px 12px", height: "100%", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
        <Glow room={room} />
        {room.isCenter
          ? <MeetingHotspot room={room} />
          : room.isAI
            ? <AIHotspot room={room} />
            : <RoomHotspot room={room} />}
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1.12fr 1fr",
      gridTemplateRows: "minmax(155px,auto) minmax(172px,auto) minmax(148px,auto)",
      gap: 4,
      background: "rgba(16,28,50,0.55)",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {[0, 1, 2].map((i) => (
        <div key={`r${i}`} style={{ ...wrapStyle(i + 1, 1), ...bg(slots[i]) }}>
          {slots[i] && <CellInner room={slots[i]!} />}
        </div>
      ))}
      <div style={{ ...wrapStyle(1, 2), ...bg(slots[3]) }}>
        {slots[3] && <CellInner room={slots[3]} />}
      </div>
      <div style={{ ...wrapStyle(2, "2 / 4"), ...bg(slots[4]), alignItems: "center", justifyContent: "center" }}>
        {slots[4] && <CellInner room={slots[4]} />}
      </div>
      <div style={{ ...wrapStyle(3, 2), ...bg(slots[5]) }}>
        {slots[5] && <CellInner room={slots[5]} />}
      </div>
      <div style={{ ...wrapStyle(1, 3), ...bg(slots[6]) }}>
        {slots[6] && <CellInner room={slots[6]} />}
      </div>
      <div style={{ ...wrapStyle(3, 3), ...bg(slots[7]), alignItems: "center", justifyContent: "center" }}>
        {slots[7] && <CellInner room={slots[7]} />}
      </div>
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
  if (!s[4]) {
    const fb = rem[6] ?? rooms[Math.floor(rooms.length / 2)];
    if (fb) s[4] = { ...fb, isCenter: true };
  }
  return s;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function VirtualOfficeReferenceScene({ rooms }: VirtualOfficeReferenceSceneProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const slots = useMemo(() => buildSlots(rooms), [rooms]);

  return (
    <div style={{
      background: "rgba(2,6,16,0.99)",
      border: "2px solid rgba(45,75,125,0.28)",
      borderRadius: 20,
      padding: 4,
      boxShadow: "0 0 100px rgba(34,211,238,0.04), 0 32px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Header bar */}
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: 11, color: "rgba(80,120,160,0.85)", fontWeight: 500 }}>مخطط الطابق الرئيسي</span>
          {!imgFailed && (
            <span style={{ fontSize: 9, color: "rgba(60,90,130,0.5)", marginRight: 4 }}>· عرض تفاعلي</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { c: "#10b981", l: `${rooms.filter((r) => !r.isCenter && !r.isAI).length} غرفة` },
            { c: "#a855f7", l: "قاعة اجتماعات" },
            { c: "#22d3ee", l: "غرفة AI" },
          ].map((x) => (
            <span key={x.l} style={{ fontSize: 10, color: "rgba(60,90,130,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.c, display: "inline-block" }} />
              {x.l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:block">
        {!imgFailed ? (
          // ── IMAGE + OVERLAY MODE ──
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", minHeight: 490 }}>
            {/* Base image — Next.js optimised, falls back to CSS floor on error */}
            <div style={{ position: "relative", width: "100%", minHeight: 490 }}>
              <Image
                src={IMAGE_SRC}
                alt="Office floor plan"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                onError={() => setImgFailed(true)}
                priority
              />
            </div>
            {/* Cinematic dark vignette */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.60) 100%)",
            }} />
            {/* Ambient cyan + purple glow */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background:
                "radial-gradient(ellipse 55% 35% at 10% 12%, rgba(34,211,238,0.09), transparent), " +
                "radial-gradient(ellipse 50% 35% at 88% 88%, rgba(139,92,246,0.11), transparent)",
            }} />
            {/* Room hotspot overlays */}
            {slots.map((room, i) => {
              if (!room) return null;
              const pos = SLOT_POSITIONS[i];
              if (!pos) return null;
              const ps: React.CSSProperties = {
                position: "absolute",
                width: pos.width,
                ...(pos.top    != null ? { top:    pos.top    } : {}),
                ...(pos.bottom != null ? { bottom: pos.bottom } : {}),
                ...(pos.left   != null ? { left:   pos.left   } : {}),
                ...(pos.right  != null ? { right:  pos.right  } : {}),
                ...(pos.tall           ? { minHeight: 190 }     : {}),
                zIndex: i === 4 ? 10 : 5,
              };
              return (
                <div key={room.id} style={ps}>
                  {room.isCenter
                    ? <MeetingHotspot room={room} />
                    : room.isAI
                      ? <AIHotspot room={room} />
                      : <RoomHotspot room={room} />}
                </div>
              );
            })}
          </div>
        ) : (
          // ── CSS FALLBACK MODE ──
          <CSSFloor slots={slots} />
        )}
      </div>

      {/* ── Mobile stacked ── */}
      <div className="sm:hidden space-y-2 p-1">
        {rooms.map((room) => (
          <div key={room.id} style={{
            borderRadius: 12,
            border: room.isCenter
              ? "1px solid rgba(139,92,246,0.40)"
              : room.isAI
                ? "1px solid rgba(34,211,238,0.24)"
                : `1px solid ${room.accentColor}28`,
            background: room.isCenter
              ? "rgba(20,6,48,0.75)"
              : room.isAI
                ? "rgba(2,10,22,0.76)"
                : "rgba(5,12,26,0.70)",
            padding: "10px 12px", minHeight: 80,
          }}>
            {room.isCenter
              ? <MeetingHotspot room={room} />
              : room.isAI
                ? <AIHotspot room={room} />
                : <RoomHotspot room={room} />}
          </div>
        ))}
      </div>
    </div>
  );
}
