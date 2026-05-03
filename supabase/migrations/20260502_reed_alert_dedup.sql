-- ============================================================
-- REED ALERT DEDUP
-- Voorkomt dat Reed-tier abonnees meerdere keren een mail krijgen
-- voor dezelfde KNMI-uitgifte. Eén row per (user, warning_key).
-- Cascade delete bij user-verwijdering. Service-role only access.
-- ============================================================

CREATE TABLE IF NOT EXISTS reed_warning_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  warning_key TEXT NOT NULL,
  province_slug TEXT NOT NULL,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id TEXT,
  CONSTRAINT reed_warning_alerts_uniq UNIQUE (user_id, warning_key)
);

CREATE INDEX IF NOT EXISTS idx_reed_warning_alerts_user
  ON reed_warning_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_reed_warning_alerts_sent_at
  ON reed_warning_alerts (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_reed_warning_alerts_key
  ON reed_warning_alerts (warning_key);

-- Default-deny voor anon/auth: alleen service role mag schrijven (cron-route).
ALTER TABLE reed_warning_alerts ENABLE ROW LEVEL SECURITY;

-- Eigen alerts mag een ingelogde gebruiker eventueel teruglezen
-- (handig voor toekomstige "history"-view in /waarschuwingen).
DROP POLICY IF EXISTS "Users read own reed alerts" ON reed_warning_alerts;
CREATE POLICY "Users read own reed alerts"
  ON reed_warning_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE reed_warning_alerts IS
  'Dedup-log voor Reed-tier KNMI-waarschuwingsmails. warning_key = stabiele hash van province|type|severity|validFrom|issuedAt.';
