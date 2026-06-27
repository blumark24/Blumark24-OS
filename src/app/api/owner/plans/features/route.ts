import { NextRequest, NextResponse } from "next/server";
import {
  createServiceRoleAdmin,
  verifyOwnerBearer,
  writeOwnerAuditLog,
} from "@/lib/api/ownerServerCommon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[api/owner/plans/features]";

// Canonical WorkspaceFeature keys. Kept in lockstep with
// WorkspaceFeature in src/lib/features/packageFeatures.ts and
// OWNER_WORKSPACE_FEATURES in src/app/owner/_lib/planMutations.ts.
// Anything outside this allowlist is silently dropped before any DB
// write, so an attacker that bypasses verifyOwnerBearer (which they
// cannot) still cannot insert an arbitrary feature_key.
const ALLOWED_FEATURE_KEYS = new Set<string>([
  "dashboard",
  "tasks",
  "clients",
  "employees",
  "reports",
  "org",
  "finance",
  "strategy",
  "automation",
  "ai",
  "virtual_office",
  "external_integrations",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonNoStore(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });
}

interface FeaturesPayload {
  planId?: unknown;
  featureKeys?: unknown;
}

function cleanFeatureKeys(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<string>();
  for (const item of input) {
    if (typeof item !== "string") continue;
    const key = item.trim();
    if (!key) continue;
    if (!ALLOWED_FEATURE_KEYS.has(key)) continue;
    out.add(key);
  }
  return Array.from(out);
}

export async function POST(req: NextRequest) {
  try {
    const svc = createServiceRoleAdmin();
    if ("error" in svc) {
      return jsonNoStore({ ok: false, error: svc.error }, 500);
    }
    const { admin } = svc;

    // Server-side owner authentication. Same helper every other owner
    // route uses, so the allowlist of platform-owner emails stays in
    // one place (src/lib/owner.ts via isOwnerEmail).
    const ownerCheck = await verifyOwnerBearer(req, admin);
    if (!ownerCheck.ok) {
      return jsonNoStore({ ok: false, error: ownerCheck.error }, ownerCheck.status);
    }

    let body: FeaturesPayload;
    try {
      body = (await req.json()) as FeaturesPayload;
    } catch {
      return jsonNoStore({ ok: false, error: "بيانات الطلب غير صالحة" }, 400);
    }

    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    if (!planId || !UUID_RE.test(planId)) {
      return jsonNoStore({ ok: false, error: "معرّف الباقة غير صالح" }, 400);
    }

    const featureKeys = cleanFeatureKeys(body.featureKeys);

    // Confirm the plan exists. Avoid silently no-oping on a bad id.
    const { data: planRow, error: planErr } = await admin
      .from("plans")
      .select("id, slug")
      .eq("id", planId)
      .maybeSingle();
    if (planErr) {
      console.error(`${TAG} plan lookup error:`, planErr.message);
      return jsonNoStore({ ok: false, error: "تعذّر التحقق من الباقة" }, 500);
    }
    if (!planRow) {
      return jsonNoStore({ ok: false, error: "الباقة غير موجودة" }, 404);
    }

    // Current rows for this plan. We DO NOT pre-filter through the
    // allowlist here: the diff must compare against what is actually
    // in the DB, otherwise rows for legacy keys would be lost on the
    // first save after the allowlist tightens.
    const { data: currentRows, error: currentErr } = await admin
      .from("plan_features")
      .select("feature_key")
      .eq("plan_id", planId);
    if (currentErr) {
      console.error(`${TAG} fetch current error:`, currentErr.message);
      return jsonNoStore({ ok: false, error: "تعذّر قراءة الميزات الحالية" }, 500);
    }

    const currentKeys = new Set(
      (currentRows ?? [])
        .map((row) => (typeof row.feature_key === "string" ? row.feature_key : null))
        .filter((v): v is string => !!v),
    );
    const selected = new Set(featureKeys);

    // Only delete rows that (a) the owner unchecked AND (b) are in
    // the canonical allowlist. Unknown legacy rows are left alone —
    // a future migration can reconcile them.
    const toDelete = Array.from(currentKeys).filter(
      (key) => !selected.has(key) && ALLOWED_FEATURE_KEYS.has(key),
    );

    if (toDelete.length > 0) {
      const { error: deleteErr } = await admin
        .from("plan_features")
        .delete()
        .eq("plan_id", planId)
        .in("feature_key", toDelete);
      if (deleteErr) {
        console.error(`${TAG} delete error:`, deleteErr.message);
        return jsonNoStore(
          { ok: false, error: "تعذّر حذف الميزات غير المطلوبة" },
          500,
        );
      }
    }

    if (featureKeys.length > 0) {
      const rows = featureKeys.map((featureKey) => ({
        plan_id: planId,
        feature_key: featureKey,
      }));
      const { error: upsertErr } = await admin
        .from("plan_features")
        .upsert(rows, { onConflict: "plan_id,feature_key" });
      if (upsertErr) {
        console.error(`${TAG} upsert error:`, upsertErr.message);
        return jsonNoStore({ ok: false, error: "تعذّر حفظ ميزات الباقة" }, 500);
      }
    }

    // Re-read and return so the client can refresh its UI from the
    // authoritative DB state instead of trusting the request payload.
    const { data: savedRows, error: savedErr } = await admin
      .from("plan_features")
      .select("feature_key")
      .eq("plan_id", planId);
    if (savedErr) {
      console.error(`${TAG} re-read error:`, savedErr.message);
      return jsonNoStore({ ok: false, error: "تم الحفظ ولكن تعذّر إعادة قراءة الميزات" }, 500);
    }

    const persistedFeatureKeys = (savedRows ?? [])
      .map((row) => (typeof row.feature_key === "string" ? row.feature_key : null))
      .filter((v): v is string => !!v && ALLOWED_FEATURE_KEYS.has(v));

    await writeOwnerAuditLog(admin, {
      owner_email: ownerCheck.callerEmail,
      action: "update_plan_features_api",
      target_type: "plan",
      target_id: planId,
      metadata: { feature_keys: featureKeys, persisted: persistedFeatureKeys },
    });

    return jsonNoStore({
      ok: true,
      planId,
      featureKeys: persistedFeatureKeys,
    });
  } catch (err) {
    console.error(`${TAG} unexpected:`, err);
    return jsonNoStore(
      { ok: false, error: "خطأ داخلي — تعذّر حفظ ميزات الباقة" },
      500,
    );
  }
}
