/**
 * Preview-only premium animated background.
 *
 * Layers (back → front):
 *   1. Deep navy radial wash
 *   2. Soft blue radial glow behind the cards
 *   3. Subtle cyan SVG arcs that breathe slowly
 *   4. Static cyan particle network (tiny dots + faint lines)
 *   5. Faint dotted grid for premium depth
 *
 * All motion is gated by `prefers-reduced-motion: reduce` via the
 * scoped CSS in `preview.css`. Self-contained — does not import any
 * production hook, context, or style.
 */
export default function AnimatedBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1 — base radial wash on top of #020817 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(20,124,255,0.20), transparent 55%), radial-gradient(110% 80% at 50% 110%, rgba(124,58,237,0.10), transparent 60%), #020817",
        }}
      />

      {/* 2 — broad soft blue glow behind the cards */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-3xl bm-preview-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(20,124,255,0.55), transparent 70%)",
        }}
      />

      {/* 3 — cyan arcs (SVG, slow rotation/breathing) */}
      <svg
        className="absolute inset-0 w-full h-full bm-preview-arcs"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bm-arc-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7DDCFF" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#147CFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#147CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#bm-arc-grad)" strokeWidth="0.7">
          <path d="M -40 280 Q 200 130 440 280" opacity="0.45" />
          <path d="M -40 360 Q 200 210 440 360" opacity="0.30" />
          <path d="M -40 460 Q 200 330 440 460" opacity="0.20" />
          <path d="M -40 580 Q 200 460 440 580" opacity="0.15" />
        </g>
      </svg>

      {/* 4 — particle network (tiny dots + faint connecting lines) */}
      <svg
        className="absolute inset-0 w-full h-full bm-preview-particles"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="rgba(125,220,255,0.18)" strokeWidth="0.4" fill="none">
          <line x1="40"  y1="80"  x2="120" y2="140" />
          <line x1="120" y1="140" x2="240" y2="90"  />
          <line x1="240" y1="90"  x2="360" y2="160" />
          <line x1="60"  y1="260" x2="180" y2="320" />
          <line x1="180" y1="320" x2="340" y2="280" />
          <line x1="80"  y1="460" x2="220" y2="510" />
          <line x1="220" y1="510" x2="360" y2="470" />
          <line x1="50"  y1="640" x2="200" y2="700" />
          <line x1="200" y1="700" x2="350" y2="650" />
        </g>
        <g fill="#7DDCFF">
          {[
            [40, 80], [120, 140], [240, 90], [360, 160],
            [60, 260], [180, 320], [340, 280],
            [80, 460], [220, 510], [360, 470],
            [50, 640], [200, 700], [350, 650],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.1} opacity={i % 2 === 0 ? 0.85 : 0.55} />
          ))}
        </g>
      </svg>

      {/* 5 — faint dotted grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(125,220,255,0.55) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}
