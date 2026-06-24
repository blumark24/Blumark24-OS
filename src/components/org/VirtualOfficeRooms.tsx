"use client";

// VirtualOfficeRooms — C15
// Rooms / workspace zones inside each virtual office.
// All states are informational only — no real presence, no fake data.
// Each office shows 3 rooms; board office shows 4 command rooms.

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RoomState = "ready_after_link" | "needs_link" | "informational";

interface RoomDef {
  id: string;
  name: string;
  type: string;
  purpose: string;
  state: RoomState;
  stateLabel: string;
  accent: string;
}

// ─── Room definitions ─────────────────────────────────────────────────────────

const BOARD_ROOMS: RoomDef[] = [
  {
    id: "board-chamber",
    name: "غرفة مجلس الإدارة",
    type: "غرفة تنفيذية",
    purpose: "مخصصة لجلسات المجلس وقرارات الاستراتيجية.",
    state: "ready_after_link",
    stateLabel: "جاهزة بعد ربط البيانات",
    accent: "#a855f7",
  },
  {
    id: "board-kpi",
    name: "غرفة مؤشرات الأداء",
    type: "لوحة تشغيل",
    purpose: "تعرض مؤشرات الأداء بعد ربط البيانات التشغيلية.",
    state: "informational",
    stateLabel: "غير مفعّل تشغيلياً",
    accent: "#f59e0b",
  },
  {
    id: "board-dt",
    name: "غرفة التوأم الرقمي",
    type: "غرفة تركيز",
    purpose: "تعكس حالة المكاتب والوحدات التشغيلية بصرياً.",
    state: "ready_after_link",
    stateLabel: "جاهز بعد ربط المكاتب",
    accent: "#22d3ee",
  },
  {
    id: "board-ai",
    name: "غرفة مساعد التشغيل",
    type: "غرفة ذكاء اصطناعي",
    purpose: "يدعم قراءة حالة المقر واقتراح الخطوات بعد توفر البيانات.",
    state: "informational",
    stateLabel: "غير مفعّل تشغيلياً",
    accent: "#a855f7",
  },
];

function getOfficeRooms(isLinked: boolean): RoomDef[] {
  const state: RoomState = isLinked ? "ready_after_link" : "needs_link";
  const stateLabel = isLinked ? "جاهزة بعد الربط" : "يحتاج تفعيل";
  return [
    {
      id: "room-meeting",
      name: "غرفة اجتماع",
      type: "غرفة اجتماع",
      purpose: "مخصصة لاجتماعات الفريق داخل هذا المكتب.",
      state,
      stateLabel,
      accent: "#3b82f6",
    },
    {
      id: "room-workspace",
      name: "مساحة عمل",
      type: "مساحة عمل",
      purpose: "منطقة العمل اليومي للموظفين المرتبطين بهذا المكتب.",
      state,
      stateLabel,
      accent: "#22d3ee",
    },
    {
      id: "room-focus",
      name: "غرفة تركيز",
      type: "غرفة تركيز",
      purpose: "مخصصة للعمل الفردي والمهام التي تحتاج تركيزاً عالياً.",
      state,
      stateLabel,
      accent: "#10b981",
    },
  ];
}

// ─── State colors ─────────────────────────────────────────────────────────────

function stateColors(state: RoomState): { border: string; bg: string; dot: string; text: string } {
  if (state === "ready_after_link") {
    return { border: "rgba(245,158,11,0.28)", bg: "rgba(245,158,11,0.06)", dot: "#f59e0b", text: "#fbbf24" };
  }
  if (state === "informational") {
    return { border: "rgba(168,85,247,0.22)", bg: "rgba(168,85,247,0.05)", dot: "#a855f7", text: "#c4b5fd" };
  }
  // needs_link
  return { border: "rgba(100,116,139,0.22)", bg: "rgba(100,116,139,0.05)", dot: "#64748b", text: "#94a3b8" };
}

// ─── Room detail panel ────────────────────────────────────────────────────────

interface RoomDetailPanelProps {
  room: RoomDef;
  officeName: string;
  onBack: () => void;
}

