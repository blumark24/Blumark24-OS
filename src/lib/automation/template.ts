import type { AutomationEventPayload } from "./types";

export function interpolate(template: string, payload: AutomationEventPayload): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
    const key = path.trim();
    const parts = key.split(".");
    let cur: unknown = payload;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return "";
      cur = (cur as Record<string, unknown>)[p];
    }
    return cur == null ? "" : String(cur);
  });
}
