#!/usr/bin/env node
/** Offline staging code preflight. Static observations are not security-test PASS evidence. */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const paths = {
  permissions: "src/contexts/PermissionsContext.tsx",
  provisioner: "src/lib/api/tenantUserAdmin.ts",
  cron: "src/app/api/automation/run-scheduled/route.ts",
  limiter: "src/lib/security/rateLimit.ts",
  isolation: "scripts/verify-tenant-isolation.mjs",
  aiChat: "src/app/api/ai/chat/route.ts",
};
export function assessSource(source) {
  const p = source.permissions || "";
  const u = source.provisioner || "";
  const c = source.cron || "";
  const r = source.limiter || "";
  const i = source.isolation || "";
  const a = source.aiChat || "";
  return {
    mode: "STATIC_ONLY",
    checks: [
      { id: "STATIC-01", status: u.includes("BLOCKED_TARGET_ROLES") && u.includes("TENANT_ASSIGNABLE_ROLES") ? "CODE_GUARD_PRESENT" : "REVIEW_REQUIRED", description: "Tenant user provisioner role denylist present" },
      { id: "STATIC-02", status: c.includes("if (!cronSecret)") && c.includes("auth !==") && c.includes("return unauthorized(") ? "CODE_GUARD_PRESENT" : "REVIEW_REQUIRED", description: "Cron auth guard present; configuration and scheduling unverified" },
      { id: "STATIC-03", status: /case "general_manager":\s*case "مدير_عام":\s*return "super_admin";/.test(p) ? "REVIEW_REQUIRED" : "NOT_OBSERVED", description: "Legacy manager alias may map to platform super_admin" },
      { id: "STATIC-04", status: i.includes("async function checkLiveDatabase()") && i.includes("Manual QA: sign in as two different org users") && i.includes('admin.from(table).select("id").limit(1)') ? "REVIEW_REQUIRED" : "NOT_OBSERVED", description: "Static verifier cannot replace authenticated Org A/B negative tests" },
      { id: "STATIC-05", status: /const ALLOW_ON_ERROR[\s\S]{0,160}allowed:\s*true/.test(r) ? "REVIEW_REQUIRED" : "NOT_OBSERVED", description: "Rate-limit fallback allows requests when backend fails" },
      { id: "STATIC-06", status: a.includes("process.env.ANTHROPIC_API_KEY") ? "CODE_DEPENDENCY_PRESENT" : "REVIEW_REQUIRED", description: "AI route requires Anthropic provider configuration" },
    ],
    warning: "No live tenant isolation, penetration or production security PASS is established by static checks.",
  };
}
async function main() {
  const entries = await Promise.all(Object.entries(paths).map(async ([k, p]) => [k, await readFile(path.join(root, p), "utf8")]));
  const result = assessSource(Object.fromEntries(entries));
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    for (const item of result.checks) console.log(item.id, item.status, item.description);
    console.log(result.warning);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("Preflight failed:", e.message); process.exitCode = 2; });
}