function RoomDetailPanel({ room, officeName, onBack }: RoomDetailPanelProps) {
  const sc = stateColors(room.state);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "transparent", border: "none", cursor: "pointer",
          color: "#8ba3c7", fontSize: 11, padding: "2px 0", fontWeight: 600,
        }}
      >
        <ArrowRight size={13} />
        العودة إلى المكتب
      </button>

      {/* Room header */}
      <div style={{
        borderRadius: 12, padding: "10px 12px",
        border: `1px solid ${sc.border}`,
        background: sc.bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: sc.text, fontWeight: 700 }}>{room.stateLabel}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#dff7ff", marginBottom: 2 }}>{room.name}</div>
        <div style={{ fontSize: 10.5, color: "#5a7a9a" }}>{room.type}</div>
      </div>

      {/* Purpose */}
      <div style={{
        borderRadius: 10, padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ fontSize: 9.5, color: "#4a6a8a", fontWeight: 600, marginBottom: 3 }}>وصف الغرفة</div>
        <p style={{ margin: 0, fontSize: 11, color: "#8ba3c7", lineHeight: 1.55 }}>{room.purpose}</p>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "المكتب", value: officeName },
          { label: "النوع", value: room.type },
          { label: "الموظفون", value: "غير متاح" },
          { label: "المهام", value: "غير متاح" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            borderRadius: 9, padding: "6px 10px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize: 9, color: "#3a5a7a", fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: "#7a9abc", fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Meeting state */}
      <div style={{
        borderRadius: 9, padding: "7px 12px",
        border: "1px solid rgba(100,116,139,0.18)",
        background: "rgba(100,116,139,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10.5, color: "#5a7a9a", fontWeight: 600 }}>الاجتماع</span>
        <span style={{ fontSize: 10, color: "#475569" }}>غير مفعّل</span>
      </div>

      {/* Honest note */}
      <p style={{ margin: 0, fontSize: 9.5, color: "#2a4462", lineHeight: 1.5, padding: "2px 0" }}>
        يتم تفعيل بيانات الغرفة بعد ربط الموظفين والمهام بهذا المكتب.
      </p>
    </div>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: RoomDef;
  onOpen: (room: RoomDef) => void;
}

function RoomCard({ room, onOpen }: RoomCardProps) {
  const sc = stateColors(room.state);
  return (
    <button
      type="button"
      onClick={() => onOpen(room)}
      style={{
        width: "100%", textAlign: "right",
        borderRadius: 10, padding: "8px 10px",
        border: `1px solid ${sc.border}`,
        background: sc.bg,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        transition: "background-color 0.1s ease, border-color 0.1s ease",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c0d4ee", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.name}
          </span>
        </div>
        <span style={{ fontSize: 9.5, color: sc.text }}>{room.stateLabel}</span>
      </div>
      <ArrowRight size={12} color="#3a5a7a" style={{ flexShrink: 0 }} />
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface VirtualOfficeRoomsProps {
  isBoard: boolean;
  isLinked: boolean;
  officeName: string;
}

export default function VirtualOfficeRooms({ isBoard, isLinked, officeName }: VirtualOfficeRoomsProps) {
  const [selectedRoom, setSelectedRoom] = useState<RoomDef | null>(null);

  const rooms = isBoard ? BOARD_ROOMS : getOfficeRooms(isLinked);

  if (selectedRoom) {
    return (
      <RoomDetailPanel
        room={selectedRoom}
        officeName={officeName}
        onBack={() => setSelectedRoom(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ fontSize: 9.5, color: "#4a6a8a", fontWeight: 600, marginBottom: 2 }}>
        {isBoard ? "غرف القيادة والتحكم" : "مساحات العمل والغرف"}
      </div>
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onOpen={setSelectedRoom} />
      ))}
      {!isBoard && (
        <p style={{ margin: "2px 0 0", fontSize: 9.5, color: "#2a4462", lineHeight: 1.4 }}>
          {isLinked
            ? "تُفعَّل الغرف تلقائياً بعد ربط الموظفين والمهام."
            : "اربط المكتب لتفعيل غرف العمل والاجتماعات."}
        </p>
      )}
    </div>
  );
}
