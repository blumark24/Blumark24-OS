/** Prevents iOS/Safari blue text selection highlights on tappable UI chrome. */
export const UI_NO_SELECT_CLASS = "ui-no-select";

export const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;
