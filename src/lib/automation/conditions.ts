import type { AutomationCondition, AutomationEventPayload } from "./types";

function getNested(obj: AutomationEventPayload, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function compare(
  left: unknown,
  op: AutomationCondition["operator"],
  right: unknown,
): boolean {
  if (op === "exists") return left !== undefined && left !== null && left !== "";
  if (left === undefined || left === null) return false;

  const l = String(left);
  const r = right === undefined ? "" : String(right);

  switch (op) {
    case "eq":
      return l === r;
    case "neq":
      return l !== r;
    case "contains":
      return l.includes(r);
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: AutomationCondition[],
  payload: AutomationEventPayload,
): boolean {
  if (!conditions.length) return true;
  return conditions.every((c) => compare(getNested(payload, c.field), c.operator, c.value));
}
