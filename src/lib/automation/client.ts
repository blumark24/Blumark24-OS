import { supabase } from "@/lib/supabase";

/** Fire automation workflows from the browser (uses session + /api/automation/dispatch). */
export async function fireAutomationEvent(
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch("/api/automation/dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event, payload }),
    });
  } catch (e) {
    console.warn("[automation] dispatch failed", e);
  }
}
