#!/usr/bin/env node
/**
 * Evidence-driven security release gate for BLUMARK24 OS.
 * READ-ONLY: no network, database, key or production access.
 *
 * node scripts/security/assess-release-gate.mjs [evidence.json] [--json] [--enforce]
 * node scripts/security/assess-release-gate.mjs --self-test
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalogFile = path.join(root, "docs/security/release-gate-catalog.json");
const templateFile = path.join(root, "docs/security/release-evidence.template.json");
const statuses = ["PASS", "FAIL", "BLOCKED", "NOT_TESTED", "NOT_APPLICABLE"];
const weights = { P0: 4, P1: 2, P2: 1 };
const integrationIds = new Set(["S04", "S05", "S06", "S08"]);
const conditionalPilotWaivers = new Set(["V19", "S04"]);

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error(name + " is required");
}
function requireLink(value, name) {
  requireText(value, name);
  if (!/^https:\/\/[^\s]+$/i.test(value)) throw new Error(name + " requires an HTTPS evidence link");
}
function requireDate(value, name) {
  requireText(value, name);
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(name + " requires a valid ISO date / UTC timestamp");
  }
}
function validate(catalog, manifest) {
  if (catalog.length !== 35 ||
      catalog.filter((item) => item.origin === "video_27").length !== 27 ||
      catalog.filter((item) => item.origin === "saas_extension").length !== 8 ||
      new Set(catalog.map((item) => item.id)).size !== 35) {
    throw new Error("Catalog must have 27 unique video checks and 8 SaaS checks");
  }
  if (manifest?.version !== 1 || !Array.isArray(manifest.checks)) {
    throw new Error("Evidence version 1 and checks[] are required");
  }
  if (!["pilot", "commercial"].includes(manifest.mode)) {
    throw new Error("mode must be pilot or commercial");
  }
  requireText(manifest.target_environment, "target_environment");
  if (!/^[0-9a-f]{40}$/i.test(manifest.source_commit || "")) {
    throw new Error("source_commit must be an exact 40-character Git SHA");
  }
  requireDate(manifest.reviewed_as_of, "reviewed_as_of");
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const seen = new Set();
  for (const record of manifest.checks) {
    if (!record || !byId.has(record.id)) throw new Error("Unknown check ID: " + record?.id);
    if (seen.has(record.id)) throw new Error("Duplicate evidence entry: " + record.id);
    seen.add(record.id);
    if (!statuses.includes(record.status)) throw new Error(record.id + " has invalid status");
    if (record.status === "PASS" || record.status === "FAIL") {
      requireLink(record.evidence_url, record.id + ".evidence_url");
      requireText(record.reviewer, record.id + ".reviewer");
      requireDate(record.verified_at, record.id + ".verified_at");
    }
    if (record.status === "NOT_APPLICABLE") {
      requireText(record.reason, record.id + ".reason");
      requireText(record.approved_by, record.id + ".approved_by");
      requireLink(record.approval_url, record.id + ".approval_url");
      requireDate(record.verified_at, record.id + ".verified_at");
      if (byId.get(record.id).priority === "P0" &&
          !(manifest.mode === "pilot" && conditionalPilotWaivers.has(record.id))) {
        throw new Error(record.id + " P0 cannot be waived for this launch mode");
      }
    }
  }
}
function pct(n, d) { return Math.round(10000 * n / Math.max(d, 1)) / 100; }
function assess(catalog, manifest) {
  validate(catalog, manifest);
  const entered = new Map(manifest.checks.map((r) => [r.id, r]));
  const checks = catalog.map((item) => ({
    id: item.id, priority: item.priority, origin: item.origin,
    status: entered.get(item.id)?.status || "NOT_TESTED",
  }));
  const applicable = checks.filter((item) => item.status !== "NOT_APPLICABLE");
  const passed = applicable.filter((item) => item.status === "PASS");
  const verifiable = checks.filter((item) => ["PASS", "FAIL", "NOT_APPLICABLE"].includes(item.status));
  const allWeight = applicable.reduce((sum, item) => sum + weights[item.priority], 0);
  const passedWeight = passed.reduce((sum, item) => sum + weights[item.priority], 0);
  const saas = applicable.filter((item) => item.origin === "saas_extension");
  const integrations = applicable.filter((item) => integrationIds.has(item.id));
  const unresolved = applicable.filter((item) => item.status !== "PASS");
  const p0 = unresolved.filter((item) => item.priority === "P0");
  const decision = unresolved.length === 0 && applicable.length > 0 ? "GO" : "HOLD";
  return {
    decision,
    mode: manifest.mode,
    target_environment: manifest.target_environment,
    source_commit: manifest.source_commit,
    reviewed_as_of: manifest.reviewed_as_of,
    total_checks: checks.length,
    evidence_coverage_pct: pct(verifiable.length, checks.length),
    verified_pass_pct: pct(passed.length, applicable.length),
    weighted_pass_pct: pct(passedWeight, allWeight),
    saas_verified_pass_pct: pct(saas.filter((c) => c.status === "PASS").length, saas.length),
    integrations_verified_pass_pct: pct(integrations.filter((c) => c.status === "PASS").length, integrations.length),
    counts: Object.fromEntries(statuses.map((status) =>
      [status, checks.filter((c) => c.status === status).length])),
    unresolved_p0: p0.map((item) => item.id),
    unresolved_all: unresolved.map((item) => item.id),
    approved_exemptions: checks.filter((item) => item.status === "NOT_APPLICABLE").map((item) => item.id),
    disclaimer: "Metrics quantify verified gate checks only, not code completion, penetration-test results, or approval to deploy.",
  };
}
function selfTest(catalog, template) {
  const blank = assess(catalog, template);
  assert.equal(blank.total_checks, 35);
  assert.equal(blank.decision, "HOLD");
  assert.equal(blank.evidence_coverage_pct, 0);
  const synthetic = { status: "PASS", evidence_url: "https://example.invalid/synthetic", reviewer: "unit-test", verified_at: "2026-11-16" };
  const allPass = { ...template, checks: catalog.map((item) => ({ id: item.id, ...synthetic })) };
  assert.equal(assess(catalog, allPass).decision, "GO");
  assert.throws(() => assess(catalog, {
    ...template, checks: [{ id: "S01", status: "PASS" }],
  }), /evidence_url/);
  assert.throws(() => assess(catalog, {
    ...template, checks: [{ id: "S01", status: "NOT_APPLICABLE", reason: "test", approved_by: "tester", approval_url: "https://example.invalid/approval", verified_at: "2026-11-16" }],
  }), /P0 cannot be waived/);
  const fail = { ...template, checks: [{ id: "S01", ...synthetic, status: "FAIL" }] };
  assert.equal(assess(catalog, fail).decision, "HOLD");
  const pilot = { ...template, mode: "pilot", checks: [{ id: "S04", status: "NOT_APPLICABLE", reason: "Pilot without payments", approved_by: "unit-test", approval_url: "https://example.invalid/approval", verified_at: "2026-11-16" }] };
  assert.deepEqual(assess(catalog, pilot).approved_exemptions, ["S04"]);
  console.log("PASS: 6 synthetic calculator checks; no application-security claims");
}
async function main() {
  const args = process.argv.slice(2);
  const catalog = JSON.parse(await readFile(catalogFile, "utf8")).checks;
  const template = JSON.parse(await readFile(templateFile, "utf8"));
  if (args.includes("--self-test")) { selfTest(catalog, template); return; }
  const manifestPath = args.find((arg) => !arg.startsWith("--")) || templateFile;
  const evidence = JSON.parse(await readFile(path.resolve(manifestPath), "utf8"));
  const result = assess(catalog, evidence);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("BLUMARK24 OS Security Gate:", result.decision);
    console.log("Evidence coverage:", result.evidence_coverage_pct + "%");
    console.log("Verified weighted pass:", result.weighted_pass_pct + "%");
    console.log("SaaS assurance pass:", result.saas_verified_pass_pct + "%");
    console.log("Integrations pass:", result.integrations_verified_pass_pct + "%");
    console.log("P0 unresolved:", result.unresolved_p0.join(", ") || "none");
    console.log("This script does not authorize deployment.");
  }
  if (args.includes("--enforce") && result.decision !== "GO") process.exitCode = 1;
}
main().catch((error) => {
  console.error("INVALID EVIDENCE:", error.message);
  process.exitCode = 2;
});
