"use client";

// VirtualOfficeReferenceScene.tsx — VIRTUAL-OFFICE-DESIGN-2D
//
// PRIMARY:  public/assets/virtual-office/office-map-reference.webp
//           Image renders as base layer, overlays float on top.
// FALLBACK: CSS floor plan (if image fails to load / asset missing).
//
// Drop the approved office render at:
//   public/assets/virtual-office/office-map-reference.webp
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

// ─── Asset path ───────────────────────────────────────────────────────────────
// Drop the approved office render here:
const IMAGE_SRC = "/assets/virtual-office/office-map-reference.webp";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#22d3ee", "#a855f7", "#10b981", "#f59e0b",
  "#3b82f6", "#f97316", "#ec4899", "#14b8a6",
];
const DEMO_LETTERS = ["م", "أ", "ع", "س", "ر"];

// Fixed slot positions covering each room area in the image.
// These percentages align with the 3×3 office floor plan layout:
//   col 1 (~0–32%), col 2 (~33–67%), col 3 (~68–100%)
//   row 1 (~0–32%), row 2 (~33–65%), row 3 (~66–100%)
// Meeting room (slot 4) spans rows 2 and 3 in the center column.
interface SlotPos {
  top?: string; bottom?: string;
  left?: string; right?: string;
  width: string;
  height: string;   // explicit height so overlay covers full room area
  isMeeting?: boolean;
}
const SLOT_POSITIONS: SlotPos[] = [
  // Row 1
  { top:    "1%",   left:  "1%",   width: "31%", height: "30%" }, // 0 sales
  { top:    "1%",   left:  "34%",  width: "32%", height: "30%" }, // 1 executive
  { top:    "1%",   right: "1%",   width: "31%", height: "30%" }, // 2 support
  // Row 2
  { top:    "34%",  left:  "1%",   width: "31%", height: "29%" }, // 3 marketing
  { top:    "33%",  left:  "34%",  width: "32%", height: "62%", isMeeting: true }, // 4 MEETING spans rows 2+3
  { top:    "34%",  right: "1%",   width: "31%", height: "29%" }, // 5 finance
  // Row 3
  { bottom: "1%",   left:  "1%",   width: "31%", height: "29%" }, // 6 execution
  { bottom: "1%",   right: "1%",   width: "31%", height: "29%" }, // 7 AI
];

// ─── Health style ─────────────────────────────────────────────────────────────

function hpStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.22)", border: "rgba(16,185,129,0.40)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.40)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.22)",    border: "rgba(239,68,68,0.40)"  };
}

// ─── Avatar row ───────────────────────────────────────────────────────────────

function AvatarRow({ room, size = 24 }: { room: SceneRoom; size?: number }) {
  const items =
    room.avatars.length > 0
      ? room.avatars.slice(0, 3).map((a, i) => ({ key: `a${i}`, bg: a.color, label: a.initials }))
      : room.isDemo && room.employeeCount > 0
        ? Array.from({ length: Math.min(room.employeeCount, 3) }).map((_, i) => ({
            key: `d${i}`,
            bg: AVATAR_COLORS[(i * 3) % AVATAR_COLORS.length] ?? "#22d3ee",
            label: DEMO_LETTERS[i] ?? "م",
          }))
        : [];
  const extra = Math.max(0, room.employeeCount - 3);
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {items.map((a) => (
        <div
          key={a.key}
          style={{
            width: size, height: size, borderRadius: "50%", flexShrink: 0,
            background: a.bg, border: "2px solid rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size <= 24 ? 9 : 11, fontWeight: 700, color: "#fff",
          }}
        >
          {a.label}
        </div>
      ))}
      {extra > 0 && (
        <span style={{ fontSize: 9, color: "#8ba3c7", marginRight: 2 }}>+{extra}</span>
      )}
    </div>
  );
}

// ─── Standard room overlay ────────────────────────────────────────────────────
// Compact top-strip label (health%, name, alert badge) + bottom avatars.
// The middle of the slot is transparent so the image shows through.

