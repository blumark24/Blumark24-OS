"use client";

import "./workspaceTheme.css";

/**
 * Premium animated glass/aurora background for the client workspace shell.
 * Presentational only — CSS animations, no data or business logic.
 */
export default function WorkspaceAmbient() {
  return (
    <div
      aria-hidden
      className="workspace-ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Layer 1: deep navy cinematic base */}
      <div className="workspace-ambient__base absolute inset-0" />

      {/* Layer 2: floating glow orbs (2 on mobile, 3 on desktop) */}
      <div
        className="workspace-ambient__orb workspace-ambient__orb--cyan workspace-ambient--motion workspace-ambient--motion-1 absolute -top-32 right-[-10%] h-[min(420px,85vw)] w-[min(420px,85vw)] blur-3xl"
      />
      <div
        className="workspace-ambient__orb workspace-ambient__orb--violet workspace-ambient--motion workspace-ambient--motion-2 absolute top-1/3 left-[-12%] h-[min(460px,90vw)] w-[min(460px,90vw)] blur-3xl"
      />
      <div
        className="workspace-ambient__orb workspace-ambient__orb--blue workspace-ambient__orb--desktop-only workspace-ambient--motion workspace-ambient--motion-3 absolute bottom-[-12%] right-1/4 h-[min(400px,80vw)] w-[min(400px,80vw)] blur-3xl"
      />

      {/* Layer 3: slow aurora band */}
      <div className="workspace-ambient__aurora workspace-ambient--motion workspace-ambient--motion-aurora absolute inset-0" />

      {/* Layer 4: subtle grid mesh */}
      <div className="workspace-ambient__mesh absolute inset-0" />

      {/* Layer 5: soft spotlight behind main content / hero area */}
      <div className="workspace-ambient__spotlight absolute inset-0" />
    </div>
  );
}
