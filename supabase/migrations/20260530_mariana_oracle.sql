-- Mariana Oracle: 48-96u regime-engine-output (landelijk NL).
-- Idempotent. Geschreven/gelezen via service role.
--
-- Oracle is de interne middellange-termijn regime-engine onder Mariana: ze levert
-- een gestructureerd regime-signaal (dominant regime + drukpatroon + jet +
-- luchtmassa + scenario-tree) en een BINAIRE convective gate (OFF/ACTIVATE) die
-- bepaalt of Mariana Tesla laat draaien. Deze tabel bewaart elke run zodat
-- Mariana de laatste regimecontext + gate kan lezen.

create table if not exists public.mariana_oracle (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null,
  -- valid_from/until zijn naïeve lokale ISO-strings (Europe/Amsterdam) zoals
  -- Open-Meteo ze levert; bewust als text bewaard om de lokale tijd te behouden.
  valid_from text not null,
  valid_until text not null,
  trigger text not null,
  model text not null,
  -- Gedenormaliseerd voor snelle filtering/sortering:
  dominant_regime text not null default '',
  convective_gate text not null check (convective_gate in ('OFF','ACTIVATE')),
  run_tesla boolean not null default false,
  confidence jsonb not null default '{}'::jsonb,
  -- Het volledige OracleSignal-object (zie src/lib/mariana/oracle/types.ts):
  signal jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mariana_oracle_time
  on public.mariana_oracle(run_at desc);

create index if not exists idx_mariana_oracle_gate_time
  on public.mariana_oracle(convective_gate, run_at desc);
