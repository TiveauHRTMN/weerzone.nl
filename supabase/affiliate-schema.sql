-- affiliate_products table
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_tag TEXT NOT NULL, -- 'RAIN', 'HEAT', 'COLD', 'WIND', 'PERFECT', 'DEFAULT'
  product_name TEXT NOT NULL,
  affiliate_link TEXT NOT NULL,
  image_url TEXT,
  base_price TEXT,
  priority INTEGER DEFAULT 0, -- higher = shown first
  platform TEXT DEFAULT 'AMAZON', -- 'AMAZON', 'BOOKING', 'THUISBEZORGD', 'CUSTOM'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'IMPRESSION', 'CLICK'
  product_id UUID REFERENCES affiliate_products(id),
  condition_tag TEXT,
  weather_context JSONB, -- {temp, rain, wind, code, city}
  platform TEXT DEFAULT 'SITE', -- 'SITE', 'MAIL'
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- pivot_rules table
CREATE TABLE IF NOT EXISTS pivot_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condition TEXT NOT NULL, -- 'RAIN', 'HEAT', etc.
  threshold_min DOUBLE PRECISION,
  threshold_max DOUBLE PRECISION,
  metric TEXT NOT NULL, -- 'temp', 'rain_mm', 'wind_kmh'
  target_platform TEXT NOT NULL, -- 'AMAZON', 'BOOKING', 'THUISBEZORGD'
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pivot_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read affiliate_products" ON affiliate_products FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert analytics_events" ON analytics_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read pivot_rules" ON pivot_rules FOR SELECT TO anon USING (true);
