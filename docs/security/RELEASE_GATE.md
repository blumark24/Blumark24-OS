# BLUMARK24 OS — SaaS Security Release Gate v1

**Created:** 2026-11-16. **Mode:** evidence-only review; NOT a production release. **Owner:** ARGO coordination; ORION independent review; human owner final approval.

## Origin and scope

The catalog contains 27 items transcribed from the security-checklist video as discussed in chat (V01–V27), plus eight SaaS-specific extensions (S01–S08). The 35 canonical IDs and required evidence types live in [release-gate-catalog.json](release-gate-catalog.json). This gate extends, rather than replaces, [Production Release Checklist](../production-release-checklist.md), [Security Readiness Audit](../security-readiness-audit.md) and [Production Runbook](../production-runbook.md).

### BLUMARK24 OS SaaS-specific checks

| ID | Scope | Required proof |
|---|---|---|
| S01 | Multi-tenant isolation | Staging Org A vs Org B, unauthorized cross-tenant reads/writes rejected |
| S02 | RBAC and privilege escalation | Owner, organization manager, finance, employee, and legacy alias negative tests |
| S03 | Privileged API and database functions | Service-role endpoint authorization and SECURITY DEFINER execute grants reviewed |
| S04 | Billing / subscriptions | Sandbox payment verification, signed webhook, idempotency, plan/downgrade without deleting customer data |
| S05 | AI | Provider health, tenant-scoped context, prompt/response boundaries, cost controls |
| S06 | Automation | Cron secret, schedule, idempotency, overlapping run protection, tenant scope |
| S07 | Recovery | Staging backup restore drill and measured recovery point/time objectives |
| S08 | Operations | Health, monitored alerts, support path, incident owner and rollback exercise |

## Trustworthy evidence states

| Status | Meaning | Gate result |
|---|---|---|
| PASS | Reviewed, dated evidence linked over HTTPS | Verified pass |
| FAIL | Executed test failed; linked evidence and reviewer | HOLD |
| BLOCKED | Dependency prevents testing | HOLD |
| NOT_TESTED | No accepted test result yet; default for all 35 IDs | HOLD |
| NOT_APPLICABLE | Documented human-approved waiver with rationale and link | Excluded only by explicit waiver policy |

Every PASS or FAIL entry requires: id, status, evidence_url, reviewer, verified_at. An N/A requires: id, status, reason, approved_by, approval_url, verified_at. For commercial launch, no P0 waiver is permitted. For a non-paying isolated pilot, payment checks V19 and S04 can be waived only by explicit linked human approval. Waivers do not themselves authorize launch.

**Never upload secrets, cookies, API keys, customer records, or private full test logs to public GitHub.** Keep sensitive evidence in controlled storage and reference sanitized summaries only.

## Calculation, not marketing score

- Evidence coverage = (PASS + FAIL + approved N/A) / 35.
- Verified pass ratio = PASS / applicable checks.
- Weighted verified pass = priority-weighted PASS / applicable weights (P0=4, P1=2, P2=1).
- SaaS assurance = PASS among applicable S01–S08 / applicable S checks.
- Integration proof = PASS among applicable S04, S05, S06, S08 / applicable integration checks.
- Release gate returns GO only when all applicable checks are PASS; otherwise HOLD.

These indicators measure *verification*, not application feature completion or the likelihood of a breach. They are not directly comparable with prior executive 56% launch-readiness or 31% integration estimates. The committed template has **zero submitted security test evidence**, so its HOLD is expected, not evidence of 35 vulnerabilities.

## Run locally, without external side effects

~~~bash
node scripts/security/assess-release-gate.mjs --self-test
node scripts/security/assess-release-gate.mjs docs/security/release-evidence.template.json
node scripts/security/assess-release-gate.mjs docs/security/release-evidence.template.json --json
node scripts/security/assess-release-gate.mjs path/to/validated-evidence.json --enforce
~~~

The tool runs offline, reads only the catalog and evidence file, and makes no database/auth/production changes. Exit codes with --enforce: 0 = algorithmic GO; 1 = HOLD; 2 = malformed evidence. A passing self-test only tests the calculator using synthetic examples; it is **not a penetration test**.

Example of one evidence record, to replace only after a real reviewed staging test:

~~~json
{
  "id": "S01",
  "status": "PASS",
  "evidence_url": "https://your-controlled-evidence.example/reports/staging-org-ab",
  "reviewer": "authorized-reviewer",
  "verified_at": "2026-11-16"
}
~~~

## First execution wave and non-automated critical gates

1. Confirm exactly which Supabase project and environment back the Vercel production deployment, without disclosing variable values. Review existing Supabase security advisories and privileged functions.
2. In isolated Staging, seed Org A and Org B. Test RLS denial both ways, then exercise manager, employee, finance and owner API boundaries. Do not use real customers.
3. Verify AI provider integration and rate/cost controls; Cron schedule/secrets and tenant-safe behavior; billing provider sandbox and webhook idempotency.
4. Run a non-production restore drill and test monitoring/support/rollback. Record result links, timestamps, reviewers, and exact target SHA.
5. ORION checks each proof and residual risk; accountable human signs final launch authorization separately. No auto-merge/deploy.

Previously documented potential gaps requiring retest include four authenticated-callable SECURITY DEFINER functions and leaked-password protection disabled in an associated Supabase project; unverified live multi-tenant test; uncertain configured AI provider/cron on Vercel; unproven payment integration and restore exercise. They are investigation leads, not findings of exploitation. Project-to-production DB mapping was not conclusively verified.

## Safe change boundaries

This PR changes only docs and an offline evaluation script. It does not alter middleware, Auth, RLS, API routes, migrations, production configuration, owner access, billing, UI, CI settings or customer data. Integration into CI or the SaaS dashboard is a separate reviewed PR after the evidence format is accepted.

