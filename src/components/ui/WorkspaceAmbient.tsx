/**
 * Animated digital background for the client workspace.
 *
 * CSS-only — all animation lives in `workspaceTheme.css`. The component just
 * mounts 3 GPU-cheap orbs, an aurora band, and a mesh grid. Nothing depends on
 * JS frame loops or new packages.
 *
 * Performance budget:
 *  • Desktop: 3 blurred orbs (translate3d), 1 aurora (background-position), grid
 *  • Mobile:  same DOM, lower blur radius via workspaceTheme.css media query
 *  • `prefers-reduced-motion`: animations paused (see workspaceTheme.css)
 */

export default function WorkspaceAmbient() {
  return (
    <div className="workspace-ambient" aria-hidden="true">
      <div className="ws-mesh" />
      <div className="ws-aurora" />
      <div className="ws-orb ws-orb-1" />
      <div className="ws-orb ws-orb-2" />
      <div className="ws-orb ws-orb-3" />
    </div>
  );
}