function RoomOverlay({ room }: { room: SceneRoom }) {
  const hp = hpStyle(room.healthPct);
  return (
    <div
      style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "6px 6px 8px",
      }}
    >
      {/* TOP: health badge + name + alert */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(4,10,22,0.72)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 8,
          padding: "5px 8px",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        }}
      >
        {room.healthPct > 0 && (
          <span
            style={{
              fontSize: 11, fontWeight: 800, color: hp.color,
              background: hp.bg, border: `1px solid ${hp.border}`,
              padding: "1px 6px", borderRadius: 14, flexShrink: 0, lineHeight: 1.5,
            }}
          >
            {room.healthPct}%
          </span>
        )}
        <span
          style={{
            fontSize: 11, fontWeight: 700, color: "#ffffff",
            flex: 1, minWidth: 0, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {room.name}
        </span>
        {room.overdueTasks > 0 && (
          <span
            style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 700, flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 8px rgba(239,68,68,0.60)",
            }}
          >
            {room.overdueTasks}
          </span>
        )}
      </div>

      {/* BOTTOM: employee avatars */}
      <div style={{ paddingRight: 4 }}>
        <AvatarRow room={room} />
      </div>
    </div>
  );
}

// ─── Meeting room overlay ─────────────────────────────────────────────────────
// Center overlay — purple glass panel aligned in the middle of the slot.

function MeetingOverlay({ room }: { room: SceneRoom }) {
  return (
    <div
      style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 6,
      }}
    >
      {/* Top name strip */}
      <div
        style={{
          position: "absolute", top: 6, left: 6, right: 6,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(20,6,48,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 8, padding: "5px 8px",
          border: "1px solid rgba(139,92,246,0.40)",
        }}
      >
        <span
          style={{
            fontSize: 11, fontWeight: 700, color: "#dde8f4",
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {room.name}
        </span>
      </div>

      {/* Center status pill */}
      <div
        style={{
          background: "rgba(20,6,48,0.80)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(139,92,246,0.50)",
          borderRadius: 30, padding: "10px 18px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          boxShadow: "0 0 40px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#a78bfa", display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>مشغولة الآن</span>
        </div>
        <div
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.40), rgba(139,92,246,0.06))",
            border: "1px solid rgba(139,92,246,0.50)",
            boxShadow: "0 0 18px rgba(139,92,246,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <MessageSquare size={17} color="#c4b5fd" />
        </div>
        {(room.isDemo || room.employeeCount === 0) && (
          <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>
            11:00 – 11:30
          </span>
        )}
      </div>

      {/* Bottom avatars */}
      <div style={{ position: "absolute", bottom: 8 }}>
        <AvatarRow room={room} />
      </div>
    </div>
  );
}

// ─── AI room overlay ──────────────────────────────────────────────────────────

function AIOverlay({ room }: { room: SceneRoom }) {
  const effectivePct = room.healthPct > 0 ? room.healthPct : 94;
  const hp = hpStyle(effectivePct);
  return (
    <div
      style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "6px 6px 8px",
      }}
    >
      {/* Top: name + health */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(2,10,22,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 8, padding: "5px 8px",
          border: "1px solid rgba(34,211,238,0.30)",
          boxShadow: "0 0 14px rgba(34,211,238,0.12)",
        }}
      >
        <span
          style={{
            fontSize: 11, fontWeight: 700, color: "#ffffff",
            flex: 1, minWidth: 0, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {room.name}
        </span>
        <span
          style={{
            fontSize: 11, fontWeight: 800, color: hp.color,
            background: hp.bg, border: `1px solid ${hp.border}`,
            padding: "1px 6px", borderRadius: 14, flexShrink: 0,
          }}
        >
          {effectivePct}%
        </span>
      </div>

      {/* Center: Brain icon */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.30), rgba(34,211,238,0.04))",
            border: "1px solid rgba(34,211,238,0.38)",
            boxShadow: "0 0 24px rgba(34,211,238,0.25), 0 0 50px rgba(139,92,246,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <BrainCircuit size={22} color="#22d3ee" />
        </div>
      </div>

      {/* Bottom */}
      <div style={{ paddingRight: 4 }}>
        <AvatarRow room={room} />
      </div>
    </div>
  );
}

// ─── CSS Fallback (active when image missing or fails to load) ─────────────────

