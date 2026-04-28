
-- ============================================================
-- Weerzone Weather System (WWS) — Hermes Agent Memory
-- ============================================================

-- Tabel voor de meteorologische waarheid per coördinaat
CREATE TABLE IF NOT EXISTS wws_truth_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_name TEXT NOT NULL,
  lat NUMERIC(8,5) NOT NULL,
  lon NUMERIC(8,5) NOT NULL,
  sector TEXT NOT NULL, -- 'public' (Piet/Reed) of 'business' (Steve)
  payload JSONB NOT NULL,
  consensus_index INTEGER,
  divergence_delta NUMERIC(4,2),
  is_alert BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ
);

-- Index voor snelle GPS lookups
CREATE INDEX IF NOT EXISTS idx_wws_truth_gps ON wws_truth_cache (lat, lon);
CREATE INDEX IF NOT EXISTS idx_wws_truth_place ON wws_truth_cache (place_name);

-- RLS
ALTER TABLE wws_truth_cache ENABLE ROW LEVEL SECURITY;

-- Publieke leesrechten voor de cache (zodat site instant is)
CREATE POLICY "Public read wws_truth_cache" ON wws_truth_cache FOR SELECT TO anon USING (true);
