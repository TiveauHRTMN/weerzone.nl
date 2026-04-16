-- ============================================================
-- B2B subscriptions — betaalde abonnementen via Mollie
-- ============================================================

CREATE TABLE IF NOT EXISTS b2b_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  industry TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'starter',            -- starter | pro | enterprise
  amount_cents INTEGER NOT NULL,          -- 1900 = €19,00
  interval TEXT DEFAULT '1 month',

  mollie_customer_id TEXT,
  mollie_payment_id TEXT,                 -- first payment (mandate setup)
  mollie_mandate_id TEXT,
  mollie_subscription_id TEXT,

  status TEXT DEFAULT 'pending',          -- pending | active | cancelled | expired | failed
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_subs_email ON b2b_subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_b2b_subs_status ON b2b_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_b2b_subs_customer ON b2b_subscriptions (mollie_customer_id);

ALTER TABLE b2b_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert b2b_subs" ON b2b_subscriptions;
DROP POLICY IF EXISTS "Service read b2b_subs" ON b2b_subscriptions;
DROP POLICY IF EXISTS "Service update b2b_subs" ON b2b_subscriptions;

CREATE POLICY "Public insert b2b_subs" ON b2b_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Service read b2b_subs" ON b2b_subscriptions FOR SELECT TO anon USING (true);
CREATE POLICY "Service update b2b_subs" ON b2b_subscriptions FOR UPDATE TO anon USING (true);
