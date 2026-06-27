import { Home, ClipboardList, Users, MoreHorizontal, Plus } from "lucide-react";

/**
 * Mobile bottom navigation with a center glowing plus button.
 *
 * RTL order from start-to-end: المزيد · العملاء · (+) · المهام · الرئيسية
 * (Visually appears right→left in RTL with الرئيسية on the right.)
 */
export default function BottomNav() {
  return (
    <div
      className="absolute bottom-0 inset-x-0 z-20 px-3 pt-3 pb-3"
      style={{
        background:
          "linear-gradient(to top, rgba(2,8,23,0.95) 60%, rgba(2,8,23,0.55))",
        borderTop: "1px solid rgba(125, 220, 255, 0.14)",
      }}
    >
      <div className="relative flex items-end justify-between">
        <NavItem label="المزيد" Icon={MoreHorizontal} />
        <NavItem label="العملاء" Icon={Users} />

        {/* Center plus */}
        <div className="relative -mt-7 px-2 shrink-0">
          <span
            aria-hidden
            className="absolute -inset-2 rounded-full blur-2xl opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(0,217,255,0.55), transparent 70%)",
            }}
          />
          <button
            type="button"
            aria-label="إضافة"
            className="relative grid place-items-center h-14 w-14 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #00D9FF 0%, #147CFF 100%)",
              boxShadow:
                "0 6px 18px rgba(0,217,255,0.45), inset 0 1px 0 rgba(255,255,255,0.30), 0 0 28px rgba(0,217,255,0.45)",
              border: "1.5px solid rgba(255,255,255,0.45)",
            }}
          >
            <Plus
              className="h-6 w-6 text-white"
              strokeWidth={2.5}
            />
          </button>
        </div>

        <NavItem label="المهام" Icon={ClipboardList} />
        <NavItem label="الرئيسية" Icon={Home} active />
      </div>
    </div>
  );
}

function NavItem({
  label,
  Icon,
  active,
}: {
  label: string;
  Icon: typeof Home;
  active?: boolean;
}) {
  const color = active ? "#7DDCFF" : "#94A3B8";
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 py-1 px-2"
      style={{ color }}
    >
      <Icon
        className="h-5 w-5"
        style={{
          filter: active ? "drop-shadow(0 0 6px rgba(125,220,255,0.7))" : undefined,
        }}
      />
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
