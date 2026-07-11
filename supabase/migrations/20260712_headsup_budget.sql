-- Persoonlijk heads-up-budget (spec agent-headsup §3C, vraag 3):
-- moments_only = alleen pushes die een persoonlijk moment raken;
-- standard = spelregel-budget (Piet 3/dag); low = hooguit 1/dag.
-- Draai dit in de Supabase SQL editor (production). Idempotent.
alter table public.user_profile
  add column if not exists headsup_budget text not null default 'standard'
  check (headsup_budget in ('moments_only', 'standard', 'low'));