function hpCssStyle(pct: number) {
  if (pct >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.32)" };
  if (pct >= 70) return { color: "#f59e0b", bg: "rgba(245,158,11,0.18)",  border: "rgba(245,158,11,0.32)" };
  return             { color: "#ef4444", bg: "rgba(239,68,68,0.18)",    border: "rgba(239,68,68,0.32)"  };
}

function CSSFloor({ slots }: { slots: (SceneRoom | null)[] }) {
  function roomBg(r: SceneRoom | null): React.CSSProperties {
    if (!r) return { background: "rgba(4,10,20,0.6)", border: "1px solid rgba(255,255,255,0.02)" };
    if (r.isCenter) return {
      background: "linear-gradient(160deg, rgba(28,8,58,0.96), rgba(14,5,38,0.98))",
      border: "2px solid rgba(139,92,246,0.40)",
      boxShadow: "0 0 44px rgba(139,92,246,0.14), inset 0 0 40px rgba(139,92,246,0.06)",
    };
    if (r.isAI) return {
      background: "linear-gradient(160deg, rgba(3,10,24,0.98), rgba(5,14,32,0.99))",
      border: "1px solid rgba(34,211,238,0.24)",
      boxShadow: "0 0 36px rgba(34,211,238,0.10), 0 0 50px rgba(139,92,246,0.07)",
    };
    return {
      background: "linear-gradient(160deg, rgba(5,13,26,0.97), rgba(8,18,36,0.99))",
      borderTop: `2px solid ${r.accentColor}55`,
      border: "1px solid rgba(255,255,255,0.045)",
    };
  }

  function InnerLabel({ room }: { room: SceneRoom }) {
    const hp = hpCssStyle(room.healthPct);
    if (room.isCenter) return (
      <div style={{ padding: 12, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(139,92,246,0.18), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 600 }}>مشغولة الآن</span>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(139,92,246,0.35), rgba(139,92,246,0.06))", border: "1px solid rgba(139,92,246,0.42)", boxShadow: "0 0 20px rgba(139,92,246,0.25)" }}>
          <MessageSquare size={19} color="#c4b5fd" />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4" }}>{room.name}</span>
        {room.isDemo && <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 600 }}>11:00 – 11:30</span>}
        <AvatarRow room={room} />
      </div>
    );
    if (room.isAI) {
      const ePct = room.healthPct > 0 ? room.healthPct : 94;
      const ehp = hpCssStyle(ePct);
      return (
        <div style={{ padding: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 110%, rgba(34,211,238,0.12), transparent)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#dde8f4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ehp.color, background: ehp.bg, border: `1px solid ${ehp.border}`, padding: "1px 5px", borderRadius: 14 }}>{ePct}%</span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(34,211,238,0.26), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.32)", boxShadow: "0 0 20px rgba(34,211,238,0.20)" }}>
            <BrainCircuit size={20} color="#22d3ee" />
          </div>
          <span style={{ fontSize: 9, color: "rgba(34,211,238,0.45)" }}>{room.isDemo ? "AI Engine Active" : room.employeeCount > 0 ? `${room.employeeCount} موظف` : "—"}</span>
        </div>
      );
    }
    return (
      <div style={{ padding: "8px 10px", height: "100%", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 55% at 50% 120%, ${room.accentColor}0a, transparent)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#dde8f4", flex: 1, lineHeight: 1.25 }}>{room.name}</span>
          <div style={{ display: "flex", gap: 3 }}>
            {room.overdueTasks > 0 && <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{room.overdueTasks}</span>}
            {room.healthPct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: hp.color, background: hp.bg, border: `1px solid ${hp.border}`, padding: "1px 5px", borderRadius: 14 }}>{room.healthPct}%</span>}
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
    return { gridColumn: col as React.CSSProperties["gridColumn"], gridRow: row as React.CSSProperties["gridRow"], position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" };
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.12fr 1fr", gridTemplateRows: "minmax(155px,auto) minmax(172px,auto) minmax(148px,auto)", gap: 4, background: "rgba(16,28,50,0.55)", borderRadius: 14, overflow: "hidden" }}>
      {[0, 1, 2].map((i) => (
        <div key={`r${i}`} style={{ ...G(i + 1, 1), ...roomBg(slots[i]) }}>
          {slots[i] && <InnerLabel room={slots[i]!} />}
        </div>
      ))}
      <div style={{ ...G(1, 2), ...roomBg(slots[3]) }}>{slots[3] && <InnerLabel room={slots[3]} />}</div>
      <div style={{ ...G(2, "2 / 4"), ...roomBg(slots[4]), alignItems: "center", justifyContent: "center" }}>{slots[4] && <InnerLabel room={slots[4]} />}</div>
      <div style={{ ...G(3, 2), ...roomBg(slots[5]) }}>{slots[5] && <InnerLabel room={slots[5]} />}</div>
      <div style={{ ...G(1, 3), ...roomBg(slots[6]) }}>{slots[6] && <InnerLabel room={slots[6]} />}</div>
      <div style={{ ...G(3, 3), ...roomBg(slots[7]), alignItems: "center", justifyContent: "center" }}>{slots[7] && <InnerLabel room={slots[7]} />}</div>
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
    <div
      style={{
        background: "rgba(2,6,16,0.99)",
        border: "2px solid rgba(45,75,125,0.28)",
        borderRadius: 20,
        padding: 4,
        boxShadow: "0 0 100px rgba(34,211,238,0.04), 0 32px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: 11, color: "rgba(80,120,160,0.85)", fontWeight: 500 }}>مخطط الطابق الرئيسي</span>
          {!imgFailed && (
            <span style={{ fontSize: 9, color: "rgba(34,211,238,0.40)", marginRight: 4 }}>· مرئي تفاعلي</span>
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

      {/* ── Desktop scene ── */}
      <div className="hidden sm:block">
        {!imgFailed ? (
          // ─────────────────────────────────────────────────────────────────────
          // PRIMARY: Image base + HUD overlay hotspots
          // The image draws all walls, desks, plants, floor texture.
          // Overlays add only: labels, health badges, alerts, avatars.
          // ─────────────────────────────────────────────────────────────────────
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", minHeight: 490 }}>
            {/* Base layer: office map image */}
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

            {/* Layer 2: cinematic vignette */}
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.50) 100%)",
              }}
            />

            {/* Layer 3: ambient cyan + purple glow */}
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 50% 30% at 10% 10%, rgba(34,211,238,0.07), transparent), " +
                  "radial-gradient(ellipse 45% 30% at 90% 90%, rgba(139,92,246,0.09), transparent)",
              }}
            />

            {/* Layer 4: room overlay hotspots */}
            {slots.map((room, i) => {
              if (!room) return null;
              const pos = SLOT_POSITIONS[i];
              if (!pos) return null;
              const ps: React.CSSProperties = {
                position: "absolute",
                width: pos.width,
                height: pos.height,
                ...(pos.top    != null ? { top:    pos.top    } : {}),
                ...(pos.bottom != null ? { bottom: pos.bottom } : {}),
                ...(pos.left   != null ? { left:   pos.left   } : {}),
                ...(pos.right  != null ? { right:  pos.right  } : {}),
                zIndex: pos.isMeeting ? 10 : 5,
              };
              return (
                <div key={room.id} style={ps}>
                  {room.isCenter
                    ? <MeetingOverlay room={room} />
                    : room.isAI
                      ? <AIOverlay room={room} />
                      : <RoomOverlay room={room} />}
                </div>
              );
            })}
          </div>
        ) : (
          // ─────────────────────────────────────────────────────────────────────
          // FALLBACK: CSS floor plan (image unavailable)
          // ─────────────────────────────────────────────────────────────────────
          <CSSFloor slots={slots} />
        )}
      </div>

      {/* ── Mobile stacked ── */}
      <div className="sm:hidden space-y-2 p-1">
        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              borderRadius: 12,
              border: room.isCenter
                ? "1px solid rgba(139,92,246,0.40)"
                : room.isAI
                  ? "1px solid rgba(34,211,238,0.24)"
                  : `1px solid ${room.accentColor}28`,
              background: room.isCenter
                ? "rgba(20,6,48,0.80)"
                : room.isAI
                  ? "rgba(2,10,22,0.80)"
                  : "rgba(5,12,26,0.75)",
              padding: "12px", minHeight: 88,
            }}
          >
            {room.isCenter
              ? <MeetingOverlay room={room} />
              : room.isAI
                ? <AIOverlay room={room} />
                : <RoomOverlay room={room} />}
          </div>
        ))}
      </div>
    </div>
  );
}
