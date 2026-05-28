#!/usr/bin/env node
/**
 * TENANT-3A — Create or confirm Blumark24 customer organization (idempotent).
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses owner-only organizations RLS).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/tenant-3a-create-blumark-customer.mjs
 *
 * Does NOT move operational data (TENANT-3B).
 */

import { createClient } from "@supabase/supabase-js";

const PLATFORM_OWNER_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];
const CUSTOMER_SLUG = "blumark24-customer";
const INTERNAL_SLUG = "blumark24-internal";
const PLAN_SLUG = "advanced";

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceKey) {
  die(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. " +
      "Run in Supabase SQL Editor with scripts/tenant-3a-create-blumark-customer.sql instead.",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isPlatformEmail(email) {
  return PLATFORM_OWNER_EMAILS.includes(String(email ?? "").trim().toLowerCase());
}

async function resolveOwnerEmail(internalOrgId) {
  let ownerEmail = "blumark24@gmail.com";
  let ownerEmailNeedsReview = true;

  const { data: managers, error } = await admin
    .from("profiles")
    .select("email, name, role, is_active, created_at")
    .eq("organization_id", internalOrgId)
    .eq("role", "organization_manager")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[TENANT-3A] profiles lookup warning:", error.message);
  } else {
    const candidate = (managers ?? []).find((p) => p.email && !isPlatformEmail(p.email));
    if (candidate?.email) {
      ownerEmail = candidate.email.trim().toLowerCase();
      ownerEmailNeedsReview = false;
    }
  }

  return { ownerEmail, ownerEmailNeedsReview };
}

async function main() {
  const report = {
    phase: "TENANT-3A",
    internal_org_id: null,
    customer_org_id: null,
    org_created: false,
    org_already_existed: false,
    owner_email: null,
    owner_email_needs_review: false,
    subscription_status: null,
    subscription_created: false,
    subscription_billing_cycle: null,
    operational_data_moved: false,
    rls_auth_ui_changed: false,
    next_step: "TENANT-3B data repair",
  };

  const { data: internalOrg, error: internalErr } = await admin
    .from("organizations")
    .select("id, name, slug, is_internal, owner_email, plan_id, status")
    .eq("slug", INTERNAL_SLUG)
    .maybeSingle();

  if (internalErr) die(`Failed to read internal org: ${internalErr.message}`);
  if (!internalOrg?.id) die(`Internal org not found (slug=${INTERNAL_SLUG}). Apply migration 009 first.`);

  report.internal_org_id = internalOrg.id;

  const { data: existingBySlug } = await admin
    .from("organizations")
    .select("id, name, slug, is_internal, owner_email, plan_id, status")
    .eq("slug", CUSTOMER_SLUG)
    .maybeSingle();

  let customerOrg = existingBySlug;

  if (!customerOrg?.id) {
    const { data: existingByName } = await admin
      .from("organizations")
      .select("id, name, slug, is_internal, owner_email, plan_id, status")
      .eq("is_internal", false)
      .ilike("name", "%blumark%")
      .order("created_at", { ascending: true });

    if (existingByName?.length === 1) {
      customerOrg = existingByName[0];
      console.log(
        `[TENANT-3A] Found existing non-internal Blumark org by name: ${customerOrg.slug ?? "(no slug)"}`,
      );
    } else if ((existingByName?.length ?? 0) > 1) {
      die(
        `Multiple non-internal Blumark orgs found (${existingByName.length}). Resolve manually before TENANT-3A.`,
      );
    }
  }

  const { data: plan, error: planErr } = await admin
    .from("plans")
    .select("id, slug")
    .eq("slug", PLAN_SLUG)
    .maybeSingle();

  if (planErr) die(`Failed to read plan: ${planErr.message}`);
  if (!plan?.id) die(`Plan slug=${PLAN_SLUG} not found.`);

  if (customerOrg?.id) {
    report.customer_org_id = customerOrg.id;
    report.org_already_existed = true;
    report.owner_email = customerOrg.owner_email ?? null;

    if (customerOrg.is_internal === true) {
      die(
        `Org ${customerOrg.id} matches customer candidate but is_internal=true. Manual fix required.`,
      );
    }

    const patch = {};
    if (!customerOrg.plan_id) patch.plan_id = plan.id;
    if (customerOrg.status !== "active") patch.status = "active";
    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await admin
        .from("organizations")
        .update(patch)
        .eq("id", customerOrg.id);
      if (upErr) console.warn("[TENANT-3A] org patch warning:", upErr.message);
    }
  } else {
    const { ownerEmail, ownerEmailNeedsReview } = await resolveOwnerEmail(internalOrg.id);
    report.owner_email = ownerEmail;
    report.owner_email_needs_review = ownerEmailNeedsReview;

    const { data: created, error: createErr } = await admin
      .from("organizations")
      .insert({
        name: "Blumark24",
        slug: CUSTOMER_SLUG,
        is_internal: false,
        status: "active",
        plan_id: plan.id,
        owner_email: ownerEmail,
      })
      .select("id, name, slug, is_internal, owner_email, plan_id, status")
      .single();

    if (createErr) die(`Failed to create customer org: ${createErr.message}`);

    customerOrg = created;
    report.customer_org_id = created.id;
    report.org_created = true;
    console.log(`[TENANT-3A] Created customer org ${created.id} (slug=${CUSTOMER_SLUG})`);
  }

  const { data: subs, error: subListErr } = await admin
    .from("subscriptions")
    .select("id, status, billing_cycle, plan_id")
    .eq("organization_id", customerOrg.id);

  if (subListErr) die(`Failed to list subscriptions: ${subListErr.message}`);

  const nonInternalSub = (subs ?? []).find((s) => s.billing_cycle !== "internal");

  if (nonInternalSub) {
    report.subscription_status = nonInternalSub.status;
    report.subscription_billing_cycle = nonInternalSub.billing_cycle;
    report.subscription_created = false;
  } else {
    const { data: newSub, error: subErr } = await admin
      .from("subscriptions")
      .insert({
        organization_id: customerOrg.id,
        plan_id: plan.id,
        status: "active",
        billing_cycle: "monthly",
      })
      .select("id, status, billing_cycle")
      .single();

    if (subErr) die(`Failed to create subscription: ${subErr.message}`);

    report.subscription_status = newSub.status;
    report.subscription_billing_cycle = newSub.billing_cycle;
    report.subscription_created = true;
    console.log(`[TENANT-3A] Created subscription ${newSub.id} (monthly, active)`);
  }

  console.log("\n--- TENANT-3A REPORT ---");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
