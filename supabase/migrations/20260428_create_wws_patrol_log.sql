-- Tabel voor Hermes Truth Patrol logs
CREATE TABLE IF NOT EXISTS public.wws_patrol_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT DEFAULT 'Hermes',
    action TEXT NOT NULL, -- bijv. 'consensus_check', 'alert_fired'
    status TEXT NOT NULL, -- 'success', 'error'
    meta JSONB DEFAULT '{}'::jsonb, -- bevat bijv. { "place": "Amsterdam", "consensus": 95 }
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index voor snelle cockpit-weergave
CREATE INDEX IF NOT EXISTS idx_wws_patrol_log_created_at ON public.wws_patrol_log(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.wws_patrol_log ENABLE ROW LEVEL SECURITY;

-- Alleen Founders/Admin mogen dit zien
CREATE POLICY "Founders can view patrol logs" 
ON public.wws_patrol_log FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' IN ('rwnhrtmn@gmail.com', 'iamrowanonl@gmail.com', 'info@weerzone.nl'));

-- Ook INSERT toestaan voor Founders (zodat we vanuit de app acties kunnen loggen)
CREATE POLICY "Founders can insert patrol logs" 
ON public.wws_patrol_log FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt() ->> 'email' IN ('rwnhrtmn@gmail.com', 'iamrowanonl@gmail.com', 'info@weerzone.nl'));
