-- Fix for Performance Control (MPC) and Agent Logger
create table if not exists public.system_state (
  id text primary key,
  strategy text,
  flash_deal_message text,
  flash_deal_link text,
  flash_deal_type text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- Ensure agent_activity table exists and has correct columns
create table if not exists public.agent_activity (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  action_type text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Grant permissions if needed
grant all on public.system_state to postgres;
grant all on public.system_state to service_role;
grant all on public.agent_activity to postgres;
grant all on public.agent_activity to service_role;
