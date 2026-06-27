/**
 * Blumark Ambient Background — Sprint 2D patch.
 *
 * CSS-only. No canvas, no WebGL, no animation library, no JS state.
 * Sits behind dashboard cards via `pointer-events: none` and a
 * negative-z layer. The dashboard cards use `backdrop-filter` and
 * sit naturally above this layer in source order.
 *
 * Motion is gated by `motion-reduce:animate-none`. On small screens
 * the orbs shrink and the slowest layer is disabled to keep paint
 * cost low on mid-range devices.
 */
export default function BlumarkAmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Base deep-navy wash. Tints the entire surface without changing
          the page background that DashboardLayout owns. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(20,124,255,0.12), transparent 55%), radial-gradient(110% 80% at 50% 110%, rgba(124,58,237,0.08), transparent 60%)",
        }}
      />

      {/* Top-right cyber-cyan orb. Soft, slow drift. */}
      <div
        className="absolute top-[-15%] right-[-8%] h-[420px] w-[420px] rounded-full opacity-[0.18] blur-3xl animate-float-slow motion-reduce:animate-none premium-mobile:h-[260px] premium-mobile:w-[260px] premium-mobile:opacity-[0.12]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(0,217,255,0.55), transparent 65%)",
        }}
      />

      {/* Bottom-left electric-blue orb. */}
      <div
        className="absolute bottom-[-12%] left-[-10%] h-[460px] w-[460px] rounded-full opacity-[0.16] blur-3xl animate-float-mid motion-reduce:animate-none premium-mobile:h-[280px] premium-mobile:w-[280px] premium-mobile:opacity-[0.10]"
        style={{
          background:
            "radial-gradient(circle at 65% 65%, rgba(20,124,255,0.55), transparent 65%)",
        }}
      />

      {/* Mid AI-violet glow — only on tablet+. Hidden on mobile to
          reduce paint cost and avoid contrast loss on small screens. */}
      <div
        className="absolute top-[40%] left-[35%] hidden h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.10] blur-3xl premium-tablet:block animate-pulse-glow motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.6), transparent 70%)",
        }}
      />

      {/* Faint dotted grid — pure CSS, no images. Disabled on mobile
          because it competes with text density on small screens. */}
      <div
        className="absolute inset-0 hidden opacity-[0.05] premium-tablet:block"
        style={{
          backgroundImage:
            "radial-gradient(rgba(125,220,255,0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
