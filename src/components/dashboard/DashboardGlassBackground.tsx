/**
 * Dashboard glass command background.
 *
 * Brings the deep-navy + cyan-arc + particle-network language approved
 * in `/design-preview/blumark-mobile` to the real `/dashboard` route.
 * Self-contained — does not import any data hook, context, or shared
 * visual token. Pointer-events disabled; meant to sit behind the page
 * content as a `position: absolute` layer.
 *
 * All motion is gated by `prefers-reduced-motion: reduce` via the
 * scoped CSS in `src/app/dashboard/dashboard-glass.css`.
 *
 * Tuned for the dashboard (more surface area than mobile preview), so
 * orb/arc opacities are slightly lower to keep text readable across the
 * full page.
 */
export default function DashboardGlassBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Base radial wash — same family as the preview */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(20,124,255,0.18), transparent 55%), radial-gradient(110% 80% at 50% 110%, rgba(124,58,237,0.08), transparent 60%)",
        }}
      />

      {/* Soft blue glow behind the cards */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[640px] w-[640px] rounded-full opacity-[0.12] blur-3xl bm-dashboard-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(20,124,255,0.55), transparent 70%)",
        }}
      />

      {/* Cyber-cyan orb (top right) */}
      <div
        className="absolute -top-24 -right-20 h-[420px] w-[420px] rounded-full opacity-[0.18] blur-3xl bm-dashboard-float-slow"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(0,217,255,0.55), transparent 65%)",
        }}
      />

      {/* Electric-blue orb (bottom left) */}
      <div
        className="absolute -bottom-24 -left-16 h-[460px] w-[460px] rounded-full opacity-[0.16] blur-3xl bm-dashboard-float-mid"
        style={{
          background:
            "radial-gradient(circle at 65% 65%, rgba(20,124,255,0.55), transparent 65%)",
        }}
      />

      {/* Cyan arcs — gentle breathing */}
      <svg
        className="absolute inset-0 w-full h-full bm-dashboard-arcs"
        viewBox="0 0 1200 1600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bm-dash-arc" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7DDCFF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#147CFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#147CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#bm-dash-arc)" strokeWidth="0.9">
          <path d="M -100 520 Q 600 260 1300 520" opacity="0.35" />
          <path d="M -100 720 Q 600 460 1300 720" opacity="0.22" />
          <path d="M -100 1020 Q 600 760 1300 1020" opacity="0.15" />
        </g>
      </svg>

      {/* Particle network — pure SVG, no JS */}
      <svg
        className="absolute inset-0 w-full h-full bm-dashboard-particles"
        viewBox="0 0 1200 1600"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="rgba(125,220,255,0.16)" strokeWidth="0.5" fill="none">
          <line x1="100"  y1="160" x2="360" y2="240" />
          <line x1="360"  y1="240" x2="640" y2="180" />
          <line x1="640"  y1="180" x2="940" y2="280" />
          <line x1="180"  y1="500" x2="480" y2="600" />
          <line x1="480"  y1="600" x2="820" y2="540" />
          <line x1="820"  y1="540" x2="1080" y2="640" />
          <line x1="220"  y1="940" x2="560" y2="1000" />
          <line x1="560"  y1="1000" x2="900" y2="940" />
          <line x1="160"  y1="1280" x2="540" y2="1380" />
          <line x1="540"  y1="1380" x2="980" y2="1300" />
        </g>
        <g fill="#7DDCFF">
          {[
            [100, 160], [360, 240], [640, 180], [940, 280],
            [180, 500], [480, 600], [820, 540], [1080, 640],
            [220, 940], [560, 1000], [900, 940],
            [160, 1280], [540, 1380], [980, 1300],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 3 === 0 ? 2 : 1.4}
              opacity={i % 2 === 0 ? 0.8 : 0.55}
            />
          ))}
        </g>
      </svg>

      {/* Faint dotted grid for premium depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(125,220,255,0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
