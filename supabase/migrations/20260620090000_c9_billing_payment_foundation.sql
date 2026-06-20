-- C9 billing, payment, and subscription foundation.
-- Provider-neutral tables only; no live gateway, webhooks, secrets, or card data.

DO $$ BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION 'C9 billing foundation requires public.current_org_id()';
  END IF;
  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION 'C9 billing foundation requires public.is_owner()';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  provider text,
  provider_transaction_id text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'canceled', 'refunded')),
  payment_method text,
  checkout_url text,
  paid_at timestamptz,
  failed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'recorded',
  source text NOT NULL DEFAULT 'system',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions: owner select" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions: tenant select own org" ON public.payment_transactions;
DROP POLICY IF EXISTS "billing_events: owner select" ON public.billing_events;
DROP POLICY IF EXISTS "billing_events: tenant select own org" ON public.billing_events;

CREATE POLICY "payment_transactions: owner select"
  ON public.payment_transactions FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "payment_transactions: tenant select own org"
  ON public.payment_transactions FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "billing_events: owner select"
  ON public.billing_events FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "billing_events: tenant select own org"
  ON public.billing_events FOR SELECT
  USING (organization_id = public.current_org_id());

DROP TRIGGER IF EXISTS set_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER set_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS payment_transactions_org_created_idx
  ON public.payment_transactions (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_subscription_created_idx
  ON public.payment_transactions (subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_invoice_created_idx
  ON public.payment_transactions (invoice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_status_created_idx
  ON public.payment_transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_provider_transaction_idx
  ON public.payment_transactions (provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_events_org_created_idx
  ON public.billing_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_events_subscription_created_idx
  ON public.billing_events (subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_events_invoice_created_idx
  ON public.billing_events (invoice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_events_status_created_idx
  ON public.billing_events (status, created_at DESC);
