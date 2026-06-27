/**
 * Preview-only deep-navy animated background.
 *
 * CSS-only. Self-contained for the Blumark mobile dashboard design
 * preview. Does not import production hooks, contexts, or styles.
 */
export default function AnimatedBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(20,124,255,0.18), transparent 55%), radial-gradient(110% 80% at 50% 110%, rgba(124,58,237,0.10), transparent 60%), #020817",
        }}
      />

      {/* Cyan orb top-right */}
      <div
        className="absolute -top-24 -right-20 h-[340px] w-[340px] rounded-full opacity-30 blur-3xl bm-preview-float-slow"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(0,217,255,0.55), transparent 65%)",
        }}
      />

      {/* Electric blue orb bottom-left */}
      <div
        className="absolute -bottom-24 -left-16 h-[380px] w-[380px] rounded-full opacity-25 blur-3xl bm-preview-float-mid"
        style={{
          background:
            "radial-gradient(circle at 65% 65%, rgba(20,124,255,0.55), transparent 65%)",
        }}
      />

      {/* Soft mid violet (very subtle) */}
      <div
        className="absolute top-1/3 left-1/4 h-[260px] w-[260px] rounded-full opacity-[0.10] blur-3xl bm-preview-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.6), transparent 70%)",
        }}
      />

      {/* Faint dotted grid */}
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
