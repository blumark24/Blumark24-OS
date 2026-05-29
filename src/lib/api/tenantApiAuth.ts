import type { NextRequest } from "next/server";

/** Extract Supabase access token from Authorization header or auth cookies. */
export function getTenantApiAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }

  const authCookies = req.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (authCookies.length === 0) return null;

  const raw = authCookies.map((c) => c.value).join("");
  if (!raw) return null;

  const parseSession = (value: string): string | null => {
    try {
      const parsed: unknown = JSON.parse(value);
      const session = Array.isArray(parsed) ? parsed[0] : parsed;
      if (
        session &&
        typeof session === "object" &&
        "access_token" in session &&
        typeof (session as { access_token: unknown }).access_token === "string"
      ) {
        return (session as { access_token: string }).access_token;
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  return parseSession(decodeURIComponent(raw)) ?? parseSession(raw);
}
