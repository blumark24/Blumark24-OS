-- TENANT-3A — Create or confirm Blumark24 customer org (idempotent)
-- Run in Supabase SQL Editor (postgres role). Does NOT move operational data.
-- Safe to re-run.

DO $$
DECLARE
  v_internal_id uuid;
  v_customer_id uuid;
  v_plan_id uuid;
  v_owner_email text := 'blumark24@gmail.com';
  v_owner_needs_review boolean := true;
  v_mgr_email text;
  v_sub_id uuid;
BEGIN
  SELECT id INTO v_internal_id
  FROM public.organizations
  WHERE slug = 'blumark24-internal'
  LIMIT 1;

  IF v_internal_id IS NULL THEN
    RAISE EXCEPTION 'TENANT-3A: internal org blumark24-internal not found';
  END IF;

  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'advanced' LIMIT 1;
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'TENANT-3A: advanced plan not found';
  END IF;

  SELECT p.email INTO v_mgr_email
  FROM public.profiles p
  WHERE p.organization_id = v_internal_id
    AND p.role = 'organization_manager'
    AND p.is_active = true
    AND lower(p.email) NOT IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  ORDER BY p.created_at
  LIMIT 1;

  IF v_mgr_email IS NOT NULL AND trim(v_mgr_email) <> '' THEN
    v_owner_email := lower(trim(v_mgr_email));
    v_owner_needs_review := false;
  END IF;

  SELECT id INTO v_customer_id
  FROM public.organizations
  WHERE slug = 'blumark24-customer'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id
    FROM public.organizations
    WHERE is_internal = false
      AND deleted_at IS NULL
      AND lower(name) LIKE '%blumark%'
      AND slug IS DISTINCT FROM 'blumark24-internal'
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, is_internal, status, plan_id, owner_email)
    VALUES ('Blumark24', 'blumark24-customer', false, 'active', v_plan_id, v_owner_email)
    RETURNING id INTO v_customer_id;
    RAISE NOTICE 'TENANT-3A: created customer org %', v_customer_id;
  ELSE
    UPDATE public.organizations
    SET plan_id = COALESCE(plan_id, v_plan_id),
        status = 'active',
        is_internal = false
    WHERE id = v_customer_id;
    RAISE NOTICE 'TENANT-3A: customer org already exists %', v_customer_id;
  END IF;

  SELECT s.id INTO v_sub_id
  FROM public.subscriptions s
  WHERE s.organization_id = v_customer_id
    AND s.billing_cycle IS DISTINCT FROM 'internal'
  ORDER BY s.created_at
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    INSERT INTO public.subscriptions (organization_id, plan_id, status, billing_cycle)
    VALUES (v_customer_id, v_plan_id, 'active', 'monthly')
    RETURNING id INTO v_sub_id;
    RAISE NOTICE 'TENANT-3A: created subscription %', v_sub_id;
  ELSE
    RAISE NOTICE 'TENANT-3A: subscription already exists %', v_sub_id;
  END IF;

  RAISE NOTICE 'TENANT-3A internal_org_id=%', v_internal_id;
  RAISE NOTICE 'TENANT-3A customer_org_id=%', v_customer_id;
  RAISE NOTICE 'TENANT-3A owner_email=% (needs_review=%)', v_owner_email, v_owner_needs_review;
END $$;

-- Verification (read-only)
SELECT id, name, slug, is_internal, owner_email, plan_id, status
FROM public.organizations
WHERE slug IN ('blumark24-internal', 'blumark24-customer')
   OR (is_internal = false AND lower(name) LIKE '%blumark%')
ORDER BY is_internal DESC, slug;

SELECT s.id, s.organization_id, s.status, s.billing_cycle, o.slug
FROM public.subscriptions s
JOIN public.organizations o ON o.id = s.organization_id
WHERE o.slug = 'blumark24-customer'
ORDER BY s.created_at;
